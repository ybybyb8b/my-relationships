/** @type {import('tailwindcss').Config} */
export default {
  // 开启手动控制深色模式（我们将通过代码检测系统设置来切换）
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // === 浅色模式颜色 ===
        'ios-bg': '#F2F2F7',         // 浅灰背景
        'ios-card': '#FFFFFF',       // 纯白卡片
        'ios-text': '#1C1C1E',       // 近似黑
        'ios-subtext': '#8E8E93',    // 浅灰字
        'ios-border': '#E5E5EA',     // 浅色分割线

        // === 深色模式颜色 (Dark Mode) ===
        'ios-bg-dark': '#000000',      // 纯黑背景
        'ios-card-dark': '#1C1C1E',    // 深灰卡片
        'ios-text-dark': '#F2F2F7',    // 近似白
        'ios-subtext-dark': '#98989D', // 深灰字
        'ios-border-dark': '#38383A',  // 深色分割线

        // === 马卡龙色系 (浅色模式) ===
        'macaron-pink': '#FFD1DC',
        'macaron-blue': '#C1E1FF',
        'macaron-green': '#D0F0C0',
        'macaron-yellow': '#FDFD96',
        'macaron-purple': '#E6E6FA',

        // === 马卡龙色系 (深色模式 - 降低亮度与饱和度) ===
        'macaron-pink-dark': '#4A2C32',
        'macaron-blue-dark': '#2C3A4A',
        'macaron-green-dark': '#2C4A32',
        'macaron-yellow-dark': '#4A4A2C',
        'macaron-purple-dark': '#3A2C4A',
      },
      fontFamily: {
        hand: ['MyHandwriting', 'sans-serif'],

        sans: [
          'MyMainFont',
          '-apple-system', 
          'BlinkMacSystemFont', 
          '"SF Pro Text"', 
          '"Helvetica Neue"', 
          'sans-serif'
        ],
      }
    },
  },
  plugins: [],
}