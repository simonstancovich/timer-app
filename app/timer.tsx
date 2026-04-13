import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonoText } from '../src/components/primitives/MonoText';
import { UIText } from '../src/components/primitives/UIText';
import { useTimer } from '../src/hooks/useTimer';
import { useStore } from '../src/store';
import { colors } from '../src/tokens/colors';

const pad = (n: number): string => n.toString().padStart(2, '0');

const formatElapsed = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const TimerScreen = () => {
  const { elapsedSeconds, isActive, isPaused } = useTimer();
  const activeProject = useStore((s) => s.getActiveProject());
  const stopSession = useStore((s) => s.stopSession);

  useEffect(() => {
    if (!isActive) {
      router.replace('/(tabs)');
    }
  }, [isActive]);

  const handleStop = () => {
    stopSession();
  };

  if (!isActive || !activeProject) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <UIText variant="micro" color="sub" style={styles.projectLabel}>
          TRACKING {activeProject.name.toUpperCase()}
        </UIText>
        <MonoText size="xl">{formatElapsed(elapsedSeconds)}</MonoText>
        {isPaused ? (
          <UIText variant="caption" color="sub" style={styles.paused}>
            Paused
          </UIText>
        ) : null}
        <Pressable onPress={handleStop} style={styles.stopButton}>
          <UIText variant="bodyLg" color="white">
            Stop & save
          </UIText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  projectLabel: {
    letterSpacing: 1,
  },
  paused: {
    marginTop: -12,
  },
  stopButton: {
    marginTop: 24,
    alignSelf: 'stretch',
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TimerScreen;
