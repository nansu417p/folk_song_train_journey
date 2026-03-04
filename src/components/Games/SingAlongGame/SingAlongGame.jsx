import React, { useState, useEffect, useRef } from 'react';
import { lyricsData } from '../../../data/lyricsData';

const SingAlongGame = ({ song, onHome }) => {
  const [lyricsLines, setLyricsLines] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState(""); 
  
  const [activeLineIndex, setActiveLineIndex] = useState(0); 
  const [glowingLineIndex, setGlowingLineIndex] = useState(-1); 
  
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const glowTimeoutRef = useRef(null);

  useEffect(() => {
    if (song) {
      const rawText = lyricsData[song.id] || "找不到歌詞";
      const lines = rawText.split('\n').filter(line => line.trim().length > 0);
      setLyricsLines(lines);
    }
  }, [song]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;       
    recognition.interimResults = true;   
    recognition.lang = 'zh-TW';          

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      
      setLiveTranscript(transcript);

      const cleanTranscript = transcript.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');

      if (cleanTranscript.length >= 2 && lyricsLines.length > 0) {
        let matchFound = false;
        
        const startIndex = activeLineIndex; 
        const endIndex = Math.min(lyricsLines.length, activeLineIndex + 5);
        
        for (let i = startIndex; i < endIndex; i++) {
          const currentText = lyricsLines[i].replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
          
          for (let j = 0; j < cleanTranscript.length - 1; j++) {
            const bigram = cleanTranscript.substring(j, j + 2);
            if (currentText.includes(bigram)) {
              
              setActiveLineIndex(i);
              setGlowingLineIndex(i);
              
              // ★ 關鍵修復：拔除霸道的 scrollIntoView，改用精準的容器內部 scrollTo
              if (lyricsContainerRef.current) {
                const container = lyricsContainerRef.current;
                const lineElement = container.children[i];
                if (lineElement) {
                  // 計算該行歌詞距離容器頂部的距離，並減去容器一半的高度，使其完美置中
                  const scrollTarget = lineElement.offsetTop - (container.clientHeight / 2) + (lineElement.clientHeight / 2);
                  container.scrollTo({
                    top: scrollTarget,
                    behavior: 'smooth'
                  });
                }
              }

              if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
              glowTimeoutRef.current = setTimeout(() => {
                setGlowingLineIndex(-1);
              }, 2000);

              matchFound = true;
              break;
            }
          }
          if (matchFound) break;
        }
      }
    };

    recognition.onerror = (event) => {
      console.log('語音辨識發生錯誤:', event.error);
      if (event.error === 'no-speech' && isPlaying) {
        try { recognition.start(); } catch(e) {}
      }
    };

    recognition.onend = () => {
      if (isPlaying) {
         try { recognition.start(); } catch(e) {}
      }
    }

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    };
  }, [activeLineIndex, lyricsLines, isPlaying]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const togglePlayAndMic = () => {
    if (isPlaying) {
      audioRef.current.pause();
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setLiveTranscript(""); 
    } else {
      audioRef.current.play();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.log("麥克風啟動中");
        }
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audioRef.current.currentTime = percentage * audioRef.current.duration;
  };

  if (!recognitionSupported) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#EAEAEA]">
        <button onClick={onHome} className="absolute top-6 left-6 z-50 px-5 py-2.5 bg-[#F5F5F5] text-gray-800 font-bold rounded-lg shadow border border-gray-300 hover:bg-gray-200 transition-all">← 返回火車</button>
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-4">無法啟動麥克風</h2>
          <p className="text-gray-600">您的瀏覽器不支援語音辨識功能，請使用 Chrome 或 Edge 瀏覽器開啟。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-transparent pt-16 pb-8 px-8">
      
      <button onClick={onHome} className="absolute top-6 left-6 z-50 px-5 py-2.5 bg-[#F5F5F5] text-gray-800 font-bold rounded-lg shadow border border-gray-300 hover:bg-gray-200 transition-all tracking-wide">
        ← 返回火車
      </button>

      <audio 
         ref={audioRef}
         src={`/music/${song.audioFileName}`} 
         onTimeUpdate={handleTimeUpdate}
         onEnded={() => { setIsPlaying(false); if(recognitionRef.current) recognitionRef.current.stop(); setIsListening(false); }}
         className="hidden"
      />

      <div className="w-full max-w-5xl h-full flex flex-col bg-[#E0D8C3] rounded-xl shadow-2xl border border-[#C0B8A3] overflow-hidden relative">
          
          <div className="w-full bg-[#D64F3E] p-4 px-6 flex justify-between items-center shadow-md z-10 border-b border-[#B83E2F]">
             <div className="flex items-center gap-4 min-w-[200px]">
               <div className={`w-12 h-12 bg-white/20 rounded-full flex items-center justify-center ${isPlaying ? 'animate-spin-slow' : ''}`}>💿</div>
               <div className="flex flex-col">
                 <span className="text-white/80 text-[10px] tracking-widest font-bold">SING ALONG</span>
                 <div className="flex items-baseline gap-3">
                   <h2 className="text-[#F5F5F5] text-xl font-bold tracking-widest font-serif drop-shadow">{song.title}</h2>
                   <span className="text-white/80 text-sm font-serif tracking-wider">{song.singer}</span>
                 </div>
               </div>
             </div>
             
             <div className="flex-1 flex items-center gap-6 max-w-xl">
               <button onClick={togglePlayAndMic} className="w-12 h-12 bg-[#F5F5F5] text-[#D64F3E] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md text-xl pl-1">
                 {isPlaying ? 'II' : '▶'}
               </button>
               <div 
                 className="flex-1 h-3 bg-black/20 rounded-full overflow-hidden relative shadow-inner border border-black/10 cursor-pointer"
                 onClick={handleProgressClick}
               >
                 <div className="absolute top-0 left-0 h-full bg-yellow-400 transition-all duration-75 ease-linear pointer-events-none" style={{ width: `${progress}%` }}></div>
               </div>
             </div>
          </div>

          <div className="flex-1 w-full bg-[#FDFBF7] overflow-hidden relative flex flex-col items-center py-10 px-8 border-b-4 border-dashed border-[#C0B8A3]">
             
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-16 border-y-2 border-red-300/30 bg-red-50/10 pointer-events-none rounded-lg z-10"></div>

             <div 
               ref={lyricsContainerRef}
               className="w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center gap-6 pb-[40vh] pt-[20vh] relative z-0"
             >
                {lyricsLines.map((line, index) => {
                  const isActive = index === activeLineIndex;
                  const isPassed = index < activeLineIndex;
                  const isHit = index === glowingLineIndex;
                  
                  return (
                    <div 
                      key={index} 
                      className={`
                        relative text-2xl md:text-3xl font-serif tracking-widest transition-all duration-500 text-center px-6 py-3 rounded-lg
                        ${isHit ? 'text-yellow-600 bg-yellow-100/50 shadow-[0_0_15px_rgba(250,204,21,0.4)] scale-110 font-bold border border-yellow-300/50 z-20' : 
                          isActive ? 'text-gray-800 scale-105 font-bold z-10' : 
                          isPassed ? 'text-gray-400 opacity-60 scale-95' : 'text-gray-500 opacity-80'}
                      `}
                    >
                      {line}
                      {isHit && (
                        <span className="absolute -top-4 -right-2 text-yellow-500 text-2xl animate-bounce drop-shadow">🎵</span>
                      )}
                    </div>
                  );
                })}
             </div>
             
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#FDFBF7] to-transparent pointer-events-none z-20"></div>
             <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#FDFBF7] to-transparent pointer-events-none z-20"></div>
          </div>

          <div className="h-28 w-full bg-[#2A2A2A] flex flex-col items-center justify-center relative p-4 shadow-inner">
             <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gray-600 rounded-b-md"></div>
             
             <div className="flex items-center gap-3 mb-2">
               <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse' : 'bg-gray-500'}`}></div>
               <span className="text-gray-400 text-xs tracking-widest font-bold">
                 {isListening ? '系統正在聆聽您的歌聲...' : '等待播放音樂'}
               </span>
             </div>
             
             <div className="w-full max-w-3xl h-10 bg-[#111] rounded border border-gray-600 shadow-inner flex items-center justify-center overflow-hidden px-4">
                {liveTranscript ? (
                  <span className="text-green-400 font-mono text-sm tracking-wider animate-fade-in truncate">
                    &gt; {liveTranscript}
                  </span>
                ) : (
                  <span className="text-gray-600 font-mono text-sm tracking-wider">
                    {isListening ? '> (等待聲音輸入...)' : '> SYSTEM OFFLINE'}
                  </span>
                )}
             </div>
          </div>

      </div>
    </div>
  );
};

export default SingAlongGame;