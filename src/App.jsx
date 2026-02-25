import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// 資料
import { folkSongs } from './data/folkSongs';

// 元件
import TrainPage from './components/Train/TrainPage';
import MoodTrainGame from './components/Games/MoodTrainGame/MoodTrainGame'; 
import AiCoverGame_zimage from './components/Games/AiCoverGame/AiCoverGame_zimage'; 
import FaceSwapGame from './components/Games/FaceSwapGame/FaceSwapGame'; 
import ArGame from './components/Games/ArGame/ArGame'; 
import LyricsGame from './components/Games/LyricsGame/LyricsGame';
import CapsuleGame from './components/Games/CapsuleGame/CapsuleGame'; 

const GlobalMoodEffects = ({ mood }) => {
  if (!mood || mood === 'neutral') return null;

  const isHappy = mood === 'happy';
  const particles = Array.from({ length: isHappy ? 15 : 40 }); 

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {isHappy ? (
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-sky-100/10 to-transparent mix-blend-overlay transition-opacity duration-1000"></div>
      ) : (
        <div className="absolute inset-0 bg-slate-800/50 mix-blend-multiply transition-opacity duration-1000"></div>
      )}
      
      {particles.map((_, i) => {
        const randomX = Math.random() * 100;
        const randomDelay = Math.random() * 5;

        if (isHappy) {
          const randomDuration = 8 + Math.random() * 8;
          return (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/50 blur-[1px]"
              initial={{ x: `${randomX}vw`, y: `${Math.random() * 100}vh`, opacity: 0 }}
              animate={{ 
                x: [`${randomX}vw`, `${randomX - 3 + Math.random() * 6}vw`, `${randomX}vw`],
                y: '-5vh', 
                opacity: [0, 0.6, 0] 
              }}
              transition={{ duration: randomDuration, repeat: Infinity, delay: randomDelay, ease: "easeInOut" }}
            />
          );
        } else {
          const randomDuration = 0.5 + Math.random() * 0.4;
          return (
            <motion.div
              key={i}
              className="absolute top-0 w-[1.5px] h-14 bg-blue-100/40 rotate-[15deg]"
              initial={{ x: `${randomX}vw`, y: '-10vh', opacity: 0 }}
              animate={{ x: `${randomX - 10}vw`, y: '110vh', opacity: [0, 1, 1, 0] }}
              transition={{ duration: randomDuration, repeat: Infinity, delay: randomDelay, ease: "linear" }}
            />
          );
        }
      })}
    </div>
  );
};

