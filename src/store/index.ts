import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AppState, Project, ProjectColor, Session } from '../types';

const STORE_VERSION = 1;

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

const newProjectId = () =>
  `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const initialState: AppState = {
  projects: [],
  sessions: [],
  activeSessionId: null,
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

      startSession: notImplemented('startSession'),
      pauseSession: notImplemented('pauseSession'),
      resumeSession: notImplemented('resumeSession'),
      stopSession: () => {
        throw new Error('store.stopSession not implemented yet');
      },
      addPastSession: notImplemented('addPastSession'),

      createProject: (name, color, customColor) => {
        const project: Project = {
          id: newProjectId(),
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
        dailyGoalMinutes: state.dailyGoalMinutes,
        onboardingDone: state.onboardingDone,
      }),
      migrate: (persistedState) => persistedState as AppState,
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
