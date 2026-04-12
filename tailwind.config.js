/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#F8F7F4',
        ink: '#19180F',
        sub: '#6B6A62',
        muted: '#B0ADA5',
        surf: '#F0EEE9',
        brd: '#E5E4E0',
        brand: '#5244E8',
        'brand-l': '#ECEAFF',
        'brand-d': '#3B31D0',
      },
    },
  },
  plugins: [],
};
