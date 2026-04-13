import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppState, Project, ProjectColor, Session } from '../types';

const STORE_VERSION = 2;

interface Store extends AppState {
  startSession: (projectId: string, note?: string) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => Session | null;
  addPastSession: (
    projectId: string,
    durationMinutes: number,
    startedAt: string,
    note?: string,
  ) => void;

  createProject: (
    name: string,
    color: ProjectColor,
    customColor?: { hex: string; dark: string },
  ) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  archiveProject: (id: string) => void;
  setOnboardingDone: (done: boolean) => void;

  getActiveProject: () => Project | null;
}

const DEFAULT_WEEKLY_GOAL_MINUTES = 40 * 60;
const DEFAULT_DAILY_GOAL_MINUTES = 9 * 60;
const DEEP_WORK_MINUTES = 90;

const newId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const startOfWeekMs = (d: Date): number => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const mondayOffset = (day + 6) % 7;
  copy.setDate(copy.getDate() - mondayOffset);
  return copy.getTime();
};

const mondayIndex = (d: Date): number => (d.getDay() + 6) % 7;

const isInCurrentWeek = (iso: string, now: Date): boolean => {
  const t = new Date(iso).getTime();
  return t >= startOfWeekMs(now);
};

const bumpProjectTotals = (
  project: Project,
  session: Session,
  now: Date,
): Project => {
  const inWeek = isInCurrentWeek(session.startedAt, now);
  const dayIdx = mondayIndex(new Date(session.startedAt));
  const nextWeekSessions = inWeek
    ? project.weekSessions.map((count, i) => (i === dayIdx ? count + 1 : count))
    : project.weekSessions;
  return {
    ...project,
    totalMinutes: project.totalMinutes + session.durationMinutes,
    weekMinutes: inWeek ? project.weekMinutes + session.durationMinutes : project.weekMinutes,
    weekSessions: nextWeekSessions,
    lastNote: session.note.trim().length > 0 ? session.note : project.lastNote,
  };
};

export const initialState: AppState = {
  projects: [],
  sessions: [],
  activeSessionId: null,
  activePausedAt: null,
  activePausedAccumulatedMs: 0,
  dailyGoalMinutes: DEFAULT_DAILY_GOAL_MINUTES,
  onboardingDone: false,
};

