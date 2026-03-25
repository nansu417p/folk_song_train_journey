/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'folk-bg': '#FDFBF7', // 米黃色紙質感背景
        'folk-paper': '#FFF9E6', // 更亮一點的卡片紙質色
        'folk-red': '#D64F3E', // 復古紅 (Primary Action)
        'folk-green': '#2A9D8F', // 湖水綠 
        'folk-dark': '#264653', // 深色文字
        'folk-gold': '#E9C46A', // 點綴金黃 (Secondary Action)
        'folk-wood': '#D2A679', // 木質返回鍵/次要按鈕
        'folk-wood-dark': '#C09668', // 木質 hover 狀態
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', 'serif'], 
      },
      backgroundImage: {
        'paper-texture': "url('/assets/paper-texture.png')", // 預留紙質紋理位置
      }
    },
  },
  plugins: [],
}