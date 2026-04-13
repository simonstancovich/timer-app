import type { PresetProjectColor } from '../../types';

export type DotItem =
  | { kind: 'preset'; preset: PresetProjectColor; hex: string; dark: string; key: string }
  | { kind: 'custom'; index: number; hex: string; dark: string; key: string };
