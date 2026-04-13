import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors } from '../../tokens/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CtaButtonProps = {
  label: string;
  isReady: boolean;
  activeDark: string;
  width: number;
  onPress: () => void;
  idleBgAnimated: StyleProp<ViewStyle>;
  idleTextAnimated: StyleProp<TextStyle>;
};

export const CtaButton = ({
  label,
  isReady,
  activeDark,
  width,
  onPress,
  idleBgAnimated,
  idleTextAnimated,
}: CtaButtonProps) => {
  if (isReady) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.cta, styles.ctaReady, { width }]}
      >
        <Text style={[styles.ctaText, { color: activeDark }]}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <AnimatedPressable
      disabled
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: true }}
      style={[styles.cta, { width }, idleBgAnimated]}
    >
      <Animated.Text style={[styles.ctaText, idleTextAnimated]}>{label}</Animated.Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  cta: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaReady: {
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  ctaText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: colors.white,
  },
});
