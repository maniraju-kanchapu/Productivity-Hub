import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path, Polyline } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useApp, MoodType } from '@/context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 48;
const CHART_H = 110;

type FilterType = 'today' | 'week' | 'month' | 'year' | 'all';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year',  label: 'Year' },
  { key: 'all',   label: 'All Time' },
];

const MOOD_META: Record<MoodType, { color: string; label: string }> = {
  great: { color: '#39FF7E', label: 'Great' },
  good:  { color: '#60A5FA', label: 'Good' },
  okay:  { color: '#A78BFA', label: 'Okay' },
  sad:   { color: '#F87171', label: 'Sad' },
  gold:  { color: '#F5C842', label: 'Gold' },
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function CircularProgress({ value, size = 80, stroke = 6, color }: {
  value: number; size?: number; stroke?: number; color: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(Math.max(value, 0), 1);
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

function LineChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return <View style={{ height: CHART_H }} />;
  const maxVal = Math.max(...data, 0.01);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * CHART_W,
    y: CHART_H - (v / maxVal) * CHART_H * 0.85 - 8,
  }));
  const polyPoints = pts.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M0,${CHART_H} ${pts.map(p => `L${p.x},${p.y}`).join(' ')} L${CHART_W},${CHART_H} Z`;
  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Path d={areaPath} fill={`${color}14`} />
      <Polyline points={polyPoints} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

function MoodDot({ mood }: { mood: MoodType | undefined }) {
  const color = mood ? MOOD_META[mood].color : 'rgba(255,255,255,0.06)';
  return <View style={[styles.moodDotCell, { backgroundColor: color }]} />;
}

interface Props {
  date: string;
}

export default function AnalysisTab({ date }: Props) {
  const colors = useColors();
  const {
    getDayStatus, getOverallStreak, getWeeklyCompletion, getMonthlyStats,
    getTotalTasksCompleted, getGoldDaysCount, getMoodTrend,
    habits, getHabitStreak, journals, tasks, moods,
  } = useApp();

  const [filter, setFilter] = useState<FilterType>('week');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const today = new Date().toISOString().split('T')[0];

  function switchFilter(next: FilterType) {
    if (next === filter) return;
    Haptics.selectionAsync();
    Animated.timing(fadeAnim, {
      toValue: 0, duration: 100,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setFilter(next);
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 160,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });
  }

  const dayStatus = getDayStatus(date);
  const overallStreak = getOverallStreak();
  const weeklyData = getWeeklyCompletion();
  const monthlyStats = getMonthlyStats();
  const totalCompleted = getTotalTasksCompleted();
  const goldCount = getGoldDaysCount();
  const moodTrend = getMoodTrend();

  const chartData = useMemo((): number[] => {
    if (filter === 'today' || filter === 'all') return [];
    if (filter === 'week') return weeklyData;
    if (filter === 'month') return monthlyStats.map(s => s.rate);
    if (filter === 'year') {
      return Array.from({ length: 12 }, (_, i) => {
        const rates = Array.from({ length: 30 }, (_, j) =>
          getDayStatus(addDays(today, -(11 - i) * 30 - j)).completionRate
        );
        const nonZero = rates.filter(r => r > 0);
        return nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
      });
    }
    return [];
  }, [filter, weeklyData, monthlyStats, getDayStatus, today]);

  const chartLabel = useMemo(() => {
    if (filter === 'week') return { left: '7d ago', right: 'Today' };
    if (filter === 'month') return { left: '30d ago', right: 'Today' };
    if (filter === 'year') return { left: '12mo ago', right: 'Today' };
    return { left: '', right: '' };
  }, [filter]);

  const chartTitle = useMemo(() => {
    if (filter === 'week') return '7-Day Trend';
    if (filter === 'month') return '30-Day Trend';
    if (filter === 'year') return 'Monthly Averages (Year)';
    return '';
  }, [filter]);

  const primaryRate = useMemo(() => {
    if (filter === 'today') return dayStatus.completionRate;
    if (filter === 'week') {
      const v = weeklyData.filter(x => x > 0);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    }
    if (filter === 'month') {
      const v = monthlyStats.map(s => s.rate).filter(x => x > 0);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
    }
    if (filter === 'year') {
      const rates = Array.from({ length: 365 }, (_, i) =>
        getDayStatus(addDays(today, -i)).completionRate
      ).filter(r => r > 0);
      return rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
    }
    return 0;
  }, [filter, dayStatus, weeklyData, monthlyStats, getDayStatus, today]);

  const primaryLabel = useMemo(() => {
    if (filter === 'today') return 'Today';
    if (filter === 'week') return 'Week Avg';
    if (filter === 'month') return 'Month Avg';
    if (filter === 'year') return 'Year Avg';
    return 'Overall';
  }, [filter]);

  const primarySub = useMemo(() => {
    if (filter === 'today') return `${dayStatus.tasksCompleted}/${dayStatus.tasksTotal} tasks`;
    if (filter === 'week') return '7-day average';
    if (filter === 'month') return '30-day average';
    if (filter === 'year') return 'yearly average';
    return 'all time';
  }, [filter, dayStatus]);

  const weekAvg = useMemo(() => {
    const v = weeklyData.filter(x => x > 0);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  }, [weeklyData]);

  const streakDays = useMemo(() => {
    const count = filter === 'today' ? 7
      : filter === 'week' ? 7
      : filter === 'month' ? 14
      : filter === 'year' ? 12
      : 7;
    return Array.from({ length: count }, (_, i) => addDays(today, -(count - 1 - i)));
  }, [filter, today]);

  const moodWindow = useMemo(() => {
    const count = filter === 'today' ? 7
      : filter === 'week' ? 7
      : filter === 'month' ? 14
      : filter === 'year' ? 30
      : 14;
    return Array.from({ length: count }, (_, i) => {
      const d = addDays(today, -(count - 1 - i));
      return { date: d, mood: moods[d] as MoodType | undefined };
    });
  }, [filter, today, moods]);

  const moodCounts = useMemo(() => {
    const counts: Partial<Record<MoodType, number>> = {};
    moodWindow.forEach(({ mood }) => {
      if (mood) counts[mood] = (counts[mood] ?? 0) + 1;
    });
    return counts;
  }, [moodWindow]);

  const totalHabitCompletions = useMemo(
    () => tasks.filter(t => t.category === 'habit' && t.completed).length,
    [tasks]
  );

  const longestStreak = useMemo(() => {
    let longest = 0, current = 0;
    for (let i = 364; i >= 0; i--) {
      const s = getDayStatus(addDays(today, -i));
      if (s.completionRate > 0 || s.hasJournal) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    return longest;
  }, [getDayStatus, today]);

  const productiveDays = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const s = getDayStatus(addDays(today, -i));
      if (s.completionRate > 0 || s.hasJournal) count++;
    }
    return count;
  }, [getDayStatus, today]);

  const allTimeMoodCounts = useMemo(() => {
    const counts: Partial<Record<MoodType, number>> = {};
    Object.values(moods).forEach(m => {
      counts[m] = (counts[m] ?? 0) + 1;
    });
    return counts;
  }, [moods]);
  const totalMoods = Object.values(allTimeMoodCounts).reduce((a, b) => a + (b ?? 0), 0);

  const showChart = filter !== 'today' && filter !== 'all';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* ── Filter Pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
      >
        {FILTERS.map(f => {
          const active = f.key === filter;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => switchFilter(f.key)}
              activeOpacity={0.7}
              style={[
                styles.pill,
                {
                  backgroundColor: active ? colors.primaryDim : colors.card,
                  borderColor: active ? colors.primary : colors.border,
                  borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Text style={[styles.pillText, { color: active ? colors.primary : colors.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Animated.View style={{ opacity: fadeAnim }}>

        {/* ── Stat Cards ── */}
        {filter !== 'all' && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.circleWrap}>
                <CircularProgress value={primaryRate} color={colors.primary} size={80} stroke={6} />
                <Text style={[styles.circleLabel, { color: colors.primary }]}>
                  {Math.round(primaryRate * 100)}%
                </Text>
              </View>
              <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{primaryLabel}</Text>
              <Text style={[styles.statSub, { color: colors.textMuted }]}>{primarySub}</Text>
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
        )}

        {/* ── Streak Card ── */}
        {filter !== 'all' && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="zap" size={15} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Streak</Text>
              <Text style={[styles.streakNum, { color: colors.primary }]}>{overallStreak}</Text>
              <Text style={[styles.streakLabel, { color: colors.textMuted }]}>days</Text>
            </View>
            <View style={styles.streakBarRow}>
              {streakDays.map(d => {
                const s = getDayStatus(d);
                const active = s.completionRate > 0 || s.hasJournal;
                return (
                  <View key={d} style={[styles.streakCell, { backgroundColor: active ? colors.primary : colors.border }]} />
                );
              })}
            </View>
          </View>
        )}

        {/* ── Trend Chart ── */}
        {showChart && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="trending-up" size={15} color="#60A5FA" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{chartTitle}</Text>
            </View>
            <LineChart data={chartData} color="#60A5FA" />
            <View style={styles.chartXLabels}>
              <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{chartLabel.left}</Text>
              <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{chartLabel.right}</Text>
            </View>
          </View>
        )}

        {/* ── Mood Card ── */}
        {filter !== 'all' && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="heart" size={15} color="#F9A8D4" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Mood ({moodWindow.length} days)
              </Text>
            </View>
            <View style={styles.moodDotRow}>
              {moodWindow.map(({ date: d, mood }) => (
                <MoodDot key={d} mood={mood} />
              ))}
            </View>
            <View style={styles.moodLegend}>
              {Object.entries(MOOD_META).map(([key, meta]) => {
                const count = moodCounts[key as MoodType] ?? 0;
                if (count === 0) return null;
                return (
                  <View key={key} style={styles.moodLegendItem}>
                    <View style={[styles.moodLegendDot, { backgroundColor: meta.color }]} />
                    <Text style={[styles.moodLegendText, { color: colors.textMuted }]}>
                      {meta.label} ({count})
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Habit Streaks ── */}
        {habits.filter(h => h.active).length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Feather name="repeat" size={15} color="#F9A8D4" />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Habit Streaks</Text>
            </View>
            {habits.filter(h => h.active).map(habit => {
              const streak = getHabitStreak(habit.id);
              return (
                <View key={habit.id} style={styles.habitRow}>
                  <View style={[styles.habitDot, { backgroundColor: habit.color }]} />
                  <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>{habit.name}</Text>
                  <Feather name="zap" size={12} color={colors.primary} />
                  <Text style={[styles.habitStreakNum, { color: colors.primary }]}>{streak}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Regular Lifetime Row (non-all filters) ── */}
        {filter !== 'all' && (
          <View style={styles.lifetimeRow}>
            <View style={[styles.lifetimeStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="check-circle" size={20} color={colors.primary} />
              <Text style={[styles.lifetimeNum, { color: colors.text }]}>{totalCompleted}</Text>
              <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>tasks done</Text>
            </View>
            <View style={[styles.lifetimeStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="star" size={20} color="#F5C842" />
              <Text style={[styles.lifetimeNum, { color: colors.text }]}>{goldCount}</Text>
              <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>gold days</Text>
            </View>
            <View style={[styles.lifetimeStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="book-open" size={20} color="#A78BFA" />
              <Text style={[styles.lifetimeNum, { color: colors.text }]}>{journals.length}</Text>
              <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>journal days</Text>
            </View>
          </View>
        )}

        {/* ── All Time / Overall Reports ── */}
        {filter === 'all' && (
          <>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="zap" size={26} color={colors.primary} />
                <Text style={[styles.bigNum, { color: colors.primary }]}>{longestStreak}</Text>
                <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Best Streak</Text>
                <Text style={[styles.statSub, { color: colors.textMuted }]}>consecutive days</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="calendar" size={26} color="#60A5FA" />
                <Text style={[styles.bigNum, { color: '#60A5FA' }]}>{productiveDays}</Text>
                <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Active Days</Text>
                <Text style={[styles.statSub, { color: colors.textMuted }]}>out of 365</Text>
              </View>
            </View>

            <View style={styles.lifetimeRow}>
              <View style={[styles.lifetimeStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="check-circle" size={20} color={colors.primary} />
                <Text style={[styles.lifetimeNum, { color: colors.text }]}>{totalCompleted}</Text>
                <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>tasks done</Text>
              </View>
              <View style={[styles.lifetimeStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="repeat" size={20} color="#60A5FA" />
                <Text style={[styles.lifetimeNum, { color: colors.text }]}>{totalHabitCompletions}</Text>
                <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>habit checks</Text>
              </View>
              <View style={[styles.lifetimeStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="star" size={20} color="#F5C842" />
                <Text style={[styles.lifetimeNum, { color: colors.text }]}>{goldCount}</Text>
                <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>gold days</Text>
              </View>
            </View>

            <View style={styles.lifetimeRow}>
              <View style={[styles.lifetimeStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="book-open" size={20} color="#A78BFA" />
                <Text style={[styles.lifetimeNum, { color: colors.text }]}>{journals.length}</Text>
                <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>journal days</Text>
              </View>
              <View style={[styles.lifetimeStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="zap" size={20} color={colors.primary} />
                <Text style={[styles.lifetimeNum, { color: colors.text }]}>{overallStreak}</Text>
                <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>cur. streak</Text>
              </View>
              <View style={[styles.lifetimeStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="trending-up" size={20} color="#34D399" />
                <Text style={[styles.lifetimeNum, { color: colors.text }]}>
                  {productiveDays > 0 ? Math.round((totalCompleted / productiveDays) * 10) / 10 : 0}
                </Text>
                <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>avg tasks/day</Text>
              </View>
            </View>

            {totalMoods > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Feather name="heart" size={15} color="#F9A8D4" />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Lifetime Mood</Text>
                  <Text style={[styles.streakLabel, { color: colors.textMuted }]}>{totalMoods} entries</Text>
                </View>
                {(Object.entries(MOOD_META) as [MoodType, { color: string; label: string }][]).map(([key, meta]) => {
                  const count = allTimeMoodCounts[key] ?? 0;
                  const pct = totalMoods > 0 ? count / totalMoods : 0;
                  return (
                    <View key={key} style={styles.moodBarRow}>
                      <View style={[styles.moodBarDot, { backgroundColor: meta.color }]} />
                      <Text style={[styles.moodBarLabel, { color: pct > 0 ? colors.text : colors.textMuted }]}>
                        {meta.label}
                      </Text>
                      <View style={[styles.moodBarTrack, { backgroundColor: colors.border }]}>
                        <View
                          style={[styles.moodBarFill, { backgroundColor: meta.color, width: `${Math.round(pct * 100)}%` }]}
                        />
                      </View>
                      <Text style={[styles.moodBarCount, { color: colors.textMuted }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },

  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  pillText: { fontSize: 13, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
    padding: 16, alignItems: 'center', gap: 6,
  },
  circleWrap: { alignItems: 'center', justifyContent: 'center' },
  circleLabel: { position: 'absolute', fontSize: 15, fontWeight: '700' },
  statTitle: { fontSize: 13, fontWeight: '600' },
  statSub: { fontSize: 11 },
  bigNum: { fontSize: 28, fontWeight: '800', lineHeight: 34 },

  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 12, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', flex: 1 },

  streakNum: { fontSize: 22, fontWeight: '800' },
  streakLabel: { fontSize: 11, alignSelf: 'flex-end', paddingBottom: 2 },
  streakBarRow: { flexDirection: 'row', gap: 4 },
  streakCell: { flex: 1, height: 5, borderRadius: 3 },

  chartXLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { fontSize: 10 },

  moodDotRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  moodDotCell: { width: (CHART_W - 65) / 14, height: 8, borderRadius: 4 },
  moodLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moodLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  moodLegendDot: { width: 7, height: 7, borderRadius: 4 },
  moodLegendText: { fontSize: 11 },

  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  habitDot: { width: 8, height: 8, borderRadius: 4 },
  habitName: { flex: 1, fontSize: 14 },
  habitStreakNum: { fontSize: 14, fontWeight: '700' },

  lifetimeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  lifetimeStat: {
    flex: 1, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    padding: 14, alignItems: 'center', gap: 5,
  },
  lifetimeNum: { fontSize: 22, fontWeight: '800' },
  lifetimeLabel: { fontSize: 10, textAlign: 'center' },

  moodBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moodBarDot: { width: 8, height: 8, borderRadius: 4 },
  moodBarLabel: { fontSize: 12, width: 42 },
  moodBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  moodBarFill: { height: '100%', borderRadius: 3 },
  moodBarCount: { fontSize: 12, width: 22, textAlign: 'right' },
});
