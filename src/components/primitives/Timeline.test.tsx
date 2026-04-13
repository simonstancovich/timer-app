import { fireEvent, render, type RenderAPI } from '@testing-library/react-native';
import { View } from 'react-native';
import { Timeline, type TimelineSession } from './Timeline';
import { colors } from '../../tokens/colors';

const CONTAINER_WIDTH = 300;
const WINDOW = 540;

type Host = ReturnType<RenderAPI['getByTestId']>;

function fireLayout(host: Host, width = CONTAINER_WIDTH) {
  fireEvent(host, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width, height: 24 } },
  });
}

const sampleSessions: TimelineSession[] = [
  { startMinuteOffset: 0, durationMinutes: 60, color: 'violet', label: 'Morning' },
  { startMinuteOffset: 120, durationMinutes: 90, color: 'ember', label: 'Afternoon', isLive: true },
];

describe('Timeline', () => {
  it('renders only the track when sessions are empty', () => {
    const { UNSAFE_getAllByType, getByTestId } = render(
      <Timeline testID="tl" sessions={[]} />,
    );
    fireLayout(getByTestId('tl'));
    const views = UNSAFE_getAllByType(View);
    const withColors = views.filter((v) => {
      const flat = flattenStyle(v.props.style);
      return typeof flat.backgroundColor === 'string';
    });
    expect(withColors).toHaveLength(1);
    expect(flattenStyle(withColors[0].props.style).backgroundColor).toBe(colors.surf);
  });

  it('renders one block per session after layout', () => {
    const { UNSAFE_getAllByType, getByTestId } = render(
      <Timeline testID="tl" sessions={sampleSessions} />,
    );
    fireLayout(getByTestId('tl'));
    const blocks = UNSAFE_getAllByType(View).filter(
      (v) => flattenStyle(v.props.style).backgroundColor === colors.violet ||
        flattenStyle(v.props.style).backgroundColor === colors.ember,
    );
    expect(blocks).toHaveLength(2);
  });

  it('paints each block in its project color and stripe in the *Dark token', () => {
    const { UNSAFE_getAllByType, getByTestId } = render(
      <Timeline testID="tl" sessions={sampleSessions} />,
    );
    fireLayout(getByTestId('tl'));
    const bgs = UNSAFE_getAllByType(View).map((v) => flattenStyle(v.props.style).backgroundColor);
    expect(bgs).toContain(colors.violet);
    expect(bgs).toContain(colors.violetDark);
    expect(bgs).toContain(colors.ember);
    expect(bgs).toContain(colors.emberDark);
  });

  it('positions and sizes blocks from minute offsets and the window', () => {
    const { UNSAFE_getAllByType, getByTestId } = render(
      <Timeline testID="tl" sessions={sampleSessions} />,
    );
    fireLayout(getByTestId('tl'));
    const violetBlock = UNSAFE_getAllByType(View).find(
      (v) => flattenStyle(v.props.style).backgroundColor === colors.violet,
    );
    const emberBlock = UNSAFE_getAllByType(View).find(
      (v) => flattenStyle(v.props.style).backgroundColor === colors.ember,
    );
    expect(flattenStyle(violetBlock!.props.style).left).toBeCloseTo(0);
    expect(flattenStyle(violetBlock!.props.style).width).toBeCloseTo(
      (60 / WINDOW) * CONTAINER_WIDTH,
    );
    expect(flattenStyle(emberBlock!.props.style).left).toBeCloseTo(
      (120 / WINDOW) * CONTAINER_WIDTH,
    );
    expect(flattenStyle(emberBlock!.props.style).width).toBeCloseTo(
      (90 / WINDOW) * CONTAINER_WIDTH,
    );
  });

  it('enforces a 4px minimum block width for very short sessions', () => {
    const tiny: TimelineSession[] = [
      { startMinuteOffset: 0, durationMinutes: 1, color: 'teal', label: 'Blip' },
    ];
    const { UNSAFE_getAllByType, getByTestId } = render(
      <Timeline testID="tl" sessions={tiny} />,
    );
    fireLayout(getByTestId('tl'));
    const block = UNSAFE_getAllByType(View).find(
      (v) => flattenStyle(v.props.style).backgroundColor === colors.teal,
    );
    expect(flattenStyle(block!.props.style).width).toBe(4);
  });

  it('renders a forest-green dot only for the live session', () => {
    const { UNSAFE_getAllByType, getByTestId } = render(
      <Timeline testID="tl" sessions={sampleSessions} />,
    );
    fireLayout(getByTestId('tl'));
    const dots = UNSAFE_getAllByType(View).filter(
      (v) => flattenStyle(v.props.style).backgroundColor === colors.forest,
    );
    expect(dots).toHaveLength(1);
  });

  it('renders no dot when no session is live', () => {
    const noLive: TimelineSession[] = [
      { startMinuteOffset: 0, durationMinutes: 60, color: 'violet', label: 'A' },
    ];
    const { UNSAFE_getAllByType, getByTestId } = render(
      <Timeline testID="tl" sessions={noLive} />,
    );
    fireLayout(getByTestId('tl'));
    const dots = UNSAFE_getAllByType(View).filter(
      (v) => flattenStyle(v.props.style).backgroundColor === colors.forest,
    );
    expect(dots).toHaveLength(0);
  });

  it('merges a style override onto the container', () => {
    const { getByTestId } = render(
      <Timeline testID="tl" sessions={[]} style={{ marginTop: 12 }} />,
    );
    expect(flattenStyle(getByTestId('tl').props.style).marginTop).toBe(12);
  });

  it('renders nothing session-shaped before layout has measured width', () => {
    const { UNSAFE_getAllByType } = render(<Timeline sessions={sampleSessions} />);
    const projectColored = UNSAFE_getAllByType(View).filter((v) => {
      const bg = flattenStyle(v.props.style).backgroundColor;
      return bg === colors.violet || bg === colors.ember;
    });
    expect(projectColored).toHaveLength(0);
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
