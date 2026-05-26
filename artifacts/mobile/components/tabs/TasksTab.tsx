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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeOutLeft } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useApp, Task } from '@/context/AppContext';

type Category = 'daily' | 'anytime' | 'habit';

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

function TaskRow({ task, onToggle, onDelete }: TaskRowProps) {
  const colors = useColors();

  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutLeft}>
      <View style={[styles.taskRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={onToggle}
          style={[
            styles.checkbox,
            {
              borderColor: task.completed ? colors.primary : colors.border,
              backgroundColor: task.completed ? colors.primaryDim : 'transparent',
            },
          ]}
          activeOpacity={0.7}
        >
          {task.completed && <Feather name="check" size={12} color={colors.primary} />}
        </TouchableOpacity>
        <View style={styles.taskContent}>
          <Text
            style={[
              styles.taskTitle,
              {
                color: task.completed ? colors.textMuted : colors.text,
                textDecorationLine: task.completed ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
          {task.category === 'habit' && (
            <View style={[styles.habitBadge, { backgroundColor: colors.primaryDim }]}>
              <Text style={[styles.habitBadgeText, { color: colors.primary }]}>habit</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} activeOpacity={0.7}>
          <Feather name="trash-2" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

interface AddTaskModalProps {
  visible: boolean;
  date: string;
  onClose: () => void;
}

function AddTaskModal({ visible, date, onClose }: AddTaskModalProps) {
  const colors = useColors();
  const { addTask } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('daily');

  const CATS: { key: Category; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'anytime', label: 'Anytime' },
  ];

  function handleAdd() {
    if (!title.trim()) return;
    addTask({ title: title.trim(), date, completed: false, category });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTitle('');
    setCategory('daily');
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
          <Text style={[styles.modalTitle, { color: colors.text }]}>New Task</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
            placeholder="What needs to be done?"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <View style={styles.catRow}>
            {CATS.map(c => (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[
                  styles.catBtn,
                  {
                    backgroundColor: category === c.key ? colors.primaryDim : colors.card,
                    borderColor: category === c.key ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.catText, { color: category === c.key ? colors.primary : colors.textSecondary }]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>Add Task</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface Props {
  date: string;
}

export default function TasksTab({ date }: Props) {
  const colors = useColors();
  const { getDayTasks, toggleTask, deleteTask } = useApp();
  const [showModal, setShowModal] = useState(false);

  const tasks = getDayTasks(date);
  const habits = tasks.filter(t => t.category === 'habit');
  const daily = tasks.filter(t => t.category === 'daily');
  const anytime = tasks.filter(t => t.category === 'anytime');

  function handleToggle(task: Task) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (task.id.startsWith('habit_')) {
      // Virtual habit task - no persistent record, ignore
      return;
    }
    toggleTask(task.id);
  }

  function handleDelete(task: Task) {
    Alert.alert('Delete Task', 'Remove this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          deleteTask(task.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        },
      },
    ]);
  }

  const sections = [
    { title: 'Habits', data: habits },
    { title: 'Daily Tasks', data: daily },
    { title: 'Anytime', data: anytime },
  ].filter(s => s.data.length > 0);

  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;

  return (
    <View style={styles.container}>
      {total > 0 && (
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${Math.round((completed / total) * 100)}%`,
              },
            ]}
          />
        </View>
      )}

      <FlatList
        data={sections}
        keyExtractor={s => s.title}
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{section.title.toUpperCase()}</Text>
            {section.data.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => handleToggle(task)}
                onDelete={() => handleDelete(task)}
              />
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="check-circle" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No tasks yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Tap + to add a task for this day</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={[styles.fab, { backgroundColor: colors.primary }]}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>

      <AddTaskModal visible={showModal} date={date} onClose={() => setShowModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBar: {
    height: 2,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  section: { marginTop: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  habitBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  habitBadgeText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  deleteBtn: { padding: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 17, fontWeight: '500' },
  emptySubtext: { fontSize: 14 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#39FF7E',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
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
    marginBottom: 16,
  },
  catRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  catBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  catText: { fontSize: 13, fontWeight: '600' },
  addBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 16, fontWeight: '700' },
});
