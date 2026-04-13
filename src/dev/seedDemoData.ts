import { useStore } from '../store';
import type { Project, Session } from '../types';

const newId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const demoProject = (overrides: Partial<Project>): Project => ({
  id: newId('p'),
  name: 'Project',
  color: 'violet',
  lastNote: '',
  weeklyGoalMinutes: 40 * 60,
  weekSessions: [0, 0, 0, 0, 0, 0, 0],
  totalMinutes: 0,
  weekMinutes: 0,
  createdAt: new Date().toISOString(),
  archived: false,
  ...overrides,
});

const isoOnDayAt = (daysAgo: number, hour: number, minute: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const seedDemoData = () => {
  const keep = useStore.getState().projects.slice(0, 1);

  const primary = demoProject({
    name: 'Deep work',
    color: 'ocean',
    lastNote: 'Working on deposit flow',
    weekSessions: [120, 90, 75, 60, 45, 0, 0],
    weekMinutes: 390,
    totalMinutes: 2400,
  });
  const secondary = demoProject({
    name: 'Writing',
    color: 'ember',
    lastNote: 'Essay draft — second pass',
    weekSessions: [30, 0, 45, 0, 60, 0, 0],
    weekMinutes: 135,
    totalMinutes: 860,
  });
  const tertiary = demoProject({
    name: 'Admin',
    color: 'amber',
    lastNote: 'Email triage',
    weekSessions: [0, 0, 0, 0, 0, 0, 0],
    weekMinutes: 0,
    totalMinutes: 240,
  });

  const projects: Project[] = [...keep, primary, secondary, tertiary];

  const sessions: Session[] = [
    {
      id: newId('s'),
      projectId: primary.id,
      startedAt: isoOnDayAt(0, 9, 15),
      endedAt: isoOnDayAt(0, 10, 10),
      durationMinutes: 55,
      durationSeconds: 55 * 60,
      note: 'Deposit flow wiring',
      isDeep: false,
      isPast: false,
    },
    {
      id: newId('s'),
      projectId: secondary.id,
      startedAt: isoOnDayAt(0, 10, 45),
      endedAt: isoOnDayAt(0, 11, 15),
      durationMinutes: 30,
      durationSeconds: 30 * 60,
      note: 'Outline edits',
      isDeep: false,
      isPast: false,
    },
    {
      id: newId('s'),
      projectId: primary.id,
      startedAt: isoOnDayAt(0, 13, 0),
      endedAt: isoOnDayAt(0, 14, 30),
      durationMinutes: 90,
      durationSeconds: 90 * 60,
      note: 'Pairing with backend',
      isDeep: true,
      isPast: false,
    },
    {
      id: newId('s'),
      projectId: primary.id,
      startedAt: isoOnDayAt(1, 9, 0),
      endedAt: isoOnDayAt(1, 11, 0),
      durationMinutes: 120,
      durationSeconds: 120 * 60,
      note: '',
      isDeep: true,
      isPast: false,
    },
    {
      id: newId('s'),
      projectId: primary.id,
      startedAt: isoOnDayAt(2, 10, 0),
      endedAt: isoOnDayAt(2, 11, 15),
      durationMinutes: 75,
      durationSeconds: 75 * 60,
      note: '',
      isDeep: false,
      isPast: false,
    },
  ];

  useStore.setState({ projects, sessions });
};
