import { useCallback, useState } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { relativeLuminance } from '../../utils/color';
import { LIGHT_BG_THRESHOLD } from './scheme';
import type { DotItem } from './types';

const BG_TRANSITION_MS = 500;

export const useSetupColorState = (initial: DotItem) => {
  const initialIsLight = relativeLuminance(initial.hex) > LIGHT_BG_THRESHOLD;

  const [selected, setSelected] = useState<DotItem>(initial);
  const [isOnLight, setIsOnLight] = useState(initialIsLight);
  const bgColor = useSharedValue<string>(initial.hex);
  const schemeProgress = useSharedValue<number>(initialIsLight ? 1 : 0);

  const pick = useCallback(
    (item: DotItem) => {
      const nextIsLight = relativeLuminance(item.hex) > LIGHT_BG_THRESHOLD;
      setSelected(item);
      setIsOnLight(nextIsLight);
      bgColor.value = withTiming(item.hex, { duration: BG_TRANSITION_MS });
      schemeProgress.value = withTiming(nextIsLight ? 1 : 0, { duration: BG_TRANSITION_MS });
    },
    [bgColor, schemeProgress],
  );

  return { selected, isOnLight, bgColor, schemeProgress, pick };
};
