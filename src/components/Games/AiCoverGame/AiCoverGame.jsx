import React, { useState, useRef, useMemo, useEffect } from 'react';
import { lyricsData } from '../../../data/lyricsData';
import { CARRIAGE_NAMES } from '../../../data/gameModes';

const BASE_PROMPT = "high quality, masterpiece, best quality, 1980s vintage taiwanese aesthetic, pure visual art, pure background, strictly no text, completely textless, unlabeled, no lettering, nostalgic atmosphere, edge-to-edge, detailed, vibrant";

const SUBJECT_CATEGORIES = [
  { label: "男歌手", type: "male" },
  { label: "女歌手", type: "female" },
  { label: "風景照", type: "scenery" }
];

const SUBJECT_TRAITS = {
  male: {
    hair: ["retro 1980s hairstyle", "bowl cut", "neat short hair", "feathered hair", "mid-split hair", "retro perm"],
    outfit: ["striped polo shirt", "v-neck knit sweater", "white linen shirt", "denim jacket", "colorful windbreaker", "checkered shirt", "classic suit"],
    accessory: ["holding acoustic guitar", "wearing black rimmed glasses", "holding a vintage book", "wearing a red scarf", "holding a walkman", "holding a microphone"],
    vibe: ["youthful student look", "mature folk singer", "cool rock star", "melancholic dreamer", "smiling and cheerful", "intellectual songwriter"]
  },
  female: {
    hair: ["long hair with bangs", "wavy perm", "omega hairstyle", "straight black hair", "high ponytail", "short bob with headband"],
    outfit: ["polka dot dress", "oversized wool sweater", "floral blouse", "denim overall", "graceful qipao", "trench coat", "school uniform"],
    accessory: ["holding a sunflower", "wearing a beret", "playing acoustic guitar", "holding a cassette tape", "wearing a pearl necklace", "holding a folding fan"],
    vibe: ["innocent girl next door", "elegant lady", "etherial singer-songwriter", "energetic pop idol", "contemplative artist", "cheerful student"]
  },
  scenery: {
    landscape: ["empty landscape", "retro train cabin", "taiwanese old street", "sea side", "mountain view", "city park"],
    object: ["an old bicycle", "a wooden bench", "a rusty gate", "a vintage lamp post", "fallen leaves", "blooming flowers"],
    mood: ["nostalgic atmosphere", "peaceful vibe", "misty focus", "golden hour lighting", "retro film grain"]
  }
};

const PROMPT_BANK = {
  'visit_spring': {
    seasons: [{ label: "春風", value: "spring breeze" }, { label: "微雨", value: "light rain" }, { label: "晨霧", value: "morning fog" }],
    elements: [{ label: "小山丘", value: "small hills" }, { label: "長髮", value: "long hair" }, { label: "詩集", value: "poetry book" }]
  },
  'season_rain': {
    seasons: [{ label: "黃昏", value: "sunset sky" }, { label: "陰天", value: "cloudy sky" }, { label: "霓虹光", value: "neon lights" }],
    elements: [{ label: "緞帶", value: "colorful ribbons" }, { label: "撐傘", value: "holding umbrella" }, { label: "城市街景", value: "city street view" }]
  },
  'if': {
    seasons: [{ label: "清晨", value: "early morning" }, { label: "藍天", value: "blue sky, white clouds" }, { label: "星空", value: "starry night sky" }],
    elements: [{ label: "綠草", value: "green grass" }, { label: "細雨", value: "gentle rain" }, { label: "沙灘", value: "beach" }]
  },
  'morning_wind': {
    seasons: [{ label: "破曉", value: "dawn" }, { label: "月亮", value: "moon" }, { label: "黎明", value: "first light of morning" }],
    elements: [{ label: "窗戶", value: "window" }, { label: "海浪", value: "ocean waves" }, { label: "落葉", value: "falling leaves" }]
  },
  'kapok_road': {
    seasons: [{ label: "盛夏", value: "summer day" }, { label: "夏夜", value: "summer night" }, { label: "夕陽", value: "sunset glow" }],
    elements: [{ label: "木棉花", value: "kapok flowers" }, { label: "街道", value: "empty street" }, { label: "公路", value: "highway" }]
  }
};

const STYLES_BANK = [
  { label: "寫真", value: "hyper-realistic photography, sharp focus, 8k resolution, high contrast, ultra-detailed" },
  { label: "水彩", value: "watercolor painting, soft brush strokes, artistic" },
  { label: "油畫", value: "oil painting, thick impasto, vivid colors" },
  { label: "復古", value: "vintage film photography, 1980s texture, film grain, nostalgic colors" },
  { label: "極簡", value: "minimalist illustration, clean lines, flat colors" }
];

