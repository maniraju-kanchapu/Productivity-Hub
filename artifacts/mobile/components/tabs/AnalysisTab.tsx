import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useApp, MoodType } from '@/context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_W = SCREEN_WIDTH - 48;
const CHART_H = 108;

type FilterType = 'today' | 'week' | 'month' | 'year' | 'all';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All Time' },
];

const MOOD_META: Record<MoodType, { color: string; label: string; icon: string }> = {
  great: { color: '#39FF7E', label: 'Great',  icon: 'smile' },
  good:  { color: '#60A5FA', label: 'Good',   icon: 'meh' },
  okay:  { color: '#A78BFA', label: 'Okay',   icon: 'minus-circle' },
  sad:   { color: '#F87171', label: 'Sad',    icon: 'frown' },
  gold:  { color: '#F5C842', label: 'Gold',   icon: 'star' },
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function CircularProgress({ value, size = 80, stroke = 6, color }: {
  value: number; size?: number; stroke?: number; color: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(Math.max(value, 0), 1);
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={`${circ * filled} ${circ}`}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2},${size / 2}`}
      />
    </Svg>
  );
}

function LineChart({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return (
      <View style={{ height: CHART_H, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>No data yet</Text>
      </View>
    );
  }
  const maxVal = Math.max(...data, 0.01);
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * CHART_W,
    y: CHART_H - (v / maxVal) * CHART_H * 0.82 - 10,
  }));
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ');
  const area = `M0,${CHART_H} ${pts.map(p => `L${p.x},${p.y}`).join(' ')} L${CHART_W},${CHART_H} Z`;
  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Path d={area} fill={`${color}12`} />
      <Polyline points={poly} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

function BarChart({ data, color, labels }: { data: number[]; color: string; labels?: string[] }) {
  if (!data.length) return null;
  const maxVal = Math.max(...data, 0.01);
  const barW = (CHART_W - (data.length - 1) * 4) / data.length;
  return (
    <View>
      <Svg width={CHART_W} height={CHART_H}>
        {data.map((v, i) => {
          const h = Math.max((v / maxVal) * (CHART_H - 8), 3);
          return (
            <Rect
              key={i}
              x={i * (barW + 4)}
              y={CHART_H - h}
              width={barW}
              height={h}
              rx={3}
              fill={v > 0 ? color : 'rgba(255,255,255,0.04)'}
            />
          );
        })}
      </Svg>
      {labels && (
        <View style={styles.barLabels}>
          {labels.map((l, i) => (
            <Text key={i} style={[styles.barLabel, { width: barW + 4 }]}>{l}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

interface FilterPillsProps {
  active: FilterType;
  onSelect: (f: FilterType) => void;
}

function FilterPills({ active, onSelect }: FilterPillsProps) {
  const colors = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillsRow}
    >
      {FILTERS.map(f => {
        const isActive = f.key === active;
        return (
          <TouchableOpacity
            key={f.key}
            onPress={() => onSelect(f.key)}
            activeOpacity={0.7}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? colors.primaryDim : colors.card,
                borderColor: isActive ? colors.primary : colors.border,
                borderWidth: isActive ? 1.5 : 1,
              },
            ]}
          >
            <Text style={[styles.pillText, { color: isActive ? colors.primary : colors.textSecondary }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

interface Props {
  date: string;
}

export default function AnalysisTab({ date }: Props) {
  const colors = useColors();
  const {
    getDayStatus, getOverallStreak, getTotalTasksCompleted,
    getGoldDaysCount, getMoodTrend, habits, getHabitStreak,
    journals, tasks, moods,
  } = useApp();

  const [filter, setFilter] = useState<FilterType>('week');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const today = todayStr();

  const switchFilter = useCallback((next: FilterType) => {
    if (next === filter) return;
    Haptics.selectionAsync();
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setFilter(next);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });
  }, [filter, fadeAnim]);

  const dayStatus = useMemo(() => getDayStatus(date), [getDayStatus, date]);

  const chartData = useMemo((): number[] => {
    if (filter === 'today' || filter === 'all') return [];
    if (filter === 'week') {
      return Array.from({ length: 7 }, (_, i) =>
        getDayStatus(addDays(today, -(6 - i))).completionRate
      );
    }
    if (filter === 'month') {
      return Array.from({ length: 30 }, (_, i) =>
        getDayStatus(addDays(today, -(29 - i))).completionRate
      );
    }
    if (filter === 'year') {
      return Array.from({ length: 12 }, (_, i) => {
        const monthRates = Array.from({ length: 30 }, (_, j) =>
          getDayStatus(addDays(today, -(11 - i) * 30 - j)).completionRate
        );
        return monthRates.reduce((a, b) => a + b, 0) / monthRates.length;
      });
    }
    return [];
  }, [filter, today, getDayStatus]);

  const chartLabels = useMemo((): string[] => {
    if (filter === 'week') return ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    if (filter === 'year') {
      const now = new Date();
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() - (11 - i));
        return d.toLocaleDateString('en-US', { month: 'short' }).slice(0, 1);
      });
    }
    return [];
  }, [filter]);

  const filterAvg = useMemo(() => {
    if (!chartData.length) return 0;
    const filled = chartData.filter(v => v > 0);
    return filled.length ? filled.reduce((a, b) => a + b, 0) / filled.length : 0;
  }, [chartData]);

  const productiveDays = useMemo(() => {
    return Array.from({ length: 365 }, (_, i) => {
      const d = addDays(today, -i);
      const s = getDayStatus(d);
      return s.completionRate > 0 || s.hasJournal ? 1 : 0;
    }).reduce((a: number, b: number) => a + b, 0);
  }, [today, getDayStatus]);

  const longestStreak = useMemo(() => {
    let longest = 0;
    let current = 0;
    for (let i = 364; i >= 0; i--) {
      const d = addDays(today, -i);
      const s = getDayStatus(d);
      if (s.completionRate > 0 || s.hasJournal) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    return longest;
  }, [today, getDayStatus]);

  const moodCounts = useMemo(() => {
    const counts: Partial<Record<MoodType, number>> = {};
    Object.values(moods).forEach(m => {
      counts[m] = (counts[m] ?? 0) + 1;
    });
    return counts;
  }, [moods]);

  const totalMoods = Object.values(moodCounts).reduce((a, b) => a + (b ?? 0), 0);

  const overallStreak = getOverallStreak();
  const totalCompleted = getTotalTasksCompleted();
  const goldCount = getGoldDaysCount();
  const totalHabitCompletions = tasks.filter(t => t.category === 'habit' && t.completed).length;
  const yearRate = useMemo(() => {
    const rates = Array.from({ length: 365 }, (_, i) =>
      getDayStatus(addDays(today, -i)).completionRate
    );
    const filled = rates.filter(r => r > 0);
    return filled.length ? filled.reduce((a, b) => a + b, 0) / filled.length : 0;
  }, [today, getDayStatus]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <FilterPills active={filter} onSelect={switchFilter} />

      <Animated.View style={{ opacity: fadeAnim }}>

        {filter === 'today' && (
          <>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.circleWrap}>
                  <CircularProgress value={dayStatus.completionRate} color={colors.primary} size={84} stroke={7} />
                  <Text style={[styles.circleLabel, { color: colors.primary }]}>
                    {Math.round(dayStatus.completionRate * 100)}%
                  </Text>
                </View>
                <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Completion</Text>
                <Text style={[styles.statSub, { color: colors.textMuted }]}>
                  {dayStatus.tasksCompleted} of {dayStatus.tasksTotal} tasks
                </Text>
              </View>

              <View style={styles.statColumn}>
                <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="book-open" size={16} color="#A78BFA" />
                  <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Journal</Text>
                  <Text style={[styles.miniStatVal, { color: dayStatus.hasJournal ? '#A78BFA' : colors.textMuted }]}>
                    {dayStatus.hasJournal ? 'Written' : 'Empty'}
                  </Text>
                </View>
                <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="zap" size={16} color={colors.primary} />
                  <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Streak</Text>
                  <Text style={[styles.miniStatVal, { color: colors.primary }]}>{overallStreak}d</Text>
                </View>
              </View>
            </View>

            {dayStatus.mood && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Feather name="heart" size={15} color="#F9A8D4" />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Mood</Text>
                </View>
                <View style={styles.moodDisplay}>
                  <Feather
                    name={MOOD_META[dayStatus.mood].icon as any}
                    size={28}
                    color={MOOD_META[dayStatus.mood].color}
                  />
                  <Text style={[styles.moodDisplayLabel, { color: MOOD_META[dayStatus.mood].color }]}>
                    {MOOD_META[dayStatus.mood].label}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {(filter === 'week' || filter === 'month' || filter === 'year') && (
          <>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.circleWrap}>
                  <CircularProgress value={filterAvg} color={colors.primary} size={84} stroke={7} />
                  <Text style={[styles.circleLabel, { color: colors.primary }]}>
                    {Math.round(filterAvg * 100)}%
                  </Text>
                </View>
                <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Avg Rate</Text>
                <Text style={[styles.statSub, { color: colors.textMuted }]}>
                  {filter === 'week' ? '7-day' : filter === 'month' ? '30-day' : '12-month'}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="zap" size={28} color={colors.primary} />
                <Text style={[styles.bigNum, { color: colors.primary }]}>{overallStreak}</Text>
                <Text style={[styles.statTitle, { color: colors.textSecondary }]}>Streak</Text>
                <Text style={[styles.statSub, { color: colors.textMuted }]}>consecutive days</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Feather name="trending-up" size={15} color="#60A5FA" />
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'This Year'}
                </Text>
              </View>
              {filter === 'year' ? (
                <BarChart data={chartData} color="#60A5FA" labels={chartLabels} />
              ) : (
                <LineChart data={chartData} color="#60A5FA" />
              )}
              {filter !== 'year' && (
                <View style={styles.chartXLabels}>
                  <Text style={[styles.chartLabel, { color: colors.textMuted }]}>
                    {filter === 'week' ? '7d ago' : '30d ago'}
                  </Text>
                  <Text style={[styles.chartLabel, { color: colors.textMuted }]}>Today</Text>
                </View>
              )}
            </View>
          </>
        )}

        {filter === 'all' && (
          <>
            <View style={styles.lifetimeGrid}>
              {[
                { icon: 'check-circle', color: colors.primary, val: totalCompleted, label: 'Tasks Done' },
                { icon: 'repeat', color: '#60A5FA', val: totalHabitCompletions, label: 'Habit Checks' },
                { icon: 'zap', color: '#F9A8D4', val: longestStreak, label: 'Best Streak' },
                { icon: 'calendar', color: '#A78BFA', val: productiveDays, label: 'Active Days' },
                { icon: 'star', color: '#F5C842', val: goldCount, label: 'Gold Days' },
                { icon: 'book-open', color: '#34D399', val: journals.length, label: 'Journal Days' },
              ].map((s, i) => (
                <View
                  key={i}
                  style={[styles.lifetimeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <Feather name={s.icon as any} size={18} color={s.color} />
                  <Text style={[styles.lifetimeNum, { color: colors.text }]}>{s.val}</Text>
                  <Text style={[styles.lifetimeLabel, { color: colors.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Feather name="bar-chart-2" size={15} color="#60A5FA" />
                <Text style={[styles.cardTitle, { color: colors.text }]}>Yearly Productivity</Text>
                <Text style={[styles.cardMeta, { color: colors.primary }]}>
                  {Math.round(yearRate * 100)}%
                </Text>
              </View>
              <View style={[styles.yearBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.yearBarFill,
                    { backgroundColor: colors.primary, width: `${Math.round(yearRate * 100)}%` },
                  ]}
                />
              </View>
              <View style={styles.yearBarLabels}>
                <Text style={[styles.chartLabel, { color: colors.textMuted }]}>Avg completion across active days</Text>
                <Text style={[styles.chartLabel, { color: colors.textMuted }]}>{productiveDays}/365 days</Text>
              </View>
            </View>

            {totalMoods > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Feather name="heart" size={15} color="#F9A8D4" />
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Mood Distribution</Text>
                </View>
                {(Object.entries(MOOD_META) as [MoodType, typeof MOOD_META[MoodType]][]).map(([key, meta]) => {
                  const count = moodCounts[key] ?? 0;
                  const pct = totalMoods > 0 ? count / totalMoods : 0;
                  return (
                    <View key={key} style={styles.moodBarRow}>
                      <Feather name={meta.icon as any} size={14} color={pct > 0 ? meta.color : colors.textMuted} />
                      <Text style={[styles.moodBarLabel, { color: pct > 0 ? colors.text : colors.textMuted }]}>
                        {meta.label}
                      </Text>
                      <View style={[styles.moodBarTrack, { backgroundColor: colors.border }]}>
                        <View style={[styles.moodBarFill, { backgroundColor: meta.color, width: `${pct * 100}%` }]} />
                      </View>
                      <Text style={[styles.moodBarCount, { color: colors.textMuted }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

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
                  <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>
                    {habit.name}
                  </Text>
                  <View style={styles.habitStreakWrap}>
                    <Feather name="zap" size={12} color={streak > 0 ? colors.primary : colors.textMuted} />
                    <Text style={[styles.habitStreakNum, { color: streak > 0 ? colors.primary : colors.textMuted }]}>
                      {streak}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 120 },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12, paddingHorizontal: 16 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statColumn: { flex: 1, gap: 10 },
  miniStat: {
    flex: 1,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  miniStatLabel: { fontSize: 11, fontWeight: '500' },
  miniStatVal: { fontSize: 16, fontWeight: '700' },
  circleWrap: { alignItems: 'center', justifyContent: 'center' },
  circleLabel: { position: 'absolute', fontSize: 15, fontWeight: '800' },
  statTitle: { fontSize: 12, fontWeight: '600' },
  statSub: { fontSize: 10 },
  bigNum: { fontSize: 28, fontWeight: '800', lineHeight: 34 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  cardMeta: { fontSize: 14, fontWeight: '700' },
  chartXLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { fontSize: 10 },
  barLabels: { flexDirection: 'row' },
  barLabel: { fontSize: 9, textAlign: 'center', color: 'rgba(255,255,255,0.25)' },
  yearBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  yearBarFill: { height: '100%', borderRadius: 4 },
  yearBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  lifetimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  lifetimeCard: {
    width: (SCREEN_WIDTH - 52) / 3,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  lifetimeNum: { fontSize: 22, fontWeight: '800' },
  lifetimeLabel: { fontSize: 10, textAlign: 'center' },
  moodBarRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  moodBarLabel: { fontSize: 12, width: 44 },
  moodBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  moodBarFill: { height: '100%', borderRadius: 3 },
  moodBarCount: { fontSize: 12, width: 20, textAlign: 'right' },
  moodDisplay: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  moodDisplayLabel: { fontSize: 18, fontWeight: '700' },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  habitDot: { width: 8, height: 8, borderRadius: 4 },
  habitName: { flex: 1, fontSize: 14 },
  habitStreakWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  habitStreakNum: { fontSize: 14, fontWeight: '700' },
});
