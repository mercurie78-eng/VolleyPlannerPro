import { useCallback, useEffect, useState } from 'react';
import * as exercisesApi from '../api/exercises';
import type { SaveExerciseOptions } from '../api/exercises';
import type { Exercise } from '../types';

interface UseExercisesResult {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  saveExercise: (exercise: Exercise, options?: SaveExerciseOptions) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;
  reload: () => Promise<void>;
}

export function useExercises(): UseExercisesResult {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await exercisesApi.fetchExercises();
      setExercises(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile caricare gli esercizi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveExercise = useCallback(async (exercise: Exercise, options?: SaveExerciseOptions) => {
    const exists = exercises.some((ex) => ex.id === exercise.id);
    let saved = exists
      ? await exercisesApi.updateExercise(exercise)
      : await exercisesApi.createExercise(exercise);

    if (options?.removeImage) {
      await exercisesApi.deleteExerciseImage(saved.id);
      saved = { ...saved, imageUrl: null, tacticalImageData: null };
    } else if (options?.imageFile) {
      saved = await exercisesApi.uploadExerciseImage(saved.id, options.imageFile);
    }

    setExercises((prev) => {
      const index = prev.findIndex((ex) => ex.id === saved.id);
      if (index === -1) return [...prev, saved];
      return prev.map((ex) => (ex.id === saved.id ? saved : ex));
    });
  }, [exercises]);

  const deleteExercise = useCallback(async (id: string) => {
    await exercisesApi.deleteExercise(id);
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  }, []);

  return { exercises, loading, error, saveExercise, deleteExercise, reload };
}
