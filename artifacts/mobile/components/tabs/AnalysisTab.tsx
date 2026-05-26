import { Feather } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 48;
const CHART_H = 120;

interface Props {
  date: string;
}

function CircularProgress({ value, size = 90, stroke = 7, color }: { value: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(Math.max(value, 0), 1);
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

function MiniLineChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const maxVal = Math.max(...data, 0.01);
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * CHART_W;
    const y = CHART_H - (v / maxVal) * CHART_H * 0.85 - 8;
    return `${x},${y}`;
  }).join(' ');

  const pathPoints = data.map((v, i) => {
    const x = (i / (data.length - 1)) * CHART_W;
    const y = CHART_H - (v / maxVal) * CHART_H * 0.85 - 8;
    return `${x},${y}`;
  });
  const areaPath = `M0,${CHART_H} L${pathPoints.join(' L')} L${CHART_W},${CHART_H} Z`;

  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Path d={areaPath} fill={`${color}18`} />
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

function StreakBar({ days, color }: { days: string[]; color: string }) {
  const today = new Date().toISOString().split('T')[0];
  return (
    <View style={styles.streakBarRow}>
      {days.map(d => (
        <View
          key={d}
          style={[
            styles.streakCell,
            { backgroundColor: d <= today ? color : 'rgba(255,255,255,0.05)' },
          ]}
        />
      ))}
    </View>
  );
}

function getLast7Days(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function getLast30Days(): string[] {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });
}

export default function AnalysisTab({ date }: Props) {
  const colors = useColors();
  const { getDayStatus, getOverallStreak, getWeeklyCompletion, getMonthlyStats, getTotalTasksCompleted, habits, getHabitStreak } = useApp();

  const dayStatus = getDayStatus(date);
  const overallStreak = getOverallStreak();
  const weeklyData = getWeeklyCompletion();
  const monthlyStats = getMonthlyStats();
  const totalCompleted = getTotalTasksCompleted();

  const todayRate = dayStatus.completionRate;
  const weekAvg = useMemo(() => {
    const vals = weeklyData.filter(v => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [weeklyData]);

  const last7 = getLast7Days();
  const last30 = getLast30Days();
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.circleWrap}>
            <CircularProgress value={todayRate} color={colors.primary} size={80} stroke={6} />
            <Text style={[styles.circleLabel, { color: colors.primary }]}>{Math.round(todayRate * 100)}%</Text>
          </View>
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Today</Text>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>
            {dayStatus.tasksCompleted}/{dayStatus.tasksTotal} tasks
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.circleWrap}>
            <CircularProgress value={weekAvg} color="#A78BFA" size={80} stroke={6} />
            <Text style={[styles.circleLabel, { color: '#A78BFA' }]}>{Math.round(weekAvg * 100)}%</Text>
          </View>
          <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Week Avg</Text>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>7-day average</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Feather name="zap" size={16} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Streak</Text>
          <Text style={[styles.streakNum, { color: colors.primary }]}>{overallStreak}</Text>
          <Text style={[styles.streakLabel, { color: colors.textMuted }]}>days</Text>
        </View>
        <StreakBar days={last7} color={colors.primary} />
        <View style={styles.dayLabels}>
          {DAY_LABELS.map((l, i) => (
            <Text key={i} style={[styles.dayLabel, { color: colors.textMuted }]}>{l}</Text>
          ))}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <Feather name="trending-up" size={16} color="#60A5FA" />
          <Text style={[styles.cardTitle, { color: colors.text }]}>30-Day Trend</Text>
        </View>
        <MiniLineChart data={monthlyStats.map(s => s.rate)} color="#60A5FA" />
        <View style={styles.chartXLabels}>
          <Text style={[styles.chartLabel, { color: colors.textMuted }]}>30d ago</Text>
          <Text style={[styles.chartLabel, { color: colors.textMuted }]}>Today</Text>
        </View>
      </View>

      {habits.filter(h => h.active).length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <Feather name="repeat" size={16} color="#F9A8D4" />
            <Text style={[styles.cardTitle, { color: colors.text }]}>Habit Streaks</Text>
          </View>
          {habits.filter(h => h.active).map(habit => {
            const streak = getHabitStreak(habit.id);
            return (
              <View key={habit.id} style={styles.habitRow}>
                <View style={[styles.habitDot, { backgroundColor: habit.color }]} />
                <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>{habit.name}</Text>
                <View style={styles.habitStreak}>
                  <Feather name="zap" size={12} color={colors.primary} />
                  <Text style={[styles.habitStreakNum, { color: colors.primary }]}>{streak}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.lifetimeRow}>
        <View style={[styles.lifetimeStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="check-circle" size={20} color={colors.primary} />
          <Text style={[styles.lifetimeNum, { color: colors.text }]}>{totalCompleted}</Text>
          <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>tasks done</Text>
        </View>
        <View style={[styles.lifetimeStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="book-open" size={20} color="#A78BFA" />
          <Text style={[styles.lifetimeNum, { color: colors.text }]}>
            {/* journal count */}
            {/* will be inlined from context */}
            {overallStreak}
          </Text>
          <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>day streak</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  circleWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  circleLabel: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: '700',
  },
  statTitle: { fontSize: 13, fontWeight: '600' },
  statSub: { fontSize: 11 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', flex: 1 },
  streakNum: { fontSize: 22, fontWeight: '800' },
  streakLabel: { fontSize: 12, alignSelf: 'flex-end', paddingBottom: 2 },
  streakBarRow: { flexDirection: 'row', gap: 4 },
  streakCell: { flex: 1, height: 6, borderRadius: 3 },
  dayLabels: { flexDirection: 'row', gap: 4 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 10 },
  chartXLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { fontSize: 10 },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  habitDot: { width: 8, height: 8, borderRadius: 4 },
  habitName: { flex: 1, fontSize: 14 },
  habitStreak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  habitStreakNum: { fontSize: 14, fontWeight: '700' },
  lifetimeRow: { flexDirection: 'row', gap: 12 },
  lifetimeStat: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  lifetimeNum: { fontSize: 26, fontWeight: '800' },
  lifetimeLabel: { fontSize: 12 },
});
