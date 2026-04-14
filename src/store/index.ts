import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_TEMPLATE_TASK_NAMES,
  normalizeTaskName,
  type AppState,
  type Project,
  type ProjectColor,
  type Session,
  type Task,
} from '../types';

const STORE_VERSION = 3;

type StartSessionOptions = { taskId?: string | null; note?: string };

type AddPastSessionOptions = { taskId?: string | null; note?: string };

interface Store extends AppState {
  startSession: (projectId: string, options?: StartSessionOptions) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => Session | null;
  updateActiveSessionNote: (note: string) => void;
  updateActiveSession: (patch: Partial<Pick<Session, 'taskId' | 'note'>>) => void;
  addPastSession: (
    projectId: string,
    durationMinutes: number,
    startedAt: string,
    options?: AddPastSessionOptions,
  ) => void;

  createProject: (
    name: string,
    color: ProjectColor,
    customColor?: { hex: string; dark: string },
  ) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  archiveProject: (id: string) => void;
  setOnboardingDone: (done: boolean) => void;

  createTask: (projectId: string | null, name: string, isTemplate?: boolean) => Task;
  renameTask: (id: string, name: string) => void;

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

const buildDefaultTemplateTasks = (): Task[] =>
  DEFAULT_TEMPLATE_TASK_NAMES.map((name) => ({
    id: newId('t'),
    projectId: null,
    name,
    isTemplate: true,
    createdAt: new Date().toISOString(),
  }));

type TaskStats = { count: number; lastStartedAt: number };

const buildTaskStats = (sessions: Session[]): Map<string, TaskStats> => {
  const stats = new Map<string, TaskStats>();
  for (const s of sessions) {
    if (!s.taskId) continue;
    const started = new Date(s.startedAt).getTime();
    const prev = stats.get(s.taskId);
    if (prev) {
      prev.count += 1;
      if (started > prev.lastStartedAt) prev.lastStartedAt = started;
    } else {
      stats.set(s.taskId, { count: 1, lastStartedAt: started });
    }
  }
  return stats;
};

export const selectProjectTasks = (state: AppState, projectId: string): Task[] => {
  const projectTasks = state.tasks.filter((t) => t.projectId === projectId);
  const stats = buildTaskStats(state.sessions);
  return [...projectTasks].sort((a, b) => {
    const sa = stats.get(a.id) ?? { count: 0, lastStartedAt: 0 };
    const sb = stats.get(b.id) ?? { count: 0, lastStartedAt: 0 };
    if (sb.count !== sa.count) return sb.count - sa.count;
    if (sb.lastStartedAt !== sa.lastStartedAt) return sb.lastStartedAt - sa.lastStartedAt;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

export const selectTemplateTasks = (state: AppState): Task[] =>
  state.tasks.filter((t) => t.isTemplate);

const todayIsoDate = (d: Date): string => d.toISOString().slice(0, 10);

export const selectTaskPriorSecondsToday = (
  state: AppState,
  taskId: string,
  now: Date = new Date(),
): number => {
  const today = todayIsoDate(now);
  return state.sessions
    .filter(
      (s) =>
        s.taskId === taskId &&
        s.endedAt !== null &&
        todayIsoDate(new Date(s.startedAt)) === today,
    )
    .reduce((sum, s) => sum + (s.durationSeconds ?? s.durationMinutes * 60), 0);
};

export const migrateState = (persistedState: unknown, version: number): AppState => {
  const state = persistedState as AppState & { sessions?: Partial<Session>[] };
  if (version < 2) {
    state.sessions = (state.sessions ?? []).map((s) => ({
      ...(s as Session),
      durationSeconds: (s as Session).durationSeconds ?? (s.durationMinutes ?? 0) * 60,
    }));
  }
  if (version < 3) {
    const tasks: Task[] = Array.isArray(state.tasks) ? [...state.tasks] : buildDefaultTemplateTasks();
    if (tasks.length === 0) tasks.push(...buildDefaultTemplateTasks());
    const sessionsIn: Session[] = (state.sessions ?? []) as Session[];
    const migratedSessions: Session[] = sessionsIn.map((s) => {
      if (s.taskId) return { ...s, taskId: s.taskId };
      const raw = s.note ?? '';
      const cleanName = raw.trim();
      if (cleanName.length === 0) return { ...s, taskId: null };
      const normalized = normalizeTaskName(cleanName);
      const existing = tasks.find(
        (t) => t.projectId === s.projectId && normalizeTaskName(t.name) === normalized,
      );
      if (existing) return { ...s, taskId: existing.id };
      const newTask: Task = {
        id: newId('t'),
        projectId: s.projectId,
        name: cleanName,
        isTemplate: false,
        createdAt: s.startedAt ?? new Date().toISOString(),
      };
      tasks.push(newTask);
      return { ...s, taskId: newTask.id };
    });
    state.tasks = tasks;
    state.sessions = migratedSessions;
  }
  return state as AppState;
};

export const initialState: AppState = {
  projects: [],
  sessions: [],
  tasks: buildDefaultTemplateTasks(),
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

      startSession: (projectId, options) => {
        if (get().activeSessionId) {
          throw new Error('store.startSession: a session is already active');
        }
        const session: Session = {
          id: newId('s'),
          projectId,
          taskId: options?.taskId ?? null,
          startedAt: new Date().toISOString(),
          endedAt: null,
          durationMinutes: 0,
          durationSeconds: 0,
          note: options?.note ?? '',
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

      updateActiveSessionNote: (note) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === activeSessionId ? { ...s, note } : s,
          ),
        }));
      },

      updateActiveSession: (patch) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === activeSessionId ? { ...s, ...patch } : s,
          ),
        }));
      },

      addPastSession: (projectId, durationMinutes, startedAt, options) => {
        const rounded = Math.max(0, Math.round(durationMinutes));
        const start = new Date(startedAt);
        const end = new Date(start.getTime() + rounded * 60000);
        const session: Session = {
          id: newId('s'),
          projectId,
          taskId: options?.taskId ?? null,
          startedAt: start.toISOString(),
          endedAt: end.toISOString(),
          durationMinutes: rounded,
          durationSeconds: rounded * 60,
          note: options?.note ?? '',
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

      createTask: (projectId, name, isTemplate = false) => {
        const cleanName = name.trim();
        const normalized = normalizeTaskName(cleanName);
        const existing = get().tasks.find(
          (t) => t.projectId === projectId && normalizeTaskName(t.name) === normalized,
        );
        if (existing) return existing;
        const task: Task = {
          id: newId('t'),
          projectId,
          name: cleanName,
          isTemplate,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        return task;
      },

      renameTask: (id, name) => {
        const cleanName = name.trim();
        if (cleanName.length === 0) return;
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, name: cleanName } : t)),
        }));
      },

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
        tasks: state.tasks,
        activeSessionId: state.activeSessionId,
        activePausedAt: state.activePausedAt,
        activePausedAccumulatedMs: state.activePausedAccumulatedMs,
        dailyGoalMinutes: state.dailyGoalMinutes,
        onboardingDone: state.onboardingDone,
      }),
      migrate: (persistedState, version) => migrateState(persistedState, version),
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
