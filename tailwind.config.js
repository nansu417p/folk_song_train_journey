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
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.25rem' }], // 備用極小字 (14px)
        'sm': ['1rem', { lineHeight: '1.5rem' }],     // Level 1: 標籤/輔助 (16px)
        'base': ['1.125rem', { lineHeight: '1.75rem' }], // Level 2: 標準內文 (18px)
        'lg': ['1.25rem', { lineHeight: '1.75rem' }],    // Level 3: 按鈕/強調 (20px)
        'xl': ['1.5rem', { lineHeight: '2rem' }],       // Level 4: 小標題 (24px)
        '2xl': ['1.875rem', { lineHeight: '2.25rem' }],  // Level 5: 重點標題 (30px)
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '4xl': ['3rem', { lineHeight: '1' }],
        '5xl': ['3.75rem', { lineHeight: '1' }],
        '6xl': ['4.5rem', { lineHeight: '1' }],
        '7xl': ['5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
      },
      backgroundImage: {
        'paper-texture': "url('/assets/paper-texture.png')", // 預留紙質紋理位置
      }
    },
  },
  plugins: [],
}