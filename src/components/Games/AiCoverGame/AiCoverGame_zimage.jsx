import React, { useState, useRef, useMemo } from 'react';
import { lyricsData } from '../../../data/lyricsData';
import { CARRIAGE_NAMES, CARRIAGE_SUBTITLES } from '../../../data/gameModes'; 

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
    "1boy, cool taiwanese male rock singer, dishevelled curly hair, leather jacket, torn jeans, defiant expression, holding electric guitar, neon city lights background, gritty retro film noise",
    "1boy, mature taiwanese male folk singer, slightly unshaven, linen shirt, warm smile, wool vest, holding acoustic guitar close to body, closed eyes singing, natural sunlight"
  ],
  female: [
    "1girl, beautiful young taiwanese female singer, 1980s retro long hair, gentle smile, looking at viewer, retro portrait photography",
    "1girl, beautiful young taiwanese female singer, straight black hair with bangs (omega hair style), polka dot dress, gentle smile, holding microphone with two hands, studio light, city pop aesthetic",
    "1girl, etherial taiwanese female singer-songwriter, long wavy perm hair, bohemian style long flowing dress, playing piano, looking away inspired, misty atmosphere, soft focus photography",
    "1girl, short hair taiwanese female singer, 80s power suit with shoulder pads, confident bold makeup, microphone held high, dynamic pose, punk rock elements, dramatic contrast lighting"
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
    seasons: [ { label: "春日微風", value: "gentle spring breeze, warm light" }, { label: "細雨迷濛", value: "light misty rain, damp atmosphere" }, { label: "山巔晨霧", value: "morning fog on a mountain peak" } ],
    elements: [ { label: "小山巔", value: "a small distant mountain peak" }, { label: "飛散長髮", value: "long black hair blowing in the wind" }, { label: "詩集書篇", value: "an open vintage poetry book" } ]
  },
  'season_rain': {
    seasons: [ { label: "黃昏暮色", value: "golden hour, beautiful sunset sky" }, { label: "雨季陰天", value: "cloudy rainy season, grey sky" }, { label: "迷濛光影", value: "blurry lights through a rainy window" } ],
    elements: [ { label: "彩色緞帶", value: "colorful ribbons floating in the sky" }, { label: "雨中漫步", value: "walking in the rain concept, umbrella" }, { label: "城市霓虹", value: "city neon lights reflecting on wet street" } ]
  },
  'if': {
    seasons: [ { label: "清晨朝霞", value: "early morning sunrise, fresh dew" }, { label: "白雲藍天", value: "fluffy white clouds in a clear blue sky" }, { label: "綺麗星空", value: "beautiful starry night sky" } ],
    elements: [ { label: "青綠小草", value: "green grass with morning dew drops" }, { label: "綿綿細雨", value: "soft gentle rain falling" }, { label: "白色沙灘", value: "clean white sandy beach" } ]
  },
  'morning_wind': {
    seasons: [ { label: "破曉時分", value: "breaking dawn, first light of the day" }, { label: "日落月升", value: "transition from sunset to moonrise" }, { label: "黎明微光", value: "dim light of dawn" } ],
    elements: [ { label: "半開窗門", value: "a half-open wooden window" }, { label: "海浪潮聲", value: "ocean waves crashing on rocks" }, { label: "隨風落葉", value: "leaves blowing in the strong wind" } ]
  },
  'kapok_road': {
    seasons: [ { label: "盛夏高潮", value: "peak of summer, intense heat, vibrant" }, { label: "沉沉夏夜", value: "heavy warm summer night" }, { label: "燃燒夕陽", value: "burning orange sunset" } ],
    elements: [ { label: "紅木棉花", value: "vibrant red kapok flowers blooming" }, { label: "長長街道", value: "a long empty street perspective" }, { label: "遠方公路", value: "highway to California, freedom concept" } ]
  }
};

