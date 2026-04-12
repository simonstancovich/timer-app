import { render } from '@testing-library/react-native';
import { UIText } from './UIText';
import { colors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';

describe('UIText', () => {
  it('renders children', () => {
    const { getByText } = render(<UIText>Hello</UIText>);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('applies the correct typography per variant', () => {
    const cases = [
      ['display', typography.display],
      ['bodyLg', typography.bodyLg],
      ['body', typography.body],
      ['bodySm', typography.bodySm],
      ['caption', typography.caption],
      ['micro', typography.micro],
    ] as const;

    for (const [variant, expected] of cases) {
      const { getByText, unmount } = render(<UIText variant={variant}>x</UIText>);
      const flat = flattenStyle(getByText('x').props.style);
      expect(flat.fontFamily).toBe(expected.fontFamily);
      expect(flat.fontSize).toBe(expected.fontSize);
      unmount();
    }
  });

  it('defaults variant to body and color to ink', () => {
    const { getByText } = render(<UIText>x</UIText>);
    const flat = flattenStyle(getByText('x').props.style);
    expect(flat.fontFamily).toBe(typography.body.fontFamily);
    expect(flat.color).toBe(colors.ink);
  });

  it('resolves color token names', () => {
    const { getByText } = render(<UIText color="sub">x</UIText>);
    expect(flattenStyle(getByText('x').props.style).color).toBe(colors.sub);
  });

  it('lets style prop override color', () => {
    const { getByText } = render(
      <UIText color="ink" style={{ color: 'red' }}>
        x
      </UIText>,
    );
    expect(flattenStyle(getByText('x').props.style).color).toBe('red');
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