const notImplemented = (name: string) => () => {
  throw new Error(`store.${name} not implemented yet`);
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      startSession: (projectId, note) => {
        if (get().activeSessionId) {
          throw new Error('store.startSession: a session is already active');
        }
        const session: Session = {
          id: newId('s'),
          projectId,
          startedAt: new Date().toISOString(),
          endedAt: null,
          durationMinutes: 0,
          durationSeconds: 0,
          note: note ?? '',
          isDeep: false,
          isPast: false,
        };
        set((state) => ({
          sessions: [...state.sessions, session],
          activeSessionId: session.id,
          activePausedAt: null,
          activePausedAccumulatedMs: 0,
        }));
      },

      pauseSession: () => {
        const { activeSessionId, activePausedAt } = get();
        if (!activeSessionId || activePausedAt) return;
        set({ activePausedAt: new Date().toISOString() });
      },

      resumeSession: () => {
        const { activeSessionId, activePausedAt, activePausedAccumulatedMs } = get();
        if (!activeSessionId || !activePausedAt) return;
        const delta = Date.now() - new Date(activePausedAt).getTime();
        set({
          activePausedAt: null,
          activePausedAccumulatedMs: activePausedAccumulatedMs + Math.max(0, delta),
        });
      },

      stopSession: () => {
        const {
          activeSessionId,
          activePausedAt,
          activePausedAccumulatedMs,
          sessions,
          projects,
        } = get();
        if (!activeSessionId) return null;
        const existing = sessions.find((s) => s.id === activeSessionId);
        if (!existing) {
          set({ activeSessionId: null, activePausedAt: null, activePausedAccumulatedMs: 0 });
          return null;
        }

        const now = new Date();
        const extraPausedMs = activePausedAt
          ? Math.max(0, now.getTime() - new Date(activePausedAt).getTime())
          : 0;
        const totalPausedMs = activePausedAccumulatedMs + extraPausedMs;
        const elapsedMs = now.getTime() - new Date(existing.startedAt).getTime() - totalPausedMs;
        const durationSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
        const durationMinutes = Math.max(0, Math.round(elapsedMs / 60000));

        const completed: Session = {
          ...existing,
          endedAt: now.toISOString(),
          durationMinutes,
          durationSeconds,
          isDeep: durationMinutes >= DEEP_WORK_MINUTES,
        };

        const nextProjects = projects.map((p) =>
          p.id === completed.projectId ? bumpProjectTotals(p, completed, now) : p,
        );

        set({
          sessions: sessions.map((s) => (s.id === completed.id ? completed : s)),
          projects: nextProjects,
          activeSessionId: null,
          activePausedAt: null,
          activePausedAccumulatedMs: 0,
        });

        return completed;
      },

      addPastSession: (projectId, durationMinutes, startedAt, note) => {
        const rounded = Math.max(0, Math.round(durationMinutes));
        const start = new Date(startedAt);
        const end = new Date(start.getTime() + rounded * 60000);
        const session: Session = {
          id: newId('s'),
          projectId,
          startedAt: start.toISOString(),
          endedAt: end.toISOString(),
          durationMinutes: rounded,
          durationSeconds: rounded * 60,
          note: note ?? '',
          isDeep: rounded >= DEEP_WORK_MINUTES,
          isPast: true,
        };
        set((state) => ({
          sessions: [...state.sessions, session],
          projects: state.projects.map((p) =>
            p.id === projectId ? bumpProjectTotals(p, session, new Date()) : p,
          ),
        }));
      },

      createProject: (name, color, customColor) => {
        const project: Project = {
          id: newId('p'),
          name: name.trim(),
          color,
          ...(color === 'custom' && customColor
            ? { customColor: customColor.hex, customColorDark: customColor.dark }
            : {}),
          lastNote: '',
          weeklyGoalMinutes: DEFAULT_WEEKLY_GOAL_MINUTES,
          weekSessions: [0, 0, 0, 0, 0, 0, 0],
          totalMinutes: 0,
          weekMinutes: 0,
          createdAt: new Date().toISOString(),
          archived: false,
        };
        set((state) => ({ projects: [...state.projects, project] }));
        return project;
      },
      updateProject: notImplemented('updateProject'),
      archiveProject: notImplemented('archiveProject'),
      setOnboardingDone: (done) => set({ onboardingDone: done }),

      getActiveProject: () => {
        const { activeSessionId, sessions, projects } = get();
        if (!activeSessionId) return null;
        const session = sessions.find((s) => s.id === activeSessionId);
        if (!session) return null;
        return projects.find((p) => p.id === session.projectId) ?? null;
      },
    }),
    {
      name: 'timetracker',
      version: STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): AppState => ({
        projects: state.projects,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        activePausedAt: state.activePausedAt,
        activePausedAccumulatedMs: state.activePausedAccumulatedMs,
        dailyGoalMinutes: state.dailyGoalMinutes,
        onboardingDone: state.onboardingDone,
      }),
      migrate: (persistedState, version) => {
        const state = persistedState as AppState & { sessions?: Partial<Session>[] };
        if (version < 2) {
          state.sessions = (state.sessions ?? []).map((s) => ({
            ...(s as Session),
            durationSeconds: (s as Session).durationSeconds ?? (s.durationMinutes ?? 0) * 60,
          }));
        }
        return state as AppState;
      },
    },
  ),
);

export const useStoreHydrated = (): boolean => {
  const [hydrated, setHydrated] = useState(() => useStore.persist.hasHydrated());

  useEffect(() => {
    const unsubFinish = useStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useStore.persist.hasHydrated());
    return unsubFinish;
  }, []);

  return hydrated;
};
