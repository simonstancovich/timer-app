export type PresetProjectColor =
  | 'violet'
  | 'ocean'
  | 'ember'
  | 'forest'
  | 'rose'
  | 'amber'
  | 'teal';

export type ProjectColor = PresetProjectColor | 'custom';

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
  streak: number;
  dailyGoalMinutes: number;
  onboardingDone: boolean;
}
