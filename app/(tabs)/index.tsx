import { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../src/components/primitives/Card';
import { Timeline } from '../../src/components/primitives/Timeline';
import { UIText } from '../../src/components/primitives/UIText';
import { seedDemoData } from '../../src/dev/seedDemoData';
import { Header } from '../../src/features/home/Header';
import { ProjectCard } from '../../src/features/home/ProjectCard';
import { TodayCard } from '../../src/features/home/TodayCard';
import { useHomeData } from '../../src/features/home/useHomeData';
import { useStore } from '../../src/store';
import { colors } from '../../src/tokens/colors';
import type { Project } from '../../src/types';

const SCREEN_PAD_H = 22;

const formatDateLabel = (d: Date): string =>
  d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

const greetingFor = (d: Date): string => {
  const h = d.getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const HomeScreen = () => {
  const dailyGoalMinutes = useStore((s) => s.dailyGoalMinutes);
  const sessionCount = useStore((s) => s.sessions.length);
  const { todayMinutes, streak, timelineSessions, activeProjects, hasHistory } = useHomeData();

  useEffect(() => {
    if (__DEV__ && sessionCount === 0) {
      console.log('[dev] auto-seeding demo data');
      seedDemoData();
    }
  }, [sessionCount]);

  const now = new Date();
  const hint = hasHistory ? undefined : "Let's get going →";

  const handleStart = useCallback((project: Project) => {
    console.warn('Live timer — Phase 4 not yet wired', project.name);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Header
          dateLabel={formatDateLabel(now)}
          greeting={greetingFor(now)}
          streak={streak}
        />

        <TodayCard
          todayMinutes={todayMinutes}
          goalMinutes={dailyGoalMinutes}
          hint={hint}
        />

        <Card>
          <View style={styles.timelineCardBody}>
            <UIText variant="micro" color="sub">
              TODAY&apos;S TIMELINE
            </UIText>
            <Timeline sessions={timelineSessions} />
          </View>
        </Card>

        <UIText variant="micro" color="sub" style={styles.sectionLabel}>
          WHAT WILL YOU WORK ON?
        </UIText>

        <View style={styles.projects}>
          {activeProjects.map((p) => (
            <ProjectCard key={p.id} project={p} onStart={handleStart} />
          ))}
        </View>

        {__DEV__ ? (
          <Pressable onPress={seedDemoData} style={styles.devSeed}>
            <UIText variant="caption" color="muted">
              DEV · Seed demo data
            </UIText>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: SCREEN_PAD_H,
    paddingBottom: 32,
    gap: 14,
  },
  timelineCardBody: {
    padding: 18,
    gap: 12,
  },
  sectionLabel: {
    marginTop: 4,
  },
  projects: {
    gap: 10,
  },
  devSeed: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: colors.brd,
    backgroundColor: colors.surf,
  },
});

export default HomeScreen;
