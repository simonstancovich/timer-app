import type { ReactNode } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, type ColorToken } from '../../tokens/colors';
import { typography } from '../../tokens/typography';

type UITextVariant = 'display' | 'bodyLg' | 'body' | 'bodySm' | 'caption' | 'micro';

const variantToStyle = {
  display: typography.display,
  bodyLg: typography.bodyLg,
  body: typography.body,
  bodySm: typography.bodySm,
  caption: typography.caption,
  micro: typography.micro,
} satisfies Record<UITextVariant, TextStyle>;

type UITextProps = Omit<TextProps, 'children'> & {
  variant?: UITextVariant;
  color?: ColorToken;
  children: ReactNode;
};

export function UIText({
  variant = 'body',
  color = 'ink',
  style,
  children,
  ...rest
}: UITextProps) {
  return (
    <Text {...rest} style={[variantToStyle[variant], { color: colors[color] }, style]}>
      {children}
    </Text>
  );
}
