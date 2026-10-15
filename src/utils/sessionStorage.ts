import type {
  Exercise,
  ParallelBlock,
  ParallelStation,
  SessionExercise,
  SessionItem,
} from '../types';
import { computeSessionTotals, isParallelBlock, toParallelBlock, toParallelStation, toSessionExercise } from './session';

export interface StoredSessionExerciseRef {
  type: 'exercise';
  exerciseId: string;
  /** Carico seduta (non i default del catalogo). */
  sessionDuration: number;
  notes: string;
  sets: number;
  reps: number;
  workSeconds: number;
  restSeconds: number;
}

export interface StoredParallelStationRef {
  role: string;
  exerciseId: string;
  sets: number;
  reps: number;
  workSeconds: number;
  restSeconds: number;
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
  workSeconds?: number;
  restSeconds?: number;
  isParallelBlock?: boolean;
  parallelTitle?: string;
  stations?: Array<{
    role: string;
    exercise: Exercise;
    sets?: number;
    reps?: number;
    workSeconds?: number;
    restSeconds?: number;
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

function resolveLoadNumber(
  stored: number | undefined,
  catalogDefault: number
): number {
  return stored ?? catalogDefault;
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
    resolveLoadNumber(ref.sets, exercise.sets),
    resolveLoadNumber(ref.reps, exercise.reps),
    resolveLoadNumber(ref.workSeconds, exercise.workSeconds),
    resolveLoadNumber(ref.restSeconds, exercise.restSeconds)
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

    stations.push(
      toParallelStation(stationRef.role, exercise, {
        sets: resolveLoadNumber(stationRef.sets, exercise.sets),
        reps: resolveLoadNumber(stationRef.reps, exercise.reps),
        workSeconds: resolveLoadNumber(stationRef.workSeconds, exercise.workSeconds),
        restSeconds: resolveLoadNumber(stationRef.restSeconds, exercise.restSeconds),
      })
    );
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
      const catalog = lookup.byId.get(exerciseId);

      stations.push({
        role: station.role,
        exerciseId,
        sets: resolveLoadNumber(station.sets, catalog?.sets ?? 0),
        reps: resolveLoadNumber(station.reps, catalog?.reps ?? 0),
        workSeconds: resolveLoadNumber(station.workSeconds, catalog?.workSeconds ?? 0),
        restSeconds: resolveLoadNumber(station.restSeconds, catalog?.restSeconds ?? 0),
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
  const catalog = lookup.byId.get(exerciseId);

  return {
    type: 'exercise',
    exerciseId,
    sessionDuration: item.sessionDuration ?? catalog?.durationMin ?? 0,
    notes: item.notes ?? '',
    sets: resolveLoadNumber(item.sets, catalog?.sets ?? 0),
    reps: resolveLoadNumber(item.reps, catalog?.reps ?? 0),
    workSeconds: resolveLoadNumber(item.workSeconds, catalog?.workSeconds ?? 0),
    restSeconds: resolveLoadNumber(item.restSeconds, catalog?.restSeconds ?? 0),
  };
}

export function normalizeStoredSessionItems(raw: unknown, exercises: Exercise[]): StoredSessionItem[] {
  if (!Array.isArray(raw)) return [];

  const lookup = buildExerciseLookup(exercises);

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const record = item as LegacyEmbeddedExercise & Partial<StoredSessionItem>;
      if (record.type === 'exercise' && record.exerciseId) {
        const catalog = lookup.byId.get(record.exerciseId);
        return {
          type: 'exercise' as const,
          exerciseId: record.exerciseId,
          sessionDuration: record.sessionDuration ?? catalog?.durationMin ?? 0,
          notes: record.notes ?? '',
          sets: resolveLoadNumber(record.sets, catalog?.sets ?? 0),
          reps: resolveLoadNumber(record.reps, catalog?.reps ?? 0),
          workSeconds: resolveLoadNumber(record.workSeconds, catalog?.workSeconds ?? 0),
          restSeconds: resolveLoadNumber(record.restSeconds, catalog?.restSeconds ?? 0),
        };
      }
      if (record.type === 'parallel' && Array.isArray(record.stations)) {
        const stations = record.stations as Array<
          StoredParallelStationRef | NonNullable<LegacyEmbeddedExercise['stations']>[number]
        >;
        return {
          type: 'parallel' as const,
          parallelTitle: record.parallelTitle ?? 'Stazioni in parallelo',
          sessionDuration: record.sessionDuration ?? 0,
          notes: record.notes ?? '',
          stations: stations.map((station) => {
            const exerciseId =
              'exerciseId' in station && station.exerciseId
                ? station.exerciseId
                : 'exercise' in station && station.exercise?.id
                  ? station.exercise.id
                  : '';
            const catalog = lookup.byId.get(exerciseId);
            return {
              role: station.role,
              exerciseId,
              sets: resolveLoadNumber(station.sets, catalog?.sets ?? 0),
              reps: resolveLoadNumber(station.reps, catalog?.reps ?? 0),
              workSeconds: resolveLoadNumber(station.workSeconds, catalog?.workSeconds ?? 0),
              restSeconds: resolveLoadNumber(station.restSeconds, catalog?.restSeconds ?? 0),
            };
          }).filter((station) => Boolean(station.exerciseId)),
        };
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
            workSeconds: station.workSeconds,
            restSeconds: station.restSeconds,
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
        workSeconds: item.workSeconds,
        restSeconds: item.restSeconds,
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
