export const DEFAULT_SESSION_TARGET_MINUTES = 120;

export const CATEGORIES = [
  'Riscaldamento',
  'Pliometria',
  'Tecnica Analitica',
  'Lavoro Sintetico',
  'Gioco Globale',
  'Defaticamento',
] as const;

export type CategoryName = (typeof CATEGORIES)[number];

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
