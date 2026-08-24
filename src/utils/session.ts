import type {
  Exercise,
  ParallelBlock,
  ParallelStation,
  SessionExercise,
  SessionItem,
} from '../types';
import { weightedSessionItemTeamJumps, weightedStationTeamJumps } from './jumps';
import { TEAM_SIZE } from '../data/constants';

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
  return {
    ...ex,
    exerciseId: ex.id,
    id: nextSessionItemId(`se-${ex.id}`),
    sessionDuration: duration ?? ex.durationMin,
    notes,
    sets: sets ?? ex.sets,
    reps: reps ?? ex.reps,
    workSeconds: workSeconds ?? ex.workSeconds,
    restSeconds: restSeconds ?? ex.restSeconds,
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
    sets: item.sets,
    reps: item.reps,
    workSeconds: item.workSeconds,
    restSeconds: item.restSeconds,
    imageUrl: item.imageUrl ?? null,
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
      {
        role: existingRole,
        exercise: exerciseFromSessionExercise(item),
        sets: item.sets,
        reps: item.reps,
        workSeconds: item.workSeconds,
        restSeconds: item.restSeconds,
      },
      newStation,
    ]
  );
}

export function computeSessionTotals(items: SessionItem[]) {
  let minutes = 0;
  let teamJumps = 0;

  for (const item of items) {
    if (isParallelBlock(item)) {
      minutes += item.sessionDuration || 0;
      for (const st of item.stations) {
        teamJumps += weightedStationTeamJumps(st);
      }
    } else {
      minutes += item.sessionDuration || item.durationMin || 0;
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
  return item.sessionDuration || item.durationMin || 0;
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
