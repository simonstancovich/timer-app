import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';
import { UIText } from '../../components/primitives/UIText';
import {
  selectProjectTasks,
  selectTemplateTasks,
  useStore,
} from '../../store';
import type { Task } from '../../types';

type Tone = 'light' | 'dark';

type TaskBubblesProps = {
  projectId: string;
  activeTaskId: string | null;
  tone: Tone;
  onSelectTask: (task: Task) => void;
};

export const TaskBubbles = ({
  projectId,
  activeTaskId,
  tone,
  onSelectTask,
}: TaskBubblesProps) => {
  const projectTasks = useStore(useShallow((s) => selectProjectTasks(s, projectId)));
  const templateTasks = useStore(useShallow((s) => selectTemplateTasks(s)));
  const renameTask = useStore((s) => s.renameTask);

  const ranked = useMemo(() => {
    const projectNames = new Set(
      projectTasks.map((p) => p.name.trim().toLowerCase()),
    );
    const templatesToShow = templateTasks.filter(
      (t) => !projectNames.has(t.name.trim().toLowerCase()),
    );
    return [...projectTasks, ...templatesToShow];
  }, [projectTasks, templateTasks]);

  const idOrderRef = useRef<string[]>([]);
  const orderedTasks = useMemo(() => {
    const byId = new Map(ranked.map((t) => [t.id, t]));
    const kept = idOrderRef.current.filter((id) => byId.has(id));
    const newIds = ranked.map((t) => t.id).filter((id) => !idOrderRef.current.includes(id));
    idOrderRef.current = [...kept, ...newIds];
    return idOrderRef.current
      .map((id) => byId.get(id))
      .filter((t): t is Task => t !== undefined)
      .slice(0, MAX_BUBBLES);
  }, [ranked]);

  return (
    <View style={styles.row}>
      {orderedTasks.map((task) => (
        <TaskBubble
          key={task.id}
          task={task}
          tone={tone}
          isActive={task.id === activeTaskId}
          onPress={() => onSelectTask(task)}
          onRename={task.isTemplate ? (name) => renameTask(task.id, name) : undefined}
        />
      ))}
    </View>
  );
};

const MAX_BUBBLES = 20;

type TaskBubbleProps = {
  task: Task;
  tone: Tone;
  isActive: boolean;
  onPress: () => void;
  onRename?: (name: string) => void;
};

const LIGHT_TONE_BG = 'rgba(255,255,255,0.12)';
const LIGHT_TONE_BORDER = 'rgba(255,255,255,0.16)';
const LIGHT_TONE_ACTIVE_BG = 'rgba(255,255,255,0.24)';
const LIGHT_TONE_ACTIVE_BORDER = 'rgba(255,255,255,0.42)';
const LIGHT_TONE_TEXT = 'rgba(255,255,255,0.65)';
const LIGHT_TONE_ACTIVE_TEXT = 'rgba(255,255,255,0.95)';
const LIGHT_TONE_DROPLET = 'rgba(255,255,255,0.95)';

const DARK_TONE_BG = 'rgba(0,0,0,0.06)';
const DARK_TONE_BORDER = 'rgba(0,0,0,0.12)';
const DARK_TONE_ACTIVE_BG = 'rgba(0,0,0,0.14)';
const DARK_TONE_ACTIVE_BORDER = 'rgba(0,0,0,0.35)';
const DARK_TONE_TEXT = 'rgba(0,0,0,0.55)';
const DARK_TONE_ACTIVE_TEXT = 'rgba(0,0,0,0.9)';
const DARK_TONE_DROPLET = 'rgba(0,0,0,0.85)';

const POP_SHRINK = 0.8;
const POP_BURST = 1.35;
const POP_ROTATION = 6;
const EDIT_SCALE = 1.14;
const EDIT_SHAKE = 14;
const LONG_PRESS_MS = 220;
const PRESS_IN_SCALE = 0.94;
const NUM_DROPLETS = 10;
const DROPLET_MIN_DISTANCE = 36;
const DROPLET_MAX_DISTANCE = 70;
const DROPLET_MIN_SIZE = 3;
const DROPLET_MAX_SIZE = 6;
const BURST_DURATION_MS = 480;

