import type { TextStyle } from 'react-native';

export const typography = {
  display: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 24,
    letterSpacing: -0.5,
  },

  bodyLg: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 },
  body: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
  bodySm: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },
  caption: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 },
  micro: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },

  timerXl: { fontFamily: 'SpaceMono_700Bold', fontSize: 82, letterSpacing: -4 },
  timerLg: { fontFamily: 'SpaceMono_700Bold', fontSize: 48, letterSpacing: -3 },
  timerMd: { fontFamily: 'SpaceMono_700Bold', fontSize: 28, letterSpacing: -1.5 },
  timerSm: { fontFamily: 'SpaceMono_700Bold', fontSize: 12, letterSpacing: -0.5 },
  numXl: { fontFamily: 'SpaceMono_700Bold', fontSize: 40, letterSpacing: -2 },
  numLg: { fontFamily: 'SpaceMono_700Bold', fontSize: 26, letterSpacing: -1 },
  numMd: { fontFamily: 'SpaceMono_400Regular', fontSize: 14 },
} satisfies Record<string, TextStyle>;

export type TypographyKey = keyof typeof typography;
