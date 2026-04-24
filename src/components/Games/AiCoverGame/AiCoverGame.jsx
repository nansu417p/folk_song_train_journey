import React, { useState, useRef, useMemo, useEffect } from 'react';
import { SUBJECT_CATEGORIES, SUBJECT_TRAITS, STYLES_BANK } from '../../../data/folkSongs';
import { CARRIAGE_NAMES } from '../../../data/gameModes';

const BASE_PROMPT = "high quality, masterpiece, best quality, 1980s vintage taiwanese aesthetic, pure visual art, pure background, strictly no text, completely textless, unlabeled, no lettering, nostalgic atmosphere, edge-to-edge, detailed, vibrant";

const AiCoverGame_zimage = ({ song, onHome, coverStatus, generatedCoverImg, onStartGenerate, onSetMockCover, onCoverGenerated, hasExistingCover, existingCoverImg, onCancelCover }) => {
  const [isExtracted, setIsExtracted] = useState(false);

  const [currentOptions, setCurrentOptions] = useState({ subjects: [], seasons: [], elements: [], styles: [] });
  const [selections, setSelections] = useState({ subject: null, season: null, element: null, style: null });
  const [customWord, setCustomWord] = useState('');

  const getRandomItems = (arr, num) => [...arr].sort(() => 0.5 - Math.random()).slice(0, num);

  const handleExtractLyrics = () => {
    const bank = song.promptBank || { seasons: [], elements: [] };
    const newOptions = {
      subjects: SUBJECT_CATEGORIES,
      seasons: getRandomItems(bank.seasons, 3),
      elements: getRandomItems(bank.elements, 3),
      styles: getRandomItems(STYLES_BANK, 3)
    };
    setCurrentOptions(newOptions);

    setSelections({
      subject: newOptions.subjects.length > 0 ? newOptions.subjects[Math.floor(Math.random() * newOptions.subjects.length)] : null,
      season: newOptions.seasons.length > 0 ? newOptions.seasons[Math.floor(Math.random() * newOptions.seasons.length)] : null,
      element: newOptions.elements.length > 0 ? newOptions.elements[Math.floor(Math.random() * newOptions.elements.length)] : null,
      style: newOptions.styles.length > 0 ? newOptions.styles[Math.floor(Math.random() * newOptions.styles.length)] : null
    });

    setIsExtracted(true);
  };

  useEffect(() => {
    handleExtractLyrics();
  }, [song.id]);

  const handleSelect = (category, item) => {
    setSelections(prev => ({
      ...prev,
      [category]: prev[category]?.label === item.label ? null : item
    }));
  };

  const triggerGenerate = () => {
    if (coverStatus === 'generating') return;

    const promptParts = [];

    promptParts.push(BASE_PROMPT);

    const isNight = selections.season?.value.includes('night') || selections.season?.value.includes('starry') || selections.element?.value.includes('night');

    if (selections.style) {
      promptParts.push(selections.style.value);
    } else {
      promptParts.push("vintage taiwanese illustration style");
    }

    let subjectText = "";
    if (selections.subject && (selections.subject.type === 'male' || selections.subject.type === 'female')) {
      const pool = SUBJECT_TRAITS[selections.subject.type];
      const h = pool.hair[Math.floor(Math.random() * pool.hair.length)];
      const o = pool.outfit[Math.floor(Math.random() * pool.outfit.length)];
      const a = pool.accessory[Math.floor(Math.random() * pool.accessory.length)];
      const v = pool.vibe[Math.floor(Math.random() * pool.vibe.length)];

      const genderTerm = selections.subject.type === 'male' ? "1boy" : "1girl";
      subjectText = `${genderTerm}, taiwanese person, ${h}, wearing ${o}, ${a}, ${v}, retro 1980s portrait photography`;
    } else {
      const pool = SUBJECT_TRAITS.scenery;
      const l = pool.landscape[Math.floor(Math.random() * pool.landscape.length)];
      const o = pool.object[Math.floor(Math.random() * pool.object.length)];
      const m = pool.mood[Math.floor(Math.random() * pool.mood.length)];
      subjectText = `pure visual art, ${l}, featuring ${o}, ${m}, 80s aesthetic, no humans`;
    }

    if (isNight) {
      subjectText = subjectText.replace(/natural sunlight|warm glow|bright sun|sunlight|golden hour/gi, "dim lighting, moonlite glow");
      promptParts.push("dark night scene, starry night sky, deep shadows");
    }
    promptParts.push(subjectText);

    if (selections.element) promptParts.push(selections.element.value);
    if (selections.season) promptParts.push(selections.season.value);

    if (customWord.trim()) promptParts.push(customWord.trim());

    promptParts.push("center composition");

    const prompt = promptParts.join(", ");

    const isRealistic = selections.style?.label === "寫真";
    const clarityKeywords = isRealistic ? "sharp focus, high definition, crisp edges, highly detailed" : "";
    const textNegatives = "text, font, chinese characters, hanzi, kanji, letters, alphabet, watermark, logo, sign, billboard, banner, typography, signature, brand, calligraphy, words, labels";
    const qualityNegatives = "blur, blurry, out of focus, shaky, lowres, low quality, artifact, distorted, foggy, hazy, melted face, bad anatomy";

    let dynamicNegative = isRealistic
      ? `illustration, painting, drawing, cartoon, anime, 3d render, sketch, ${textNegatives}, ${qualityNegatives}`
      : `photorealistic, real photo, ${textNegatives}, ${qualityNegatives}`;

    if (isRealistic) {
      promptParts.push(clarityKeywords);
    }

    if (isNight) {
      dynamicNegative += ", sun, daylight, bright sky, sun rays, sunlight";
    }

    const payload = {
      prompt,
      negative_prompt: dynamicNegative,
      steps: 8,
      sampler_name: "Euler",
      scheduler: "Beta",
      cfg_scale: 4.5,
      width: 1024,
      height: 720,
      batch_size: 1,
      alwayson_scripts: {},
      override_settings: {
        "sd_model_checkpoint": "z_image_turbo_bf16.safetensors"
      },
      override_settings_restore_afterwards: false
    };

    onStartGenerate(payload, 'txt2img');
    onHome();
  };

  const handleClaim = () => {
    if (generatedCoverImg && onCoverGenerated) {
      onCoverGenerated(generatedCoverImg);
    }
  };

  return (
    <div className="relative w-full h-full bg-transparent flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="flex w-full max-w-[1200px] w-[95vw] xl:w-[85vw] h-auto min-h-[500px] aspect-[16/10] max-h-[85vh] gap-4 md:gap-8 items-center justify-center mt-6">

        {/* 左側：選項控制區 或 舊封面選擇區 */}
        {coverStatus === 'done' && generatedCoverImg && hasExistingCover ? (
          <div className="w-1/2 flex flex-col items-center bg-[#F9F7F1] rounded-3xl shadow-xl border border-gray-300 p-6 h-full relative">
            <div className="w-full flex justify-center mb-4 shrink-0 h-10 items-center border-[2px] border-dashed border-gray-300 rounded-full bg-white shadow-sm">
              <div className="font-bold tracking-widest text-[#D2A679] text-xl font-serif">原本的封面</div>
            </div>
            <div className="w-full relative shadow-inner border border-gray-300 bg-[#F4F1EA] rounded-xl flex-[1] flex flex-col items-center justify-center overflow-hidden" style={{ aspectRatio: '1024/720' }}>
              <img src={existingCoverImg || song.coverImage || "/images/default_cover.jpg"} alt="Original Cover" className="absolute inset-0 w-full h-full object-cover animate-fade-in" crossOrigin="anonymous" />
            </div>
            <div className="flex h-14 mt-6 w-full shrink-0">
              <button onClick={() => { if (onCoverGenerated) onCoverGenerated(existingCoverImg || song.coverImage); }} className="btn-secondary w-full h-full text-lg tracking-widest font-bold">
                選擇此封面
              </button>
            </div>
          </div>
        ) : (
          <div className="w-1/2 flex flex-col items-center bg-white rounded-3xl shadow-xl border border-gray-300 p-6 h-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4 w-full text-center tracking-widest font-serif shrink-0">
              專輯封面繪製
            </h3>

            <div className="w-full relative shadow-inner border border-gray-300 bg-[#F9F7F1] flex flex-col flex-1 overflow-hidden rounded-xl p-4">
              <div className="w-full flex-1 overflow-y-auto pr-3 pb-4 custom-scrollbar">
                <p className="text-lg text-gray-500 mb-4 tracking-wider font-bold text-center">選項為繪圖的靈感，您可以自由選擇</p>

                {[
                  { id: 'subjects', title: '相片主角' },
                  { id: 'seasons', title: '季節光影' },
                  { id: 'elements', title: '歌詞記憶' },
                  { id: 'styles', title: '藝術筆觸' }
                ].map((group) => (
                  <div key={group.id} className="mb-6 w-full">
                    <h3 className="text-red-600 font-bold mb-3 text-lg uppercase tracking-widest border-l-4 border-red-500 pl-3">{group.title}</h3>
                    <div className="flex flex-wrap gap-3">
                      {currentOptions[group.id]?.map(item => {
                        const stateKey = group.id.slice(0, -1);
                        const isSelected = selections[stateKey]?.label === item.label;
                        return (
                          <button
                            key={item.label}
                            onClick={() => handleSelect(stateKey, item)}
                            className={`px-5 py-3 text-lg font-bold rounded-full transition-all duration-300 tracking-wider
                                  ${isSelected ? 'bg-rose-400 text-white shadow-inner scale-105' : 'bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:scale-105'}`}
                          >
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="mb-4 w-full mt-4">
                  <h3 className="text-gray-700 font-bold mb-3 text-lg uppercase tracking-widest border-l-4 border-stone-400 pl-3">有什麼想加入的元素嗎？</h3>
                  <input type="text" value={customWord} onChange={(e) => setCustomWord(e.target.value)} placeholder="例如：吉他、腳踏車..." className="w-full p-4 border border-gray-300 shadow-inner rounded-xl font-serif text-lg focus:outline-none focus:border-rose-400 bg-white" />
                </div>
              </div>
            </div>

            <div className="flex w-full gap-4 mt-6 h-14 shrink-0">
              <button onClick={handleExtractLyrics} className="btn-secondary w-2.5/6 disabled:opacity-50" disabled={coverStatus === 'generating'}>
                其他靈感
              </button>
              <button onClick={triggerGenerate} className="btn-primary flex-1 disabled:opacity-50" disabled={coverStatus === 'generating'}>
                繪製封面
              </button>
            </div>
          </div>
        )}

        {/* 右側：預設提示或成果展示區 */}
        <div className="w-1/2 flex flex-col items-center bg-[#F9F7F1] rounded-3xl shadow-xl border border-gray-300 p-6 h-full relative">

          <div className="w-full relative shadow-inner border border-gray-300 bg-[#F4F1EA] rounded-xl flex-[1] flex flex-col items-center justify-center overflow-hidden"
            style={(coverStatus === 'done' || coverStatus === 'generating') ? { aspectRatio: '1024/720' } : {}}
          >
            {coverStatus === 'generating' ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center animate-pulse gap-6">
                <div className="w-16 h-16 border-8 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                <h3 className="text-2xl font-bold text-gray-800 tracking-widest">正在為您沖洗封面</h3>
                <p className="text-gray-500 font-bold tracking-wide">這會稍微需要一點時間，請稍候...</p>
              </div>
            ) : coverStatus === 'done' && generatedCoverImg ? (
              <img src={generatedCoverImg} alt="AI Generated Cover" className="absolute inset-0 w-full h-full object-cover animate-fade-in" crossOrigin="anonymous" />
            ) : (
              <div className="absolute inset-0 w-full h-full overflow-hidden flex flex-col items-center justify-center">
                <div className="text-2xl font-bold text-gray-400 tracking-widest font-serif">開始繪製後可以繼續體驗，<br></br>完成後會自動顯示在上方</div>
              </div>
            )}
          </div>

          {coverStatus === 'done' && generatedCoverImg ? (
            <div className="flex h-14 mt-6 w-full shrink-0">
              <div className="flex justify-center items-center gap-3 animate-fade-in-up w-full h-full">
                <button onClick={handleClaim} className="btn-primary flex-1 h-full text-lg tracking-widest font-bold">
                  {hasExistingCover ? "選擇此封面" : "領取專輯封面"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

      </div>
    </div>
  );
};

export default AiCoverGame_zimage;