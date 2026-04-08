import React, { useState, useRef, useMemo } from 'react';
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
    seasons: [{ label: "春日微風", value: "gentle spring breeze, warm light" }, { label: "細雨迷濛", value: "light misty rain, damp atmosphere" }, { label: "山巔晨霧", value: "morning fog on a mountain peak" }],
    elements: [{ label: "小山巔", value: "a small distant mountain peak" }, { label: "飛散長髮", value: "long black hair blowing in the wind" }, { label: "詩集書篇", value: "an open vintage poetry book" }]
  },
  'season_rain': {
    seasons: [{ label: "黃昏暮色", value: "golden hour, beautiful sunset sky" }, { label: "雨季陰天", value: "cloudy rainy season, grey sky" }, { label: "迷濛光影", value: "blurry lights through a rainy window" }],
    elements: [{ label: "彩色緞帶", value: "colorful ribbons floating in the sky" }, { label: "雨中漫步", value: "walking in the rain concept, umbrella" }, { label: "城市霓虹", value: "city neon lights reflecting on wet street" }]
  },
  'if': {
    seasons: [{ label: "清晨朝霞", value: "early morning sunrise, fresh dew" }, { label: "白雲藍天", value: "fluffy white clouds in a clear blue sky" }, { label: "綺麗星空", value: "beautiful starry night sky" }],
    elements: [{ label: "青綠小草", value: "green grass with morning dew drops" }, { label: "綿綿細雨", value: "soft gentle rain falling" }, { label: "白色沙灘", value: "clean white sandy beach" }]
  },
  'morning_wind': {
    seasons: [{ label: "破曉時分", value: "breaking dawn, first light of the day" }, { label: "日落月升", value: "transition from sunset to moonrise" }, { label: "黎明微光", value: "dim light of dawn" }],
    elements: [{ label: "半開窗門", value: "a half-open wooden window" }, { label: "海浪潮聲", value: "ocean waves crashing on rocks" }, { label: "隨風落葉", value: "leaves blowing in the strong wind" }]
  },
  'kapok_road': {
    seasons: [{ label: "盛夏高潮", value: "peak of summer, intense heat, vibrant" }, { label: "沉沉夏夜", value: "heavy warm summer night" }, { label: "燃燒夕陽", value: "burning orange sunset" }],
    elements: [{ label: "紅木棉花", value: "vibrant red kapok flowers blooming" }, { label: "長長街道", value: "a long empty street perspective" }, { label: "遠方公路", value: "highway to California, freedom concept" }]
  }
};

