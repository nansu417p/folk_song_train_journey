import React, { useState, useEffect, useRef } from 'react';
import { toPng, toJpeg } from 'html-to-image';
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

  const handleRotate = (dir) => {
    const step = 7.5;
    let newRotate = currentRotate + (dir * step);
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
      <div className="absolute -top-[72px] left-1/2 -translate-x-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#FDFBF7]/95 text-gray-700 rounded-full shadow-md z-[100] border border-gray-100 select-none overflow-hidden font-sans">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => handleRotate(-1)}
          className="w-16 h-16 flex items-center justify-center hover:bg-white hover:text-rose-400 transition-colors border-r border-gray-200 text-4xl font-bold leading-none"
          title="向左轉正"
        >
          ↺
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => handleScale(-0.05)}
          className="w-16 h-16 flex items-center justify-center hover:bg-white hover:text-rose-400 transition-colors border-r border-gray-200 text-4xl font-bold leading-none"
          title="縮小"
        >
          -
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => handleScale(0.05)}
          className="w-16 h-16 flex items-center justify-center hover:bg-white hover:text-rose-400 transition-colors border-r border-gray-200 text-4xl font-bold leading-none"
          title="放大"
        >
          +
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => handleRotate(1)}
          className="w-16 h-16 flex items-center justify-center hover:bg-white hover:text-rose-400 transition-colors text-4xl font-bold leading-none"
          title="向右轉正"
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

      <CollageItem initialX={60} initialY={50} initialRotate={-7.5} initialScale={1} initialZ={10} isResetting={isResetting} bringToFront={bringToFront}>
        <div className="p-3 pb-10 bg-white shadow-2xl border border-gray-200 relative select-none inline-block">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-red-200/90 shadow-sm rotate-2"></div>
          {selectedCoverImg ? (
            <img src={selectedCoverImg} className="w-[450px] aspect-[16/9] object-cover pointer-events-none" draggable="false" alt="封面" />
          ) : (
            <div className="w-[450px] aspect-[16/9] flex items-center justify-center bg-gray-200 text-gray-500 font-bold tracking-widest text-2xl">無圖片紀錄</div>
          )}
          <div className="absolute bottom-2 left-0 w-full text-center text-gray-500 text-base font-bold tracking-widest pointer-events-none">民歌記憶．時光永存</div>
        </div>
      </CollageItem>

      <CollageItem initialX={60} initialY={400} initialRotate={7.5} initialScale={0.8} initialZ={20} isResetting={isResetting} bringToFront={bringToFront}>
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

      <CollageItem initialX={760} initialY={40} initialRotate={-7.5} initialScale={1} initialZ={30} isResetting={isResetting} bringToFront={bringToFront}>
        {/* 統一的歌詞本設計：更淺的米白色 bg-[#FCFBF4] */}
        <div className="bg-[#FCFBF4] border border-[#D2A679]/40 p-6 w-[440px] h-[480px] flex flex-col relative shadow-xl select-none inline-block rounded-sm overflow-hidden">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-yellow-200/90 shadow-sm rotate-3 z-50"></div>
          
          {/* 加入散落的音符裝飾 */}
          <img src="/images/note_1.png" alt="note" className="absolute top-6 left-6 w-8 h-8 opacity-30 -rotate-12 pointer-events-none" />
          <img src="/images/note_2.png" alt="note" className="absolute bottom-12 right-6 w-10 h-10 opacity-20 rotate-12 pointer-events-none" />
          {/* <img src  ="/images/note_3.png" alt="note" className="absolute top-1/2 -right-3 w-8 h-8 opacity-25 rotate-45 pointer-events-none" /> */}

          {/* 移除青春歌詞方塊，並加粗分隔線 */}
          <div className="border-b-[3px] border-[#C09668]/60 pb-3 mb-4 shrink-0 text-center relative z-10">
            <h1 className="text-3xl font-bold font-serif text-[#C09668] m-0 tracking-widest mb-2">{song.title}</h1>
            <p className="text-gray-500 font-serif tracking-wider font-bold text-lg">{song.singer}</p>
          </div>

          <div className="flex-1 overflow-hidden relative z-10">
            <div className="leading-loose tracking-widest whitespace-pre-wrap text-base font-bold opacity-80 h-full overflow-hidden text-gray-700 px-4 text-center">
              {lyrics ? lyrics.content : '歌詞尚未拼貼完成...'}
            </div>
          </div>
        </div>
      </CollageItem>

      <CollageItem initialX={680} initialY={530} initialRotate={7.5} initialScale={1} initialZ={40} isResetting={isResetting} bringToFront={bringToFront}>
        <div className="bg-[#FDFBF7] border-l-[6px] border-[#D2A679] p-4 pr-6 w-[380px] shadow-xl relative select-none inline-block">
          <h4 className="text-xs font-bold text-[#D2A679] mb-2 tracking-widest uppercase">旅程留言</h4>
          <div className="text-base leading-relaxed text-gray-700 font-bold italic pt-1">
            「{customMessage || '這是一段專屬於民歌時代的美好回憶。'}」
          </div>
        </div>
      </CollageItem>

      <CollageItem initialX={1080} initialY={540} initialRotate={-7.5} initialScale={1} initialZ={15} isResetting={isResetting} bringToFront={bringToFront}>
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

  const postcardContainerRef = useRef(null);
  const [postcardScale, setPostcardScale] = useState(0.8);

  useEffect(() => {
    if (!postcardContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleW = width / 1340;
        const scaleH = height / 760;
        setPostcardScale(Math.min(0.95, scaleW, scaleH));
      }
    });
    observer.observe(postcardContainerRef.current);
    return () => observer.disconnect();
  }, []);

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

      const dataUrl = await toJpeg(targetNode, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#F4F1EA',
        quality: 0.95
      });

      const link = document.createElement('a');
      link.download = `${song.title}_時光紀念明信片.jpg`;
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

      <div className="w-full max-w-[1500px] w-[95vw] xl:w-[95vw] h-auto min-h-[500px] aspect-[16/9] max-h-[85vh] bg-[#EAEAEA] rounded-xl shadow-2xl border-[4px] border-[#C0B8A3] flex overflow-hidden relative">

        {isCapturingImage && (
          <div className="fixed inset-0 bg-black/60 z-[9999] flex flex-col items-center justify-center backdrop-blur-sm pointer-events-auto">
            <div className="w-16 h-16 border-8 border-gray-300 border-t-red-600 rounded-full animate-spin mb-6"></div>
            <h2 className="text-3xl font-bold text-white tracking-widest font-serif">正在為您印製明信片...</h2>
          </div>
        )}

        <div className="w-[32%] bg-[#FDFBF7] p-6 lg:p-8 border-r border-gray-200 flex flex-col justify-start z-20 min-w-[340px] shrink-0">
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between border-b-2 border-rose-400 pb-2">
              <h2 className="text-3xl font-bold text-gray-800 tracking-widest font-serif m-0">旅程回憶明信片</h2>
            </div>
            <p className="text-gray-500 text-base font-bold tracking-widest mt-2 leading-relaxed">輕輕拖曳與縮放<br />排版出獨一無二的回憶畫面</p>
          </div>

          <div className="flex flex-col gap-2 mt-6 shrink-0">
            <div className="flex gap-4">
              <div onClick={() => !isCapturingImage && setSelectedCoverType('cover')} className={`flex-1 cursor-pointer rounded-sm overflow-hidden border-[3px] transition-all ${selectedCoverType === 'cover' ? 'border-red-600 shadow-[4px_4px_0_#7f1d1d] scale-[1.02]' : 'border-gray-400 opacity-60 hover:opacity-100'}`}>
                {cover ? <img src={cover.image} className="w-full aspect-[16/9] object-cover bg-gray-200" alt="意境封面" draggable="false" /> : <div className="w-full aspect-[16/9] bg-gray-300 flex items-center justify-center text-sm font-bold tracking-widest">無相片</div>}
                <div className="bg-gray-800 text-white text-center text-sm py-1.5 tracking-widest font-bold border-t-[2px] border-gray-600">封面繪製</div>
              </div>
              <div onClick={() => !isCapturingImage && setSelectedCoverType('swapped')} className={`flex-1 cursor-pointer rounded-sm overflow-hidden border-[3px] transition-all ${selectedCoverType === 'swapped' ? 'border-red-600 shadow-[4px_4px_0_#7f1d1d] scale-[1.02]' : 'border-gray-400 opacity-60 hover:opacity-100'}`}>
                {swapped ? <img src={swapped.image} className="w-full aspect-[16/9] object-cover bg-gray-200" alt="合照封面" draggable="false" /> : <div className="w-full aspect-[16/9] bg-gray-300 flex items-center justify-center text-sm font-bold tracking-widest">無合照</div>}
                <div className="bg-gray-800 text-white text-center text-sm py-1.5 tracking-widest font-bold border-t-[2px] border-gray-600">復古寫真</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col mt-6 flex-1">
            <textarea disabled={isCapturingImage} value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder="為這趟旅程留下一段文字紀念吧..." className="w-full h-full min-h-[160px] bg-[#F4F1EA] border border-gray-300 rounded-xl p-4 font-serif text-gray-800 font-bold resize-none focus:outline-none focus:border-rose-400 shadow-inner leading-relaxed text-base"></textarea>
          </div>
        </div>

        {/* 右側區域 */}
        <div className={`flex-1 flex flex-col justify-between relative overflow-hidden px-4 md:px-8 py-6 transition-colors duration-300 ${isCapturingImage ? 'bg-gray-400/80 pointer-events-none' : 'bg-[#C0B8A3] pointer-events-auto'}`}>
          
          {/* 移除右上角的重新排版按鈕 */}
          <div className="w-full shrink-0 relative z-50 flex justify-start mb-2"></div>

          {/* 中間：明信片區域 */}
          <div ref={postcardContainerRef} className="w-full flex-1 relative z-10 my-2">
            <div className="absolute top-1/2 left-1/2 origin-center drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] flex items-center justify-center transition-transform duration-100" style={{ transform: `translate(-50%, -52%) scale(${postcardScale})` }}>
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

          {/* 下方：所有按鈕群 (移到右邊底部) */}
          <div className="w-full shrink-0 flex gap-4 justify-center items-center h-[64px] relative z-50 mt-4 px-2">
            
            {/* 新位置：重新排版在左邊，綠色按鈕 */}
            <div className="flex-1 max-w-[260px] h-full">
              <button 
                disabled={isCapturingImage} 
                onClick={handleResetLayout} 
                className="w-full h-full flex items-center justify-center px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-full shadow-md hover:shadow-lg transition-all duration-200 tracking-widest cursor-pointer whitespace-nowrap"
              >
                <span className="text-xl leading-none mr-2 -translate-y-[2px]">⟳</span> 重新排版
              </button>
            </div>

            {/* 錄音下載按鈕 */}
            {recording ? (
              <button disabled={isCapturingImage} onClick={handleDownloadAudio} title="下載您的歌聲錄音" className="bg-[#6B5A4B] w-[80px] shrink-0 flex justify-center items-center h-full rounded-full shadow-md hover:bg-gray-700 transition-all z-10 border border-white/20">
                <img src={song.cassetteImage || "/images/cassette_1.png"} alt="錄音" className="w-[48px] h-[48px] object-contain drop-shadow-md pb-1" />
              </button>
            ) : (
              <div title="無錄音紀錄" className="w-[80px] shrink-0 h-full flex justify-center items-center bg-[#FDFBF7] border-[3px] border-gray-400 border-dashed rounded-full opacity-60">
                <img src={song.cassetteImage || "/images/cassette_1.png"} alt="無錄音" className="w-[42px] h-[42px] object-contain grayscale opacity-50 pb-1" />
              </div>
            )}

            {/* 明信片下載按鈕 */}
            <div className="flex-1 max-w-[260px] h-full">
              <button onClick={handleDownloadImage} disabled={isGenerating || isCapturingImage} className={`w-full h-full flex items-center justify-center m-0 text-lg whitespace-nowrap transition-opacity ${isGenerating || isCapturingImage ? 'bg-gray-400 text-white rounded-full font-bold tracking-widest cursor-wait shadow-sm' : 'btn-primary'}`}>
                {isCapturingImage ? "正在為您印製..." : isGenerating ? "處理中..." : "下載明信片"}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default CapsuleGame;