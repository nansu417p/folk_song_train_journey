import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CARRIAGE_NAMES, CARRIAGE_SUBTITLES } from '../../../data/gameModes'; 

const FaceSwapGame = ({ song, onHome, faceswapStatus, generatedSwappedImg, onStartGenerate, onSetMockSwap, onSwapGenerated, generatedCoverImg }) => {
  const webcamRef = useRef(null);
  const [base64Template, setBase64Template] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const [coverSource, setCoverSource] = useState(generatedCoverImg ? 'ai' : 'original');

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        let response;
        if (coverSource === 'ai' && generatedCoverImg) {
           response = await fetch(generatedCoverImg);
        } else {
           response = await fetch(`/images/${song.audioFileName.replace('.mp3', '.jpg')}`);
        }
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
  }, [song, faceswapStatus, generatedCoverImg, coverSource]); 

  const handleCaptureAndSwap = async () => {
    if (!webcamRef.current || !base64Template || faceswapStatus === 'generating') return;
    
    const imageSrc = webcamRef.current.getScreenshot({width: 1024, height: 720}); 
    if (imageSrc) {
      const sourceB64 = imageSrc.split(',')[1];
      const count = song.faceCount || 1;
      
      const payload = { 
        source_image: sourceB64, 
        target_image: base64Template, 
        source_faces_index: Array.from({length: count}, () => 0), 
        face_index: Array.from({length: count}, (_, i) => i), 
        upscaler: "None", 
        scale: 1, 
        codeformer_fidelity: 0.5, 
        restore_face: "None", 
        gender_source: 0, 
        gender_target: 0 
      };
      
      onStartGenerate(payload, 'faceswap');
    }
  };

  const handleClaim = () => {
    if (onSwapGenerated && generatedSwappedImg) {
      setIsClaiming(true);
      onSwapGenerated(generatedSwappedImg);
    }
  };

  return (
    <div className="relative w-full h-full bg-transparent flex flex-col items-center justify-center p-8 overflow-hidden">
      
      <div className="text-center mb-8 mt-4 shrink-0 relative z-10 pointer-events-none">
        <h2 className="text-4xl font-bold text-[#FDFBF7] tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] inline-block font-serif">
          {CARRIAGE_NAMES.FACE_SWAP}
        </h2>
        {CARRIAGE_SUBTITLES.FACE_SWAP && (
           <p className="text-gray-200 mt-4 tracking-wider text-xl drop-shadow-md font-bold">
             {CARRIAGE_SUBTITLES.FACE_SWAP}
           </p>
        )}
      </div>

      <div className="flex w-full max-w-[80vw] h-[65vh] gap-8 items-center justify-center">
        
        <div className="w-1/2 flex flex-col items-center bg-[#FDFBF7] rounded-xl shadow-xl border-4 border-[#C0B8A3] p-6 h-full">
          
          <div className="flex w-full mb-4 bg-gray-200 rounded-lg p-1 border-2 border-gray-300 shadow-inner">
            <button
              onClick={() => setCoverSource('original')}
              disabled={faceswapStatus === 'generating'}
              className={`flex-1 py-2 font-bold tracking-widest rounded-md transition-all ${
                coverSource === 'original' 
                  ? 'bg-white text-gray-800 shadow-[0_2px_4px_rgba(0,0,0,0.1)] border border-gray-300' 
                  : 'text-gray-500 hover:bg-gray-300'
              } disabled:cursor-not-allowed`}
            >
              原版專輯封面
            </button>
            <button
              onClick={() => setCoverSource('ai')}
              disabled={!generatedCoverImg || faceswapStatus === 'generating'}
              className={`flex-1 py-2 font-bold tracking-widest rounded-md transition-all ${
                coverSource === 'ai' 
                  ? 'bg-red-600 text-white shadow-[0_2px_4px_rgba(0,0,0,0.2)]' 
                  : 'text-gray-500 hover:bg-gray-300'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              自製專輯封面
            </button>
          </div>

          <div className="w-full relative shadow-inner border-4 border-gray-300 bg-[#EAEAEA] flex-1 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '1024/720' }}>
            <img 
              src={coverSource === 'ai' && generatedCoverImg ? generatedCoverImg : `/images/${song.audioFileName.replace('.mp3', '.jpg')}`} 
              alt="Target Cover" 
              className="w-full h-full object-contain transition-opacity duration-300" 
            />
          </div>
        </div>

        <div className="w-1/2 flex flex-col items-center bg-[#EAEAEA] rounded-xl shadow-xl border-4 border-gray-300 p-6 h-full">
          {faceswapStatus === 'generating' ? (
             <div className="w-full h-full flex flex-col items-center justify-center text-center animate-pulse gap-6">
                <div className="w-16 h-16 border-8 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                <h3 className="text-2xl font-bold text-gray-800 tracking-widest">封面繪製中...</h3>
                <p className="text-gray-600 leading-relaxed font-bold">封面繪製約需 1 ~ 2 分鐘<br/>您可以先返回火車，繼續進行後續車廂</p>
                <button onClick={onHome} className="w-[80%] py-4 mt-4 bg-gray-800 text-white font-bold rounded-lg border-2 border-black shadow-[4px_4px_0_#4b5563] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#4b5563] transition-all tracking-widest">
                    返回火車等待
                </button>
             </div>
          ) : faceswapStatus === 'done' && generatedSwappedImg ? (
             <div className="w-full h-full flex flex-col items-center animate-fade-in-up">
                {/* ★ 確保畫面內有繪製完成的提示文字 */}
                <h3 className="text-xl font-bold text-green-700 mb-4 border-b-2 border-gray-800 pb-2 w-full text-center tracking-widest ">
                  封面繪製完成！
                </h3>
                <div className="w-full relative shadow-xl border-4 border-white bg-gray-200 flex-1 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '1024/720' }}>
                  <img src={generatedSwappedImg} alt="Swapped" className="w-full h-full object-contain" />
                </div>
                <div className="mt-6 w-full flex justify-center">
                  <button onClick={handleClaim} disabled={isClaiming} className="w-[80%] py-4 bg-red-600 text-white rounded-lg font-bold border-2 border-red-800 shadow-[4px_4px_0_#7f1d1d] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#7f1d1d] transition-all tracking-widest text-lg disabled:opacity-50">
                    {isClaiming ? "封裝中..." : "領取專屬封面! "}
                  </button>
                </div>
             </div>
          ) : (
             <div className="w-full h-full flex flex-col items-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-800 pb-2 w-full text-center tracking-widest">
                  準備拍攝
                </h3>
                
                <div className="w-full relative shadow-inner border-[4px] border-gray-800 bg-gray-300 flex-1 flex items-center justify-center overflow-hidden rounded-lg" style={{ aspectRatio: '1024/720' }}>
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
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[25%] h-[60%] border-4 border-white/80 border-dashed rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                  </div>
                  {!isCameraReady && (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 font-bold tracking-widest">
                      啟動相機中...
                    </div>
                  )}
                </div>
                
                <div className="w-full text-center mt-4 mb-4">
                   <span className="bg-[#FDFBF7] text-gray-800 border-2 border-gray-400 px-6 py-2 rounded-lg shadow-[2px_2px_0_#9ca3af] font-bold tracking-widest text-sm inline-block">
                      請將臉部對準虛線框內
                   </span>
                </div>
                
                <div className="flex w-full gap-4 mt-auto">
                  <button 
                    onClick={handleCaptureAndSwap} 
                    disabled={!isCameraReady || !base64Template || faceswapStatus === 'generating'} 
                    className="flex-1 py-4 bg-gray-800 text-white rounded-lg border-2 border-black shadow-[4px_4px_0_#4b5563] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#4b5563] transition-all tracking-widest text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    拍下照片並融合
                  </button>
                  <button 
                    onClick={() => onSetMockSwap(`/images/${song.audioFileName.replace('.mp3', '.jpg')}`)}
                    disabled={faceswapStatus === 'generating'}
                    className="px-6 py-4 bg-[#FDFBF7] text-gray-800 font-bold rounded-lg border-2 border-gray-400 shadow-[4px_4px_0_#9ca3af] hover:bg-gray-100 hover:translate-y-[2px] hover:shadow-[2px_2px_0_#9ca3af] transition-all tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    預設封面
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