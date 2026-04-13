import { renderHook } from '@testing-library/react-native';
import { initialState, useStore } from '../../store';
import { useHomeData } from './useHomeData';

const resetStore = () => useStore.setState({ ...initialState });

beforeEach(() => {
  jest.useFakeTimers();
  resetStore();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useHomeData timeline window', () => {
  it('defaults to a 9am–6pm window when there are no sessions and current time is earlier', () => {
    jest.setSystemTime(new Date('2026-04-13T08:00:00'));
    const { result } = renderHook(() => useHomeData());
    expect(result.current.timelineWindowMinutes).toBe(9 * 60);
  });

  it('extends the window to include a late session', () => {
    jest.setSystemTime(new Date('2026-04-13T19:00:00'));
    const project = useStore.getState().createProject('Test', 'violet');
    useStore.getState().addPastSession(project.id, 30, new Date('2026-04-13T18:50:00').toISOString());

    const { result } = renderHook(() => useHomeData());
    expect(result.current.timelineWindowMinutes).toBeGreaterThan(9 * 60);
    expect(result.current.timelineSessions).toHaveLength(1);
    expect(result.current.timelineSessions[0].startMinuteOffset).toBeGreaterThanOrEqual(0);
  });

  it('extends the window earlier if a session started before 9am', () => {
    jest.setSystemTime(new Date('2026-04-13T10:00:00'));
    const project = useStore.getState().createProject('Test', 'violet');
    useStore.getState().addPastSession(project.id, 30, new Date('2026-04-13T07:00:00').toISOString());

    const { result } = renderHook(() => useHomeData());
    expect(result.current.timelineSessions[0].startMinuteOffset).toBe(0);
    expect(result.current.timelineWindowMinutes).toBeGreaterThan(9 * 60);
  });

  it('filters out sessions from other days', () => {
    jest.setSystemTime(new Date('2026-04-13T12:00:00'));
    const project = useStore.getState().createProject('Test', 'violet');
    useStore
      .getState()
      .addPastSession(project.id, 30, new Date('2026-04-12T10:00:00').toISOString());
    useStore
      .getState()
      .addPastSession(project.id, 45, new Date('2026-04-13T10:00:00').toISOString());

    const { result } = renderHook(() => useHomeData());
    expect(result.current.timelineSessions).toHaveLength(1);
    expect(result.current.timelineSessions[0].durationMinutes).toBe(45);
    expect(result.current.todayMinutes).toBe(45);
  });
});
