import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import {
  getHabitsWithStreaks,
  markHabitCompleted,
  deleteHistoryForDate,
  getHistoryForDate,
  getActiveUserId,
  createUser,
  getActiveHabits,
  setActiveUserId,
  getAllUsers,
} from '../db';
import type { HabitWithStreak, HabitHistory } from '../db/types';
import { todayString } from '../utils/dateHelpers';

export function useHabits() {
  const db = useSQLiteContext();
  const [habits, setHabits] = useState<HabitWithStreak[]>([]);
  const [todayHistory, setTodayHistory] = useState<Record<number, HabitHistory>>({});
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureUser = useCallback(async (): Promise<number> => {
    let uid = await getActiveUserId();
    if (uid !== null) {
      setUserId(uid);
      return uid;
    }
    const users = await getAllUsers(db);
    if (users.length > 0) {
      await setActiveUserId(users[0].id);
      setUserId(users[0].id);
      return users[0].id;
    }
    const newUser = await createUser(db, { name: 'You' });
    await setActiveUserId(newUser.id);
    setUserId(newUser.id);
    return newUser.id;
  }, [db]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const uid = await ensureUser();
      const [h] = await Promise.all([getHabitsWithStreaks(db, uid)]);
      setHabits(h);
      // load today's history for each habit
      const today = todayString();
      const histMap: Record<number, HabitHistory> = {};
      await Promise.all(
        h.map(async (habit) => {
          const hist = await getHistoryForDate(db, habit.id, today);
          if (hist) histMap[habit.id] = hist;
        }),
      );
      setTodayHistory(histMap);
    } finally {
      setLoading(false);
    }
  }, [db, ensureUser]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleHabit = useCallback(
    async (habitId: number) => {
      if (!userId) return;
      const today = todayString();
      const existing = todayHistory[habitId];
      if (existing && existing.status === 'completed') {
        // un-complete
        await deleteHistoryForDate(db, habitId, today);
        setTodayHistory((prev) => {
          const next = { ...prev };
          delete next[habitId];
          return next;
        });
      } else {
        const hist = await markHabitCompleted(db, habitId, userId);
        setTodayHistory((prev) => ({ ...prev, [habitId]: hist }));
      }
      // refresh streaks
      const updated = await getHabitsWithStreaks(db, userId);
      setHabits(updated);
    },
    [db, userId, todayHistory],
  );

  const isCompleted = useCallback(
    (habitId: number) => todayHistory[habitId]?.status === 'completed',
    [todayHistory],
  );

  const completedCount = Object.values(todayHistory).filter((h) => h.status === 'completed').length;
  const completionRate = habits.length > 0 ? completedCount / habits.length : 0;

  return {
    habits,
    userId,
    loading,
    refresh,
    toggleHabit,
    isCompleted,
    completedCount,
    completionRate,
  };
}
