import { router } from 'expo-router';
import { useEffect } from 'react';
import { LiveTimerScreen } from '../src/features/timer/LiveTimerScreen';
import { useStore } from '../src/store';

const TimerScreen = () => {
  const activeProject = useStore((s) => s.getActiveProject());
  const activeSessionId = useStore((s) => s.activeSessionId);

  useEffect(() => {
    if (!activeSessionId) router.replace('/(tabs)');
  }, [activeSessionId]);

  if (!activeSessionId || !activeProject) return null;

  return <LiveTimerScreen project={activeProject} />;
};

export default TimerScreen;
