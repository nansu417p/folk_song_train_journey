import React, { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { motion, useAnimation } from 'framer-motion';
import { TicketCard } from '../../Shared/TicketCard';

const getTodayFullDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}年 ${mm}月 ${dd}日`;
};

const CollageItem = ({ children, initialX, initialY, initialRotate = 0, initialScale = 1, initialZ = 10, isResetting, bringToFront }) => {
  const controls = useAnimation();
  const [currentRotate, setCurrentRotate] = useState(initialRotate);
  const [currentScale, setCurrentScale] = useState(initialScale);
  const [localZ, setLocalZ] = useState(initialZ);

  useEffect(() => {
    if (isResetting) {
      controls.start({ x: initialX, y: initialY, rotate: initialRotate, scale: initialScale, transition: { type: 'spring', stiffness: 300, damping: 30 } });
      setCurrentRotate(initialRotate);
      setCurrentScale(initialScale);
      setLocalZ(initialZ);
    }
  }, [isResetting, initialX, initialY, initialRotate, initialScale, initialZ, controls]);

  const handleRotate = (deg) => {
    const newRotate = currentRotate + deg;
    setCurrentRotate(newRotate);
    controls.start({ rotate: newRotate });
  };

  const handleScale = (delta) => {
    const newScale = Math.max(0.2, currentScale + delta);
    setCurrentScale(newScale);
    controls.start({ scale: newScale });
  };

  const handlePointerDown = () => {
    setLocalZ(bringToFront());
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: initialX, y: initialY, rotate: initialRotate, scale: initialScale }}
      animate={controls}
      style={{ position: 'absolute', zIndex: localZ }}
      onPointerDown={handlePointerDown}
      className="group"
    >
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#FDFBF7]/95 text-gray-700 rounded-full shadow-md z-[100] border border-gray-100 select-none overflow-hidden text-lg font-bold">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => handleRotate(-7.5)}
          className="hover:bg-white hover:text-rose-400 px-5 py-2 transition-colors border-r border-gray-200"
          title="向左轉"
        >
          ↺
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => handleScale(-0.05)}
          className="hover:bg-white hover:text-rose-400 px-5 py-2 transition-colors border-r border-gray-200"
          title="縮小"
        >
          -
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => handleScale(0.05)}
          className="hover:bg-white hover:text-rose-400 px-5 py-2 transition-colors border-r border-gray-200"
          title="放大"
        >
          +
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => handleRotate(7.5)}
          className="hover:bg-white hover:text-rose-400 px-5 py-2 transition-colors"
          title="向右轉"
        >
          ↻
        </button>
      </div>

      <div className="pointer-events-auto cursor-grab active:cursor-grabbing inline-block">
        {children}
      </div>
    </motion.div>
  );
};

const PostcardContent = ({ song, ticket, selectedCoverImg, customMessage, lyrics, isResetting }) => {
  const todayDate = getTodayFullDate();

  const [maxZ, setMaxZ] = useState(50);
  const bringToFront = () => {
    const newZ = maxZ + 1;
    setMaxZ(newZ);
    return newZ;
  };

  return (
    <div
      id="postcard-actual-content"
      className="w-[1280px] h-[720px] bg-[#F4F1EA] overflow-hidden border-[8px] border-white shadow-2xl font-serif relative box-border bg-[url('/images/Capsule_bg.png')] bg-cover bg-center rounded-sm"
    >
      <div className="absolute inset-0 bg-white/50 pointer-events-none"></div>

      <CollageItem initialX={60} initialY={50} initialRotate={-2} initialScale={1} initialZ={10} isResetting={isResetting} bringToFront={bringToFront}>
        <div className="p-3 pb-10 bg-white shadow-2xl border border-gray-200 relative select-none inline-block">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-red-200/90 shadow-sm rotate-2"></div>
          {selectedCoverImg ? (
            <img src={selectedCoverImg} className="w-[450px] aspect-[16/9] object-cover pointer-events-none" draggable="false" alt="封面" />
          ) : (
            <div className="w-[450px] aspect-[16/9] flex items-center justify-center bg-gray-200 text-gray-500 font-bold tracking-widest text-2xl">無圖片紀錄</div>
          )}
          <div className="absolute bottom-2 left-0 w-full text-center text-gray-500 text-sm font-bold tracking-widest pointer-events-none">民歌記憶．時光永存</div>
        </div>
      </CollageItem>

      <CollageItem initialX={60} initialY={400} initialRotate={3} initialScale={0.8} initialZ={20} isResetting={isResetting} bringToFront={bringToFront}>
        <div className="relative select-none drop-shadow-2xl inline-block">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-blue-200/90 shadow-sm -rotate-2 z-50"></div>
          <div className="pointer-events-none">
            {ticket ? (
              <TicketCard captureImg={ticket.image} moodResult={ticket.mood} size="normal" />
            ) : (
              <div className="w-[560px] h-[240px] bg-gray-100 border-[4px] border-dashed border-gray-400 flex items-center justify-center text-gray-500 font-bold tracking-widest text-xl rounded">無心情車票</div>
            )}
          </div>
        </div>
      </CollageItem>

      <CollageItem initialX={760} initialY={40} initialRotate={1} initialScale={1} initialZ={30} isResetting={isResetting} bringToFront={bringToFront}>
        <div className="bg-white/95 backdrop-blur-md border border-[#D2A679] p-6 w-[440px] h-[480px] flex flex-col relative shadow-xl select-none inline-block rounded-sm">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-yellow-200/90 shadow-sm rotate-3 z-50"></div>

          <div className="border-b-2 border-[#D2A679]/40 pb-4 mb-4 shrink-0 text-center">
            <h1 className="text-3xl font-bold font-serif text-[#C09668] m-0 tracking-widest mb-2">{song.title}</h1>
            <p className="text-gray-500 font-serif tracking-wider font-bold text-lg">{song.singer}</p>
          </div>

          <div className="absolute top-2 right-2 text-[10px] text-gray-400 tracking-widest font-bold"></div>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[32px] leading-[32px] text-center block bg-gray-800 text-xs text-white font-bold tracking-widest">
              — 青春歌詞 —
            </div>
            <div className="leading-loose tracking-widest whitespace-pre-wrap text-sm font-bold opacity-80 mt-10 h-full overflow-hidden text-gray-700 px-4 text-center">
              {lyrics ? lyrics.content : '歌詞尚未拼貼完成...'}
            </div>
          </div>
        </div>
      </CollageItem>

      <CollageItem initialX={680} initialY={530} initialRotate={-4} initialScale={1} initialZ={40} isResetting={isResetting} bringToFront={bringToFront}>
        <div className="bg-[#FDFBF7] border-l-[6px] border-[#D2A679] p-4 pr-6 w-[380px] shadow-xl relative select-none inline-block">
          <h4 className="text-xs font-bold text-[#D2A679] mb-2 tracking-widest uppercase">旅程留言</h4>
          <div className="text-sm leading-relaxed text-gray-700 font-bold italic pt-1">
            「{customMessage || '這是一段專屬於民歌時代的美好回憶。'}」
          </div>
        </div>
      </CollageItem>

      <CollageItem initialX={1080} initialY={540} initialRotate={-15} initialScale={1} initialZ={15} isResetting={isResetting} bringToFront={bringToFront}>
        <div className="relative w-36 h-36 flex flex-col items-center justify-center text-red-700/70 mix-blend-multiply pointer-events-none select-none inline-block font-sans">
          <div className="absolute inset-0 border-[3px] border-red-700/70 rounded-full"></div>
          <div className="absolute inset-1.5 border-[1px] border-red-700/60 rounded-full"></div>

          <div className="flex flex-col items-center justify-center w-full h-full bg-white/30 backdrop-blur-sm rounded-full pt-1">
            <span className="font-bold text-[18px] tracking-[0.2em] ml-1 mb-0.5">民歌旅程</span>
            <div className="w-[80%] border-t-[2px] border-red-700/60 mb-1"></div>
            <span className="font-bold text-[12px] tracking-[0.1em] mb-0.5">NCUE</span>
            <span className="text-[10px] font-bold tracking-widest transform scale-90">{todayDate}</span>
          </div>
        </div>
      </CollageItem>

    </div>
  );
};


const CapsuleGame = ({ song, ticket, cover, swapped, lyrics, recording, onHome }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCapturingImage, setIsCapturingImage] = useState(false);
  const [customMessage, setCustomMessage] = useState("");
  const [selectedCoverType, setSelectedCoverType] = useState('cover');
  const [resetTrigger, setResetTrigger] = useState(false);

  const selectedCoverImg = selectedCoverType === 'swapped' && swapped ? swapped.image : (cover ? cover.image : null);

  const handleResetLayout = () => {
    setResetTrigger(true);
    setTimeout(() => setResetTrigger(false), 500);
  };

  const handleDownloadImage = async () => {
    if (isGenerating || isCapturingImage) return;
    setIsGenerating(true);
    setIsCapturingImage(true);

    try {
      const targetNode = document.getElementById('postcard-actual-content');
      if (!targetNode) return;

      const dataUrl = await toPng(targetNode, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#F4F1EA',
      });

      const link = document.createElement('a');
      link.download = `${song.title}_時光紀念明信片.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      alert("圖片印製失敗，請確保所有照片都已載入。");
      console.error("截圖錯誤:", e);
    } finally {
      setIsGenerating(false);
      setIsCapturingImage(false);
    }
  };

  const handleDownloadAudio = () => {
    if (!recording || !recording.audioUrl) return;
    const link = document.createElement('a');
    link.href = recording.audioUrl;
    link.download = `${song.title}_演唱錄音.mp3`;
    link.click();
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent p-4 md:p-6 lg:p-8 font-sans">

      <div className="w-full max-w-[98%] h-[92vh] bg-[#EAEAEA] rounded-xl shadow-2xl border-[4px] border-[#C0B8A3] flex overflow-hidden relative transform translate-y-[30px]">

        {isCapturingImage && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex flex-col items-center justify-center backdrop-blur-sm pointer-events-auto">
            <div className="w-16 h-16 border-8 border-gray-300 border-t-red-600 rounded-full animate-spin mb-6"></div>
            <h2 className="text-3xl font-bold text-white tracking-widest font-serif">正在為您印製明信片...</h2>
          </div>
        )}

        <div className="w-[32%] bg-[#FDFBF7] p-6 lg:p-8 border-r border-gray-200 flex flex-col justify-between z-20 min-w-[340px] shrink-0">
          <div className="flex flex-col gap-2 shrink-0">
            <h2 className="text-3xl font-bold text-gray-800 tracking-widest font-serif border-b-2 border-rose-400 pb-2 w-max">旅程回憶明信片</h2>
            <p className="text-gray-500 text-sm font-bold tracking-widest mt-2 leading-relaxed">輕輕拖曳與縮放<br />排版出獨一無二的回憶畫面</p>
          </div>

          <div className="flex flex-col gap-2 mt-6 shrink-0">
            <h3 className="font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm w-max text-xs tracking-widest">挑選一張您喜歡的照片</h3>
            <div className="flex gap-4">
              <div onClick={() => !isCapturingImage && setSelectedCoverType('cover')} className={`flex-1 cursor-pointer rounded-sm overflow-hidden border-[3px] transition-all ${selectedCoverType === 'cover' ? 'border-red-600 shadow-[4px_4px_0_#7f1d1d] scale-[1.02]' : 'border-gray-400 opacity-60 hover:opacity-100'}`}>
                {cover ? <img src={cover.image} className="w-full aspect-[16/9] object-cover bg-gray-200" alt="意境封面" draggable="false" /> : <div className="w-full aspect-[16/9] bg-gray-300 flex items-center justify-center text-xs font-bold tracking-widest">無相片</div>}
                <div className="bg-gray-800 text-white text-center text-xs py-1.5 tracking-widest font-bold border-t-[2px] border-gray-600">時光畫筆</div>
              </div>
              <div onClick={() => !isCapturingImage && setSelectedCoverType('swapped')} className={`flex-1 cursor-pointer rounded-sm overflow-hidden border-[3px] transition-all ${selectedCoverType === 'swapped' ? 'border-red-600 shadow-[4px_4px_0_#7f1d1d] scale-[1.02]' : 'border-gray-400 opacity-60 hover:opacity-100'}`}>
                {swapped ? <img src={swapped.image} className="w-full aspect-[16/9] object-cover bg-gray-200" alt="合照封面" draggable="false" /> : <div className="w-full aspect-[16/9] bg-gray-300 flex items-center justify-center text-xs font-bold tracking-widest">無合照</div>}
                <div className="bg-gray-800 text-white text-center text-xs py-1.5 tracking-widest font-bold border-t-[2px] border-gray-600">歲月留影</div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col mt-6">
            <h3 className="font-bold text-gray-700 mb-3 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm w-max text-xs tracking-widest">寫下此刻的心情與感動</h3>
            <textarea disabled={isCapturingImage} value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder="為這趟旅程留下一段文字紀念吧..." className="flex-1 w-full bg-[#F4F1EA] border border-gray-300 rounded-xl p-4 font-serif text-gray-800 font-bold resize-none focus:outline-none focus:border-rose-400 shadow-inner leading-relaxed text-sm"></textarea>
          </div>

          <div className="flex flex-col gap-4 mt-6 shrink-0">
            <button onClick={handleDownloadImage} disabled={isGenerating || isCapturingImage} className={`w-full text-base md:text-lg flex items-center justify-center ${isGenerating || isCapturingImage ? 'py-4 bg-gray-400 text-white rounded-full font-bold tracking-widest cursor-wait shadow-sm' : 'btn-primary'}`}>
              {isCapturingImage ? "正在為您印製..." : isGenerating ? "處理中..." : "下載回憶明信片"}
            </button>

            {recording ? (
              <button disabled={isCapturingImage} onClick={handleDownloadAudio} className="btn-secondary w-full py-3 text-sm md:text-base">下載您的歌聲錄音</button>
            ) : (
              <div className="w-full py-3 bg-[#FDFBF7] text-gray-500 text-center rounded font-bold text-sm tracking-widest border-[3px] border-gray-400 border-dashed">此次無錄音紀錄</div>
            )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col items-center relative overflow-hidden px-4 md:px-8 py-6 transition-colors duration-300 ${isCapturingImage ? 'bg-gray-400/80 pointer-events-none' : 'bg-[#C0B8A3] pointer-events-auto'}`}>

          <div className="w-full shrink-0 flex items-center justify-between relative z-50">
            <div className="flex flex-col items-start">
              <div className="text-white/80 font-bold tracking-widest text-2xl font-serif">明信片預覽</div>
              <div className="mt-2 text-gray-700 font-bold tracking-widest text-sm bg-white/80 px-5 py-2 rounded-full border border-white/50 shadow-sm backdrop-blur-md pointer-events-none inline-block flex items-center gap-2">
                提示：滑鼠移至元件上，可點擊縮放或旋轉來自由調整排版
              </div>
            </div>
            <button disabled={isCapturingImage} onClick={handleResetLayout} className="btn-secondary px-8 py-3 text-sm mt-2">
              重新排版
            </button>
          </div>

          <div className="w-full flex-1 flex justify-center items-start overflow-visible">
            <div className="transform scale-[0.6] lg:scale-[0.7] xl:scale-[0.8] origin-top transition-all duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] mt-[10px]">
              <PostcardContent
                song={song}
                ticket={ticket}
                selectedCoverImg={selectedCoverImg}
                customMessage={customMessage}
                lyrics={lyrics}
                isResetting={resetTrigger}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CapsuleGame;