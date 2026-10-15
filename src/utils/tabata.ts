// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

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
  sets?: number,
  reps?: number
): string | null {
  if (workSeconds <= 0 && restSeconds <= 0) return null;

  const work = workSeconds > 0 ? `${workSeconds}s lavoro` : null;
  const rest = restSeconds > 0 ? `${restSeconds}s pausa` : null;
  const timing = [work, rest].filter(Boolean).join(' / ');
  if (!timing) return null;

  const rounds = sets != null && sets > 0 ? sets : 0;
  if (rounds <= 0) return timing;

  const exercisesPerRound = reps != null && reps > 1 ? reps : null;
  if (exercisesPerRound != null) {
    return `${rounds}×${exercisesPerRound} (${timing})`;
  }
  return `${rounds}× (${timing})`;
}

/** True se l'esercizio usa timing tabata (lavoro + serie). */
export function isTabataTiming(
  workSeconds: number,
  restSeconds: number,
  sets: number
): boolean {
  return workSeconds > 0 && sets > 0 && restSeconds >= 0;
}

/**
 * Intervalli di lavoro tabata: serie × ripetizioni (esercizi nel circuito).
 * Se ripetizioni è 0/assente, conta come 1 (compatibilità).
 */
export function computeTabataIntervals(sets: number, reps?: number | null): number {
  if (sets <= 0) return 0;
  return sets * Math.max(1, reps ?? 0);
}

/**
 * Totale secondi tabata:
 * (serie × ripetizioni)×lavoro + (serie × ripetizioni − 1)×pausa
 * (niente pausa dopo l'ultimo intervallo).
 */
export function computeTabataTotalSeconds(
  workSeconds: number,
  restSeconds: number,
  sets: number,
  reps?: number | null
): number | null {
  if (!isTabataTiming(workSeconds, restSeconds, sets)) return null;
  const intervals = computeTabataIntervals(sets, reps);
  if (intervals <= 0) return null;
  return workSeconds * intervals + Math.max(0, restSeconds) * Math.max(0, intervals - 1);
}

/** Durata in minuti (arrotondati per eccesso, minimo 1) da timing tabata. */
export function computeTabataDurationMinutes(
  workSeconds: number,
  restSeconds: number,
  sets: number,
  reps?: number | null
): number | null {
  const totalSeconds = computeTabataTotalSeconds(workSeconds, restSeconds, sets, reps);
  if (totalSeconds == null || totalSeconds <= 0) return null;
  return Math.max(1, Math.ceil(totalSeconds / 60));
}
