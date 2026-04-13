import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonoText } from '../../components/primitives/MonoText';
import { Timeline, type TimelineSession } from '../../components/primitives/Timeline';
import { UIText } from '../../components/primitives/UIText';
import { useTimer } from '../../hooks/useTimer';
import { useStore } from '../../store';
import { colors, type ColorToken } from '../../tokens/colors';
import { relativeLuminance } from '../../utils/color';
import { isPresetProjectColor, type Project } from '../../types';

const TAKEOVER_MS = 400;
const BREATHE_SCALE = 1.013;
const BREATHE_MS = 1500;
const MILESTONE_SECONDS = [3600, 7200] as const;
const DEEP_WORK_SECONDS = 90 * 60;
const PULSE_UP = 1.09;
const PULSE_DOWN = 0.96;
const INK_LUMINANCE = relativeLuminance(colors.ink);
const WHITE_LUMINANCE = 1;

const contrastRatio = (a: number, b: number): number =>
  (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

type Tone = 'light' | 'dark';

type Palette = {
  tone: Tone;
  foregroundToken: ColorToken;
  tint10: string;
  tint22: string;
  tint35: string;
  tint60: string;
  stopBg: string;
  stopTextColor: string;
  statusBarStyle: 'light' | 'dark';
};

const lightPalette = (projectDark: string): Palette => ({
  tone: 'light',
  foregroundToken: 'white',
  tint10: 'rgba(255,255,255,0.10)',
  tint22: 'rgba(255,255,255,0.22)',
  tint35: 'rgba(255,255,255,0.35)',
  tint60: 'rgba(255,255,255,0.60)',
  stopBg: colors.white,
  stopTextColor: projectDark,
  statusBarStyle: 'light',
});

const darkPalette: Palette = {
  tone: 'dark',
  foregroundToken: 'ink',
  tint10: 'rgba(0,0,0,0.08)',
  tint22: 'rgba(0,0,0,0.22)',
  tint35: 'rgba(0,0,0,0.35)',
  tint60: 'rgba(0,0,0,0.55)',
  stopBg: colors.ink,
  stopTextColor: colors.white,
  statusBarStyle: 'dark',
};

const paletteFor = (bgHex: string, projectDark: string): Palette => {
  const bgL = relativeLuminance(bgHex);
  const inkContrast = contrastRatio(bgL, INK_LUMINANCE);
  const whiteContrast = contrastRatio(bgL, WHITE_LUMINANCE);
  return inkContrast > whiteContrast ? darkPalette : lightPalette(projectDark);
};

const pad = (n: number): string => n.toString().padStart(2, '0');

const formatElapsed = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const getProjectDarkHex = (project: Project): string => {
  if (project.color === 'custom') {
    return project.customColorDark ?? colors.brandDark;
  }
  const token = `${project.color}Dark` as ColorToken;
  return colors[token];
};

const todayIso = (d: Date): string => d.toISOString().slice(0, 10);

const MINI_TIMELINE_DEFAULT_START_MINUTE = 9 * 60;
const MINI_TIMELINE_DEFAULT_END_MINUTE = 18 * 60;
const MINI_TIMELINE_TRAILING_BUFFER = 15;

const minuteOfDay = (d: Date): number => d.getHours() * 60 + d.getMinutes();

export const LiveTimerScreen = ({ project }: { project: Project }) => {
  const { elapsedSeconds, isPaused } = useTimer();
  const activeSession = useStore((s) =>
    s.activeSessionId ? (s.sessions.find((x) => x.id === s.activeSessionId) ?? null) : null,
  );
  const priorSecondsToday = useStore((s) => {
    const today = todayIso(new Date());
    return s.sessions
      .filter(
        (x) =>
          x.projectId === project.id && x.endedAt !== null && todayIso(new Date(x.startedAt)) === today,
      )
      .reduce((sum, x) => sum + (x.durationSeconds ?? x.durationMinutes * 60), 0);
  });
  const allProjects = useStore((s) => s.projects);
  const allSessions = useStore((s) => s.sessions);
  const pauseSession = useStore((s) => s.pauseSession);
  const resumeSession = useStore((s) => s.resumeSession);
  const stopSession = useStore((s) => s.stopSession);
  const updateActiveSessionNote = useStore((s) => s.updateActiveSessionNote);

  const miniTimeline = useMemo(() => {
    const now = new Date();
    const today = todayIso(now);
    const nowMinute = minuteOfDay(now);
    const todaySessions = allSessions.filter((x) => todayIso(new Date(x.startedAt)) === today);
    const startMinutes = todaySessions.map((x) => minuteOfDay(new Date(x.startedAt)));
    const endMinutes = todaySessions.map((x) => {
      const mins = (x.durationSeconds ?? x.durationMinutes * 60) / 60;
      return minuteOfDay(new Date(x.startedAt)) + mins;
    });
    const windowStart = Math.min(MINI_TIMELINE_DEFAULT_START_MINUTE, ...startMinutes);
    const windowEnd = Math.max(
      MINI_TIMELINE_DEFAULT_END_MINUTE,
      nowMinute + MINI_TIMELINE_TRAILING_BUFFER,
      ...endMinutes,
    );
    const windowMinutes = Math.max(60, windowEnd - windowStart);

    const sessions: TimelineSession[] = todaySessions
      .map((x): TimelineSession | null => {
        const p = allProjects.find((pp) => pp.id === x.projectId);
        if (!p) return null;
        const color = isPresetProjectColor(p.color) ? p.color : 'violet';
        const startMinute = minuteOfDay(new Date(x.startedAt));
        const durationMinutes = (x.durationSeconds ?? x.durationMinutes * 60) / 60;
        return {
          startMinuteOffset: Math.max(0, startMinute - windowStart),
          durationMinutes,
          color,
          label: p.name,
          isLive: x.endedAt === null,
        };
      })
      .filter((x): x is TimelineSession => x !== null);

    return { sessions, windowMinutes };
  }, [allSessions, allProjects]);

  const projectDark = getProjectDarkHex(project);
  const palette = paletteFor(projectDark, projectDark);

  const takeover = useSharedValue(0);
  const breathe = useSharedValue(1);
  const pulse = useSharedValue(1);
  const firedMilestones = useRef<Set<number>>(new Set());

  useEffect(() => {
    takeover.value = withTiming(1, { duration: TAKEOVER_MS, easing: Easing.out(Easing.cubic) });
  }, [takeover]);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(BREATHE_SCALE, { duration: BREATHE_MS, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: BREATHE_MS, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [breathe]);

  useEffect(() => {
    for (const threshold of MILESTONE_SECONDS) {
      if (elapsedSeconds >= threshold && !firedMilestones.current.has(threshold)) {
        firedMilestones.current.add(threshold);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        pulse.value = withSequence(
          withTiming(PULSE_UP, { duration: 200 }),
          withTiming(PULSE_DOWN, { duration: 150 }),
          withTiming(1, { duration: 300 }),
        );
      }
    }
  }, [elapsedSeconds, pulse]);

  const isDeepWork = elapsedSeconds >= DEEP_WORK_SECONDS;

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(takeover.value, [0, 1], [colors.bg, projectDark]),
  }));

  const timerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value * pulse.value }],
  }));

  const handlePauseResume = () => {
    if (isPaused) resumeSession();
    else pauseSession();
  };

  const handleStop = () => {
    stopSession();
    router.replace('/(tabs)');
  };

  return (
    <Animated.View style={[styles.root, bgStyle]}>
      <StatusBar style={palette.statusBarStyle} animated />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            {isDeepWork ? (
              <View style={[styles.deepBadge, { backgroundColor: palette.tint10, borderColor: palette.tint22 }]}>
                <UIText variant="micro" color={palette.foregroundToken} style={styles.projectLabel}>
                  🔥 DEEP WORK
                </UIText>
              </View>
            ) : (
              <UIText variant="micro" color={palette.foregroundToken} style={styles.projectLabel}>
                TRACKING {project.name.toUpperCase()}
              </UIText>
            )}
          </View>

          <Animated.View style={[styles.timerBlock, timerStyle]}>
            <MonoText size="xl" color={palette.foregroundToken}>
              {formatElapsed(priorSecondsToday + elapsedSeconds)}
            </MonoText>
            <UIText
              variant="caption"
              style={[
                styles.pausedLabel,
                { opacity: isPaused ? 1 : 0, color: palette.tint60 },
              ]}
            >
              Paused
            </UIText>
          </Animated.View>

          <TextInput
            value={activeSession?.note ?? ''}
            onChangeText={updateActiveSessionNote}
            placeholder="describe your task…"
            placeholderTextColor={palette.tint35}
            accessibilityLabel="Session note"
            style={[
              styles.noteInput,
              {
                backgroundColor: palette.tint10,
                borderColor: palette.tint22,
                color: palette.tone === 'light' ? colors.white : colors.ink,
              },
            ]}
          />

          <Timeline
            sessions={miniTimeline.sessions}
            windowMinutes={miniTimeline.windowMinutes}
            onDarkBg={palette.tone === 'light'}
            style={styles.miniTimeline}
            accessibilityLabel="Today's timeline"
          />

          <View style={styles.controls}>
          <Pressable
            onPress={handlePauseResume}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? 'Resume' : 'Pause'}
            style={[
              styles.pauseButton,
              { backgroundColor: palette.tint10, borderColor: palette.tint22 },
            ]}
          >
            <UIText
              variant="bodyLg"
              color={palette.foregroundToken}
              style={styles.pauseGlyph}
            >
              {isPaused ? '▶' : '⏸'}
            </UIText>
          </Pressable>

          <Pressable
            onPress={handleStop}
            accessibilityRole="button"
            accessibilityLabel="Stop & save"
            style={[styles.stopButton, { backgroundColor: palette.stopBg }]}
          >
            <UIText variant="bodyLg" style={{ color: palette.stopTextColor }}>
              Stop & save
            </UIText>
          </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 22,
  },
  header: {
    paddingTop: 12,
    alignItems: 'center',
  },
  projectLabel: {
    opacity: 0.7,
    letterSpacing: 1.2,
  },
  deepBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  timerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  pausedLabel: {
    letterSpacing: 0.5,
  },
  noteInput: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 15,
    marginBottom: 12,
  },
  miniTimeline: {
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
  },
  pauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseGlyph: {
    fontSize: 24,
  },
  stopButton: {
    flex: 1,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
