import type {
  Exercise,
  ParallelBlock,
  ParallelStation,
  SessionExercise,
  SessionItem,
} from '../types';
import { computeSessionTotals, isParallelBlock, toParallelBlock, toSessionExercise } from './session';

export interface StoredSessionExerciseRef {
  type: 'exercise';
  exerciseId: string;
  sessionDuration: number;
  notes: string;
  sets?: number;
  reps?: number;
}

export interface StoredParallelStationRef {
  role: string;
  exerciseId: string;
  sets?: number;
  reps?: number;
}

export interface StoredParallelBlockRef {
  type: 'parallel';
  parallelTitle: string;
  sessionDuration: number;
  notes: string;
  stations: StoredParallelStationRef[];
}

export type StoredSessionItem = StoredSessionExerciseRef | StoredParallelBlockRef;

type LegacyEmbeddedExercise = {
  id?: string;
  exerciseId?: string;
  title?: string;
  category?: string;
  sessionDuration?: number;
  notes?: string;
  sets?: number;
  reps?: number;
  isParallelBlock?: boolean;
  parallelTitle?: string;
  stations?: Array<{
    role: string;
    exercise: Exercise;
    sets?: number;
    reps?: number;
  }>;
};

function inferExerciseId(
  item: LegacyEmbeddedExercise,
  exercisesById: Map<string, Exercise>,
  exercisesByTitle: Map<string, Exercise>
): string | null {
  if (item.exerciseId && exercisesById.has(item.exerciseId)) {
    return item.exerciseId;
  }

  if (item.id) {
    const fromSessionId = item.id.match(/^se-(.+?)-\d+$/);
    if (fromSessionId?.[1] && exercisesById.has(fromSessionId[1])) {
      return fromSessionId[1];
    }
    if (exercisesById.has(item.id)) {
      return item.id;
    }
  }

  if (item.title) {
    const byTitle = exercisesByTitle.get(item.title);
    if (byTitle) return byTitle.id;
  }

  return null;
}

function buildExerciseLookup(exercises: Exercise[]) {
  return {
    byId: new Map(exercises.map((exercise) => [exercise.id, exercise])),
    byTitle: new Map(exercises.map((exercise) => [exercise.title, exercise])),
  };
}

function resolveSessionExerciseRef(
  ref: StoredSessionExerciseRef,
  exercisesById: Map<string, Exercise>
): SessionExercise | null {
  const exercise = exercisesById.get(ref.exerciseId);
  if (!exercise) return null;

  return toSessionExercise(
    exercise,
    ref.sessionDuration,
    ref.notes ?? '',
    ref.sets ?? exercise.sets,
    ref.reps ?? exercise.reps
  );
}

function resolveParallelBlockRef(
  ref: StoredParallelBlockRef,
  exercisesById: Map<string, Exercise>,
  exercisesByTitle: Map<string, Exercise>
): ParallelBlock | null {
  const stations: ParallelStation[] = [];

  for (const stationRef of ref.stations) {
    const exercise =
      exercisesById.get(stationRef.exerciseId) ??
      exercisesByTitle.get(stationRef.exerciseId);

    if (!exercise) continue;

    stations.push({
      role: stationRef.role,
      exercise,
      sets: stationRef.sets,
      reps: stationRef.reps,
    });
  }

  if (stations.length === 0) return null;

  return toParallelBlock(ref.parallelTitle, ref.sessionDuration, ref.notes ?? '', stations);
}

function legacyItemToStored(item: LegacyEmbeddedExercise, lookup: ReturnType<typeof buildExerciseLookup>): StoredSessionItem | null {
  if (item.isParallelBlock && item.stations) {
    const stations: StoredParallelStationRef[] = [];

    for (const station of item.stations) {
      const exerciseId =
        (station.exercise?.id && lookup.byId.has(station.exercise.id)
          ? station.exercise.id
          : inferExerciseId(
              { title: station.exercise?.title, id: station.exercise?.id },
              lookup.byId,
              lookup.byTitle
            )) ?? null;

      if (!exerciseId) continue;

      stations.push({
        role: station.role,
        exerciseId,
        sets: station.sets,
        reps: station.reps,
      });
    }

    if (stations.length === 0) return null;

    return {
      type: 'parallel',
      parallelTitle: item.parallelTitle ?? 'Stazioni in parallelo',
      sessionDuration: item.sessionDuration ?? 0,
      notes: item.notes ?? '',
      stations,
    };
  }

  const exerciseId = inferExerciseId(item, lookup.byId, lookup.byTitle);
  if (!exerciseId) return null;

  return {
    type: 'exercise',
    exerciseId,
    sessionDuration: item.sessionDuration ?? 0,
    notes: item.notes ?? '',
    sets: item.sets,
    reps: item.reps,
  };
}

export function normalizeStoredSessionItems(raw: unknown, exercises: Exercise[]): StoredSessionItem[] {
  if (!Array.isArray(raw)) return [];

  const lookup = buildExerciseLookup(exercises);

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const record = item as LegacyEmbeddedExercise & StoredSessionItem;
      if (record.type === 'exercise' && record.exerciseId) {
        return record as StoredSessionExerciseRef;
      }
      if (record.type === 'parallel' && Array.isArray(record.stations)) {
        return record as StoredParallelBlockRef;
      }

      return legacyItemToStored(record, lookup);
    })
    .filter((item): item is StoredSessionItem => item !== null);
}

export function serializeSessionItems(items: SessionItem[]): StoredSessionItem[] {
  return items
    .map((item) => {
      if (isParallelBlock(item)) {
        return {
          type: 'parallel' as const,
          parallelTitle: item.parallelTitle,
          sessionDuration: item.sessionDuration,
          notes: item.notes ?? '',
          stations: item.stations.map((station) => ({
            role: station.role,
            exerciseId: station.exercise.id,
            sets: station.sets,
            reps: station.reps,
          })),
        };
      }

      return {
        type: 'exercise' as const,
        exerciseId: item.exerciseId,
        sessionDuration: item.sessionDuration,
        notes: item.notes ?? '',
        sets: item.sets,
        reps: item.reps,
      };
    })
    .filter((item) => item.type !== 'exercise' || Boolean(item.exerciseId));
}

export function resolveSessionItems(storedItems: StoredSessionItem[], exercises: Exercise[]): SessionItem[] {
  const lookup = buildExerciseLookup(exercises);

  return storedItems
    .map((item) => {
      if (item.type === 'parallel') {
        return resolveParallelBlockRef(item, lookup.byId, lookup.byTitle);
      }
      return resolveSessionExerciseRef(item, lookup.byId);
    })
    .filter((item): item is SessionItem => item !== null);
}

export function resolveStoredSessionItems(raw: unknown, exercises: Exercise[]): SessionItem[] {
  return resolveSessionItems(normalizeStoredSessionItems(raw, exercises), exercises);
}

export function hydrateSavedSessionTotals<T extends { items: SessionItem[] }>(session: T): T {
  const totals = computeSessionTotals(session.items);
  return {
    ...session,
    totalMinutes: totals.totalMinutes,
    totalJumps: totals.totalJumps,
  };
}
