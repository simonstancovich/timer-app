import { clamp, hslToHex, relativeLuminance } from './color';

describe('clamp', () => {
  it('returns the value when inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps below the lower bound', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });
  it('clamps above the upper bound', () => {
    expect(clamp(42, 0, 10)).toBe(10);
  });
});

describe('hslToHex', () => {
  it('converts primary colors correctly', () => {
    expect(hslToHex(0, 100, 50)).toBe('#ff0000');
    expect(hslToHex(120, 100, 50)).toBe('#00ff00');
    expect(hslToHex(240, 100, 50)).toBe('#0000ff');
  });
  it('converts achromatic values to grayscale', () => {
    expect(hslToHex(0, 0, 0)).toBe('#000000');
    expect(hslToHex(0, 0, 100)).toBe('#ffffff');
    expect(hslToHex(180, 0, 50)).toBe('#808080');
  });
  it('pads single-digit channels with a leading zero', () => {
    const hex = hslToHex(60, 100, 1);
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(hex.length).toBe(7);
  });
});

describe('relativeLuminance', () => {
  it('returns 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });
  it('accepts hex strings with or without the leading #', () => {
    expect(relativeLuminance('ffffff')).toBeCloseTo(relativeLuminance('#ffffff'), 10);
  });
  it('ranks dark vs light colors consistently', () => {
    expect(relativeLuminance('#222222')).toBeLessThan(relativeLuminance('#dddddd'));
  });
});
