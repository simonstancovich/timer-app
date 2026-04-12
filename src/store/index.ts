import AsyncStorage from '@react-native-async-storage/async-storage';
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
    startedAt: Date,
    note?: string,
  ) => void;

  createProject: (name: string, color: ProjectColor) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  archiveProject: (id: string) => void;

  getActiveProject: () => Project | null;
  getTodaySessions: () => Session[];
  getTodayMinutes: () => number;
  getWeekMinutes: () => number;
  getProjectWeekMinutes: (projectId: string) => number;
}

const initialState: AppState = {
  projects: [],
  sessions: [],
  activeSessionId: null,
  streak: 0,
  dailyGoalMinutes: 540,
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

      createProject: () => {
        throw new Error('store.createProject not implemented yet');
      },
      updateProject: notImplemented('updateProject'),
      archiveProject: notImplemented('archiveProject'),

      getActiveProject: () => {
        const { activeSessionId, sessions, projects } = get();
        if (!activeSessionId) return null;
        const session = sessions.find((s) => s.id === activeSessionId);
        if (!session) return null;
        return projects.find((p) => p.id === session.projectId) ?? null;
      },
      getTodaySessions: () => [],
      getTodayMinutes: () => 0,
      getWeekMinutes: () => 0,
      getProjectWeekMinutes: () => 0,
    }),
    {
      name: 'timetracker',
      version: STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        projects: state.projects,
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        streak: state.streak,
        dailyGoalMinutes: state.dailyGoalMinutes,
        onboardingDone: state.onboardingDone,
      }),
      migrate: (persistedState, version) => {
        if (version < STORE_VERSION) {
          // future migrations land here
        }
        return persistedState as AppState;
      },
    },
  ),
);
