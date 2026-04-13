import { fireEvent, render } from '@testing-library/react-native';
import { initialState, useStore } from '../../store';
import { colors } from '../../tokens/colors';
import type { Project } from '../../types';
import { LiveTimerScreen } from './LiveTimerScreen';

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

const mockNotificationAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-haptics', () => ({
  __esModule: true,
  notificationAsync: (...args: unknown[]) => mockNotificationAsync(...args),
  NotificationFeedbackType: { Success: 'success' },
}));

const resetStore = () => useStore.setState({ ...initialState });

const makeProject = (): Project => ({
  id: 'p1',
  name: 'Deep work',
  color: 'ocean',
  lastNote: '',
  weeklyGoalMinutes: 2400,
  weekSessions: [0, 0, 0, 0, 0, 0, 0],
  totalMinutes: 0,
  weekMinutes: 0,
  createdAt: new Date('2026-04-13T00:00:00Z').toISOString(),
  archived: false,
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-13T10:00:00Z'));
  resetStore();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  mockNotificationAsync.mockClear();
});

describe('LiveTimerScreen', () => {
  it('renders the project name in the header', () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);

    const { getByText } = render(<LiveTimerScreen project={project} />);
    expect(getByText(/TRACKING DEEP WORK/i)).toBeTruthy();
  });

  it('renders the elapsed timer at 00:00:00 on mount', () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);

    const { getByText } = render(<LiveTimerScreen project={project} />);
    expect(getByText('00:00:00')).toBeTruthy();
  });

  it('calls pauseSession when the pause control is tapped', () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);

    const { getByLabelText } = render(<LiveTimerScreen project={project} />);
    fireEvent.press(getByLabelText('Pause'));
    expect(useStore.getState().activePausedAt).not.toBeNull();
  });

  it('shows Resume + visible Paused label when paused, and resumes on tap', () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);
    useStore.getState().pauseSession();

    const { getByText, getByLabelText } = render(<LiveTimerScreen project={project} />);
    const label = getByText('Paused');
    const flat = flattenStyle(label.props.style);
    expect(flat.opacity).toBe(1);

    fireEvent.press(getByLabelText('Resume'));
    expect(useStore.getState().activePausedAt).toBeNull();
  });

  it('renders the Paused label hidden (opacity 0) while running', () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);

    const { getByText } = render(<LiveTimerScreen project={project} />);
    const flat = flattenStyle(getByText('Paused').props.style);
    expect(flat.opacity).toBe(0);
  });

  it('calls stopSession and clears active state on Stop & save', () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);

    const { getByLabelText } = render(<LiveTimerScreen project={project} />);
    fireEvent.press(getByLabelText('Stop & save'));

    expect(useStore.getState().activeSessionId).toBeNull();
  });

  it('uses dark foreground tokens on a mid-luminance color where ink has better contrast than white', () => {
    const project: Project = {
      ...makeProject(),
      color: 'custom',
      customColor: '#4CAF50',
      customColorDark: '#4CAF50',
    };
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);

    const { getByText } = render(<LiveTimerScreen project={project} />);
    const flat = flattenStyle(getByText('00:00:00').props.style);
    expect(flat.color).toBe(colors.ink);
  });

  it('uses dark foreground tokens when the project dark color is light-luminance', () => {
    const project: Project = {
      ...makeProject(),
      color: 'custom',
      customColor: '#FFE177',
      customColorDark: '#FBE79A',
    };
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);

    const { getByLabelText, getByText } = render(<LiveTimerScreen project={project} />);
    const timerText = getByText('00:00:00');
    const flatTimer = flattenStyle(timerText.props.style);
    expect(flatTimer.color).toBe(colors.ink);

    const stop = getByLabelText('Stop & save');
    const flatStop = flattenStyle(stop.props.style);
    expect(flatStop.backgroundColor).toBe(colors.ink);
  });

  it('uses light foreground tokens on a dark project background', () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);

    const { getByText } = render(<LiveTimerScreen project={project} />);
    const flat = flattenStyle(getByText('00:00:00').props.style);
    expect(flat.color).toBe(colors.white);
  });

  it("adds today's prior session time for this project to the displayed elapsed", () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore
      .getState()
      .addPastSession(project.id, 12, new Date('2026-04-13T08:00:00Z').toISOString());
    useStore
      .getState()
      .addPastSession(project.id, 3, new Date('2026-04-13T09:30:00Z').toISOString());
    useStore.getState().startSession(project.id);

    const { getByText } = render(<LiveTimerScreen project={project} />);
    expect(getByText('00:15:00')).toBeTruthy();
  });

  it("ignores other days' sessions when computing today's prior total", () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore
      .getState()
      .addPastSession(project.id, 20, new Date('2026-04-12T10:00:00Z').toISOString());
    useStore.getState().startSession(project.id);

    const { getByText } = render(<LiveTimerScreen project={project} />);
    expect(getByText('00:00:00')).toBeTruthy();
  });

  it('updates the active session note as the user types', () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);

    const { getByLabelText } = render(<LiveTimerScreen project={project} />);
    fireEvent.changeText(getByLabelText('Session note'), 'deposit flow');

    const active = useStore.getState().sessions[0];
    expect(active.note).toBe('deposit flow');
  });

  it('renders the existing session note as the input value', () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id, 'prefilled');

    const { getByLabelText } = render(<LiveTimerScreen project={project} />);
    expect(getByLabelText('Session note').props.value).toBe('prefilled');
  });

  it('swaps the TRACKING label for a DEEP WORK badge after 90 minutes', () => {
    jest.setSystemTime(new Date('2026-04-13T11:31:00Z'));
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);
    const started = useStore.getState().sessions[0];
    useStore.setState({
      sessions: [{ ...started, startedAt: new Date('2026-04-13T10:00:00Z').toISOString() }],
    });

    const { queryByText } = render(<LiveTimerScreen project={project} />);
    expect(queryByText(/DEEP WORK/)).toBeTruthy();
    expect(queryByText(/TRACKING/)).toBeNull();
  });

  it('fires a success haptic once when the 1h milestone is crossed', () => {
    jest.setSystemTime(new Date('2026-04-13T11:00:01Z'));
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);
    const started = useStore.getState().sessions[0];
    useStore.setState({
      sessions: [{ ...started, startedAt: new Date('2026-04-13T10:00:00Z').toISOString() }],
    });

    render(<LiveTimerScreen project={project} />);
    expect(mockNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockNotificationAsync).toHaveBeenCalledWith('success');
  });

  it('does not fire a haptic before any milestone is reached', () => {
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);

    render(<LiveTimerScreen project={project} />);
    expect(mockNotificationAsync).not.toHaveBeenCalled();
  });

  it('fires haptics for both 1h and 2h when both have been crossed', () => {
    jest.setSystemTime(new Date('2026-04-13T12:00:01Z'));
    const project = makeProject();
    useStore.setState({ projects: [project] });
    useStore.getState().startSession(project.id);
    const started = useStore.getState().sessions[0];
    useStore.setState({
      sessions: [{ ...started, startedAt: new Date('2026-04-13T10:00:00Z').toISOString() }],
    });

    render(<LiveTimerScreen project={project} />);
    expect(mockNotificationAsync).toHaveBeenCalledTimes(2);
  });
});

type AnyStyle = Record<string, unknown>;

function flattenStyle(style: unknown): AnyStyle {
  if (Array.isArray(style)) {
    return style.reduce<AnyStyle>((acc, s) => ({ ...acc, ...flattenStyle(s) }), {});
  }
  if (style && typeof style === 'object') return style as AnyStyle;
  return {};
}
