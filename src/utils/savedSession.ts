// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import type { SavedSession } from '../types';
import { DEFAULT_SESSION_START_TIME } from '../data/constants';
import { cloneSession, computeSessionTotals, withFreshSessionIds } from './session';

export const DEFAULT_SESSION_TITLE = 'Sessione Senza Titolo';

export function normalizeSessionTitle(title: string): string {
  return title.trim() || DEFAULT_SESSION_TITLE;
}

export function sessionIdentityMatches(
  a: Pick<SavedSession, 'title' | 'date'>,
  b: Pick<SavedSession, 'title' | 'date'>
): boolean {
  return normalizeSessionTitle(a.title) === normalizeSessionTitle(b.title) && a.date === b.date;
}

export function findSavedSessionByIdentity(
  sessions: SavedSession[],
  title: string,
  date: string,
  preferredId?: string | null
): SavedSession | undefined {
  if (preferredId) {
    const preferred = sessions.find((s) => s.id === preferredId);
    if (preferred && sessionIdentityMatches(preferred, { title, date })) {
      return preferred;
    }
  }

  return sessions.find((s) => sessionIdentityMatches(s, { title, date }));
}

function buildCopyTitle(sourceTitle: string, sessions: SavedSession[], date: string): string {
  const base = normalizeSessionTitle(sourceTitle);
  let candidate = `${base} (copia)`;
  let index = 2;

  while (findSavedSessionByIdentity(sessions, candidate, date)) {
    candidate = `${base} (copia ${index})`;
    index += 1;
  }

  return candidate;
}

export function duplicateSavedSession(source: SavedSession, sessions: SavedSession[]): SavedSession {
  const date = new Date().toISOString().split('T')[0];
  const items = withFreshSessionIds(cloneSession(source.items));
  const { totalMinutes, totalJumps } = computeSessionTotals(items);

  return {
    id: `saved-${Date.now()}`,
    date,
    title: buildCopyTitle(source.title, sessions, date),
    focus: source.focus,
    startTime: source.startTime || DEFAULT_SESSION_START_TIME,
    targetMinutes: source.targetMinutes,
    totalMinutes,
    totalJumps,
    items,
  };
}
