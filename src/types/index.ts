export type PresetProjectColor =
  | 'violet'
  | 'ocean'
  | 'ember'
  | 'forest'
  | 'rose'
  | 'amber'
  | 'teal';

export type ProjectColor = PresetProjectColor | 'custom';

const PRESET_PROJECT_COLORS: readonly PresetProjectColor[] = [
  'violet',
  'ocean',
  'ember',
  'forest',
  'rose',
  'amber',
  'teal',
];

export const isPresetProjectColor = (c: string): c is PresetProjectColor =>
  (PRESET_PROJECT_COLORS as readonly string[]).includes(c);

export interface Project {
  id: string;
  name: string;
  color: ProjectColor;
  customColor?: string;
  customColorDark?: string;
  lastNote: string;
  weeklyGoalMinutes: number;
  weekSessions: number[];
  totalMinutes: number;
  weekMinutes: number;
  createdAt: string;
  archived: boolean;
}

export interface Session {
  id: string;
  projectId: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  note: string;
  isDeep: boolean;
  isPast: boolean;
}

export interface AppState {
  projects: Project[];
  sessions: Session[];
  activeSessionId: string | null;
  activePausedAt: string | null;
  activePausedAccumulatedMs: number;
  dailyGoalMinutes: number;
  onboardingDone: boolean;
}
