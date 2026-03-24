import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 資料
import { folkSongs } from './data/folkSongs';

export const CARRIAGE_NAMES = {
  MOOD_TRAIN: "心情車票",
  AR_CATCH: "民歌卡帶播放器",
  AI_COVER: "自製專輯封面",
  SING_ALONG: "民歌錄音室",
  FACE_SWAP: "一日歌手", 
  LYRICS: "歌詞拼貼",
  CAPSULE: "民歌回憶"
};

// ==========================================
// ★ 跨平台排版微調中控台 (解決脫軌與對齊)
// ==========================================
export const LAYOUT_CONFIG = {
  // 1. 全域背景圖設定 (含遠山背景)
  BG_SCALE: 1.0, 
  BG_POSITION: 'center bottom',

  // 2. 獨立鐵軌層 (rail.png) 設定
  // 預設縮放與定位跟背景一樣，這樣就能還原切分前的比例。
  RAIL_SCALE: 1.0,         // 鐵軌的縮放大小 (若覺得鐵軌太小可調為 1.05)
  RAIL_Y_OFFSET: '100px',    // 鐵軌的上下微調 (例如 '10px' 往下移)

  // 3. 火車車廂設定
  TRAIN_Y_OFFSET: '0px',   // 火車的上下微調 (對準輪子與鐵軌用)
};
// ==========================================

