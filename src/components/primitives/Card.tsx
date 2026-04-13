import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { colors, type ColorToken } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

type TopStripe = {
  pct: number;
  color: ColorToken;
  colorLight: ColorToken;
};

type CardProps = Omit<ViewProps, 'children'> & {
  children: ReactNode;
  topStripe?: TopStripe;
};

const STRIPE_HEIGHT = 5;

export const Card = ({ children, topStripe, style, ...rest }: CardProps) => {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors.white,
          borderColor: colors.brd,
          borderWidth: 1,
          borderRadius: spacing.cardRadius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {topStripe ? <CardTopStripe {...topStripe} /> : null}
      <View>{children}</View>
    </View>
  );
};

const CardTopStripe = ({ pct, color, colorLight }: TopStripe) => {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ height: STRIPE_HEIGHT, backgroundColor: colors[colorLight] }}>
      <View style={{ height: STRIPE_HEIGHT, width: `${clamped}%`, backgroundColor: colors[color] }} />
    </View>
  );
};
