import { act, renderHook } from '@testing-library/react-native';
import { initialState, useStore } from '../store';
import { useTimer } from './useTimer';

const resetStore = () => useStore.setState({ ...initialState });

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-13T10:00:00Z'));
  resetStore();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useTimer', () => {
  it('returns inactive state when no session is running', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current).toEqual({ elapsedSeconds: 0, isActive: false, isPaused: false });
  });

  it('reports elapsed seconds while a session is running', () => {
    const project = useStore.getState().createProject('Test', 'violet');
    act(() => useStore.getState().startSession(project.id));

    const { result } = renderHook(() => useTimer());
    expect(result.current.isActive).toBe(true);
    expect(result.current.elapsedSeconds).toBe(0);

    act(() => {
      jest.advanceTimersByTime(30_000);
    });
    expect(result.current.elapsedSeconds).toBe(30);

    act(() => {
      jest.advanceTimersByTime(270_000);
    });
    expect(result.current.elapsedSeconds).toBe(300);
  });

  it('freezes elapsed seconds while paused', () => {
    const project = useStore.getState().createProject('Test', 'violet');
    act(() => useStore.getState().startSession(project.id));

    const { result } = renderHook(() => useTimer());

    act(() => {
      jest.advanceTimersByTime(120_000);
    });
    expect(result.current.elapsedSeconds).toBe(120);

    act(() => {
      useStore.getState().pauseSession();
    });
    expect(result.current.isPaused).toBe(true);

    act(() => {
      jest.advanceTimersByTime(150_000);
    });
    expect(result.current.elapsedSeconds).toBe(120);
  });

  it('resumes counting after unpause, excluding the paused interval', () => {
    const project = useStore.getState().createProject('Test', 'violet');
    act(() => useStore.getState().startSession(project.id));

    const { result } = renderHook(() => useTimer());

    act(() => {
      jest.advanceTimersByTime(120_000);
    });
    act(() => {
      useStore.getState().pauseSession();
    });

    act(() => {
      jest.advanceTimersByTime(180_000);
    });
    act(() => {
      useStore.getState().resumeSession();
    });

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current.elapsedSeconds).toBe(180);
  });

  it('returns to zero after stopSession clears the active session', () => {
    const project = useStore.getState().createProject('Test', 'violet');
    act(() => useStore.getState().startSession(project.id));

    const { result } = renderHook(() => useTimer());
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(result.current.elapsedSeconds).toBe(60);

    act(() => {
      useStore.getState().stopSession();
    });
    expect(result.current).toEqual({ elapsedSeconds: 0, isActive: false, isPaused: false });
  });
});
