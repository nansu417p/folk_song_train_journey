import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameModes } from '../../data/gameModes';
import TicketCard from '../Shared/TicketCard';
import CassetteUI from '../Shared/CassetteUI';

const CustomAudioPlayer = ({ src, onPlayCallback }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (onPlayCallback) onPlayCallback();
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audioRef.current.currentTime = percent * audioRef.current.duration;
  };

  return (
    <div className="w-full bg-[#EAEAEA] border-2 border-gray-400 rounded-lg p-5 shadow-inner flex flex-col gap-4 mt-6 z-10 relative">
      <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} className="hidden" />
      
      <div className="flex items-center gap-5">
        <button 
          onClick={togglePlay} 
          className="w-14 h-14 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-500 shadow-[2px_2px_0_#7f1d1d] active:shadow-none active:translate-y-[2px] transition-all border-2 border-red-800 text-xl pl-1"
        >
          {isPlaying ? 'II' : '▶'}
        </button>
        
        <div className="flex-1 flex flex-col gap-2">
           <div className="flex justify-between text-xs text-gray-500 font-bold tracking-widest px-1">
              <span>VOICE RECORDING</span>
              <span>{isPlaying ? 'PLAYING...' : 'READY'}</span>
           </div>
           <div 
             className="w-full h-4 bg-gray-300 rounded-full border border-gray-400 overflow-hidden cursor-pointer relative shadow-inner" 
             onClick={handleProgressClick}
           >
             <div className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-75 pointer-events-none" style={{ width: `${progress}%` }}></div>
           </div>
        </div>
      </div>
    </div>
  );
};

