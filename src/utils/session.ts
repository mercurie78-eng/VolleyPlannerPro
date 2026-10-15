import type {
  Exercise,
  ParallelBlock,
  ParallelStation,
  SessionExercise,
  SessionItem,
} from '../types';
import { weightedSessionItemTeamJumps, weightedStationTeamJumps } from './jumps';
import { TEAM_SIZE } from '../data/constants';
import { computeTabataDurationMinutes } from './tabata';

let sessionItemCounter = 0;

function nextSessionItemId(prefix: string): string {
  sessionItemCounter += 1;
  return `${prefix}-${sessionItemCounter}`;
}

export function cloneSession<T>(data: T): T {
  return structuredClone(data);
}

export function toSessionExercise(
  ex: Exercise,
  duration?: number,
  notes = '',
  sets?: number,
  reps?: number,
  workSeconds?: number,
  restSeconds?: number
): SessionExercise {
  const resolvedSets = sets ?? ex.sets;
  const resolvedReps = reps ?? ex.reps;
  const resolvedWork = workSeconds ?? ex.workSeconds;
  const resolvedRest = restSeconds ?? ex.restSeconds;
  const tabataMinutes = computeTabataDurationMinutes(
    resolvedWork,
    resolvedRest,
    resolvedSets,
    resolvedReps
  );

  return {
    ...ex,
    exerciseId: ex.id,
    id: nextSessionItemId(`se-${ex.id}`),
    // Carico seduta: init da catalogo (o override espliciti), poi indipendente
    sessionDuration: duration ?? tabataMinutes ?? ex.durationMin,
    notes,
    sets: resolvedSets,
    reps: resolvedReps,
    workSeconds: resolvedWork,
    restSeconds: resolvedRest,
  };
}

/** Crea una stazione parallela con carico seduta inizializzato dal catalogo. */
export function toParallelStation(
  role: string,
  exercise: Exercise,
  overrides?: Partial<Pick<ParallelStation, 'sets' | 'reps' | 'workSeconds' | 'restSeconds'>>
): ParallelStation {
  return {
    role,
    exercise,
    sets: overrides?.sets ?? exercise.sets,
    reps: overrides?.reps ?? exercise.reps,
    workSeconds: overrides?.workSeconds ?? exercise.workSeconds,
    restSeconds: overrides?.restSeconds ?? exercise.restSeconds,
  };
}

export function toParallelBlock(
  parallelTitle: string,
  sessionDuration: number,
  notes: string,
  stations: ParallelStation[]
): ParallelBlock {
  return {
    id: nextSessionItemId('pb'),
    isParallelBlock: true,
    parallelTitle,
    sessionDuration,
    notes,
    stations,
  };
}

export function isParallelBlock(item: SessionItem): item is ParallelBlock {
  return 'isParallelBlock' in item && item.isParallelBlock === true;
}

export function isSessionExercise(item: SessionItem): item is SessionExercise {
  return !isParallelBlock(item);
}

/** Contenuto catalogo da una voce seduta (per embedding in stazioni parallele). */
export function exerciseFromSessionExercise(item: SessionExercise): Exercise {
  return {
    id: item.exerciseId,
    title: item.title,
    category: item.category,
    exerciseType: item.exerciseType ?? null,
    targetRoles: item.targetRoles,
    durationMin: item.durationMin,
    intensity: item.intensity,
    description: item.description,
    coachingPoints: item.coachingPoints,
    // Default catalogo residui sull'oggetto (il carico seduta resta sulla stazione)
    sets: item.sets,
    reps: item.reps,
    workSeconds: item.workSeconds,
    restSeconds: item.restSeconds,
    imageUrl: item.imageUrl ?? null,
    tacticalImageData: item.tacticalImageData ?? null,
  };
}

export function suggestExerciseRole(exercise: Pick<Exercise, 'targetRoles'>): string {
  return exercise.targetRoles.find((role) => role !== 'Tutti') ?? exercise.targetRoles[0] ?? 'Stazione';
}

export function convertSessionExerciseToParallelBlock(
  item: SessionExercise,
  existingRole: string,
  newStation: ParallelStation,
  parallelTitle?: string
): ParallelBlock {
  return toParallelBlock(
    parallelTitle ?? `${item.title} / ${newStation.exercise.title}`,
    item.sessionDuration,
    item.notes,
    [
      toParallelStation(existingRole, exerciseFromSessionExercise(item), {
        sets: item.sets,
        reps: item.reps,
        workSeconds: item.workSeconds,
        restSeconds: item.restSeconds,
      }),
      toParallelStation(newStation.role, newStation.exercise, {
        sets: newStation.sets,
        reps: newStation.reps,
        workSeconds: newStation.workSeconds,
        restSeconds: newStation.restSeconds,
      }),
    ]
  );
}

/**
 * Aggiorna solo il contenuto da catalogo in una voce seduta,
 * senza toccare durata/serie/ripetizioni/tabata della seduta.
 */
