import React, { useState, useEffect, useRef } from 'react';
import { lyricsData } from '../../../data/lyricsData';
import { CARRIAGE_NAMES } from '../../../data/gameModes';

const SingAlongGame = ({ song, onHome, onRecordingComplete }) => {
  const [lyricsLines, setLyricsLines] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  const [liveTranscript, setLiveTranscript] = useState("");

  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [sungLines, setSungLines] = useState(new Set());
  const [isFinished, setIsFinished] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const lyricRefs = useRef([]);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const activeLineIndexRef = useRef(0);
  const sungLinesRef = useRef(new Set());
  const isPlayingRef = useRef(false);
  const lastMatchTimeRef = useRef(0);

  const matchedWordsInCurrentLineRef = useRef([]);

  const startRecognitionRef = useRef(null);
  const restartIntervalRef = useRef(null);

  const savedTranscriptRef = useRef("");
  const tempTranscriptRef = useRef("");

  useEffect(() => {
    activeLineIndexRef.current = activeLineIndex;
    sungLinesRef.current = sungLines;
    isPlayingRef.current = isPlaying;
  }, [activeLineIndex, sungLines, isPlaying]);

  useEffect(() => {
    if (song) {
      const rawText = lyricsData[song.id] || "找不到歌詞";
      const lines = rawText.split('\n').filter(line => line.trim().length > 0);
      setLyricsLines(lines);
      setActiveLineIndex(0);
      setSungLines(new Set());
      setIsFinished(false);
      setHasStarted(false);
      audioChunksRef.current = [];
      lyricRefs.current = new Array(lines.length).fill(null);

      activeLineIndexRef.current = 0;
      sungLinesRef.current = new Set();
      isPlayingRef.current = false;
      lastMatchTimeRef.current = 0;
      matchedWordsInCurrentLineRef.current = [];
      savedTranscriptRef.current = "";
      tempTranscriptRef.current = "";
    }
  }, [song]);

  const stopAllMedia = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsListening(false);

    if (restartIntervalRef.current) {
      clearInterval(restartIntervalRef.current);
    }

    if (recognitionRef.current) {
      recognitionRef.current.onstart = null;
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      try { recognitionRef.current.abort(); } catch (e) { }
    }

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch (e) { }
      }
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
    if (audioRef.current) audioRef.current.pause();
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      return;
    }

    startRecognitionRef.current = () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        try { recognitionRef.current.abort(); } catch (e) { }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-TW';

      if (SpeechGrammarList && lyricsLines.length > 0) {
        const speechRecognitionList = new SpeechGrammarList();
        const uniqueWords = Array.from(new Set(lyricsLines.join('').replace(/[^\u4e00-\u9fa5]/g, '').split('')));
        const grammar = '#JSGF V1.0; grammar lyrics; public <lyric> = ' + uniqueWords.join(' | ') + ' ;';
        try {
          speechRecognitionList.addFromString(grammar, 1);
          recognition.grammars = speechRecognitionList;
        } catch (e) { }
      }

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }

        tempTranscriptRef.current = transcript;
        const fullTranscript = savedTranscriptRef.current + transcript;

        setLiveTranscript(fullTranscript);
        const cleanTranscript = fullTranscript.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');

        if (cleanTranscript.length >= 2 && lyricsLines.length > 0) {

          const currentActive = activeLineIndexRef.current;
          const currentSung = sungLinesRef.current;
          const now = Date.now();

          if (now - lastMatchTimeRef.current < 2500) {
            return;
          }

          const startIndex = currentActive;
          const endIndex = Math.min(lyricsLines.length, currentActive + 2);

          let matchedIndex = -1;

          for (let i = startIndex; i < endIndex; i++) {
            if (i > currentActive && currentSung.has(i)) continue;

            const targetText = lyricsLines[i].replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
            if (targetText.length === 0) continue;

            let isMatch = false;

            for (let j = 0; j < cleanTranscript.length - 1; j++) {
              const twoChars = cleanTranscript.substring(j, j + 2);

              if (targetText.includes(twoChars)) {
                if (i === currentActive) {
                  const char1AlreadyMatched = matchedWordsInCurrentLineRef.current.includes(twoChars[0]);
                  const char2AlreadyMatched = matchedWordsInCurrentLineRef.current.includes(twoChars[1]);

                  if (!char1AlreadyMatched || !char2AlreadyMatched) {
                    matchedWordsInCurrentLineRef.current.push(twoChars[0], twoChars[1]);
                    isMatch = true;
                    break;
                  } else {
                    continue;
                  }
                } else {
                  isMatch = true;
                  break;
                }
              }
            }

            if (isMatch) {
              matchedIndex = i;
              break;
            }
          }

          if (matchedIndex !== -1 && matchedIndex > currentActive) {
            lastMatchTimeRef.current = Date.now();
            setActiveLineIndex(matchedIndex);

            setSungLines(prev => {
              const newSet = new Set(prev);
              for (let k = 0; k <= matchedIndex; k++) newSet.add(k);
              return newSet;
            });

            activeLineIndexRef.current = matchedIndex;
            matchedWordsInCurrentLineRef.current = [];
            savedTranscriptRef.current = "";
            tempTranscriptRef.current = "";

            if (lyricsContainerRef.current && lyricRefs.current[matchedIndex]) {
              const container = lyricsContainerRef.current;
              const targetNode = lyricRefs.current[matchedIndex];
              const scrollTarget = targetNode.offsetTop - (container.clientHeight / 2) + (targetNode.clientHeight / 2);
              container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
            }

            if (matchedIndex >= lyricsLines.length - 2) {
              setIsFinished(true);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'aborted' && isPlayingRef.current) {
          console.log('語音辨識發生錯誤:', event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (tempTranscriptRef.current) {
          savedTranscriptRef.current += tempTranscriptRef.current;
          tempTranscriptRef.current = "";
        }
        if (isPlayingRef.current && startRecognitionRef.current) {
          setTimeout(() => {
            if (isPlayingRef.current && startRecognitionRef.current) {
              startRecognitionRef.current();
            }
          }, 100);
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch (e) {
        console.log("啟動辨識失敗", e);
      }
    };

    return () => {
      stopAllMedia();
    };
  }, [lyricsLines]);

  useEffect(() => {
    if (isPlaying) {
      restartIntervalRef.current = setInterval(() => {
        if (isPlayingRef.current && recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (e) { }
          // abort 會觸發 onend，我們在裡面加入了自動保存之前的句字並重啟的機制。
        }
      }, 20000);
    } else {
      if (restartIntervalRef.current) {
        clearInterval(restartIntervalRef.current);
      }
    }

    return () => {
      if (restartIntervalRef.current) {
        clearInterval(restartIntervalRef.current);
      }
    };
  }, [isPlaying]);


  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration || 1;
    setProgress((current / duration) * 100);

    if ((current / duration) > 0.05) {
      setIsFinished(true);
    }
  };

  const togglePlayAndMic = async () => {
    if (!hasStarted) {
      setHasStarted(true);
      if (lyricsContainerRef.current && lyricRefs.current[0]) {
        setTimeout(() => {
          const container = lyricsContainerRef.current;
          const targetNode = lyricRefs.current[0];
          const scrollTarget = targetNode.offsetTop - (container.clientHeight / 2) + (targetNode.clientHeight / 2);
          container.scrollTo({ top: scrollTarget, behavior: 'smooth' });
        }, 100);
      }
    }

    if (isPlaying) {
      audioRef.current.pause();
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try { recognitionRef.current.abort(); } catch (e) { }
      }
      setIsListening(false);
      setLiveTranscript("");
      savedTranscriptRef.current = "";
      tempTranscriptRef.current = "";

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {

      if (!mediaRecorderRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          mediaRecorder.start();
        } catch (err) {
          console.error("無法取得麥克風錄音權限", err);
          alert("需要麥克風權限才能為您錄音！");
          return;
        }
      } else {
        if (mediaRecorderRef.current.state === 'paused') {
          mediaRecorderRef.current.resume();
        } else if (mediaRecorderRef.current.state === 'inactive') {
          audioChunksRef.current = [];
          mediaRecorderRef.current.start();
        }
      }

      isPlayingRef.current = true;

      if (startRecognitionRef.current) {
        startRecognitionRef.current();
      }

      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleProgressClick = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audioRef.current.currentTime = percent * audioRef.current.duration;
  };

  const handleFinishAndSave = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          stopAllMedia();
          onRecordingComplete(audioUrl);
        } else {
          stopAllMedia();
          onRecordingComplete(null);
        }
      };
      mediaRecorderRef.current.stop();
    } else {
      let audioUrl = null;
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        audioUrl = URL.createObjectURL(audioBlob);
      }
      stopAllMedia();
      onRecordingComplete(audioUrl);
    }
  };

  const executeBackToHome = () => {
    stopAllMedia();
    onHome();
  };

  if (!recognitionSupported) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#EAEAEA]">
        <button onClick={executeBackToHome} className="btn-secondary absolute top-6 left-6 z-50">返回車廂</button>
        <div className="bg-white p-10 rounded-lg shadow-xl text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-4">麥克風暫時無法使用</h2>
          <p className="text-gray-600">您的瀏覽器不支援語音辨識功能，請使用 Chrome 或 Edge 瀏覽器開啟。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-transparent pt-16 pb-8 px-8">

      <div className="absolute top-6 left-0 w-full flex justify-center pointer-events-none z-40">
        <h2 className="text-4xl font-bold text-white tracking-widest drop-shadow-md inline-block font-serif">
          {CARRIAGE_NAMES.SING_ALONG}
        </h2>
      </div>

      <audio
        ref={audioRef}
        src={`/music/${song.audioFileName}`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          setIsPlaying(false);
          isPlayingRef.current = false;
          if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            try { recognitionRef.current.abort(); } catch (e) { }
          }
          setIsListening(false);
          setIsFinished(true);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.pause();
        }}
        className="hidden"
      />

      <div className="w-full max-w-5xl h-full flex flex-col bg-[#E0D8C3] rounded-xl shadow-2xl border-4 border-[#C0B8A3] overflow-hidden relative mt-8">

        {/* 依要求移除原本點擊播放的提示文字 */}

        <div className="w-full bg-[#D64F3E] p-4 px-6 flex justify-between items-center shadow-md z-20 border-b-4 border-[#B83E2F]">
          <div className="flex items-center gap-4 min-w-[200px]">

            <div className="flex items-center justify-center mr-2">
              <img src={song.cassetteImage || "/images/cassette_1.png"} alt="Cassette" className="w-12 h-8 object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-3">
                <h2 className="text-[#F5F5F5] text-xl font-bold tracking-widest font-serif drop-shadow">{song.title}</h2>
                <span className="text-white/80 text-sm font-serif tracking-wider">{song.singer}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-6 max-w-xl">
            <button onClick={togglePlayAndMic} className="w-12 h-12 bg-[#FDFBF7] text-gray-700 rounded-full flex items-center justify-center shadow-md border border-gray-100 text-xl font-bold transition-colors hover:bg-white">
              {isPlaying ? 'II' : '▶'}
            </button>
            <div
              className="flex-1 h-4 bg-black/30 rounded-full overflow-hidden relative shadow-inner border border-black/20 cursor-pointer"
              onClick={handleProgressClick}
            >
              <div className="absolute top-0 left-0 h-full bg-yellow-400 transition-all duration-75 ease-linear pointer-events-none" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full bg-white overflow-hidden relative flex flex-col items-center py-0 px-8 border-b border-gray-200">

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80%] h-[4.5rem] border-y border-rose-300/40 bg-rose-50/20 pointer-events-none rounded-xl z-10 shadow-sm"></div>

          <div
            ref={lyricsContainerRef}
            className="w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center gap-8 relative z-0"
          >
            <div className="w-full shrink-0 pointer-events-none" style={{ height: '40vh' }}></div>

            {lyricsLines.map((line, index) => {
              const isActive = index === activeLineIndex;
              const isSung = sungLines.has(index);

              return (
                <div
                  key={index}
                  ref={el => lyricRefs.current[index] = el}
                  className={`
                        relative text-2xl md:text-3xl font-serif tracking-widest transition-all duration-500 text-center px-6 py-2 rounded-lg min-h-[3rem] flex items-center justify-center shrink-0
                        ${isActive ? 'text-yellow-600 bg-yellow-50 shadow-sm scale-110 font-bold border border-yellow-200 z-20' :
                      isSung ? 'text-green-700/60 opacity-60 scale-95' : 'text-gray-400 opacity-80 font-bold'}
                      `}
                >
                  {line}
                </div>
              );
            })}

            <div className="w-full shrink-0 pointer-events-none" style={{ height: '40vh' }}></div>
          </div>

          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none z-20"></div>
          <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-20"></div>
        </div>

        <div className="h-28 w-full bg-[#2A2A2A] flex flex-row items-center justify-between relative px-8 shadow-inner z-20">

          <div className="flex flex-col flex-1 justify-center">
            <div className="w-full max-w-xl h-10 bg-[#111] rounded border-2 border-gray-600 shadow-inner flex items-center overflow-hidden px-4">
              {liveTranscript ? (
                <span className="text-green-400 font-mono text-sm tracking-wider animate-fade-in truncate">
                  &gt; {liveTranscript}
                </span>
              ) : (
                <span className="text-gray-600 font-mono text-sm tracking-wider">
                  {isListening ? '> (等待聲音輸入)' : '> 聲音紀錄'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center w-full max-w-sm">
            <button
              onClick={() => {
                if (!hasStarted) {
                  togglePlayAndMic();
                } else {
                  handleFinishAndSave();
                }
              }}
              className={`transition-all duration-300 text-lg w-full max-w-[320px] truncate shrink-0
                   ${!hasStarted
                  ? 'btn-primary py-4 '
                  : 'bg-[#B83E2F] hover:bg-red-700 text-white py-4 rounded-full font-bold tracking-widest shadow-[0_4px_12px_rgba(0,0,0,0.6)] border border-red-900'}`}
            >
              {!hasStarted ? '開始錄音' : '錄音完成'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SingAlongGame;