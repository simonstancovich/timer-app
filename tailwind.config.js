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

        brand: '#5244E8',
        'brand-light': '#ECEAFF',
        'brand-dark': '#3B31D0',

        violet: '#5244E8',
        'violet-light': '#ECEAFF',
        'violet-dark': '#3B31D0',

        ocean: '#0369A1',
        'ocean-light': '#E0F2FE',
        'ocean-dark': '#025580',

        ember: '#C2410C',
        'ember-light': '#FEF3E2',
        'ember-dark': '#9A340A',

        forest: '#166534',
        'forest-light': '#DCFCE7',
        'forest-dark': '#104D27',

        rose: '#9D174D',
        'rose-light': '#FCE7F3',
        'rose-dark': '#7C1240',

        amber: '#92400E',
        'amber-light': '#FEF9C3',
        'amber-dark': '#6F300A',

        teal: '#0899A0',
        'teal-light': '#CCFBF1',
        'teal-dark': '#067980',

        'streak-bg': '#FFF3E0',
        'streak-text': '#D97706',
      },
    },
  },
  plugins: [],
};
