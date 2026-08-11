import { toParallelBlock, toSessionExercise } from '../utils/session';
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
    toSessionExercise(byId(exercises, 'r1'), 10),
    toSessionExercise(byId(exercises, 'r2'), 8),
    toParallelBlock(
      'Stazioni Simultanee Tecnica + Pliometria',
      20,
      'Lavoro diviso su 3 stazioni parallele',
      [
        { role: 'Centrali', exercise: byId(exercises, 'p2') },
        { role: 'Schiacciatori/Opposti', exercise: byId(exercises, 'a3') },
        { role: 'Alzatori/Liberi', exercise: byId(exercises, 'a2') },
      ]
    ),
    toSessionExercise(byId(exercises, 's1'), 25, 'Focus su distribuzione palla'),
    toSessionExercise(byId(exercises, 'g1'), 20, 'Punto doppio su attacco centrale'),
    toSessionExercise(byId(exercises, 'd1'), 5),
  ];
}

export function buildPresetK1(exercises: Exercise[]): SessionPreset {
  return {
    title: 'Sessione Focalizzata K1 (Cambiopalla & Pliometria)',
    focus: 'Ricezione, Palleggio in sospensione e Attacco rapido',
    targetMinutes: 120,
    items: [
      toSessionExercise(byId(exercises, 'r1'), 10),
      toSessionExercise(byId(exercises, 'r2'), 8),
      toParallelBlock('Stazioni Tecnica / Pliometria K1', 22, 'Lavoro per ruoli K1', [
        { role: 'Schiacciatori', exercise: byId(exercises, 'a1') },
        { role: 'Centrali', exercise: byId(exercises, 'p3') },
        { role: 'Alzatori', exercise: byId(exercises, 'a2') },
      ]),
      toSessionExercise(byId(exercises, 's1'), 30, 'Fase K1 completa'),
      toSessionExercise(byId(exercises, 'g1'), 20, '6vs6 Punto condizionato'),
      toSessionExercise(byId(exercises, 'd1'), 5),
    ],
  };
}

export function buildPresetK2(exercises: Exercise[]): SessionPreset {
  return {
    title: 'Sessione Focalizzata K2 (Muro-Difesa & Transizione)',
    focus: 'Lettura muro, Reattività e Transizione rapida',
    targetMinutes: 120,
    items: [
      toSessionExercise(byId(exercises, 'r1'), 10),
      toSessionExercise(byId(exercises, 'r3'), 7),
      toParallelBlock('Stazioni Muro / Difesa Parallele', 25, 'Lavoro separato su 3 stazioni K2', [
        { role: 'Centrali & Banda', exercise: byId(exercises, 'a4') },
        { role: 'Liberi & Difesa', exercise: byId(exercises, 'p4') },
        { role: 'Attaccanti', exercise: byId(exercises, 'p2') },
      ]),
      toSessionExercise(byId(exercises, 's2'), 30, 'Fase K2 Muro-Difesa'),
      toSessionExercise(byId(exercises, 'g2'), 20, '6vs6 Break Point Challenge'),
      toSessionExercise(byId(exercises, 'd2'), 5),
    ],
  };
}

export function buildSampleSavedSession(exercises: Exercise[]): SavedSession {
  return {
    id: 'saved-101',
    date: '2026-08-04',
    title: 'Test Pliometrico e Cambiopalla K1',
    focus: 'Reattività a terra e attacco in primo tempo',
    targetMinutes: 120,
    totalMinutes: 120,
    totalJumps: 115,
    items: [
      toSessionExercise(byId(exercises, 'r1'), 10),
      toSessionExercise(byId(exercises, 'r2'), 8),
      toSessionExercise(byId(exercises, 'a1'), 25),
      toSessionExercise(byId(exercises, 's1'), 35),
      toSessionExercise(byId(exercises, 'g1'), 7),
    ],
  };
}
