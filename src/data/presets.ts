import { toParallelBlock, toParallelStation, toSessionExercise } from '../utils/session';
import { DEFAULT_SESSION_START_TIME } from './constants';
import { EXERCISE_IDS } from './exercises.js';
import type { Exercise, SavedSession, SessionItem, SessionPreset } from '../types';

function byId(exercises: Exercise[], id: string): Exercise {
  const exercise = exercises.find((ex) => ex.id === id);
  if (!exercise) {
    throw new Error(`Esercizio "${id}" non trovato nel database`);
  }
  return exercise;
}

export function buildDefaultSession(exercises: Exercise[]): SessionItem[] {
  return [
    toSessionExercise(byId(exercises, EXERCISE_IDS.risc001), 10),
    toSessionExercise(byId(exercises, EXERCISE_IDS.risc002), 8),
    toParallelBlock(
      'Stazioni Simultanee Tecnica + Pliometria',
      20,
      'Lavoro diviso su 3 stazioni parallele',
      [
        toParallelStation('Centrali', byId(exercises, EXERCISE_IDS.plio004)),
        toParallelStation('Schiacciatori/Opposti', byId(exercises, EXERCISE_IDS.tecn003)),
        toParallelStation('Alzatori/Liberi', byId(exercises, EXERCISE_IDS.tecn002)),
      ]
    ),
    toSessionExercise(byId(exercises, EXERCISE_IDS.sint001), 25, 'Focus su distribuzione palla'),
    toSessionExercise(byId(exercises, EXERCISE_IDS.giob001), 20, 'Punto doppio su attacco centrale'),
    toSessionExercise(byId(exercises, EXERCISE_IDS.defa001), 5),
  ];
}

export function buildPresetK1(exercises: Exercise[]): SessionPreset {
  return {
    title: 'Sessione Focalizzata K1 (Cambiopalla & Pliometria)',
    focus: 'Ricezione, Palleggio in sospensione e Attacco rapido',
    targetMinutes: 120,
    items: [
      toSessionExercise(byId(exercises, EXERCISE_IDS.risc001), 10),
      toSessionExercise(byId(exercises, EXERCISE_IDS.risc002), 8),
      toParallelBlock('Stazioni Tecnica / Pliometria K1', 22, 'Lavoro per ruoli K1', [
        toParallelStation('Schiacciatori', byId(exercises, EXERCISE_IDS.tecn001)),
        toParallelStation('Centrali', byId(exercises, EXERCISE_IDS.plio005)),
        toParallelStation('Alzatori', byId(exercises, EXERCISE_IDS.tecn002)),
      ]),
      toSessionExercise(byId(exercises, EXERCISE_IDS.sint001), 30, 'Fase K1 completa'),
      toSessionExercise(byId(exercises, EXERCISE_IDS.giob001), 20, '6vs6 Punto condizionato'),
      toSessionExercise(byId(exercises, EXERCISE_IDS.defa001), 5),
    ],
  };
}

export function buildPresetK2(exercises: Exercise[]): SessionPreset {
  return {
    title: 'Sessione Focalizzata K2 (Muro-Difesa & Transizione)',
    focus: 'Lettura muro, Reattività e Transizione rapida',
    targetMinutes: 120,
    items: [
      toSessionExercise(byId(exercises, EXERCISE_IDS.risc001), 10),
      toSessionExercise(byId(exercises, EXERCISE_IDS.risc003), 7),
      toParallelBlock('Stazioni Muro / Difesa Parallele', 25, 'Lavoro separato su 3 stazioni K2', [
        toParallelStation('Centrali & Banda', byId(exercises, EXERCISE_IDS.tecn004)),
        toParallelStation('Liberi & Difesa', byId(exercises, EXERCISE_IDS.plio018)),
        toParallelStation('Attaccanti', byId(exercises, EXERCISE_IDS.plio015)),
      ]),
      toSessionExercise(byId(exercises, EXERCISE_IDS.sint002), 30, 'Fase K2 Muro-Difesa'),
      toSessionExercise(byId(exercises, EXERCISE_IDS.giob002), 20, '6vs6 Break Point Challenge'),
      toSessionExercise(byId(exercises, EXERCISE_IDS.defa002), 5),
    ],
  };
}

export function buildSampleSavedSession(exercises: Exercise[]): SavedSession {
  return {
    id: 'saved-101',
    date: '2026-08-04',
    title: 'Test Pliometrico e Cambiopalla K1',
    focus: 'Reattività a terra e attacco in primo tempo',
    startTime: DEFAULT_SESSION_START_TIME,
    targetMinutes: 120,
    totalMinutes: 120,
    totalJumps: 115,
    items: [
      toSessionExercise(byId(exercises, EXERCISE_IDS.risc001), 10),
      toSessionExercise(byId(exercises, EXERCISE_IDS.risc002), 8),
      toSessionExercise(byId(exercises, EXERCISE_IDS.tecn001), 25),
      toSessionExercise(byId(exercises, EXERCISE_IDS.sint001), 35),
      toSessionExercise(byId(exercises, EXERCISE_IDS.giob001), 7),
    ],
  };
}
