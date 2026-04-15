import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameModes } from '../../data/gameModes';
import { TicketCard } from '../Shared/TicketCard';
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
        <button onClick={togglePlay} className="w-14 h-14 bg-[#FDFBF7] text-gray-700 rounded-full flex items-center justify-center hover:bg-white shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 text-xl font-bold pb-1">
          {isPlaying ? 'II' : '▶'}
        </button>
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between text-xs text-gray-500 font-bold tracking-widest px-1">
            <span>錄音播放中</span>
          </div>
          <div className="w-full h-4 bg-gray-300 rounded-full border border-gray-400 overflow-hidden cursor-pointer relative shadow-inner" onClick={handleProgressClick}>
            <div className="absolute top-0 left-0 h-full bg-red-500 transition-all duration-75 pointer-events-none" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrainPage = forwardRef(({ onSelectMode, onBack, ticket, cover, coverStatus, swapped, faceswapStatus, lyrics, recording, mainSong, onPauseMusic, layoutConfig, hasEnteredCarriage }, ref) => {
  const scrollRef = useRef(null);
  const [lightbox, setLightbox] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const dragThreshold = useRef(0);

  const getHintModeId = () => {
    if (!ticket) return 'mood-train';
    if (!mainSong) return 'ar';
    if (!cover && coverStatus !== 'generating') return 'ai-zimage';
    if (!lyrics) return 'lyrics';
    if (mainSong && mainSong.hasFace && !swapped && faceswapStatus !== 'generating') {
      return 'faceswap';
    }
    if (!recording) return 'sing-along';
    return 'capsule';
  };

  const scrollToHintCarriage = () => {
    if (!scrollRef.current) return;

    const hintId = getHintModeId();
    const targetIndex = gameModes.findIndex(m => m.id === hintId);
    const safeIndex = targetIndex === -1 ? 0 : targetIndex;

    const containerWidth = scrollRef.current.offsetWidth;
    const carriageWidth = 682;
    const headWidth = 682;
    const paddingLeft = 80;
    const target = (paddingLeft + headWidth) + (safeIndex * carriageWidth) - (containerWidth / 2) + (carriageWidth / 2);
    scrollRef.current.scrollTo({ left: target, behavior: 'auto' });
  };

  useImperativeHandle(ref, () => ({
    resetTrainPosition: () => { scrollToHintCarriage(); }
  }));

  useEffect(() => {
    scrollToHintCarriage();
    const frame = requestAnimationFrame(() => scrollToHintCarriage());
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    dragThreshold.current = e.pageX;
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleCarriageClick = (mode, e) => {
    const distance = Math.abs(e.pageX - dragThreshold.current);
    if (distance > 10) return;
    onSelectMode(mode);
  };

  const hintModeId = getHintModeId();

  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative font-sans">

      <div className="absolute inset-x-0 bottom-0 w-full min-h-[500px] pointer-events-none z-0">
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none z-0"
          style={{
            height: '400px',
            backgroundImage: "url('/rail.png')",
            backgroundSize: 'auto 100%',
            backgroundPosition: 'center bottom',
            backgroundRepeat: 'repeat-x',
          }}
        />
      </div>

      <div className="w-full flex flex-col items-center absolute top-[30px] md:top-[40px] left-0 z-30 pointer-events-none shrink-0">
        <div className="flex flex-row justify-center items-center gap-4 w-full max-w-[1500px] h-[290px] pointer-events-auto px-2">
          {ticket && (
            <motion.div initial={{ opacity: 0, y: -20, rotate: -5 }} animate={{ opacity: 1, y: 0, rotate: -2 }} whileHover={{ rotate: 0, scale: 1.05 }} onClick={() => setLightbox({ type: 'ticket', data: ticket })} className="cursor-pointer z-50 drop-shadow-md flex items-center justify-center w-[450px] h-[225px] shrink-0">
              <div className="relative transform scale-[0.7] origin-center">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-10 bg-yellow-100/80 backdrop-blur-[2px] shadow-sm z-30 rotate-2 border border-yellow-200/50"></div>
                <TicketCard captureImg={ticket.image} moodResult={ticket.mood} size="normal" />
              </div>
            </motion.div>
          )}

          {cover && (
            <motion.div initial={{ opacity: 0, y: -20, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 1 }} whileHover={{ rotate: 0, scale: 1.05 }} onClick={() => setLightbox({ type: 'cover', data: cover })} className="cursor-pointer z-40 drop-shadow-md w-[270px] shrink-0 flex items-center justify-center">
              <div className="relative w-full aspect-[16/9]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#fca5a5]/80 backdrop-blur-[2px] shadow-sm z-30 rotate-[-3deg] border border-red-200/50"></div>
                <div className="bg-white p-2 pb-1 border border-gray-300 flex flex-col pointer-events-none w-full h-full">
                  <img src={cover.image} className="w-full h-full object-cover border border-gray-200" draggable="false" />
                </div>
              </div>
            </motion.div>
          )}

          {recording && (
            <motion.div initial={{ opacity: 0, y: -20, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: -1 }} whileHover={{ rotate: 0, scale: 1.05 }} onClick={() => setLightbox({ type: 'recording', data: recording })} className="cursor-pointer z-20 drop-shadow-md w-[190px] shrink-0 flex items-center justify-center">
              <div className="relative transform scale-[0.7] origin-center pointer-events-none">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-10 bg-green-100/80 backdrop-blur-[2px] shadow-sm z-30 rotate-1 border border-green-300/50"></div>
                <CassetteUI title={recording.title} color="bg-green-700" size="normal" image={mainSong?.cassetteImage} />
              </div>
            </motion.div>
          )}

          {swapped && (
            <motion.div initial={{ opacity: 0, y: -20, rotate: -3 }} animate={{ opacity: 1, y: 0, rotate: -1 }} whileHover={{ rotate: 0, scale: 1.05 }} onClick={() => setLightbox({ type: 'swapped', data: swapped })} className="cursor-pointer z-30 drop-shadow-md w-[270px] shrink-0 flex items-center justify-center">
              <div className="relative w-full aspect-[16/9]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#bae6fd]/80 backdrop-blur-[2px] shadow-sm z-30 rotate-[2deg] border border-blue-200/50"></div>
                <div className="bg-white p-2 pb-1 border border-gray-300 flex flex-col pointer-events-none w-full h-full">
                  <img src={swapped.image} className="w-full h-full object-cover border border-gray-200" draggable="false" />
                </div>
              </div>
            </motion.div>
          )}

          {lyrics && (
            <motion.div initial={{ opacity: 0, y: -20, rotate: 4 }} animate={{ opacity: 1, y: 0, rotate: 2 }} whileHover={{ rotate: 0, scale: 1.05 }} onClick={() => setLightbox({ type: 'lyrics', data: lyrics })} className="cursor-pointer z-20 drop-shadow-md w-[185px] shrink-0 flex items-center justify-center">
              <div className="relative w-full h-[220px]">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-5 bg-yellow-100/80 backdrop-blur-[2px] shadow-sm z-30 rotate-[-2deg] border border-yellow-300/50"></div>
                <div className="bg-[#FCFBF4] p-3 border border-[#C0B8A3] w-full h-full flex flex-col relative overflow-hidden pointer-events-none mt-2 shadow-inner">

                  <img src="/images/note_1.png" alt="note" className="absolute top-4 left-2 w-4 h-4 opacity-40 -rotate-12" />
                  <img src="/images/note_2.png" alt="note" className="absolute bottom-6 right-2 w-5 h-5 opacity-30 rotate-12" />

                  <div className="border-b-[2px] border-[#C09668]/60 pb-1 mb-2 shrink-0 text-center relative z-10">
                    <h3 className="text-[14px] font-bold font-serif text-[#C09668] tracking-widest truncate">{lyrics.title}</h3>
                  </div>

                  <div className="text-[10px] text-gray-700 font-bold leading-tight font-serif whitespace-pre-wrap opacity-80 relative z-10">{lyrics.content.substring(0, 120)}...</div>
                  <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#FCFBF4] to-transparent z-20"></div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {!hasEnteredCarriage && (
        <div className="absolute w-full text-center z-20 pointer-events-none bottom-[500px]">
          <h2 className="text-5xl font-bold text-[#FDFBF7] drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)] tracking-widest">點選車廂，進入體驗</h2>
        </div>
      )}

      <div
        className="absolute bottom-[25px] w-full h-[520px] overflow-hidden z-40 shrink-0 pointer-events-none"
      >
        <div
          ref={scrollRef}
          className={`w-full h-[540px] overflow-x-scroll overflow-y-hidden no-scrollbar flex items-start pt-4 pb-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} pointer-events-none`}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div className="flex items-end px-20 min-w-max h-[455px] relative pointer-events-auto">
            <div className="relative w-[682px] h-full flex items-center justify-center shrink-0 z-20 pointer-events-none">
              <img src="/images/train-head.png" alt="train head" className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl" draggable="false" style={{ transform: 'translateY(-6px)' }} />
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
                  onClickCapture={(e) => { if (isLocked) return; handleCarriageClick(mode, e); }}
                  className={`group relative w-[682px] h-full flex flex-col items-center justify-center shrink-0 z-10 hover:z-50 ${isLocked ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}`}
                >
                  {hintModeId === mode.id && !isLocked && (
                    <div className="absolute top-10 transform -translate-x-1/2 z-50 flex flex-col items-center animate-bounce pointer-events-none mb-1">
                      <img src="/images/arrow.png" alt="箭頭" className="w-16 h-16 drop-shadow-md" />
                    </div>
                  )}

                  <img
                    src="/images/train.png"
                    alt="train car"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                    style={{ mixBlendMode: 'multiply', transform: 'translateY(-3px)' }}
                    draggable="false"
                  />

                  <div className="absolute bottom-[calc(28%+10px)] left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center justify-center w-[60%] pointer-events-none">
                    <div className="absolute bottom-full mb-4 w-max flex justify-center z-[60]">
                      {isAiCover && coverStatus === 'generating' && <div className="bg-amber-100 text-amber-700 px-6 py-2 text-base rounded-full font-bold shadow-md border border-amber-200">正在繪製封面...</div>}
                      {isAiCover && coverStatus === 'done' && <div className="bg-emerald-100 text-emerald-700 px-6 py-2 text-base rounded-full font-bold shadow-md animate-bounce border border-emerald-200">封面繪製完成</div>}
                      {isFaceSwap && faceswapStatus === 'generating' && <div className="bg-amber-100 text-amber-700 px-6 py-2 text-base rounded-full font-bold shadow-md border border-amber-200">正在沖洗封面...</div>}
                      {isFaceSwap && faceswapStatus === 'done' && <div className="bg-emerald-100 text-emerald-700 px-6 py-2 text-base rounded-full font-bold shadow-md animate-bounce border border-emerald-200">封面沖洗完成</div>}
                      {isFaceSwap && mainSong && !mainSong.hasFace && faceswapStatus === 'idle' && <div className="bg-gray-800 text-white px-5 py-2 text-base rounded-full font-bold shadow-md border border-gray-600">這首歌的封面不適用此體驗喔</div>}
                    </div>

                    <div className="w-full transition-all duration-300 relative flex items-center justify-center py-2">
                      <h3 className={`text-4xl font-bold tracking-[0.2em] transition-colors duration-300 ml-2 translate-y-[3px] ${isLocked ? 'text-gray-400 opacity-60' : 'text-[#FDFBF7] group-hover:text-white'}`}>
                        {mode.title}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <div className="relative w-[682px] h-full flex items-center justify-center shrink-0 z-20 pointer-events-none transform scale-x-[-1]">
              <img src="/images/train-head.png" alt="train tail" className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl" draggable="false" style={{ transform: 'translateY(-6px)' }} />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-8 select-none pointer-events-auto">

            <button onClick={() => setLightbox(null)} className="fixed top-8 right-8 md:top-12 md:right-12 w-14 h-14 flex items-center justify-center bg-[#FDFBF7] text-gray-700 hover:bg-white shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-gray-100 rounded-full text-4xl font-bold z-[120]">
              ×
            </button>

            <motion.div initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }} transition={{ type: "spring", damping: 20 }} onClick={(e) => e.stopPropagation()} className="relative flex flex-col items-center justify-center max-h-full max-w-full">

              {lightbox.type === 'ticket' && (
                <div className="relative flex flex-col items-center drop-shadow-2xl">
                  <div className="relative mt-6">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-10 bg-yellow-100/90 backdrop-blur-[2px] shadow-sm z-[100] rotate-2 border border-yellow-300"></div>
                    <TicketCard captureImg={lightbox.data.image} moodResult={lightbox.data.mood} size="large" />
                  </div>
                </div>
              )}

              {lightbox.type === 'cover' && (
                <div className="bg-[#FDFBF7] p-4 pb-14 rounded-none shadow-xl border border-gray-200 flex flex-col relative w-[650px]">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-10 bg-[#fca5a5]/90 backdrop-blur-[2px] shadow-sm z-[100] rotate-[-2deg] border border-red-300"></div>
                  <img src={lightbox.data.image} className="w-full aspect-[16/9] object-cover border border-gray-300 mt-2" draggable="false" />
                  <div className="absolute bottom-4 w-full left-0 text-center"><h3 className="text-3xl font-bold text-gray-800 tracking-widest font-serif">{lightbox.data.title}</h3></div>
                </div>
              )}

              {lightbox.type === 'swapped' && (
                <div className="bg-[#FDFBF7] p-4 pb-14 rounded-none shadow-xl border border-gray-200 flex flex-col relative w-[650px]">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-40 h-10 bg-[#bae6fd]/90 backdrop-blur-[2px] shadow-sm z-[100] rotate-[2deg] border border-blue-300"></div>
                  <img src={lightbox.data.image} className="w-full object-contain border border-gray-200 aspect-video mt-2 bg-gray-100 rounded-none" draggable="false" />
                  <div className="absolute bottom-4 w-full left-0 text-center"><h3 className="text-3xl font-bold text-gray-800 tracking-widest font-serif">{lightbox.data.title}</h3></div>
                </div>
              )}

              {lightbox.type === 'lyrics' && (
                <div className="relative flex flex-col items-center pt-4 w-[500px]">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-40 h-10 bg-yellow-100/90 backdrop-blur-[2px] shadow-sm z-[100] rotate-[-1deg] border border-yellow-300"></div>

                  {/* Lightbox 點開的大歌詞本：統一背景與設計 */}
                  <div className="bg-[#FCFBF4] p-10 pt-12 rounded-none shadow-xl border border-[#D2A679]/40 w-full max-h-[85vh] flex flex-col overflow-y-auto custom-scrollbar mt-2 relative overflow-hidden">

                    {/* 散落的音符裝飾 */}
                    <img src="/images/note_1.png" alt="note" className="absolute top-8 left-8 w-8 h-8 opacity-30 -rotate-12 pointer-events-none" />
                    <img src="/images/note_2.png" alt="note" className="absolute bottom-20 right-8 w-10 h-10 opacity-20 rotate-12 pointer-events-none" />
                    {/* <img src="/images/note_3.png" alt="note" className="absolute top-1/3 -right-2 w-8 h-8 opacity-25 rotate-45 pointer-events-none" /> */}

                    {/* 加粗的分隔線 */}
                    <h2 className="text-3xl font-bold text-[#C09668] text-center border-b-[3px] border-[#C09668]/60 pb-3 mb-6 tracking-widest font-serif relative z-10">{lightbox.data.title}</h2>

                    <div className="text-lg text-gray-700 leading-loose font-serif whitespace-pre-wrap text-center px-4 custom-scrollbar font-bold relative z-10">
                      {lightbox.data.content}
                    </div>
                  </div>
                </div>
              )}

              {lightbox.type === 'recording' && (
                <div className="bg-[#FDFBF7] p-10 rounded-none shadow-xl border border-gray-200 w-[500px] flex flex-col items-center relative pt-12">
                  <div className="my-6 relative transform scale-125 origin-center">
                    <div className="absolute -top-[50px] left-1/2 -translate-x-1/2 w-32 h-10 bg-green-100/90 backdrop-blur-[2px] shadow-sm z-[100] rotate-[1deg] border border-green-300 z-50"></div>
                    <CassetteUI title={lightbox.data.title} color="bg-gray-800" size="normal" image={mainSong?.cassetteImage} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 text-center border-b-2 border-gray-300 pb-4 mb-2 tracking-widest font-serif w-full mt-6">{lightbox.data.title} - 金曲錄音</h2>
                  <CustomAudioPlayer src={lightbox.data.audioUrl} onPlayCallback={() => { if (onPauseMusic) onPauseMusic(); }} />
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default TrainPage;