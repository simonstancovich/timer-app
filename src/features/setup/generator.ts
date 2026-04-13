import { clamp, hslToHex } from '../../utils/color';

const GOLDEN_ANGLE = 137.508;
const SAT_BASE = 62;
const SAT_AMP_1 = 32;
const SAT_AMP_2 = 10;
const SAT_MIN = 28;
const SAT_MAX = 96;
const LIGHT_BASE = 56;
const LIGHT_AMP_1 = 20;
const LIGHT_AMP_2 = 8;
const LIGHT_MIN = 32;
const LIGHT_MAX = 78;
const DARK_LIGHTNESS_DELTA = 32;
const DARK_LIGHTNESS_FLOOR = 14;

export const generatedAtIndex = (idx: number): { hex: string; dark: string } => {
  const hue = (idx * GOLDEN_ANGLE) % 360;
  const sat = clamp(
    SAT_BASE + SAT_AMP_1 * Math.sin(idx * 0.41) + SAT_AMP_2 * Math.sin(idx * 1.31 + 0.7),
    SAT_MIN,
    SAT_MAX,
  );
  const light = clamp(
    LIGHT_BASE + LIGHT_AMP_1 * Math.sin(idx * 0.73 + 1.7) + LIGHT_AMP_2 * Math.sin(idx * 1.97),
    LIGHT_MIN,
    LIGHT_MAX,
  );
  const darkL = Math.max(DARK_LIGHTNESS_FLOOR, light - DARK_LIGHTNESS_DELTA);
  return {
    hex: hslToHex(hue, sat, light),
    dark: hslToHex(hue, sat, darkL),
  };
};
