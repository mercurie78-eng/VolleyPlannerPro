import { INITIAL_EXERCISES } from './exercises';
import { toParallelBlock, toSessionExercise } from '../utils/session';
import type { SavedSession, SessionItem, SessionPreset } from '../types';

const EX = INITIAL_EXERCISES;

export const DEFAULT_SESSION: SessionItem[] = [
  toSessionExercise(EX[0], 10),
  toSessionExercise(EX[1], 8),
  toParallelBlock(
    'Stazioni Simultanee Tecnica + Pliometria',
    20,
    'Lavoro diviso su 3 stazioni parallele',
    [
      { role: 'Centrali', exercise: EX[4] },
      { role: 'Schiacciatori/Opposti', exercise: EX[9] },
      { role: 'Alzatori/Liberi', exercise: EX[8] },
    ]
  ),
  toSessionExercise(EX[11], 25, 'Focus su distribuzione palla'),
  toSessionExercise(EX[14], 20, 'Punto doppio su attacco centrale'),
  toSessionExercise(EX[17], 5),
];

export const PRESET_K1: SessionPreset = {
  title: 'Sessione Focalizzata K1 (Cambiopalla & Pliometria)',
  focus: 'Ricezione, Palleggio in sospensione e Attacco rapido',
  targetMinutes: 120,
  items: [
    toSessionExercise(EX[0], 10),
    toSessionExercise(EX[1], 8),
    toParallelBlock('Stazioni Tecnica / Pliometria K1', 22, 'Lavoro per ruoli K1', [
      { role: 'Schiacciatori', exercise: EX[7] },
      { role: 'Centrali', exercise: EX[5] },
      { role: 'Alzatori', exercise: EX[8] },
    ]),
    toSessionExercise(EX[11], 30, 'Fase K1 completa'),
    toSessionExercise(EX[14], 20, '6vs6 Punto condizionato'),
    toSessionExercise(EX[17], 5),
  ],
};

export const PRESET_K2: SessionPreset = {
  title: 'Sessione Focalizzata K2 (Muro-Difesa & Transizione)',
  focus: 'Lettura muro, Reattività e Transizione rapida',
  targetMinutes: 120,
  items: [
    toSessionExercise(EX[0], 10),
    toSessionExercise(EX[2], 7),
    toParallelBlock('Stazioni Muro / Difesa Parallele', 25, 'Lavoro separato su 3 stazioni K2', [
      { role: 'Centrali & Banda', exercise: EX[10] },
      { role: 'Liberi & Difesa', exercise: EX[6] },
      { role: 'Attaccanti', exercise: EX[4] },
    ]),
    toSessionExercise(EX[12], 30, 'Fase K2 Muro-Difesa'),
    toSessionExercise(EX[15], 20, '6vs6 Break Point Challenge'),
    toSessionExercise(EX[18], 5),
  ],
};

export const SAMPLE_SAVED_SESSION: SavedSession = {
  id: 'saved-101',
  date: '2026-08-04',
  title: 'Test Pliometrico e Cambiopalla K1',
  focus: 'Reattività a terra e attacco in primo tempo',
  targetMinutes: 120,
  totalMinutes: 120,
  totalJumps: 115,
  items: [
    toSessionExercise(EX[0], 10),
    toSessionExercise(EX[1], 8),
    toSessionExercise(EX[7], 25),
    toSessionExercise(EX[11], 35),
    toSessionExercise(EX[14], 7),
  ],
};
