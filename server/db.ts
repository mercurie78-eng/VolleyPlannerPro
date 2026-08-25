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
import type { TacticalSceneData } from '../src/tactical-court/sceneState.js';
import {
  hydrateSavedSessionTotals,
  resolveStoredSessionItems,
  serializeSessionItems,
} from '../src/utils/sessionStorage.js';
import { isExerciseIdCoherent, nextExerciseId } from '../src/utils/exerciseId.js';
import { exerciseImageUrl, findExerciseImageFile, renameExerciseImageFile } from './images.js';

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
      exercise_type TEXT,
      target_roles TEXT NOT NULL,
      duration_min INTEGER NOT NULL,
      intensity TEXT NOT NULL,
      description TEXT NOT NULL,
      coaching_points TEXT NOT NULL,
      estimated_jumps INTEGER NOT NULL DEFAULT 0,
      sets INTEGER NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      work_seconds INTEGER NOT NULL DEFAULT 0,
      rest_seconds INTEGER NOT NULL DEFAULT 0
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
      medical_visit_expiry TEXT,
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
  migratePlayersSchema(db);

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
  if (!columnNames.has('exercise_type')) {
    db.exec('ALTER TABLE exercises ADD COLUMN exercise_type TEXT');
  }
  if (!columnNames.has('work_seconds')) {
    db.exec('ALTER TABLE exercises ADD COLUMN work_seconds INTEGER NOT NULL DEFAULT 0');
  }
  if (!columnNames.has('rest_seconds')) {
    db.exec('ALTER TABLE exercises ADD COLUMN rest_seconds INTEGER NOT NULL DEFAULT 0');
  }
  if (!columnNames.has('tactical_image_data')) {
    db.exec('ALTER TABLE exercises ADD COLUMN tactical_image_data TEXT');
  }

  db.exec(`
    UPDATE exercises
    SET exercise_type = 'Situazionale'
    WHERE id = 'ex-tecn-001' AND exercise_type IS NULL
  `);
  db.exec(`
    UPDATE exercises
    SET exercise_type = 'Fondamentale tecnico'
    WHERE id IN ('ex-tecn-002', 'ex-tecn-003', 'ex-tecn-004') AND exercise_type IS NULL
  `);

  db.exec(`
    UPDATE exercises
    SET
      sets = 4,
      reps = (estimated_jumps + 3) / 4
    WHERE estimated_jumps > 0 AND sets = 0 AND reps = 0
  `);
}

function migratePlayersSchema(db: Database.Database): void {
  const columns = db.prepare('PRAGMA table_info(players)').all() as { name: string }[];
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has('medical_visit_expiry')) {
    db.exec('ALTER TABLE players ADD COLUMN medical_visit_expiry TEXT');
  }
}

interface ExerciseRow {
  id: string;
  title: string;
  category: string;
  exercise_type: string | null;
  target_roles: string;
  duration_min: number;
  intensity: string;
  description: string;
  coaching_points: string;
  estimated_jumps: number;
  sets: number;
  reps: number;
  work_seconds: number;
  rest_seconds: number;
  image_url: string | null;
  tactical_image_data: string | null;
}

function parseTacticalImageData(raw: string | null): TacticalSceneData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TacticalSceneData;
  } catch {
    return null;
  }
}

function rowToExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    exerciseType: row.exercise_type ?? undefined,
    targetRoles: JSON.parse(row.target_roles) as string[],
    durationMin: row.duration_min,
    intensity: row.intensity,
    description: row.description,
    coachingPoints: JSON.parse(row.coaching_points) as string[],
    sets: row.sets,
    reps: row.reps,
    workSeconds: row.work_seconds,
    restSeconds: row.rest_seconds,
    imageUrl: row.image_url,
    tacticalImageData: parseTacticalImageData(row.tactical_image_data),
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
    INSERT INTO exercises (id, title, category, exercise_type, target_roles, duration_min, intensity, description, coaching_points, estimated_jumps, sets, reps, work_seconds, rest_seconds, image_url, tactical_image_data)
    VALUES (@id, @title, @category, @exerciseType, @targetRoles, @durationMin, @intensity, @description, @coachingPoints, @estimatedJumps, @sets, @reps, @workSeconds, @restSeconds, @imageUrl, @tacticalImageData)
  `).run({
    id: exercise.id,
    title: exercise.title,
    category: exercise.category,
    exerciseType: exercise.exerciseType ?? null,
    targetRoles: JSON.stringify(exercise.targetRoles),
    durationMin: exercise.durationMin,
    intensity: exercise.intensity,
    description: exercise.description,
    coachingPoints: JSON.stringify(exercise.coachingPoints),
    estimatedJumps: exercise.sets * exercise.reps,
    sets: exercise.sets,
    reps: exercise.reps,
    workSeconds: exercise.workSeconds,
    restSeconds: exercise.restSeconds,
    imageUrl: exercise.imageUrl ?? null,
    tacticalImageData: exercise.tacticalImageData ? JSON.stringify(exercise.tacticalImageData) : null,
  });
  return exercise;
}

export function updateExercise(db: Database.Database, exercise: Exercise): Exercise | undefined {
  const result = db.prepare(`
    UPDATE exercises SET
      title = @title,
      category = @category,
      exercise_type = @exerciseType,
      target_roles = @targetRoles,
      duration_min = @durationMin,
      intensity = @intensity,
      description = @description,
      coaching_points = @coachingPoints,
      estimated_jumps = @estimatedJumps,
      sets = @sets,
      reps = @reps,
      work_seconds = @workSeconds,
      rest_seconds = @restSeconds,
      image_url = @imageUrl,
      tactical_image_data = @tacticalImageData
    WHERE id = @id
  `).run({
    id: exercise.id,
    title: exercise.title,
    category: exercise.category,
    exerciseType: exercise.exerciseType ?? null,
    targetRoles: JSON.stringify(exercise.targetRoles),
    durationMin: exercise.durationMin,
    intensity: exercise.intensity,
    description: exercise.description,
    coachingPoints: JSON.stringify(exercise.coachingPoints),
    estimatedJumps: exercise.sets * exercise.reps,
    sets: exercise.sets,
    reps: exercise.reps,
    workSeconds: exercise.workSeconds,
    restSeconds: exercise.restSeconds,
    imageUrl: exercise.imageUrl ?? null,
    tacticalImageData: exercise.tacticalImageData ? JSON.stringify(exercise.tacticalImageData) : null,
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
  medical_visit_expiry: string | null;
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
    medicalVisitExpiry: row.medical_visit_expiry ?? undefined,
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
    INSERT INTO players (id, first_name, last_name, role, jersey_number, active, medical_visit_expiry, notes)
    VALUES (@id, @firstName, @lastName, @role, @jerseyNumber, @active, @medicalVisitExpiry, @notes)
  `).run({
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    role: player.role,
    jerseyNumber: player.jerseyNumber ?? null,
    active: player.active ? 1 : 0,
    medicalVisitExpiry: player.medicalVisitExpiry ?? null,
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
      medical_visit_expiry = @medicalVisitExpiry,
      notes = @notes
    WHERE id = @id
  `).run({
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    role: player.role,
    jerseyNumber: player.jerseyNumber ?? null,
    active: player.active ? 1 : 0,
    medicalVisitExpiry: player.medicalVisitExpiry ?? null,
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

function remapExerciseIdReferences(itemsJson: string, idMap: Map<string, string>): string {
  if (idMap.size === 0) return itemsJson;

  let raw: unknown;
  try {
    raw = JSON.parse(itemsJson);
  } catch {
    return itemsJson;
  }
  if (!Array.isArray(raw)) return itemsJson;

  const remapped = raw.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const record = item as Record<string, unknown>;

    if (record.type === 'exercise' && typeof record.exerciseId === 'string') {
      const mapped = idMap.get(record.exerciseId);
      return mapped ? { ...record, exerciseId: mapped } : record;
    }

    if (record.type === 'parallel' && Array.isArray(record.stations)) {
      return {
        ...record,
        stations: record.stations.map((station) => {
          if (!station || typeof station !== 'object') return station;
          const st = station as Record<string, unknown>;
          if (typeof st.exerciseId !== 'string') return st;
          const mapped = idMap.get(st.exerciseId);
          return mapped ? { ...st, exerciseId: mapped } : st;
        }),
      };
    }

    if (typeof record.exerciseId === 'string') {
      const mapped = idMap.get(record.exerciseId);
      if (mapped) return { ...record, exerciseId: mapped };
    }
    if (typeof record.id === 'string') {
      const mapped = idMap.get(record.id);
      if (mapped) return { ...record, id: mapped };
    }
    if (record.exercise && typeof record.exercise === 'object') {
      const exercise = record.exercise as Record<string, unknown>;
      if (typeof exercise.id === 'string') {
        const mapped = idMap.get(exercise.id);
        if (mapped) {
          return {
            ...record,
            exerciseId: mapped,
            exercise: { ...exercise, id: mapped },
          };
        }
      }
    }
    if (Array.isArray(record.stations)) {
      return {
        ...record,
        stations: record.stations.map((station) => {
          if (!station || typeof station !== 'object') return station;
          const st = station as Record<string, unknown>;
          const exercise = st.exercise;
          if (!exercise || typeof exercise !== 'object') return st;
          const ex = exercise as Record<string, unknown>;
          if (typeof ex.id !== 'string') return st;
          const mapped = idMap.get(ex.id);
          return mapped ? { ...st, exercise: { ...ex, id: mapped } } : st;
        }),
      };
    }

    return record;
  });

  return JSON.stringify(remapped);
}

/** Rinomina ID esercizi non conformi a ex-cccc-nnn e aggiorna riferimenti collegati. */
export function migrateExerciseIds(db: Database.Database): void {
  const exercises = listExercises(db);
  if (exercises.length === 0) return;

  const allIds = new Set(exercises.map((exercise) => exercise.id));
  const incoherent = exercises
    .filter((exercise) => !isExerciseIdCoherent(exercise.id, exercise.category))
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category, 'it') ||
        a.title.localeCompare(b.title, 'it') ||
        a.id.localeCompare(b.id)
    );

  if (incoherent.length === 0) return;

  const renames: Array<{ oldId: string; newId: string }> = [];

  for (const exercise of incoherent) {
    const newId = nextExerciseId(exercise.category, allIds);
    if (newId === exercise.id) continue;
    renames.push({ oldId: exercise.id, newId });
    allIds.delete(exercise.id);
    allIds.add(newId);
  }

  if (renames.length === 0) return;

  const idMap = new Map(renames.map((rename) => [rename.oldId, rename.newId]));

  const migrate = db.transaction(() => {
    for (const { oldId, newId } of renames) {
      renameExerciseImageFile(oldId, newId);
      const imageUrl = findExerciseImageFile(newId)
        ? exerciseImageUrl(newId)
        : null;

      db.prepare(`
        UPDATE exercises SET
          id = @newId,
          image_url = @imageUrl
        WHERE id = @oldId
      `).run({ oldId, newId, imageUrl });
    }

    const sessions = db
      .prepare('SELECT id, items FROM saved_sessions')
      .all() as Array<{ id: string; items: string }>;
    const updateSession = db.prepare('UPDATE saved_sessions SET items = ? WHERE id = ?');

    for (const session of sessions) {
      const remapped = remapExerciseIdReferences(session.items, idMap);
      if (remapped !== session.items) {
        updateSession.run(remapped, session.id);
      }
    }
  });

  migrate();
  console.log(`Migrated ${renames.length} exercise id(s) to ex-cccc-nnn format`);
}