export function applyCatalogContentToSessionItem(
  item: SessionItem,
  catalog: Exercise
): SessionItem {
  if (isParallelBlock(item)) {
    return {
      ...item,
      stations: item.stations.map((station) =>
        station.exercise.id === catalog.id
          ? { ...station, exercise: catalog }
          : station
      ),
    };
  }

  if (!isSessionExercise(item) || item.exerciseId !== catalog.id) return item;

  return {
    ...item,
    title: catalog.title,
    category: catalog.category,
    exerciseType: catalog.exerciseType ?? null,
    targetRoles: catalog.targetRoles,
    durationMin: catalog.durationMin,
    intensity: catalog.intensity,
    description: catalog.description,
    coachingPoints: catalog.coachingPoints,
    imageUrl: catalog.imageUrl ?? null,
    tacticalImageData: catalog.tacticalImageData ?? null,
    // carico seduta invariato: sessionDuration, sets, reps, workSeconds, restSeconds, notes
  };
}

export function computeSessionTotals(items: SessionItem[]) {
  let minutes = 0;
  let teamJumps = 0;

  for (const item of items) {
    if (isParallelBlock(item)) {
      minutes += getSessionItemMinutes(item);
      for (const st of item.stations) {
        teamJumps += weightedStationTeamJumps(st);
      }
    } else {
      minutes += getSessionItemMinutes(item);
      teamJumps += weightedSessionItemTeamJumps(item);
    }
  }

  return {
    totalMinutes: minutes,
    totalJumps: Math.round(teamJumps / TEAM_SIZE),
  };
}

export function getSessionItemCategory(item: SessionItem): string {
  if (isParallelBlock(item)) {
    return item.stations[0]?.exercise.category ?? 'Altro';
  }
  return item.category;
}

export function getSessionItemMinutes(item: SessionItem): number {
  if (isParallelBlock(item)) {
    return item.sessionDuration || 0;
  }
  const tabataMinutes = computeTabataDurationMinutes(
    item.workSeconds,
    item.restSeconds,
    item.sets,
    item.reps
  );
  if (tabataMinutes != null) return tabataMinutes;
  return item.sessionDuration || item.durationMin || 0;
}

/** Aggiorna sessionDuration se l'esercizio è tabata; altrimenti lascia invariata. */
export function withSyncedTabataDuration(item: SessionExercise): SessionExercise {
  const tabataMinutes = computeTabataDurationMinutes(
    item.workSeconds,
    item.restSeconds,
    item.sets,
    item.reps
  );
  if (tabataMinutes == null || item.sessionDuration === tabataMinutes) return item;
  return { ...item, sessionDuration: tabataMinutes };
}

export interface SessionItemSchedule {
  index: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

function parseTimeToMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return 0;
  const hours = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const minutes = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  return hours * 60 + minutes;
}

export function formatMinutesAsTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Calcola orario di inizio/fine di ogni voce a partire dall'orario di inizio seduta. */
export function computeSessionSchedule(
  items: SessionItem[],
  startTime: string
): SessionItemSchedule[] {
  let cursor = parseTimeToMinutes(startTime);

  return items.map((item, index) => {
    const durationMinutes = getSessionItemMinutes(item);
    const itemStart = cursor;
    const itemEnd = cursor + durationMinutes;
    cursor = itemEnd;

    return {
      index,
      startTime: formatMinutesAsTime(itemStart),
      endTime: formatMinutesAsTime(itemEnd),
      durationMinutes,
    };
  });
}

export interface SessionCategoryGroup {
  category: string;
  totalMinutes: number;
  items: Array<{ item: SessionItem; index: number }>;
}

/** Raggruppa voci consecutive della sequenza che condividono la stessa categoria. */
export function groupSessionByCategorySequence(items: SessionItem[]): SessionCategoryGroup[] {
  const groups: SessionCategoryGroup[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const category = getSessionItemCategory(item);
    const minutes = getSessionItemMinutes(item);
    const last = groups[groups.length - 1];

    if (last && last.category === category) {
      last.items.push({ item, index });
      last.totalMinutes += minutes;
    } else {
      groups.push({
        category,
        totalMinutes: minutes,
        items: [{ item, index }],
      });
    }
  }

  return groups;
}

export function updateSessionAtIndex(
  items: SessionItem[],
  index: number,
  updater: (item: SessionItem) => SessionItem
): SessionItem[] {
  return items.map((item, i) => (i === index ? updater(item) : item));
}

export function moveSessionItem(items: SessionItem[], index: number, direction: -1 | 1): SessionItem[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function withFreshSessionIds(items: SessionItem[]): SessionItem[] {
  return items.map((item) => {
    if (isParallelBlock(item)) {
      return { ...item, id: nextSessionItemId('pb') };
    }
    return { ...item, id: nextSessionItemId('se') };
  });
}