const TrainPage = ({ onSelectMode, onBack, ticket, cover, coverStatus, swapped, faceswapStatus, lyrics, recording, mainSong, onPauseMusic }) => {
  const scrollRef = useRef(null);
  const [lightbox, setLightbox] = useState(null); 
  
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const dragThreshold = useRef(0); 

  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    dragThreshold.current = e.pageX; 
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault(); 
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; 
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleCarriageClick = (mode, e) => {
    const distance = Math.abs(e.pageX - dragThreshold.current);
    if (distance > 10) {
      return; 
    }
    onSelectMode(mode);
  };

  const getHintModeId = () => {
    if (!ticket) return 'mood-train';
    if (!mainSong) return 'ar';
    if (!cover) return 'ai-zimage';
    if (mainSong && mainSong.hasFace && !swapped) return 'faceswap';
    if (!lyrics) return 'lyrics';
    if (!recording) return 'sing-along';
    return 'capsule';
  };
  const hintModeId = getHintModeId();

  return (
    <div className="w-full h-full bg-transparent flex flex-col justify-between overflow-hidden relative pt-6 pb-6">
      
      <div className="w-full flex flex-col items-center relative z-20 shrink-0">
        <div className="absolute top-0 left-10">
          <button 
            onClick={onBack} 
            className="px-6 py-3 bg-[#FDFBF7]/90 text-gray-800 font-bold text-lg rounded-lg border-2 border-gray-400 shadow-[4px_4px_0_#9ca3af] hover:bg-gray-100 hover:translate-y-[2px] hover:shadow-[2px_2px_0_#9ca3af] transition-all tracking-widest flex items-center w-max"
          >
            ← 回首頁
          </button>
        </div>
        
        <h3 className="text-gray-500 font-bold tracking-widest text-sm mb-4 bg-[#FDFBF7]/80 px-4 py-1 rounded-full border border-gray-300 backdrop-blur-sm shadow-sm pointer-events-none mt-2">
          — 您的旅程收集品 —
        </h3>

        <div className="flex flex-row justify-center items-center gap-8 w-full max-w-6xl h-[140px] pointer-events-auto">
            
            {ticket && (
              <motion.div 
                initial={{ opacity: 0, y: -20, rotate: -5 }} animate={{ opacity: 1, y: 0, rotate: -2 }} whileHover={{ rotate: 0, scale: 1.05 }} 
                onClick={() => setLightbox({ type: 'ticket', data: ticket })}
                className="cursor-pointer z-50 drop-shadow-md flex items-center justify-center w-[260px] h-[120px]"
              >
                <div className="relative transform scale-[0.5] origin-center">
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-10 bg-yellow-100/80 backdrop-blur-[2px] shadow-sm z-30 rotate-2 border border-yellow-200/50"></div>
                   <TicketCard captureImg={ticket.image} moodResult={ticket.mood} size="normal" />
                </div>
              </motion.div>
            )}

            {cover && (
              <motion.div 
                initial={{ opacity: 0, y: -20, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 1 }} whileHover={{ rotate: 0, scale: 1.05 }} 
                onClick={() => setLightbox({ type: 'cover', data: cover })}
                className="cursor-pointer z-40 drop-shadow-md w-[170px] flex items-center justify-center"
              >
                <div className="relative w-full aspect-[1024/720]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-[#fca5a5]/80 backdrop-blur-[2px] shadow-sm z-30 rotate-[-3deg] border border-red-200/50"></div>
                  <div className="bg-white p-1.5 pb-1 border border-gray-300 flex flex-col pointer-events-none w-full h-full">
                    <img src={cover.image} className="w-full h-full object-cover border border-gray-200" draggable="false" />
                  </div>
                </div>
              </motion.div>
            )}

            {swapped && (
              <motion.div 
                initial={{ opacity: 0, y: -20, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: -1 }} whileHover={{ rotate: 0, scale: 1.05 }} 
                onClick={() => setLightbox({ type: 'swapped', data: swapped })}
                className="cursor-pointer z-30 drop-shadow-md w-[170px] flex items-center justify-center"
              >
                <div className="relative w-full aspect-[1024/720]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-[#bae6fd]/80 backdrop-blur-[2px] shadow-sm z-30 rotate-[2deg] border border-blue-200/50"></div>
                  <div className="bg-white p-1.5 pb-1 border border-gray-300 flex flex-col pointer-events-none w-full h-full">
                    <img src={swapped.image} className="w-full h-full object-cover border border-gray-200" draggable="false" />
                  </div>
                </div>
              </motion.div>
            )}

            {lyrics && (
              <motion.div 
                initial={{ opacity: 0, y: -20, rotate: 4 }} animate={{ opacity: 1, y: 0, rotate: 2 }} whileHover={{ rotate: 0, scale: 1.05 }} 
                onClick={() => setLightbox({ type: 'lyrics', data: lyrics })}
                className="cursor-pointer z-20 drop-shadow-md w-[110px] flex items-center justify-center"
              >
                <div className="relative w-full h-[120px]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-yellow-100/80 backdrop-blur-[2px] shadow-sm z-30 rotate-[-2deg] border border-yellow-300/50"></div>
                  <div className="bg-[#FDFBF7] p-2 border border-[#C0B8A3] w-full h-full flex flex-col relative overflow-hidden pointer-events-none mt-2">
                     <div className="text-[6px] text-gray-500 leading-tight font-serif whitespace-pre-wrap opacity-70">
                       {lyrics.content.substring(0, 100)}...
                     </div>
                     <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#FDFBF7] to-transparent"></div>
                  </div>
                </div>
              </motion.div>
            )}

            {recording && (
              <motion.div 
                initial={{ opacity: 0, y: -20, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: -1 }} whileHover={{ rotate: 0, scale: 1.05 }} 
                onClick={() => setLightbox({ type: 'recording', data: recording })}
                className="cursor-pointer z-20 drop-shadow-md w-[120px] flex items-center justify-center"
              >
                <div className="relative transform scale-[0.45] origin-center pointer-events-none">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-10 bg-green-100/80 backdrop-blur-[2px] shadow-sm z-30 rotate-1 border border-green-300/50"></div>
                  <CassetteUI title={recording.title} color="bg-green-700" size="normal" />
                </div>
              </motion.div>
            )}
        </div>
      </div>
      
      <div className="text-center z-10 pointer-events-none mt-auto mb-2 shrink-0">
        <h2 className="text-5xl font-bold mb-2 text-gray-800 drop-shadow-md tracking-widest">選擇旅程方式</h2>
        <p className="text-gray-700 font-bold text-xl drop-shadow tracking-wider">按住滑鼠左右拖曳火車</p>
      </div>

      <div className="w-full h-[400px] overflow-hidden relative z-10 shrink-0">
        <div 
          ref={scrollRef}
          className={`w-full h-[420px] overflow-x-scroll overflow-y-hidden no-scrollbar flex items-start pt-4 pb-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div className="flex items-end px-20 min-w-max h-[350px] relative">
            
            <div className="relative w-[525px] h-full flex items-center justify-center shrink-0 z-20 pointer-events-none">
              <img src="/images/train-head.png" alt="train head" className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl" draggable="false" />
            </div>

            {gameModes.map((mode) => {
              const isAiCover = mode.id === 'ai-zimage';
              const isFaceSwap = mode.id === 'faceswap';
              const isLocked = mode.locked || (isFaceSwap && mainSong && !mainSong.hasFace);

              return (
              <motion.div
                key={mode.id}
                whileHover={isLocked ? {} : { scale: 1.02 }} 
                whileTap={isLocked ? {} : { scale: 0.98 }}
                onClickCapture={(e) => {
                  if (isLocked) return;
                  handleCarriageClick(mode, e);
                }}
                className={`
                  group relative w-[525px] h-full flex flex-col items-center justify-center shrink-0 
                  z-10 hover:z-50
                  ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
                `}
              >
                
                {/* ★ 圖片箭頭設定區 */}
                {/* - top-[-40px] 控制高度，數字越小(-50px)越高，越大(-20px)越低
                  - w-12 h-12 控制圖片大小
                */}
                {hintModeId === mode.id && !isLocked && (
                  <div className="absolute top-10  transform -translate-x-1/2 z-50 flex flex-col items-center animate-bounce pointer-events-none mb-1">
                     <img src="/images/arrow.png" alt="箭頭" className="w-12 h-12 drop-shadow-md" />
                  </div>
                )}

                <img 
                  src="/images/train.jpg" 
                  alt="train car" 
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                  style={{ mixBlendMode: 'multiply' }} 
                  draggable="false"
                />
                
                <div className="absolute bottom-[28%] left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center justify-center w-[60%] pointer-events-none">
                  
                  <div className="absolute bottom-full mb-3 w-max flex justify-center z-[60]">
                    {isAiCover && coverStatus === 'generating' && <div className="bg-yellow-400 text-gray-800 px-4 py-1.5 text-sm rounded-full font-bold shadow-md animate-pulse border border-yellow-500">⏳ 畫家繪製中...</div>}
                    {isAiCover && coverStatus === 'done' && !cover && <div className="bg-green-500 text-white px-4 py-1.5 text-sm rounded-full font-bold shadow-[0_0_15px_#22c55e] animate-bounce border border-green-400">✨ 繪製完成！點擊入內領取</div>}
                    {isFaceSwap && faceswapStatus === 'generating' && <div className="bg-blue-400 text-gray-800 px-4 py-1.5 text-sm rounded-full font-bold shadow-md animate-pulse border border-blue-500">⏳ 融合五官中...</div>}
                    {isFaceSwap && faceswapStatus === 'done' && !swapped && <div className="bg-green-500 text-white px-4 py-1.5 text-sm rounded-full font-bold shadow-[0_0_15px_#22c55e] animate-bounce border border-green-400">✨ 寫真完成！點擊入內領取</div>}
                    {isFaceSwap && mainSong && !mainSong.hasFace && faceswapStatus === 'idle' && <div className="bg-gray-800 text-white px-4 py-1.5 text-sm rounded-full font-bold shadow-md border border-gray-600">🔒 此歌曲無人臉可替換</div>}
                  </div>

                  <div className={`
                    w-full bg-gradient-to-b from-[#2A2A2A] to-[#111111] px-6 py-2.5 rounded-sm border-[3px] border-gray-500 shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_1px_3px_rgba(255,255,255,0.3)] transition-all duration-300 relative flex items-center justify-center
                    ${isLocked ? '' : 'group-hover:border-gray-400 group-hover:from-[#333] group-hover:to-[#1a1a1a]'}
                  `}>
                    <div className="absolute top-1 left-1 w-2 h-2 rounded-full bg-gray-400 shadow-inner border border-gray-600 flex items-center justify-center"><div className="w-1 h-[1px] bg-gray-600 rotate-45"></div></div>
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gray-400 shadow-inner border border-gray-600 flex items-center justify-center"><div className="w-1 h-[1px] bg-gray-600 -rotate-45"></div></div>
                    <div className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-gray-400 shadow-inner border border-gray-600 flex items-center justify-center"><div className="w-1 h-[1px] bg-gray-600 -rotate-12"></div></div>
                    <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-gray-400 shadow-inner border border-gray-600 flex items-center justify-center"><div className="w-1 h-[1px] bg-gray-600 rotate-90"></div></div>
                    
                    <h3 className={`text-2xl font-bold tracking-[0.2em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] transition-colors duration-300 ml-2 ${isLocked ? 'text-gray-500' : 'text-yellow-400 group-hover:text-yellow-300'}`}>
                      {mode.title}
                    </h3>
                  </div>
                </div>
              </motion.div>
              );
            })}

            <div className="relative w-[525px] h-full flex items-center justify-center shrink-0 z-20 pointer-events-none transform scale-x-[-1]">
              <img src="/images/train-head.png" alt="train tail" className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl" draggable="false" />
            </div>

          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-8 select-none"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }} transition={{ type: "spring", damping: 20 }}
              onClick={(e) => e.stopPropagation()} 
              className="relative flex flex-col items-center justify-center max-h-full max-w-full"
            >
               {lightbox.type === 'ticket' && (
                 <div className="relative flex flex-col items-center drop-shadow-2xl">
                   <div className="transform scale-125 md:scale-150 origin-center relative mt-6">
                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-10 bg-yellow-100/90 backdrop-blur-[2px] shadow-sm z-[100] rotate-2 border border-yellow-300"></div>
                     <TicketCard captureImg={lightbox.data.image} moodResult={lightbox.data.mood} size="normal" />
                   </div>
                 </div>
               )}

               {lightbox.type === 'cover' && (
                 <div className="bg-white p-4 pb-14 rounded-sm shadow-2xl border border-gray-200 flex flex-col relative w-[800px]">
                   <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-10 bg-[#fca5a5]/90 backdrop-blur-[2px] shadow-sm z-[100] rotate-[-2deg] border border-red-300"></div>
                   <img src={lightbox.data.image} className="w-full aspect-[1024/720] object-cover border border-gray-300 mt-2" draggable="false" />
                   <div className="absolute bottom-4 w-full left-0 text-center"><h3 className="text-3xl font-bold text-gray-800 tracking-widest font-serif">{lightbox.data.title}</h3></div>
                 </div>
               )}

               {lightbox.type === 'swapped' && (
                 <div className="bg-white p-4 pb-14 rounded-sm shadow-2xl border border-gray-200 flex flex-col relative w-[800px]">
                   <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-10 bg-[#bae6fd]/90 backdrop-blur-[2px] shadow-sm z-[100] rotate-[2deg] border border-blue-300"></div>
                   <img src={lightbox.data.image} className="w-full object-cover border border-gray-300 aspect-[1024/720] mt-2" draggable="false" />
                   <div className="absolute bottom-4 w-full left-0 text-center"><h3 className="text-3xl font-bold text-gray-800 tracking-widest font-serif">{lightbox.data.title}</h3></div>
                 </div>
               )}

               {lightbox.type === 'lyrics' && (
                 <div className="relative flex flex-col items-center pt-4">
                   <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-10 bg-yellow-100/90 backdrop-blur-[2px] shadow-sm z-[100] rotate-[-1deg] border border-yellow-300"></div>
                   <div className="bg-[#FDFBF7] p-10 pt-12 rounded-sm shadow-2xl border border-[#C0B8A3] w-[500px] max-h-[85vh] flex flex-col overflow-y-auto custom-scrollbar mt-2">
                     <h2 className="text-3xl font-bold text-gray-800 text-center border-b-2 border-gray-300 pb-4 mb-6 tracking-widest font-serif">{lightbox.data.title}</h2>
                     <div className="text-lg text-gray-700 leading-loose font-serif whitespace-pre-wrap text-center px-4">
                       {lightbox.data.content}
                     </div>
                   </div>
                 </div>
               )}

               {lightbox.type === 'recording' && (
                 <div className="bg-[#FDFBF7] p-10 rounded-sm shadow-2xl border border-[#C0B8A3] w-[500px] flex flex-col items-center relative pt-12">
                   
                   <div className="my-6 relative transform scale-125 origin-center">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-10 bg-green-100/90 backdrop-blur-[2px] shadow-sm z-[100] rotate-[1deg] border border-green-300 z-50"></div>
                      <CassetteUI title={lightbox.data.title} color="bg-gray-800" size="normal" />
                   </div>

                   <h2 className="text-2xl font-bold text-gray-800 text-center border-b-2 border-gray-300 pb-4 mb-2 tracking-widest font-serif w-full mt-6">
                     專屬演唱錄音
                   </h2>

                   <CustomAudioPlayer 
                     src={lightbox.data.audioUrl} 
                     onPlayCallback={() => { if (onPauseMusic) onPauseMusic(); }} 
                   />
                 </div>
               )}

               <button onClick={() => setLightbox(null)} className="absolute -top-12 -right-12 text-white/70 hover:text-white text-4xl font-bold transition-colors z-[110]">
                 ×
               </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TrainPage;