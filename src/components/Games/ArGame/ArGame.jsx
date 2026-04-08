import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { folkSongs } from '../../../data/folkSongs';
import CassetteUI from '../../Shared/CassetteUI';
import { CARRIAGE_NAMES } from '../../../data/gameModes';

const radioPlayerUrl = '/images/cassette_player.png';

const ArGame = ({ onConfirmSong, onPreviewSong }) => {
  const webcamRef = useRef(null);

  const [handLandmarker, setHandLandmarker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(true);

  const cassetteRefs = useRef([]);
  const fingerDomRef = useRef(null);

  const elementsDataRef = useRef(
    folkSongs.map((song, index) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.175;
      return {
        id: song.id,
        title: song.title,
        cassetteImage: song.cassetteImage,
        x: 15 + Math.random() * 70,
        y: 15 + Math.random() * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed
      };
    })
  );

  const grabbedIdRef = useRef(null);
  const fingerPosRef = useRef({ x: -100, y: -100 });
  const isMouseDownRef = useRef(false);
  const mousePosRef = useRef({ x: -100, y: -100 });
  const lastTimeRef = useRef(performance.now());

  const [particles, setParticles] = useState([]);
  const [playingSong, setPlayingSong] = useState(null);
  const [showHint, setShowHint] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [dropCount, setDropCount] = useState(0);

  const callbacksRef = useRef({ onPreviewSong });
  useEffect(() => { callbacksRef.current = { onPreviewSong }; }, [onPreviewSong]);

  useEffect(() => {
    let timer;
    if (playingSong) {
      setCountdown(5);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setIsCameraActive(false);
            onConfirmSong(playingSong);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(null);
    }
    return () => clearInterval(timer);
  }, [playingSong, dropCount, onConfirmSong]);

  useEffect(() => {
    const initLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, delegate: "GPU" },
          runningMode: "VIDEO", numHands: 1
        });
        setHandLandmarker(landmarker);
        setIsLoading(false);
        // setShowHint is basically always true now, removed setTimeout
      } catch (err) {
        console.error("相機權限或模型載入失敗:", err);
      }
    };
    initLandmarker();
  }, []);

  useEffect(() => {
    if (!isCameraActive || !handLandmarker) return;

    let animationFrameId;

    const loop = () => {
      let now = performance.now();
      let fX = fingerPosRef.current.x;
      let fY = fingerPosRef.current.y;

      let dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      let speedScale = dt / 16.666;
      if (speedScale > 3) speedScale = 3;

      if (webcamRef.current && webcamRef.current.video) {
        const video = webcamRef.current.video;
        if (video.readyState === 4) {
          const result = handLandmarker.detectForVideo(video, now);
          if (result.landmarks && result.landmarks.length > 0) {
            const indexTip = result.landmarks[0][8];
            if (!isMouseDownRef.current) {
              fX = (1 - indexTip.x) * 100;
              fY = indexTip.y * 100;
              fingerPosRef.current = { x: fX, y: fY };
            }
          }
        }
      }

      if (isMouseDownRef.current) {
        fX = mousePosRef.current.x;
        fY = mousePosRef.current.y;
        fingerPosRef.current = { x: fX, y: fY };
      }

      let els = elementsDataRef.current;
      let currentGrab = grabbedIdRef.current;

      els.forEach(el => {
        if (el.id === currentGrab) return;
        el.x += el.vx * speedScale;
        el.y += el.vy * speedScale;

        if (el.x < 8) { el.x = 8; el.vx = Math.abs(el.vx); }
        if (el.x > 92) { el.x = 92; el.vx = -Math.abs(el.vx); }
        if (el.y < 8) { el.y = 8; el.vy = Math.abs(el.vy); }
        if (el.y > 65) { el.y = 65; el.vy = -Math.abs(el.vy); }

        // 強制全部統一維持原先設計的恆定速度
        const currentSpeed = Math.hypot(el.vx, el.vy);
        if (currentSpeed > 0 && Math.abs(currentSpeed - 0.175) > 0.001) {
          el.vx = (el.vx / currentSpeed) * 0.175;
          el.vy = (el.vy / currentSpeed) * 0.175;
        }
      });

      for (let i = 0; i < els.length; i++) {
        for (let j = i + 1; j < els.length; j++) {
          let e1 = els[i];
          let e2 = els[j];
          if (e1.id === currentGrab || e2.id === currentGrab) continue;

          let dx = e2.x - e1.x;
          let dy = e2.y - e1.y;
          let dist = Math.hypot(dx, dy);
          let minDist = 22;

          if (dist < minDist && dist > 0) {
            let overlap = minDist - dist;
            let nx = dx / dist;
            let ny = dy / dist;

            e1.x -= nx * (overlap / 2);
            e1.y -= ny * (overlap / 2);
            e2.x += nx * (overlap / 2);
            e2.y += ny * (overlap / 2);

            let tvx = e1.vx, tvy = e1.vy;
            e1.vx = e2.vx; e1.vy = e2.vy;
            e2.vx = tvx; e2.vy = tvy;
          }
        }
      }

      const isInPlayerZone = (fX > 30 && fX < 70 && fY > 70);

      if (currentGrab) {
        let grabbedEl = els.find(el => el.id === currentGrab);
        if (grabbedEl) {
          grabbedEl.x = fX;
          grabbedEl.y = fY;
        }

        if (isInPlayerZone) {
          const originalSong = folkSongs.find(s => s.id === currentGrab);
          if (originalSong) {
            setPlayingSong(originalSong);
            setDropCount(prev => prev + 1);
            if (callbacksRef.current.onPreviewSong) {
              callbacksRef.current.onPreviewSong(originalSong);
            }
          }

          triggerParticles();
          grabbedIdRef.current = null;

          if (grabbedEl) {
            grabbedEl.x = 20 + Math.random() * 60;
            grabbedEl.y = 10 + Math.random() * 20;
            const angle = Math.random() * Math.PI * 2;
            grabbedEl.vx = Math.cos(angle) * 0.175;
            grabbedEl.vy = Math.sin(angle) * 0.175;
          }
        }
      } else {
        const hitElement = els.find(el => Math.hypot(el.x - fX, el.y - fY) < 12);
        if (hitElement && fX !== 0) {
          grabbedIdRef.current = hitElement.id;
        }
      }

      els.forEach((el, i) => {
        if (cassetteRefs.current[i]) {
          const isGrabbed = currentGrab === el.id;
          cassetteRefs.current[i].style.left = `${el.x}%`;
          cassetteRefs.current[i].style.top = `${el.y}%`;
          cassetteRefs.current[i].style.transform = `translate(-50%, -50%) scale(${isGrabbed ? 1.2 : 1})`;
          cassetteRefs.current[i].style.zIndex = isGrabbed ? 50 : 10;
        }
      });

      if (fingerDomRef.current) {
        const isGrabbing = currentGrab !== null;
        fingerDomRef.current.style.left = `${fX}%`;
        fingerDomRef.current.style.top = `${fY}%`;
        fingerDomRef.current.style.transform = `translate(-50%, -50%) scale(${isGrabbing ? 1.5 : 1})`;
        fingerDomRef.current.style.backgroundColor = isGrabbing ? '#facc15' : '#ef4444';
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [handLandmarker, isCameraActive]);

  const triggerParticles = () => {
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: Date.now() + i,
      x: 50 + (Math.random() - 0.5) * 10,
      y: 80,
      vx: (Math.random() - 0.5) * 2,
      vy: -Math.random() * 3 - 2,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1500);
  };

  const handleConfirmClick = () => {
    if (!playingSong) return;
    setIsCameraActive(false);
    onConfirmSong(playingSong);
  };

  return (
    <div
      className="relative w-full h-full bg-gray-900 overflow-hidden select-none shadow-xl"
      onMouseDown={(e) => {
        isMouseDownRef.current = true;
        const rect = e.currentTarget.getBoundingClientRect();
        mousePosRef.current = {
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        };
      }}
      onMouseMove={(e) => {
        if (!isMouseDownRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        mousePosRef.current = {
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        };
      }}
      onMouseUp={() => { isMouseDownRef.current = false; }}
      onMouseLeave={() => { isMouseDownRef.current = false; }}
    >

      {/* 已移除 AR 車廂標題 */}

      {/* 已根據要求移除右上角的選擇歌曲按鈕 */}

      {isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#FDFBF7] text-gray-800">
          <div className="w-16 h-16 border-8 border-gray-300 border-t-red-600 rounded-full animate-spin mb-6"></div>
          <p className="animate-pulse text-2xl font-bold tracking-widest border-b-2 border-rose-400 pb-2">為您準備播放器中，請稍候片刻</p>
        </div>
      )}

      {isCameraActive && (
        <Webcam ref={webcamRef} className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1] opacity-60" audio={false} />
      )}

      <div className="absolute inset-0 pointer-events-none">

        {showHint && !isLoading && (
          <div className="absolute top-32 left-0 w-full text-center z-40">
            <span className="bg-[#FDFBF7]/85 backdrop-blur-sm text-gray-800 border border-gray-200/50 px-8 py-4 rounded-full shadow-lg font-bold tracking-widest text-lg transition-all duration-300">
              {playingSong && countdown !== null ? `選擇歌曲倒數 ${countdown}` : "將食指移入畫面中，拖曳卡帶放入播放器中"}
            </span>
          </div>
        )}

        {particles.map(p => (
          <div key={p.id} className="absolute w-3 h-3 rounded-full bg-yellow-300 shadow-[0_0_10px_#facc15] transition-transform duration-1000 ease-out"
            style={{ left: `${p.x + p.vx * 10}%`, top: `${p.y + p.vy * 10}%`, opacity: 0 }} />
        ))}

        {elementsDataRef.current.map((el, i) => (
          <div
            key={el.id}
            ref={node => cassetteRefs.current[i] = node}
            className="absolute flex flex-col items-center justify-center transition-transform duration-100"
            style={{ left: `${el.x}%`, top: `${el.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <CassetteUI title={el.title} size="small" image={el.cassetteImage} />
          </div>
        ))}

        {!isLoading && (
          <div
            ref={fingerDomRef}
            className="absolute w-8 h-8 rounded-full border-4 border-[#FDFBF7] shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-colors duration-150"
            style={{ left: '-100%', top: '-100%', transform: 'translate(-50%, -50%)' }}
          ></div>
        )}

        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[300px]">

          <div className="absolute top-[45px] left-1/2 transform -translate-x-1/2 flex items-center justify-center z-50 w-full text-center">
            {!playingSong ? (
              <img src="/images/arrow.png" alt="向下放入" className="w-14 h-14 object-contain animate-bounce opacity-80" />
            ) : (
              <button
                onClick={handleConfirmClick}
                className="bg-red-600 text-white border border-red-500 px-8 py-4 rounded-full shadow-lg font-bold tracking-widest text-lg hover:bg-red-500 transition-colors pointer-events-auto"
              >
                點擊選擇
              </button>
            )}
          </div>

          <div className="w-full h-full relative flex items-end justify-center drop-shadow-2xl">
            <img src={radioPlayerUrl} alt="收音機" className="absolute bottom-[-20px] w-full object-contain pointer-events-none z-10" />
            <div className="absolute bottom-[55px] w-[180px] h-[110px] z-20 flex items-center justify-center bg-transparent">
              {playingSong ? (
                <div className="animate-fade-in-up transform scale-[0.6] origin-center mt-2">
                  <CassetteUI title={playingSong.title} size="normal" image={playingSong.cassetteImage} />
                </div>
              ) : (
                <div className="text-gray-400 font-bold text-sm tracking-widest flex flex-col items-center justify-center gap-1 w-full h-full border border-dashed border-gray-600 bg-black/60 rounded">

                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ArGame;