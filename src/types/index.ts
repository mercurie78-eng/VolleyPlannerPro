export interface Exercise {
  id: string;
  title: string;
  category: string;
  targetRoles: string[];
  durationMin: number;
  intensity: string;
  description: string;
  coachingPoints: string[];
  estimatedJumps: number;
}

export interface ParallelStation {
  role: string;
  exercise: Exercise;
  sets?: number;
  reps?: number;
}

export interface SessionExercise extends Exercise {
  sessionDuration: number;
  notes: string;
  sets?: number;
  reps?: number;
}

export interface ParallelBlock {
  id: string;
  isParallelBlock: true;
  parallelTitle: string;
  sessionDuration: number;
  notes: string;
  stations: ParallelStation[];
}

export type SessionItem = SessionExercise | ParallelBlock;

export interface SavedSession {
  id: string;
  date: string;
  title: string;
  focus: string;
  targetMinutes: number;
  totalMinutes: number;
  totalJumps: number;
  items: SessionItem[];
}

export interface SessionPreset {
  title: string;
  focus: string;
  targetMinutes: number;
  items: SessionItem[];
}

export type TabId = 'builder' | 'saved' | 'database' | 'print';
