import type {
  Exercise,
  ParallelBlock,
  ParallelStation,
  SessionExercise,
  SessionItem,
} from '../types';

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
  reps?: number
): SessionExercise {
  return {
    ...ex,
    id: nextSessionItemId(`se-${ex.id}`),
    sessionDuration: duration ?? ex.durationMin,
    notes,
    sets,
    reps,
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

export function computeSessionTotals(items: SessionItem[]) {
  let minutes = 0;
  let jumps = 0;

  for (const item of items) {
    if (isParallelBlock(item)) {
      minutes += item.sessionDuration || 0;
      for (const st of item.stations) {
        jumps += st.exercise.estimatedJumps || 0;
      }
    } else {
      minutes += item.sessionDuration || item.durationMin || 0;
      jumps += item.estimatedJumps || 0;
    }
  }

  return { totalMinutes: minutes, totalJumps: jumps };
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
