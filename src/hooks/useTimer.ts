import { useEffect, useState } from 'react';
import { useStore } from '../store';

export type TimerState = {
  elapsedSeconds: number;
  isActive: boolean;
  isPaused: boolean;
};

const computeElapsed = (
  startedAtIso: string,
  accumulatedPauseMs: number,
  activePausedAtIso: string | null,
  now: number,
): number => {
  const startMs = new Date(startedAtIso).getTime();
  const extraPausedMs = activePausedAtIso
    ? Math.max(0, now - new Date(activePausedAtIso).getTime())
    : 0;
  const pausedMs = accumulatedPauseMs + extraPausedMs;
  return Math.max(0, Math.floor((now - startMs - pausedMs) / 1000));
};

export const useTimer = (): TimerState => {
  const activeSessionId = useStore((s) => s.activeSessionId);
  const activePausedAt = useStore((s) => s.activePausedAt);
  const activePausedAccumulatedMs = useStore((s) => s.activePausedAccumulatedMs);
  const session = useStore((s) =>
    s.activeSessionId ? (s.sessions.find((x) => x.id === s.activeSessionId) ?? null) : null,
  );

  const isActive = !!session;
  const isPaused = !!activePausedAt;

  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (!isActive || isPaused) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isActive, isPaused, activeSessionId]);

  const elapsedSeconds = session
    ? computeElapsed(session.startedAt, activePausedAccumulatedMs, activePausedAt, now)
    : 0;

  return { elapsedSeconds, isActive, isPaused };
};
