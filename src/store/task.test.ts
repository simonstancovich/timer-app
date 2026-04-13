import { initialState, migrateState, useStore } from './index';
import { DEFAULT_TEMPLATE_TASK_NAMES, type Session } from '../types';

const resetStore = () => useStore.setState({ ...initialState, tasks: [] });

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-13T10:00:00Z'));
  resetStore();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('initial state', () => {
  it('seeds 3 default template tasks', () => {
    useStore.setState({ ...initialState });
    const templates = useStore.getState().tasks.filter((t) => t.isTemplate);
    expect(templates).toHaveLength(3);
    expect(templates.map((t) => t.name)).toEqual([...DEFAULT_TEMPLATE_TASK_NAMES]);
    for (const t of templates) {
      expect(t.projectId).toBeNull();
    }
  });
});

describe('createTask', () => {
  it('creates a project-scoped task with the trimmed display name', () => {
    const task = useStore.getState().createTask('p1', '  Deposit flow  ');
    expect(task.name).toBe('Deposit flow');
    expect(task.projectId).toBe('p1');
    expect(task.isTemplate).toBe(false);
    expect(useStore.getState().tasks).toContainEqual(task);
  });

  it('creates a template task when isTemplate=true and projectId=null', () => {
    const task = useStore.getState().createTask(null, 'Research', true);
    expect(task.projectId).toBeNull();
    expect(task.isTemplate).toBe(true);
  });

  it('dedupes by (projectId, normalized name) — same casing', () => {
    const a = useStore.getState().createTask('p1', 'Deposit flow');
    const b = useStore.getState().createTask('p1', 'Deposit flow');
    expect(a.id).toBe(b.id);
    expect(useStore.getState().tasks).toHaveLength(1);
  });

  it('dedupes case-insensitively and with whitespace trimmed', () => {
    const a = useStore.getState().createTask('p1', 'Deposit Flow');
    const b = useStore.getState().createTask('p1', '  deposit flow  ');
    expect(a.id).toBe(b.id);
  });

  it('does not dedupe across different projects', () => {
    const a = useStore.getState().createTask('p1', 'Bug fix');
    const b = useStore.getState().createTask('p2', 'Bug fix');
    expect(a.id).not.toBe(b.id);
    expect(useStore.getState().tasks).toHaveLength(2);
  });

  it('does not dedupe a template against a project task of the same name', () => {
    const template = useStore.getState().createTask(null, 'Bug fix', true);
    const projectTask = useStore.getState().createTask('p1', 'Bug fix');
    expect(template.id).not.toBe(projectTask.id);
    expect(template.projectId).toBeNull();
    expect(projectTask.projectId).toBe('p1');
  });
});

describe('migrateState v2 → v3', () => {
  const v2Session = (overrides: Partial<Session>): Session => ({
    id: 's1',
    projectId: 'p1',
    taskId: null,
    startedAt: '2026-04-13T10:00:00Z',
    endedAt: '2026-04-13T11:00:00Z',
    durationMinutes: 60,
    durationSeconds: 3600,
    note: '',
    isDeep: false,
    isPast: false,
    ...overrides,
  });

  it('seeds the 3 default template tasks', () => {
    const persisted = { projects: [], sessions: [], tasks: [] };
    const migrated = migrateState(persisted, 2);
    expect(migrated.tasks.filter((t) => t.isTemplate)).toHaveLength(3);
  });

  it("creates a project task for each unique non-empty note and assigns session.taskId", () => {
    const persisted = {
      projects: [],
      sessions: [
        v2Session({ id: 's1', projectId: 'p1', note: 'Deposit flow' }),
        v2Session({ id: 's2', projectId: 'p1', note: '  deposit flow  ' }),
        v2Session({ id: 's3', projectId: 'p1', note: 'Bug fix' }),
        v2Session({ id: 's4', projectId: 'p2', note: 'Deposit flow' }),
        v2Session({ id: 's5', projectId: 'p1', note: '' }),
      ],
      tasks: [],
    };
    const migrated = migrateState(persisted, 2);

    const projectTasks = migrated.tasks.filter((t) => !t.isTemplate);
    expect(projectTasks).toHaveLength(3);

    const byProjectAndNorm = new Map(
      projectTasks.map((t) => [`${t.projectId}:${t.name.toLowerCase()}`, t.id] as const),
    );
    expect(byProjectAndNorm.get('p1:deposit flow')).toBeDefined();
    expect(byProjectAndNorm.get('p1:bug fix')).toBeDefined();
    expect(byProjectAndNorm.get('p2:deposit flow')).toBeDefined();

    const bySession = new Map(migrated.sessions.map((s) => [s.id, s.taskId] as const));
    expect(bySession.get('s1')).toBe(byProjectAndNorm.get('p1:deposit flow'));
    expect(bySession.get('s2')).toBe(byProjectAndNorm.get('p1:deposit flow'));
    expect(bySession.get('s3')).toBe(byProjectAndNorm.get('p1:bug fix'));
    expect(bySession.get('s4')).toBe(byProjectAndNorm.get('p2:deposit flow'));
    expect(bySession.get('s5')).toBeNull();
  });

  it('is a no-op on already-v3 state (version=3)', () => {
    const persisted = {
      projects: [],
      sessions: [],
      tasks: [
        { id: 't1', projectId: null, name: 'Bug fix', isTemplate: true, createdAt: '2026-04-13T10:00:00Z' },
      ],
    };
    const migrated = migrateState(persisted, 3);
    expect(migrated.tasks).toHaveLength(1);
    expect(migrated.tasks[0].id).toBe('t1');
  });
});

describe('renameTask', () => {
  it('updates a task name (trimmed)', () => {
    const task = useStore.getState().createTask('p1', 'Old name');
    useStore.getState().renameTask(task.id, '  New name  ');
    const after = useStore.getState().tasks.find((t) => t.id === task.id);
    expect(after?.name).toBe('New name');
  });

  it('ignores a rename to an empty / whitespace-only string', () => {
    const task = useStore.getState().createTask('p1', 'Keep me');
    useStore.getState().renameTask(task.id, '   ');
    expect(useStore.getState().tasks.find((t) => t.id === task.id)?.name).toBe('Keep me');
  });
});