const AiCoverGame_zimage = ({ song, onHome, coverStatus, generatedCoverImg, onStartGenerate, onSetMockCover, onCoverGenerated, hasExistingCover, onCancelCover }) => {
  const currentLyrics = useMemo(() => lyricsData[song.id] || "（找不到歌詞）", [song.id]);
  const [isExtracted, setIsExtracted] = useState(false);

  const [currentOptions, setCurrentOptions] = useState({ subjects: [], seasons: [], elements: [], styles: [] });
  const [selections, setSelections] = useState({ subject: null, season: null, element: null, style: null });
  const [customWord, setCustomWord] = useState('');

  const getRandomItems = (arr, num) => [...arr].sort(() => 0.5 - Math.random()).slice(0, num);

  const handleExtractLyrics = () => {
    const bank = PROMPT_BANK[song.id] || PROMPT_BANK['kapok_road'];
    const newOptions = {
      subjects: SUBJECT_CATEGORIES,
      seasons: getRandomItems(bank.seasons, 3),
      elements: getRandomItems(bank.elements, 3),
      styles: getRandomItems(STYLES_BANK, 3)
    };
    setCurrentOptions(newOptions);
    
    // Auto-select one item from each category randomly
    setSelections({
      subject: newOptions.subjects[Math.floor(Math.random() * newOptions.subjects.length)],
      season: newOptions.seasons[Math.floor(Math.random() * newOptions.seasons.length)],
      element: newOptions.elements[Math.floor(Math.random() * newOptions.elements.length)],
      style: newOptions.styles[Math.floor(Math.random() * newOptions.styles.length)]
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

    // 固定基礎美學
    promptParts.push(BASE_PROMPT);

    // 判斷是否為夜晚場景
    const isNight = selections.season?.value.includes('night') || selections.season?.value.includes('starry') || selections.element?.value.includes('night');

    // 藝術風格
    if (selections.style) {
      promptParts.push(selections.style.value);
    } else {
      promptParts.push("vintage taiwanese illustration style");
    }

    // 主角或場景生成
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
      // 風景隨機組裝
      const pool = SUBJECT_TRAITS.scenery;
      const l = pool.landscape[Math.floor(Math.random() * pool.landscape.length)];
      const o = pool.object[Math.floor(Math.random() * pool.object.length)];
      const m = pool.mood[Math.floor(Math.random() * pool.mood.length)];
      subjectText = `pure visual art, ${l}, featuring ${o}, ${m}, 80s aesthetic, no humans`;
    }

    // 如果是夜晚，過濾掉主角描述中的陽光關鍵字並加入夜間燈光
    if (isNight) {
      subjectText = subjectText.replace(/natural sunlight|warm glow|bright sun|sunlight|golden hour/gi, "dim lighting, moonlite glow");
      promptParts.push("dark night scene, starry night sky, deep shadows");
    }
    promptParts.push(subjectText);

    // 季節與物件
    if (selections.element) promptParts.push(selections.element.value);
    if (selections.season) promptParts.push(selections.season.value);
    
    // 使用者自訂
    if (customWord.trim()) promptParts.push(customWord.trim());

    // 構圖優化
    promptParts.push("center composition");
    
    const prompt = promptParts.join(", ");

    const isRealistic = selections.style?.label === "寫真";
    const clarityKeywords = isRealistic ? "sharp focus, high definition, crisp edges, highly detailed" : "";
    const textNegatives = "text, font, chinese characters, hanzi, kanji, letters, alphabet, watermark, logo, sign, billboard, banner, typography, signature, brand, calligraphy, words, labels";
    const qualityNegatives = "blur, blurry, out of focus, shaky, lowres, low quality, artifact, distorted, foggy, hazy, melted face, bad anatomy";
    
    let dynamicNegative = isRealistic
      ? `illustration, painting, drawing, cartoon, anime, 3d render, sketch, ${textNegatives}, ${qualityNegatives}`
      : `photorealistic, real photo, ${textNegatives}, ${qualityNegatives}`;

    // 如果是寫真風格，加強相關描述
    if (isRealistic) {
      promptParts.push(clarityKeywords);
    }

    // 夜晚場景的負面提示詞補強
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
      <div className="flex w-full max-w-[80vw] h-[82vh] gap-8 items-center justify-center mt-6">
        {/* 左側：選項控制區 */}
        <div className="w-1/2 flex flex-col items-center bg-white rounded-3xl shadow-xl border border-gray-300 p-6 h-full">
          <h3 className="text-xl font-bold text-gray-800 mb-4 w-full text-center tracking-widest font-serif shrink-0">
            專輯封面靈感
          </h3>
          
          <div className="w-full relative shadow-inner border border-gray-300 bg-[#F9F7F1] flex flex-col flex-1 overflow-hidden rounded-xl p-4">
             <div className="w-full flex-1 overflow-y-auto pr-3 pb-4 custom-scrollbar">
                <p className="text-lg text-gray-500 mb-4 tracking-wider font-bold text-center">我們已為您挑選了一些靈感，您可自由更換</p>

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
                  <h3 className="text-gray-700 font-bold mb-3 text-lg uppercase tracking-widest border-l-4 border-stone-400 pl-3">有什麼特別想留下的畫面嗎？</h3>
                  <input type="text" value={customWord} onChange={(e) => setCustomWord(e.target.value)} placeholder="例如：吉他、腳踏車..." className="w-full p-4 border border-gray-300 shadow-inner rounded-xl font-serif text-lg focus:outline-none focus:border-rose-400 bg-white" />
                </div>
            </div>
          </div>

          {/* 底部按鈕 */}
          <div className="flex w-full gap-4 mt-6 h-14 shrink-0">
             <button onClick={() => { onSetMockCover(`/images/${song.audioFileName.replace('.mp3', '.jpg')}`); onHome(); }} className="btn-secondary w-1/3 disabled:opacity-50" disabled={coverStatus === 'generating'}>
                經典封面
             </button>
             <button onClick={triggerGenerate} className="btn-primary flex-1 text-lg disabled:opacity-50" disabled={coverStatus === 'generating'}>
                繪製專輯封面
             </button>
          </div>
        </div>

        {/* 右側：歌詞顯示或成果展示區 */}
        <div className="w-1/2 flex flex-col items-center bg-[#F9F7F1] rounded-3xl shadow-xl border border-gray-300 p-6 h-full relative">
          
          <div className="w-full flex justify-center mb-4 shrink-0 h-10 items-center border-[2px] border-dashed border-gray-300 rounded-full bg-white shadow-sm">
            {coverStatus === 'done' ? (
              <div className="font-bold tracking-widest text-[#D2A679] text-xl font-serif">
                繪製完成
              </div>
            ) : coverStatus === 'generating' ? (
              <div className="font-bold tracking-widest text-rose-500 text-xl font-serif animate-pulse">
                為您揮灑畫筆中...
              </div>
            ) : (
               <div className="font-bold tracking-widest text-gray-600 text-base font-serif">
                {song.title} - 歌詞
              </div>
            )}
          </div>

          <div className="w-full relative shadow-inner border border-gray-300 bg-[#F4F1EA] rounded-xl flex-[1] flex flex-col items-center justify-center overflow-hidden" 
              style={ coverStatus === 'done' || coverStatus === 'generating' ? { aspectRatio: '1024/720' } : {} }
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
                <div className="absolute inset-0 w-full h-full overflow-hidden flex flex-col">
                   <div className="flex-1 w-full p-6 overflow-y-auto custom-scrollbar bg-white">
                      <pre className="text-xl md:text-2xl text-gray-800 leading-loose font-serif whitespace-pre-wrap flex justify-center w-full text-center">{currentLyrics}</pre>
                   </div>
                </div>
             )}
          </div>
          
          <div className="flex h-14 mt-6 w-full shrink-0">
             {coverStatus === 'done' && generatedCoverImg ? (
               <div className="flex justify-center items-center gap-3 animate-fade-in-up w-full h-full">
                  <button onClick={handleClaim} className="btn-primary flex-1 text-lg h-full">
                    {hasExistingCover ? "替換封面" : "領取專輯封面"}
                  </button>
                  <button
                    onClick={onCancelCover}
                    className="btn-secondary flex-shrink-0 flex items-center justify-center !p-0 w-14 h-full rounded-full border-2 border-gray-300 text-gray-400 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-2xl font-black mb-[2px]">✕</span>
                  </button>
               </div>
             ) : (
               <button onClick={handleExtractLyrics} disabled={coverStatus === 'generating'} className="btn-secondary w-full h-full text-lg disabled:opacity-50 font-bold tracking-widest">
                  再看看其他靈感
               </button>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AiCoverGame_zimage;