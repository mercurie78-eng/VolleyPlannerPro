import type Database from 'better-sqlite3';
import { buildSampleSavedSession } from '../src/data/presets.js';
import { SEED_EXERCISES } from '../src/data/exercises.js';
import {
  countExercises,
  countSavedSessions,
  insertExercise,
  insertSavedSession,
  listExercises,
  migrateSavedSessionsToRefs,
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

export function migrateSessionsIfNeeded(db: Database.Database): void {
  migrateSavedSessionsToRefs(db);
}
