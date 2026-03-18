import React, { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { motion, useAnimation } from 'framer-motion';
import { TicketCard } from '../../Shared/TicketCard';

const getTodayFullDate = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `二零二六年 ${mm}月 ${dd}日`;
};

// 幫助元件：包含「旋轉/縮放按鈕、動態圖層置頂、自由拖曳」的拼貼圖層
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
      {/* 懸浮控制工具列 */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800/95 text-white rounded-lg shadow-lg z-[100] border border-gray-600 select-none overflow-hidden text-lg font-bold">
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => handleRotate(-7.5)} 
          className="hover:bg-gray-700 hover:text-red-400 px-5 py-2 transition-colors border-r border-gray-600"
          title="向左轉"
        >
          ↺
        </button>
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => handleScale(-0.05)} 
          className="hover:bg-gray-700 hover:text-red-400 px-5 py-2 transition-colors border-r border-gray-600"
          title="縮小"
        >
          -
        </button>
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => handleScale(0.05)} 
          className="hover:bg-gray-700 hover:text-red-400 px-5 py-2 transition-colors border-r border-gray-600"
          title="放大"
        >
          +
        </button>
        <button 
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => handleRotate(7.5)} 
          className="hover:bg-gray-700 hover:text-red-400 px-5 py-2 transition-colors"
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

// 明信片本體設計 (1280x720) 
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
      className="w-[1280px] h-[720px] bg-[#F4F1EA] overflow-hidden border-[6px] border-gray-800 shadow-[12px_12px_0_rgba(0,0,0,0.8)] font-serif relative box-border bg-[url('/images/Capsule_bg.jpg')] bg-cover bg-center"
    >
      <div className="absolute inset-0 bg-white/50 pointer-events-none"></div>

      {/* 拼貼一：封面圖片 (左上) */}
      <CollageItem initialX={60} initialY={50} initialRotate={-2} initialScale={1} initialZ={10} isResetting={isResetting} bringToFront={bringToFront}>
        <div className="p-3 pb-10 bg-white shadow-2xl border border-gray-200 relative select-none inline-block">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-red-200/90 shadow-sm rotate-2"></div>
          {selectedCoverImg ? (
            <img src={selectedCoverImg} className="w-[450px] aspect-[16/9] object-cover pointer-events-none" draggable="false" alt="封面" />
          ) : (
            <div className="w-[450px] aspect-[16/9] flex items-center justify-center bg-gray-200 text-gray-500 font-bold tracking-widest text-2xl">無封面圖片</div>
          )}
          <div className="absolute bottom-2 left-0 w-full text-center text-gray-500 text-sm font-bold tracking-widest pointer-events-none">民歌記憶．時光修復</div>
        </div>
      </CollageItem>

      {/* 拼貼二：心情車票 (左下) */}
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

      {/* 拼貼三：歌曲資訊與歌詞結合 (右方長條) */}
      <CollageItem initialX={760} initialY={40} initialRotate={1} initialScale={1} initialZ={30} isResetting={isResetting} bringToFront={bringToFront}>
        <div className="bg-[#FDFBF7] border-[3px] border-gray-800 p-6 w-[440px] h-[480px] flex flex-col relative shadow-2xl select-none inline-block">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-yellow-200/90 shadow-sm rotate-3 z-50"></div>
          
          <div className="border-b-[3px] border-gray-800 pb-4 mb-4 shrink-0 text-center">
             <h1 className="text-3xl font-bold font-serif text-gray-900 m-0 tracking-widest mb-2">{song.title}</h1>
             <p className="text-gray-600 font-serif tracking-wider font-bold text-lg">{song.singer}</p>
          </div>
          
          <div className="absolute top-2 right-2 text-[10px] text-gray-400 tracking-widest font-bold">SONG & LYRICS</div>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[32px] leading-[32px] text-center block bg-gray-800 text-xs text-white font-bold tracking-widest">
              — 歌詞修復手稿 —
            </div>
            <div className="leading-loose tracking-widest whitespace-pre-wrap text-sm font-bold opacity-80 mt-10 h-full overflow-hidden text-gray-700 px-4 text-center">
              {lyrics ? lyrics.content : '記憶尚未修復...'}
            </div>
          </div>
        </div>
      </CollageItem>

      {/* 拼貼四：獨立的心情留言 (右下) */}
      <CollageItem initialX={680} initialY={530} initialRotate={-4} initialScale={1} initialZ={40} isResetting={isResetting} bringToFront={bringToFront}>
        <div className="bg-red-50/95 border-l-[6px] border-red-700 p-4 pr-6 w-[380px] shadow-2xl relative select-none inline-block">
          <div className="absolute top-2 right-3 text-red-700/30 text-3xl">❝</div>
          <h4 className="text-xs font-bold text-red-800 mb-2 tracking-widest opacity-60 uppercase">心情留言</h4>
          <div className="text-sm leading-relaxed text-gray-800 font-bold italic pt-1">
            「{customMessage || '這是一段專專屬於民歌時代的美好回憶。'}」
          </div>
        </div>
      </CollageItem>

      {/* 拼貼五：紀念郵戳 (右下角裝飾) */}
      <CollageItem initialX={1080} initialY={540} initialRotate={-15} initialScale={1} initialZ={15} isResetting={isResetting} bringToFront={bringToFront}>
        <div className="border-[4px] border-red-700/60 rounded-full w-32 h-32 flex flex-col items-center justify-center text-red-700/60 shadow-sm mix-blend-multiply bg-white/40 backdrop-blur-sm pointer-events-none select-none inline-block">
          <span className="font-bold text-sm tracking-widest border-b border-red-700/60 pb-1 mb-1">民歌之旅紀念</span>
          <span className="text-[10px] font-bold text-center px-2 tracking-widest">{todayDate}</span>
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
      link.download = `${song.title}_民歌拼貼回憶.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      alert("圖片生成失敗，請確保圖片載入完成並重試！");
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
    link.download = `${song.title}_我的演唱錄音.webm`; 
    link.click();
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent p-4 md:p-6 lg:p-8 font-sans">
      
      {/* ★ 任務 1：整個容器（左+右）往下移動 50px (增加 translate-y-[50px]) */}
      <div className="w-full max-w-[98%] h-[92vh] bg-[#EAEAEA] rounded-xl shadow-2xl border-[4px] border-[#C0B8A3] flex overflow-hidden relative transform translate-y-[30px]">
          
         {/* 沖洗中載入遮罩 */}
         {isCapturingImage && (
            <div className="fixed inset-0 bg-black/60 z-[9999] flex flex-col items-center justify-center backdrop-blur-sm pointer-events-auto">
                <div className="w-16 h-16 border-8 border-gray-300 border-t-red-600 rounded-full animate-spin mb-6"></div>
                <h2 className="text-3xl font-bold text-white tracking-widest font-serif">明信片印製中，請稍候...</h2>
            </div>
         )}

         {/* 左側控制面板 */}
         <div className="w-[32%] bg-[#FDFBF7] p-6 lg:p-8 border-r-[4px] border-dashed border-gray-400 flex flex-col justify-between z-20 shadow-xl min-w-[340px] shrink-0">
            <div className="flex flex-col gap-2 shrink-0">
              <h2 className="text-3xl font-bold text-gray-800 tracking-widest font-serif border-b-[3px] border-red-600 pb-2 w-max">回憶拼貼桌</h2>
              <p className="text-gray-500 text-sm font-bold tracking-widest mt-2">自由排版右側元件，印製專屬紀念。</p>
            </div>

            <div className="flex flex-col gap-2 mt-6 shrink-0">
               <h3 className="font-bold text-white bg-gray-800 px-3 py-1 rounded w-max text-xs tracking-widest shadow-[2px_2px_0_#4b5563]">步驟一：選擇封面影像</h3>
               <div className="flex gap-4">
                  <div onClick={() => !isCapturingImage && setSelectedCoverType('cover')} className={`flex-1 cursor-pointer rounded-sm overflow-hidden border-[3px] transition-all ${selectedCoverType === 'cover' ? 'border-red-600 shadow-[4px_4px_0_#7f1d1d] scale-[1.02]' : 'border-gray-400 opacity-60 hover:opacity-100'}`}>
                    {cover ? <img src={cover.image} className="w-full aspect-[16/9] object-cover bg-gray-200" alt="意境封面" draggable="false" /> : <div className="w-full aspect-[16/9] bg-gray-300 flex items-center justify-center text-xs font-bold tracking-widest">無封面</div>}
                    <div className="bg-gray-800 text-white text-center text-xs py-1.5 tracking-widest font-bold border-t-[2px] border-gray-600">自製封面</div>
                  </div>
                  <div onClick={() => !isCapturingImage && setSelectedCoverType('swapped')} className={`flex-1 cursor-pointer rounded-sm overflow-hidden border-[3px] transition-all ${selectedCoverType === 'swapped' ? 'border-red-600 shadow-[4px_4px_0_#7f1d1d] scale-[1.02]' : 'border-gray-400 opacity-60 hover:opacity-100'}`}>
                    {swapped ? <img src={swapped.image} className="w-full aspect-[16/9] object-cover bg-gray-200" alt="合照封面" draggable="false" /> : <div className="w-full aspect-[16/9] bg-gray-300 flex items-center justify-center text-xs font-bold tracking-widest">無合照</div>}
                    <div className="bg-gray-800 text-white text-center text-xs py-1.5 tracking-widest font-bold border-t-[2px] border-gray-600">一日歌手</div>
                  </div>
               </div>
            </div>

            <div className="flex-1 flex flex-col mt-6">
               <h3 className="font-bold text-white mb-2 bg-gray-800 px-3 py-1 rounded w-max text-xs tracking-widest shadow-[2px_2px_0_#4b5563]">步驟二：寫下心情留言</h3>
               <textarea disabled={isCapturingImage} value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder="寫下這首歌帶給您的感觸..." className="flex-1 w-full bg-[#EAEAEA] border-[3px] border-gray-400 rounded-sm p-4 font-serif text-gray-800 font-bold resize-none focus:outline-none focus:border-red-600 shadow-inner leading-relaxed text-sm"></textarea>
            </div>

            <div className="flex flex-col gap-4 mt-6 shrink-0">
               <button disabled={isCapturingImage} onClick={handleResetLayout} className="w-full py-3 bg-gray-200 text-gray-600 text-sm font-bold tracking-widest border-2 border-gray-400 rounded hover:bg-gray-300 transition-colors shadow-sm">
                 ⟲ 還原預設排版
               </button>

               <button onClick={handleDownloadImage} disabled={isGenerating || isCapturingImage} className={`w-full py-4 text-[#FDFBF7] text-base md:text-lg rounded font-bold border-[3px] transition-all tracking-widest flex items-center justify-center ${isGenerating || isCapturingImage ? 'bg-gray-500 border-gray-600 cursor-wait' : 'bg-red-600 border-red-900 shadow-[4px_4px_0_#7f1d1d] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#7f1d1d]'}`}>
                 {isCapturingImage ? "正在印製..." : isGenerating ? "處理中..." : "📥 下載民歌明信片"}
               </button>
               
               {recording ? (
                 <button disabled={isCapturingImage} onClick={handleDownloadAudio} className="w-full py-3 text-white text-sm md:text-base rounded font-bold border-[3px] border-black shadow-[4px_4px_0_#4b5563] transition-all tracking-widest bg-gray-800 hover:translate-y-[2px] hover:shadow-[2px_2px_0_#4b5563]">下載演唱錄音</button>
               ) : (
                 <div className="w-full py-3 bg-[#FDFBF7] text-gray-500 text-center rounded font-bold text-sm tracking-widest border-[3px] border-gray-400 border-dashed">此次無錄音紀錄</div>
               )}
            </div>
         </div>

         {/* 右側預覽區 */}
         <div className={`flex-1 flex flex-col items-center relative overflow-hidden px-4 md:px-8 py-6 transition-colors duration-300 ${isCapturingImage ? 'bg-gray-400/80 pointer-events-none' : 'bg-[#C0B8A3] pointer-events-auto'}`}>
            
            <div className="w-full shrink-0 flex flex-col items-start relative z-50">
               <div className="text-white/60 font-bold tracking-widest text-2xl font-serif">自由拼貼區</div>
               <div className="mt-2 text-gray-700 font-bold tracking-widest text-sm bg-white/70 px-4 py-2 rounded-full border border-gray-400/50 shadow-sm backdrop-blur-sm pointer-events-none inline-block">
                 💡 提示：游標移至元件上，點擊 ↺ - + ↻ 調整！
               </div>
            </div>
            
            {/* 視覺居中與放大容器 */}
            <div className="w-full flex-1 flex justify-center items-start overflow-visible">
               {/* ★ 任務 2：明信片本身上移 100px (將原本的 mt-16 改為 -mt-[60px]) */}
               <div className="transform scale-[0.6] lg:scale-[0.7] xl:scale-[0.8] origin-top transition-all duration-500 drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] mt-[10px]">
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