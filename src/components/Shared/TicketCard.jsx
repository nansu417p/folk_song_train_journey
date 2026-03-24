import React from 'react';

export const moodSettings = {
  happy: { text: '晴朗', color: 'text-red-600', bgColor: 'bg-red-600' },
  sad: { text: '微雨', color: 'text-blue-700', bgColor: 'bg-blue-600' },
  neutral: { text: '平靜', color: 'text-gray-700', bgColor: 'bg-gray-600' },
};

export const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
};

export const TicketCard = ({ captureImg, moodResult, size = "normal" }) => {
  const isLarge = size === "large";
  const currentMood = moodSettings[moodResult] || moodSettings.neutral;
  const todayStr = getTodayString();
  
  const stationSize = isLarge ? "text-4xl" : "text-xl";
  const labelSize = isLarge ? "text-[12px]" : "text-[8px]";
  const moodTextSize = isLarge ? "text-3xl" : "text-lg";
  const paddingClass = isLarge ? "p-4" : "p-2.5";
  const gapClass = isLarge ? "gap-2" : "gap-1";

  return (
    // ★ 修改：
    // 1. 將 border-[4px] border-gray-800 修改為 border border-gray-300，使其與其他卡片風格一致
    // 2. 陰影保持為 shadow-md 或 shadow-xl (基於 size)
    <div className={`relative ${isLarge ? 'w-[750px] h-[320px] shadow-xl' : 'w-[560px] h-[240px] shadow-md'} bg-[#FDFBF7] flex flex-row rounded-sm border border-gray-300 overflow-hidden font-serif shrink-0`}>
      
      {/* 左側：心情寫真 */}
      {/* ★ 修改：將 border-r-[2px] 修改為 border-r，使其調細 */}
      <div className="w-[55%] h-full relative overflow-hidden bg-gray-200 shrink-0 border-r border-gray-300">
        {captureImg ? (
          <img src={captureImg} className="w-full h-full object-cover grayscale-[20%] contrast-110" alt="心情寫真" draggable="false" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold tracking-widest text-sm bg-gray-100">影像讀取中...</div>
        )}
        
        <div className="absolute bottom-4 left-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-20">
           <div className={`${isLarge ? 'text-4xl' : 'text-2xl'} font-black tracking-widest mb-1 leading-none text-left`}>民歌旅程</div>
           {/* <div className={`${isLarge ? 'text-sm' : 'text-[10px]'} font-bold opacity-90 tracking-widest leading-none mt-2 text-left`}>民歌車站．二零二六</div> */}
        </div>
      </div>

      {/* ★ 修改：將中間的虛線間隔線調淡、調細。從 border-l-[3px] border-dashed border-gray-500 修改為 border-l border-dashed border-gray-400，並縮小 w- */ }
      <div className="w-[1px] h-full border-l border-dashed border-gray-400 relative bg-[#FDFBF7] z-10 shrink-0"></div>

      {/* 右側：車票資訊 */}
      <div className={`flex-1 h-full flex flex-col ${paddingClass} bg-[#F9F6F0] relative overflow-hidden`}>
        
        <div className={`flex justify-between items-center border-b-2 border-gray-300 ${isLarge ? 'pb-2 mb-2' : 'pb-1 mb-1'} shrink-0`}>
            <div className={`${labelSize} font-bold text-gray-500 tracking-widest leading-none`}>為您記錄此刻</div>
            <div className={`text-right ${labelSize} font-bold text-gray-500 tracking-widest leading-none`}>臺灣鐵路局</div>
        </div>

        <div className={`flex-1 flex flex-col items-center justify-center ${gapClass} px-1 relative w-full`}>
            <div className="w-full text-center flex items-center justify-center">
              <h2 className={`${stationSize} font-bold text-gray-800 tracking-widest m-0 leading-tight inline-block`}>民歌車站</h2>
            </div>

            <div className={`w-[85%] mx-auto flex items-center justify-center gap-3 ${isLarge ? 'my-1' : 'my-0.5'} opacity-70`}>
              <div className="h-[2px] flex-grow bg-gray-600 rounded-full"></div>
              <div className={`${isLarge ? 'text-lg' : 'text-sm'} font-black text-gray-800 font-sans leading-none pb-0.5 shrink-0 px-2`}>至</div>
              <div className="h-[2px] flex-grow bg-gray-600 rounded-full"></div>
            </div>

            <div className="w-full text-center flex items-center justify-center">
              <h2 className={`${stationSize} font-bold text-gray-800 tracking-widest m-0 leading-tight inline-block`}>回憶車站</h2>
            </div>
        </div>

        {/* ★ 修改：將天氣框邊框從 border-[2px] border-gray-800 修改為 border border-gray-300 */}
        <div className={`${isLarge ? 'mt-3 py-2.5' : 'mt-1.5 py-1.5'} flex flex-col items-center justify-center gap-1.5 relative bg-[#FDFBF7] rounded-none border border-gray-300 shadow-inner shrink-0 w-[90%] mx-auto`}>
           <div className={`${labelSize} text-gray-600 font-bold tracking-widest leading-none text-center w-full`}>今日天氣</div>
           <div className={`text-center font-black px-6 ${isLarge ? 'h-[38px] leading-[38px]' : 'h-[26px] leading-[26px]'} rounded-none text-white tracking-widest ${moodTextSize} ${currentMood.bgColor} block w-full`}>
              【{currentMood.text}】
           </div>
        </div>

        <div className={`shrink-0 flex flex-col px-1 ${isLarge ? 'pt-3' : 'pt-1.5'}`}>
           <div className={`flex justify-between items-center ${labelSize} font-bold text-gray-500 tracking-widest border-t border-gray-300 pt-2 leading-none`}>
             <span>乘車票號</span>
             <span className={`font-mono font-bold text-gray-800 ${isLarge ? 'text-sm' : 'text-xs'} leading-none`}>
               {todayStr}
             </span>
           </div>
        </div>
      </div>
    </div>
  );
};