export interface Exercise {
  id: string;
  title: string;
  category: string;
  targetRoles: string[];
  durationMin: number;
  intensity: string;
  description: string;
  coachingPoints: string[];
  sets: number;
  reps: number;
  imageUrl?: string | null;
}

export interface ParallelStation {
  role: string;
  exercise: Exercise;
  sets?: number;
  reps?: number;
}

export interface SessionExercise extends Exercise {
  /** ID dell'esercizio nel catalogo (persistenza allenamenti). */
  exerciseId: string;
  sessionDuration: number;
  notes: string;
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

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  jerseyNumber?: number | null;
  active: boolean;
  notes?: string;
  createdAt?: string;
}

export interface AttendanceRecord {
  sessionId: string;
  playerId: string;
  present: boolean;
  note?: string;
  recordedAt?: string;
}

export interface SessionAttendance {
  sessionId: string;
  records: AttendanceRecord[];
}

export type TabId = 'builder' | 'saved' | 'database' | 'attendance' | 'print';
