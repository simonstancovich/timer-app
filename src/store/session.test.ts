import { initialState, useStore } from './index';

const resetStore = () => {
  useStore.setState({ ...initialState });
};

const createTestProject = () => useStore.getState().createProject('Test', 'violet');

beforeEach(() => {
  jest.useFakeTimers();
  resetStore();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('startSession', () => {
  it('creates a session and sets activeSessionId', () => {
    const project = createTestProject();
    jest.setSystemTime(new Date('2026-04-13T10:00:00Z'));

    useStore.getState().startSession(project.id, 'deposit flow');

    const { sessions, activeSessionId } = useStore.getState();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].projectId).toBe(project.id);
    expect(sessions[0].note).toBe('deposit flow');
    expect(sessions[0].startedAt).toBe('2026-04-13T10:00:00.000Z');
    expect(sessions[0].endedAt).toBeNull();
    expect(sessions[0].durationMinutes).toBe(0);
    expect(sessions[0].isPast).toBe(false);
    expect(activeSessionId).toBe(sessions[0].id);
  });

  it('defaults note to empty string when omitted', () => {
    const project = createTestProject();
    useStore.getState().startSession(project.id);
    expect(useStore.getState().sessions[0].note).toBe('');
  });

  it('throws if a session is already active', () => {
    const project = createTestProject();
    useStore.getState().startSession(project.id);
    expect(() => useStore.getState().startSession(project.id)).toThrow(/already active/);
  });

  it('resets pause state when starting fresh', () => {
    const project = createTestProject();
    useStore.setState({ activePausedAt: '2026-01-01T00:00:00.000Z', activePausedAccumulatedMs: 5000 });
    useStore.getState().startSession(project.id);
    const { activePausedAt, activePausedAccumulatedMs } = useStore.getState();
    expect(activePausedAt).toBeNull();
    expect(activePausedAccumulatedMs).toBe(0);
  });
});

describe('pauseSession / resumeSession', () => {
  it('pauseSession sets activePausedAt to now', () => {
    const project = createTestProject();
    useStore.getState().startSession(project.id);
    jest.setSystemTime(new Date('2026-04-13T10:05:00Z'));
    useStore.getState().pauseSession();
    expect(useStore.getState().activePausedAt).toBe('2026-04-13T10:05:00.000Z');
  });

  it('pauseSession is a no-op without an active session', () => {
    useStore.getState().pauseSession();
    expect(useStore.getState().activePausedAt).toBeNull();
  });

  it('pauseSession is a no-op when already paused', () => {
    const project = createTestProject();
    useStore.getState().startSession(project.id);
    jest.setSystemTime(new Date('2026-04-13T10:05:00Z'));
    useStore.getState().pauseSession();
    const firstPauseAt = useStore.getState().activePausedAt;
    jest.setSystemTime(new Date('2026-04-13T10:06:00Z'));
    useStore.getState().pauseSession();
    expect(useStore.getState().activePausedAt).toBe(firstPauseAt);
  });

  it('resumeSession accumulates paused time', () => {
    const project = createTestProject();
    jest.setSystemTime(new Date('2026-04-13T10:00:00Z'));
    useStore.getState().startSession(project.id);
    jest.setSystemTime(new Date('2026-04-13T10:05:00Z'));
    useStore.getState().pauseSession();
    jest.setSystemTime(new Date('2026-04-13T10:07:00Z'));
    useStore.getState().resumeSession();

    expect(useStore.getState().activePausedAt).toBeNull();
    expect(useStore.getState().activePausedAccumulatedMs).toBe(2 * 60 * 1000);
  });

  it('resumeSession is a no-op when not paused', () => {
    const project = createTestProject();
    useStore.getState().startSession(project.id);
    useStore.getState().resumeSession();
    expect(useStore.getState().activePausedAccumulatedMs).toBe(0);
  });
});

