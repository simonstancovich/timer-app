import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GradientText } from '../../src/components/primitives/GradientText';
import { colors, gradients } from '../../src/tokens/colors';

const EMOJI_HALF_BREATH_MS = 1250;
const EMOJI_SCALE_UP = 1.14;

const CHAR_STAGGER_MS = 42;
const CHAR_FADE_MS = 320;
const CHAR_RISE_MS = 460;
const CHAR_TRANSLATE_FROM = 16;
const CHAR_BACK_EASE = Easing.bezier(0.34, 1.56, 0.64, 1);

const TITLE1_TEXT = 'Track time.';
const TITLE2_TEXT = 'Actually enjoy it.';
const TITLE1_BASE_DELAY_MS = 0;
const TITLE2_BASE_DELAY_MS = 360;

const lastCharEndMs = (text: string, base: number) =>
  base + (text.length - 1) * CHAR_STAGGER_MS + Math.max(CHAR_FADE_MS, CHAR_RISE_MS);

const TITLE2_END_MS = lastCharEndMs(TITLE2_TEXT, TITLE2_BASE_DELAY_MS);

const SUBTITLE_DELAY_MS = TITLE2_END_MS + 80;
const SUBTITLE_DURATION_MS = 500;
const SUBTITLE_TRANSLATE_FROM = 16;

const BUTTON_DELAY_MS = SUBTITLE_DELAY_MS + 250;
const BUTTON_POP_UP_MS = 360;
const BUTTON_POP_SETTLE_MS = 240;
const BUTTON_POP_SCALE = 1.08;
const BUTTON_OPACITY_DURATION_MS = 600;
const BUTTON_END_MS = BUTTON_DELAY_MS + BUTTON_POP_UP_MS + BUTTON_POP_SETTLE_MS;

const HOLD_BEFORE_POP_MS = 500;
const GRADIENT_DELAY_MS = BUTTON_END_MS + HOLD_BEFORE_POP_MS;

const COLOR_CASCADE_STAGGER_MS = 38;
const COLOR_FILL_DURATION_MS = 360;
const LETTER_PUNCH_SCALE = 1.18;
const LETTER_PUNCH_UP_MS = 170;
const LETTER_PUNCH_SETTLE_MS = 240;
const TITLE2_BLACK_FADE_MS = 220;
const TITLE2_GRADIENT_FADE_MS = 360;
const TITLE2_GRADIENT_PUNCH_SCALE = 1.12;
const BUTTON_GRADIENT_DURATION_MS = 320;
const BUTTON_PUNCH_SCALE = 1.06;
const BUTTON_PUNCH_UP_MS = 180;
const BUTTON_PUNCH_SETTLE_MS = 280;
const BG_COLOR_DURATION_MS = 600;
const BG_WASH_DURATION_MS = 600;
const BG_WASH_TARGET_OPACITY = 0.35;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type StaggerCharProps = {
  char: string;
  delay: number;
  style: StyleProp<TextStyle>;
  colorDelay?: number;
  fromColor?: string;
  toColor?: string;
};

const StaggerChar = ({
  char,
  delay,
  style,
  colorDelay,
  fromColor,
  toColor,
}: StaggerCharProps) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(CHAR_TRANSLATE_FROM);
  const colorProgress = useSharedValue(0);
  const punchScale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: CHAR_FADE_MS, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: CHAR_RISE_MS, easing: CHAR_BACK_EASE }),
    );
    if (colorDelay !== undefined && fromColor && toColor) {
      colorProgress.value = withDelay(
        colorDelay,
        withTiming(1, { duration: COLOR_FILL_DURATION_MS, easing: Easing.out(Easing.cubic) }),
      );
      punchScale.value = withDelay(
        colorDelay,
        withSequence(
          withTiming(LETTER_PUNCH_SCALE, {
            duration: LETTER_PUNCH_UP_MS,
            easing: CHAR_BACK_EASE,
          }),
          withTiming(1, {
            duration: LETTER_PUNCH_SETTLE_MS,
            easing: Easing.out(Easing.cubic),
          }),
        ),
      );
    }
  }, [delay, colorDelay, opacity, translateY, colorProgress, punchScale, fromColor, toColor]);

  const animatedStyle = useAnimatedStyle(() => {
    if (fromColor && toColor) {
      return {
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }, { scale: punchScale.value }],
        color: interpolateColor(colorProgress.value, [0, 1], [fromColor, toColor]),
      };
    }
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }, { scale: punchScale.value }],
    };
  });

  const display = char === ' ' ? '\u00A0' : char;
  return <Animated.Text style={[style, animatedStyle]}>{display}</Animated.Text>;
};

