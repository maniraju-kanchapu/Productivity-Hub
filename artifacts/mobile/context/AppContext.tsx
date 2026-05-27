import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type MoodType = 'great' | 'good' | 'okay' | 'sad' | 'gold';

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
  mood?: MoodType;
}

interface AppState {
  tasks: Task[];
  habits: Habit[];
  journals: JournalEntry[];
  moods: Record<string, MoodType>;
  profilePhoto: string | null;
  loaded: boolean;
}

interface AppContextType extends AppState {
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, changes: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  toggleHabitTask: (habitId: string, date: string) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  updateHabit: (id: string, changes: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  saveJournal: (date: string, content: string) => void;
  getJournal: (date: string) => JournalEntry | undefined;
  setMood: (date: string, mood: MoodType | null) => void;
  getMood: (date: string) => MoodType | undefined;
  getDayTasks: (date: string) => Task[];
  getDayStatus: (date: string) => DayStatus;
  getHabitStreak: (habitId: string) => number;
  getOverallStreak: () => number;
  getWeeklyCompletion: () => number[];
  getMonthlyStats: () => { date: string; rate: number }[];
  getTotalTasksCompleted: () => number;
  getGoldDaysCount: () => number;
  getMoodTrend: () => { date: string; mood: MoodType | undefined }[];
  setProfilePhoto: (uri: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const TASKS_KEY = '@lifeos_tasks';
const HABITS_KEY = '@lifeos_habits';
const JOURNALS_KEY = '@lifeos_journals';
const MOODS_KEY = '@lifeos_moods';
const PROFILE_KEY = '@trace_profile';

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
  const d = new Date(dateString + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return dateStr(d);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    tasks: [],
    habits: [],
    journals: [],
    moods: {},
    profilePhoto: null,
    loaded: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [tasksRaw, habitsRaw, journalsRaw, moodsRaw, profileRaw] = await Promise.all([
        AsyncStorage.getItem(TASKS_KEY),
        AsyncStorage.getItem(HABITS_KEY),
        AsyncStorage.getItem(JOURNALS_KEY),
        AsyncStorage.getItem(MOODS_KEY),
        AsyncStorage.getItem(PROFILE_KEY),
      ]);
      setState({
        tasks: tasksRaw ? JSON.parse(tasksRaw) : [],
        habits: habitsRaw ? JSON.parse(habitsRaw) : [],
        journals: journalsRaw ? JSON.parse(journalsRaw) : [],
        moods: moodsRaw ? JSON.parse(moodsRaw) : {},
        profilePhoto: profileRaw ?? null,
        loaded: true,
      });
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
  async function saveMoods(moods: Record<string, MoodType>) {
    await AsyncStorage.setItem(MOODS_KEY, JSON.stringify(moods));
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

  const toggleHabitTask = useCallback((habitId: string, date: string) => {
    setState(s => {
      const existingIdx = s.tasks.findIndex(t => t.habitId === habitId && t.date === date);
      let tasks: Task[];
      if (existingIdx >= 0) {
        tasks = s.tasks.map((t, i) => {
          if (i !== existingIdx) return t;
          const completed = !t.completed;
          return { ...t, completed, completedAt: completed ? new Date().toISOString() : undefined };
        });
      } else {
        const habit = s.habits.find(h => h.id === habitId);
        if (!habit) return s;
        const newTask: Task = {
          id: generateId(),
          title: habit.name,
          date,
          completed: true,
          category: 'habit',
          habitId,
          completedAt: new Date().toISOString(),
        };
        tasks = [...s.tasks, newTask];
      }
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
        journals = [...s.journals, { id: generateId(), date, content, updatedAt: new Date().toISOString() }];
      }
      saveJournals(journals);
      return { ...s, journals };
    });
  }, []);

  const getJournal = useCallback((date: string) => {
    return state.journals.find(j => j.date === date);
  }, [state.journals]);

  const setMood = useCallback((date: string, mood: MoodType | null) => {
    setState(s => {
      const moods = { ...s.moods };
      if (mood === null) {
        delete moods[date];
      } else {
        moods[date] = mood;
      }
      saveMoods(moods);
      return { ...s, moods };
    });
  }, []);

  const getMood = useCallback((date: string): MoodType | undefined => {
    return state.moods[date];
  }, [state.moods]);

  const getDayTasks = useCallback((date: string): Task[] => {
    const directTasks = state.tasks.filter(t => t.date === date && t.category !== 'habit');
    const habitTasks = state.habits
      .filter(h => h.active && h.createdAt <= date)
      .map(habit => {
        const existing = state.tasks.find(t => t.habitId === habit.id && t.date === date);
        if (existing) return existing;
        return {
          id: `__virtual__${habit.id}__${date}`,
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
    const mood = state.moods[date];
    const tasksTotal = tasks.length;
    const tasksCompleted = tasks.filter(t => t.completed).length;
    const completionRate = tasksTotal > 0 ? tasksCompleted / tasksTotal : 0;
    return { tasksTotal, tasksCompleted, hasJournal: !!journal, completionRate, mood };
  }, [getDayTasks, state.journals, state.moods]);

  const getHabitStreak = useCallback((habitId: string): number => {
    const today = todayStr();
    let streak = 0;
    let current = today;
    for (let i = 0; i < 365; i++) {
      const task = state.tasks.find(t => t.habitId === habitId && t.date === current);
      if (task?.completed) {
        streak++;
        current = addDays(current, -1);
      } else if (i === 0) {
        current = addDays(current, -1);
      } else {
        break;
      }
    }
    return streak;
  }, [state.tasks]);

  const getOverallStreak = useCallback((): number => {
    let streak = 0;
    let current = addDays(todayStr(), -1);
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
      return getDayStatus(date).completionRate;
    });
  }, [getDayStatus]);

  const getMonthlyStats = useCallback((): { date: string; rate: number }[] => {
    const today = todayStr();
    return Array.from({ length: 30 }, (_, i) => {
      const date = addDays(today, -(29 - i));
      return { date, rate: getDayStatus(date).completionRate };
    });
  }, [getDayStatus]);

  const getTotalTasksCompleted = useCallback((): number => {
    return state.tasks.filter(t => t.completed).length;
  }, [state.tasks]);

  const getGoldDaysCount = useCallback((): number => {
    return Object.values(state.moods).filter(m => m === 'gold').length;
  }, [state.moods]);

  const getMoodTrend = useCallback((): { date: string; mood: MoodType | undefined }[] => {
    const today = todayStr();
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(today, -(13 - i));
      return { date, mood: state.moods[date] };
    });
  }, [state.moods]);

  function setProfilePhoto(uri: string | null) {
    setState(s => ({ ...s, profilePhoto: uri }));
    if (uri) {
      AsyncStorage.setItem(PROFILE_KEY, uri);
    } else {
      AsyncStorage.removeItem(PROFILE_KEY);
    }
  }

  return (
    <AppContext.Provider value={{
      ...state,
      addTask, updateTask, deleteTask, toggleTask, toggleHabitTask,
      addHabit, updateHabit, deleteHabit,
      saveJournal, getJournal,
      setMood, getMood,
      getDayTasks, getDayStatus,
      getHabitStreak, getOverallStreak,
      getWeeklyCompletion, getMonthlyStats,
      getTotalTasksCompleted, getGoldDaysCount, getMoodTrend,
      setProfilePhoto,
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
