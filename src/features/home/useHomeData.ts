import { useMemo } from 'react';
import type { TimelineSession } from '../../components/primitives/Timeline';
import { useStore } from '../../store';
import { isPresetProjectColor, type Project } from '../../types';
import { computeStreak } from '../../utils/streak';

const DEFAULT_WINDOW_START_MINUTE = 9 * 60;
const DEFAULT_WINDOW_END_MINUTE = 18 * 60;
const WINDOW_TRAILING_BUFFER_MINUTES = 15;

type HomeData = {
  todayMinutes: number;
  streak: number;
  timelineSessions: TimelineSession[];
  timelineWindowMinutes: number;
  activeProjects: Project[];
  hasHistory: boolean;
};

const minuteOfDay = (d: Date): number => d.getHours() * 60 + d.getMinutes();

export const useHomeData = (): HomeData => {
  const projects = useStore((s) => s.projects);
  const sessions = useStore((s) => s.sessions);

  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const nowMinute = minuteOfDay(now);

  return useMemo(() => {
    const todaySessions = sessions.filter((s) => s.startedAt.slice(0, 10) === todayIso);
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const streak = computeStreak(sessions.map((s) => s.startedAt));
    const activeProjects = projects.filter((p) => !p.archived);

    const sessionStartMinutes = todaySessions.map((s) => minuteOfDay(new Date(s.startedAt)));
    const sessionEndMinutes = todaySessions.map(
      (s) => minuteOfDay(new Date(s.startedAt)) + s.durationMinutes,
    );

    const windowStart = Math.min(DEFAULT_WINDOW_START_MINUTE, ...sessionStartMinutes);
    const windowEnd = Math.max(
      DEFAULT_WINDOW_END_MINUTE,
      nowMinute + WINDOW_TRAILING_BUFFER_MINUTES,
      ...sessionEndMinutes,
    );
    const timelineWindowMinutes = Math.max(60, windowEnd - windowStart);

    const timelineSessions: TimelineSession[] = todaySessions
      .map((s): TimelineSession | null => {
        const project = projects.find((p) => p.id === s.projectId);
        if (!project) return null;
        const color = isPresetProjectColor(project.color) ? project.color : 'violet';
        const startMinute = minuteOfDay(new Date(s.startedAt));
        return {
          startMinuteOffset: Math.max(0, startMinute - windowStart),
          durationMinutes: s.durationMinutes,
          color,
          label: project.name,
          isLive: s.endedAt === null,
        };
      })
      .filter((s): s is TimelineSession => s !== null);

    return {
      todayMinutes,
      streak,
      timelineSessions,
      timelineWindowMinutes,
      activeProjects,
      hasHistory: todayMinutes > 0 || streak > 0,
    };
  }, [sessions, projects, todayIso, nowMinute]);
};
