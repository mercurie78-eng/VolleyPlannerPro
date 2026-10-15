// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { useMemo, useState } from 'react';
import { Plus, Dumbbell, Pencil, Trash2 } from 'lucide-react';
import { CategoryBadge } from '../CategoryBadge';
import { ExerciseTypeBadge } from '../ExerciseTypeBadge';
import { ExerciseFormModal } from '../ExerciseFormModal';
import { ExerciseImage } from '../ExerciseImage';
import { ANALYTIC_CATEGORY, CATEGORIES, EXERCISE_TYPES, isAnalyticCategory } from '../../data/constants';
import { THEME_CLASSES } from '../../theme/constants';
import { exerciseJumps } from '../../utils/jumps';
import { formatWorkRestLabel } from '../../utils/tabata';
import type { SaveExerciseOptions } from '../../api/exercises';
import type { Exercise } from '../../types';

export interface DatabaseTabProps {
  exercises: Exercise[];
  onAddExercise: (exercise: Exercise) => void;
  onSaveExercise: (exercise: Exercise, options?: SaveExerciseOptions) => Promise<void>;
  onDeleteExercise: (id: string) => Promise<void>;
}

export function DatabaseTab({
  exercises,
  onAddExercise,
  onSaveExercise,
  onDeleteExercise,
}: DatabaseTabProps) {
  const [formExercise, setFormExercise] = useState<Exercise | 'new' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [selectedExerciseType, setSelectedExerciseType] = useState('Tutti');
  const [actionError, setActionError] = useState<string | null>(null);

  const showExerciseTypeFilter =
    selectedCategory === 'Tutti' || selectedCategory === ANALYTIC_CATEGORY;

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchCategory = selectedCategory === 'Tutti' || ex.category === selectedCategory;
      const matchExerciseType =
        selectedExerciseType === 'Tutti' ||
        !isAnalyticCategory(ex.category) ||
        ex.exerciseType === selectedExerciseType;
      return matchCategory && matchExerciseType;
    });
  }, [exercises, selectedCategory, selectedExerciseType]);

  const handleDelete = async (ex: Exercise) => {
    if (!window.confirm(`Eliminare "${ex.title}" dal database?`)) return;
    setActionError(null);
    try {
      await onDeleteExercise(ex.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Eliminazione non riuscita');
    }
  };

  const handleFormSave = async (exercise: Exercise, options?: SaveExerciseOptions) => {
    setActionError(null);
    try {
      await onSaveExercise(exercise, options);
      setFormExercise(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Salvataggio non riuscito');
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${THEME_CLASSES.card} rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4`}>
        <h2 className="text-base font-bold text-theme-heading flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-400" /> Database Completo Esercizi Pallavolo
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-theme-muted-text">
            {filteredExercises.length}
            {selectedCategory !== 'Tutti' ? ` / ${exercises.length}` : ''} esercitazioni
          </span>
          <button
            type="button"
            onClick={() => setFormExercise('new')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Nuovo Esercizio
          </button>
        </div>
      </div>

      {exercises.length > 0 && (
        <div className={`${THEME_CLASSES.card} rounded-2xl p-4 flex flex-wrap items-center gap-3`}>
          <label className="text-[10px] font-bold text-theme-subtle uppercase shrink-0">
            Filtra per categoria
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              const category = e.target.value;
              setSelectedCategory(category);
              if (category !== 'Tutti' && category !== ANALYTIC_CATEGORY) {
                setSelectedExerciseType('Tutti');
              }
            }}
            className={`${THEME_CLASSES.inputMuted} text-xs rounded-lg px-3 py-2 min-w-[12rem]`}
          >
            <option value="Tutti">Tutte le categorie</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {showExerciseTypeFilter && (
            <>
              <label className="text-[10px] font-bold text-theme-subtle uppercase shrink-0">
                Tipologia analitica
              </label>
              <select
                value={selectedExerciseType}
                onChange={(e) => setSelectedExerciseType(e.target.value)}
                className={`${THEME_CLASSES.inputMuted} text-xs rounded-lg px-3 py-2 min-w-[12rem]`}
              >
                <option value="Tutti">Tutte le tipologie</option>
                {EXERCISE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {actionError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {actionError}
        </div>
      )}

      {exercises.length === 0 ? (
        <div className={`p-12 text-center ${THEME_CLASSES.emptyState} rounded-2xl text-sm`}>
          Nessun esercizio nel database. Clicca &quot;Nuovo Esercizio&quot; per iniziare.
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className={`p-12 text-center ${THEME_CLASSES.emptyState} rounded-2xl text-sm`}>
          Nessun esercizio corrisponde ai filtri selezionati.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((ex) => (
            <div key={ex.id} className={`${THEME_CLASSES.card} rounded-2xl p-4 flex flex-col justify-between space-y-3`}>
              <div className="space-y-2">
                <ExerciseImage
                  exercise={ex}
                  fit="contain"
                  className="w-full h-56"
                  hideIfMissing
                />
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={ex.category} />
                  {ex.exerciseType && <ExerciseTypeBadge exerciseType={ex.exerciseType} />}
                  <span className="text-xs font-mono text-purple-400 ml-auto">~{exerciseJumps(ex)} salti ({ex.sets}×{ex.reps})</span>
                </div>
                {formatWorkRestLabel(ex.workSeconds, ex.restSeconds, ex.sets, ex.reps) && (
                  <p className="text-[10px] font-mono text-cyan-400">
                    Tabata: {formatWorkRestLabel(ex.workSeconds, ex.restSeconds, ex.sets, ex.reps)}
                  </p>
                )}

                <h3 className="text-sm font-bold text-theme-heading">{ex.title}</h3>
                <p className="text-[10px] font-mono text-theme-subtle">{ex.id}</p>
                <p className="text-xs text-theme-muted-text">{ex.description}</p>

                <div className="flex flex-wrap gap-1">
                  {ex.targetRoles.map((role) => (
                    <span
                      key={role}
                      className="px-1.5 py-0.5 rounded bg-theme-muted text-theme-muted-text text-[10px] font-semibold"
                    >
                      {role}
                    </span>
                  ))}
                </div>

                {ex.coachingPoints.length > 0 && (
                  <div className="bg-theme-elevated p-2.5 rounded-xl border border-theme-border text-xs space-y-1">
                    <span className="text-[10px] font-bold text-theme-subtle uppercase block">Coaching Points:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-theme-secondary text-[11px]">
                      {ex.coachingPoints.map((cp) => (
                        <li key={cp}>{cp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onAddExercise(ex)}
                  className={`flex-1 py-1.5 ${THEME_CLASSES.mutedButton} text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition hover:bg-emerald-600 hover:text-white`}
                >
                  <Plus className="w-3.5 h-3.5" /> Aggiungi alla Sessione
                </button>
                <button
                  type="button"
                  onClick={() => setFormExercise(ex)}
                  className={`p-1.5 ${THEME_CLASSES.mutedButton} rounded-xl transition`}
                  aria-label="Modifica"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ex)}
                  className="p-1.5 bg-theme-muted hover:bg-rose-500/20 text-rose-400 rounded-xl transition"
                  aria-label="Elimina"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formExercise !== null && (
        <ExerciseFormModal
          exercise={formExercise === 'new' ? null : formExercise}
          existingExerciseIds={exercises.map((ex) => ex.id)}
          onSave={handleFormSave}
          onClose={() => setFormExercise(null)}
        />
      )}
    </div>
  );
}