const STYLES_BANK = [
  { label: "真實寫真", value: "hyper-realistic photography, ultra-detailed, 8k resolution, raw photo, highly detailed face" },
  { label: "水彩暈染", value: "watercolor painting style, soft brush strokes, artistic illustration" },
  { label: "厚塗油畫", value: "impasto oil painting texture, rich vivid colors, traditional art" },
  { label: "復古底片", value: "1970s vintage film photography, film grain, nostalgic vignette, polaroid" },
  { label: "極簡線條", value: "minimalist line art, clean vector illustration, white background" }
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
    setCurrentOptions({
      subjects: SUBJECT_CATEGORIES,
      seasons: getRandomItems(bank.seasons, 3),
      elements: getRandomItems(bank.elements, 3),
      styles: getRandomItems(STYLES_BANK, 3)
    });
    setSelections({ subject: null, season: null, element: null, style: null });
    setIsExtracted(true);
  };

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
      <div className="text-center mb-6 mt-2 shrink-0 relative z-10 pointer-events-none">
        <h2 className="text-4xl font-bold text-white tracking-widest drop-shadow-md inline-block font-serif">
          {CARRIAGE_NAMES.AI_COVER}
        </h2>
      </div>

      <div className="flex w-full max-w-[85rem] h-[80vh] gap-8">

        {/* 左側歌詞區 */}
        <div className="w-[25%] bg-[#FDFBF7] rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col relative h-full">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-800 pb-3">{song.title}</h3>
          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 mb-20">
            <pre className="text-base text-gray-600 leading-loose font-serif whitespace-pre-wrap">{currentLyrics}</pre>
          </div>
          <div className="absolute bottom-6 left-8 right-8">
            <button
              onClick={handleExtractLyrics}
              disabled={coverStatus === 'generating'}
              className="btn-primary w-full flex justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isExtracted ? "再看看其他的靈感" : "從歌詞中尋找靈感"}
            </button>
          </div>
        </div>

        {/* 中間選項區 */}
        <div className="flex-1 bg-[#F9F7F1] p-8 rounded-3xl border border-gray-100 flex flex-col justify-between items-center shadow-xl h-full overflow-hidden">
          {coverStatus === 'generating' ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center w-full">
              <div className="w-16 h-16 border-8 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
              <h3 className="text-3xl font-bold text-gray-800 tracking-widest">正在為您揮灑畫筆</h3>
              <p className="text-gray-500 leading-relaxed font-bold text-lg">這會稍微需要一點時間，<br />您可以先去其他車廂走走，稍後再來領取喔。</p>
              <button onClick={onHome} className="btn-secondary w-full mt-6 text-xl">
                返回火車
              </button>
            </div>
          ) : !isExtracted ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 font-bold tracking-widest">
              <p className="text-xl">點擊左側按鈕，從歌詞中尋找靈感，繪製專輯封面</p>
            </div>
          ) : (
            <div className="animate-fade-in-up flex flex-col h-full w-full">

              <div className="w-full flex-1 overflow-y-auto pr-3 pb-4 custom-scrollbar mb-4">
                <p className="text-sm text-gray-500 mb-6 tracking-wider font-bold">挑選觸動您的靈感，或是交給畫筆自由揮灑</p>

                {[
                  { id: 'subjects', title: '相片主角' },
                  { id: 'seasons', title: '季節光影' },
                  { id: 'elements', title: '歌詞記憶' },
                  { id: 'styles', title: '藝術筆觸' }
                ].map((group) => (
                  <div key={group.id} className="mb-6 w-full">
                    <h3 className="text-red-600 font-bold mb-3 text-base uppercase tracking-widest border-l-4 border-red-500 pl-3">{group.title}</h3>
                    <div className="flex flex-wrap gap-3">
                      {currentOptions[group.id].map(item => {
                        const stateKey = group.id.slice(0, -1);
                        const isSelected = selections[stateKey]?.label === item.label;
                        return (
                          <button
                            key={item.label}
                            onClick={() => handleSelect(stateKey, item)}
                            className={`px-5 py-3 text-base font-bold rounded-full transition-all duration-300 tracking-wider
                                ${isSelected ? 'bg-rose-400 text-white shadow-inner' : 'bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:-translate-y-0.5'}`}
                          >
                            {item.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="mb-2 w-full mt-4">
                  <h3 className="text-gray-700 font-bold mb-3 text-base uppercase tracking-widest border-l-4 border-stone-400 pl-3">有什麼特別想留下的畫面嗎？</h3>
                  <input type="text" value={customWord} onChange={(e) => setCustomWord(e.target.value)} placeholder="例如：吉他、腳踏車..." className="w-full p-4 border-2 border-gray-200 rounded-xl font-serif text-base focus:outline-none focus:border-rose-300 bg-white" />
                </div>
              </div>

              <div className="mt-auto shrink-0 flex flex-col gap-4 w-full pt-4">
                <button onClick={triggerGenerate} className="btn-primary w-full text-xl">
                  繪製專輯封面
                </button>
                <button onClick={() => { onSetMockCover(`/images/${song.audioFileName.replace('.mp3', '.jpg')}`); onHome(); }} className="btn-secondary w-full py-3 text-base">
                  經典封面
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 右側結果區 */}
        <div className="w-[35%] flex flex-col items-center justify-center p-6 h-full relative">
          <div className="relative w-full shadow-xl bg-gray-200 flex flex-col rounded-xl overflow-hidden border-2 border-gray-300 transition-all" style={{ aspectRatio: '1024/720' }}>
            {coverStatus === 'done' && generatedCoverImg ? (
              <img src={generatedCoverImg} className="w-full h-full object-cover animate-fade-in" crossOrigin="anonymous" alt="AI Generated Cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 font-bold gap-3 opacity-50">
                {coverStatus === 'generating' ? (
                  <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                ) : null}
              </div>
            )}
          </div>

          <div className="h-24 mt-8 flex items-center">
            {coverStatus === 'done' && generatedCoverImg && (
              <div className="flex flex-col items-center gap-4 animate-fade-in-up w-full">
                <h3 className="text-2xl font-bold text-white tracking-widest drop-shadow-md ">

                </h3>
                <div className="flex items-center gap-3 w-full justify-center">
                  <button onClick={handleClaim} className="btn-primary text-xl">
                    {hasExistingCover ? "替換封面" : "領取專輯封面"}
                  </button>
                  <button 
                    onClick={onCancelCover} 
                    className="btn-secondary flex-shrink-0 flex items-center justify-center !p-0 w-14 h-14 rounded-full border-2 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <span className="text-2xl font-black mb-[2px]">✕</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiCoverGame_zimage;