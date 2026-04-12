import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { colors, type ColorToken } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

type PillProps = Omit<ViewProps, 'children'> & {
  children: ReactNode;
  bg: ColorToken;
  radius?: number;
};

export function Pill({ children, bg, radius = spacing.pillRadius, style, ...rest }: PillProps) {
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: colors[bg],
          borderRadius: radius,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
