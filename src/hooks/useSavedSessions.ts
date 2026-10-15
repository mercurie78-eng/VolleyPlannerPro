// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { useCallback, useEffect, useState } from 'react';
import * as sessionsApi from '../api/sessions';
import type { SavedSession } from '../types';

interface UseSavedSessionsResult {
  savedSessions: SavedSession[];
  loading: boolean;
  error: string | null;
  saveSession: (session: SavedSession) => Promise<SavedSession>;
  updateSession: (session: SavedSession) => Promise<SavedSession>;
  deleteSession: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useSavedSessions(): UseSavedSessionsResult {
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionsApi.fetchSavedSessions();
      setSavedSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile caricare gli allenamenti');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveSession = useCallback(async (session: SavedSession) => {
    const saved = await sessionsApi.createSavedSession(session);
    setSavedSessions((prev) => [saved, ...prev]);
    return saved;
  }, []);

  const updateSession = useCallback(async (session: SavedSession) => {
    const saved = await sessionsApi.updateSavedSession(session);
    setSavedSessions((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
    return saved;
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await sessionsApi.deleteSavedSession(id);
    setSavedSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { savedSessions, loading, error, saveSession, updateSession, deleteSession, reload };
}
