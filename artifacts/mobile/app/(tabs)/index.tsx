import Icon from '@/components/Icon';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

function ProfileAvatar({ uri, onPress }: { uri: string | null; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.avatar,
        {
          borderColor: uri ? colors.primary : colors.border,
          backgroundColor: colors.card,
        },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.avatarImage} />
      ) : (
        <Icon name="plus" size={16} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const now = useDateTime();
  const { getOverallStreak, profilePhoto, setProfilePhoto } = useApp();
  const streak = getOverallStreak();
  const dayOfYear = getDayOfYear(now);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  function handleDotPress(date: string) {
    router.push(`/day/${date}`);
  }

  async function handleAvatarPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (profilePhoto) {
      Alert.alert('Profile Photo', 'What would you like to do?', [
        {
          text: 'Change Photo',
          onPress: pickImage,
        },
        {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: () => {
            setProfilePhoto(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      pickImage();
    }
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photos to set a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePhoto(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>

        <View style={styles.leftBlock}>
          <ProfileAvatar uri={profilePhoto} onPress={handleAvatarPress} />
          <View style={styles.timeBlock}>
            <Text style={[styles.time, { color: colors.text }]}>{formatTime(now)}</Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDay(now)}</Text>
          </View>
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
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  timeBlock: { gap: 2, flex: 1 },
  time: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  date: { fontSize: 12, fontWeight: '400' },
  headerRight: { alignItems: 'flex-end', gap: 8, paddingTop: 4, flexShrink: 0 },
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
