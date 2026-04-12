import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { Card } from './Card';
import { colors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

describe('Card', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Card>
        <Text>body</Text>
      </Card>,
    );
    expect(getByText('body')).toBeTruthy();
  });

  it('applies default white bg, brd border, and card radius', () => {
    const { getByTestId } = render(
      <Card testID="card">
        <Text>body</Text>
      </Card>,
    );
    const flat = flattenStyle(getByTestId('card').props.style);
    expect(flat.backgroundColor).toBe(colors.white);
    expect(flat.borderColor).toBe(colors.brd);
    expect(flat.borderRadius).toBe(spacing.cardRadius);
  });

  it('renders a top stripe with resolved colors at given pct width', () => {
    const { UNSAFE_getAllByType } = render(
      <Card topStripe={{ pct: 40, color: 'brand', colorLight: 'brandLight' }}>
        <Text>body</Text>
      </Card>,
    );
    const views = UNSAFE_getAllByType(View);
    const track = views.find(
      (v) => flattenStyle(v.props.style).backgroundColor === colors.brandLight,
    );
    const fill = views.find((v) => flattenStyle(v.props.style).backgroundColor === colors.brand);
    expect(track).toBeTruthy();
    expect(fill).toBeTruthy();
    expect(flattenStyle(fill?.props.style).width).toBe('40%');
  });

  it('clamps top stripe pct into [0,100]', () => {
    const { UNSAFE_getAllByType } = render(
      <Card topStripe={{ pct: 150, color: 'brand', colorLight: 'brandLight' }}>
        <Text>body</Text>
      </Card>,
    );
    const fill = UNSAFE_getAllByType(View).find(
      (v) => flattenStyle(v.props.style).backgroundColor === colors.brand,
    );
    expect(flattenStyle(fill?.props.style).width).toBe('100%');
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
