import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getActiveUserId, getAllHabitsHistoryForDate, getActiveHabits } from '../db';
import { getLast7Days, getLast30Days, todayString } from '../utils/dateHelpers';

export interface DayBar {
  date: string;
  count: number;
  total: number;
}

export function useStats() {
  const db = useSQLiteContext();
  const [bars7, setBars7] = useState<DayBar[]>([]);
  const [bars30, setBars30] = useState<DayBar[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const uid = await getActiveUserId();
      if (!uid) return;
      const habits = await getActiveHabits(db, uid);
      const total = habits.length;

      const buildBars = async (days: string[]): Promise<DayBar[]> => {
        return Promise.all(
          days.map(async (date) => {
            const hist = await getAllHabitsHistoryForDate(db, uid, date);
            const count = hist.filter((h) => h.status === 'completed').length;
            return { date, count, total };
          })
        );
      };

      const [b7, b30] = await Promise.all([buildBars(getLast7Days()), buildBars(getLast30Days())]);
      setBars7(b7);
      setBars30(b30);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  return { bars7, bars30, loading, refresh: load };
}
