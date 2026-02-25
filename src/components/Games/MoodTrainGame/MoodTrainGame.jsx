import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

const MoodTrainGame = ({ onBack, onMoodDetected, onTicketGenerated }) => {
  const webcamRef = useRef(null);
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  
  const [step, setStep] = useState('intro');
  const [moodResult, setMoodResult] = useState(null); 
  const [captureImg, setCaptureImg] = useState(null); 
  const [flash, setFlash] = useState(false); // ★ 新增：快門閃光狀態
  
  useEffect(() => {
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm"
      );
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true 
      });
      setFaceLandmarker(landmarker);
    };
    init();
  }, []);

  const startScan = () => {
    if (!faceLandmarker || !webcamRef.current?.video) {
        alert("驗票閘門系統啟動中，請稍候...");
        return;
    }
    
    setStep('scanning');

    let scanCount = 0;
    let smileScore = 0;
    let sadScore = 0;
    
    const interval = setInterval(() => {
       const video = webcamRef.current.video;
       if(video.readyState === 4) {
           const startTimeMs = performance.now();
           const result = faceLandmarker.detectForVideo(video, startTimeMs);
           
           if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
               const shapes = result.faceBlendshapes[0].categories;
               
               const smileL = shapes.find(s => s.categoryName === 'mouthSmileLeft')?.score || 0;
               const smileR = shapes.find(s => s.categoryName === 'mouthSmileRight')?.score || 0;
               smileScore += Math.max(smileL, smileR);

               const frownL = shapes.find(s => s.categoryName === 'mouthFrownLeft')?.score || 0;
               const frownR = shapes.find(s => s.categoryName === 'mouthFrownRight')?.score || 0;
               const browDownL = shapes.find(s => s.categoryName === 'browDownLeft')?.score || 0;
               const browDownR = shapes.find(s => s.categoryName === 'browDownRight')?.score || 0;
               
               // ★ 將下垂與皺眉的值相加，極度放大陰雨天的敏感度
               const currentSad = Math.max(frownL, frownR) + Math.max(browDownL, browDownR);
               sadScore += currentSad;
               
               scanCount++;
           }
       }
    }, 100);

    setTimeout(() => {
        clearInterval(interval);
        
        // ★ 觸發相機快門閃光
        setFlash(true);
        setTimeout(() => setFlash(false), 300);

        const avgSmile = scanCount > 0 ? smileScore / scanCount : 0;
        const avgSad = scanCount > 0 ? sadScore / scanCount : 0;
        
        let finalMood = 'neutral';
        
        if (avgSmile > 0.25) {
            finalMood = 'happy'; 
        } else if (avgSad > 0.02) {  // 門檻降至 0.02，稍微皺眉就會觸發
            finalMood = 'sad';
        }

        const imageSrc = webcamRef.current.getScreenshot();
        
        setCaptureImg(imageSrc);
        setMoodResult(finalMood);
        setStep('result');
        
        onMoodDetected(finalMood);
    }, 3000);
  };

  const getConductorMessage = () => {
    switch(moodResult) {
      case 'happy': return "看您面帶微笑，心情想必十分愉悅！為您切換至【晴朗】模式，這趟旅程將為您披上暖陽，願您有個美好的一天。";
      case 'sad': return "看您眉頭微鎖，似乎有些心事。為您切換至【微雨】模式，讓窗外的雨水洗滌疲憊，聽首溫柔的歌吧。";
      default: return "旅途的風景總是平靜而悠長。為您切換至【平靜】模式，請慢慢享受這趟民歌之旅。";
    }
  };
  
  const handleReScan = () => {
    setStep('intro');
    onMoodDetected('neutral'); 
  };

  return (
    <div className="relative w-full h-full bg-transparent flex items-center justify-center p-8">
      
      {/* 白光閃爍層 (只在拍照瞬間出現) */}
      <div className={`absolute inset-0 bg-white z-[60] pointer-events-none transition-opacity duration-300 ${flash ? 'opacity-100' : 'opacity-0'}`}></div>

      <button 
        onClick={onBack} 
        className="absolute top-6 left-6 z-50 px-5 py-2.5 bg-[#F5F5F5] text-gray-800 font-bold rounded-lg shadow border border-gray-300 hover:bg-gray-200 hover:-translate-y-1 transition-all duration-300 tracking-wide"
      >
        ← 返回火車
      </button>

      <div className="flex flex-col md:flex-row gap-12 w-full max-w-5xl items-stretch justify-center">
        
        {/* 左側相機區 */}
        <div className="flex flex-col gap-6 w-full md:w-1/2 justify-center">
          
          <div className="bg-[#F5F5F5] p-4 rounded-lg shadow-xl border border-gray-300 flex flex-col items-center relative overflow-hidden">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 tracking-widest border-b-2 border-red-500 pb-2">剪票口相機</h2>
            
            <div className="w-full aspect-video bg-gray-200 rounded overflow-hidden relative border-4 border-gray-300">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className={`w-full h-full object-cover ${step === 'result' ? 'opacity-0' : 'opacity-100'}`}
                mirrored={true}
              />
              
              {step === 'scanning' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-64 border-4 border-yellow-400 border-dashed rounded animate-pulse"></div>
                </div>
              )}
              
              {step === 'result' && captureImg && (
                <img src={captureImg} className="absolute inset-0 w-full h-full object-cover" alt="captured" />
              )}
            </div>

            {step === 'intro' && (
              <button onClick={startScan} className="mt-6 px-8 py-3 bg-red-600 text-white font-bold rounded-lg shadow-md hover:bg-red-500 hover:-translate-y-1 transition-all tracking-widest">
                📷 讀取心情並製票
              </button>
            )}

            {step === 'scanning' && (
              <p className="mt-6 text-gray-600 font-bold animate-pulse tracking-widest">正在分析面部特徵...</p>
            )}

            {step === 'result' && (
              <p className="mt-6 text-gray-800 font-bold tracking-widest">照片擷取成功！請領取車票。</p>
            )}
          </div>

          <div className="bg-[#FDFBF7] p-6 rounded-lg shadow-md border-l-4 border-gray-800 relative">
            <div className="absolute -top-4 -left-4 w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white text-xl shadow-md">👨‍✈️</div>
            <h3 className="font-bold text-gray-800 mb-2 tracking-widest">車長廣播：</h3>
            <p className="text-gray-600 leading-relaxed font-bold">
              {step === 'intro' && "各位旅客您好，請看向相機，為您印製帶有今日天氣的專屬乘車券。"}
              {step === 'scanning' && "資料讀取中，請保持自然..."}
              {step === 'result' && getConductorMessage()}
            </p>
          </div>

        </div>

        {/* 右側車票區：固定佈局，避免版面跳動 */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center relative">
            
            {/* 車票實體 (透過 opacity 和 filter 呈現未啟動狀態) */}
            <div className={`bg-[#EAEAEA] w-[300px] rounded-sm shadow-2xl flex flex-col relative overflow-hidden border border-gray-400 p-2 transition-all duration-700
                ${step === 'result' ? 'opacity-100 scale-100' : 'opacity-40 scale-95 blur-[1px]'}
            `}>
              <div className="absolute -left-3 top-20 w-6 h-6 bg-transparent rounded-full border-r border-gray-400 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]"></div>
              <div className="absolute -right-3 top-20 w-6 h-6 bg-transparent rounded-full border-l border-gray-400 shadow-[inset_2px_0_4px_rgba(0,0,0,0.1)]"></div>
              
              <div className="border-[3px] border-gray-800 p-4 h-full flex flex-col relative bg-[#FDFBF7]">
                <div className="text-center border-b-2 border-dashed border-gray-500 pb-3 mb-3">
                  <h1 className="text-2xl font-bold text-gray-800 tracking-[0.3em]">臺灣民歌鐵路</h1>
                  <p className="text-xs text-gray-500 mt-1 font-mono">TAIWAN FOLK RAILWAY</p>
                </div>
                
                <div className="flex justify-between items-center text-gray-800 font-bold text-xl mb-4">
                  <span>現 在</span>
                  <span className="text-sm">➡</span>
                  <span>回 憶</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600 mb-4 font-mono">
                  <span>車次: 1970</span>
                  <span>座位: 自由座</span>
                </div>

                <div className="flex items-end gap-3 mt-auto">
                  <div className="w-20 h-24 border-2 border-gray-400 p-1 bg-gray-200 rotate-[-3deg] flex items-center justify-center">
                     {step === 'result' && captureImg ? (
                        <img src={captureImg} alt="passenger" className="w-full h-full object-cover" />
                     ) : (
                        <span className="text-gray-400 text-3xl">👤</span>
                     )}
                  </div>
                  <div className="flex flex-col pb-1">
                    <span className="text-[10px] text-gray-500 tracking-widest font-bold">心情天氣</span>
                    <span className="text-3xl font-bold text-gray-800 tracking-widest">
                      {step === 'result' ? (
                          moodResult === 'happy' ? <span className="text-red-600">晴 朗</span> :
                          moodResult === 'sad' ? <span className="text-blue-600">微 雨</span> : 
                          "平 靜"
                      ) : "待 讀"}
                    </span>
                  </div>
                </div>

                <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-mono font-bold">No. 8830192</div>
              </div>
            </div>
            
            {/* 右下角按鈕區 */}
            {step === 'result' && (
              <div className="mt-8 flex gap-4 w-full justify-center animate-fade-in-up">
                <button 
                  onClick={handleReScan} 
                  className="px-6 py-3 bg-[#F5F5F5] text-gray-800 font-bold rounded-lg shadow hover:bg-gray-200 hover:-translate-y-1 transition-all duration-300 tracking-wide border border-gray-300"
                >
                  🔄 重拍
                </button>
                <button 
                  onClick={() => onTicketGenerated(captureImg, moodResult)} 
                  className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow hover:bg-red-500 hover:-translate-y-1 transition-all duration-300 tracking-wide"
                >
                  🎫 領取車票
                </button>
              </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default MoodTrainGame;