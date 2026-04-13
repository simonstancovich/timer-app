import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, type ColorToken } from '../../tokens/colors';
import { typography } from '../../tokens/typography';

type MonoSize = 'xl' | 'lg' | 'md' | 'sm';

const sizeToStyle = {
  xl: typography.timerXl,
  lg: typography.timerLg,
  md: typography.timerMd,
  sm: typography.timerSm,
} satisfies Record<MonoSize, TextStyle>;

const minFontScaleBySize: Record<MonoSize, number> = {
  xl: 0.7,
  lg: 0.85,
  md: 1,
  sm: 1,
};

type MonoTextProps = Omit<TextProps, 'children'> & {
  size?: MonoSize;
  color?: ColorToken;
  children: string;
};

export const MonoText = ({
  size = 'md',
  color = 'ink',
  style,
  children,
  ...rest
}: MonoTextProps) => {
  const minScale = minFontScaleBySize[size];
  const canShrink = minScale < 1;
  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit={canShrink}
      minimumFontScale={minScale}
      {...rest}
      style={[sizeToStyle[size], { color: colors[color] }, style]}
    >
      {children}
    </Text>
  );
};
