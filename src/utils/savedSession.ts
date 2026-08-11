import type { SavedSession } from '../types';

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
