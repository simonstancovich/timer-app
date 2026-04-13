import { fireEvent, render } from '@testing-library/react-native';
import { initialState, useStore } from '../../store';
import type { Task } from '../../types';
import { TaskBubbles } from './TaskBubbles';

jest.mock('expo-haptics', () => ({
  __esModule: true,
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success' },
}));

const resetStore = () => useStore.setState({ ...initialState, tasks: [] });

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-04-13T10:00:00Z'));
  resetStore();
});

afterEach(() => {
  jest.useRealTimers();
});

const makeProject = () => useStore.getState().createProject('Courtify', 'ocean');

describe('TaskBubbles', () => {
  it('renders project tasks followed by templates', () => {
    const project = makeProject();
    useStore.getState().createTask(project.id, 'Deposit flow');
    useStore.getState().createTask(null, 'Bug fix', true);
    useStore.getState().createTask(null, 'Feature', true);

    const { getByText } = render(
      <TaskBubbles
        projectId={project.id}
        activeTaskId={null}
        tone="light"
        onSelectTask={jest.fn()}
      />,
    );

    expect(getByText('Deposit flow')).toBeTruthy();
    expect(getByText('Bug fix')).toBeTruthy();
    expect(getByText('Feature')).toBeTruthy();
  });

  it('deduplicates a template by name when the project already has a task of the same name', () => {
    const project = makeProject();
    useStore.getState().createTask(project.id, 'Bug fix');
    useStore.getState().createTask(null, 'Bug fix', true);
    useStore.getState().createTask(null, 'Feature', true);

    const { getAllByText } = render(
      <TaskBubbles
        projectId={project.id}
        activeTaskId={null}
        tone="light"
        onSelectTask={jest.fn()}
      />,
    );
    expect(getAllByText('Bug fix')).toHaveLength(1);
  });

  it('calls onSelectTask when a bubble is pressed', () => {
    const project = makeProject();
    const task = useStore.getState().createTask(project.id, 'Deposit flow');
    const onSelectTask = jest.fn<void, [Task]>();

    const { getByLabelText } = render(
      <TaskBubbles
        projectId={project.id}
        activeTaskId={null}
        tone="light"
        onSelectTask={onSelectTask}
      />,
    );

    fireEvent.press(getByLabelText('Deposit flow'));
    expect(onSelectTask).toHaveBeenCalledTimes(1);
    expect(onSelectTask).toHaveBeenCalledWith(task);
  });

  it('keeps the existing order while mounted (new tasks appended)', () => {
    const project = makeProject();
    const a = useStore.getState().createTask(project.id, 'Alpha');
    const b = useStore.getState().createTask(project.id, 'Beta');

    const { getAllByTestId, rerender } = render(
      <TaskBubbles
        projectId={project.id}
        activeTaskId={null}
        tone="light"
        onSelectTask={jest.fn()}
      />,
    );
    const getBubbleOrder = () =>
      getAllByTestId(/^bubble-/).map((n) => n.props.accessibilityLabel as string);

    expect(getBubbleOrder()).toEqual([a.name, b.name]);

    useStore.setState({
      sessions: [
        {
          id: 's1',
          projectId: project.id,
          taskId: b.id,
          startedAt: '2026-04-13T09:00:00Z',
          endedAt: '2026-04-13T09:30:00Z',
          durationMinutes: 30,
          durationSeconds: 1800,
          note: '',
          isDeep: false,
          isPast: false,
        },
      ],
    });
    rerender(
      <TaskBubbles
        projectId={project.id}
        activeTaskId={b.id}
        tone="light"
        onSelectTask={jest.fn()}
      />,
    );
    expect(getBubbleOrder()).toEqual([a.name, b.name]);

    const c = useStore.getState().createTask(project.id, 'Gamma');
    rerender(
      <TaskBubbles
        projectId={project.id}
        activeTaskId={b.id}
        tone="light"
        onSelectTask={jest.fn()}
      />,
    );
    expect(getBubbleOrder()).toEqual([a.name, b.name, c.name]);
  });

  it('long-pressing a template enters edit mode and rename commits on submit', () => {
    const project = makeProject();
    const template = useStore.getState().createTask(null, 'Bug fix', true);

    const { getByLabelText } = render(
      <TaskBubbles
        projectId={project.id}
        activeTaskId={null}
        tone="light"
        onSelectTask={jest.fn()}
      />,
    );
    const bubble = getByLabelText('Bug fix');
    fireEvent(bubble, 'longPress');

    const input = getByLabelText('Edit Bug fix');
    fireEvent.changeText(input, 'Bugfix');
    fireEvent(input, 'submitEditing');

    const after = useStore.getState().tasks.find((t) => t.id === template.id);
    expect(after?.name).toBe('Bugfix');
  });

  it('long-press does nothing on non-template tasks', () => {
    const project = makeProject();
    const task = useStore.getState().createTask(project.id, 'Deposit flow');

    const { getByLabelText, queryByLabelText } = render(
      <TaskBubbles
        projectId={project.id}
        activeTaskId={null}
        tone="light"
        onSelectTask={jest.fn()}
      />,
    );
    fireEvent(getByLabelText('Deposit flow'), 'longPress');
    expect(queryByLabelText('Edit Deposit flow')).toBeNull();
    expect(useStore.getState().tasks.find((t) => t.id === task.id)?.name).toBe('Deposit flow');
  });

  it("marks the active task's bubble as selected", () => {
    const project = makeProject();
    const task = useStore.getState().createTask(project.id, 'Deposit flow');

    const { getByLabelText } = render(
      <TaskBubbles
        projectId={project.id}
        activeTaskId={task.id}
        tone="light"
        onSelectTask={jest.fn()}
      />,
    );
    expect(getByLabelText('Deposit flow').props.accessibilityState?.selected).toBe(true);
  });
});
