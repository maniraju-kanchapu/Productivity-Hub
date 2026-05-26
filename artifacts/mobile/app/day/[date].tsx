import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import AnalysisTab from '@/components/tabs/AnalysisTab';
import JournalTab from '@/components/tabs/JournalTab';
import SettingsTab from '@/components/tabs/SettingsTab';
import TasksTab from '@/components/tabs/TasksTab';

type Tab = 'tasks' | 'journal' | 'analysis' | 'settings';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'tasks', icon: 'check-square', label: 'Tasks' },
  { key: 'journal', icon: 'book-open', label: 'Journal' },
  { key: 'analysis', icon: 'bar-chart-2', label: 'Analysis' },
  { key: 'settings', icon: 'sliders', label: 'Settings' },
];

function formatDate(dateStr: string): { weekday: string; date: string } {
  const d = new Date(dateStr + 'T12:00:00');
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return { weekday, date };
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

export default function DayScreen() {
  const colors = useColors();
  const router = useRouter();
  const { date } = useLocalSearchParams<{ date: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');

  const dateStr = Array.isArray(date) ? date[0] : date ?? new Date().toISOString().split('T')[0];
  const { weekday, date: dateLabel } = formatDate(dateStr);
  const today = isToday(dateStr);

  function handleTabPress(tab: Tab) {
    if (tab !== activeTab) {
      Haptics.selectionAsync();
      setActiveTab(tab);
    }
  }

  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.weekday, { color: colors.textMuted }]}>{weekday}</Text>
          <View style={styles.dateLine}>
            <Text style={[styles.date, { color: colors.text }]}>{dateLabel}</Text>
            {today && (
              <View style={[styles.todayBadge, { backgroundColor: colors.primaryDim }]}>
                <Text style={[styles.todayText, { color: colors.primary }]}>Today</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {activeTab === 'tasks' && <TasksTab date={dateStr} />}
        {activeTab === 'journal' && <JournalTab date={dateStr} />}
        {activeTab === 'analysis' && <AnalysisTab date={dateStr} />}
        {activeTab === 'settings' && <SettingsTab />}
      </View>

      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.surfaceElevated,
            borderTopColor: colors.border,
            paddingBottom: bottomPad,
          },
        ]}
      >
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => handleTabPress(tab.key)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIcon, active && { backgroundColor: colors.primaryDim }]}>
                <Feather
                  name={tab.icon as any}
                  size={20}
                  color={active ? colors.primary : colors.textMuted}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: active ? colors.primary : colors.textMuted },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, gap: 2 },
  weekday: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  dateLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  date: { fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  todayBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  todayText: { fontSize: 11, fontWeight: '700' },
  headerRight: { width: 32 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabIcon: { padding: 6, borderRadius: 10 },
  tabLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
});
