// ─────────────────────────────────────────────────────────────────────────────
//  db/userMethods.ts  –  CRUD for the `users` table
// ─────────────────────────────────────────────────────────────────────────────

import { type SQLiteDatabase } from "expo-sqlite";
import { type User, type CreateUserInput, type UpdateUserInput } from "./types";
import { buildSetClause, type SQLiteBindValue } from "./utils";

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Insert a new user and return the created row.
 */
export async function createUser(
  db: SQLiteDatabase,
  input: CreateUserInput,
): Promise<User> {
  const result = await db.runAsync(
    `INSERT INTO users (name, avatar_uri) VALUES (?, ?)`,
    [input.name, input.avatar_uri ?? null],
  );

  const user = await db.getFirstAsync<User>(
    `SELECT * FROM users WHERE id = ?`,
    [result.lastInsertRowId],
  );

  if (!user) throw new Error(`createUser: failed to retrieve inserted row`);
  return user;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Fetch a single user by ID. Returns null if not found. */
export async function getUserById(
  db: SQLiteDatabase,
  id: number,
): Promise<User | null> {
  return db.getFirstAsync<User>(`SELECT * FROM users WHERE id = ?`, [id]);
}

/** Fetch all users (useful for multi-profile support later). */
export async function getAllUsers(db: SQLiteDatabase): Promise<User[]> {
  return db.getAllAsync<User>(`SELECT * FROM users ORDER BY created_at ASC`);
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * Partially update a user's fields.
 * Only the keys present in `input` are changed.
 */
export async function updateUser(
  db: SQLiteDatabase,
  id: number,
  input: UpdateUserInput,
): Promise<User> {
  if (Object.keys(input).length === 0) {
    const existing = await getUserById(db, id);
    if (!existing) throw new Error(`updateUser: user ${id} not found`);
    return existing;
  }

  const { clause, values } = buildSetClause(
    input as Record<string, SQLiteBindValue | undefined>,
  );

  await db.runAsync(`UPDATE users SET ${clause} WHERE id = ?`, [...values, id]);

  const updated = await getUserById(db, id);
  if (!updated)
    throw new Error(`updateUser: user ${id} not found after update`);
  return updated;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a user and (via CASCADE) all their habits + history.
 */
export async function deleteUser(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.runAsync(`DELETE FROM users WHERE id = ?`, [id]);
}
