export const DEFAULT_SESSION_TARGET_MINUTES = 120;

/** Orario di inizio allenamento di default (HH:mm). */
export const DEFAULT_SESSION_START_TIME = '21:00';

export const CATEGORIES = [
  'Riscaldamento',
  'Pliometria',
  'Potenziamento',
  'Tecnica Analitica',
  'Lavoro Sintetico',
  'Gioco Globale',
  'Defaticamento',
] as const;

export type CategoryName = (typeof CATEGORIES)[number];

/** Sottotipologie per la categoria Tecnica Analitica. */
export const EXERCISE_TYPES = [
  'Fondamentale tecnico',
  'Progressione didattica',
  'A coppie',
  'A gruppi',
  'Coordinazione',
  'Situazionale',
] as const;

export type ExerciseTypeName = (typeof EXERCISE_TYPES)[number];

export const ANALYTIC_CATEGORY: CategoryName = 'Tecnica Analitica';

export function isAnalyticCategory(category: string): category is typeof ANALYTIC_CATEGORY {
  return category === ANALYTIC_CATEGORY;
}

export const ROLES = ['Schiacciatori', 'Centrali', 'Alzatori', 'Liberi', 'Opposti'] as const;

/** Giocatori in campo per ruolo (formazione standard 6v6). */
export const ROLE_PLAYER_COUNTS: Record<(typeof ROLES)[number], number> = {
  Schiacciatori: 2,
  Centrali: 2,
  Alzatori: 1,
  Liberi: 1,
  Opposti: 1,
};

export const TEAM_SIZE = Object.values(ROLE_PLAYER_COUNTS).reduce((sum, count) => sum + count, 0);

export const INTENSITIES = ['Bassa', 'Media', 'Alta', 'Massimale'] as const;
