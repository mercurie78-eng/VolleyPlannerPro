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

export async function fetchExercises(): Promise<import('../types').Exercise[]> {
  const response = await fetch(`${API_BASE}/exercises`);
  return handleResponse(response);
}

export async function createExercise(
  exercise: import('../types').Exercise
): Promise<import('../types').Exercise> {
  const response = await fetch(`${API_BASE}/exercises`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exercise),
  });
  return handleResponse(response);
}

export async function updateExercise(
  exercise: import('../types').Exercise
): Promise<import('../types').Exercise> {
  const response = await fetch(`${API_BASE}/exercises/${encodeURIComponent(exercise.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(exercise),
  });
  return handleResponse(response);
}

export async function deleteExercise(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/exercises/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export async function uploadExerciseImage(
  id: string,
  file: File
): Promise<import('../types').Exercise> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_BASE}/exercises/${encodeURIComponent(id)}/image`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
}

export async function deleteExerciseImage(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/exercises/${encodeURIComponent(id)}/image`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

export interface SaveExerciseOptions {
  imageFile?: File | null;
  removeImage?: boolean;
}
