import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';

const FaceSwapGame = ({ song, onHome, faceswapStatus, generatedSwappedImg, onStartGenerate, onSetMockSwap, onSwapGenerated }) => {
  const webcamRef = useRef(null);
  
  const [base64Template, setBase64Template] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // 初始化時讀取這首歌的封面
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await fetch(`/images/${song.audioFileName.replace('.mp3', '.jpg')}`);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setBase64Template(reader.result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("無法讀取封面:", err);
      }
    };
    if (song && song.hasFace && faceswapStatus === 'idle') {
      loadTemplate();
    }
  }, [song, faceswapStatus]);

  const handleCaptureAndSwap = async () => {
    if (!webcamRef.current || !base64Template) return;
    
    // 拍下照片
    const imageSrc = webcamRef.current.getScreenshot({width: 1024, height: 720}); 
    if (imageSrc) {
      const sourceB64 = imageSrc.split(',')[1];
      const count = song.faceCount || 1;
      
      const payload = { 
        source_image: sourceB64, 
        target_image: base64Template, 
        source_faces_index: Array(count).fill(0), 
        face_index: Array.from({length: count}, (_, i) => i), 
        upscaler: "None", 
        scale: 1, 
        codeformer_fidelity: 0.5, 
        restore_face: true, 
        gender_source: 0, 
        gender_target: 0 
      };
      
      onStartGenerate(payload);
    }
  };

  // ★ 移除 html2canvas，直接將 API 生產的圖片存入大廳，保證清晰不歪斜
  const handleClaim = () => {
    if (onSwapGenerated && generatedSwappedImg) {
      setIsClaiming(true);
      onSwapGenerated(generatedSwappedImg);
    }
  };

  return (
    <div className="relative w-full h-full bg-transparent flex flex-col items-center justify-center p-8 overflow-hidden">
      
      <button onClick={onHome} className="absolute top-6 left-6 z-50 px-5 py-2.5 bg-[#F5F5F5] text-gray-800 font-bold rounded-lg shadow border border-gray-300 hover:bg-gray-200 transition-all tracking-wide">
        ← 返回火車
      </button>

      <div className="text-center mb-8 mt-2">
        <h2 className="text-4xl font-bold text-gray-800 tracking-widest drop-shadow-sm">一日歌手</h2>
        <p className="text-gray-600 mt-2 tracking-wider">化身經典封面主角，重溫那年的青春</p>
      </div>

      {/* ★ 全新左右對稱排版 (1024x720 比例) */}
      <div className="flex w-full max-w-[80vw] h-[65vh] gap-8 items-center justify-center">
        
        {/* 左側：永遠顯示原版封面 */}
        <div className="w-1/2 flex flex-col items-center bg-[#FDFBF7] rounded-lg shadow-lg border border-gray-300 p-6 h-full">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2 w-full text-center tracking-widest">
            經典原版封面
          </h3>
          <div className="w-full relative shadow-md border-4 border-white bg-gray-200 flex-1 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '1024/720' }}>
            <img src={`/images/${song.audioFileName.replace('.mp3', '.jpg')}`} alt="Original Cover" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* 右側：互動區域 (相機 / 等待 / 結果) */}
        <div className="w-1/2 flex flex-col items-center bg-[#F5F5F5] rounded-lg shadow-lg border border-gray-300 p-6 h-full">
          
          {faceswapStatus === 'generating' ? (
             <div className="w-full h-full flex flex-col items-center justify-center text-center animate-pulse gap-6">
                <div className="w-16 h-16 border-8 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                <h3 className="text-2xl font-bold text-gray-800 tracking-widest">暗房融合中...</h3>
                <p className="text-gray-600 leading-relaxed font-bold">正在處理您的五官，約需 5 ~ 10 秒。<br/>您可以先回火車大廳等待，好了會提醒您！</p>
                <button onClick={onHome} className="w-[80%] py-4 mt-4 bg-gray-800 text-white font-bold rounded-lg shadow hover:bg-gray-700 transition-all tracking-widest border border-gray-600">
                    🚂 返回火車等待
                </button>
             </div>
          ) : faceswapStatus === 'done' && generatedSwappedImg ? (
             <div className="w-full h-full flex flex-col items-center animate-fade-in-up">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2 w-full text-center tracking-widest">
                  您的專屬寫真
                </h3>
                <div className="w-full relative shadow-xl border-4 border-white bg-gray-200 flex-1 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '1024/720' }}>
                  <img src={generatedSwappedImg} alt="Swapped" className="w-full h-full object-cover" />
                </div>
                <div className="mt-6 w-full flex justify-center">
                  <button onClick={handleClaim} disabled={isClaiming} className="w-[80%] py-4 bg-red-600 text-white rounded-lg font-bold shadow-lg hover:bg-red-500 transition-all tracking-widest text-lg border-2 border-red-400 disabled:opacity-50">
                    {isClaiming ? "⏳ 封裝中..." : "🎫 領取專屬寫真"}
                  </button>
                </div>
             </div>
          ) : (
             <div className="w-full h-full flex flex-col items-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2 w-full text-center tracking-widest">
                  準備拍攝
                </h3>
                {/* 相機預覽區 (1024x720 比例) */}
                <div className="w-full relative shadow-inner border-[6px] border-gray-300 bg-gray-200 flex-1 flex items-center justify-center overflow-hidden rounded-sm" style={{ aspectRatio: '1024/720' }}>
                  <Webcam 
                    ref={webcamRef} 
                    screenshotFormat="image/jpeg" 
                    width={1024} 
                    height={720} 
                    videoConstraints={{ aspectRatio: 1024 / 720 }}
                    className="w-full h-full object-cover" 
                    mirrored={true} 
                    onUserMedia={() => setIsCameraReady(true)}
                  />
                  {/* 臉部對準框 (改為適合寬螢幕的比例) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[35%] h-[60%] border-4 border-white/70 border-dashed rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                  </div>
                  {!isCameraReady && (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 font-bold tracking-widest">
                      啟動相機中...
                    </div>
                  )}
                </div>
                
                <p className="text-gray-500 text-xs font-bold tracking-widest mt-4 mb-3">請將臉部對準虛線框內</p>
                
                <div className="flex w-full gap-3 mt-auto">
                  <button 
                    onClick={handleCaptureAndSwap} 
                    disabled={!isCameraReady || !base64Template} 
                    className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-bold shadow hover:bg-gray-700 transition-all tracking-widest text-lg disabled:opacity-50"
                  >
                    📸 拍下照片並融合
                  </button>
                  <button 
                    onClick={() => onSetMockSwap(`/images/${song.audioFileName.replace('.mp3', '.jpg')}`)}
                    className="px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-all text-sm tracking-widest"
                  >
                    測試
                  </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceSwapGame;