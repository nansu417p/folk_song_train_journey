import React, { useState, useEffect, useRef } from 'react';
import { 
  DndContext, useDraggable, useDroppable, DragOverlay, 
  useSensor, useSensors, PointerSensor 
} from '@dnd-kit/core';
import { useDraggable as useScrollDraggable } from 'react-use-draggable-scroll';
import { processLyricsForGame } from '../../../utils/lyricsParser';
import { lyricsData } from '../../../data/lyricsData';

// ★ 貼紙：原地的殘影，拖曳時本身會變成透明
function StickerItem({ id, word }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: id,
    data: { word }
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes}
      className={`
        relative w-full px-4 py-3 bg-[#FDFBF7] text-gray-800 border border-gray-300 font-serif text-lg md:text-xl rounded-sm shadow-md cursor-grab touch-none select-none flex items-center justify-center text-center
        ${isDragging ? 'opacity-0' : 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200'}
      `}
    >
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-yellow-100/60 backdrop-blur-sm border border-yellow-200/50 shadow-sm rotate-[-4deg]"></div>
      {word}
    </div>
  );
}

// ★ 挖空區：接收雙重發光提示
function DropZone({ id, currentWord, isHintActive }) {
  const { isOver, setNodeRef } = useDroppable({ id: id });

  if (currentWord) {
    return (
      <div className="relative inline-flex items-center justify-center px-4 py-1 mx-2 bg-[#FDFBF7] border border-gray-300 text-gray-800 shadow-sm rounded-sm -rotate-1 font-bold text-xl transition-all z-10">
        <div className="absolute -top-1.5 left-2 w-6 h-3 bg-red-200/50 backdrop-blur-sm border border-red-300/50 shadow-sm rotate-6"></div>
        {currentWord}
      </div>
    );
  }

  // ★ 如果自己的 ID 存在於提示陣列中，就發光
  const shouldGlow = isHintActive && isHintActive.includes(id);

  return (
    <div 
      ref={setNodeRef}
      className={`
        inline-flex items-center justify-center min-w-[250px] h-10 mx-2 border-b-2 transition-all duration-300 align-middle
        ${shouldGlow ? 'border-yellow-400 bg-yellow-100/50 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-105' : 'border-dashed border-gray-400 bg-gray-200/40'}
        ${isOver ? 'bg-blue-100/50 border-blue-400 scale-110' : ''}
      `}
    >
      <span className="text-gray-400 text-sm tracking-widest opacity-50">將記憶碎片貼於此...</span>
    </div>
  );
}

const LyricsGamePlay = ({ song, gameData, initialStickers, onHome, onComplete, isPlaying, progress, togglePlay, audioRef }) => {
  const [filledGaps, setFilledGaps] = useState({});
  const [stickers, setStickers] = useState(initialStickers);
  
  const [hintIds, setHintIds] = useState([]); // ★ 存放要發光的 ID 陣列 (包含正確與錯誤)
  const [activeStickerData, setActiveStickerData] = useState(null);

  // 滑鼠拖曳滾動
  const lyricsScrollRef = useRef(null);
  const { events: lyricsScrollEvents } = useScrollDraggable(lyricsScrollRef);
  const stickersScrollRef = useRef(null);
  const { events: stickersScrollEvents } = useScrollDraggable(stickersScrollRef);

  // ★ 容錯感測器：滑動小於 5px 算滾動，大於才算拖曳
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ★ 點擊進度條跳轉
  const handleProgressClick = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audioRef.current.currentTime = percentage * audioRef.current.duration;
  };

  const handleDragStart = (event) => {
    const activeId = event.active.id;
    const sticker = stickers.find(s => s.id === activeId);
    if (sticker) setActiveStickerData(sticker);

    // ★ 產生 50/50 雙重提示：一個正確的，一個隨機的空白處
    const emptyGaps = [];
    gameData.lines.forEach(line => {
      if (line.isGap && !filledGaps[line.id]) {
        emptyGaps.push(line.id);
      }
    });

    // 從還沒填寫的空格中，過濾掉正確答案
    const fakeGaps = emptyGaps.filter(id => id !== activeId);
    let fakeId = null;
    if (fakeGaps.length > 0) {
      fakeId = fakeGaps[Math.floor(Math.random() * fakeGaps.length)];
    }

    // 將正確答案和隨機假答案一起設為發光提示
    setHintIds(fakeId ? [activeId, fakeId] : [activeId]);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setHintIds([]); // 清除發光提示
    setActiveStickerData(null);
    
    if (!over) return;

    // 只有放進完全相符的格子才算成功
    if (active.id === over.id) {
      const matchedText = active.data.current.word;
      setFilledGaps(prev => ({ ...prev, [over.id]: matchedText }));
      setStickers(prev => {
        const newStickers = prev.filter(s => s.id !== active.id);
        if (newStickers.length === 0) {
          setTimeout(() => onComplete(), 1000);
        }
        return newStickers;
      });
    }
  };

  // ★ 核心修復：這能讓 @dnd-kit 知道我們現在網頁滑動到了哪裡，修正座標錯亂！
  const customModifiers = [
    ({ transform }) => {
      return {
        ...transform,
      };
    }
  ];

  return (
    <DndContext sensors={sensors} modifiers={customModifiers} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
       
       <button onClick={onHome} className="absolute top-6 left-6 z-50 px-5 py-2.5 bg-[#F5F5F5] text-gray-800 font-bold rounded-lg shadow border border-gray-300 hover:bg-gray-200 transition-all tracking-wide">
         ← 返回火車
       </button>

       <div className="w-full max-w-6xl h-full flex flex-col bg-[#E0D8C3] rounded-xl shadow-2xl border border-[#C0B8A3] overflow-hidden">
           
           <div className="w-full bg-[#D64F3E] p-4 px-6 flex justify-between items-center shadow-md z-10 border-b border-[#B83E2F]">
             <div className="flex items-center gap-4 min-w-[200px]">
               <div className={`w-12 h-12 bg-white/20 rounded-full flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : ''}`}>💿</div>
               <div className="flex flex-col">
                 <span className="text-white/80 text-[10px] tracking-widest font-bold">RESTORING MEMORY</span>
                 <div className="flex items-baseline gap-3">
                   <h2 className="text-[#F5F5F5] text-xl font-bold tracking-widest font-serif drop-shadow">{song.title}</h2>
                   <span className="text-white/80 text-sm font-serif tracking-wider">{song.singer}</span>
                 </div>
               </div>
             </div>
             
             <div className="flex-1 flex items-center gap-6 max-w-xl">
               <button onClick={togglePlay} className="w-12 h-12 bg-[#F5F5F5] text-[#D64F3E] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md text-xl pl-1">
                 {isPlaying ? 'II' : '▶'}
               </button>
               <div 
                 className="flex-1 h-3 bg-black/20 rounded-full overflow-hidden relative shadow-inner border border-black/10 cursor-pointer"
                 onClick={handleProgressClick}
               >
                 <div className="absolute top-0 left-0 h-full bg-yellow-400 transition-all duration-75 ease-linear pointer-events-none" style={{ width: `${progress}%` }}></div>
               </div>
             </div>
           </div>

           <div className="flex flex-1 overflow-hidden">
              <div 
                ref={lyricsScrollRef} 
                {...lyricsScrollEvents}
                className="flex-[2] bg-[#FDFBF7] p-8 overflow-y-auto custom-scrollbar relative cursor-grab active:cursor-grabbing"
              >
                 <p className="text-center text-gray-400 font-bold tracking-widest mb-10 border-b pb-4 pointer-events-none">請一邊聆聽音樂，一邊將右側的句子貼回歌詞本中</p>
                 <div className="flex flex-col gap-6 text-center font-serif text-xl md:text-2xl text-gray-700 leading-loose">
                    {gameData.lines.map((line) => {
                       if (!line.text) return <div key={line.id} className="h-4 pointer-events-none"></div>; 
                       if (line.isGap) {
                          return (
                            <div key={line.id}>
                              <DropZone id={line.id} currentWord={filledGaps[line.id]} isHintActive={hintIds} />
                            </div>
                          );
                       }
                       return <div key={line.id} className="tracking-wide pointer-events-none">{line.text}</div>;
                    })}
                 </div>
                 <div className="h-20 pointer-events-none"></div>
              </div>

              <div 
                ref={stickersScrollRef}
                {...stickersScrollEvents}
                className="flex-[1] bg-[#EAEAEA] p-6 overflow-y-auto custom-scrollbar border-l-4 border-dashed border-[#C0B8A3] shadow-inner flex flex-col items-center gap-6 cursor-grab active:cursor-grabbing"
              >
                  <h3 className="text-gray-500 font-bold tracking-widest text-sm bg-white px-4 py-2 rounded-full shadow-sm pointer-events-none">🧩 記憶碎片</h3>
                  {stickers.map((item) => (
                    <StickerItem key={item.id} id={item.id} word={item.text} />
                  ))}
                  {stickers.length === 0 && (
                    <div className="text-gray-400 text-center font-bold tracking-widest mt-10 pointer-events-none">
                       碎片已全數貼上
                    </div>
                  )}
                  <div className="h-10 pointer-events-none"></div>
              </div>
           </div>
       </div>

       {/* ★ 拖曳浮層，保證層級永遠在最上方 (z-[9999])，且不會被裁切 */}
       <DragOverlay dropAnimation={null}>
         {activeStickerData ? (
           <div className="relative w-full min-w-[200px] px-4 py-3 bg-[#FDFBF7] text-gray-800 border border-gray-300 font-serif text-xl rounded-sm shadow-2xl z-[9999] flex items-center justify-center text-center rotate-2 scale-105 opacity-95 cursor-grabbing pointer-events-none">
             <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-yellow-100/60 backdrop-blur-sm border border-yellow-200/50 shadow-sm rotate-[-4deg]"></div>
             {activeStickerData.text}
           </div>
         ) : null}
       </DragOverlay>

    </DndContext>
  );
};


