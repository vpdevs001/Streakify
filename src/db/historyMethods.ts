// ─────────────────────────────────────────────────────────────────────────────
//  db/historyMethods.ts  –  CRUD for `habit_history` + summary queries
// ─────────────────────────────────────────────────────────────────────────────

import { type SQLiteDatabase } from "expo-sqlite";
import {
  type HabitHistory,
  type CreateHistoryInput,
  type UpdateHistoryInput,
  type WeeklySummary,
  type MonthlySummary,
} from "./types";
import {
  buildSetClause,
  type SQLiteBindValue,
  todayDateString,
  weekStart,
  weekEnd,
  toDateString,
  daysInMonth,
} from "./utils";

// ─── Create / Upsert ─────────────────────────────────────────────────────────

/**
 * Record a habit completion for a given date.
 * Uses INSERT OR REPLACE so calling it twice on the same day just updates
 * the existing record (the UNIQUE constraint on (habit_id, date) is respected).
 */
export async function upsertHabitHistory(
  db: SQLiteDatabase,
  input: CreateHistoryInput,
): Promise<HabitHistory> {
  await db.runAsync(
    `INSERT INTO habit_history
       (habit_id, user_id, date, status, completion_count, note)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (habit_id, date)
     DO UPDATE SET
       status           = excluded.status,
       completion_count = excluded.completion_count,
       note             = excluded.note`,
    [
      input.habit_id,
      input.user_id,
      input.date,
      input.status,
      input.completion_count ?? 1,
      input.note ?? null,
    ],
  );

  const row = await db.getFirstAsync<HabitHistory>(
    `SELECT * FROM habit_history WHERE habit_id = ? AND date = ?`,
    [input.habit_id, input.date],
  );
  if (!row) throw new Error("upsertHabitHistory: failed to retrieve row");
  return row;
}

