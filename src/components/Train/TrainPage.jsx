import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useDraggable } from 'react-use-draggable-scroll';
import { gameModes } from '../../data/gameModes';

const TrainPage = ({ onSelectMode, onBack, ticket }) => {
  const scrollRef = useRef();
  const { events } = useDraggable(scrollRef);

  return (
    <div className="w-full h-full bg-transparent flex flex-col justify-center overflow-hidden relative">
      
      {/* 左上角 UI 區域 */}
      <div className="absolute top-6 left-6 z-20 flex flex-col gap-6 items-start">
        <button 
          onClick={onBack} 
          className="px-5 py-2.5 bg-[#F5F5F5]/90 text-gray-800 font-bold rounded-lg shadow border border-gray-300 hover:bg-gray-200 hover:-translate-y-1 transition-all duration-300 tracking-wide flex items-center w-max"
        >
          ← 回首頁
        </button>

        {/* ★ 完整版車票 (縮小為 75%，並加入紙膠帶設計) */}
        {ticket && (
          <motion.div 
            initial={{ opacity: 0, x: -20, rotate: -15 }}
            animate={{ opacity: 1, x: 0, rotate: -6 }}
            transition={{ type: "spring", stiffness: 100, damping: 12 }}
            className="relative origin-top-left scale-75 mt-2 drop-shadow-xl"
          >
            {/* 半透明紙膠帶 (手帳風格) */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-[#fef08a]/60 backdrop-blur-[2px] shadow-sm z-30 rotate-3 border border-yellow-200/50"></div>

            {/* 完整車票 UI (完全複製 MoodTrainGame 的樣式) */}
            <div className="bg-[#EAEAEA] w-[300px] rounded-sm flex flex-col relative overflow-hidden border border-gray-400 p-2">
              <div className="absolute -left-3 top-20 w-6 h-6 bg-transparent rounded-full border-r border-gray-400 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]"></div>
              <div className="absolute -right-3 top-20 w-6 h-6 bg-transparent rounded-full border-l border-gray-400 shadow-[inset_2px_0_4px_rgba(0,0,0,0.1)]"></div>
              
              <div className="border-[3px] border-gray-800 p-4 h-full flex flex-col relative bg-[#FDFBF7]">
                <div className="text-center border-b-2 border-dashed border-gray-500 pb-3 mb-3">
                  <h1 className="text-2xl font-bold text-gray-800 tracking-[0.3em]">臺灣民歌鐵路</h1>
                  <p className="text-xs text-gray-500 mt-1 font-mono">TAIWAN FOLK RAILWAY</p>
                </div>
                <div className="flex justify-between items-center text-gray-800 font-bold text-xl mb-4">
                  <span>現 在</span>
                  <span className="text-sm">➡</span>
                  <span>回 憶</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 mb-4 font-mono">
                  <span>車次: 1970</span>
                  <span>座位: 自由座</span>
                </div>
                <div className="flex items-end gap-3 mt-auto">
                  <div className="w-20 h-24 border-2 border-gray-400 p-1 bg-white rotate-[-3deg] shadow-sm">
                     <img src={ticket.image} alt="passenger" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col pb-1">
                    <span className="text-[10px] text-gray-500 tracking-widest font-bold">心情天氣</span>
                    <span className="text-3xl font-bold text-red-600 tracking-widest">
                      {ticket.mood === 'happy' && "晴 朗"}
                      {ticket.mood === 'sad' && "微 雨"}
                      {ticket.mood === 'neutral' && "平 靜"}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-mono font-bold">No. 8830192</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="text-center mt-10 mb-8 z-10">
        <h2 className="text-5xl font-bold mb-4 text-gray-800 drop-shadow-md">選擇你的旅程方式</h2>
        <p className="text-gray-700 font-bold text-xl drop-shadow">按住滑鼠左右拖曳火車，選擇一種體驗</p>
      </div>

      <div 
        className="w-full overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing flex-1 flex items-center z-10"
        {...events} 
        ref={scrollRef}
      >
        <div className="flex items-end px-20 min-w-max relative translate-y-[10vh]">
          
          <div className="relative w-[525px] h-[375px] flex items-center justify-center shrink-0 z-20">
            <img 
              src="/images/train-head.png" 
              alt="train head" 
              className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl"
            />
          </div>

          {gameModes.map((mode) => (
            <motion.div
              key={mode.id}
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectMode(mode)}
              className={`
                group relative cursor-pointer w-[525px] h-[375px] flex items-center justify-center shrink-0 
                z-10 hover:z-50
                ${mode.locked ? 'opacity-50 cursor-not-allowed grayscale' : ''}
              `}
            >
              <img 
                src="/images/train.jpg" 
                alt="train car" 
                className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                style={{ mixBlendMode: 'multiply' }} 
              />
              
              <div className="relative z-20 flex flex-col items-center justify-center -mt-8">
                <div className="bg-[#F5F5F5]/95 px-8 py-3 rounded-lg border border-gray-300 shadow-md group-hover:bg-white transition-colors duration-300">
                  <h3 className="text-3xl font-bold tracking-widest text-gray-800 drop-shadow-sm">
                    {mode.title}
                  </h3>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainPage;