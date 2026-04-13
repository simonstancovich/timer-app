import { StyleSheet, Text, View } from 'react-native';
import { Card } from '../../components/primitives/Card';
import { MonoText } from '../../components/primitives/MonoText';
import { ProgressBar } from '../../components/primitives/ProgressBar';
import { UIText } from '../../components/primitives/UIText';
import { colors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { formatGoal, formatHoursMinutes } from '../../utils/time';

type TodayCardProps = {
  todayMinutes: number;
  goalMinutes: number;
  hint?: string;
};

export const TodayCard = ({ todayMinutes, goalMinutes, hint }: TodayCardProps) => {
  const pct = goalMinutes > 0 ? Math.min(100, (todayMinutes / goalMinutes) * 100) : 0;

  return (
    <Card topStripe={{ pct, color: 'brand', colorLight: 'brandLight' }}>
      <View style={styles.body}>
        <View style={styles.row}>
          <View style={styles.left}>
            <UIText variant="micro" color="sub">
              TODAY
            </UIText>
            <Text style={styles.time}>{formatHoursMinutes(todayMinutes)}</Text>
          </View>
          <View style={styles.right}>
            <MonoText size="md" color="brand" style={styles.pctText}>
              {`${Math.round(pct)}%`}
            </MonoText>
            <UIText variant="caption" color="sub">
              of {formatGoal(goalMinutes)}
            </UIText>
          </View>
        </View>
        <ProgressBar pct={pct} color="brand" />
        {hint ? (
          <UIText variant="caption" color="sub">
            {hint}
          </UIText>
        ) : null}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  body: {
    paddingLeft: 18,
    paddingRight: 22,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  right: {
    alignItems: 'flex-end',
    gap: 2,
  },
  pctText: {
    paddingRight: 4,
  },
  time: {
    ...typography.numXl,
    color: colors.ink,
    lineHeight: 50,
    includeFontPadding: false,
  },
});
