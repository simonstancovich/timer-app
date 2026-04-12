import { render } from '@testing-library/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientText } from './GradientText';
import { gradients } from '../../tokens/colors';

describe('GradientText', () => {
  it('renders children', () => {
    const { getAllByText } = render(<GradientText gradient="celebration">Actually enjoy it.</GradientText>);
    expect(getAllByText('Actually enjoy it.').length).toBeGreaterThan(0);
  });

  it('resolves the gradient name to its color stops', () => {
    const { UNSAFE_getByType } = render(
      <GradientText gradient="celebration">hello</GradientText>,
    );
    const linear = UNSAFE_getByType(LinearGradient);
    expect(linear.props.colors).toEqual(gradients.celebration);
  });
});
