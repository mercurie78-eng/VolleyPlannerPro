// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Errore ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function fetchPlayers(): Promise<import('../types').Player[]> {
  const response = await fetch(`${API_BASE}/players`);
  return handleResponse(response);
}

export async function createPlayer(
  player: import('../types').Player
): Promise<import('../types').Player> {
  const response = await fetch(`${API_BASE}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(player),
  });
  return handleResponse(response);
}

export async function updatePlayer(
  player: import('../types').Player
): Promise<import('../types').Player> {
  const response = await fetch(`${API_BASE}/players/${encodeURIComponent(player.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(player),
  });
  return handleResponse(response);
}

export async function deletePlayer(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/players/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}
