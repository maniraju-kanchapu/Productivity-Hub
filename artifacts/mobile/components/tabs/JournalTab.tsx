import Icon from '@/components/Icon';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useApp, MoodType } from '@/context/AppContext';

const MOODS: { key: MoodType; label: string; emoji: string; color: string }[] = [
  { key: 'great',  label: 'Great',  emoji: 'smile',      color: '#39FF7E' },
  { key: 'good',   label: 'Good',   emoji: 'meh',        color: '#60A5FA' },
  { key: 'okay',   label: 'Okay',   emoji: 'minus-circle',color: '#A78BFA' },
  { key: 'sad',    label: 'Sad',    emoji: 'frown',      color: '#F87171' },
  { key: 'gold',   label: 'Gold',   emoji: 'star',       color: '#F5C842' },
];

interface MoodButtonProps {
  mood: typeof MOODS[0];
  selected: boolean;
  onPress: () => void;
}

function MoodButton({ mood, selected, onPress }: MoodButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: selected ? 1.12 : 1,
        useNativeDriver: Platform.OS !== 'web',
        tension: 200,
        friction: 12,
      }),
      Animated.timing(glowOpacity, {
        toValue: selected ? 1 : 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [selected]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      style={styles.moodBtnWrap}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View
          style={[
            styles.moodBtn,
            {
              backgroundColor: selected
                ? mood.key === 'gold'
                  ? 'rgba(245,200,66,0.18)'
                  : `${mood.color}18`
                : 'rgba(255,255,255,0.04)',
              borderColor: selected ? mood.color : 'rgba(255,255,255,0.08)',
              borderWidth: selected ? 1.5 : 1,
            },
          ]}
        >
          {selected && (
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                styles.moodGlow,
                { backgroundColor: mood.color, opacity: glowOpacity },
              ]}
            />
          )}
          <Icon name={mood.emoji as any} size={20} color={selected ? mood.color : 'rgba(255,255,255,0.3)'} />
        </View>
        <Text style={[styles.moodLabel, { color: selected ? mood.color : 'rgba(255,255,255,0.3)' }]}>
          {mood.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

interface Props {
  date: string;
}

export default function JournalTab({ date }: Props) {
  const colors = useColors();
  const { getJournal, saveJournal, getMood, setMood } = useApp();
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentMood = getMood(date);

  useEffect(() => {
    const entry = getJournal(date);
    const text = entry?.content ?? '';
    setContent(text);
    setWordCount(text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0);
    setSaved(true);
  }, [date]);

  const handleChange = useCallback((text: string) => {
    setContent(text);
    setSaved(false);
    setWordCount(text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveJournal(date, text);
      setSaved(true);
    }, 800);
  }, [date, saveJournal]);

  function handleManualSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveJournal(date, content);
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Keyboard.dismiss();
  }

  function handleMoodPress(mood: MoodType) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentMood === mood) {
      setMood(date, null);
    } else {
      setMood(date, mood);
      if (mood === 'gold') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }

  const today = new Date().toISOString().split('T')[0];
  const isFuture = date > today;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={160}
    >
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: saved ? colors.primary : colors.warning }]} />
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            {saved ? 'Saved' : 'Saving...'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.wordCount, { color: colors.textMuted }]}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </Text>
          <TouchableOpacity
            onPress={handleManualSave}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="save" size={17} color={saved ? colors.textMuted : colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {isFuture ? (
        <View style={styles.futureMsg}>
          <Icon name="clock" size={32} color={colors.textMuted} />
          <Text style={[styles.futureText, { color: colors.textSecondary }]}>This day hasn't arrived yet</Text>
        </View>
      ) : (
        <TextInput
          ref={inputRef}
          style={[styles.editor, { color: colors.text }]}
          placeholder="Begin writing..."
          placeholderTextColor={colors.textMuted}
          multiline
          scrollEnabled
          value={content}
          onChangeText={handleChange}
          textAlignVertical="top"
          autoCorrect
          autoCapitalize="sentences"
        />
      )}

      <View style={[styles.moodSection, { borderTopColor: colors.border }]}>
        <Text style={[styles.moodTitle, { color: colors.textMuted }]}>HOW WAS YOUR DAY?</Text>
        <View style={styles.moodRow}>
          {MOODS.map(mood => (
            <MoodButton
              key={mood.key}
              mood={mood}
              selected={currentMood === mood.key}
              onPress={() => handleMoodPress(mood.key)}
            />
          ))}
        </View>
        {currentMood === 'gold' && (
          <Text style={[styles.goldMsg, { color: '#F5C842' }]}>
            Legendary day — this dot will shine gold forever
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  wordCount: { fontSize: 12 },
  editor: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 17,
    lineHeight: 28,
    fontFamily: 'Inter_400Regular',
  },
  futureMsg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  futureText: { fontSize: 17, fontWeight: '500' },
  moodSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'android' ? 24 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  moodTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtnWrap: { flex: 1, alignItems: 'center' },
  moodBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  moodGlow: {
    borderRadius: 14,
    opacity: 0.08,
  },
  moodLabel: { fontSize: 10, fontWeight: '600', marginTop: 5, textAlign: 'center' },
  goldMsg: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
