import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
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

const DARK_TONE_BG = 'rgba(0,0,0,0.06)';
const DARK_TONE_BORDER = 'rgba(0,0,0,0.12)';
const DARK_TONE_ACTIVE_BG = 'rgba(0,0,0,0.14)';
const DARK_TONE_ACTIVE_BORDER = 'rgba(0,0,0,0.35)';
const DARK_TONE_TEXT = 'rgba(0,0,0,0.55)';
const DARK_TONE_ACTIVE_TEXT = 'rgba(0,0,0,0.9)';

const POP_SHRINK = 0.8;
const POP_BURST = 1.35;
const POP_ROTATION = 6;
const EDIT_SCALE = 1.14;
const EDIT_SHAKE = 9;
const LONG_PRESS_MS = 350;
const SHOCKWAVE_SCALE = 2.3;

const TaskBubble = ({ task, tone, isActive, onPress, onRename }: TaskBubbleProps) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  const shockwaveScale = useSharedValue(1);
  const shockwaveOpacity = useSharedValue(0);

  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(task.name);
  const inputRef = useRef<TextInput>(null);
  const editingRef = useRef(false);
  const longPressedRef = useRef(false);

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

  const triggerShockwave = () => {
    shockwaveScale.value = 1;
    shockwaveOpacity.value = 0.9;
    shockwaveScale.value = withTiming(SHOCKWAVE_SCALE, {
      duration: 380,
      easing: Easing.out(Easing.quad),
    });
    shockwaveOpacity.value = withTiming(0, {
      duration: 380,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePress = () => {
    if (editingRef.current || longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    triggerShockwave();
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

  const handleLongPress = () => {
    if (!onRename || editingRef.current) return;
    longPressedRef.current = true;
    editingRef.current = true;
    setIsEditing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    triggerShockwave();
    scale.value = withSpring(EDIT_SCALE, { damping: 8, stiffness: 180 });
    rotation.value = withSequence(
      withTiming(-EDIT_SHAKE, { duration: 45 }),
      withTiming(EDIT_SHAKE, { duration: 45 }),
      withTiming(-EDIT_SHAKE * 0.7, { duration: 45 }),
      withTiming(EDIT_SHAKE * 0.7, { duration: 45 }),
      withTiming(0, { duration: 60 }),
    );
  };

  const commitEdit = () => {
    if (!onRename) return;
    const trimmed = draftName.trim();
    if (trimmed.length > 0 && trimmed !== task.name) onRename(trimmed);
    editingRef.current = false;
    setIsEditing(false);
    scale.value = withSpring(1, { damping: 10, stiffness: 240 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotateZ: `${rotation.value}deg` }],
  }));

  const shockwaveStyle = useAnimatedStyle(() => ({
    opacity: shockwaveOpacity.value,
    transform: [{ scale: shockwaveScale.value }],
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

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={LONG_PRESS_MS}
        accessibilityRole="button"
        accessibilityLabel={task.name}
        accessibilityState={{ selected: isActive }}
        testID={`bubble-${task.id}`}
      >
        <View style={styles.bubbleWrap}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shockwave,
              { borderColor: textColor },
              shockwaveStyle,
            ]}
          />
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
        </View>
      </Pressable>
    </Animated.View>
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
  bubble: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shockwave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 2,
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
