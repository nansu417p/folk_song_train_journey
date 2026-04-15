import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CARRIAGE_NAMES } from '../../../data/gameModes';

const FaceSwapGame = ({ song, onHome, faceswapStatus, generatedSwappedImg, onStartGenerate, onSetMockSwap, onSwapGenerated, generatedCoverImg, hasExistingSwap, existingSwapImg, onCancelSwap }) => {
  const webcamRef = useRef(null);
  const [base64Template, setBase64Template] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [isCameraActive, setIsCameraActive] = useState(true); // 控制鏡頭是否啟動
  const [frozenImage, setFrozenImage] = useState(null); // 儲存定格的畫面

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
        console.error("封面讀取失敗:", err);
      }
    };

    if (song && song.hasFace && faceswapStatus === 'idle') {
      loadTemplate();
    }
  }, [song, faceswapStatus, generatedCoverImg, coverSource]);

  // 當從 done 變回 idle 時 (例如按了重新拍攝)，重新啟動相機
  useEffect(() => {
    if (faceswapStatus === 'idle') {
      setIsCameraActive(true);
      setFrozenImage(null);
      setIsClaiming(false);
    } else if (faceswapStatus === 'done' && generatedSwappedImg) {
      setIsCameraActive(false);
    }
  }, [faceswapStatus, generatedSwappedImg]);

  const handleCaptureAndSwap = async () => {
    if (!webcamRef.current || !base64Template || faceswapStatus === 'generating') return;
    setIsScanning(true);
    
    setTimeout(() => {
      setIsScanning(false);
      const imageSrc = webcamRef.current.getScreenshot({ width: 1024, height: 720 });
      if (imageSrc) {
        setFrozenImage(imageSrc); // 拍攝瞬間將畫面存起來
        setIsCameraActive(false); // 停止相機以節省效能

        const sourceB64 = imageSrc.split(',')[1];
        const count = song.faceCount || 1;

        const payload = {
          source_image: sourceB64,
          target_image: base64Template,
          source_faces_index: Array.from({ length: count }, () => 0),
          face_index: Array.from({ length: count }, (_, i) => i),
          upscaler: "None",
          scale: 1,
          codeformer_fidelity: 0.5,
          restore_face: "None",
          gender_source: 0,
          gender_target: 0,
          "skip_nsfw_filter": true,
        };

        onStartGenerate(payload, 'faceswap');
      }
    }, 2000);
  };

  const handleReScan = () => {
    if (onCancelSwap) onCancelSwap(); // 呼叫上層清除圖片狀態，這會把 faceswapStatus 設為 idle
    setIsCameraActive(true);
    setFrozenImage(null);
    setIsClaiming(false);
  };

  const handleClaim = () => {
    if (onSwapGenerated && generatedSwappedImg) {
      setIsClaiming(true);
      onSwapGenerated(generatedSwappedImg);
    }
  };

  return (
    <div className="relative w-full h-full bg-transparent flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="flex w-full max-w-[1200px] w-[95vw] xl:w-[85vw] h-auto min-h-[500px] aspect-[16/10] max-h-[85vh] gap-4 md:gap-8 items-center justify-center mt-6">
        
        {/* 左側：相機與拍攝 */}
        {faceswapStatus === 'done' && generatedSwappedImg && hasExistingSwap ? (
          // 第二次以上的拍攝：左邊顯示原本的封面
          <div className="w-1/2 flex flex-col items-center bg-[#F9F7F1] rounded-3xl shadow-xl border border-gray-300 p-6 h-full relative">
            <div className="w-full flex justify-center mb-4 shrink-0 h-10 items-center border-[2px] border-dashed border-gray-300 rounded-full bg-white shadow-sm">
              <div className="font-bold tracking-widest text-[#D2A679] text-xl font-serif">原本的封面</div>
            </div>
            <div className="w-full relative shadow-inner border border-gray-300 bg-[#F4F1EA] rounded-xl flex-[1] flex flex-col items-center justify-center overflow-hidden" style={{ aspectRatio: '1024/720' }}>
               <img src={existingSwapImg || song.coverImage || "/images/default_cover.jpg"} alt="Original Swap" className="absolute inset-0 w-full h-full object-cover animate-fade-in" crossOrigin="anonymous" />
            </div>
            <div className="flex h-14 mt-6 w-full shrink-0">
               <button onClick={() => { if(onSwapGenerated) onSwapGenerated(existingSwapImg); }} className="btn-secondary w-full h-full text-lg tracking-widest font-bold border-gray-300">
                 選擇此封面
               </button>
            </div>
          </div>
        ) : (
          // 第一次拍攝，或正在拍攝/處理中：左邊顯示相機或定格畫面
          <div className="w-1/2 flex flex-col items-center bg-white rounded-3xl shadow-xl border border-gray-300 p-6 h-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4 w-full text-center tracking-widest font-serif">
              復古寫真相機
            </h3>

            <div className="w-full relative shadow-inner border border-gray-300 bg-gray-200 flex-1 flex items-center justify-center overflow-hidden rounded-xl" style={{ aspectRatio: '1024/720' }}>
              
              {/* 根據狀態顯示鏡頭或定格照片，取消黑白濾鏡，使用與 MoodTrain 相同的透明與模糊度 */}
              {isCameraActive ? (
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width={1024}
                  height={720}
                  videoConstraints={{ aspectRatio: 1024 / 720, facingMode: "user" }}
                  className="absolute inset-0 w-full h-full object-cover"
                  mirrored={true}
                  onUserMedia={() => setIsCameraReady(true)}
                />
              ) : frozenImage ? (
                <img src={frozenImage} alt="frozen frame" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[4px] transition-all duration-500" />
              ) : null}

              {!isCameraReady && isCameraActive && (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 font-bold tracking-widest z-10">
                  相機準備中...
                </div>
              )}
              
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                  <div className="w-[28%] h-[65%] border-[4px] border-yellow-400 border-dashed rounded-[50%] animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.6)]"></div>
                </div>
              )}
              
              {/* 處理中或完成時的提示文字 */}
              {faceswapStatus === 'generating' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-700 font-bold tracking-widest bg-white/70 px-4 py-2 rounded-full shadow-sm">照片處理中...</span>
                </div>
              )}
            </div>

            <div className="flex w-full gap-4 mt-6 h-14 shrink-0">
              {/* 根據狀態切換按鈕：拍攝中 / 重新拍攝 */}
              {faceswapStatus === 'done' ? (
                <button
                  onClick={handleReScan}
                  className="btn-secondary w-full text-lg tracking-widest font-bold disabled:opacity-50"
                  disabled={faceswapStatus === 'generating'}
                >
                  重新拍攝
                </button>
              ) : (
                <button
                  onClick={handleCaptureAndSwap}
                  disabled={!isCameraReady || !base64Template || faceswapStatus === 'generating' || isScanning}
                  className="btn-primary w-full disabled:opacity-70 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg tracking-widest font-bold"
                >
                  {isScanning ? '正在拍攝...' : faceswapStatus === 'generating' ? '處理中...' : '點擊拍攝，化身封面主角'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 右側：成果展示與領取 */}
        <div className="w-1/2 flex flex-col items-center bg-[#F9F7F1] rounded-3xl shadow-xl border border-gray-300 p-6 h-full relative">
          
          <div className="flex h-12 w-full mb-4 items-center justify-center shrink-0">
            {faceswapStatus === 'done' && generatedSwappedImg ? (
              <div className="font-bold tracking-widest text-[#D2A679] text-xl font-serif">
                繪製完成
              </div>
            ) : (
              <div className="flex w-full h-full bg-white rounded-full p-1 border border-gray-300 shadow-inner">
                <button
                  onClick={() => setCoverSource('original')}
                  disabled={faceswapStatus === 'generating'}
                  className={`flex-1 font-bold text-xl tracking-widest rounded-full transition-all ${coverSource === 'original'
                    ? 'bg-[#D2A679] text-white shadow-md border border-transparent'
                    : 'text-gray-500 hover:bg-gray-50'
                    } disabled:cursor-not-allowed`}
                >
                  經典原曲封面
                </button>
                <button
                  onClick={() => setCoverSource('ai')}
                  disabled={!generatedCoverImg || faceswapStatus === 'generating'}
                  className={`flex-1 font-bold text-xl tracking-widest rounded-full transition-all ${coverSource === 'ai'
                    ? 'bg-rose-400 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  您創作的封面
                </button>
              </div>
            )}
          </div>

          <div className="w-full relative shadow-inner border border-gray-300 bg-[#F4F1EA] rounded-xl flex-1 flex flex-col items-center justify-center overflow-hidden" style={{ aspectRatio: '1024/720' }}>
            {faceswapStatus === 'generating' ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center animate-pulse gap-6">
                <div className="w-16 h-16 border-8 border-gray-300 border-t-rose-400 rounded-full animate-spin"></div>
                <h3 className="text-2xl font-bold text-gray-800 tracking-widest">正在為您沖洗封面</h3>
                <p className="text-gray-600 font-bold">請稍候，完成後即可於此處領取</p>
              </div>
            ) : faceswapStatus === 'done' && generatedSwappedImg ? (
              <img src={generatedSwappedImg} alt="Swapped" className="absolute inset-0 w-full h-full object-cover animate-fade-in" />
            ) : (
              <img
                src={coverSource === 'ai' && generatedCoverImg ? generatedCoverImg : `/images/${song.audioFileName.replace('.mp3', '.jpg')}`}
                alt="Target Cover"
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              />
            )}
          </div>

          <div className="flex h-14 mt-6 w-full shrink-0">
            {/* 修正：只要是 done 且有圖，就顯示領取按鈕 (不論是不是第一次) */}
            {faceswapStatus === 'done' && generatedSwappedImg && (
              <div className="flex justify-center items-center gap-3 animate-fade-in-up w-full h-full">
                <button onClick={handleClaim} disabled={isClaiming} className="btn-primary flex-1 h-full text-lg tracking-widest font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                  {isClaiming ? "處理中..." : (hasExistingSwap ? "選擇此封面" : "領取專輯封面")}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default FaceSwapGame;