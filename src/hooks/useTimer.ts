import { useEffect, useState } from 'react';
import { useStore } from '../store';

export type TimerState = {
  elapsedSeconds: number;
  isActive: boolean;
  isPaused: boolean;
};

const computeElapsedSeconds = (
  startedAtIso: string | undefined,
  accumulatedPauseMs: number,
  activePausedAtIso: string | null,
): number => {
  if (!startedAtIso) return 0;
  const startMs = new Date(startedAtIso).getTime();
  const endMs = activePausedAtIso ? new Date(activePausedAtIso).getTime() : Date.now();
  return Math.max(0, Math.floor((endMs - startMs - accumulatedPauseMs) / 1000));
};

export const useTimer = (): TimerState => {
  const session = useStore((s) =>
    s.activeSessionId ? (s.sessions.find((x) => x.id === s.activeSessionId) ?? null) : null,
  );
  const activePausedAt = useStore((s) => s.activePausedAt);
  const activePausedAccumulatedMs = useStore((s) => s.activePausedAccumulatedMs);

  const isActive = !!session;
  const isPaused = !!activePausedAt;
  const startedAt = session?.startedAt;

  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    computeElapsedSeconds(startedAt, activePausedAccumulatedMs, activePausedAt),
  );

  useEffect(() => {
    const tick = () => {
      setElapsedSeconds(
        computeElapsedSeconds(startedAt, activePausedAccumulatedMs, activePausedAt),
      );
    };
    tick();
    if (!isActive || isPaused) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, activePausedAt, activePausedAccumulatedMs, isActive, isPaused]);

  return { elapsedSeconds, isActive, isPaused };
};
