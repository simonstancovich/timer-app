import {
  initialState,
  selectProjectTasks,
  selectTaskPriorSecondsToday,
  selectTemplateTasks,
  useStore,
} from './index';

const resetStore = () => useStore.setState({ ...initialState, tasks: [] });

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-13T10:00:00Z'));
  resetStore();
});

afterEach(() => {
  jest.useRealTimers();
});

const makeProject = (id: string) => useStore.getState().createProject(`p-${id}`, 'violet');

describe('selectProjectTasks', () => {
  it('returns only tasks scoped to the given project', () => {
    const p1 = makeProject('1');
    const p2 = makeProject('2');
    useStore.getState().createTask(p1.id, 'A');
    useStore.getState().createTask(p1.id, 'B');
    useStore.getState().createTask(p2.id, 'C');
    useStore.getState().createTask(null, 'Template', true);

    const tasks = selectProjectTasks(useStore.getState(), p1.id);
    expect(tasks).toHaveLength(2);
    expect(tasks.map((t) => t.name).sort()).toEqual(['A', 'B']);
  });

  it('orders by frequency descending, then recency descending', () => {
    const p = makeProject('1');
    const a = useStore.getState().createTask(p.id, 'A');
    const b = useStore.getState().createTask(p.id, 'B');
    const c = useStore.getState().createTask(p.id, 'C');

    useStore.setState({
      sessions: [
        {
          id: 's1',
          projectId: p.id,
          taskId: a.id,
          startedAt: '2026-04-13T08:00:00Z',
          endedAt: '2026-04-13T08:30:00Z',
          durationMinutes: 30,
          durationSeconds: 1800,
          note: '',
          isDeep: false,
          isPast: false,
        },
        {
          id: 's2',
          projectId: p.id,
          taskId: a.id,
          startedAt: '2026-04-13T09:00:00Z',
          endedAt: '2026-04-13T09:20:00Z',
          durationMinutes: 20,
          durationSeconds: 1200,
          note: '',
          isDeep: false,
          isPast: false,
        },
        {
          id: 's3',
          projectId: p.id,
          taskId: b.id,
          startedAt: '2026-04-13T09:30:00Z',
          endedAt: '2026-04-13T09:45:00Z',
          durationMinutes: 15,
          durationSeconds: 900,
          note: '',
          isDeep: false,
          isPast: false,
        },
      ],
    });

    const ordered = selectProjectTasks(useStore.getState(), p.id).map((t) => t.id);
    expect(ordered).toEqual([a.id, b.id, c.id]);
  });

  it('tie-breaks equal-frequency tasks by most recent session', () => {
    const p = makeProject('1');
    const older = useStore.getState().createTask(p.id, 'Older');
    const newer = useStore.getState().createTask(p.id, 'Newer');

    useStore.setState({
      sessions: [
        {
          id: 's1',
          projectId: p.id,
          taskId: older.id,
          startedAt: '2026-04-13T08:00:00Z',
          endedAt: '2026-04-13T08:30:00Z',
          durationMinutes: 30,
          durationSeconds: 1800,
          note: '',
          isDeep: false,
          isPast: false,
        },
        {
          id: 's2',
          projectId: p.id,
          taskId: newer.id,
          startedAt: '2026-04-13T09:00:00Z',
          endedAt: '2026-04-13T09:20:00Z',
          durationMinutes: 20,
          durationSeconds: 1200,
          note: '',
          isDeep: false,
          isPast: false,
        },
      ],
    });

    const ordered = selectProjectTasks(useStore.getState(), p.id).map((t) => t.id);
    expect(ordered).toEqual([newer.id, older.id]);
  });
});

describe('selectTemplateTasks', () => {
  it('returns only the global template tasks', () => {
    const p = makeProject('1');
    useStore.getState().createTask(null, 'Bug fix', true);
    useStore.getState().createTask(null, 'Feature', true);
    useStore.getState().createTask(p.id, 'Not a template');

    const templates = selectTemplateTasks(useStore.getState());
    expect(templates).toHaveLength(2);
    for (const t of templates) {
      expect(t.isTemplate).toBe(true);
      expect(t.projectId).toBeNull();
    }
  });
});