describe('stopSession', () => {
  it('returns null when no active session', () => {
    expect(useStore.getState().stopSession()).toBeNull();
  });

  it('computes durationMinutes from elapsed minus paused time', () => {
    const project = createTestProject();
    jest.setSystemTime(new Date('2026-04-13T10:00:00Z'));
    useStore.getState().startSession(project.id);
    jest.setSystemTime(new Date('2026-04-13T10:20:00Z'));
    useStore.getState().pauseSession();
    jest.setSystemTime(new Date('2026-04-13T10:25:00Z'));
    useStore.getState().resumeSession();
    jest.setSystemTime(new Date('2026-04-13T10:45:00Z'));

    const completed = useStore.getState().stopSession();
    expect(completed).not.toBeNull();
    expect(completed!.durationMinutes).toBe(40);
    expect(completed!.endedAt).toBe('2026-04-13T10:45:00.000Z');
  });

  it('counts time paused at stop moment', () => {
    const project = createTestProject();
    jest.setSystemTime(new Date('2026-04-13T10:00:00Z'));
    useStore.getState().startSession(project.id);
    jest.setSystemTime(new Date('2026-04-13T10:30:00Z'));
    useStore.getState().pauseSession();
    jest.setSystemTime(new Date('2026-04-13T10:40:00Z'));

    const completed = useStore.getState().stopSession();
    expect(completed!.durationMinutes).toBe(30);
  });

  it('flags isDeep when duration >= 90 minutes', () => {
    const project = createTestProject();
    jest.setSystemTime(new Date('2026-04-13T10:00:00Z'));
    useStore.getState().startSession(project.id);
    jest.setSystemTime(new Date('2026-04-13T11:30:00Z'));
    const completed = useStore.getState().stopSession();
    expect(completed!.durationMinutes).toBe(90);
    expect(completed!.isDeep).toBe(true);
  });

  it('does not flag isDeep below 90 minutes', () => {
    const project = createTestProject();
    jest.setSystemTime(new Date('2026-04-13T10:00:00Z'));
    useStore.getState().startSession(project.id);
    jest.setSystemTime(new Date('2026-04-13T11:29:00Z'));
    const completed = useStore.getState().stopSession();
    expect(completed!.isDeep).toBe(false);
  });

  it('updates project totalMinutes, weekMinutes, weekSessions', () => {
    jest.setSystemTime(new Date('2026-04-15T10:00:00Z')); // Wednesday
    const project = createTestProject();
    useStore.getState().startSession(project.id);
    jest.setSystemTime(new Date('2026-04-15T10:45:00Z'));
    useStore.getState().stopSession();

    const updated = useStore.getState().projects[0];
    expect(updated.totalMinutes).toBe(45);
    expect(updated.weekMinutes).toBe(45);
    expect(updated.weekSessions[2]).toBe(1);
    expect(updated.weekSessions.reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('updates project.lastNote when session note is non-empty', () => {
    const project = createTestProject();
    useStore.getState().startSession(project.id, 'working on deposit flow');
    useStore.getState().stopSession();
    expect(useStore.getState().projects[0].lastNote).toBe('working on deposit flow');
  });

  it('keeps previous lastNote when session note is empty', () => {
    const project = createTestProject();
    useStore.setState({
      projects: [{ ...project, lastNote: 'previous' }],
    });
    useStore.getState().startSession(project.id);
    useStore.getState().stopSession();
    expect(useStore.getState().projects[0].lastNote).toBe('previous');
  });

  it('clears active session and pause state on stop', () => {
    const project = createTestProject();
    useStore.getState().startSession(project.id);
    useStore.getState().pauseSession();
    useStore.getState().stopSession();
    const { activeSessionId, activePausedAt, activePausedAccumulatedMs } = useStore.getState();
    expect(activeSessionId).toBeNull();
    expect(activePausedAt).toBeNull();
    expect(activePausedAccumulatedMs).toBe(0);
  });
});

describe('addPastSession', () => {
  it('creates a completed session with isPast=true', () => {
    jest.setSystemTime(new Date('2026-04-15T10:00:00Z'));
    const project = createTestProject();
    useStore.getState().addPastSession(project.id, 45, '2026-04-15T08:00:00.000Z', 'earlier work');

    const { sessions } = useStore.getState();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].isPast).toBe(true);
    expect(sessions[0].durationMinutes).toBe(45);
    expect(sessions[0].startedAt).toBe('2026-04-15T08:00:00.000Z');
    expect(sessions[0].endedAt).toBe('2026-04-15T08:45:00.000Z');
    expect(sessions[0].note).toBe('earlier work');
  });

  it('updates project totals', () => {
    jest.setSystemTime(new Date('2026-04-15T10:00:00Z')); // Wednesday
    const project = createTestProject();
    useStore.getState().addPastSession(project.id, 60, '2026-04-15T08:00:00.000Z');

    const updated = useStore.getState().projects[0];
    expect(updated.totalMinutes).toBe(60);
    expect(updated.weekMinutes).toBe(60);
    expect(updated.weekSessions[2]).toBe(1);
  });

  it('does not touch activeSessionId', () => {
    const project = createTestProject();
    useStore.getState().addPastSession(project.id, 30, '2026-04-15T08:00:00.000Z');
    expect(useStore.getState().activeSessionId).toBeNull();
  });

  it('flags isDeep for past sessions >= 90 minutes', () => {
    const project = createTestProject();
    useStore.getState().addPastSession(project.id, 120, '2026-04-15T08:00:00.000Z');
    expect(useStore.getState().sessions[0].isDeep).toBe(true);
  });
});
