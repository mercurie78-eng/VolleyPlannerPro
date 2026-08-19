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

export async function fetchSessionAttendance(
  sessionId: string
): Promise<import('../types').SessionAttendance> {
  const response = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/attendance`);
  return handleResponse(response);
}

export async function saveSessionAttendance(
  sessionId: string,
  records: import('../types').AttendanceRecord[]
): Promise<import('../types').SessionAttendance> {
  const response = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/attendance`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  });
  return handleResponse(response);
}