type DropletConfig = {
  angle: number;
  distance: number;
  size: number;
  delay: number;
};

const makeDroplets = (seed: string): DropletConfig[] => {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const rand = () => {
    h = (h * 1103515245 + 12345) | 0;
    return ((h >>> 0) % 1000) / 1000;
  };
  return Array.from({ length: NUM_DROPLETS }).map((_, i) => {
    const baseAngle = (i / NUM_DROPLETS) * Math.PI * 2;
    const jitter = (rand() - 0.5) * 0.6;
    return {
      angle: baseAngle + jitter,
      distance: DROPLET_MIN_DISTANCE + rand() * (DROPLET_MAX_DISTANCE - DROPLET_MIN_DISTANCE),
      size: DROPLET_MIN_SIZE + rand() * (DROPLET_MAX_SIZE - DROPLET_MIN_SIZE),
      delay: rand() * 0.15,
    };
  });
};

const TaskBubble = ({ task, tone, isActive, onPress, onRename }: TaskBubbleProps) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const burst = useSharedValue(0);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(task.name);
  const inputRef = useRef<TextInput>(null);
  const editingRef = useRef(false);
  const longPressedRef = useRef(false);
  const triggerHandledRef = useRef(false);

  const droplets = useMemo(() => makeDroplets(task.id), [task.id]);

  useEffect(() => {
    if (!isEditing) setDraftName(task.name);
  }, [task.name, isEditing]);

  useEffect(() => {
    if (isEditing) {
      const id = setTimeout(() => inputRef.current?.focus(), 140);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [isEditing]);


  const triggerBurst = () => {
    burst.value = 0;
    burst.value = withTiming(1, {
      duration: BURST_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressIn = () => {
    triggerHandledRef.current = false;
    if (editingRef.current) return;
    scale.value = withTiming(PRESS_IN_SCALE, { duration: 90 });
  };

  const handlePressOut = () => {
    if (triggerHandledRef.current || editingRef.current) return;
    scale.value = withSpring(1, { damping: 9, stiffness: 240 });
  };

  const handlePress = () => {
    if (editingRef.current || longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    triggerHandledRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    triggerBurst();
    scale.value = withSequence(
      withTiming(POP_SHRINK, { duration: 55, easing: Easing.in(Easing.quad) }),
      withTiming(POP_BURST, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(0.6, { duration: 1 }),
      withSpring(1, { damping: 9, stiffness: 220, mass: 0.7 }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 55 }),
      withTiming(0, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 80 }),
      withTiming(1, { duration: 160, easing: Easing.in(Easing.quad) }),
    );
    rotation.value = withSequence(
      withTiming(-POP_ROTATION, { duration: 55 }),
      withTiming(POP_ROTATION, { duration: 55 }),
      withTiming(0, { duration: 70 }),
    );
    onPress();
  };

  const burstThenEdit = () => {
    triggerBurst();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    scale.value = withSequence(
      withTiming(POP_SHRINK, { duration: 55, easing: Easing.in(Easing.quad) }),
      withTiming(POP_BURST, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(0.6, { duration: 1 }),
      withSpring(EDIT_SCALE, { damping: 9, stiffness: 220, mass: 0.7 }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 55 }),
      withTiming(0, { duration: 90, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 80 }),
      withTiming(1, { duration: 160, easing: Easing.in(Easing.quad) }),
    );
    setIsEditing(true);
  };

  const handleLongPress = useCallback(() => {
    if (!onRename || editingRef.current) return;
    longPressedRef.current = true;
    editingRef.current = true;
    triggerHandledRef.current = true;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    scale.value = 1;
    rotation.value = 0;

    scale.value = withSequence(
      withTiming(1.18, { duration: 140, easing: Easing.out(Easing.back(3)) }),
      withTiming(1.08, { duration: 360 }),
    );

    rotation.value = withSequence(
      withTiming(-EDIT_SHAKE, { duration: 55 }),
      withTiming(EDIT_SHAKE, { duration: 55 }),
      withTiming(-EDIT_SHAKE * 0.85, { duration: 55 }),
      withTiming(EDIT_SHAKE * 0.85, { duration: 55 }),
      withTiming(-EDIT_SHAKE * 0.55, { duration: 55 }),
      withTiming(EDIT_SHAKE * 0.55, { duration: 55 }),
      withTiming(0, { duration: 70 }, (finished) => {
        if (finished) runOnJS(burstThenEdit)();
      }),
    );
  }, [onRename]);

  const commitEdit = () => {
    if (!onRename) return;
    const trimmed = draftName.trim();
    if (trimmed.length > 0 && trimmed !== task.name) onRename(trimmed);
    editingRef.current = false;
    setIsEditing(false);
    scale.value = withSpring(1, { damping: 10, stiffness: 240 });
  };

  const gesture = useMemo(() => {
    const base = Gesture.LongPress()
      .minDuration(LONG_PRESS_MS)
      .withTestId(`longpress-${task.id}`);
    if (!onRename) return base.enabled(false);
    return base.onStart(() => {
      runOnJS(handleLongPress)();
    });
  }, [onRename, handleLongPress, task.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotateZ: `${rotation.value}deg` }],
  }));

  const bg = isActive
    ? tone === 'light'
      ? LIGHT_TONE_ACTIVE_BG
      : DARK_TONE_ACTIVE_BG
    : tone === 'light'
      ? LIGHT_TONE_BG
      : DARK_TONE_BG;

  const border = isActive
    ? tone === 'light'
      ? LIGHT_TONE_ACTIVE_BORDER
      : DARK_TONE_ACTIVE_BORDER
    : tone === 'light'
      ? LIGHT_TONE_BORDER
      : DARK_TONE_BORDER;

  const textColor = isActive
    ? tone === 'light'
      ? LIGHT_TONE_ACTIVE_TEXT
      : DARK_TONE_ACTIVE_TEXT
    : tone === 'light'
      ? LIGHT_TONE_TEXT
      : DARK_TONE_TEXT;

  const dropletColor = tone === 'light' ? LIGHT_TONE_DROPLET : DARK_TONE_DROPLET;

  return (
    <View style={styles.bubbleWrap} pointerEvents="box-none">
      <GestureDetector gesture={gesture}>
        <Animated.View style={animatedStyle}>
          <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityRole="button"
            accessibilityLabel={task.name}
            accessibilityState={{ selected: isActive }}
            testID={`bubble-${task.id}`}
          >
            <View style={[styles.bubble, { backgroundColor: bg, borderColor: border }]}>
              {isEditing ? (
                <TextInput
                  ref={inputRef}
                  value={draftName}
                  onChangeText={setDraftName}
                  onSubmitEditing={commitEdit}
                  onBlur={commitEdit}
                  returnKeyType="done"
                  selectTextOnFocus
                  accessibilityLabel={`Edit ${task.name}`}
                  style={[styles.bubbleText, styles.bubbleInput, { color: textColor }]}
                />
              ) : (
                <UIText variant="micro" style={[styles.bubbleText, { color: textColor }]}>
                  {task.name}
                </UIText>
              )}
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
      <View style={styles.burstLayer} pointerEvents="none">
        {droplets.map((d, i) => (
          <BurstDroplet key={i} progress={burst} config={d} color={dropletColor} />
        ))}
      </View>
    </View>
  );
};

type BurstDropletProps = {
  progress: SharedValue<number>;
  config: DropletConfig;
  color: string;
};

const BurstDroplet = ({ progress, config, color }: BurstDropletProps) => {
  const style = useAnimatedStyle(() => {
    const raw = (progress.value - config.delay) / (1 - config.delay);
    const p = raw < 0 ? 0 : raw > 1 ? 1 : raw;
    const distance = p * config.distance;
    const travelScale = interpolate(p, [0, 0.4, 1], [0.6, 1.1, 0.3]);
    const alpha = progress.value === 0 ? 0 : interpolate(p, [0, 0.2, 1], [0.0, 1, 0]);
    return {
      opacity: alpha,
      transform: [
        { translateX: Math.cos(config.angle) * distance },
        { translateY: Math.sin(config.angle) * distance },
        { scale: travelScale },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
    paddingVertical: 8,
    paddingHorizontal: 2,
    overflow: 'visible',
  },
  bubbleWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  burstLayer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    letterSpacing: 0.2,
    textTransform: 'none',
  },
  bubbleInput: {
    minWidth: 40,
    padding: 0,
    margin: 0,
  },
});
