import React, { useState, useRef, useMemo, useEffect } from 'react';
import { lyricsData } from '../../../data/lyricsData';
import { CARRIAGE_NAMES } from '../../../data/gameModes';

const BASE_PROMPT = "high quality, masterpiece, best quality, 1980s vintage taiwanese aesthetic, pure visual art, pure background, strictly no text, completely textless, nostalgic atmosphere, edge-to-edge, detailed, vibrant";

const SUBJECT_CATEGORIES = [
  { label: "男歌手", type: "male" },
  { label: "女歌手", type: "female" },
  { label: "風景照", type: "scenery" }
];

const DETAILED_PROMPTS = {
  male: [
    "1boy, handsome young taiwanese male singer, 1980s retro hairstyle, holding acoustic guitar, looking at viewer, retro portrait photography",
    "1boy, handsome young taiwanese male student singer, split turtleneck sweater, black rimmed glasses, soft melancholic eyes, 80s neat short hair, holding book, retro campus photography",
    "1boy, mature taiwanese male folk singer, slightly unshaven, linen shirt, warm smile, wool vest, holding acoustic guitar close to body, closed eyes singing, natural sunlight"
  ],
  female: [
    "1girl, beautiful young taiwanese female singer, 1980s retro long hair, gentle smile, looking at viewer, retro portrait photography",
    "1girl, beautiful young taiwanese female singer, straight black hair with bangs (omega hair style), polka dot dress, gentle smile, holding microphone with two hands, studio light, city pop aesthetic",
    "1girl, etherial taiwanese female singer-songwriter, long wavy perm hair, bohemian style long flowing dress, playing piano, looking away inspired, misty atmosphere, soft focus photography"
  ],
  scenery: [
    "pure beautiful scenery, no humans, empty landscape, scenic view",
    "pure visual art, empty retro train cabin, looking out the window, nostalgic atmosphere",
    "scenic view, retro taiwanese street, old bicycle, vintage vibe, no humans",
    "beautiful sunset over a calm lake, distant mountains, reflection on water, pure nature, 80s aesthetic"
  ]
};

const PROMPT_BANK = {
  'visit_spring': {
    seasons: [{ label: "春風", value: "gentle spring breeze, warm light" }, { label: "微雨", value: "light misty rain, damp atmosphere" }, { label: "晨霧", value: "morning fog on a mountain peak" }],
    elements: [{ label: "小山丘", value: "a small distant mountain peak" }, { label: "長髮", value: "long black hair blowing in the wind" }, { label: "詩集", value: "an open vintage poetry book" }]
  },
  'season_rain': {
    seasons: [{ label: "黃昏", value: "golden hour, beautiful sunset sky" }, { label: "陰天", value: "cloudy rainy season, grey sky" }, { label: "霓虹光", value: "blurry lights through a rainy window" }],
    elements: [{ label: "緞帶", value: "colorful ribbons floating in the sky" }, { label: "撐傘", value: "walking in the rain concept, umbrella" }, { label: "城市街景", value: "city neon lights reflecting on wet street" }]
  },
  'if': {
    seasons: [{ label: "清晨", value: "early morning sunrise, fresh dew" }, { label: "藍天", value: "fluffy white clouds in a clear blue sky" }, { label: "星空", value: "beautiful starry night sky" }],
    elements: [{ label: "綠草", value: "green grass with morning dew drops" }, { label: "細雨", value: "soft gentle rain falling" }, { label: "沙灘", value: "clean white sandy beach" }]
  },
  'morning_wind': {
    seasons: [{ label: "破曉", value: "breaking dawn, first light of the day" }, { label: "月亮", value: "transition from sunset to moonrise" }, { label: "黎明", value: "dim light of dawn" }],
    elements: [{ label: "窗戶", value: "a half-open wooden window" }, { label: "海浪", value: "ocean waves crashing on rocks" }, { label: "落葉", value: "leaves blowing in the strong wind" }]
  },
  'kapok_road': {
    seasons: [{ label: "盛夏", value: "peak of summer, intense heat, vibrant" }, { label: "夏夜", value: "heavy warm summer night" }, { label: "夕陽", value: "burning orange sunset" }],
    elements: [{ label: "木棉花", value: "vibrant red kapok flowers blooming" }, { label: "街道", value: "a long empty street perspective" }, { label: "公路", value: "highway to California, freedom concept" }]
  }
};

const STYLES_BANK = [
  { label: "寫真", value: "hyper-realistic photography, ultra-detailed, 8k resolution, raw photo, highly detailed face" },
  { label: "水彩", value: "watercolor painting style, soft brush strokes, artistic illustration" },
  { label: "油畫", value: "impasto oil painting texture, rich vivid colors, traditional art" },
  { label: "復古", value: "1970s vintage film photography, film grain, nostalgic vignette, polaroid" },
  { label: "極簡", value: "minimalist line art, clean vector illustration, white background" }
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

    let isRealistic = false;
    if (selections.style) {
      promptParts.push(`(((${selections.style.value})))`);
      if (selections.style.label === "真實寫真") isRealistic = true;
    } else {
      promptParts.push("(((vintage taiwanese illustration style)))");
    }

    promptParts.push(BASE_PROMPT);

    let subjectDetailPrompt = "";
    if (selections.subject) {
      const pool = DETAILED_PROMPTS[selections.subject.type];
      subjectDetailPrompt = pool[Math.floor(Math.random() * pool.length)];
    } else {
      const types = Object.keys(DETAILED_PROMPTS);
      const randomType = types[Math.floor(Math.random() * types.length)];
      const pool = DETAILED_PROMPTS[randomType];
      subjectDetailPrompt = pool[Math.floor(Math.random() * pool.length)];
    }
    promptParts.push(`(${subjectDetailPrompt})`);

    if (selections.element) promptParts.push(`featuring (${selections.element.value})`);
    if (selections.season) promptParts.push(`during (${selections.season.value})`);
    if (customWord.trim()) promptParts.push(`containing (${customWord.trim()})`);

    promptParts.push("center composition");
    const prompt = promptParts.join(", ");

    const dynamicNegative = isRealistic
      ? "illustration, painting, drawing, cartoon, anime, 3d render, sketch, text, font, chinese characters, watermark, logo, bad anatomy"
      : "realistic photography, photo, realistic skin, real human, 3d render, text, font, chinese characters, watermark, logo, ugly";

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