// 元件
import TrainPage from './components/Train/TrainPage';
import MoodTrainGame from './components/Games/MoodTrainGame/MoodTrainGame'; 
import AiCoverGame_zimage from './components/Games/AiCoverGame/AiCoverGame_zimage'; 
import FaceSwapGame from './components/Games/FaceSwapGame/FaceSwapGame'; 
import ArGame from './components/Games/ArGame/ArGame'; 
import LyricsGame from './components/Games/LyricsGame/LyricsGame';
import SingAlongGame from './components/Games/SingAlongGame/SingAlongGame'; 
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
  const [currentView, setCurrentView] = useState('home'); // home, story, train, game, outro
  const [activeMode, setActiveMode] = useState(null); 
  const [mainSong, setMainSong] = useState(null);

  const [globalMood, setGlobalMood] = useState('neutral');
  const [ticketData, setTicketData] = useState(null); 
  const [coverData, setCoverData] = useState(null); 
  const [coverStatus, setCoverStatus] = useState('idle'); 
  const [generatedCoverImg, setGeneratedCoverImg] = useState(null);
  const [swappedData, setSwappedData] = useState(null); 
  const [faceswapStatus, setFaceswapStatus] = useState('idle'); 
  const [generatedSwappedImg, setGeneratedSwappedImg] = useState(null);
  const [lyricsData, setLyricsData] = useState(null);
  const [recordingData, setRecordingData] = useState(null);

  const globalAudioRef = useRef(null);
  const [currentTrackName, setCurrentTrackName] = useState('bg_music.mp3');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const trainRef = useRef(null); 

  useEffect(() => {
    if (!globalAudioRef.current) {
      globalAudioRef.current = new Audio(`/music/bg_music.mp3`);
      globalAudioRef.current.loop = true;
      globalAudioRef.current.volume = 0.5;
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

  const handleStartIntro = () => { 
    playTrack('bg_music.mp3'); 
    setCurrentView('story'); 
  };
  
  const handleEnterTrain = () => {
    setCurrentView('train'); 
  };

  const handleFullReset = () => {
    setActiveMode(null);
    setMainSong(null);
    setGlobalMood('neutral');
    setTicketData(null);
    setCoverData(null);
    setCoverStatus('idle');
    setGeneratedCoverImg(null);
    setSwappedData(null);
    setFaceswapStatus('idle');
    setGeneratedSwappedImg(null);
    setLyricsData(null);
    setRecordingData(null);
    pauseMusic();
    
    if (trainRef.current) {
      trainRef.current.resetTrainPosition();
    }
    
    setCurrentView('home');
  };

  const handleEndJourney = () => {
    pauseMusic(); 
    setCurrentView('outro'); 
  };

  const handleLeaveGame = () => {
    setCurrentView('train'); 
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
    if (mode.id === 'ar' || mode.id === 'lyrics' || mode.id === 'sing-along') {
      pauseMusic();
    }
    
    setActiveMode(mode.id);
    setCurrentView('game');
  };

  const handleStartGenerateCover = async (payload) => {
    setGeneratedCoverImg(null); 
    setCoverStatus('generating');
    try {
      const response = await fetch(`${API_URL}/sdapi/v1/txt2img`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`API 無回應或網路錯誤 (狀態碼: ${response.status})`);
      const data = await response.json();
      if (data.images && data.images.length > 0) {
        setGeneratedCoverImg(`data:image/png;base64,${data.images[0]}`);
        setCoverStatus('done');
      }
    } catch (error) {
      console.error(error);
      alert(`繪製錯誤: ${error.message}\n請確認伺服器與 Ngrok 已正常開啟。`);
      setCoverStatus('idle');
    }
  };

  const handleStartFaceSwap = async (payload) => {
    setGeneratedSwappedImg(null); 
    setFaceswapStatus('generating');
    try {
      const response = await fetch(`${API_URL}/reactor/image`, { 
        method: "POST", 
        headers: { 
          "Content-Type": "application/json", 
          "ngrok-skip-browser-warning": "true" 
        }, 
        body: JSON.stringify(payload) 
      });
      if (!response.ok) throw new Error(`換臉 API 錯誤 (狀態碼: ${response.status})`);
      const data = await response.json();
      setGeneratedSwappedImg(`data:image/png;base64,${data.image}`);
      setFaceswapStatus('done');
    } catch (error) {
      console.error(error);
      alert(`融合失敗: ${error.message}\n請確認伺服器與 Ngrok 已正常開啟。`);
      setFaceswapStatus('idle');
    }
  };

  const UnifiedBackButton = ({ onClick, text = " 返回火車" }) => (
    <button onClick={onClick} className="absolute top-6 left-8 z-50 px-6 py-3 bg-[#D2A679] text-white font-bold text-lg rounded-full shadow-md hover:bg-[#C09668] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 tracking-widest flex items-center">
      {text}
    </button>
  );

  const RequireMainSongPrompt = () => (
    <div className="flex flex-col items-center bg-[#FDFBF7] p-12 rounded-3xl shadow-xl text-center max-w-2xl border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 tracking-widest pb-4">似乎還沒選好這趟旅程的專屬歌曲呢</h2>
      <p className="text-gray-600 mb-10 text-xl leading-loose font-medium">
        請先到「{CARRIAGE_NAMES.AR_CATCH}」挑選一首最觸動您的歌，<br/>它將會化作旋律，陪伴我們走過接下來的每一個車廂。
      </p>
      <button 
        onClick={() => handleModeSelect({ id: 'ar', locked: false })} 
        className="px-10 py-4 bg-rose-400 text-white font-bold text-xl rounded-full shadow-md hover:bg-rose-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 tracking-widest"
      >
        前往挑選歌曲
      </button>
    </div>
  );

  // 共用的背景樣式生成器
  const getBgStyle = (url) => ({
    backgroundImage: `url('${url}')`,
    backgroundSize: 'cover',
    backgroundPosition: LAYOUT_CONFIG.BG_POSITION,
    backgroundRepeat: 'no-repeat',
    transform: `scale(${LAYOUT_CONFIG.BG_SCALE})`,
    transformOrigin: 'bottom center'
  });

  return (
    <div className="w-full h-screen overflow-hidden bg-[#EAEAEA] text-folk-dark font-serif flex flex-col relative">
      <GlobalMoodEffects mood={globalMood} />
      
      <AnimatePresence mode="wait">
        {currentView === 'home' && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none z-0" style={getBgStyle('/home-bg.jpg')} />
            <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none"></div>
            
            <div className="relative z-20 text-center flex flex-col items-center">
              <h1 className="text-7xl md:text-8xl font-bold tracking-[0.25em] mb-6 text-white drop-shadow-lg font-serif">民歌旅程</h1>
              <p className="text-2xl md:text-3xl text-gray-100 tracking-[0.35em] mb-12 drop-shadow-md font-serif font-medium">乘著歌聲，回到最純粹的年代</p>
              <button onClick={handleStartIntro} className="px-12 py-5 bg-rose-400 text-white rounded-full text-xl font-bold tracking-widest shadow-md hover:bg-rose-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 mt-6">
                準備出發
              </button>
            </div>
          </motion.div>
        )}

        {currentView === 'story' && (
          <motion.div key="story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-70 z-0" style={getBgStyle('/train-bg_2.jpg')} />
            <div className="absolute inset-0 bg-black/30 z-0 pointer-events-none"></div>
            
            <div className="relative z-20 text-center flex flex-col items-center max-w-4xl px-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-widest mb-10 drop-shadow-lg font-serif">嘿，準備好來場時光旅行了嗎？</h2>
              <div className="text-xl md:text-2xl text-gray-50 leading-loose tracking-[0.15em] mb-16 text-center drop-shadow-md space-y-6 font-medium font-serif">
                  <p>這是一趟沒有喧囂，只有吉他與純粹嗓音的專屬旅程。</p>
                  <p>我們將穿梭於車廂之間，留下屬於你的獨特印記。</p>
                  <p>跟著熟悉的旋律，放鬆心情，</p>
                  <p>讓我們一起重溫那段充滿生命力的青春時光吧！</p>
              </div>
              <button onClick={handleEnterTrain} className="px-12 py-5 bg-rose-400 text-white rounded-full text-xl font-bold tracking-widest shadow-md hover:bg-rose-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  一起出發
              </button>
            </div>
          </motion.div>
        )}

        {currentView === 'train' && (
          <motion.div key="train" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="absolute inset-0 pointer-events-none z-0" style={getBgStyle('/train-bg.png')} />
            
            <div className="relative z-20 w-full h-full">
              <div className="absolute top-6 right-8 z-50">
                 <div className="flex items-center bg-[#FFF9E6] px-6 py-3 rounded-full border border-yellow-100 shadow-md relative z-20">
                    <div className="mr-4 flex items-center justify-center">
                        <img src="/images/cassette.png" alt="Cassette" className="w-12 h-8 object-contain drop-shadow-sm" />
                    </div>
                    <div className="flex flex-col mr-8 min-w-[120px]">
                      <span className="text-xs text-gray-500 font-bold tracking-widest"></span>
                      <span className="text-lg text-gray-800 font-bold tracking-wider truncate max-w-[150px]">
                        {mainSong ? mainSong.title : (currentTrackName === 'bg_music.mp3' ? '經典民歌放送中' : (currentTrackName || '').replace('.mp3', ''))}
                      </span>
                    </div>
                    <button onClick={togglePlayPause} className="w-12 h-12 flex items-center justify-center bg-[#D2A679] text-white text-xl font-bold rounded-full shadow-md hover:bg-[#C09668] transition-colors duration-300 border border-transparent pb-1">
                      {isPlaying ? 'll' : '▶'}
                    </button>
                 </div>
              </div>
              
              <TrainPage 
                ref={trainRef}
                onSelectMode={handleModeSelect} 
                onBack={handleFullReset} 
                ticket={ticketData} cover={coverData} coverStatus={coverStatus} 
                swapped={swappedData} faceswapStatus={faceswapStatus} 
                lyrics={lyricsData} recording={recordingData} 
                onPauseMusic={pauseMusic} mainSong={mainSong}
                layoutConfig={LAYOUT_CONFIG}
              />
            </div>
          </motion.div>
        )}

        {currentView === 'game' && (
          <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0 w-full h-full overflow-hidden">
            <div className="absolute inset-0 pointer-events-none z-0" style={getBgStyle('/game-bg.jpg')} />
            <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none"></div> 
            
            <div className="relative z-20 w-full h-full flex flex-col items-center justify-center">
              
              {!activeMode && <div className="text-gray-700 text-2xl font-bold tracking-widest bg-[#FDFBF7] border border-gray-200 px-8 py-4 rounded-full shadow-md">請先在上方火車點選一節車廂喔</div>}

              {activeMode === 'mood-train' && (
                <div className="w-full h-full relative">
                  <UnifiedBackButton onClick={handleLeaveGame} text="返回火車" />
                  <MoodTrainGame onMoodDetected={(mood) => setGlobalMood(mood)} onTicketGenerated={(img, finalMood) => { setTicketData({ image: img, mood: finalMood }); handleLeaveGame(); }} />
                </div>
              )}

              {activeMode === 'ar' && (
                <div className="w-full h-full relative">
                  <UnifiedBackButton onClick={() => { playTrack(mainSong ? mainSong.audioFileName : 'bg_music.mp3'); handleLeaveGame(); }} text="返回火車" />
                  <ArGame onPreviewSong={(song) => { playTrack(song.audioFileName || song.audioFile); }} onConfirmSong={(song) => { setMainSong(song); playTrack(song.audioFileName || song.audioFile); handleLeaveGame(); }} />
                </div>
              )}

              {activeMode === 'ai-zimage' && (
                 <div className="w-full h-full flex flex-col items-center justify-center relative">
                   <UnifiedBackButton onClick={handleLeaveGame} text="返回火車" />
                   {!mainSong ? <RequireMainSongPrompt /> : (
                     <AiCoverGame_zimage 
                       song={mainSong} 
                       onHome={handleLeaveGame} 
                       coverStatus={coverStatus} 
                       generatedCoverImg={generatedCoverImg} 
                       onStartGenerate={handleStartGenerateCover} 
                       onSetMockCover={(url) => { setGeneratedCoverImg(url); setCoverStatus('done'); }} 
                       onCoverGenerated={(img) => { setCoverData({ image: img, title: mainSong.title }); setCoverStatus('idle'); handleLeaveGame(); }} 
                     />
                   )}
                 </div>
              )}

              {activeMode === 'faceswap' && (
                <div className="w-full h-full relative flex flex-col items-center justify-center">
                  <UnifiedBackButton onClick={handleLeaveGame} text="返回火車" />
                  {!mainSong ? <RequireMainSongPrompt /> : (
                    <FaceSwapGame 
                      song={mainSong} 
                      onHome={handleLeaveGame} 
                      faceswapStatus={faceswapStatus} 
                      generatedSwappedImg={generatedSwappedImg} 
                      onStartGenerate={handleStartFaceSwap} 
                      generatedCoverImg={coverData ? coverData.image : generatedCoverImg} 
                      onSetMockSwap={(url) => { setGeneratedSwappedImg(url); setFaceswapStatus('done'); }} 
                      onSwapGenerated={(img) => { setSwappedData({ image: img, title: mainSong.title }); setFaceswapStatus('idle'); handleLeaveGame(); }} 
                    />
                  )}
                </div>
              )}

              {activeMode === 'lyrics' && (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <UnifiedBackButton onClick={handleLeaveGame} text="返回火車" />
                  {!mainSong ? <RequireMainSongPrompt /> : <LyricsGame song={mainSong} onRestart={() => handleModeSelect({ id: 'ar' })} onHome={handleLeaveGame} onLyricsGenerated={(data) => setLyricsData(data)} />}
                </div>
              )}

              {activeMode === 'sing-along' && (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  <UnifiedBackButton onClick={handleLeaveGame} text="返回火車" />
                  {!mainSong ? <RequireMainSongPrompt /> : <SingAlongGame song={mainSong} onHome={handleLeaveGame} onRecordingComplete={(audioUrl) => { if (audioUrl) setRecordingData({ audioUrl, title: mainSong.title }); handleLeaveGame(); }} />}
                </div>
              )}

              {activeMode === 'capsule' && (
                 <div className="w-full h-full flex flex-col items-center justify-center relative">
                   <UnifiedBackButton onClick={handleLeaveGame} text="返回火車" />
                   <button onClick={handleEndJourney} className="absolute top-6 right-8 z-50 px-8 py-3 bg-rose-500 text-white font-bold text-lg rounded-full shadow-md hover:bg-rose-600 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 tracking-widest flex items-center">
                     滿載回憶 結束旅程
                   </button>

                   {!mainSong ? <RequireMainSongPrompt /> : <CapsuleGame song={mainSong} ticket={ticketData} cover={coverData} swapped={swappedData} lyrics={lyricsData} recording={recordingData} onHome={handleLeaveGame} />}
                 </div>
              )}
            </div>
          </motion.div>
        )}

        {currentView === 'outro' && (
          <motion.div key="outro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-50 z-0" style={getBgStyle('/train-bg_2.jpg')} />
            <div className="absolute inset-0 bg-black/30 z-0 pointer-events-none"></div>
            <div className="relative z-20 text-center flex flex-col items-center max-w-3xl px-8">
               <h2 className="text-4xl md:text-5xl font-bold text-white tracking-widest mb-10 drop-shadow-lg">列車即將抵達終點</h2>
               <p className="text-xl md:text-2xl text-gray-100 leading-loose tracking-[0.15em] mb-16 drop-shadow-md text-center font-medium">
                 這段專屬於你的民歌回憶已經打包完成囉！<br/>希望這份溫暖的感動，能繼續在你心中輕輕傳唱。
               </p>
               <div className="flex gap-6 w-full justify-center">
                 <button onClick={handleFullReset} className="px-12 py-5 bg-[#D2A679] text-white rounded-full text-xl font-bold tracking-widest shadow-md hover:bg-[#C09668] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    重新開始
                 </button>
                 <button onClick={handleFullReset} className="px-12 py-5 bg-rose-400 text-white rounded-full text-xl font-bold tracking-widest shadow-md hover:bg-rose-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    填寫回饋問卷
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;