/** Mark today as completed for a habit. Shorthand for common UI action. */
export async function markHabitCompleted(
  db: SQLiteDatabase,
  habitId: number,
  userId: number,
  completionCount = 1,
  note?: string,
): Promise<HabitHistory> {
  return upsertHabitHistory(db, {
    habit_id: habitId,
    user_id: userId,
    date: todayDateString(),
    status: "completed",
    completion_count: completionCount,
    note,
  });
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch a single history record by its PK. */
export async function getHistoryById(
  db: SQLiteDatabase,
  id: number,
): Promise<HabitHistory | null> {
  return db.getFirstAsync<HabitHistory>(
    `SELECT * FROM habit_history WHERE id = ?`,
    [id],
  );
}

/** Fetch the history record for a specific habit on a specific date. */
export async function getHistoryForDate(
  db: SQLiteDatabase,
  habitId: number,
  date: string,
): Promise<HabitHistory | null> {
  return db.getFirstAsync<HabitHistory>(
    `SELECT * FROM habit_history WHERE habit_id = ? AND date = ?`,
    [habitId, date],
  );
}

/** Fetch all history for a habit between two dates (inclusive). */
export async function getHistoryRange(
  db: SQLiteDatabase,
  habitId: number,
  fromDate: string,
  toDate: string,
): Promise<HabitHistory[]> {
  return db.getAllAsync<HabitHistory>(
    `SELECT * FROM habit_history
     WHERE habit_id = ? AND date BETWEEN ? AND ?
     ORDER BY date ASC`,
    [habitId, fromDate, toDate],
  );
}

/**
 * Fetch all history for a user on a single date.
 * Useful for rendering the "today" dashboard (one row per habit).
 */
export async function getAllHabitsHistoryForDate(
  db: SQLiteDatabase,
  userId: number,
  date: string,
): Promise<HabitHistory[]> {
  return db.getAllAsync<HabitHistory>(
    `SELECT * FROM habit_history WHERE user_id = ? AND date = ?`,
    [userId, date],
  );
}

/** Fetch the N most-recent history records for a habit. */
export async function getRecentHistory(
  db: SQLiteDatabase,
  habitId: number,
  limit = 30,
): Promise<HabitHistory[]> {
  return db.getAllAsync<HabitHistory>(
    `SELECT * FROM habit_history
     WHERE habit_id = ?
     ORDER BY date DESC
     LIMIT ?`,
    [habitId, limit],
  );
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Partially update a history record (e.g. change status or add a note).
 */
export async function updateHistory(
  db: SQLiteDatabase,
  id: number,
  input: UpdateHistoryInput,
): Promise<HabitHistory> {
  if (Object.keys(input).length === 0) {
    const existing = await getHistoryById(db, id);
    if (!existing) throw new Error(`updateHistory: record ${id} not found`);
    return existing;
  }

  const { clause, values } = buildSetClause(
    input as Record<string, SQLiteBindValue | undefined>,
  );

  await db.runAsync(`UPDATE habit_history SET ${clause} WHERE id = ?`, [
    ...values,
    id,
  ]);

  const updated = await getHistoryById(db, id);
  if (!updated)
    throw new Error(`updateHistory: record ${id} not found after update`);
  return updated;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/** Delete a single history record. */
export async function deleteHistoryById(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.runAsync(`DELETE FROM habit_history WHERE id = ?`, [id]);
}

/** Delete the history entry for a habit on a specific date. */
export async function deleteHistoryForDate(
  db: SQLiteDatabase,
  habitId: number,
  date: string,
): Promise<void> {
  await db.runAsync(
    `DELETE FROM habit_history WHERE habit_id = ? AND date = ?`,
    [habitId, date],
  );
}

// ─── Weekly summary ───────────────────────────────────────────────────────────

/**
 * Returns a weekly completion summary for every active habit of a user.
 * Defaults to the current week (Mon–Sun).
 *
 * @param weekOf  Any date within the target week. Defaults to today.
 */
export async function getWeeklySummary(
  db: SQLiteDatabase,
  userId: number,
  weekOf: Date = new Date(),
): Promise<WeeklySummary[]> {
  const start = weekStart(weekOf);
  const end = weekEnd(weekOf);
  const startStr = toDateString(start);
  const endStr = toDateString(end);

  // One row per habit that has any history in the week,
  // plus habits with zero completions (LEFT JOIN via subquery).
  const rows = await db.getAllAsync<{
    habit_id: number;
    completed_days: number;
    target_days: number;
  }>(
    `SELECT
       h.id                                           AS habit_id,
       COALESCE(SUM(CASE WHEN hh.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_days,
       7                                              AS target_days
     FROM habits h
     LEFT JOIN habit_history hh
       ON hh.habit_id = h.id AND hh.date BETWEEN ? AND ?
     WHERE h.user_id = ? AND h.is_archived = 0
     GROUP BY h.id`,
    [startStr, endStr, userId],
  );

  return rows.map((r) => ({
    week_start: startStr,
    week_end: endStr,
    habit_id: r.habit_id,
    completed_days: r.completed_days,
    target_days: r.target_days,
    completion_rate: r.target_days > 0 ? r.completed_days / r.target_days : 0,
  }));
}

// ─── Monthly summary ──────────────────────────────────────────────────────────

/**
 * Returns a monthly completion summary for every active habit of a user.
 *
 * @param year   Full 4-digit year
 * @param month  1-indexed month (1 = January)
 */
export async function getMonthlySummary(
  db: SQLiteDatabase,
  userId: number,
  year: number,
  month: number,
): Promise<MonthlySummary[]> {
  const paddedMonth = String(month).padStart(2, "0");
  const prefix = `${year}-${paddedMonth}`;
  const totalDays = daysInMonth(year, month);

  const rows = await db.getAllAsync<{
    habit_id: number;
    completed_days: number;
  }>(
    `SELECT
       h.id                                           AS habit_id,
       COALESCE(SUM(CASE WHEN hh.status = 'completed' THEN 1 ELSE 0 END), 0) AS completed_days
     FROM habits h
     LEFT JOIN habit_history hh
       ON hh.habit_id = h.id AND hh.date LIKE ? || '-%'
     WHERE h.user_id = ? AND h.is_archived = 0
     GROUP BY h.id`,
    [prefix, userId],
  );

  return rows.map((r) => ({
    year,
    month,
    habit_id: r.habit_id,
    completed_days: r.completed_days,
    total_days_in_month: totalDays,
    completion_rate: r.completed_days / totalDays,
  }));
}

// ─── Calendar heatmap data ────────────────────────────────────────────────────

/**
 * Returns a map of { [date: string]: CompletionStatus } for a habit
 * over the past `days` days (including today). Useful for calendar views.
 */
export async function getHabitCalendarData(
  db: SQLiteDatabase,
  habitId: number,
  days = 90,
): Promise<Record<string, HabitHistory["status"]>> {
  const rows = await db.getAllAsync<{
    date: string;
    status: HabitHistory["status"];
  }>(
    `SELECT date, status FROM habit_history
     WHERE habit_id = ?
       AND date >= date('now', ?)
     ORDER BY date ASC`,
    [habitId, `-${days} days`],
  );

  return Object.fromEntries(rows.map((r) => [r.date, r.status]));
}
