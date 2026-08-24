import type Database from 'better-sqlite3';
import { buildSampleSavedSession } from '../src/data/presets.js';
import { SEED_EXERCISES } from '../src/data/exercises.js';
import { SEED_PLAYERS } from '../src/data/players.js';
import {
  countExercises,
  countPlayers,
  countSavedSessions,
  insertExercise,
  insertPlayer,
  insertSavedSession,
  listExercises,
  migrateSavedSessionsToRefs,
  migrateExerciseIds,
} from './db.js';

export function seedIfEmpty(db: Database.Database): void {
  if (countExercises(db) > 0) return;

  const insert = db.transaction((exercises: typeof SEED_EXERCISES) => {
    for (const exercise of exercises) {
      insertExercise(db, exercise);
    }
  });

  insert(SEED_EXERCISES);
  console.log(`Database seeded with ${SEED_EXERCISES.length} exercises`);
}

export function seedSessionsIfEmpty(db: Database.Database): void {
  if (countSavedSessions(db) > 0) return;

  const exercises = listExercises(db);
  if (exercises.length === 0) return;

  insertSavedSession(db, buildSampleSavedSession(exercises));
  console.log('Database seeded with 1 sample saved session');
}

export function seedPlayersIfEmpty(db: Database.Database): void {
  if (countPlayers(db) > 0) return;

  const insert = db.transaction((players: typeof SEED_PLAYERS) => {
    for (const player of players) {
      insertPlayer(db, player);
    }
  });

  insert(SEED_PLAYERS);
  console.log(`Database seeded with ${SEED_PLAYERS.length} players`);
}

export function migrateSessionsIfNeeded(db: Database.Database): void {
  migrateExerciseIds(db);
  migrateSavedSessionsToRefs(db);
}
