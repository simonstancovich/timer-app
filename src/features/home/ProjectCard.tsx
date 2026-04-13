import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card } from '../../components/primitives/Card';
import { Pill } from '../../components/primitives/Pill';
import { Sparkline } from '../../components/primitives/Sparkline';
import { UIText } from '../../components/primitives/UIText';
import { colors, type ColorToken } from '../../tokens/colors';
import { isPresetProjectColor, type Project } from '../../types';

type ProjectCardProps = {
  project: Project;
  onStart: (project: Project) => void;
};

const HOT_THRESHOLD_RATIO = 0.75;

const hasNoSessionsThisWeek = (project: Project): boolean =>
  Math.max(...project.weekSessions) === 0;

const ProjectCardImpl = ({ project, onStart }: ProjectCardProps) => {
  const preset = isPresetProjectColor(project.color) ? project.color : null;
  const mainHex = preset ? colors[preset] : project.customColor ?? colors.ink;
  const lightToken: ColorToken = preset ? `${preset}Light` : 'brandLight';
  const sparklineColor: ColorToken = preset ? `${preset}Dark` : 'brand';
  const stripeColor: ColorToken = preset ?? 'brand';

  const pct = project.weeklyGoalMinutes > 0
    ? Math.min(100, (project.weekMinutes / project.weeklyGoalMinutes) * 100)
    : 0;

  const needsLove = hasNoSessionsThisWeek(project);
  const hot = !needsLove && project.weekMinutes >= project.weeklyGoalMinutes * HOT_THRESHOLD_RATIO;

  const handleStart = useCallback(() => onStart(project), [onStart, project]);

  return (
    <Card topStripe={{ pct, color: stripeColor, colorLight: lightToken }}>
      <View style={styles.body}>
        <View style={styles.leftCol}>
          <View style={styles.headerRow}>
            <View style={[styles.dot, { backgroundColor: mainHex }]} />
            <UIText variant="bodyLg" style={styles.name}>
              {project.name}
            </UIText>
            {hot ? (
              <Pill bg={lightToken}>
                <UIText variant="micro" color={stripeColor}>
                  HOT 🔥
                </UIText>
              </Pill>
            ) : null}
            {needsLove ? (
              <Pill bg="surf">
                <UIText variant="micro" color="muted">
                  NEEDS LOVE 🌱
                </UIText>
              </Pill>
            ) : null}
          </View>
          {project.lastNote ? (
            <UIText variant="caption" color="muted" numberOfLines={1}>
              ↳ {project.lastNote}
            </UIText>
          ) : null}
        </View>

        <View style={styles.rightCol}>
          <Sparkline data={project.weekSessions} color={sparklineColor} />
          <Pressable
            onPress={handleStart}
            accessibilityRole="button"
            accessibilityLabel={`Start ${project.name}`}
            style={[styles.play, { backgroundColor: mainHex }]}
          >
            <UIText variant="body" color="white" style={styles.playGlyph}>
              ▶
            </UIText>
          </Pressable>
        </View>
      </View>
    </Card>
  );
};

export const ProjectCard = memo(ProjectCardImpl);

const styles = StyleSheet.create({
  body: {
    paddingVertical: 15,
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  leftCol: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    color: colors.ink,
    flexShrink: 1,
  },
  rightCol: {
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: {
    marginLeft: 3,
  },
});
