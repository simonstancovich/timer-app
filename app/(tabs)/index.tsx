import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonoText } from '../../src/components/primitives/MonoText';
import { colors } from '../../src/tokens/colors';
import { spacing } from '../../src/tokens/spacing';
import { typography } from '../../src/tokens/typography';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.screenPadH, gap: spacing.xxl }}>
        <Text style={[typography.display, { color: colors.ink }]}>Fonts sandbox</Text>

        <View style={{ gap: spacing.md }}>
          <Text style={[typography.micro, { color: colors.sub }]}>SPACE MONO · TIMERS</Text>
          <MonoText size="xl">01:23:45</MonoText>
          <MonoText size="lg">00:42:18</MonoText>
          <MonoText size="md">02:07</MonoText>
          <MonoText size="sm" color="sub">
            09:45
          </MonoText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.micro, { color: colors.sub }]}>PLUS JAKARTA SANS · UI</Text>
          <Text style={[typography.bodyLg, { color: colors.ink }]}>Body large — 16 Bold</Text>
          <Text style={[typography.body, { color: colors.ink }]}>Body — 14 SemiBold</Text>
          <Text style={[typography.bodySm, { color: colors.ink }]}>Body small — 13 Medium</Text>
          <Text style={[typography.caption, { color: colors.sub }]}>
            Caption — 12 Regular secondary
          </Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text style={[typography.micro, { color: colors.sub }]}>BRAND COLORS</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.brand }} />
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.brandL }} />
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.brandD }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
