import { render } from '@testing-library/react-native';
import { Rect } from 'react-native-svg';
import { Sparkline } from './Sparkline';
import { colors } from '../../tokens/colors';

describe('Sparkline', () => {
  it('renders one bar per data point', () => {
    const { UNSAFE_getAllByType } = render(
      <Sparkline data={[1, 2, 3, 4, 5, 6, 7]} color="violet" />,
    );
    expect(UNSAFE_getAllByType(Rect)).toHaveLength(7);
  });

  it('fills bars with the resolved color token', () => {
    const { UNSAFE_getAllByType } = render(<Sparkline data={[1, 2, 3]} color="violet" />);
    for (const bar of UNSAFE_getAllByType(Rect)) {
      expect(bar.props.fill).toBe(colors.violet);
    }
  });

  it('renders empty days at low opacity (0.15) and active days at 0.85', () => {
    const { UNSAFE_getAllByType } = render(
      <Sparkline data={[0, 3, 0, 5, 0, 0, 1]} color="ocean" />,
    );
    const bars = UNSAFE_getAllByType(Rect);
    const data = [0, 3, 0, 5, 0, 0, 1];
    bars.forEach((bar, i) => {
      expect(bar.props.opacity).toBe(data[i] > 0 ? 0.85 : 0.15);
    });
  });

  it('scales bar heights proportional to the max value', () => {
    const { UNSAFE_getAllByType } = render(<Sparkline data={[0, 5, 10]} color="violet" height={18} />);
    const heights = UNSAFE_getAllByType(Rect).map((b) => b.props.height);
    expect(heights[2]).toBeGreaterThan(heights[1]);
    expect(heights[1]).toBeGreaterThan(heights[0]);
  });
});