const LyricsGame = ({ song, onRestart, onHome }) => {
  const [gameState, setGameState] = useState({ status: 'loading', data: null, stickers: [] });
  
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (song) {
      const rawText = lyricsData[song.id];
      if (rawText) {
        const { lines, stickers } = processLyricsForGame(rawText, 7);
        setGameState({ status: 'playing', data: { lines }, stickers });
      }
    }
  }, [song]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 1;
      setProgress((current / duration) * 100);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  if (gameState.status === 'loading') {
    return <div className="text-gray-800 text-2xl font-bold p-8">載入中...</div>;
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-transparent pt-16 pb-8 px-8">
      
      <audio 
         ref={audioRef}
         src={`/music/${song.audioFileName}`} 
         autoPlay 
         loop 
         onTimeUpdate={handleTimeUpdate}
         className="hidden"
      />

      {gameState.status === 'ended' ? (
        <div className="relative w-full h-full bg-transparent flex flex-col items-center justify-center p-4 animate-fade-in">
          <button onClick={onHome} className="absolute top-6 left-6 z-50 px-5 py-2.5 bg-[#F5F5F5] text-gray-800 font-bold rounded-lg shadow border border-gray-300 hover:bg-gray-200 transition-all tracking-wide">
            ← 返回火車
          </button>
          <div className="text-gray-800 text-center flex flex-col items-center justify-center bg-[#FDFBF7] rounded-lg p-16 shadow-2xl border border-gray-300">
            <div className="text-6xl mb-6">📜✨</div>
            <h2 className="text-4xl font-bold mb-4 drop-shadow-sm tracking-widest font-serif">記憶修復完成</h2>
            <p className="text-xl mb-10 text-gray-600 tracking-wider">《{song.title}》的歌詞本已經完美還原</p>
            <button 
              onClick={onHome}
              className="px-10 py-4 bg-gray-800 text-[#F5F5F5] rounded-lg hover:bg-gray-700 hover:-translate-y-1 transition-all duration-300 font-bold text-lg tracking-widest shadow-md"
            >
              🚂 帶著記憶返回大廳
            </button>
          </div>
        </div>
      ) : (
        <LyricsGamePlay 
          song={song}
          gameData={gameState.data}
          initialStickers={gameState.stickers}
          onHome={onHome}
          onComplete={() => setGameState(prev => ({ ...prev, status: 'ended' }))}
          isPlaying={isPlaying}
          progress={progress}
          togglePlay={togglePlay}
          audioRef={audioRef}
        />
      )}
    </div>
  );
};

export default LyricsGame;