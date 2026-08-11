import type { Exercise, ParallelStation, SessionExercise } from '../types';
import { countPlayersForRoleLabel, countPlayersForRoles } from './roles';

export function computeJumps(sets?: number, reps?: number): number {
  return (sets ?? 0) * (reps ?? 0);
}

export function exerciseJumps(exercise: Pick<Exercise, 'sets' | 'reps'>): number {
  return computeJumps(exercise.sets, exercise.reps);
}

export function sessionItemJumps(
  item: Pick<SessionExercise, 'sets' | 'reps'> & { estimatedJumps?: number }
): number {
  if (item.sets != null || item.reps != null) {
    return computeJumps(item.sets, item.reps);
  }
  return item.estimatedJumps ?? 0;
}

export function stationJumps(station: ParallelStation): number {
  if (station.sets != null || station.reps != null) {
    return computeJumps(station.sets, station.reps);
  }
  return exerciseJumps(station.exercise);
}

export function weightedSessionItemTeamJumps(
  item: Pick<SessionExercise, 'sets' | 'reps' | 'targetRoles'> & { estimatedJumps?: number }
): number {
  return sessionItemJumps(item) * countPlayersForRoles(item.targetRoles);
}

export function weightedStationTeamJumps(station: ParallelStation): number {
  return stationJumps(station) * countPlayersForRoleLabel(station.role);
}
