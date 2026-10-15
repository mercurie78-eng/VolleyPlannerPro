// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { CATEGORIES, type CategoryName } from '../data/constants';

/** Codice a 4 lettere per categoria → prefisso ID (ex-risc-001). */
export const CATEGORY_ID_CODES: Record<CategoryName, string> = {
  Riscaldamento: 'risc',
  Pliometria: 'plio',
  Potenziamento: 'pote',
  'Tecnica Analitica': 'tecn',
  'Lavoro Sintetico': 'sint',
  'Gioco Globale': 'giob',
  Defaticamento: 'defa',
};

export const EXERCISE_ID_PATTERN = /^ex-[a-z]{4}-\d{3}$/;

export function categoryIdCode(category: string): string {
  const known = CATEGORY_ID_CODES[category as CategoryName];
  if (known) return known;

  const normalized = category
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

  return (normalized.slice(0, 4) || 'misc').padEnd(4, 'x');
}

export function formatExerciseId(category: string, sequence: number): string {
  return `ex-${categoryIdCode(category)}-${String(sequence).padStart(3, '0')}`;
}

export function parseExerciseId(id: string): { prefix: string; sequence: number } | null {
  const match = id.match(/^ex-([a-z]{4})-(\d{3})$/);
  if (!match) return null;
  return { prefix: match[1], sequence: parseInt(match[2], 10) };
}

export function isValidExerciseId(id: string): boolean {
  return EXERCISE_ID_PATTERN.test(id);
}

export function isExerciseIdCoherent(id: string, category: string): boolean {
  const parsed = parseExerciseId(id);
  if (!parsed) return false;
  return parsed.prefix === categoryIdCode(category);
}

export function nextExerciseId(category: string, existingIds: Iterable<string>): string {
  const prefix = categoryIdCode(category);
  let max = 0;

  for (const id of existingIds) {
    const parsed = parseExerciseId(id);
    if (parsed?.prefix === prefix) {
      max = Math.max(max, parsed.sequence);
    }
  }

  return formatExerciseId(category, max + 1);
}

export function isKnownCategory(category: string): category is CategoryName {
  return (CATEGORIES as readonly string[]).includes(category);
}
