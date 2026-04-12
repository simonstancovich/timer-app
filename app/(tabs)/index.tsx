import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/primitives/Card';
import { MonoText } from '../../src/components/primitives/MonoText';
import { Pill } from '../../src/components/primitives/Pill';
import { UIText } from '../../src/components/primitives/UIText';
import { colors } from '../../src/tokens/colors';
import { spacing } from '../../src/tokens/spacing';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.screenPadH, gap: spacing.xxl }}>
        <UIText variant="display">Primitives sandbox</UIText>

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
}
