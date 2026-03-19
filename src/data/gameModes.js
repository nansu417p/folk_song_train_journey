// ★ 中央控制：在此統一修改所有車廂的名稱
export const CARRIAGE_NAMES = {
  MOOD_TRAIN: "心情車票",
  AR_CATCH: "民歌卡帶播放器",
  AI_COVER: "自製專輯封面",
  SING_ALONG: "民歌錄音室",
  FACE_SWAP: "一日歌手", // 這是原本的合照車廂
  LYRICS: "歌詞拼貼",
  CAPSULE: "民歌回憶"
};

// ★ 中央控制：在此統一修改所有車廂的副標題
export const CARRIAGE_SUBTITLES = {
  MOOD_TRAIN: "帶著今日的心情踏上旅程",
  AR_CATCH: "",
  AI_COVER: "繪製屬於您的專輯封面",
  SING_ALONG: "用聲音點亮回憶",
  FACE_SWAP: "成為專輯封面主角",
  LYRICS: "修復記憶中的旋律",
  CAPSULE: "打包你的專屬回憶"
};

export const gameModes = [
  { id: 'mood-train', title: CARRIAGE_NAMES.MOOD_TRAIN, description: CARRIAGE_SUBTITLES.MOOD_TRAIN, color: "bg-indigo-600", icon: "🚂" },
  { id: 'ar', title: CARRIAGE_NAMES.AR_CATCH, description: CARRIAGE_SUBTITLES.AR_CATCH, color: "bg-folk-green", icon: "🖐️" },
  { id: 'ai-zimage', title: CARRIAGE_NAMES.AI_COVER, description: CARRIAGE_SUBTITLES.AI_COVER, color: "bg-cyan-600", icon: "🎨" },
  { id: 'sing-along', title: CARRIAGE_NAMES.SING_ALONG, description: CARRIAGE_SUBTITLES.SING_ALONG, color: "bg-purple-600", icon: "🎤" },
  { id: 'faceswap', title: CARRIAGE_NAMES.FACE_SWAP, description: CARRIAGE_SUBTITLES.FACE_SWAP, color: "bg-rose-700", icon: "🎙️" },
  { id: 'lyrics', title: CARRIAGE_NAMES.LYRICS, description: CARRIAGE_SUBTITLES.LYRICS, color: "bg-folk-red", icon: "📝" },
  { id: 'capsule', title: CARRIAGE_NAMES.CAPSULE, description: CARRIAGE_SUBTITLES.CAPSULE, color: "bg-amber-500", icon: "🎁" }
];