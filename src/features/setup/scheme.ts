import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import {
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

export type SchemeTokens = {
  label: string;
  heading: string;
  sub: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  dotActiveBorder: string;
  ctaIdleBg: string;
  ctaIdleText: string;
};

export const SCHEMES = {
  onDark: {
    label: 'rgba(255,255,255,0.55)',
    heading: '#FFFFFF',
    sub: 'rgba(255,255,255,0.72)',
    inputBg: 'rgba(255,255,255,0.13)',
    inputBorder: 'rgba(255,255,255,0.28)',
    inputText: '#FFFFFF',
    inputPlaceholder: 'rgba(255,255,255,0.55)',
    dotActiveBorder: '#FFFFFF',
    ctaIdleBg: 'rgba(255,255,255,0.15)',
    ctaIdleText: 'rgba(255,255,255,0.45)',
  },
  onLight: {
    label: 'rgba(0,0,0,0.55)',
    heading: '#0F0E0B',
    sub: 'rgba(0,0,0,0.6)',
    inputBg: 'rgba(0,0,0,0.08)',
    inputBorder: 'rgba(0,0,0,0.22)',
    inputText: '#0F0E0B',
    inputPlaceholder: 'rgba(0,0,0,0.45)',
    dotActiveBorder: '#0F0E0B',
    ctaIdleBg: 'rgba(0,0,0,0.12)',
    ctaIdleText: 'rgba(0,0,0,0.4)',
  },
} satisfies Record<'onDark' | 'onLight', SchemeTokens>;

export const LIGHT_BG_THRESHOLD = 0.45;

const STOPS: [number, number] = [0, 1];

export const useSchemeTextColor = (
  progress: SharedValue<number>,
  key: keyof SchemeTokens,
): StyleProp<TextStyle> =>
  useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, STOPS, [SCHEMES.onDark[key], SCHEMES.onLight[key]]),
  })) as unknown as StyleProp<TextStyle>;

export const useSchemeViewBackground = (
  progress: SharedValue<number>,
  key: keyof SchemeTokens,
): StyleProp<ViewStyle> =>
  useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, STOPS, [
      SCHEMES.onDark[key],
      SCHEMES.onLight[key],
    ]),
  })) as unknown as StyleProp<ViewStyle>;

export const useSchemeInputStyle = (
  progress: SharedValue<number>,
): StyleProp<TextStyle> =>
  useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, STOPS, [
      SCHEMES.onDark.inputBg,
      SCHEMES.onLight.inputBg,
    ]),
    borderColor: interpolateColor(progress.value, STOPS, [
      SCHEMES.onDark.inputBorder,
      SCHEMES.onLight.inputBorder,
    ]),
    color: interpolateColor(progress.value, STOPS, [
      SCHEMES.onDark.inputText,
      SCHEMES.onLight.inputText,
    ]),
  })) as unknown as StyleProp<TextStyle>;