function App() {
  const [activeMode, setActiveMode] = useState(null); 
  const [zimageSong, setZimageSong] = useState(null); 
  const [lyricsGameSong, setLyricsGameSong] = useState(null); 
  const [capsuleSong, setCapsuleSong] = useState(null); 

  const [globalMood, setGlobalMood] = useState('neutral');
  const [bgm, setBgm] = useState('bg_music.mp3');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [ticketData, setTicketData] = useState(null); 
  
  const audioRef = useRef(null);

  const homeSectionRef = useRef(null);
  const trainSectionRef = useRef(null);
  const gameSectionRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(e => console.log("等待互動", e));
      else audioRef.current.pause();
    }
  }, [isPlaying, bgm]);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth' });
  const handleStartJourney = () => { setIsPlaying(true); scrollTo(trainSectionRef); };
  const handleBackToHome = () => scrollTo(homeSectionRef);

  // ★ 關鍵優化：離開遊戲時，先平滑滾動，再將 activeMode 設為 null，藉此卸載鏡頭與釋放效能
  const handleLeaveGame = () => {
    scrollTo(trainSectionRef);
    setTimeout(() => {
      setActiveMode(null);
    }, 600); // 等待滾動動畫完成後關閉元件
  };

  const handleModeSelect = (mode) => {
    if (mode.locked) return;
    setActiveMode(mode.id);
    setZimageSong(null); setLyricsGameSong(null); setCapsuleSong(null);
    setTimeout(() => scrollTo(gameSectionRef), 100);
  };

  const UnifiedBackButton = ({ onClick, text = "← 返回火車" }) => (
    <button onClick={onClick} className="absolute top-6 left-6 z-50 px-5 py-2.5 bg-[#F5F5F5] text-gray-800 font-bold rounded-lg shadow border border-gray-300 hover:bg-gray-200 hover:-translate-y-1 transition-all duration-300 tracking-wide flex items-center">
      {text}
    </button>
  );

  const SongSelector = ({ title, onSelect, icon }) => (
    <div className="w-full max-w-5xl px-4 flex flex-col items-center h-full pt-20">
      <UnifiedBackButton onClick={handleLeaveGame} />
      <h2 className="text-4xl text-gray-800 font-bold mb-12 tracking-wider drop-shadow-sm">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 w-full">
        {folkSongs.map((song) => (
          <div key={song.id} onClick={() => onSelect(song)} className="bg-[#FDFBF7] rounded-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-xl flex overflow-hidden h-32 border border-gray-200 relative group">
            <div className="w-4 h-full bg-red-500 absolute left-0 top-0"></div>
            <div className="pl-10 p-6 flex flex-col justify-center flex-1">
              <h3 className="text-2xl font-bold text-gray-800">{song.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{song.singer}</p>
            </div>
            <div className="w-20 flex items-center justify-center text-3xl bg-gray-100 border-l border-gray-200 group-hover:bg-gray-200 transition-colors">{icon}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#EAEAEA] text-folk-dark font-serif overflow-x-hidden flex flex-col">
      <audio ref={audioRef} src={`/music/${bgm}`} loop />

      {/* Section 1: 首頁 */}
      <section ref={homeSectionRef} className="h-screen w-full relative shrink-0 overflow-hidden bg-[#EAEAEA]">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/home-bg.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/20 z-0"></div>
        <GlobalMoodEffects mood={globalMood} />
        
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center flex flex-col items-center bg-[#F5F5F5]/95 p-12 rounded-lg border border-gray-300 shadow-xl">
            <h1 className="text-7xl font-bold tracking-widest mb-6 text-gray-800">民歌旅程</h1>
            <p className="text-2xl text-gray-600 tracking-wider mb-10">那年，我們唱自己的歌</p>
            <button onClick={handleStartJourney} className="px-10 py-4 bg-gray-800 text-[#F5F5F5] rounded-lg hover:bg-gray-700 hover:-translate-y-1 transition-all duration-300 text-lg font-bold tracking-widest shadow-md">
              開啟旅程 ↓
            </button>
          </motion.div>
        </div>
      </section>

      {/* Section 2: 火車模式選擇 */}
      <section ref={trainSectionRef} className="h-screen w-full relative shrink-0 overflow-hidden bg-[#EAEAEA]">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/train-bg.jpg')" }}></div>
        <GlobalMoodEffects mood={globalMood} />
        
        <div className="relative z-20 w-full h-full">
          <div className="absolute top-6 right-6 z-50 flex items-center bg-[#F5F5F5] px-4 py-2 rounded-lg shadow border border-gray-300">
             <div className={`mr-3 text-xl ${isPlaying ? 'animate-spin' : ''}`}>💿</div>
             <div className="flex flex-col mr-6">
               <span className="text-[10px] text-gray-500 font-bold tracking-widest">NOW PLAYING</span>
               <span className="text-sm text-gray-800 font-bold tracking-wider">
                 {bgm === 'bg_music.mp3' ? '經典民歌放送中' : bgm.replace('.mp3', '')}
               </span>
             </div>
             <button onClick={() => setIsPlaying(!isPlaying)} className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded text-gray-800 hover:bg-gray-300 transition-colors border border-gray-400">
               {isPlaying ? 'II' : '▶'}
             </button>
          </div>
          
          <TrainPage 
            onSelectMode={handleModeSelect} 
            onBack={handleBackToHome} 
            ticket={ticketData} 
          />
        </div>
      </section>

      {/* Section 3: 互動/遊戲區 */}
      <section ref={gameSectionRef} className="h-screen w-full relative shrink-0 overflow-hidden bg-[#EAEAEA]">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/game-bg.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/10 z-0"></div> 
        <GlobalMoodEffects mood={globalMood} />
        
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center">
          
          {!activeMode && <div className="text-gray-700 text-2xl font-bold tracking-widest bg-[#F5F5F5] px-8 py-4 rounded-lg shadow border border-gray-300">請先在上方火車選擇一種體驗...</div>}

          {/* ★ 所有關卡統一套用 handleLeaveGame 來卸載 */}
          {activeMode === 'mood-train' && (
             <div className="w-full h-full">
               <MoodTrainGame 
                 onBack={handleLeaveGame} 
                 onMoodDetected={(mood) => setGlobalMood(mood)} 
                 onTicketGenerated={(img, finalMood) => {
                   setTicketData({ image: img, mood: finalMood });
                   handleLeaveGame(); 
                 }}
               />
             </div>
          )}

          {activeMode === 'ai-zimage' && (
             <div className="w-full h-full flex flex-col items-center justify-center">
               {!zimageSong ? (
                 <SongSelector title="請選擇要創作的歌曲" onSelect={setZimageSong} icon="🎨" />
               ) : (
                 <AiCoverGame_zimage song={zimageSong} onBack={() => setZimageSong(null)} onHome={handleLeaveGame} />
               )}
             </div>
          )}

          {activeMode === 'faceswap' && (
            <div className="w-full h-full">
              <FaceSwapGame onBack={handleLeaveGame} />
            </div>
          )}

          {activeMode === 'ar' && (
             <div className="w-full h-full">
               <ArGame onBack={handleLeaveGame} />
             </div>
          )}

          {activeMode === 'lyrics' && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {!lyricsGameSong ? (
                <SongSelector title="請選擇一首歌曲進行填詞" onSelect={setLyricsGameSong} icon="📝" />
              ) : (
                <div className="w-full h-full relative flex items-center justify-center">
                   <UnifiedBackButton onClick={handleLeaveGame} />
                   <button onClick={() => setLyricsGameSong(null)} className="absolute top-6 left-44 z-50 px-5 py-2.5 bg-gray-800 text-white font-bold rounded-lg shadow border border-gray-700 hover:bg-gray-700 transition-colors duration-300 tracking-wide">
                     ↺ 重選歌曲
                   </button>
                   <LyricsGame song={lyricsGameSong} onRestart={() => setLyricsGameSong(null)} />
                </div>
              )}
            </div>
          )}

          {activeMode === 'capsule' && (
             <div className="w-full h-full flex flex-col items-center justify-center">
               {!capsuleSong ? (
                 <SongSelector title="請選擇要打包的歌曲" onSelect={setCapsuleSong} icon="🎁" />
               ) : (
                 <CapsuleGame song={capsuleSong} onBack={() => setCapsuleSong(null)} onHome={handleLeaveGame} />
               )}
             </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;