import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 資料
import { folkSongs } from './data/folkSongs';

// 元件
import TrainPage from './components/Train/TrainPage';
import MoodTrainGame from './components/Games/MoodTrainGame/MoodTrainGame'; 
import AiCoverGame_zimage from './components/Games/AiCoverGame/AiCoverGame_zimage'; 
import FaceSwapGame from './components/Games/FaceSwapGame/FaceSwapGame'; 
import ArGame from './components/Games/ArGame/ArGame'; 
import LyricsGame from './components/Games/LyricsGame/LyricsGame';
import SingAlongGame from './components/Games/SingAlongGame/SingAlongGame'; // ★ 引入新遊戲
import CapsuleGame from './components/Games/CapsuleGame/CapsuleGame'; 

const API_URL = "https://cory-uninduced-ozell.ngrok-free.dev"; 

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
  const [currentViewIndex, setCurrentViewIndex] = useState(0); 
  
  const [activeMode, setActiveMode] = useState(null); 
  const [mainSong, setMainSong] = useState(null);

  const [zimageSong, setZimageSong] = useState(null); 
  const [lyricsGameSong, setLyricsGameSong] = useState(null); 
  const [capsuleSong, setCapsuleSong] = useState(null); 

  const [globalMood, setGlobalMood] = useState('neutral');
  const [ticketData, setTicketData] = useState(null); 
  
  const [coverData, setCoverData] = useState(null); 
  const [coverStatus, setCoverStatus] = useState('idle'); 
  const [generatedCoverImg, setGeneratedCoverImg] = useState(null);

  const [swappedData, setSwappedData] = useState(null); 
  const [faceswapStatus, setFaceswapStatus] = useState('idle'); 
  const [generatedSwappedImg, setGeneratedSwappedImg] = useState(null);

  const [lyricsData, setLyricsData] = useState(null);

  const globalAudioRef = useRef(null);
  const [currentTrackName, setCurrentTrackName] = useState('bg_music.mp3');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!globalAudioRef.current) {
      globalAudioRef.current = new Audio(`/music/bg_music.mp3`);
      globalAudioRef.current.loop = true;
    }
    return () => {
      if (globalAudioRef.current) {
        globalAudioRef.current.pause();
        globalAudioRef.current = null;
      }
    };
  }, []);

  const playTrack = (fileName) => {
    if (!globalAudioRef.current || !fileName) return;

    const audio = globalAudioRef.current;
    const currentSrc = audio.getAttribute('src') || '';
    
    if (currentSrc.includes(fileName)) {
      if (audio.paused) {
        audio.play().catch(e => console.log("播放攔截:", e));
        setIsPlaying(true);
      }
      return;
    }

    audio.pause();
    audio.src = `/music/${fileName}`;
    audio.load();
    audio.play().catch(e => console.log("播放攔截:", e));
    
    setCurrentTrackName(fileName);
    setIsPlaying(true);
  };

  const pauseMusic = () => {
    if (globalAudioRef.current) {
      globalAudioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseMusic();
    } else {
      playTrack(currentTrackName);
    }
  };

  const handleStartGenerateCover = async (payload) => {
    setCoverStatus('generating');
    setGeneratedCoverImg(null);
    try {
      const response = await fetch(`${API_URL}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '69420' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`API 無回應`);
      const data = await response.json();
      if (data.images && data.images.length > 0) {
        setGeneratedCoverImg(`data:image/png;base64,${data.images[0]}`);
        setCoverStatus('done');
      }
    } catch (error) {
      alert(`繪製錯誤: ${error.message}`);
      setCoverStatus('idle');
    }
  };

  const handleStartFaceSwap = async (payload) => {
    setFaceswapStatus('generating');
    setGeneratedSwappedImg(null);
    try {
      const response = await fetch(`${API_URL}/reactor/image`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "69420" }, 
        body: JSON.stringify(payload) 
      });
      if (!response.ok) throw new Error(`換臉 API 錯誤`);
      const data = await response.json();
      setGeneratedSwappedImg(`data:image/png;base64,${data.image}`);
      setFaceswapStatus('done');
    } catch (error) {
      alert(`融合失敗: ${error.message}`);
      setFaceswapStatus('idle');
    }
  };

  const homeSectionRef = useRef(null);
  const trainSectionRef = useRef(null);
  const gameSectionRef = useRef(null);

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth' });
  
  const handleStartJourney = () => { 
    playTrack('bg_music.mp3'); 
    scrollTo(trainSectionRef); 
  };
  
  const handleBackToHome = () => scrollTo(homeSectionRef);

  const handleLeaveGame = () => {
    scrollTo(trainSectionRef);
    setTimeout(() => {
      setActiveMode(null);
      if (globalAudioRef.current && globalAudioRef.current.paused) {
        globalAudioRef.current.play().catch(e => console.log(e));
        setIsPlaying(true);
      }
    }, 600); 
  };

  const handleModeSelect = (mode) => {
    if (mode.locked) return;
    if (mode.id === 'faceswap' && mainSong && !mainSong.hasFace) {
      alert("此歌曲的經典封面沒有人臉，無法進行換臉喔！");
      return;
    }
    // ★ 進入 AR, 拼貼歌詞, 或跟著唱 時，暫停背景音樂
    if (mode.id === 'ar' || mode.id === 'lyrics' || mode.id === 'sing-along') {
      pauseMusic();
    }
    
    setActiveMode(mode.id);
    setZimageSong(null); setLyricsGameSong(null); setCapsuleSong(null);
    setTimeout(() => scrollTo(gameSectionRef), 100);
  };

  const UnifiedBackButton = ({ onClick, text = "← 返回火車" }) => (
    <button onClick={onClick} className="absolute top-6 left-6 z-50 px-5 py-2.5 bg-[#F5F5F5] text-gray-800 font-bold rounded-lg shadow border border-gray-300 hover:bg-gray-200 hover:-translate-y-1 transition-all duration-300 tracking-wide flex items-center">
      {text}
    </button>
  );

  const RequireMainSongPrompt = () => (
    <div className="flex flex-col items-center bg-[#F5F5F5] p-10 rounded-lg shadow-xl border border-gray-300 text-center">
      <h2 className="text-3xl font-bold text-gray-800 mb-4 tracking-widest">尚未選擇旅程主打歌</h2>
      <p className="text-gray-600 mb-8 text-lg">請先前往【捕捉民歌】車廂，用手勢抓取一首您喜愛的歌曲，作為後續創作的主旋律。</p>
      <button 
        onClick={() => handleModeSelect({ id: 'ar', locked: false })} 
        className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg shadow hover:bg-red-500 hover:-translate-y-1 transition-all duration-300 tracking-widest"
      >
        🖐️ 前往捕捉民歌
      </button>
    </div>
  );

  return (
    <div className="w-full h-screen overflow-hidden bg-[#EAEAEA] text-folk-dark font-serif flex flex-col">
      
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

      <section ref={trainSectionRef} className="h-screen w-full relative shrink-0 overflow-hidden bg-[#EAEAEA]">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/train-bg.jpg')" }}></div>
        <GlobalMoodEffects mood={globalMood} />
        
        <div className="relative z-20 w-full h-full">
          <div className="absolute top-6 right-6 z-50 flex items-center bg-[#F5F5F5] px-4 py-2 rounded-lg shadow border border-gray-300">
             <div className={`mr-3 text-xl ${isPlaying ? 'animate-spin' : ''}`}>💿</div>
             <div className="flex flex-col mr-6">
               <span className="text-[10px] text-gray-500 font-bold tracking-widest">NOW PLAYING</span>
               <span className="text-sm text-gray-800 font-bold tracking-wider">
                 {mainSong ? mainSong.title : (currentTrackName === 'bg_music.mp3' ? '經典民歌放送中' : (currentTrackName || '').replace('.mp3', ''))}
               </span>
             </div>
             <button onClick={togglePlayPause} className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded text-gray-800 hover:bg-gray-300 transition-colors border border-gray-400">
               {isPlaying ? 'II' : '▶'}
             </button>
          </div>
          
          <TrainPage 
            onSelectMode={handleModeSelect} 
            onBack={handleBackToHome} 
            ticket={ticketData} 
            cover={coverData} 
            coverStatus={coverStatus} 
            swapped={swappedData}
            faceswapStatus={faceswapStatus}
            lyrics={lyricsData}
            mainSong={mainSong}
          />
        </div>
      </section>

      <section ref={gameSectionRef} className="h-screen w-full relative shrink-0 overflow-hidden bg-[#EAEAEA]">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/game-bg.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/10 z-0"></div> 
        <GlobalMoodEffects mood={globalMood} />
        
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center">
          
          {!activeMode && <div className="text-gray-700 text-2xl font-bold tracking-widest bg-[#F5F5F5] px-8 py-4 rounded-lg shadow border border-gray-300">請先在上方火車選擇一種體驗...</div>}

          {activeMode === 'mood-train' && (
             <div className="w-full h-full">
               <MoodTrainGame onBack={handleLeaveGame} onMoodDetected={(mood) => setGlobalMood(mood)} onTicketGenerated={(img, finalMood) => { setTicketData({ image: img, mood: finalMood }); handleLeaveGame(); }} />
             </div>
          )}

          {activeMode === 'ar' && (
             <div className="w-full h-full">
               <ArGame onBack={() => { playTrack(mainSong ? mainSong.audioFileName : 'bg_music.mp3'); handleLeaveGame(); }} onPreviewSong={(song) => { playTrack(song.audioFileName || song.audioFile); }} onConfirmSong={(song) => { setMainSong(song); playTrack(song.audioFileName || song.audioFile); handleLeaveGame(); }} />
             </div>
          )}

          {activeMode === 'ai-zimage' && (
             <div className="w-full h-full flex flex-col items-center justify-center relative">
               <UnifiedBackButton onClick={handleLeaveGame} />
               {!mainSong ? <RequireMainSongPrompt /> : (
                 <AiCoverGame_zimage song={mainSong} onHome={handleLeaveGame} coverStatus={coverStatus} generatedCoverImg={generatedCoverImg} onStartGenerate={handleStartGenerateCover} onSetMockCover={(url) => { setGeneratedCoverImg(url); setCoverStatus('done'); }} onCoverGenerated={(img) => { setCoverData({ image: img, title: mainSong.title }); setCoverStatus('idle'); handleLeaveGame(); }} />
               )}
             </div>
          )}

          {activeMode === 'faceswap' && (
            <div className="w-full h-full relative flex flex-col items-center justify-center">
              <UnifiedBackButton onClick={handleLeaveGame} />
              {!mainSong ? <RequireMainSongPrompt /> : (
                <FaceSwapGame song={mainSong} onHome={handleLeaveGame} faceswapStatus={faceswapStatus} generatedSwappedImg={generatedSwappedImg} onStartGenerate={handleStartFaceSwap} onSetMockSwap={(url) => { setGeneratedSwappedImg(url); setFaceswapStatus('done'); }} onSwapGenerated={(img) => { setSwappedData({ image: img, title: mainSong.title }); setFaceswapStatus('idle'); handleLeaveGame(); }} />
              )}
            </div>
          )}

          {activeMode === 'lyrics' && (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {!mainSong ? <RequireMainSongPrompt /> : (
                <LyricsGame song={mainSong} onRestart={() => handleModeSelect({ id: 'ar' })} onHome={handleLeaveGame} onLyricsGenerated={(data) => setLyricsData(data)} />
              )}
            </div>
          )}

          {/* ★ 新增：跟著唱 (Sing Along) 車廂 */}
          {activeMode === 'sing-along' && (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {!mainSong ? <RequireMainSongPrompt /> : (
                <SingAlongGame song={mainSong} onHome={handleLeaveGame} />
              )}
            </div>
          )}

          {activeMode === 'capsule' && (
             <div className="w-full h-full flex flex-col items-center justify-center relative">
               <UnifiedBackButton onClick={handleLeaveGame} />
               {!mainSong ? <RequireMainSongPrompt /> : (
                 <CapsuleGame song={mainSong} onBack={() => handleModeSelect({ id: 'ar' })} onHome={handleLeaveGame} />
               )}
             </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;