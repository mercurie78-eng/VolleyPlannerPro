import type { TacticalSceneData } from '../tactical-court/sceneState';

export interface Exercise {
  id: string;
  title: string;
  category: string;
  /** Sottotipologia per Tecnica Analitica (es. Fondamentale tecnico, Situazionale). */
  exerciseType?: string | null;
  targetRoles: string[];
  durationMin: number;
  intensity: string;
  description: string;
  coachingPoints: string[];
  sets: number;
  reps: number;
  /** Durata lavoro per round tabata (secondi). */
  workSeconds: number;
  /** Durata pausa tra i round tabata (secondi). */
  restSeconds: number;
  imageUrl?: string | null;
  /** Stato dell'editor tattico (giocatori, frecce, zoom) per modifiche successive. */
  tacticalImageData?: TacticalSceneData | null;
}

export type { TacticalSceneData } from '../tactical-court/sceneState';

export interface ParallelStation {
  role: string;
  exercise: Exercise;
  sets?: number;
  reps?: number;
  workSeconds?: number;
  restSeconds?: number;
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
  /** Scadenza visita medica (YYYY-MM-DD). */
  medicalVisitExpiry?: string | null;
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
