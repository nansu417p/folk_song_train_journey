import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { CARRIAGE_NAMES } from '../../../data/gameModes';

const FaceSwapGame = ({ song, onHome, faceswapStatus, generatedSwappedImg, onStartGenerate, onSetMockSwap, onSwapGenerated, generatedCoverImg, hasExistingSwap, onCancelSwap }) => {
  const webcamRef = useRef(null);
  const [base64Template, setBase64Template] = useState(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

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

  const handleCaptureAndSwap = async () => {
    if (!webcamRef.current || !base64Template || faceswapStatus === 'generating') return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const imageSrc = webcamRef.current.getScreenshot({ width: 1024, height: 720 });
      if (imageSrc) {
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
        onHome();
      }
    }, 2000);
  };

  const handleClaim = () => {
    if (onSwapGenerated && generatedSwappedImg) {
      setIsClaiming(true);
      onSwapGenerated(generatedSwappedImg);
    }
  };

  return (
    <div className="relative w-full h-full bg-transparent flex flex-col items-center justify-center p-8 overflow-hidden">

      <div className="absolute top-6 left-0 w-full flex justify-center pointer-events-none z-40">
        <h2 className="text-4xl font-bold text-white tracking-widest drop-shadow-md inline-block font-serif">
          {CARRIAGE_NAMES.FACE_SWAP}
        </h2>
      </div>

      <div className="flex w-full max-w-[80vw] h-[65vh] gap-8 items-center justify-center mt-12">

        <div className="w-1/2 flex flex-col items-center bg-[#FDFBF7] rounded-3xl shadow-xl border border-gray-100 p-6 h-full">

          <div className="flex w-full mb-4 bg-gray-100 rounded-full p-1 border border-gray-200 shadow-inner">
            <button
              onClick={() => setCoverSource('original')}
              disabled={faceswapStatus === 'generating'}
              className={`flex-1 py-2 font-bold tracking-widest rounded-full transition-all ${coverSource === 'original'
                ? 'bg-[#D2A679] text-white shadow-md border border-transparent'
                : 'text-gray-500 hover:bg-[#FDFBF7] hover:shadow-sm'
                } disabled:cursor-not-allowed`}
            >
              經典原曲封面
            </button>
            <button
              onClick={() => setCoverSource('ai')}
              disabled={!generatedCoverImg || faceswapStatus === 'generating'}
              className={`flex-1 py-2 font-bold tracking-widest rounded-full transition-all ${coverSource === 'ai'
                ? 'bg-rose-400 text-white shadow-md'
                : 'text-gray-500 hover:bg-[#FDFBF7] hover:shadow-sm'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              您創作的封面
            </button>
          </div>

          <div className="w-full relative shadow-inner border border-gray-200 bg-[#F4F1EA] rounded-xl flex-1 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '1024/720' }}>
            <img
              src={coverSource === 'ai' && generatedCoverImg ? generatedCoverImg : `/images/${song.audioFileName.replace('.mp3', '.jpg')}`}
              alt="Target Cover"
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
            />
          </div>
        </div>

        <div className="w-1/2 flex flex-col items-center bg-[#F9F7F1] rounded-3xl shadow-xl border border-gray-100 p-6 h-full">
          {faceswapStatus === 'generating' ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center animate-pulse gap-6">
              <div className="w-16 h-16 border-8 border-gray-300 border-t-rose-400 rounded-full animate-spin"></div>
              <h3 className="text-2xl font-bold text-gray-800 tracking-widest">正在為您沖洗封面</h3>
              <p className="text-gray-600 leading-relaxed font-bold">這會稍微需要一點時間，<br />您可以先去其他車廂走走，稍後再來領取喔。</p>
              <button onClick={onHome} className="btn-secondary w-[80%] mt-4">
                返回車廂
              </button>
            </div>
          ) : faceswapStatus === 'done' && generatedSwappedImg ? (
            <div className="w-full h-full flex flex-col items-center animate-fade-in-up justify-center">
              <div className="w-full relative shadow-md border border-gray-200 rounded-xl flex-1 flex items-center justify-center overflow-hidden" style={{ aspectRatio: '1024/720' }}>
                <img src={generatedSwappedImg} alt="Swapped" className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="mt-6 w-full flex justify-center items-center gap-3">
                <button onClick={handleClaim} disabled={isClaiming} className="btn-primary w-[80%] text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {isClaiming ? "處理中..." : (hasExistingSwap ? "替換封面" : "領取專輯封面")}
                </button>
                <button
                  onClick={onCancelSwap}
                  disabled={isClaiming}
                  className="btn-secondary flex-shrink-0 flex items-center justify-center !p-0 w-14 h-14 rounded-full border-2 border-gray-300 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl font-black mb-[2px]">✕</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center">
              <h3 className="text-xl font-bold text-gray-800 mb-4 w-full text-center tracking-widest">
                專輯封面相機
              </h3>

              <div className="w-full relative shadow-inner border border-gray-200 bg-gray-300 flex-1 flex items-center justify-center overflow-hidden rounded-xl" style={{ aspectRatio: '1024/720' }}>
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  width={1024}
                  height={720}
                  videoConstraints={{ aspectRatio: 1024 / 720 }}
                  className="absolute inset-0 w-full h-full object-cover"
                  mirrored={true}
                  onUserMedia={() => setIsCameraReady(true)}
                />
                {!isCameraReady && (
                  <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500 font-bold tracking-widest">
                    相機準備中...
                  </div>
                )}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    <div className="w-[28%] h-[65%] border-[4px] border-yellow-400 border-dashed rounded-[50%] animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.6)]"></div>
                  </div>
                )}
              </div>

              <div className="w-full text-center mt-4 mb-4"></div>

              <div className="flex w-full gap-4 mt-auto">
                <button
                  onClick={() => { onSetMockSwap(`/images/${song.audioFileName.replace('.mp3', '.jpg')}`); onHome(); }}
                  disabled={faceswapStatus === 'generating' || isScanning}
                  className="btn-secondary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  保留經典封面
                </button>
                <button
                  onClick={handleCaptureAndSwap}
                  disabled={!isCameraReady || !base64Template || faceswapStatus === 'generating' || isScanning}
                  className="btn-primary flex-1 text-lg disabled:opacity-70 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isScanning ? '正在拍攝...' : '點擊拍攝，化身封面主角'}
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