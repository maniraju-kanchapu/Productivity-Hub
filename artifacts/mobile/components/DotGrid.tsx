import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 7;
const DOT_MARGIN = 5;
const DOT_SIZE = Math.floor((SCREEN_WIDTH - 40 - DOT_MARGIN * COLUMNS * 2) / COLUMNS);

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

function Dot({ date, onPress }: DotProps) {
  const colors = useColors();
  const { getDayStatus } = useApp();
  const today = todayStr();
  const isFuture = date > today;
  const isToday = date === today;
  const isPast = date < today;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isToday) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    glow.start();
    return () => { pulse.stop(); glow.stop(); };
  }, [isToday]);

  let dotColor = colors.dotFuture;
  let dotBg = 'transparent';

  if (isToday) {
    dotColor = colors.primary;
    dotBg = colors.primaryDim;
  } else if (isPast) {
    const status = getDayStatus(date);
    if (status.completionRate >= 0.8) {
      dotColor = colors.dotCompleted;
    } else if (status.completionRate > 0) {
      dotColor = colors.dotPartial;
    } else if (status.hasJournal) {
      dotColor = 'rgba(255,255,255,0.35)';
    } else {
      dotColor = colors.dotMissed;
    }
  }

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.7] });

  return (
    <TouchableOpacity
      onPress={() => onPress(date)}
      style={styles.dotContainer}
      activeOpacity={0.7}
    >
      {isToday && (
        <Animated.View
          style={[
            styles.glowRing,
            { backgroundColor: colors.primaryGlow, opacity: glowOpacity, transform: [{ scale: pulseAnim }] }
          ]}
        />
      )}
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: dotColor,
            transform: isToday ? [{ scale: pulseAnim }] : [{ scale: 1 }],
          }
        ]}
      />
    </TouchableOpacity>
  );
}

interface DotGridProps {
  onDotPress: (date: string) => void;
}

export default function DotGrid({ onDotPress }: DotGridProps) {
  const dates = getYearDates();
  const today = todayStr();
  const flatListRef = useRef<FlatList>(null);

  const todayIndex = dates.indexOf(today);

  useEffect(() => {
    if (todayIndex >= 0 && flatListRef.current) {
      const rowIndex = Math.floor(todayIndex / COLUMNS);
      const offset = rowIndex * (DOT_SIZE + DOT_MARGIN * 2) - 200;
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: Math.max(0, offset), animated: true });
      }, 500);
    }
  }, [todayIndex]);

  return (
    <FlatList
      ref={flatListRef}
      data={dates}
      keyExtractor={item => item}
      numColumns={COLUMNS}
      renderItem={({ item }) => <Dot date={item} onPress={onDotPress} />}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
      initialNumToRender={56}
      maxToRenderPerBatch={56}
      windowSize={5}
      scrollEnabled
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  dotContainer: {
    width: DOT_SIZE + DOT_MARGIN * 2,
    height: DOT_SIZE + DOT_MARGIN * 2,
    margin: DOT_MARGIN / 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    width: DOT_SIZE - 6,
    height: DOT_SIZE - 6,
    borderRadius: (DOT_SIZE - 6) / 2,
  },
  glowRing: {
    position: 'absolute',
    width: DOT_SIZE + 8,
    height: DOT_SIZE + 8,
    borderRadius: (DOT_SIZE + 8) / 2,
  },
});
