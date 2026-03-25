import React from 'react';

// 注意： public 目錄下的圖片在 JSX 中通常直接以 '/' 開頭引用
const realisticCassetteUrl = '/images/cassette.png'; 

const CassetteUI = ({ title, size = 'normal' }) => {
  // 透過 size 控制整體縮放比例
  const scaleClass = {
    small: 'scale-75',
    normal: 'scale-100',
    large: 'scale-[1.8]'
  }[size];

  return (
    <div 
      className={`relative w-[320px] h-[200px] transform ${scaleClass} origin-center select-none shrink-0 drop-shadow-2xl`}
    >
      {/* 1. 底層：擬真卡帶圖片 */}
      <img 
        src={realisticCassetteUrl} 
        alt="時光卡帶" 
        className="w-full h-full object-contain pointer-events-none" 
        draggable="false"
      />

      {/* 2. 文字疊加層：移除了白底色和邊框 */}
      <div className="absolute bottom-[65px] left-[5%] w-[90%] h-[28px] flex items-center justify-center px-4">
         <span 
           className="text-gray-800 tracking-[0.1em] text-center whitespace-nowrap overflow-hidden text-ellipsis w-full font-serif font-black text-[30px]"
         >
            {title || '時光民歌珍藏錄'}
         </span>
      </div>
      
    </div>
  );
};

export default CassetteUI;