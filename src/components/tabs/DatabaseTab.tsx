import { useState } from 'react';
import { Plus, Dumbbell, Pencil, Trash2 } from 'lucide-react';
import { CategoryBadge } from '../CategoryBadge';
import { ExerciseFormModal } from '../ExerciseFormModal';
import { THEME_CLASSES } from '../../theme/constants';
import type { Exercise } from '../../types';

export interface DatabaseTabProps {
  exercises: Exercise[];
  onAddExercise: (exercise: Exercise) => void;
  onSaveExercise: (exercise: Exercise) => void;
  onDeleteExercise: (id: string) => void;
}

export function DatabaseTab({
  exercises,
  onAddExercise,
  onSaveExercise,
  onDeleteExercise,
}: DatabaseTabProps) {
  const [formExercise, setFormExercise] = useState<Exercise | 'new' | null>(null);

  const handleDelete = (ex: Exercise) => {
    if (window.confirm(`Eliminare "${ex.title}" dal database?`)) {
      onDeleteExercise(ex.id);
    }
  };

  const handleFormSave = (exercise: Exercise) => {
    onSaveExercise(exercise);
    setFormExercise(null);
  };

  return (
    <div className="space-y-4">
      <div className={`${THEME_CLASSES.card} rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4`}>
        <h2 className="text-base font-bold text-theme-heading flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-400" /> Database Completo Esercizi Pallavolo
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-theme-muted-text">{exercises.length} Esercitazioni disponibili</span>
          <button
            type="button"
            onClick={() => setFormExercise('new')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" /> Nuovo Esercizio
          </button>
        </div>
      </div>

      {exercises.length === 0 ? (
        <div className={`p-12 text-center ${THEME_CLASSES.emptyState} rounded-2xl text-sm`}>
          Nessun esercizio nel database. Clicca &quot;Nuovo Esercizio&quot; per iniziare.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <div key={ex.id} className={`${THEME_CLASSES.card} rounded-2xl p-4 flex flex-col justify-between space-y-3`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <CategoryBadge category={ex.category} />
                  <span className="text-xs font-mono text-purple-400">~{ex.estimatedJumps} salti</span>
                </div>

                <h3 className="text-sm font-bold text-theme-heading">{ex.title}</h3>
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
          onSave={handleFormSave}
          onClose={() => setFormExercise(null)}
        />
      )}
    </div>
  );
}
