import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext, useDraggable, useDroppable, DragOverlay,
  useSensor, useSensors, PointerSensor
} from '@dnd-kit/core';
import { useDraggable as useScrollDraggable } from 'react-use-draggable-scroll';
import { lyricsData } from '../../../data/lyricsData';
import { CARRIAGE_NAMES } from '../../../data/gameModes';

function StickerItem({ id, word }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id, data: { word } });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={`relative w-full px-4 py-3 bg-white text-gray-700 border border-gray-100 font-serif text-lg md:text-xl rounded-xl shadow-md cursor-grab touch-none select-none flex items-center justify-center text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${isDragging ? 'opacity-0' : ''}`}>
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-yellow-100/60 backdrop-blur-sm border border-yellow-200/50 shadow-sm rotate-[-4deg]"></div>
      {word}
    </div>
  );
}

function DropZone({ id, currentWord, correctWord, isHintActive }) {
  const { isOver, setNodeRef } = useDroppable({ id, data: { correctWord } });
  if (currentWord) {
    return (
      <div className="relative inline-flex items-center justify-center px-4 py-1 mx-2 bg-white border border-gray-100 text-gray-700 shadow-md rounded-xl -rotate-1 font-bold text-xl transition-all z-10">
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-yellow-100/60 backdrop-blur-sm border border-yellow-200/50 shadow-sm rotate-[-4deg]"></div>
        {currentWord}
      </div>
    );
  }
  const shouldGlow = isHintActive && isHintActive.includes(id);
  return (
    <div ref={setNodeRef} className={`inline-flex items-center justify-center min-w-[250px] h-10 mx-2 border-b-4 transition-all duration-300 align-middle ${shouldGlow ? 'border-yellow-400 bg-yellow-100/50 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-105' : 'border-dashed border-gray-400 bg-gray-200/40'} ${isOver ? 'bg-blue-100/50 border-blue-400 scale-110' : ''}`}>
      <span className="text-gray-400 text-sm tracking-widest opacity-50 font-bold">拖曳至此</span>
    </div>
  );
}