describe('selectTaskPriorSecondsToday', () => {
  const today = new Date('2026-04-13T12:00:00Z');

  it('sums today\'s completed session seconds for the task', () => {
    const p = makeProject('1');
    const task = useStore.getState().createTask(p.id, 'Work');
    useStore.setState({
      sessions: [
        {
          id: 's1',
          projectId: p.id,
          taskId: task.id,
          startedAt: '2026-04-13T09:00:00Z',
          endedAt: '2026-04-13T09:05:00Z',
          durationMinutes: 5,
          durationSeconds: 317,
          note: '',
          isDeep: false,
          isPast: false,
        },
        {
          id: 's2',
          projectId: p.id,
          taskId: task.id,
          startedAt: '2026-04-13T10:00:00Z',
          endedAt: '2026-04-13T10:03:00Z',
          durationMinutes: 3,
          durationSeconds: 183,
          note: '',
          isDeep: false,
          isPast: false,
        },
      ],
    });

    expect(selectTaskPriorSecondsToday(useStore.getState(), task.id, today)).toBe(500);
  });

  it("excludes other days' sessions", () => {
    const p = makeProject('1');
    const task = useStore.getState().createTask(p.id, 'Work');
    useStore.setState({
      sessions: [
        {
          id: 's-y',
          projectId: p.id,
          taskId: task.id,
          startedAt: '2026-04-12T09:00:00Z',
          endedAt: '2026-04-12T10:00:00Z',
          durationMinutes: 60,
          durationSeconds: 3600,
          note: '',
          isDeep: false,
          isPast: false,
        },
      ],
    });
    expect(selectTaskPriorSecondsToday(useStore.getState(), task.id, today)).toBe(0);
  });

  it('ignores in-progress sessions (endedAt null)', () => {
    const p = makeProject('1');
    const task = useStore.getState().createTask(p.id, 'Work');
    useStore.setState({
      sessions: [
        {
          id: 'live',
          projectId: p.id,
          taskId: task.id,
          startedAt: '2026-04-13T11:00:00Z',
          endedAt: null,
          durationMinutes: 0,
          durationSeconds: 0,
          note: '',
          isDeep: false,
          isPast: false,
        },
      ],
    });
    expect(selectTaskPriorSecondsToday(useStore.getState(), task.id, today)).toBe(0);
  });

  it('falls back to durationMinutes * 60 when durationSeconds is missing', () => {
    const p = makeProject('1');
    const task = useStore.getState().createTask(p.id, 'Work');
    useStore.setState({
      sessions: [
        {
          id: 'legacy',
          projectId: p.id,
          taskId: task.id,
          startedAt: '2026-04-13T09:00:00Z',
          endedAt: '2026-04-13T09:05:00Z',
          durationMinutes: 5,
          durationSeconds: undefined as unknown as number,
          note: '',
          isDeep: false,
          isPast: false,
        },
      ],
    });
    expect(selectTaskPriorSecondsToday(useStore.getState(), task.id, today)).toBe(300);
  });
});

describe('startSession with taskId', () => {
  it('stores the provided taskId on the new session', () => {
    const p = makeProject('1');
    const task = useStore.getState().createTask(p.id, 'Work');
    useStore.getState().startSession(p.id, { taskId: task.id });

    const session = useStore.getState().sessions[0];
    expect(session.taskId).toBe(task.id);
  });

  it('defaults taskId to null when not provided', () => {
    const p = makeProject('1');
    useStore.getState().startSession(p.id);
    expect(useStore.getState().sessions[0].taskId).toBeNull();
  });
});

describe('addPastSession with taskId', () => {
  it('stores the provided taskId on the past session', () => {
    const p = makeProject('1');
    const task = useStore.getState().createTask(p.id, 'Work');
    useStore
      .getState()
      .addPastSession(p.id, 30, '2026-04-13T08:00:00Z', { taskId: task.id });
    expect(useStore.getState().sessions[0].taskId).toBe(task.id);
  });
});
