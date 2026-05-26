import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import { useApp } from '@/context/AppContext';

interface Props {
  date: string;
}

export default function JournalTab({ date }: Props) {
  const colors = useColors();
  const { getJournal, saveJournal } = useApp();
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const entry = getJournal(date);
    setContent(entry?.content ?? '');
    setWordCount(entry?.content ? entry.content.trim().split(/\s+/).filter(Boolean).length : 0);
    setSaved(true);
  }, [date]);

  const handleChange = useCallback((text: string) => {
    setContent(text);
    setSaved(false);
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(text.trim() ? words : 0);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveJournal(date, text);
      setSaved(true);
    }, 1000);
  }, [date, saveJournal]);

  function handleManualSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveJournal(date, content);
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Keyboard.dismiss();
  }

  const today = new Date().toISOString().split('T')[0];
  const isFuture = date > today;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={160}
    >
      <View style={styles.header}>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: saved ? colors.primary : colors.warning }]} />
          <Text style={[styles.statusText, { color: colors.textMuted }]}>
            {saved ? 'Saved' : 'Unsaved'}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.wordCount, { color: colors.textMuted }]}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </Text>
          <TouchableOpacity onPress={handleManualSave} activeOpacity={0.7}>
            <Feather name="save" size={18} color={saved ? colors.textMuted : colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {isFuture ? (
        <View style={styles.futureMsg}>
          <Feather name="clock" size={32} color={colors.textMuted} />
          <Text style={[styles.futureText, { color: colors.textSecondary }]}>This day hasn't arrived yet</Text>
          <Text style={[styles.futureSubtext, { color: colors.textMuted }]}>Come back when the day begins</Text>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  wordCount: { fontSize: 12 },
  editor: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 120,
    fontSize: 17,
    lineHeight: 28,
    fontFamily: 'Inter_400Regular',
  },
  futureMsg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  futureText: { fontSize: 17, fontWeight: '500' },
  futureSubtext: { fontSize: 14 },
});
