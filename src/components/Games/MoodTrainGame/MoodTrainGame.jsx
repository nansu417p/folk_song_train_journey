import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, FaceLandmarker, ImageSegmenter } from '@mediapipe/tasks-vision';
import { TicketCard } from '../../Shared/TicketCard';
import { CARRIAGE_NAMES, CARRIAGE_SUBTITLES } from '../../../data/gameModes'; 

const BACKGROUND_IMAGE_SRC = '/images/MoodTrainGame.jpg';

const MoodTrainGame = ({ onMoodDetected, onTicketGenerated }) => {
  // ...(模型宣告與 useEffect 邏輯保持完全一樣，省略以節省篇幅)...
  // （請直接保留您原本的 webcamRef 到 getConductorMessage 等邏輯，無需更動）
  // 為了提供完整代碼我放了全部，但核心修改在最下方 return

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const tempCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const blurredMaskCanvasRef = useRef(null);
  const bgImageCanvasRef = useRef(null);
  
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [imageSegmenter, setImageSegmenter] = useState(null);
  const [bgImageObj, setBgImageObj] = useState(null);
  
  const [step, setStep] = useState('intro');
  const [moodResult, setMoodResult] = useState(null); 
  const [captureImg, setCaptureImg] = useState(null); 
  const [flash, setFlash] = useState(false); 
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    tempCanvasRef.current = document.createElement('canvas');
    maskCanvasRef.current = document.createElement('canvas');
    blurredMaskCanvasRef.current = document.createElement('canvas');
    bgImageCanvasRef.current = document.createElement('canvas');
  }, []);

  useEffect(() => {
    const initModels = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.2/wasm");
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, delegate: "GPU" },
          runningMode: "VIDEO", numFaces: 1, outputFaceBlendshapes: true 
        });
        setFaceLandmarker(landmarker);

        const segmenter = await ImageSegmenter.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite", delegate: "GPU" },
          runningMode: "VIDEO", outputCategoryMask: true, outputConfidenceMasks: false
        });
        setImageSegmenter(segmenter);
      } catch (error) { console.error("模型初始化失敗:", error); }
    };
    initModels();
    return () => { if (faceLandmarker) faceLandmarker.close(); if (imageSegmenter) imageSegmenter.close(); };
  }, []);

  useEffect(() => {
    const img = new Image(); img.crossOrigin = "anonymous"; img.src = BACKGROUND_IMAGE_SRC; img.onload = () => setBgImageObj(img);
  }, []);

  useEffect(() => {
    let animationFrameId;
    const renderLoop = () => {
      if (!isCameraActive || !webcamRef.current || !webcamRef.current.video || webcamRef.current.video.readyState !== 4 || !canvasRef.current || step === 'result') {
        animationFrameId = requestAnimationFrame(renderLoop); return;
      }

      if (!cameraReady) setCameraReady(true);
      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const width = video.videoWidth; const height = video.videoHeight;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width; canvas.height = height;
        tempCanvasRef.current.width = width; tempCanvasRef.current.height = height;
        maskCanvasRef.current.width = width; maskCanvasRef.current.height = height;
        blurredMaskCanvasRef.current.width = width; blurredMaskCanvasRef.current.height = height;
        bgImageCanvasRef.current.width = width; bgImageCanvasRef.current.height = height;
      }

      const startTimeMs = performance.now();
      if (!imageSegmenter || !bgImageObj) {
         ctx.save(); ctx.scale(-1, 1); ctx.translate(-width, 0); ctx.drawImage(video, 0, 0, width, height); ctx.restore();
         animationFrameId = requestAnimationFrame(renderLoop); return;
      }

      imageSegmenter.segmentForVideo(video, startTimeMs, (result) => {
        const mask = result.categoryMask;
        if (mask) {
          const bgCtx = bgImageCanvasRef.current.getContext('2d'); bgCtx.drawImage(bgImageObj, 0, 0, width, height);
          const maskPixels = mask.getAsUint8Array();
          const maskCtx = maskCanvasRef.current.getContext('2d', { willReadFrequently: true });
          const maskImgData = new ImageData(width, height);
          
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const maskIndex = y * width + (width - 1 - x);
              const pixelIndex = (y * width + x) * 4;
              const isPerson = maskPixels[maskIndex] === 0;
              maskImgData.data[pixelIndex] = 255; maskImgData.data[pixelIndex + 1] = 255; maskImgData.data[pixelIndex + 2] = 255; maskImgData.data[pixelIndex + 3] = isPerson ? 255 : 0; 
            }
          }
          maskCtx.putImageData(maskImgData, 0, 0);
          const blurredCtx = blurredMaskCanvasRef.current.getContext('2d');
          blurredCtx.clearRect(0, 0, width, height); blurredCtx.filter = 'blur(5px)'; blurredCtx.drawImage(maskCanvasRef.current, 0, 0); blurredCtx.filter = 'none';
          
          const tempCtx = tempCanvasRef.current.getContext('2d');
          tempCtx.clearRect(0, 0, width, height); tempCtx.save(); tempCtx.scale(-1, 1); tempCtx.translate(-width, 0); tempCtx.drawImage(video, 0, 0, width, height); tempCtx.restore();
          tempCtx.globalCompositeOperation = 'destination-in'; tempCtx.drawImage(blurredMaskCanvasRef.current, 0, 0); tempCtx.globalCompositeOperation = 'source-over'; 
          
          ctx.drawImage(bgImageCanvasRef.current, 0, 0, width, height); ctx.drawImage(tempCanvasRef.current, 0, 0, width, height);
        }
      });
      animationFrameId = requestAnimationFrame(renderLoop);
    };
    if (isCameraActive) renderLoop();
    return () => { if (animationFrameId) cancelAnimationFrame(animationFrameId); };
  }, [isCameraActive, imageSegmenter, bgImageObj, step, cameraReady]);

  const startScan = () => {
    if (!faceLandmarker || !webcamRef.current?.video) { alert("相機準備中，請稍候..."); return; }
    setStep('scanning');
    let scanCount = 0; let smileScore = 0; let sadScore = 0;
    const interval = setInterval(() => {
       const video = webcamRef.current.video;
       if(video && video.readyState === 4 && faceLandmarker) {
           const startTimeMs = performance.now();
           const result = faceLandmarker.detectForVideo(video, startTimeMs);
           if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
               const shapes = result.faceBlendshapes[0].categories;
               smileScore += Math.max(shapes.find(s => s.categoryName === 'mouthSmileLeft')?.score || 0, shapes.find(s => s.categoryName === 'mouthSmileRight')?.score || 0);
               const currentSad = (Math.max(shapes.find(s => s.categoryName === 'mouthFrownLeft')?.score || 0, shapes.find(s => s.categoryName === 'mouthFrownRight')?.score || 0) * 1.5) + Math.max(shapes.find(s => s.categoryName === 'browDownLeft')?.score || 0, shapes.find(s => s.categoryName === 'browDownRight')?.score || 0);
               sadScore += currentSad; scanCount++;
           }
       }
    }, 100);
    setTimeout(() => {
        clearInterval(interval); setFlash(true); setTimeout(() => setFlash(false), 300);
        const avgSmile = scanCount > 0 ? smileScore / scanCount : 0; const avgSad = scanCount > 0 ? sadScore / scanCount : 0;
        let finalMood = 'neutral'; if (avgSmile > 0.25) finalMood = 'happy'; else if (avgSad > 0.15) finalMood = 'sad';
        let imageSrc = null;
        if (canvasRef.current) imageSrc = canvasRef.current.toDataURL('image/jpeg', 0.85); else if (webcamRef.current) imageSrc = webcamRef.current.getScreenshot();
        setCaptureImg(imageSrc); setMoodResult(finalMood); setStep('result'); onMoodDetected(finalMood);
    }, 3000);
  };

  const getConductorMessage = () => {
    if(step === 'intro') return "各位旅客您好，請您看向前方的鏡頭，讓我看看您今日的心情天氣，好為您印製一張專屬的乘車券。";
    if(step === 'scanning') return "請保持目前的表情，我們正在為您捕捉最真實的瞬間...";
    switch(moodResult) {
      case 'happy': return "看您笑得這麼開心，今天心裡一定是個大晴天吧！這趟旅程，溫暖的陽光會一路陪著您。";
      case 'sad': return "眉頭怎麼稍微鎖上了呢？沒關係的，窗外正落起了溫柔的微雨。就讓雨水洗去疲憊，我們聽首溫柔的歌再出發。";
      default: return "旅途的風景總是平穩而悠長，今日的天氣也清爽宜人。請您靠在窗邊，悠閒地享受這段民歌時光。";
    }
  };
  
  const handleReScan = () => { setStep('intro'); setCaptureImg(null); setMoodResult(null); onMoodDetected('neutral'); };

  return (
    <div className="relative w-full h-full bg-transparent flex flex-col items-center p-6 md:p-8 overflow-hidden font-sans">
      <div className={`absolute inset-0 bg-white z-[100] pointer-events-none transition-opacity duration-300 ${flash ? 'opacity-100' : 'opacity-0'}`}></div>

      <div className="text-center mb-6 mt-2 shrink-0 relative z-10 pointer-events-none">
        <h2 className="text-4xl font-bold text-[#FDFBF7] tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] inline-block font-serif">
          {CARRIAGE_NAMES.MOOD_TRAIN}
        </h2>
        {CARRIAGE_SUBTITLES.MOOD_TRAIN && (
           <p className="text-gray-200 mt-4 tracking-wider text-xl drop-shadow-md font-bold">
             {CARRIAGE_SUBTITLES.MOOD_TRAIN}
           </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-7xl items-center justify-center h-[65vh]">
        
        {/* ★ 左側：寬度縮小到 35% */}
        <div className="flex flex-col gap-6 w-full md:w-[35%] h-full justify-center">
          <div className="bg-[#EAEAEA] p-6 rounded-xl shadow-[8px_8px_0_rgba(0,0,0,0.6)] border-[4px] border-gray-800 flex flex-col items-center relative overflow-hidden h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 tracking-widest border-b-[3px] border-gray-800 pb-2 w-full text-center font-serif">剪票口相機</h2>
            
            <div className="w-full aspect-square md:aspect-[4/3] bg-gray-900 rounded-sm overflow-hidden relative border-[4px] border-gray-800 shadow-inner flex items-center justify-center">
              {isCameraActive && ( <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="absolute opacity-0 w-[1px] h-[1px] pointer-events-none" mirrored={false} videoConstraints={{ width: 640, height: 480, facingMode: "user" }} /> )}
              <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500 ${step === 'result' ? 'opacity-30 blur-sm' : 'opacity-100'} ${cameraReady ? 'bg-transparent' : 'bg-gray-900'}`} />
              {!cameraReady && isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900 gap-3">
                  <div className="w-8 h-8 border-4 border-gray-400 border-t-white rounded-full animate-spin"></div>
                  <span className="text-gray-400 font-bold tracking-widest text-sm">相機啟動中...</span>
                </div>
              )}
              {!isCameraActive && <span className="text-gray-500 font-bold tracking-widest bg-gray-900 inset-0 absolute flex items-center justify-center z-20">相機已關閉</span>}
              {step === 'scanning' && cameraReady && <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"><div className="w-[60%] h-[70%] border-[4px] border-yellow-400 border-dashed rounded animate-pulse shadow-[0_0_15px_#facc15]"></div></div>}
              {step === 'result' && <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"><p className="bg-[#FDFBF7] px-6 py-2 border-[3px] border-gray-800 rounded font-bold text-gray-800 tracking-widest shadow-[4px_4px_0_#4b5563]">📸 拍攝完成</p></div>}
            </div>

            <div className="w-full text-center mt-4 mb-2">
               <span className="bg-[#FDFBF7] text-gray-800 border-[3px] border-gray-800 px-6 py-2 rounded shadow-[4px_4px_0_#4b5563] font-bold tracking-widest text-sm inline-block">
                 {step === 'result' ? '照片已洗出' : '請看著相機保持不動'}
               </span>
            </div>

            <div className="mt-auto w-full relative z-10">
              {step === 'intro' && <button onClick={startScan} disabled={!cameraReady} className="w-full py-4 bg-gray-800 text-[#FDFBF7] font-bold rounded border-[3px] border-black shadow-[4px_4px_0_#4b5563] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#4b5563] active:translate-y-[4px] active:shadow-none transition-all tracking-widest text-lg disabled:bg-gray-400 disabled:border-gray-500 disabled:shadow-none disabled:cursor-not-allowed">按下快門並製票</button>}
              {step === 'scanning' && <div className="w-full py-4 text-center text-gray-600 font-bold animate-pulse tracking-widest bg-[#FDFBF7] rounded border-[3px] border-gray-800 shadow-inner">正在沖洗相片中...</div>}
              {step === 'result' && (
                <div className="flex gap-4 w-full">
                  <button onClick={handleReScan} className="flex-1 py-4 bg-[#FDFBF7] text-gray-800 font-bold rounded border-[3px] border-gray-800 shadow-[4px_4px_0_#4b5563] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#4b5563] transition-all tracking-widest">重新拍攝</button>
                  <button onClick={() => { setIsCameraActive(false); onTicketGenerated(captureImg, moodResult); }} className="flex-1 py-4 bg-red-600 text-[#FDFBF7] font-bold rounded border-[3px] border-red-900 shadow-[4px_4px_0_#7f1d1d] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#7f1d1d] transition-all tracking-widest">領取車票</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ★ 右側：寬度放大到 65% 並增加左間距 md:pl-12 */}
        <div className="w-full md:w-[65%] md:pl-12 flex flex-col items-center justify-center gap-6 h-full relative">
            <div className="w-full bg-[#FDFBF7] p-6 rounded shadow-[6px_6px_0_rgba(0,0,0,0.6)] border-[4px] border-gray-800 relative z-20">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-[#FDFBF7] text-sm font-bold shadow-md border-[3px] border-[#FDFBF7] tracking-widest">廣播</div>
              <h3 className="font-bold text-gray-800 mb-2 tracking-widest text-lg font-serif">車長廣播：</h3>
              <p className="text-gray-700 leading-relaxed font-bold tracking-wide bg-gray-100 p-3 rounded-sm border border-gray-300 shadow-inner min-h-[60px]">
                {getConductorMessage()}
              </p>
            </div>

            <div className={`transition-all duration-700 origin-center w-full flex justify-center
                ${step === 'result' ? 'opacity-100 scale-100' : 'opacity-40 scale-95 blur-[2px] pointer-events-none'}
            `}>
              <div className="drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
                <TicketCard captureImg={captureImg} moodResult={moodResult} size="large" />
              </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default MoodTrainGame;