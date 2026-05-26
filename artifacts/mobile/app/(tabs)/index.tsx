import Icon from '@/components/Icon';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import DotGrid from '@/components/DotGrid';

function useDateTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDay(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = useDateTime();
  const { getOverallStreak } = useApp();
  const streak = getOverallStreak();
  const dayOfYear = getDayOfYear(now);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  function handleDotPress(date: string) {
    router.push(`/day/${date}`);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.timeBlock}>
          <Text style={[styles.time, { color: colors.text }]}>{formatTime(now)}</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDay(now)}</Text>
        </View>
        <View style={styles.headerRight}>
          {streak > 0 && (
            <View style={[styles.streakPill, { backgroundColor: colors.primaryDim, borderColor: colors.primaryGlow }]}>
              <Icon name="zap" size={12} color={colors.primary} />
              <Text style={[styles.streakText, { color: colors.primary }]}>{streak}</Text>
            </View>
          )}
          <View style={[styles.dayPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dayNum, { color: colors.textSecondary }]}>{dayOfYear}</Text>
            <Text style={[styles.dayLabel, { color: colors.textMuted }]}>/ 365</Text>
          </View>
        </View>
      </View>

      <DotGrid onDotPress={handleDotPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  timeBlock: { gap: 4 },
  time: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  date: { fontSize: 14, fontWeight: '400' },
  headerRight: { alignItems: 'flex-end', gap: 8, paddingTop: 4 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  streakText: { fontSize: 13, fontWeight: '800' },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dayNum: { fontSize: 13, fontWeight: '700' },
  dayLabel: { fontSize: 11 },
});
