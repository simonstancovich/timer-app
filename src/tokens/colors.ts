export const colors = {
  bg: '#F8F7F4',
  white: '#FFFFFF',

  ink: '#19180F',
  sub: '#6B6A62',
  muted: '#B0ADA5',

  surf: '#F0EEE9',
  brd: '#E5E4E0',

  brand: '#5244E8',
  brandLight: '#ECEAFF',
  brandDark: '#3B31D0',

  violet: '#5244E8',
  violetLight: '#ECEAFF',
  violetDark: '#3B31D0',

  ocean: '#0369A1',
  oceanLight: '#E0F2FE',
  oceanDark: '#025580',

  ember: '#C2410C',
  emberLight: '#FEF3E2',
  emberDark: '#9A340A',

  forest: '#166534',
  forestLight: '#DCFCE7',
  forestDark: '#104D27',

  rose: '#9D174D',
  roseLight: '#FCE7F3',
  roseDark: '#7C1240',

  amber: '#92400E',
  amberLight: '#FEF9C3',
  amberDark: '#6F300A',

  teal: '#0899A0',
  tealLight: '#CCFBF1',
  tealDark: '#067980',

  streakBg: '#FFF3E0',
  streakBorder: '#FFCC8055',
  streakText: '#D97706',
} as const;

export type ColorToken = keyof typeof colors;

export const gradients = {
  celebration: ['#5244E8', '#9D174D', '#C2410C'],
} as const;
