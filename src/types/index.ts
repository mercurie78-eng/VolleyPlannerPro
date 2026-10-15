import type { TacticalSceneData } from '../tactical-court/sceneState';

export interface Exercise {
  id: string;
  title: string;
  category: string;
  /** Sottotipologia per Tecnica Analitica (es. Fondamentale tecnico, Situazionale). */
  exerciseType?: string | null;
  targetRoles: string[];
  /**
   * Durata predefinita (minuti) usata solo all'aggiunta in un allenamento.
   * In seduta vale `sessionDuration` della voce.
   */
  durationMin: number;
  intensity: string;
  description: string;
  coachingPoints: string[];
  /** Serie predefinite (init in allenamento). */
  sets: number;
  /** Ripetizioni predefinite (init in allenamento). */
  reps: number;
  /** Durata lavoro tabata predefinita (secondi). */
  workSeconds: number;
  /** Durata pausa tabata predefinita (secondi). */
  restSeconds: number;
  imageUrl?: string | null;
  /** Stato dell'editor tattico (giocatori, frecce, zoom) per modifiche successive. */
  tacticalImageData?: TacticalSceneData | null;
}

export type { TacticalSceneData } from '../tactical-court/sceneState';

/** Carico della stazione in questa seduta (indipendente dal catalogo). */
export interface ParallelStation {
  role: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  workSeconds: number;
  restSeconds: number;
}

/**
 * Esercizio nella seduta: contenuto da catalogo + carico proprio della seduta.
 * `sets` / `reps` / `workSeconds` / `restSeconds` / `sessionDuration` sono dell'allenamento,
 * inizializzati dai default del catalogo e poi indipendenti.
 */
export interface SessionExercise extends Exercise {
  /** ID dell'esercizio nel catalogo (persistenza allenamenti). */
  exerciseId: string;
  /** Durata in questa seduta (minuti). */
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
  /** Orario di inizio allenamento (HH:mm). */
  startTime: string;
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
