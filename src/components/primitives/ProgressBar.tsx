import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, type ColorToken } from '../../tokens/colors';

type ProgressBarProps = Omit<ViewProps, 'children'> & {
  pct: number;
  color: ColorToken;
  bgColor?: ColorToken;
  height?: number;
  radius?: number;
};

export function ProgressBar({
  pct,
  color,
  bgColor = 'surf',
  height = 6,
  radius = 3,
  style,
  ...rest
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, pct));
  const width = useSharedValue(clamped);

  useEffect(() => {
    width.value = withTiming(clamped, { duration: 400, easing: Easing.out(Easing.cubic) });
  }, [clamped, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View
      {...rest}
      style={[{ height, borderRadius: radius, backgroundColor: colors[bgColor], overflow: 'hidden' }, style]}
    >
      <Animated.View
        style={[{ height, borderRadius: radius, backgroundColor: colors[color] }, fillStyle]}
      />
    </View>
  );
}