const LyricsGamePlay = ({ song, gameData, initialStickers, onHome, onLyricsGenerated, isPlaying, progress, togglePlay, audioRef }) => {
  const [filledGaps, setFilledGaps] = useState({});
  const [stickers, setStickers] = useState(initialStickers);
  const [hintIds, setHintIds] = useState([]);
  const [activeStickerData, setActiveStickerData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const lyricsScrollRef = useRef(null);
  const { events: lyricsScrollEvents } = useScrollDraggable(lyricsScrollRef);
  const stickersScrollRef = useRef(null);
  const { events: stickersScrollEvents } = useScrollDraggable(stickersScrollRef);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    setFilledGaps({});
    setStickers(initialStickers);
    setIsCompleted(false);
  }, [initialStickers]);

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
    if (!sticker) return;
    setActiveStickerData(sticker);

    const emptyGaps = gameData.lines.filter(line => line.isGap && !filledGaps[line.id]);
    let correctGapId = null;
    const fakeGaps = [];

    emptyGaps.forEach(gap => {
      if (gap.text === sticker.text && !correctGapId) correctGapId = gap.id;
      else fakeGaps.push(gap.id);
    });

    let fakeId = fakeGaps.length > 0 ? fakeGaps[Math.floor(Math.random() * fakeGaps.length)] : null;
    setHintIds(fakeId && correctGapId ? [correctGapId, fakeId] : [correctGapId]);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setHintIds([]);
    setActiveStickerData(null);
    if (!over) return;

    const draggedWord = active.data.current.word;
    const correctWord = over.data.current.correctWord;

    if (draggedWord === correctWord) {
      const newFilled = { ...filledGaps, [over.id]: draggedWord };
      setFilledGaps(newFilled);
      setStickers(prev => {
        const newStickers = prev.filter(s => s.id !== active.id);
        if (newStickers.length === 0) {
          setTimeout(() => {
            setIsCompleted(true);
            if (onLyricsGenerated) onLyricsGenerated({ title: song.title, content: lyricsData[song.id] });
          }, 500);
        }
        return newStickers;
      });
    }
  };

  const handleQuickFix = () => {
    const allGaps = {};
    gameData.lines.forEach(line => {
      if (line.isGap) allGaps[line.id] = line.text;
    });
    setFilledGaps(allGaps);
    setStickers([]);
    setIsCompleted(true);
    if (onLyricsGenerated) onLyricsGenerated({ title: song.title, content: lyricsData[song.id] });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="absolute top-6 right-8 z-50 flex gap-4">
        {!isCompleted && (
          <button onClick={handleQuickFix} className="btn-secondary flex items-center">
            貼上全部歌詞
          </button>
        )}
      </div>

      <div className="w-full max-w-6xl h-full flex flex-col bg-[#FDFBF7] rounded-3xl shadow-xl border border-gray-100 overflow-hidden mt-8">
        <div className="w-full bg-[#D64F3E] p-4 px-6 flex justify-between items-center shadow-md z-10 border-b-4 border-[#B83E2F]">
          <div className="flex items-center gap-4 min-w-[200px]">
            <div className="flex items-center justify-center mr-2">
              <img src="/images/cassette.png" alt="Cassette" className="w-12 h-8 object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-3">
                <h2 className="text-[#F5F5F5] text-xl font-bold tracking-widest font-serif drop-shadow">{song.title}</h2>
                <span className="text-white/80 text-sm font-serif tracking-wider">{song.singer}</span>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-6 max-w-xl">
            <button onClick={togglePlay} className="w-12 h-12 bg-[#FDFBF7] text-gray-700 rounded-full flex items-center justify-center shadow-md border border-gray-100 text-xl font-bold pb-1 transition-colors hover:bg-white">
              {isPlaying ? 'II' : '▶'}
            </button>
            <div className="flex-1 h-4 bg-black/30 rounded-full overflow-hidden relative shadow-inner cursor-pointer" onClick={handleProgressClick}>
              <div className="absolute top-0 left-0 h-full bg-yellow-400 transition-all duration-75 ease-linear pointer-events-none" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          <div ref={lyricsScrollRef} {...lyricsScrollEvents} className="flex-[2] bg-white p-8 overflow-y-auto custom-scrollbar relative">
            <p className="text-center text-gray-500 font-bold tracking-widest mb-10 border-b border-dashed border-gray-200 pb-4">拖曳右側的字句，拼貼那時代的歌詞</p>
            <div className="flex flex-col gap-6 text-center font-serif text-xl md:text-2xl text-gray-800 leading-loose font-bold">
              {gameData.lines.map((line) => {
                if (!line.text) return <div key={line.id} className="h-4"></div>;
                if (line.isGap) {
                  return <div key={line.id}><DropZone id={line.id} currentWord={filledGaps[line.id]} correctWord={line.text} isHintActive={hintIds} /></div>;
                }
                return <div key={line.id} className="tracking-wide">{line.text}</div>;
              })}
            </div>
            <div className="h-20"></div>
          </div>

          <div ref={stickersScrollRef} {...stickersScrollEvents} className="flex-[1] bg-[#F9F7F1] p-6 overflow-y-auto custom-scrollbar border-l border-gray-200 shadow-inner flex flex-col items-center gap-6">
            {isCompleted ? (
              <div className="text-center flex flex-col items-center justify-center animate-fade-in-up w-full px-4 mt-20">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 font-serif tracking-widest">歌詞已完整重現</h3>
                <button onClick={onHome} className="btn-secondary w-[80%]">返回車廂</button>
              </div>
            ) : (
              <>
                <h3 className="text-gray-500 font-bold tracking-widest text-sm bg-white px-6 py-2 rounded-full border border-gray-200 mb-2 shadow-sm">散落的字句</h3>
                {stickers.map((item) => <StickerItem key={item.id} id={item.id} word={item.text} />)}
              </>
            )}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeStickerData ? (
          <div className="px-4 py-3 bg-white text-gray-700 border border-gray-100 font-serif text-xl rounded-xl shadow-2xl rotate-2 scale-105 opacity-95">
            {activeStickerData.text}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const LyricsGame = ({ song, onHome, onLyricsGenerated }) => {
  const [gameState, setGameState] = useState({ status: 'loading', data: null, stickers: [] });
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (song) {
      const rawText = lyricsData[song.id];
      if (rawText) {
        const allLines = rawText.split('\n')
          .map(l => l.trim())
          .filter(l => l.length > 0);

        const totalLines = allLines.length;
        const targetGaps = 7;
        const segmentSize = Math.floor(totalLines / targetGaps);

        const chosenIndices = [];

        for (let i = 0; i < targetGaps; i++) {
          const rangeStart = i * segmentSize;
          const rangeEnd = (i === targetGaps - 1) ? totalLines - 1 : (i + 1) * segmentSize - 1;
          const randomIndex = Math.floor(Math.random() * (rangeEnd - rangeStart + 1)) + rangeStart;
          chosenIndices.push(randomIndex);
        }

        const finalLines = allLines.map((text, idx) => ({
          id: `line-${idx}`,
          text: text,
          isGap: chosenIndices.includes(idx)
        }));

        const finalStickers = finalLines
          .filter(l => l.isGap)
          .map(l => ({ id: `sticker-${l.id}`, text: l.text }))
          .sort(() => Math.random() - 0.5);

        setGameState({
          status: 'playing',
          data: { lines: finalLines },
          stickers: finalStickers
        });
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

  if (gameState.status === 'loading') return <div className="text-white text-2xl font-bold p-8">正在尋找散落的筆記...</div>;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-transparent pt-16 pb-8 px-8">
      <div className="absolute top-6 left-0 w-full flex justify-center pointer-events-none z-40">
        <h2 className="text-4xl font-bold text-white tracking-widest drop-shadow-md inline-block font-serif">
          {CARRIAGE_NAMES.LYRICS}
        </h2>
      </div>

      <audio ref={audioRef} src={`/music/${song.audioFileName}`} autoPlay loop onTimeUpdate={handleTimeUpdate} className="hidden" />
      <LyricsGamePlay
        song={song}
        gameData={gameState.data}
        initialStickers={gameState.stickers}
        onHome={onHome}
        onLyricsGenerated={onLyricsGenerated}
        isPlaying={isPlaying}
        progress={progress}
        togglePlay={togglePlay}
        audioRef={audioRef}
      />
    </div>
  );
};

export default LyricsGame;