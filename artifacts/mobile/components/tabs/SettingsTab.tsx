import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
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
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {habit ? 'Edit Habit' : 'New Habit'}
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
            placeholder="Habit name..."
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Text style={[styles.colorLabel, { color: colors.textMuted }]}>COLOR</Text>
          <View style={styles.colorRow}>
            {HABIT_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotSelected,
                ]}
                activeOpacity={0.8}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
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
}

function HabitRow({ habit, onEdit, onDelete, onToggle }: HabitRowProps) {
  const colors = useColors();
  return (
    <View style={[styles.habitRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.habitColorDot, { backgroundColor: habit.color }]} />
      <Text style={[styles.habitName, { color: colors.text }]} numberOfLines={1}>{habit.name}</Text>
      <View style={styles.habitActions}>
        <Switch
          value={habit.active}
          onValueChange={onToggle}
          trackColor={{ false: colors.border, true: colors.primaryDim }}
          thumbColor={habit.active ? colors.primary : colors.textMuted}
        />
        <TouchableOpacity onPress={onEdit} activeOpacity={0.7} style={styles.iconBtn}>
          <Feather name="edit-2" size={15} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} activeOpacity={0.7} style={styles.iconBtn}>
          <Feather name="trash-2" size={15} color={colors.destructive} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsTab() {
  const colors = useColors();
  const { habits, updateHabit, deleteHabit } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();

  function handleDelete(habit: Habit) {
    Alert.alert('Delete Habit', `Remove "${habit.name}"? This will delete all related tasks.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteHabit(habit.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  }

  function handleEdit(habit: Habit) {
    setEditingHabit(habit);
    setShowModal(true);
  }

  function handleAdd() {
    setEditingHabit(undefined);
    setShowModal(true);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>HABITS</Text>
          <TouchableOpacity onPress={handleAdd} activeOpacity={0.7} style={styles.addBtn}>
            <Feather name="plus" size={16} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>Add</Text>
          </TouchableOpacity>
        </View>

        {habits.length === 0 ? (
          <View style={[styles.emptyHabits, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="repeat" size={28} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No habits yet</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>Add habits to track them daily</Text>
          </View>
        ) : (
          <View style={[styles.habitList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {habits.map(h => (
              <HabitRow
                key={h.id}
                habit={h}
                onEdit={() => handleEdit(h)}
                onDelete={() => handleDelete(h)}
                onToggle={() => updateHabit(h.id, { active: !h.active })}
              />
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APP INFO</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Feather name="grid" size={16} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Life OS</Text>
            <Text style={[styles.infoValue, { color: colors.textMuted }]}>v1.0</Text>
          </View>
          <View style={[styles.infoRowDivider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Feather name="database" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Storage</Text>
            <Text style={[styles.infoValue, { color: colors.textMuted }]}>Local</Text>
          </View>
          <View style={[styles.infoRowDivider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Feather name="wifi-off" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.text }]}>Mode</Text>
            <Text style={[styles.infoValue, { color: colors.textMuted }]}>Offline-first</Text>
          </View>
        </View>
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
  content: { padding: 20, paddingBottom: 120 },
  section: { marginBottom: 32 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: 14, fontWeight: '600' },
  habitList: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  habitColorDot: { width: 10, height: 10, borderRadius: 5 },
  habitName: { flex: 1, fontSize: 15 },
  habitActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 4 },
  emptyHabits: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { fontSize: 16, fontWeight: '500' },
  emptySub: { fontSize: 13 },
  infoCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  infoLabel: { flex: 1, fontSize: 15 },
  infoValue: { fontSize: 14 },
  infoRowDivider: { height: StyleSheet.hairlineWidth, marginLeft: 44 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  colorLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: 'white', transform: [{ scale: 1.15 }] },
  saveBtn: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
});
