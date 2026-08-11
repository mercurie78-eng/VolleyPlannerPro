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

export async function fetchSavedSessions(): Promise<import('../types').SavedSession[]> {
  const response = await fetch(`${API_BASE}/sessions`);
  return handleResponse(response);
}

export async function createSavedSession(
  session: import('../types').SavedSession
): Promise<import('../types').SavedSession> {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
  return handleResponse(response);
}

export async function updateSavedSession(
  session: import('../types').SavedSession
): Promise<import('../types').SavedSession> {
  const response = await fetch(`${API_BASE}/sessions/${encodeURIComponent(session.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
  return handleResponse(response);
}

export async function deleteSavedSession(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/sessions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}
