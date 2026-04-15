export const SUBJECT_CATEGORIES = [
  { label: "男歌手", type: "male" },
  { label: "女歌手", type: "female" },
  // { label: "風景照", type: "scenery" }
];

export const SUBJECT_TRAITS = {
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

export const STYLES_BANK = [
  { label: "寫真", value: "hyper-realistic photography, sharp focus, 8k resolution, high contrast, ultra-detailed" },
  { label: "水彩", value: "watercolor painting, soft brush strokes, artistic" },
  { label: "油畫", value: "oil painting, thick impasto, vivid colors" },
  { label: "復古", value: "vintage film photography, 1980s texture, film grain, nostalgic colors" },
  { label: "極簡", value: "minimalist illustration, clean lines, flat colors" }
];

export const folkSongs = [
  {
    id: 'if',
    title: '如果',
    singer: '邰肇玫',
    audioFileName: 'if.mp3',
    hasFace: true,
    faceCount: 1,
    cassetteImage: '/images/cassette_1.png',
    lyrics: `如果你是朝露　我願是那小草
如果你是那片雲　我願是那小雨
終日與你相偎依　於是我將知道
當我伴著你　守著你時   會是多麼綺麗

如果你是那海　我願是那沙灘
如果你是那陣煙　我願是那輕風
永遠與你纏綿　於於是我也將知道
當我伴著你　守著你時   會是多麼甜蜜

如果你是朝露　我願是那小草
如果你是那片雲　我願是那小雨
終日與你相偎依　於是我將知道
當我伴著你　守著你時   會是多麼綺麗

如果你是那海　我願是那沙灘
如果你是那陣煙　我願是那輕風
永遠與你纏綿　於是我將知道
當我伴著你　守著你時  會是多麼甜蜜`,
    promptBank: {
      seasons: [{ label: "清晨", value: "early morning" }, { label: "藍天", value: "blue sky, white clouds" }, { label: "星空", value: "starry night sky" }],
      elements: [{ label: "綠草", value: "green grass" }, { label: "細雨", value: "gentle rain" }, { label: "沙灘", value: "beach" }]
    }
  },
  {
    id: 'kapok_road',
    title: '木棉道',
    singer: '王夢麟',
    audioFileName: 'kapok_road.mp3',
    hasFace: true,
    faceCount: 1,
    cassetteImage: '/images/cassette_2.png',
    lyrics: `紅紅的花開滿了木棉道
長長的街好像在燃燒
沉沉的夜徘徊在木棉道
輕輕的風吹過了樹梢

木棉道我怎能忘了
那是去年夏天的高潮
木棉道我怎能忘了
那是夢裡難忘的波濤

啊 愛情就像木棉道
季節過去就謝了
愛情就像那木棉道
蟬聲綿綿斷不了

紅紅的花開滿了木棉道
長長的街好像在燃燒
沉沉的夜徘徊在木棉道
輕輕的風吹過了樹梢

木棉道我怎能忘了
那是去年夏天的高潮
木棉道我怎能忘了
那是夢裡難忘的波濤

啊 愛情就像木棉道
季節過去就謝了
愛情就像那木棉道
蟬聲綿綿斷不了`,
    promptBank: {
      seasons: [{ label: "盛夏", value: "summer day" }, { label: "夏夜", value: "summer night" }, { label: "夕陽", value: "sunset glow" }],
      elements: [{ label: "木棉花", value: "kapok flowers" }, { label: "街道", value: "empty street" }, { label: "公路", value: "highway" }]
    }
  },
  {
    id: 'morning_wind',
    title: '風中的早晨',
    singer: '王新蓮、馬宜中',
    audioFileName: 'morning_wind.mp3',
    hasFace: true, 
    faceCount: 1,
    cassetteImage: '/images/cassette_3.png',
    lyrics: `我推開窗門 迎向風中 的一個早晨
我靜靜地等待 等待著你
柔情的眼神

看日落月升 看黎明黃昏
看風兒 吹過每個早晨
看日落月升 看黎明黃昏
看不到 你柔情的眼神

只聽見永恆的潮聲（永恆的潮聲）
迎向風中的早晨（迎向風中裡的每個早晨）

我推開窗門 迎向風中 的一個早晨
我靜靜地等待 等待著你
柔情的眼神

看日落月升 看黎明黃昏
看風兒 吹過每個早晨
看日落月升 看黎明黃昏
看不到 你柔情的眼神

只聽見永恆的潮聲（永恆的潮聲）
迎向風中的早晨（迎向風中裡的每個早晨）

我推開窗門 迎向風中 的一個早晨
我靜靜地等待 等待著你
柔情的眼神

看日落月升 看黎明黃昏
看風兒 吹過每個早晨
看日落月升 看黎明黃昏
看不到 你柔情的眼神

只聽見永恆的潮聲（永恆的潮聲）
迎向風中的早晨（迎向風中的早晨）

看日落月升 看黎明黃昏
看風兒 吹過每個早晨
看日落月升 看黎明黃昏
看不到 你柔情的眼神
看日落月升 看黎明黃昏
看風兒 吹過每個早晨
看日落月升 看黎明黃昏`,
    promptBank: {
      seasons: [{ label: "破曉", value: "dawn" }, { label: "月亮", value: "moon" }, { label: "黎明", value: "first light of morning" }],
      elements: [{ label: "窗戶", value: "window" }, { label: "海浪", value: "ocean waves" }, { label: "落葉", value: "falling leaves" }]
    }
  },
  {
    id: 'season_rain',
    title: '季節雨',
    singer: '楊耀東',
    audioFileName: 'season_rain.mp3',
    hasFace: true,
    faceCount: 1,
    cassetteImage: '/images/cassette_4.png',
    lyrics: `在黃昏的天空　我看到
那彩帶一樣的迷濛　是你可愛的笑容
跟著我走在雨中　我們去
看那迷濛的天空　在這雨的季節中

季節雨　別笑我什麼都不懂
我知道愛　就像一場夢
季節雨　別笑我什麼都不懂
我知道愛　就像季節雨
消失無蹤　呵呵　呵呵
呵呵呵呵呵呵

在黃昏的天空　我看到
那彩帶一樣的迷濛　是你可愛的笑容
跟著我走在雨中　我們去
看那迷濛的天空　在這雨的季節中

季節雨　別笑我什麼都不懂
我知道愛　就像一場夢
季節雨　別笑我什麼都不懂
我知道愛　就像季節雨
消失無蹤　呵呵　呵呵
呵呵呵呵呵呵`,
    promptBank: {
      seasons: [{ label: "黃昏", value: "sunset sky" }, { label: "陰天", value: "cloudy sky" }, { label: "霓虹光", value: "neon lights" }],
      elements: [{ label: "緞帶", value: "colorful ribbons" }, { label: "撐傘", value: "holding umbrella" }, { label: "城市街景", value: "city street view" }]
    }
  },
  {
    id: 'visit_spring',
    title: '拜訪春天',
    singer: '施孝榮',
    audioFileName: 'visit_spring.mp3',
    hasFace: true,
    faceCount: 4,
    cassetteImage: '/images/cassette_5.png',
    lyrics: `那年我們來到小小的山巔
有雨細細濃濃的山巔
你飛散髮成春天
我們就走進
意象深深的詩篇

你說我像詩意的雨點
輕輕飄上你的紅靨
啊 我醉了好幾遍
我 醉了好幾遍

那年我們來到小小的山巔
有雨細細濃濃的山巔
你飛散髮成春天
我們就走進
意象深深的詩篇

你說我像詩意的雨點
輕輕飄上你的紅靨
啊 我醉了好幾遍
我 醉了好幾遍

那年我們來到小小的山巔
有雨細細濃濃的山巔
你飛散髮成春天
我們就走進
意象深深的詩篇

你說我像詩意的雨點
輕輕飄上你的紅靨
啊 我醉了好幾遍
我 醉了好幾遍

那年我們來到小小的山巔
有雨細細濃濃的山巔
你飛散髮成春天
我們就走進
意象深深的詩篇

你說我像詩意的雨點
輕輕飄上你的紅靨
啊 我醉了好幾遍
我 醉了好幾遍

今年我又來到你門前
你只是用柔柔烏黑的眼
輕輕地說聲抱歉
這一個時節 沒有春天`,
    promptBank: {
      seasons: [{ label: "春風", value: "spring breeze" }, { label: "微雨", value: "light rain" }, { label: "晨霧", value: "morning fog" }],
      elements: [{ label: "小山丘", value: "small hills" }, { label: "長髮", value: "long hair" }, { label: "詩集", value: "poetry book" }]
    }
  }
];