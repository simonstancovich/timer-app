import { useMemo } from 'react';
import type { TimelineSession } from '../../components/primitives/Timeline';
import { useStore } from '../../store';
import { isPresetProjectColor, type Project } from '../../types';
import { computeStreak } from '../../utils/streak';

const TIMELINE_WINDOW_START_MINUTE = 9 * 60;

type HomeData = {
  todayMinutes: number;
  streak: number;
  timelineSessions: TimelineSession[];
  activeProjects: Project[];
  hasHistory: boolean;
};

export const useHomeData = (): HomeData => {
  const projects = useStore((s) => s.projects);
  const sessions = useStore((s) => s.sessions);

  const todayIso = new Date().toISOString().slice(0, 10);

  return useMemo(() => {
    const todaySessions = sessions.filter((s) => s.startedAt.slice(0, 10) === todayIso);
    const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const streak = computeStreak(sessions.map((s) => s.startedAt));
    const activeProjects = projects.filter((p) => !p.archived);

    const timelineSessions: TimelineSession[] = todaySessions
      .map((s): TimelineSession | null => {
        const project = projects.find((p) => p.id === s.projectId);
        if (!project) return null;
        const color = isPresetProjectColor(project.color) ? project.color : 'violet';
        const started = new Date(s.startedAt);
        const startMinute = started.getHours() * 60 + started.getMinutes();
        return {
          startMinuteOffset: Math.max(0, startMinute - TIMELINE_WINDOW_START_MINUTE),
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
      activeProjects,
      hasHistory: todayMinutes > 0 || streak > 0,
    };
  }, [sessions, projects, todayIso]);
};
