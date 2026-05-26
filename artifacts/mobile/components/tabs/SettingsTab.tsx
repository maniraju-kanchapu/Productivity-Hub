import Icon from '@/components/Icon';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useApp, Habit } from '@/context/AppContext';

const HABIT_COLORS = [
  '#39FF7E', '#60A5FA', '#F9A8D4', '#A78BFA',
  '#FDBA74', '#34D399', '#F87171', '#FCD34D',
];

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7} style={styles.sectionAction}>
          <Icon name="plus" size={14} color={colors.primary} />
          <Text style={[styles.sectionActionText, { color: colors.primary }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface SettingsRowProps {
  icon: string;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightContent?: React.ReactNode;
  isLast?: boolean;
}

function SettingsRow({ icon, iconColor, label, value, onPress, rightContent, isLast }: SettingsRowProps) {
  const colors = useColors();
  const inner = (
    <View style={[styles.settingsRow, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <View style={[styles.settingsIcon, { backgroundColor: (iconColor ?? colors.primary) + '1A' }]}>
        <Icon name={icon as any} size={15} color={iconColor ?? colors.primary} />
      </View>
      <Text style={[styles.settingsLabel, { color: colors.text }]}>{label}</Text>
      {rightContent ?? (
        value ? (
          <Text style={[styles.settingsValue, { color: colors.textMuted }]}>{value}</Text>
        ) : null
      )}
      {onPress && !rightContent && (
        <Icon name="chevron-right" size={14} color={colors.textMuted} style={{ marginLeft: 4 }} />
      )}
    </View>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} hitSlop={{ top: 2, bottom: 2 }}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

interface HabitModalProps {
  visible: boolean;
  habit?: Habit;
  onClose: () => void;
}

function HabitModal({ visible, habit, onClose }: HabitModalProps) {
  const colors = useColors();
  const { addHabit, updateHabit } = useApp();
  const [name, setName] = useState(habit?.name ?? '');
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0]);

  function handleSave() {
    if (!name.trim()) return;
    if (habit) {
      updateHabit(habit.id, { name: name.trim(), color });
    } else {
      addHabit({ name: name.trim(), color, active: true });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {habit ? 'Edit Habit' : 'New Habit'}
          </Text>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>NAME</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
            placeholder="e.g. Morning run, Read 20 pages..."
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>COLOR</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                activeOpacity={0.8}
                style={styles.colorDotWrap}
              >
                <View
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    color === c && { transform: [{ scale: 1.2 }] },
                  ]}
                />
                {color === c && (
                  <View style={styles.colorCheck}>
                    <Icon name="check" size={9} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              {habit ? 'Save Changes' : 'Create Habit'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface HabitRowProps {
  habit: Habit;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  isLast?: boolean;
}

function HabitRowItem({ habit, onEdit, onDelete, onToggle, isLast }: HabitRowProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.habitRow,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.habitColorDot, { backgroundColor: habit.color }]} />
      <View style={styles.habitInfo}>
        <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>
          {habit.name}
        </Text>
        <Text style={[styles.habitStatus, { color: habit.active ? colors.primary : colors.textMuted }]}>
          {habit.active ? 'Active' : 'Paused'}
        </Text>
      </View>
      <View style={styles.habitActions}>
        <Switch
          value={habit.active}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primaryDim }}
          thumbColor={habit.active ? colors.primary : colors.textMuted}
          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
        />
        <TouchableOpacity
          onPress={onEdit}
          activeOpacity={0.7}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="edit-2" size={15} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDelete}
          activeOpacity={0.7}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="trash-2" size={15} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsTab() {
  const colors = useColors();
  const { habits, updateHabit, deleteHabit, tasks, journals } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();

  function handleDelete(habit: Habit) {
    Alert.alert('Delete Habit', `Remove "${habit.name}"?\nAll related task records will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteHabit(habit.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <SectionHeader
        title="HABITS"
        action="Add Habit"
        onAction={() => { setEditingHabit(undefined); setShowModal(true); }}
      />

      {habits.length === 0 ? (
        <TouchableOpacity
          onPress={() => { setEditingHabit(undefined); setShowModal(true); }}
          activeOpacity={0.8}
          style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.primaryDim }]}>
            <Icon name="repeat" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No habits yet</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            Tap to create your first daily habit
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {habits.map((h, i) => (
            <HabitRowItem
              key={h.id}
              habit={h}
              onEdit={() => { setEditingHabit(h); setShowModal(true); }}
              onDelete={() => handleDelete(h)}
              onToggle={() => { updateHabit(h.id, { active: !h.active }); }}
              isLast={i === habits.length - 1}
            />
          ))}
        </View>
      )}

      <SectionHeader title="DATA" />
      <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingsRow
          icon="layers"
          iconColor="#60A5FA"
          label="Tasks Recorded"
          value={`${tasks.length}`}
          isLast={false}
        />
        <SettingsRow
          icon="book-open"
          iconColor="#A78BFA"
          label="Journal Entries"
          value={`${journals.length}`}
          isLast={false}
        />
        <SettingsRow
          icon="repeat"
          iconColor="#F9A8D4"
          label="Active Habits"
          value={`${habits.filter(h => h.active).length}`}
          isLast
        />
      </View>

      <SectionHeader title="PREFERENCES" />
      <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingsRow
          icon="moon"
          iconColor="#A78BFA"
          label="Theme"
          value="System"
          isLast={false}
        />
        <SettingsRow
          icon="bell"
          iconColor="#FDBA74"
          label="Notifications"
          value="Coming soon"
          isLast={false}
        />
        <SettingsRow
          icon="shield"
          iconColor="#34D399"
          label="Data Backup"
          value="Coming soon"
          isLast
        />
      </View>

      <SectionHeader title="ABOUT" />
      <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingsRow icon="grid" iconColor={colors.primary} label="Life OS" value="v1.0" isLast={false} />
        <SettingsRow icon="wifi-off" iconColor="#60A5FA" label="Mode" value="Offline-first" isLast={false} />
        <SettingsRow icon="database" iconColor="#A78BFA" label="Storage" value="Local device" isLast />
      </View>

      <HabitModal
        visible={showModal}
        habit={editingHabit}
        onClose={() => { setShowModal(false); setEditingHabit(undefined); }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 120 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 10,
  },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sectionActionText: { fontSize: 13, fontWeight: '600' },

  groupCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: { flex: 1, fontSize: 15, fontWeight: '400' },
  settingsValue: { fontSize: 14 },

  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  habitColorDot: { width: 10, height: 10, borderRadius: 5 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 15, fontWeight: '400' },
  habitStatus: { fontSize: 11, marginTop: 2 },
  habitActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 5 },

  emptyCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'android' ? 32 : 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    gap: 4,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 19, fontWeight: '700', marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  colorDotWrap: { position: 'relative' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorCheck: {
    position: 'absolute',
    top: 0, right: 0, bottom: 0, left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
});
