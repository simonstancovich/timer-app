import { useEffect, useMemo, useState } from 'react';
import {
  View,
  type LayoutChangeEvent,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, type ColorToken } from '../../tokens/colors';

type ProjectColor =
  | 'violet'
  | 'ocean'
  | 'ember'
  | 'forest'
  | 'rose'
  | 'amber'
  | 'teal';

export type TimelineSession = {
  startMinuteOffset: number;
  durationMinutes: number;
  color: ProjectColor;
  label: string;
  isLive?: boolean;
};

type TimelineProps = Omit<ViewProps, 'children'> & {
  sessions: TimelineSession[];
  windowMinutes?: number;
  onDarkBg?: boolean;
};

const DARK_BG_BLOCK_TINT = 'rgba(255,255,255,0.35)';
const DARK_BG_STRIPE_TINT = 'rgba(255,255,255,0.55)';
const DARK_BG_TRACK_TINT = 'rgba(255,255,255,0.12)';

const BLOCK_HEIGHT = 24;
const BLOCK_RADIUS = 5;
const STRIPE_HEIGHT = 3;
const TRACK_HEIGHT = 2;
const MIN_BLOCK_WIDTH = 4;
const LIVE_DOT_SIZE = 10;
const PULSE_DURATION = 1200;
const PULSE_MIN_OPACITY = 0.4;

const projectColorToDark = {
  violet: 'violetDark',
  ocean: 'oceanDark',
  ember: 'emberDark',
  forest: 'forestDark',
  rose: 'roseDark',
  amber: 'amberDark',
  teal: 'tealDark',
} satisfies Record<ProjectColor, ColorToken>;

type BlockLayout = {
  session: TimelineSession;
  left: number;
  width: number;
};

export const Timeline = ({
  sessions,
  windowMinutes = 540,
  onDarkBg = false,
  style,
  ...rest
}: TimelineProps) => {
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const layouts = useMemo<BlockLayout[]>(() => {
    if (containerWidth <= 0) return [];
    return sessions.map((session) => ({
      session,
      left: (session.startMinuteOffset / windowMinutes) * containerWidth,
      width: Math.max(
        MIN_BLOCK_WIDTH,
        (session.durationMinutes / windowMinutes) * containerWidth,
      ),
    }));
  }, [sessions, windowMinutes, containerWidth]);

  const trackBg = onDarkBg ? DARK_BG_TRACK_TINT : colors.surf;

  return (
    <View {...rest} onLayout={handleLayout} style={[containerStyle, style]}>
      <View style={[trackStyle, { backgroundColor: trackBg }]} />
      {layouts.map((layout, i) => (
        <SessionBlock key={i} layout={layout} onDarkBg={onDarkBg} />
      ))}
      {layouts.map((layout, i) =>
        layout.session.isLive ? <LiveDot key={`dot-${i}`} layout={layout} /> : null,
      )}
    </View>
  );
};

const SessionBlock = ({
  layout,
  onDarkBg,
}: {
  layout: BlockLayout;
  onDarkBg: boolean;
}) => {
  const { session, left, width } = layout;
  const bg = onDarkBg ? DARK_BG_BLOCK_TINT : colors[session.color];
  const stripe = onDarkBg
    ? DARK_BG_STRIPE_TINT
    : colors[projectColorToDark[session.color]];
  return (
    <View
      accessibilityLabel={session.label}
      style={{
        position: 'absolute',
        left,
        top: 0,
        width,
        height: BLOCK_HEIGHT,
        borderRadius: BLOCK_RADIUS,
        backgroundColor: bg,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          height: STRIPE_HEIGHT,
          backgroundColor: stripe,
        }}
      />
    </View>
  );
};

const LiveDot = ({ layout }: { layout: BlockLayout }) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(PULSE_MIN_OPACITY, {
        duration: PULSE_DURATION,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const dotLeft = layout.left + layout.width - LIVE_DOT_SIZE / 2;
  const dotTop = (BLOCK_HEIGHT - LIVE_DOT_SIZE) / 2;

  return (
    <Animated.View
      accessibilityLabel="Live session"
      style={[
        {
          position: 'absolute',
          left: dotLeft,
          top: dotTop,
          width: LIVE_DOT_SIZE,
          height: LIVE_DOT_SIZE,
          borderRadius: LIVE_DOT_SIZE / 2,
          backgroundColor: colors.forest,
        },
        animatedStyle,
      ]}
    />
  );
};

const containerStyle = {
  height: BLOCK_HEIGHT,
  justifyContent: 'center',
} satisfies ViewStyle;

const trackStyle = {
  height: TRACK_HEIGHT,
  borderRadius: TRACK_HEIGHT / 2,
} satisfies ViewStyle;
