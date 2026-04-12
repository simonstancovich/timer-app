/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#F8F7F4',
        ink: '#19180F',
        sub: '#6B6A62',
        muted: '#B0ADA5',
        surf: '#F0EEE9',
        brd: '#E5E4E0',
        brand: {
          DEFAULT: '#5244E8',
          light: '#ECEAFF',
          dark: '#3B31D0',
        },
        project: {
          violet: { DEFAULT: '#5244E8', light: '#ECEAFF', dark: '#3B31D0' },
          ocean: { DEFAULT: '#0369A1', light: '#E0F2FE', dark: '#025580' },
          ember: { DEFAULT: '#C2410C', light: '#FEF3E2', dark: '#9A340A' },
          forest: { DEFAULT: '#166534', light: '#DCFCE7', dark: '#104D27' },
          rose: { DEFAULT: '#9D174D', light: '#FCE7F3', dark: '#7C1240' },
          amber: { DEFAULT: '#92400E', light: '#FEF9C3', dark: '#6F300A' },
          teal: { DEFAULT: '#0899A0', light: '#CCFBF1', dark: '#067980' },
        },
      },
    },
  },
  plugins: [],
};
