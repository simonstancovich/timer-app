import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { gradients } from '../../tokens/colors';
import { typography } from '../../tokens/typography';

type GradientName = keyof typeof gradients;
type UITextVariant = 'display' | 'bodyLg' | 'body' | 'bodySm' | 'caption' | 'micro';

const variantToStyle = {
  display: typography.display,
  bodyLg: typography.bodyLg,
  body: typography.body,
  bodySm: typography.bodySm,
  caption: typography.caption,
  micro: typography.micro,
} satisfies Record<UITextVariant, TextStyle>;

type GradientTextProps = Omit<TextProps, 'children'> & {
  children: ReactNode;
  gradient: GradientName;
  variant?: UITextVariant;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
};

export const GradientText = ({
  children,
  gradient,
  variant = 'display',
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  ...rest
}: GradientTextProps) => {
  const textStyle = [variantToStyle[variant], style];
  return (
    <MaskedView
      maskElement={
        <Text {...rest} style={textStyle}>
          {children}
        </Text>
      }
    >
      <LinearGradient colors={gradients[gradient]} start={start} end={end}>
        <Text {...rest} style={[textStyle, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};
