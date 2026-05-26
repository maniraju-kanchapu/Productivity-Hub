import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 7;
const GRID_PADDING = 16;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2) / COLUMNS);
const DOT_SIZE = Math.round(CELL_SIZE * 0.44);

function getYearDates(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const dates: string[] = [];
  const d = new Date(year, 0, 1);
  while (d.getFullYear() === year) {
    dates.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface DotProps {
  date: string;
  onPress: (date: string) => void;
}

const GOLD = '#F5C842';
const GOLD_GLOW = 'rgba(245,200,66,0.35)';

function Dot({ date, onPress }: DotProps) {
  const colors = useColors();
  const { getDayStatus } = useApp();
  const today = todayStr();
  const isFuture = date > today;
  const isToday = date === today;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(isToday ? 0.5 : 0)).current;

  const status = isToday || !isFuture ? getDayStatus(date) : null;
  const isGold = status?.mood === 'gold';

  useEffect(() => {
    if (!isToday && !isGold) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: isGold ? 1.2 : 1.22,
          duration: isGold ? 1600 : 1300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: isGold ? 1600 : 1300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: isGold ? 1600 : 1300,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: isGold ? 1600 : 1300,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();
    glow.start();
    return () => { pulse.stop(); glow.stop(); };
  }, [isToday, isGold]);

  let dotColor: string;
  let glowColor: string;

  if (isGold) {
    dotColor = GOLD;
    glowColor = GOLD_GLOW;
  } else if (isToday) {
    dotColor = colors.dotCurrent;
    glowColor = colors.primaryGlow;
  } else if (isFuture) {
    dotColor = colors.dotFuture;
    glowColor = 'transparent';
  } else if (status) {
    if (status.completionRate >= 0.75) {
      dotColor = colors.dotCompleted;
    } else if (status.completionRate > 0 || status.hasJournal) {
      dotColor = colors.dotPartial;
    } else {
      dotColor = colors.dotMissed;
    }
    glowColor = 'transparent';
  } else {
    dotColor = colors.dotMissed;
    glowColor = 'transparent';
  }

  const animated = isToday || isGold;

  return (
    <TouchableOpacity
      onPress={() => onPress(date)}
      style={styles.cell}
      activeOpacity={0.6}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      {animated && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: glowColor,
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
              pointerEvents: 'none',
            },
          ]}
        />
      )}
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: dotColor, pointerEvents: 'none' },
          animated && { transform: [{ scale: scaleAnim }] },
        ]}
      />
    </TouchableOpacity>
  );
}

interface DotGridProps {
  onDotPress?: (date: string) => void;
}

export default function DotGrid({ onDotPress }: DotGridProps) {
  const router = useRouter();
  const dates = getYearDates();
  const today = todayStr();
  const flatListRef = useRef<FlatList>(null);

  const todayIndex = dates.indexOf(today);

  useEffect(() => {
    if (todayIndex < 0 || !flatListRef.current) return;
    const rowIndex = Math.floor(todayIndex / COLUMNS);
    const rowsVisible = 10;
    const targetRow = Math.max(0, rowIndex - Math.floor(rowsVisible / 2));
    const offset = targetRow * CELL_SIZE;
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset, animated: true });
    }, 600);
    return () => clearTimeout(timer);
  }, [todayIndex]);

  function handlePress(date: string) {
    if (onDotPress) {
      onDotPress(date);
    } else {
      router.push(`/day/${date}`);
    }
  }

  return (
    <FlatList
      ref={flatListRef}
      data={dates}
      keyExtractor={item => item}
      numColumns={COLUMNS}
      renderItem={({ item }) => <Dot date={item} onPress={handlePress} />}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
      initialNumToRender={70}
      maxToRenderPerBatch={70}
      windowSize={7}
      getItemLayout={(_, index) => ({
        length: CELL_SIZE,
        offset: Math.floor(index / COLUMNS) * CELL_SIZE,
        index,
      })}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 32,
    paddingTop: 12,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  glow: {
    position: 'absolute',
    width: DOT_SIZE + 14,
    height: DOT_SIZE + 14,
    borderRadius: (DOT_SIZE + 14) / 2,
  },
});
