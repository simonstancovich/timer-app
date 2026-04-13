import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
  type ListRenderItem,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ColorDot,
  DOT_GAP,
  DOT_SCALE_ACTIVE,
  DOT_SIZE,
} from '../../src/features/setup/ColorDot';
import { CtaButton } from '../../src/features/setup/CtaButton';
import { generatedAtIndex } from '../../src/features/setup/generator';
import {
  SCHEMES,
  useSchemeInputStyle,
  useSchemeTextColor,
  useSchemeViewBackground,
} from '../../src/features/setup/scheme';
import type { DotItem } from '../../src/features/setup/types';
import { useSetupColorState } from '../../src/features/setup/useSetupColorState';
import { useStore } from '../../src/store';
import { colors } from '../../src/tokens/colors';
import type { PresetProjectColor } from '../../src/types';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

const PRESET_ITEMS: DotItem[] = (
  ['violet', 'ocean', 'ember', 'forest', 'rose', 'amber', 'teal'] as const satisfies readonly PresetProjectColor[]
).map((c) => ({
  kind: 'preset',
  preset: c,
  hex: colors[c],
  dark: colors[`${c}Dark`],
  key: `p-${c}`,
}));

const INITIAL_SELECTION: DotItem =
  PRESET_ITEMS.find((p) => p.kind === 'preset' && p.preset === 'violet') ?? PRESET_ITEMS[0]!;

const INITIAL_GENERATED_COUNT = 60;
const GENERATE_BATCH = 60;
const SCREEN_HORIZONTAL_PADDING = 28;
const DOT_CELL_PAD = 10;

const SetupScreen = () => {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const createProject = useStore((s) => s.createProject);
  const setOnboardingDone = useStore((s) => s.setOnboardingDone);

  const [name, setName] = useState('');
  const [generatedCount, setGeneratedCount] = useState(INITIAL_GENERATED_COUNT);

  const { selected, isOnLight, bgColor, schemeProgress, pick } =
    useSetupColorState(INITIAL_SELECTION);

  const items = useMemo<DotItem[]>(
    () => [
      ...PRESET_ITEMS,
      ...Array.from({ length: generatedCount }, (_, i) => {
        const g = generatedAtIndex(i);
        return { kind: 'custom' as const, index: i, hex: g.hex, dark: g.dark, key: `g-${i}` };
      }),
    ],
    [generatedCount],
  );

  const trimmedName = name.trim();
  const isReady = trimmedName.length > 0;
  const ctaWidth = screenWidth - SCREEN_HORIZONTAL_PADDING * 2;
  const ctaText = isReady ? `Start tracking "${trimmedName}" →` : 'Start tracking →';
  const dotActiveBorderColor = isOnLight
    ? SCHEMES.onLight.dotActiveBorder
    : SCHEMES.onDark.dotActiveBorder;
  const placeholderColor = isOnLight
    ? SCHEMES.onLight.inputPlaceholder
    : SCHEMES.onDark.inputPlaceholder;

  const handleStart = () => {
    if (!isReady) return;
    if (selected.kind === 'preset') {
      createProject(trimmedName, selected.preset);
    } else {
      createProject(trimmedName, 'custom', { hex: selected.hex, dark: selected.dark });
    }
    setOnboardingDone(true);
    router.replace('/(tabs)/' as Href);
  };

  const rootAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: bgColor.value,
  }));

  const labelAnimated = useSchemeTextColor(schemeProgress, 'label');
  const headingAnimated = useSchemeTextColor(schemeProgress, 'heading');
  const subAnimated = useSchemeTextColor(schemeProgress, 'sub');
  const inputAnimated = useSchemeInputStyle(schemeProgress);
  const ctaIdleAnimated = useSchemeViewBackground(schemeProgress, 'ctaIdleBg');
  const ctaIdleTextAnimated = useSchemeTextColor(schemeProgress, 'ctaIdleText');

  const renderItem = useCallback<ListRenderItem<DotItem>>(
    ({ item }) => (
      <ColorDot
        item={item}
        isActive={item.key === selected.key}
        onPick={pick}
        activeBorderColor={dotActiveBorderColor}
      />
    ),
    [selected.key, pick, dotActiveBorderColor],
  );

  return (
    <Animated.View style={[styles.root, rootAnimatedStyle]}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Animated.Text style={[styles.label, labelAnimated]}>QUICK SETUP</Animated.Text>
            <Animated.Text style={[styles.heading, headingAnimated]}>
              Name your{'\n'}first project
            </Animated.Text>
            <Animated.Text style={[styles.sub, subAnimated]}>
              Pick a color — scroll for more.
            </Animated.Text>
          </View>

          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dotRow}
            onEndReached={() => setGeneratedCount((c) => c + GENERATE_BATCH)}
            onEndReachedThreshold={2}
            snapToInterval={DOT_SIZE + DOT_GAP}
            snapToAlignment="start"
            decelerationRate="normal"
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={9}
            getItemLayout={(_, index) => ({
              length: DOT_SIZE + DOT_GAP,
              offset: (DOT_SIZE + DOT_GAP) * index,
              index,
            })}
            style={styles.dotList}
          />

          <AnimatedTextInput
            value={name}
            onChangeText={setName}
            placeholder="Project name"
            placeholderTextColor={placeholderColor}
            style={[styles.input, inputAnimated]}
            returnKeyType="done"
            onSubmitEditing={handleStart}
            autoCapitalize="words"
            autoCorrect={false}
            autoFocus
          />

          <View style={styles.spacer} />

          <View style={styles.ctaWrap}>
            <CtaButton
              label={ctaText}
              isReady={isReady}
              activeDark={selected.dark}
              width={ctaWidth}
              onPress={handleStart}
              idleBgAnimated={ctaIdleAnimated}
              idleTextAnimated={ctaIdleTextAnimated}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    marginTop: 24,
    gap: 10,
  },
  label: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  heading: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 28,
    lineHeight: 34,
  },
  sub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
  },
  dotList: {
    marginTop: 36,
    flexGrow: 0,
  },
  dotRow: {
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    paddingVertical: DOT_CELL_PAD,
    gap: DOT_GAP,
    alignItems: 'center',
    minHeight: DOT_SIZE * DOT_SCALE_ACTIVE + DOT_CELL_PAD * 2,
  },
  input: {
    marginTop: 24,
    marginHorizontal: SCREEN_HORIZONTAL_PADDING,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 17,
  },
  spacer: {
    flex: 1,
  },
  ctaWrap: {
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    alignItems: 'center',
  },
});

export default SetupScreen;
