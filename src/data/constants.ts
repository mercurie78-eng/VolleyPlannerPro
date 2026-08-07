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

export const INTENSITIES = ['Bassa', 'Media', 'Alta', 'Massimale'] as const;
