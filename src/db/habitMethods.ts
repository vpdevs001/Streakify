// ─────────────────────────────────────────────────────────────────────────────
//  db/habitMethods.ts  –  CRUD for the `habits` table
// ─────────────────────────────────────────────────────────────────────────────

import { type SQLiteDatabase } from 'expo-sqlite';
import {
  type Habit,
  type CreateHabitInput,
  type UpdateHabitInput,
  type HabitWithStreak,
} from './types';
import { buildSetClause, computeStreaks, type SQLiteBindValue } from './utils';

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Insert a new habit. Returns the full created row.
 */
export async function createHabit(db: SQLiteDatabase, input: CreateHabitInput): Promise<Habit> {
  const result = await db.runAsync(
    `INSERT INTO habits
       (user_id, title, description, icon, color,
        frequency_type, frequency_days, target_count,
        reminder_status, reminder_time, notification_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.user_id,
      input.title,
      input.description ?? null,
      input.icon ?? null,
      input.color ?? null,
      input.frequency_type,
      input.frequency_days,
      input.target_count,
      input.reminder_status ?? 'disabled',
      input.reminder_time ?? null,
      input.notification_id ?? null,
    ],
  );

  const habit = await db.getFirstAsync<Habit>(`SELECT * FROM habits WHERE id = ?`, [
    result.lastInsertRowId,
  ]);
  if (!habit) throw new Error('createHabit: failed to retrieve inserted row');
  return habit;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch a single habit by ID. Returns null if not found. */
export async function getHabitById(db: SQLiteDatabase, id: number): Promise<Habit | null> {
  return db.getFirstAsync<Habit>(`SELECT * FROM habits WHERE id = ?`, [id]);
}

/** Fetch all active (non-archived) habits for a user. */
export async function getActiveHabits(db: SQLiteDatabase, userId: number): Promise<Habit[]> {
  return db.getAllAsync<Habit>(
    `SELECT * FROM habits
     WHERE user_id = ? AND is_archived = 0
     ORDER BY created_at ASC`,
    [userId],
  );
}

/** Fetch archived habits for a user. */
export async function getArchivedHabits(db: SQLiteDatabase, userId: number): Promise<Habit[]> {
  return db.getAllAsync<Habit>(
    `SELECT * FROM habits
     WHERE user_id = ? AND is_archived = 1
     ORDER BY updated_at DESC`,
    [userId],
  );
}

/**
 * Fetch all active habits enriched with streak & completion totals.
 * Keeps the streak math in JS (avoids complex window-function SQL).
 */
export async function getHabitsWithStreaks(
  db: SQLiteDatabase,
  userId: number,
): Promise<HabitWithStreak[]> {
  const habits = await getActiveHabits(db, userId);

  const enriched: HabitWithStreak[] = [];

  for (const habit of habits) {
    // Fetch all completed dates for this habit
    const rows = await db.getAllAsync<{ date: string }>(
      `SELECT date FROM habit_history
       WHERE habit_id = ? AND status = 'completed'
       ORDER BY date ASC`,
      [habit.id],
    );

    const dates = rows.map((r) => r.date);
    const { currentStreak, longestStreak } = computeStreaks(dates);

    const countRow = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total FROM habit_history
       WHERE habit_id = ? AND status = 'completed'`,
      [habit.id],
    );

    enriched.push({
      ...habit,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_completions: countRow?.total ?? 0,
    });
  }

  return enriched;
}

/** Fetch habits that have an enabled reminder (used by notification scheduler). */
export async function getHabitsWithReminders(db: SQLiteDatabase, userId: number): Promise<Habit[]> {
  return db.getAllAsync<Habit>(
    `SELECT * FROM habits
     WHERE user_id = ? AND is_archived = 0 AND reminder_status = 'enabled'`,
    [userId],
  );
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Partially update a habit. Only keys present in `input` are changed.
 */
export async function updateHabit(
  db: SQLiteDatabase,
  id: number,
  input: UpdateHabitInput,
): Promise<Habit> {
  if (Object.keys(input).length === 0) {
    const existing = await getHabitById(db, id);
    if (!existing) throw new Error(`updateHabit: habit ${id} not found`);
    return existing;
  }

  const { clause, values } = buildSetClause(input as Record<string, SQLiteBindValue | undefined>);

  await db.runAsync(`UPDATE habits SET ${clause} WHERE id = ?`, [...values, id]);

  const updated = await getHabitById(db, id);
  if (!updated) throw new Error(`updateHabit: habit ${id} not found after update`);
  return updated;
}

/** Convenience wrapper to archive a habit (soft delete). */
export async function archiveHabit(db: SQLiteDatabase, id: number): Promise<Habit> {
  return updateHabit(db, id, { is_archived: 1 });
}

/** Restore a previously archived habit. */
export async function unarchiveHabit(db: SQLiteDatabase, id: number): Promise<Habit> {
  return updateHabit(db, id, { is_archived: 0 });
}

/** Update the notification_id stored against a habit after scheduling. */
export async function setHabitNotificationId(
  db: SQLiteDatabase,
  habitId: number,
  notificationId: string | null,
): Promise<void> {
  await db.runAsync(`UPDATE habits SET notification_id = ? WHERE id = ?`, [
    notificationId,
    habitId,
  ]);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Permanently delete a habit and all its history (via CASCADE).
 */
export async function deleteHabit(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync(`DELETE FROM habits WHERE id = ?`, [id]);
}
