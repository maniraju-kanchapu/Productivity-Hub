import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export interface Task {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  category: 'daily' | 'anytime' | 'habit';
  habitId?: string;
  completedAt?: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  active: boolean;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  updatedAt: string;
}

export interface DayStatus {
  tasksTotal: number;
  tasksCompleted: number;
  hasJournal: boolean;
  completionRate: number;
}

interface AppState {
  tasks: Task[];
  habits: Habit[];
  journals: JournalEntry[];
  loaded: boolean;
}

interface AppContextType extends AppState {
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, changes: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, changes: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  saveJournal: (date: string, content: string) => void;
  getJournal: (date: string) => JournalEntry | undefined;
  getDayTasks: (date: string) => Task[];
  getDayStatus: (date: string) => DayStatus;
  getHabitStreak: (habitId: string) => number;
  getOverallStreak: () => number;
  getWeeklyCompletion: () => number[];
  getMonthlyStats: () => { date: string; rate: number }[];
  getTotalTasksCompleted: () => number;
}

const AppContext = createContext<AppContextType | null>(null);

const TASKS_KEY = '@lifeos_tasks';
const HABITS_KEY = '@lifeos_habits';
const JOURNALS_KEY = '@lifeos_journals';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function dateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(dateString: string, days: number): string {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return dateStr(d);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    tasks: [],
    habits: [],
    journals: [],
    loaded: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [tasksRaw, habitsRaw, journalsRaw] = await Promise.all([
        AsyncStorage.getItem(TASKS_KEY),
        AsyncStorage.getItem(HABITS_KEY),
        AsyncStorage.getItem(JOURNALS_KEY),
      ]);
      const tasks: Task[] = tasksRaw ? JSON.parse(tasksRaw) : [];
      const habits: Habit[] = habitsRaw ? JSON.parse(habitsRaw) : [];
      const journals: JournalEntry[] = journalsRaw ? JSON.parse(journalsRaw) : [];
      setState({ tasks, habits, journals, loaded: true });
    } catch {
      setState(s => ({ ...s, loaded: true }));
    }
  }

  async function saveTasks(tasks: Task[]) {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  async function saveHabits(habits: Habit[]) {
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }

  async function saveJournals(journals: JournalEntry[]) {
    await AsyncStorage.setItem(JOURNALS_KEY, JSON.stringify(journals));
  }

  const addTask = useCallback((task: Omit<Task, 'id'>) => {
    const newTask: Task = { ...task, id: generateId() };
    setState(s => {
      const tasks = [...s.tasks, newTask];
      saveTasks(tasks);
      return { ...s, tasks };
    });
  }, []);

  const updateTask = useCallback((id: string, changes: Partial<Task>) => {
    setState(s => {
      const tasks = s.tasks.map(t => t.id === id ? { ...t, ...changes } : t);
      saveTasks(tasks);
      return { ...s, tasks };
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState(s => {
      const tasks = s.tasks.filter(t => t.id !== id);
      saveTasks(tasks);
      return { ...s, tasks };
    });
  }, []);

  const toggleTask = useCallback((id: string) => {
    setState(s => {
      const tasks = s.tasks.map(t => {
        if (t.id !== id) return t;
        const completed = !t.completed;
        return { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined };
      });
      saveTasks(tasks);
      return { ...s, tasks };
    });
  }, []);

  const addHabit = useCallback((habit: Omit<Habit, 'id' | 'createdAt'>) => {
    const newHabit: Habit = { ...habit, id: generateId(), createdAt: todayStr() };
    setState(s => {
      const habits = [...s.habits, newHabit];
      saveHabits(habits);
      return { ...s, habits };
    });
  }, []);

  const updateHabit = useCallback((id: string, changes: Partial<Habit>) => {
    setState(s => {
      const habits = s.habits.map(h => h.id === id ? { ...h, ...changes } : h);
      saveHabits(habits);
      return { ...s, habits };
    });
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState(s => {
      const habits = s.habits.filter(h => h.id !== id);
      const tasks = s.tasks.filter(t => t.habitId !== id);
      saveHabits(habits);
      saveTasks(tasks);
      return { ...s, habits, tasks };
    });
  }, []);

  const saveJournal = useCallback((date: string, content: string) => {
    setState(s => {
      const existing = s.journals.find(j => j.date === date);
      let journals: JournalEntry[];
      if (existing) {
        journals = s.journals.map(j =>
          j.date === date ? { ...j, content, updatedAt: new Date().toISOString() } : j
        );
      } else {
        const entry: JournalEntry = {
          id: generateId(),
          date,
          content,
          updatedAt: new Date().toISOString(),
        };
        journals = [...s.journals, entry];
      }
      saveJournals(journals);
      return { ...s, journals };
    });
  }, []);

  const getJournal = useCallback((date: string) => {
    return state.journals.find(j => j.date === date);
  }, [state.journals]);

  const getDayTasks = useCallback((date: string): Task[] => {
    const directTasks = state.tasks.filter(t => t.date === date && t.category !== 'habit');
    const habitTasks = state.habits
      .filter(h => h.active && h.createdAt <= date)
      .map(habit => {
        const existing = state.tasks.find(t => t.habitId === habit.id && t.date === date);
        if (existing) return existing;
        return {
          id: `habit_${habit.id}_${date}`,
          title: habit.name,
          date,
          completed: false,
          category: 'habit' as const,
          habitId: habit.id,
        };
      });
    return [...habitTasks, ...directTasks];
  }, [state.tasks, state.habits]);

  const getDayStatus = useCallback((date: string): DayStatus => {
    const tasks = getDayTasks(date);
    const journal = state.journals.find(j => j.date === date);
    const tasksTotal = tasks.length;
    const tasksCompleted = tasks.filter(t => t.completed).length;
    const completionRate = tasksTotal > 0 ? tasksCompleted / tasksTotal : 0;
    return {
      tasksTotal,
      tasksCompleted,
      hasJournal: !!journal,
      completionRate,
    };
  }, [getDayTasks, state.journals]);

  const getHabitStreak = useCallback((habitId: string): number => {
    const today = todayStr();
    let streak = 0;
    let current = today;
    while (true) {
      const task = state.tasks.find(t => t.habitId === habitId && t.date === current);
      if (task?.completed) {
        streak++;
        current = addDays(current, -1);
      } else if (current === today) {
        current = addDays(current, -1);
        const yesterday = state.tasks.find(t => t.habitId === habitId && t.date === current);
        if (yesterday?.completed) {
          streak++;
          current = addDays(current, -1);
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return streak;
  }, [state.tasks]);

  const getOverallStreak = useCallback((): number => {
    const today = todayStr();
    let streak = 0;
    let current = addDays(today, -1);
    for (let i = 0; i < 365; i++) {
      const status = getDayStatus(current);
      if (status.tasksCompleted > 0 || status.hasJournal) {
        streak++;
        current = addDays(current, -1);
      } else {
        break;
      }
    }
    return streak;
  }, [getDayStatus]);

  const getWeeklyCompletion = useCallback((): number[] => {
    const today = todayStr();
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, -(6 - i));
      const status = getDayStatus(date);
      return status.completionRate;
    });
  }, [getDayStatus]);

  const getMonthlyStats = useCallback((): { date: string; rate: number }[] => {
    const today = todayStr();
    return Array.from({ length: 30 }, (_, i) => {
      const date = addDays(today, -(29 - i));
      const status = getDayStatus(date);
      return { date, rate: status.completionRate };
    });
  }, [getDayStatus]);

  const getTotalTasksCompleted = useCallback((): number => {
    return state.tasks.filter(t => t.completed).length;
  }, [state.tasks]);

  return (
    <AppContext.Provider value={{
      ...state,
      addTask,
      updateTask,
      deleteTask,
      toggleTask,
      addHabit,
      updateHabit,
      deleteHabit,
      saveJournal,
      getJournal,
      getDayTasks,
      getDayStatus,
      getHabitStreak,
      getOverallStreak,
      getWeeklyCompletion,
      getMonthlyStats,
      getTotalTasksCompleted,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
