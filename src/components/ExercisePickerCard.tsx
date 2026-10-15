// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { memo } from 'react';
import { Plus, Pencil, Split } from 'lucide-react';
import { CategoryBadge } from './CategoryBadge';
import { ExerciseTypeBadge } from './ExerciseTypeBadge';
import { ExerciseImage } from './ExerciseImage';
import { THEME_CLASSES } from '../theme/constants';
import { exerciseJumps } from '../utils/jumps';
import type { Exercise } from '../types';

export interface ExercisePickerCardProps {
  exercise: Exercise;
  onAdd: (exercise: Exercise) => void;
  onAddToParallel: (exercise: Exercise) => void;
  onEdit: (exercise: Exercise) => void;
}

export const ExercisePickerCard = memo(function ExercisePickerCard({
  exercise,
  onAdd,
  onAddToParallel,
  onEdit,
}: ExercisePickerCardProps) {
  return (
    <div className="bg-theme-elevated border border-theme-border rounded-xl p-3 hover:border-theme-muted-hover transition flex flex-col justify-between space-y-2">
      <ExerciseImage
        exercise={exercise}
        fit="contain"
        className="mb-1 w-full h-40"
        hideIfMissing
      />
      <div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex flex-wrap items-center gap-1 min-w-0">
            <CategoryBadge category={exercise.category} variant="text" />
            {exercise.exerciseType && (
              <ExerciseTypeBadge exerciseType={exercise.exerciseType} className="text-[9px] px-1.5 py-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-purple-400 font-mono">~{exerciseJumps(exercise)} salti</span>
            <button
              type="button"
              onClick={() => onEdit(exercise)}
              className="p-1 hover:bg-theme-muted-hover text-theme-muted-text hover:text-theme-heading rounded transition"
              aria-label={`Modifica ${exercise.title}`}
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        </div>
        <h4 className="text-xs font-bold text-theme-heading mt-0.5">{exercise.title}</h4>
        <p className="text-[10px] font-mono text-theme-subtle">{exercise.id}</p>
        <p className="text-[11px] text-theme-muted-text line-clamp-2 mt-1">{exercise.description}</p>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={() => onAdd(exercise)}
          className={`flex-1 py-1 ${THEME_CLASSES.mutedButton} text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition hover:bg-emerald-600 hover:text-white`}
        >
          <Plus className="w-3.5 h-3.5" /> Sequenza
        </button>
        <button
          type="button"
          onClick={() => onAddToParallel(exercise)}
          className="flex-1 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition"
          title="Aggiungi come stazione parallela"
        >
          <Split className="w-3.5 h-3.5" /> In parallelo
        </button>
      </div>
    </div>
  );
});
