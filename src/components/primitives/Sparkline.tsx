import Svg, { Rect } from 'react-native-svg';
import { colors, type ColorToken } from '../../tokens/colors';

type SparklineProps = {
  data: number[];
  color: ColorToken;
  width?: number;
  height?: number;
};

const BAR_WIDTH = 6;
const BAR_GAP = 2;
const BAR_RADIUS = 1.5;
const MIN_BAR_HEIGHT = 2;

export const Sparkline = ({ data, color, width = 56, height = 18 }: SparklineProps) => {
  const max = Math.max(...data, 0);
  const fill = colors[color];
  const maxBarHeight = Math.max(MIN_BAR_HEIGHT, height - MIN_BAR_HEIGHT);

  return (
    <Svg width={width} height={height}>
      {data.map((value, i) => {
        const h =
          max > 0 && value > 0
            ? Math.max(MIN_BAR_HEIGHT, (value / max) * maxBarHeight)
            : MIN_BAR_HEIGHT;
        const x = i * (BAR_WIDTH + BAR_GAP);
        const y = height - h;
        const opacity = value > 0 ? 0.85 : 0.15;
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            width={BAR_WIDTH}
            height={h}
            rx={BAR_RADIUS}
            ry={BAR_RADIUS}
            fill={fill}
            opacity={opacity}
          />
        );
      })}
    </Svg>
  );
};
