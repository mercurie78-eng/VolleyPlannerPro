import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AttendanceRecord,
  Exercise,
  Player,
  SavedSession,
  SessionAttendance,
  SessionItem,
} from '../src/types/index.js';
import {
  hydrateSavedSessionTotals,
  resolveStoredSessionItems,
  serializeSessionItems,
} from '../src/utils/sessionStorage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'volley.db');

export function getDb(): Database.Database {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      target_roles TEXT NOT NULL,
      duration_min INTEGER NOT NULL,
      intensity TEXT NOT NULL,
      description TEXT NOT NULL,
      coaching_points TEXT NOT NULL,
      estimated_jumps INTEGER NOT NULL DEFAULT 0,
      sets INTEGER NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS saved_sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      focus TEXT NOT NULL,
      target_minutes INTEGER NOT NULL,
      total_minutes INTEGER NOT NULL,
      total_jumps INTEGER NOT NULL,
      items TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL,
      jersey_number INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS training_attendance (
      session_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      present INTEGER NOT NULL DEFAULT 1,
      note TEXT,
      recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (session_id, player_id),
      FOREIGN KEY (session_id) REFERENCES saved_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    )
  `);

  migrateExercisesSchema(db);

  return db;
}

function migrateExercisesSchema(db: Database.Database): void {
  const columns = db.prepare('PRAGMA table_info(exercises)').all() as { name: string }[];
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('sets')) {
    db.exec('ALTER TABLE exercises ADD COLUMN sets INTEGER NOT NULL DEFAULT 0');
  }
  if (!columnNames.has('reps')) {
    db.exec('ALTER TABLE exercises ADD COLUMN reps INTEGER NOT NULL DEFAULT 0');
  }
  if (!columnNames.has('image_url')) {
    db.exec('ALTER TABLE exercises ADD COLUMN image_url TEXT');
  }

  db.exec(`
    UPDATE exercises
    SET
      sets = 4,
      reps = (estimated_jumps + 3) / 4
    WHERE estimated_jumps > 0 AND sets = 0 AND reps = 0
  `);
}

interface ExerciseRow {
  id: string;
  title: string;
  category: string;
  target_roles: string;
  duration_min: number;
  intensity: string;
  description: string;
  coaching_points: string;
  estimated_jumps: number;
  sets: number;
  reps: number;
  image_url: string | null;
}

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    targetRoles: JSON.parse(row.target_roles) as string[],
    durationMin: row.duration_min,
    intensity: row.intensity,
    description: row.description,
    coachingPoints: JSON.parse(row.coaching_points) as string[],
    sets: row.sets,
    reps: row.reps,
    imageUrl: row.image_url,
  };
}

export function listExercises(db: Database.Database): Exercise[] {
  const rows = db.prepare('SELECT * FROM exercises ORDER BY category, title').all() as ExerciseRow[];
  return rows.map(rowToExercise);
}

export function getExerciseById(db: Database.Database, id: string): Exercise | undefined {
  const row = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id) as ExerciseRow | undefined;
  return row ? rowToExercise(row) : undefined;
}

export function insertExercise(db: Database.Database, exercise: Exercise): Exercise {
  db.prepare(`
    INSERT INTO exercises (id, title, category, target_roles, duration_min, intensity, description, coaching_points, estimated_jumps, sets, reps, image_url)
    VALUES (@id, @title, @category, @targetRoles, @durationMin, @intensity, @description, @coachingPoints, @estimatedJumps, @sets, @reps, @imageUrl)
  `).run({
    id: exercise.id,
    title: exercise.title,
    category: exercise.category,
    targetRoles: JSON.stringify(exercise.targetRoles),
    durationMin: exercise.durationMin,
    intensity: exercise.intensity,
    description: exercise.description,
    coachingPoints: JSON.stringify(exercise.coachingPoints),
    estimatedJumps: exercise.sets * exercise.reps,
    sets: exercise.sets,
    reps: exercise.reps,
    imageUrl: exercise.imageUrl ?? null,
  });
  return exercise;
}

export function updateExercise(db: Database.Database, exercise: Exercise): Exercise | undefined {
  const result = db.prepare(`
    UPDATE exercises SET
      title = @title,
      category = @category,
      target_roles = @targetRoles,
      duration_min = @durationMin,
      intensity = @intensity,
      description = @description,
      coaching_points = @coachingPoints,
      estimated_jumps = @estimatedJumps,
      sets = @sets,
      reps = @reps,
      image_url = @imageUrl
    WHERE id = @id
  `).run({
    id: exercise.id,
    title: exercise.title,
    category: exercise.category,
    targetRoles: JSON.stringify(exercise.targetRoles),
    durationMin: exercise.durationMin,
    intensity: exercise.intensity,
    description: exercise.description,
    coachingPoints: JSON.stringify(exercise.coachingPoints),
    estimatedJumps: exercise.sets * exercise.reps,
    sets: exercise.sets,
    reps: exercise.reps,
    imageUrl: exercise.imageUrl ?? null,
  });

  if (result.changes === 0) return undefined;
  return exercise;
}

export function updateExerciseImageUrl(
  db: Database.Database,
  id: string,
  imageUrl: string | null
): Exercise | undefined {
  const result = db.prepare('UPDATE exercises SET image_url = @imageUrl WHERE id = @id').run({
    id,
    imageUrl,
  });
  if (result.changes === 0) return undefined;
  return getExerciseById(db, id);
}

export function deleteExercise(db: Database.Database, id: string): boolean {
  const result = db.prepare('DELETE FROM exercises WHERE id = ?').run(id);
  return result.changes > 0;
}

export function countExercises(db: Database.Database): number {
  const row = db.prepare('SELECT COUNT(*) AS count FROM exercises').get() as { count: number };
  return row.count;
}

interface SavedSessionRow {
  id: string;
  date: string;
  title: string;
  focus: string;
  target_minutes: number;
  total_minutes: number;
  total_jumps: number;
  items: string;
}

function rowToSavedSession(row: SavedSessionRow, db: Database.Database): SavedSession {
  const exercises = listExercises(db);
  const items = resolveStoredSessionItems(JSON.parse(row.items), exercises);

  return hydrateSavedSessionTotals({
    id: row.id,
    date: row.date,
    title: row.title,
    focus: row.focus,
    targetMinutes: row.target_minutes,
    totalMinutes: row.total_minutes,
    totalJumps: row.total_jumps,
    items,
  });
}

function persistSessionItems(items: SessionItem[]): string {
  return JSON.stringify(serializeSessionItems(items));
}

export function listSavedSessions(db: Database.Database): SavedSession[] {
  const rows = db
    .prepare('SELECT * FROM saved_sessions ORDER BY date DESC, created_at DESC')
    .all() as SavedSessionRow[];
  return rows.map((row) => rowToSavedSession(row, db));
}

export function getSavedSessionById(db: Database.Database, id: string): SavedSession | undefined {
  const row = db.prepare('SELECT * FROM saved_sessions WHERE id = ?').get(id) as SavedSessionRow | undefined;
  return row ? rowToSavedSession(row, db) : undefined;
}

export function insertSavedSession(db: Database.Database, session: SavedSession): SavedSession {
  const hydrated = hydrateSavedSessionTotals(session);

  db.prepare(`
    INSERT INTO saved_sessions (id, date, title, focus, target_minutes, total_minutes, total_jumps, items)
    VALUES (@id, @date, @title, @focus, @targetMinutes, @totalMinutes, @totalJumps, @items)
  `).run({
    id: hydrated.id,
    date: hydrated.date,
    title: hydrated.title,
    focus: hydrated.focus,
    targetMinutes: hydrated.targetMinutes,
    totalMinutes: hydrated.totalMinutes,
    totalJumps: hydrated.totalJumps,
    items: persistSessionItems(hydrated.items),
  });

  return hydrated;
}

export function updateSavedSession(db: Database.Database, session: SavedSession): SavedSession | undefined {
  const hydrated = hydrateSavedSessionTotals(session);

  const result = db.prepare(`
    UPDATE saved_sessions SET
      date = @date,
      title = @title,
      focus = @focus,
      target_minutes = @targetMinutes,
      total_minutes = @totalMinutes,
      total_jumps = @totalJumps,
      items = @items
    WHERE id = @id
  `).run({
    id: hydrated.id,
    date: hydrated.date,
    title: hydrated.title,
    focus: hydrated.focus,
    targetMinutes: hydrated.targetMinutes,
    totalMinutes: hydrated.totalMinutes,
    totalJumps: hydrated.totalJumps,
    items: persistSessionItems(hydrated.items),
  });

  if (result.changes === 0) return undefined;
  return hydrated;
}

export function deleteSavedSession(db: Database.Database, id: string): boolean {
  const result = db.prepare('DELETE FROM saved_sessions WHERE id = ?').run(id);
  return result.changes > 0;
}

export function countSavedSessions(db: Database.Database): number {
  const row = db.prepare('SELECT COUNT(*) AS count FROM saved_sessions').get() as { count: number };
  return row.count;
}

interface PlayerRow {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  jersey_number: number | null;
  active: number;
  notes: string | null;
  created_at: string;
}

function rowToPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    jerseyNumber: row.jersey_number,
    active: row.active === 1,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export function listPlayers(db: Database.Database, activeOnly = false): Player[] {
  const query = activeOnly
    ? 'SELECT * FROM players WHERE active = 1 ORDER BY last_name, first_name'
    : 'SELECT * FROM players ORDER BY last_name, first_name';
  const rows = db.prepare(query).all() as PlayerRow[];
  return rows.map(rowToPlayer);
}

export function getPlayerById(db: Database.Database, id: string): Player | undefined {
  const row = db.prepare('SELECT * FROM players WHERE id = ?').get(id) as PlayerRow | undefined;
  return row ? rowToPlayer(row) : undefined;
}

export function insertPlayer(db: Database.Database, player: Player): Player {
  db.prepare(`
    INSERT INTO players (id, first_name, last_name, role, jersey_number, active, notes)
    VALUES (@id, @firstName, @lastName, @role, @jerseyNumber, @active, @notes)
  `).run({
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    role: player.role,
    jerseyNumber: player.jerseyNumber ?? null,
    active: player.active ? 1 : 0,
    notes: player.notes ?? null,
  });
  return player;
}

export function updatePlayer(db: Database.Database, player: Player): Player | undefined {
  const result = db.prepare(`
    UPDATE players SET
      first_name = @firstName,
      last_name = @lastName,
      role = @role,
      jersey_number = @jerseyNumber,
      active = @active,
      notes = @notes
    WHERE id = @id
  `).run({
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    role: player.role,
    jerseyNumber: player.jerseyNumber ?? null,
    active: player.active ? 1 : 0,
    notes: player.notes ?? null,
  });

  if (result.changes === 0) return undefined;
  return player;
}

export function deletePlayer(db: Database.Database, id: string): boolean {
  const result = db.prepare('DELETE FROM players WHERE id = ?').run(id);
  return result.changes > 0;
}

export function countPlayers(db: Database.Database): number {
  const row = db.prepare('SELECT COUNT(*) AS count FROM players').get() as { count: number };
  return row.count;
}

interface AttendanceRow {
  session_id: string;
  player_id: string;
  present: number;
  note: string | null;
  recorded_at: string;
}

function rowToAttendanceRecord(row: AttendanceRow): AttendanceRecord {
  return {
    sessionId: row.session_id,
    playerId: row.player_id,
    present: row.present === 1,
    note: row.note ?? undefined,
    recordedAt: row.recorded_at,
  };
}

export function getSessionAttendance(db: Database.Database, sessionId: string): SessionAttendance {
  const rows = db
    .prepare('SELECT * FROM training_attendance WHERE session_id = ? ORDER BY player_id')
    .all(sessionId) as AttendanceRow[];

  return {
    sessionId,
    records: rows.map(rowToAttendanceRecord),
  };
}

export function upsertSessionAttendance(
  db: Database.Database,
  sessionId: string,
  records: AttendanceRecord[]
): SessionAttendance {
  const upsert = db.prepare(`
    INSERT INTO training_attendance (session_id, player_id, present, note, recorded_at)
    VALUES (@sessionId, @playerId, @present, @note, datetime('now'))
    ON CONFLICT(session_id, player_id) DO UPDATE SET
      present = excluded.present,
      note = excluded.note,
      recorded_at = datetime('now')
  `);

  const replaceAll = db.transaction((items: AttendanceRecord[]) => {
    db.prepare('DELETE FROM training_attendance WHERE session_id = ?').run(sessionId);
    for (const record of items) {
      upsert.run({
        sessionId,
        playerId: record.playerId,
        present: record.present ? 1 : 0,
        note: record.note ?? null,
      });
    }
  });

  replaceAll(records);
  return getSessionAttendance(db, sessionId);
}

/** Converte allenamenti legacy (snapshot completi) al formato a riferimenti. */
export function migrateSavedSessionsToRefs(db: Database.Database): void {
  const rows = db
    .prepare('SELECT id, items FROM saved_sessions')
    .all() as Array<{ id: string; items: string }>;
  const exercises = listExercises(db);

  for (const row of rows) {
    const stored = serializeSessionItems(resolveStoredSessionItems(JSON.parse(row.items), exercises));
    const serialized = JSON.stringify(stored);
    if (serialized !== row.items) {
      db.prepare('UPDATE saved_sessions SET items = ? WHERE id = ?').run(serialized, row.id);
    }
  }
}
