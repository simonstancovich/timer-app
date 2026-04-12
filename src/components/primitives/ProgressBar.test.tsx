import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { ProgressBar } from './ProgressBar';
import { colors } from '../../tokens/colors';

describe('ProgressBar', () => {
  it('applies bg color, default height 6, default radius 3', () => {
    const { getByTestId } = render(<ProgressBar testID="bar" pct={50} color="brand" />);
    const flat = flattenStyle(getByTestId('bar').props.style);
    expect(flat.backgroundColor).toBe(colors.surf);
    expect(flat.height).toBe(6);
    expect(flat.borderRadius).toBe(3);
  });

  it('honors a custom bgColor token', () => {
    const { getByTestId } = render(
      <ProgressBar testID="bar" pct={50} color="brand" bgColor="brandLight" />,
    );
    expect(flattenStyle(getByTestId('bar').props.style).backgroundColor).toBe(colors.brandLight);
  });

  it('paints the fill in the given color token', () => {
    const { UNSAFE_getAllByType } = render(<ProgressBar pct={50} color="brand" />);
    const fill = UNSAFE_getAllByType(View).find(
      (v) => flattenStyle(v.props.style).backgroundColor === colors.brand,
    );
    expect(fill).toBeTruthy();
  });

  it('accepts custom height and radius', () => {
    const { getByTestId } = render(
      <ProgressBar testID="bar" pct={50} color="brand" height={12} radius={6} />,
    );
    const flat = flattenStyle(getByTestId('bar').props.style);
    expect(flat.height).toBe(12);
    expect(flat.borderRadius).toBe(6);
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
