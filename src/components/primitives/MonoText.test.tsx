import { render } from '@testing-library/react-native';
import { MonoText } from './MonoText';
import { colors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';

describe('MonoText', () => {
  it('renders children as provided', () => {
    const { getByText } = render(<MonoText>01:23:45</MonoText>);
    expect(getByText('01:23:45')).toBeTruthy();
  });

  it('applies the correct typography style per size', () => {
    const cases = [
      ['xl', typography.timerXl],
      ['lg', typography.timerLg],
      ['md', typography.timerMd],
      ['sm', typography.timerSm],
    ] as const;

    for (const [size, expected] of cases) {
      const { getByText, unmount } = render(<MonoText size={size}>00:00</MonoText>);
      const flat = flattenStyle(getByText('00:00').props.style);
      expect(flat.fontFamily).toBe(expected.fontFamily);
      expect(flat.fontSize).toBe(expected.fontSize);
      expect(flat.letterSpacing).toBe(expected.letterSpacing);
      unmount();
    }
  });

  it('defaults to size md when no size prop is given', () => {
    const { getByText } = render(<MonoText>00:00</MonoText>);
    const flat = flattenStyle(getByText('00:00').props.style);
    expect(flat.fontSize).toBe(typography.timerMd.fontSize);
  });

  it('enables auto-shrink only for xl and lg', () => {
    const { getByText: getXl } = render(<MonoText size="xl">01:23:45</MonoText>);
    expect(getXl('01:23:45').props.adjustsFontSizeToFit).toBe(true);

    const { getByText: getLg } = render(<MonoText size="lg">01:23:45</MonoText>);
    expect(getLg('01:23:45').props.adjustsFontSizeToFit).toBe(true);

    const { getByText: getMd } = render(<MonoText size="md">01:23</MonoText>);
    expect(getMd('01:23').props.adjustsFontSizeToFit).toBe(false);

    const { getByText: getSm } = render(<MonoText size="sm">12:34</MonoText>);
    expect(getSm('12:34').props.adjustsFontSizeToFit).toBe(false);
  });

  it('merges caller-provided style after base size style', () => {
    const { getByText } = render(
      <MonoText size="md" style={{ color: 'red', fontSize: 99 }}>
        00:00
      </MonoText>,
    );
    const flat = flattenStyle(getByText('00:00').props.style);
    expect(flat.color).toBe('red');
    expect(flat.fontSize).toBe(99);
  });

  it('defaults color to ink', () => {
    const { getByText } = render(<MonoText>00:00</MonoText>);
    const flat = flattenStyle(getByText('00:00').props.style);
    expect(flat.color).toBe(colors.ink);
  });

  it('resolves color token names to their hex values', () => {
    const { getByText } = render(<MonoText color="sub">00:00</MonoText>);
    const flat = flattenStyle(getByText('00:00').props.style);
    expect(flat.color).toBe(colors.sub);
  });

  it('lets style prop override color (style wins, last in merge)', () => {
    const { getByText } = render(
      <MonoText color="ink" style={{ color: 'red' }}>
        00:00
      </MonoText>,
    );
    const flat = flattenStyle(getByText('00:00').props.style);
    expect(flat.color).toBe('red');
  });
});

type AnyStyle = Record<string, unknown>;

function flattenStyle(style: unknown): AnyStyle {
  if (Array.isArray(style)) {
    return style.reduce<AnyStyle>((acc, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  if (style && typeof style === 'object') return style as AnyStyle;
  return {};
}