type StaggerTextProps = {
  text: string;
  baseDelay?: number;
  style: StyleProp<TextStyle>;
  colorBaseDelay?: number;
  fromColor?: string;
  toColor?: string;
};

const StaggerText = ({
  text,
  baseDelay = 0,
  style,
  colorBaseDelay,
  fromColor,
  toColor,
}: StaggerTextProps) => {
  return (
    <View style={staggerRowStyle}>
      {text.split('').map((c, i) => (
        <StaggerChar
          key={`${i}-${c}`}
          char={c}
          delay={baseDelay + i * CHAR_STAGGER_MS}
          style={style}
          colorDelay={
            colorBaseDelay !== undefined ? colorBaseDelay + i * COLOR_CASCADE_STAGGER_MS : undefined
          }
          fromColor={fromColor}
          toColor={toColor}
        />
      ))}
    </View>
  );
};

const WelcomeScreen = () => {
  const router = useRouter();

  const emojiScale = useSharedValue(1);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(SUBTITLE_TRANSLATE_FROM);
  const buttonScale = useSharedValue(0.7);
  const buttonOpacity = useSharedValue(0);
  const title2BlackOpacity = useSharedValue(1);
  const title2GradientOpacity = useSharedValue(0);
  const title2GradientScale = useSharedValue(0.92);
  const buttonGradientOpacity = useSharedValue(0);
  const buttonPunchScale = useSharedValue(1);
  const bgColorProgress = useSharedValue(0);
  const bgWashOpacity = useSharedValue(0);

  useEffect(() => {
    emojiScale.value = withRepeat(
      withSequence(
        withTiming(EMOJI_SCALE_UP, {
          duration: EMOJI_HALF_BREATH_MS,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: EMOJI_HALF_BREATH_MS,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );
    subtitleOpacity.value = withDelay(
      SUBTITLE_DELAY_MS,
      withTiming(1, { duration: SUBTITLE_DURATION_MS, easing: Easing.out(Easing.ease) }),
    );
    subtitleTranslateY.value = withDelay(
      SUBTITLE_DELAY_MS,
      withTiming(0, { duration: SUBTITLE_DURATION_MS, easing: Easing.out(Easing.ease) }),
    );
    buttonScale.value = withDelay(
      BUTTON_DELAY_MS,
      withSequence(
        withTiming(BUTTON_POP_SCALE, {
          duration: BUTTON_POP_UP_MS,
          easing: CHAR_BACK_EASE,
        }),
        withTiming(1, { duration: BUTTON_POP_SETTLE_MS, easing: Easing.out(Easing.ease) }),
      ),
    );
    buttonOpacity.value = withDelay(
      BUTTON_DELAY_MS,
      withTiming(1, { duration: BUTTON_OPACITY_DURATION_MS, easing: Easing.out(Easing.ease) }),
    );
    title2GradientOpacity.value = withDelay(
      GRADIENT_DELAY_MS,
      withTiming(1, { duration: TITLE2_GRADIENT_FADE_MS, easing: Easing.out(Easing.cubic) }),
    );
    title2GradientScale.value = withDelay(
      GRADIENT_DELAY_MS,
      withSequence(
        withTiming(TITLE2_GRADIENT_PUNCH_SCALE, {
          duration: LETTER_PUNCH_UP_MS,
          easing: CHAR_BACK_EASE,
        }),
        withTiming(1, {
          duration: LETTER_PUNCH_SETTLE_MS,
          easing: Easing.out(Easing.cubic),
        }),
      ),
    );
    title2BlackOpacity.value = withDelay(
      GRADIENT_DELAY_MS,
      withTiming(0, { duration: TITLE2_BLACK_FADE_MS, easing: Easing.out(Easing.cubic) }),
    );
    buttonGradientOpacity.value = withDelay(
      GRADIENT_DELAY_MS,
      withTiming(1, { duration: BUTTON_GRADIENT_DURATION_MS, easing: Easing.out(Easing.cubic) }),
    );
    buttonPunchScale.value = withDelay(
      GRADIENT_DELAY_MS,
      withSequence(
        withTiming(BUTTON_PUNCH_SCALE, {
          duration: BUTTON_PUNCH_UP_MS,
          easing: CHAR_BACK_EASE,
        }),
        withTiming(1, {
          duration: BUTTON_PUNCH_SETTLE_MS,
          easing: Easing.out(Easing.cubic),
        }),
      ),
    );
    bgColorProgress.value = withDelay(
      GRADIENT_DELAY_MS,
      withTiming(1, { duration: BG_COLOR_DURATION_MS, easing: Easing.inOut(Easing.ease) }),
    );
    bgWashOpacity.value = withDelay(
      GRADIENT_DELAY_MS,
      withTiming(BG_WASH_TARGET_OPACITY, {
        duration: BG_WASH_DURATION_MS,
        easing: Easing.inOut(Easing.ease),
      }),
    );
  }, [
    emojiScale,
    subtitleOpacity,
    subtitleTranslateY,
    buttonScale,
    buttonOpacity,
    title2BlackOpacity,
    title2GradientOpacity,
    title2GradientScale,
    buttonGradientOpacity,
    buttonPunchScale,
    bgColorProgress,
    bgWashOpacity,
  ]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
    color: interpolateColor(bgColorProgress.value, [0, 1], [colors.sub, colors.ink]),
  }));
  const captionStyle = useAnimatedStyle(() => ({
    color: interpolateColor(bgColorProgress.value, [0, 1], [colors.muted, colors.ink]),
  }));
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonScale.value * buttonPunchScale.value }],
  }));
  const title2BlackAnimatedStyle = useAnimatedStyle(() => ({
    opacity: title2BlackOpacity.value,
  }));
  const title2GradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: title2GradientOpacity.value,
    transform: [{ scale: title2GradientScale.value }],
  }));
  const buttonGradientAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonGradientOpacity.value,
  }));
  const rootAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      bgColorProgress.value,
      [0, 1],
      [colors.bg, colors.brandLight],
    ),
  }));
  const bgWashAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bgWashOpacity.value,
  }));

  const handleStart = () => {
    router.push('/onboarding/setup' as Href);
  };

  return (
    <Animated.View style={[styles.root, rootAnimatedStyle]}>
      <Animated.View
        style={[StyleSheet.absoluteFillObject, bgWashAnimatedStyle]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={gradients.celebration}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <View style={styles.hero}>
        <Animated.Text style={[styles.emoji, emojiStyle]}>⏱</Animated.Text>

        <StaggerText
          text={TITLE1_TEXT}
          baseDelay={TITLE1_BASE_DELAY_MS}
          style={styles.title}
          colorBaseDelay={GRADIENT_DELAY_MS}
          fromColor={colors.ink}
          toColor={colors.brand}
        />

        <View style={styles.title2Stack}>
          <Animated.View style={title2BlackAnimatedStyle}>
            <StaggerText
              text={TITLE2_TEXT}
              baseDelay={TITLE2_BASE_DELAY_MS}
              style={styles.title}
            />
          </Animated.View>
          <Animated.View
            style={[StyleSheet.absoluteFillObject, styles.title2GradientLayer, title2GradientAnimatedStyle]}
            pointerEvents="none"
          >
            <GradientText
              gradient="celebration"
              variant="display"
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.title}
            >
              {TITLE2_TEXT}
            </GradientText>
          </Animated.View>
        </View>

        <Animated.Text style={[styles.subtitle, subtitleStyle]}>
          A calmer way to track your time.{'\n'}Start a session in one tap.
        </Animated.Text>
      </View>

      <View style={styles.footer}>
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Get started"
          onPress={handleStart}
          style={[styles.button, buttonAnimatedStyle]}
        >
          <View style={styles.buttonInk} />
          <Animated.View style={[StyleSheet.absoluteFillObject, buttonGradientAnimatedStyle]}>
            <LinearGradient
              colors={gradients.celebration}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Text style={styles.buttonText}>Get started →</Text>
        </AnimatedPressable>
        <Animated.Text style={[styles.caption, captionStyle]}>
          Free to use · No signup · Start in 10 sec
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

const BUTTON_WIDTH = 286;
const BUTTON_HEIGHT = 58;
const BUTTON_RADIUS = 29;

const staggerRowStyle: ViewStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 48,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 72,
    lineHeight: 84,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    textAlign: 'center',
    color: colors.ink,
  },
  title2Stack: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title2GradientLayer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14,
    lineHeight: 24.5,
    color: colors.sub,
    textAlign: 'center',
    marginTop: 20,
  },
  footer: {
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInk: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
  },
  buttonText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: colors.white,
  },
  caption: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
});

export default WelcomeScreen;
