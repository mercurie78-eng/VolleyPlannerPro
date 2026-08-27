export function formatSetsRepsLabel(
  sets?: number | null,
  reps?: number | null,
  options?: { repsShort?: boolean }
): string | null {
  const normalizedSets = sets ?? 0;
  const normalizedReps = reps ?? 0;
  const repWord = options?.repsShort ? 'rip.' : 'ripetizioni';

  if (normalizedSets <= 0 && normalizedReps <= 0) return null;
  if (normalizedSets > 0 && normalizedReps > 0) {
    return `${normalizedSets} serie × ${normalizedReps} ${repWord}`;
  }
  if (normalizedSets > 0) return `${normalizedSets} serie`;
  return `${normalizedReps} ${repWord}`;
}

export function formatWorkRestLabel(
  workSeconds: number,
  restSeconds: number,
  sets?: number
): string | null {
  if (workSeconds <= 0 && restSeconds <= 0) return null;

  const work = workSeconds > 0 ? `${workSeconds}s lavoro` : null;
  const rest = restSeconds > 0 ? `${restSeconds}s pausa` : null;
  const timing = [work, rest].filter(Boolean).join(' / ');
  if (!timing) return null;

  if (sets != null && sets > 0) {
    return `${sets}× (${timing})`;
  }
  return timing;
}