const STYLES_BANK = [
  { label: "真實寫真", value: "hyper-realistic photography, ultra-detailed, 8k resolution, raw photo, highly detailed face" },
  { label: "水彩暈染", value: "watercolor painting style, soft brush strokes, artistic illustration" },
  { label: "厚塗油畫", value: "impasto oil painting texture, rich vivid colors, traditional art" },
  { label: "復古底片", value: "1970s vintage film photography, film grain, nostalgic vignette, polaroid" },
  { label: "極簡線條", value: "minimalist line art, clean vector illustration, white background" }
];

const AiCoverGame_zimage = ({ song, onHome, coverStatus, generatedCoverImg, onStartGenerate, onSetMockCover, onCoverGenerated }) => {
  const currentLyrics = useMemo(() => lyricsData[song.id] || "（找不到歌詞）", [song.id]);
  const [isExtracted, setIsExtracted] = useState(false);
  
  const [currentOptions, setCurrentOptions] = useState({ subjects: [], seasons: [], elements: [], styles: [] });
  const [selections, setSelections] = useState({ subject: null, season: null, element: null, style: null });
  const [customWord, setCustomWord] = useState(''); 
  const resultRef = useRef(null);

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
  };

  const handleClaim = () => {
    if (generatedCoverImg && onCoverGenerated) {
      onCoverGenerated(generatedCoverImg); 
    }
  };

  return (
    <div className="relative w-full h-full bg-transparent flex flex-col items-center justify-center p-8 overflow-hidden">
      <div className="text-center mb-6 mt-2 shrink-0 relative z-10 pointer-events-none">
        <h2 className="text-4xl font-bold text-[#FDFBF7] tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] inline-block font-serif">
          {CARRIAGE_NAMES.AI_COVER}
        </h2>
        {CARRIAGE_SUBTITLES.AI_COVER && (
           <p className="text-gray-200 mt-4 tracking-wider text-xl drop-shadow-md font-bold">
             {CARRIAGE_SUBTITLES.AI_COVER}
           </p>
        )}
      </div>

      <div className="flex w-full max-w-[85rem] h-[80vh] gap-8">
        
        {/* 左側歌詞區 */}
        <div className="w-1/4 bg-[#FDFBF7] rounded-xl shadow-lg border-4 border-[#C0B8A3] p-8 flex flex-col relative h-full">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-800 pb-3">{song.title}</h3>
          <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 mb-20">
             <pre className="text-base text-gray-600 leading-loose font-serif whitespace-pre-wrap">{currentLyrics}</pre>
          </div>
          <div className="absolute bottom-6 left-8 right-8">
            <button 
              onClick={handleExtractLyrics} 
              disabled={coverStatus === 'generating'}
              className="w-full py-4 bg-gray-800 text-white font-bold rounded-lg border-2 border-black shadow-[4px_4px_0_#4b5563] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#4b5563] transition-all tracking-widest text-lg flex justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               {isExtracted ? "重新萃取" : "歌詞萃取"}
            </button>
          </div>
        </div>

        {/* 中間選項區 */}
        <div className="w-1/3 bg-[#EAEAEA] p-8 rounded-xl border-4 border-gray-300 flex flex-col justify-between items-center shadow-lg h-full overflow-hidden">
            {coverStatus === 'generating' ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center w-full">
                  <div className="w-16 h-16 border-8 border-gray-300 border-t-red-600 rounded-full animate-spin"></div>
                  <h3 className="text-3xl font-bold text-gray-800 tracking-widest">封面繪製中...</h3>
                  <p className="text-gray-500 leading-relaxed font-bold text-lg">封面繪製約需 10 ~ 20 秒<br/>您可以先返回火車等待</p>
                  <button onClick={onHome} className="w-full py-4 mt-6 bg-gray-800 text-white font-bold rounded-lg border-2 border-black shadow-[4px_4px_0_#4b5563] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#4b5563] transition-all tracking-widest text-xl">
                      返回火車等待
                  </button>
              </div>
            ) : !isExtracted ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 font-bold tracking-widest">
                <span className="text-5xl mb-4 opacity-50">✨</span>
                <p className="text-xl">請先點擊左側「歌詞萃取」</p>
              </div>
            ) : (
              <div className="animate-fade-in-up flex flex-col h-full w-full">
                
                <div className="w-full flex-1 overflow-y-auto pr-3 pb-4 custom-scrollbar mb-4">
                  <p className="text-sm text-gray-500 mb-6 tracking-wider font-bold">點擊標籤選擇想要的元素，或交由車廂畫家為您選擇。</p>
                  
                  {[ 
                    { id: 'subjects', title: '主角設定' },
                    { id: 'seasons', title: '季節氛圍' }, 
                    { id: 'elements', title: '歌詞元素' }, 
                    { id: 'styles', title: '藝術風格' } 
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
                              className={`px-5 py-3 text-base font-bold rounded border-2 transition-all duration-300 tracking-wider
                                ${isSelected ? 'bg-red-600 text-white border-red-800 shadow-[2px_2px_0_#7f1d1d] translate-y-[1px]' : 'bg-[#FDFBF7] text-gray-600 border-gray-300 hover:bg-gray-200'}`}
                            >
                              {item.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="mb-2 w-full mt-4">
                     <h3 className="text-gray-700 font-bold mb-3 text-base uppercase tracking-widest border-l-4 border-gray-500 pl-3">自訂意境</h3>
                     <input type="text" value={customWord} onChange={(e) => setCustomWord(e.target.value)} placeholder="例如：眼淚、腳踏車..." className="w-full p-4 border-2 border-gray-300 rounded font-serif text-base focus:outline-none focus:border-red-400 bg-[#FDFBF7]" />
                  </div>
                </div>

                <div className="mt-auto shrink-0 flex flex-col gap-4 w-full pt-4">
                  <button onClick={triggerGenerate} className="w-full py-4 bg-red-600 text-white font-bold rounded-lg border-2 border-red-800 shadow-[4px_4px_0_#7f1d1d] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#7f1d1d] transition-all text-xl tracking-widest">
                    開始繪製封面
                  </button>
                  <button onClick={() => onSetMockCover(`/images/${song.audioFileName.replace('.mp3', '.jpg')}`)} className="w-full py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-all text-base tracking-widest border border-gray-400">
                    載入預設圖片
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* 右側結果區 */}
        <div className="w-5/12 flex flex-col items-center justify-center p-6 h-full relative">
           <div ref={resultRef} className="relative w-full shadow-2xl bg-gray-200 flex flex-col rounded-lg overflow-hidden border-4 border-[#C0B8A3] transition-all" style={{ aspectRatio: '1024/720' }}>
              {/* ★ 防呆：確定不在 generating 狀態才顯示圖片 */}
              {coverStatus === 'done' && generatedCoverImg ? (
                 <img src={generatedCoverImg} className="w-full h-full object-cover animate-fade-in" crossOrigin="anonymous" alt="AI Generated Cover" />
              ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 font-bold gap-3 opacity-50">
                   {coverStatus === 'generating' ? (
                     <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                   ) : (
                     <span className="text-4xl">🖌️</span>
                   )}
                 </div>
              )}
           </div>
           
           <div className="h-24 mt-8 flex items-center">
             {coverStatus === 'done' && generatedCoverImg && (
               <div className="flex flex-col items-center gap-4 animate-fade-in-up w-full">
                 <h3 className="text-2xl font-bold text-[#FDFBF7] tracking-widest drop-shadow-md ">
                  封面繪製完成！
                 </h3>
                 <button onClick={handleClaim} className="px-10 py-4 bg-gray-800 text-white rounded-lg font-bold border-2 border-black shadow-[4px_4px_0_#4b5563] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#4b5563] transition-all tracking-widest text-xl">
                  領取專屬封面！
                 </button>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AiCoverGame_zimage;