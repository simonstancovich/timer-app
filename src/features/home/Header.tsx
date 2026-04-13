import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../../tokens/colors';

type HeaderProps = {
  dateLabel: string;
  greeting: string;
  streak: number;
};

const STREAK_ENTRY_DELAY_MS = 400;
const STREAK_STEP_MS = 180;

export const Header = ({ dateLabel, greeting, streak }: HeaderProps) => {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.date}>{dateLabel}</Text>
        <Text style={styles.greeting}>{greeting}</Text>
      </View>
      {streak > 0 ? <StreakBadge streak={streak} /> : null}
    </View>
  );
};

const StreakBadge = ({ streak }: { streak: number }) => {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(STREAK_ENTRY_DELAY_MS, withTiming(1, { duration: 180 }));
    scale.value = withDelay(
      STREAK_ENTRY_DELAY_MS,
      withSequence(
        withTiming(1.18, { duration: STREAK_STEP_MS, easing: Easing.out(Easing.cubic) }),
        withTiming(0.93, { duration: STREAK_STEP_MS * 0.6, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: STREAK_STEP_MS * 0.6, easing: Easing.out(Easing.ease) }),
      ),
    );
  }, [opacity, scale]);

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.badge, animated]}>
      <Text style={styles.badgeEmoji}>🔥</Text>
      <Text style={styles.badgeCount}>{streak}</Text>
      <Text style={styles.badgeLabel}>STREAK</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    gap: 2,
    flex: 1,
  },
  date: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: colors.sub,
  },
  greeting: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 24,
    color: colors.ink,
  },
  badge: {
    backgroundColor: colors.streakBg,
    borderColor: colors.streakBorder,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 22,
  },
  badgeCount: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16,
    color: colors.streakText,
    lineHeight: 18,
  },
  badgeLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    letterSpacing: 1,
    color: colors.streakText,
    marginTop: 2,
  },
});
