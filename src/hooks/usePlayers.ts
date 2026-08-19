import { useCallback, useEffect, useState } from 'react';
import * as playersApi from '../api/players';
import type { Player } from '../types';

interface UsePlayersResult {
  players: Player[];
  loading: boolean;
  error: string | null;
  savePlayer: (player: Player) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function usePlayers(): UsePlayersResult {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await playersApi.fetchPlayers();
      setPlayers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile caricare i giocatori');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const savePlayer = useCallback(async (player: Player) => {
    const exists = players.some((p) => p.id === player.id);
    const saved = exists
      ? await playersApi.updatePlayer(player)
      : await playersApi.createPlayer(player);

    setPlayers((prev) => {
      const index = prev.findIndex((p) => p.id === saved.id);
      if (index === -1) return [...prev, saved];
      return prev.map((p) => (p.id === saved.id ? saved : p));
    });
  }, [players]);

  const deletePlayer = useCallback(async (id: string) => {
    await playersApi.deletePlayer(id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { players, loading, error, savePlayer, deletePlayer, reload };
}
