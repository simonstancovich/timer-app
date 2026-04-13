jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { useStore } from './index';

const initialSnapshot = useStore.getState();

beforeEach(() => {
  useStore.setState({ ...initialSnapshot, projects: [], onboardingDone: false });
});

describe('store.createProject', () => {
  it('appends a project with sensible defaults and returns it', () => {
    const project = useStore.getState().createProject('Deep work', 'violet');

    const state = useStore.getState();
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0]).toBe(project);

    expect(project.name).toBe('Deep work');
    expect(project.color).toBe('violet');
    expect(project.weeklyGoalMinutes).toBe(40 * 60);
    expect(project.totalMinutes).toBe(0);
    expect(project.weekMinutes).toBe(0);
    expect(project.weekSessions).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(project.archived).toBe(false);
    expect(project.lastNote).toBe('');
    expect(project.id).toMatch(/^p_/);
    expect(() => new Date(project.createdAt).toISOString()).not.toThrow();
  });

  it('trims the name', () => {
    const project = useStore.getState().createProject('  Writing  ', 'ember');
    expect(project.name).toBe('Writing');
  });

  it('appends successive projects without replacing earlier ones', () => {
    const a = useStore.getState().createProject('A', 'violet');
    const b = useStore.getState().createProject('B', 'ocean');
    const projects = useStore.getState().projects;
    expect(projects.map((p) => p.id)).toEqual([a.id, b.id]);
    expect(a.id).not.toBe(b.id);
  });
});
