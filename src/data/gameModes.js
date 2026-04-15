// ★ 中央控制：在此統一修改所有車廂的名稱（加入溫度的文案）
export const CARRIAGE_NAMES = {
  MOOD_TRAIN: "1 啟程售票處",
  AR_CATCH: "2 旋律播放器",
  AI_COVER: "3 時光畫筆",
  LYRICS: "4 青春歌詞本",
  FACE_SWAP: "6 歲月留影",
  SING_ALONG: "5 金曲錄音室",
  CAPSULE: "7 旅程回憶"
};

// ★ 中央控制：在此統一修改所有車廂的副標題（增添感性語氣）
export const CARRIAGE_SUBTITLES = {
  MOOD_TRAIN: "拍下此刻心情，領取專屬車票",
  AR_CATCH: "挑選一首觸動心弦的經典民歌",
  AI_COVER: "畫筆揮灑，重塑經典專輯視覺",
  LYRICS: "拼湊散落的詩句，尋回熟悉的旋律",
  FACE_SWAP: "走入時光機，化身經典封面主角",
  SING_ALONG: "拿起麥克風，錄下你的專屬翻唱",
  CAPSULE: "打包沿途感動，寄給未來的自己"
};

export const gameModes = [
  { id: 'mood-train', title: CARRIAGE_NAMES.MOOD_TRAIN, description: CARRIAGE_SUBTITLES.MOOD_TRAIN, color: "bg-indigo-600", icon: "🚂" },
  { id: 'ar', title: CARRIAGE_NAMES.AR_CATCH, description: CARRIAGE_SUBTITLES.AR_CATCH, color: "bg-folk-green", icon: "🖐️" },
  { id: 'ai-zimage', title: CARRIAGE_NAMES.AI_COVER, description: CARRIAGE_SUBTITLES.AI_COVER, color: "bg-cyan-600", icon: "🎨" },
  { id: 'lyrics', title: CARRIAGE_NAMES.LYRICS, description: CARRIAGE_SUBTITLES.LYRICS, color: "bg-folk-red", icon: "📝" },
  { id: 'sing-along', title: CARRIAGE_NAMES.SING_ALONG, description: CARRIAGE_SUBTITLES.SING_ALONG, color: "bg-purple-600", icon: "🎤" },
  { id: 'faceswap', title: CARRIAGE_NAMES.FACE_SWAP, description: CARRIAGE_SUBTITLES.FACE_SWAP, color: "bg-rose-700", icon: "🎙️" },
  { id: 'capsule', title: CARRIAGE_NAMES.CAPSULE, description: CARRIAGE_SUBTITLES.CAPSULE, color: "bg-amber-500", icon: "🎁" }
];