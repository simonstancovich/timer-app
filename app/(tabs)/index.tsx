import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/primitives/Card';
import { GradientText } from '../../src/components/primitives/GradientText';
import { MonoText } from '../../src/components/primitives/MonoText';
import { Pill } from '../../src/components/primitives/Pill';
import { ProgressBar } from '../../src/components/primitives/ProgressBar';
import { Sparkline } from '../../src/components/primitives/Sparkline';
import { UIText } from '../../src/components/primitives/UIText';
import { colors } from '../../src/tokens/colors';
import { spacing } from '../../src/tokens/spacing';

const HomeScreen = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.screenPadH, gap: spacing.xxl }}>
        <UIText variant="display">Primitives sandbox</UIText>

        <View style={{ gap: spacing.sm }}>
          <UIText variant="micro" color="sub">
            PROGRESS BARS
          </UIText>
          <ProgressBar pct={28} color="brand" />
          <ProgressBar pct={72} color="ember" bgColor="emberLight" />
          <ProgressBar pct={100} color="forest" height={10} radius={5} />
        </View>

        <View style={{ gap: spacing.sm }}>
          <UIText variant="micro" color="sub">
            SPARKLINES
          </UIText>
          <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
            <Sparkline data={[2, 4, 1, 6, 3, 0, 5]} color="violet" />
            <Sparkline data={[0, 0, 3, 2, 5, 4, 1]} color="ocean" />
            <Sparkline data={[1, 1, 1, 1, 1, 1, 1]} color="forest" />
            <Sparkline data={[0, 0, 0, 0, 0, 0, 0]} color="muted" />
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <UIText variant="micro" color="sub">
            GRADIENT TEXT
          </UIText>
          <GradientText
            gradient="celebration"
            variant="display"
            style={{ fontSize: 34, letterSpacing: -1 }}
          >
            Actually enjoy it.
          </GradientText>
        </View>

        <View style={{ gap: spacing.md }}>
          <UIText variant="micro" color="sub">
            SPACE MONO · TIMERS
          </UIText>
          <MonoText size="xl">01:23:45</MonoText>
          <MonoText size="lg">00:42:18</MonoText>
          <MonoText size="md">02:07</MonoText>
          <MonoText size="sm" color="sub">
            09:45
          </MonoText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <UIText variant="micro" color="sub">
            PLUS JAKARTA SANS · UI
          </UIText>
          <UIText variant="bodyLg">Body large — 16 Bold</UIText>
          <UIText variant="body">Body — 14 SemiBold</UIText>
          <UIText variant="bodySm">Body small — 13 Medium</UIText>
          <UIText variant="caption" color="sub">
            Caption — 12 Regular secondary
          </UIText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <UIText variant="micro" color="sub">
            PILLS
          </UIText>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Pill bg="brandLight">
              <UIText variant="micro" color="brand">
                HOT
              </UIText>
            </Pill>
            <Pill bg="surf">
              <UIText variant="micro" color="muted">
                NEEDS LOVE
              </UIText>
            </Pill>
            <Pill bg="streakBg">
              <UIText variant="micro" color="streakText">
                7 DAY STREAK
              </UIText>
            </Pill>
            <Pill bg="violetLight" radius={12}>
              <UIText variant="micro" color="violet">
                VIOLET
              </UIText>
            </Pill>
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <UIText variant="micro" color="sub">
            CARDS
          </UIText>
          <Card>
            <View style={{ padding: spacing.lg, gap: spacing.xs }}>
              <UIText variant="bodyLg">Plain card</UIText>
              <UIText variant="caption" color="sub">
                White surface with 1px border
              </UIText>
            </View>
          </Card>
          <Card topStripe={{ pct: 72, color: 'brand', colorLight: 'brandLight' }}>
            <View style={{ padding: spacing.lg, gap: spacing.xs }}>
              <UIText variant="bodyLg">Today</UIText>
              <MonoText size="lg">6:32</MonoText>
              <UIText variant="caption" color="sub">
                72% of 9h goal
              </UIText>
            </View>
          </Card>
          <Card topStripe={{ pct: 42, color: 'ember', colorLight: 'emberLight' }}>
            <View style={{ padding: spacing.lg, gap: spacing.xs }}>
              <UIText variant="bodyLg">Ember project</UIText>
              <UIText variant="caption" color="sub">
                Uses project color tokens by name
              </UIText>
            </View>
          </Card>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
