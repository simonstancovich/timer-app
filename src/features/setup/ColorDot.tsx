import { memo, useCallback, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { DotItem } from './types';

export const DOT_SIZE = 34;
export const DOT_GAP = 10;
export const DOT_SCALE_ACTIVE = 1.18;
export const DOT_SCALE_INACTIVE = 1;
const DOT_SPRING = { damping: 14, stiffness: 220 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ColorDotProps = {
  item: DotItem;
  isActive: boolean;
  onPick: (item: DotItem) => void;
  activeBorderColor: string;
};

const ColorDotImpl = ({ item, isActive, onPick, activeBorderColor }: ColorDotProps) => {
  const scale = useSharedValue(isActive ? DOT_SCALE_ACTIVE : DOT_SCALE_INACTIVE);

  useEffect(() => {
    scale.value = withSpring(isActive ? DOT_SCALE_ACTIVE : DOT_SCALE_INACTIVE, DOT_SPRING);
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => onPick(item), [onPick, item]);

  const label =
    item.kind === 'preset' ? `Pick ${item.preset}` : `Pick generated color ${item.index}`;

  return (
    <AnimatedPressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={[
        styles.dot,
        { backgroundColor: item.hex },
        isActive && { borderWidth: 2.5, borderColor: activeBorderColor },
        animatedStyle,
      ]}
    />
  );
};

export const ColorDot = memo(ColorDotImpl);

const styles = StyleSheet.create({
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
