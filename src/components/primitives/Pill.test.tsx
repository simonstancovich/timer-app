import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Pill } from './Pill';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

describe('Pill', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Pill bg="surf">
        <Text>hi</Text>
      </Pill>,
    );
    expect(getByText('hi')).toBeTruthy();
  });

  it('resolves a color token for bg', () => {
    const { getByTestId } = render(
      <Pill testID="pill" bg="brandLight">
        <Text>hi</Text>
      </Pill>,
    );
    expect(flattenStyle(getByTestId('pill').props.style).backgroundColor).toBe(colors.brandLight);
  });

  it('defaults radius to spacing.pillRadius', () => {
    const { getByTestId } = render(
      <Pill testID="pill" bg="surf">
        <Text>hi</Text>
      </Pill>,
    );
    expect(flattenStyle(getByTestId('pill').props.style).borderRadius).toBe(spacing.pillRadius);
  });

  it('applies a custom radius', () => {
    const { getByTestId } = render(
      <Pill testID="pill" bg="surf" radius={12}>
        <Text>hi</Text>
      </Pill>,
    );
    expect(flattenStyle(getByTestId('pill').props.style).borderRadius).toBe(12);
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
