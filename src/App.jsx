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

export const CARRIAGE_SUBTITLES = {
  MOOD_TRAIN: "通往內心的時光鐵道",
  AR_CATCH: "",
  AI_COVER: "生成你的民歌封面",
  SING_ALONG: "用聲音點亮回憶",
  FACE_SWAP: "成為經典專輯主角",
  LYRICS: "修復記憶中的旋律",
  CAPSULE: "打包你的專屬回憶"
};

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
  
  const [volume, setVolume] = useState(0.5);

  const trainRef = useRef(null); 
  const homeSectionRef = useRef(null);
  const storySectionRef = useRef(null); 
  const trainSectionRef = useRef(null);
  const gameSectionRef = useRef(null);
  const outroSectionRef = useRef(null); 

  useEffect(() => {
    if (!globalAudioRef.current) {
      globalAudioRef.current = new Audio(`/music/bg_music.mp3`);
      globalAudioRef.current.loop = true;
      globalAudioRef.current.volume = volume;
    }
    return () => {
      if (globalAudioRef.current) {
        globalAudioRef.current.pause();
        globalAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (globalAudioRef.current) {
      globalAudioRef.current.volume = volume;
    }
  }, [volume]);

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

  const scrollTo = (ref) => ref.current?.scrollIntoView({ behavior: 'smooth' });
  
  const handleStartIntro = () => { 
    playTrack('bg_music.mp3'); 
    scrollTo(storySectionRef); 
  };
  
  const handleEnterTrain = () => {
    scrollTo(trainSectionRef); 
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
    
    scrollTo(homeSectionRef);
  };

  const handleEndJourney = () => {
    pauseMusic(); 
    scrollTo(outroSectionRef); 
  };

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
    if (mode.id === 'ar' || mode.id === 'lyrics' || mode.id === 'sing-along') {
      pauseMusic();
    }
    
    setActiveMode(mode.id);
    setTimeout(() => scrollTo(gameSectionRef), 100);
  };

  // ★ 修復二次生成時沒有顯示等待中的問題
  const handleStartGenerateCover = async (payload) => {
    setGeneratedCoverImg(null); // 強制清空圖片
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
    setGeneratedSwappedImg(null); // 強制清空圖片
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
    <button onClick={onClick} className="absolute top-6 left-8 z-50 px-6 py-3 bg-[#FDFBF7]/90 backdrop-blur-sm text-gray-800 font-bold text-lg rounded-lg border-2 border-gray-400 shadow-[4px_4px_0_#9ca3af] hover:bg-gray-100 hover:translate-y-[2px] hover:shadow-[2px_2px_0_#9ca3af] transition-all tracking-widest flex items-center">
      {text}
    </button>
  );

  const RequireMainSongPrompt = () => (
    <div className="flex flex-col items-center bg-[#FDFBF7] p-12 rounded-xl border-4 border-gray-300 shadow-[8px_8px_0_#d1d5db] text-center max-w-2xl">
      <h2 className="text-4xl font-bold text-gray-800 mb-6 tracking-widest border-b-2 border-red-500 pb-4">尚未選擇旅程主打歌</h2>
      <p className="text-gray-600 mb-10 text-xl leading-loose">
        請先前往【{CARRIAGE_NAMES.AR_CATCH || '民歌卡帶播放器'}】車廂，用選擇一首您喜愛的歌曲，作為後續所有創作與回憶的主旋律。
      </p>
      <button 
        onClick={() => handleModeSelect({ id: 'ar', locked: false })} 
        className="px-10 py-4 bg-red-600 text-white font-bold text-xl rounded-lg border-2 border-red-800 shadow-[4px_4px_0_#7f1d1d] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#7f1d1d] transition-all tracking-widest"
      >
        前往【{CARRIAGE_NAMES.AR_CATCH || '民歌卡帶播放器'}】
      </button>
    </div>
  );

  return (
    <div className="w-full h-screen overflow-hidden bg-[#EAEAEA] text-folk-dark font-serif flex flex-col">
      <GlobalMoodEffects mood={globalMood} />
      
      <section ref={homeSectionRef} className="h-screen w-full relative shrink-0 overflow-hidden bg-[#EAEAEA]">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/home-bg.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/30 z-0"></div>
        
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center flex flex-col items-center bg-[#FDFBF7]/95 p-16 rounded-xl border-2 border-[#C0B8A3] shadow-2xl">
            <h1 className="text-7xl md:text-8xl font-bold tracking-[0.2em] mb-6 text-gray-800 drop-shadow-sm">民歌旅程</h1>
            <p className="text-2xl md:text-3xl text-gray-600 tracking-[0.3em] mb-12 border-t border-gray-400 pt-6">那年，我們唱自己的歌</p>
            <button onClick={handleStartIntro} className="px-12 py-5 bg-gray-800 text-[#F5F5F5] rounded-lg text-xl font-bold tracking-widest border-2 border-black shadow-[6px_6px_0_#4b5563] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#4b5563] transition-all">
              開始旅程 
            </button>
          </motion.div>
        </div>
      </section>

      <section ref={storySectionRef} className="h-screen w-full relative shrink-0 overflow-hidden bg-[#EAEAEA]">
        <div className="absolute inset-0 bg-cover bg-center z-0 opacity-40" style={{ backgroundImage: "url('/train-bg_2.jpg')" }}></div>
        
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-4xl bg-[#FDFBF7] p-12 md:p-16 rounded-xl shadow-2xl border-4 border-[#C0B8A3] flex flex-col items-center text-center">
             <h2 className="text-4xl md:text-5xl font-bold text-gray-800 tracking-widest mb-8 border-b-2 border-red-500 pb-4">歡迎搭乘民歌號</h2>
             <div className="text-xl md:text-2xl text-gray-700 leading-loose tracking-wider mb-12 text-left space-y-6">
                <p>這是一趟通往 1980 年代台灣的特別旅程。</p>
                <p>在這裡，沒有現代的喧囂，只有一把吉他、純粹的嗓音，以及那些曾經陪伴我們度過青春歲月的熟悉旋律。</p>
                <p>接下來，請您跟著車廂內的指示，與歌聲互動，重回那個時代，享受這段與民歌相伴的旅程。</p>
             </div>
             <div className="flex justify-center w-full">
               <button onClick={handleEnterTrain} className="px-12 py-5 bg-red-600 text-white rounded-lg text-xl font-bold tracking-widest border-2 border-red-800 shadow-[6px_6px_0_#7f1d1d] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#7f1d1d] transition-all">
                   點擊上車 
               </button>
             </div>
          </div>
        </div>
      </section>

      <section ref={trainSectionRef} className="h-screen w-full relative shrink-0 overflow-hidden bg-[#EAEAEA]">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/train-bg.jpg')" }}></div>
        
        <div className="relative z-20 w-full h-full">
          <div className="absolute top-6 right-8 z-50 group">
             <div className="flex items-center bg-[#FDFBF7] px-6 py-3 rounded-lg border-2 border-gray-400 shadow-[4px_4px_0_#9ca3af] relative z-20">
                <div className="mr-4 flex items-center justify-center">
                    <img src="/images/cassette.png" alt="Cassette" className="w-12 h-8 object-contain drop-shadow-sm" />
                </div>
                <div className="flex flex-col mr-8 min-w-[120px]">
                  <span className="text-xs text-gray-500 font-bold tracking-widest"></span>
                  <span className="text-lg text-gray-800 font-bold tracking-wider truncate max-w-[150px]">
                    {mainSong ? mainSong.title : (currentTrackName === 'bg_music.mp3' ? '經典民歌放送中' : (currentTrackName || '').replace('.mp3', ''))}
                  </span>
                </div>
                <button onClick={togglePlayPause} className="w-12 h-12 flex items-center justify-center bg-gray-200 text-2xl rounded text-gray-800 hover:bg-gray-300 border border-gray-400 transition-colors">
                  {isPlaying ? 'II' : '▶'}
                </button>
             </div>

             <div className="absolute top-[90%] left-4 right-4 bg-[#EAEAEA] border-x-2 border-b-2 border-gray-400 rounded-b-lg p-4 shadow-[4px_4px_0_#9ca3af] -z-10 transition-all duration-300 opacity-0 -translate-y-[20px] pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto flex flex-col items-center">
                <span className="text-[10px] text-gray-500 font-bold tracking-widest mb-2 w-full text-left"></span>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05" 
                  value={volume} 
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-600 outline-none"
                  style={{
                    background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${volume * 100}%, #d1d5db ${volume * 100}%, #d1d5db 100%)`
                  }}
                />
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
          />
        </div>
      </section>

      <section ref={gameSectionRef} className="h-screen w-full relative shrink-0 overflow-hidden bg-[#EAEAEA]">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('/game-bg.jpg')" }}></div>
        <div className="absolute inset-0 bg-black/10 z-0"></div> 
        
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center">
          
          {!activeMode && <div className="text-gray-700 text-2xl font-bold tracking-widest bg-[#F5F5F5] px-8 py-4 rounded-lg shadow border border-gray-300">請先在上方火車選擇一種體驗...</div>}

          {activeMode === 'mood-train' && (
            <div className="w-full h-full relative">
              <UnifiedBackButton onClick={handleLeaveGame} />
              <MoodTrainGame onMoodDetected={(mood) => setGlobalMood(mood)} onTicketGenerated={(img, finalMood) => { setTicketData({ image: img, mood: finalMood }); handleLeaveGame(); }} />
            </div>
          )}

          {activeMode === 'ar' && (
            <div className="w-full h-full relative">
              <UnifiedBackButton onClick={() => { playTrack(mainSong ? mainSong.audioFileName : 'bg_music.mp3'); handleLeaveGame(); }} />
              <ArGame onPreviewSong={(song) => { playTrack(song.audioFileName || song.audioFile); }} onConfirmSong={(song) => { setMainSong(song); playTrack(song.audioFileName || song.audioFile); handleLeaveGame(); }} />
            </div>
          )}

          {activeMode === 'ai-zimage' && (
             <div className="w-full h-full flex flex-col items-center justify-center relative">
               <UnifiedBackButton onClick={handleLeaveGame} />
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
              <UnifiedBackButton onClick={handleLeaveGame} />
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
              <UnifiedBackButton onClick={handleLeaveGame} />
              {!mainSong ? <RequireMainSongPrompt /> : <LyricsGame song={mainSong} onRestart={() => handleModeSelect({ id: 'ar' })} onHome={handleLeaveGame} onLyricsGenerated={(data) => setLyricsData(data)} />}
            </div>
          )}

          {activeMode === 'sing-along' && (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              <UnifiedBackButton onClick={handleLeaveGame} />
              {!mainSong ? <RequireMainSongPrompt /> : <SingAlongGame song={mainSong} onHome={handleLeaveGame} onRecordingComplete={(audioUrl) => { if (audioUrl) setRecordingData({ audioUrl, title: mainSong.title }); handleLeaveGame(); }} />}
            </div>
          )}

          {activeMode === 'capsule' && (
             <div className="w-full h-full flex flex-col items-center justify-center relative">
               <UnifiedBackButton onClick={handleLeaveGame} />
               <button onClick={handleEndJourney} className="absolute top-6 right-8 z-50 px-8 py-3 bg-red-500 text-white font-bold text-lg rounded-lg border-2 border-black shadow-[4px_4px_0_#4b5563] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#4b5563] transition-all tracking-widest flex items-center">
                 結束旅程
               </button>

               {!mainSong ? <RequireMainSongPrompt /> : <CapsuleGame song={mainSong} ticket={ticketData} cover={coverData} swapped={swappedData} lyrics={lyricsData} recording={recordingData} onHome={handleLeaveGame} />}
             </div>
          )}
        </div>
      </section>

      <section ref={outroSectionRef} className="h-screen w-full relative shrink-0 overflow-hidden bg-[#EAEAEA]">
        <div className="absolute inset-0 bg-cover bg-center z-0 opacity-30" style={{ backgroundImage: "url('/train-bg_2.jpg')" }}></div>
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-3xl bg-[#FDFBF7] p-12 md:p-16 rounded-xl shadow-2xl border-4 border-[#C0B8A3] flex flex-col items-center text-center">
             <h2 className="text-4xl font-bold text-gray-800 tracking-widest mb-6 border-b-2 border-red-500 pb-4">終點站到了</h2>
             <p className="text-xl text-gray-700 leading-loose tracking-wider mb-12">
               這首民歌的旅程在此告一段落，<br/>但台灣的民歌記憶，仍會在我們心中繼續傳唱下去。
             </p>
             <div className="flex gap-6 w-full justify-center">
               <button onClick={handleStartIntro} className="px-12 py-5 bg-[#FDFBF7]/90 text-gray-800 rounded-lg text-xl font-bold tracking-widest border-2 border-black shadow-[6px_6px_0_#4b5563] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#4b5563] transition-all">
                  重新開始
               </button>
               <button onClick={handleStartIntro} className="px-12 py-5 bg-red-600 text-[#F5F5F5] rounded-lg text-xl font-bold tracking-widest border-2 border-black shadow-[6px_6px_0_#4b5563] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#4b5563] transition-all">
                  填寫回饋問卷
               </button>
             </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default App;