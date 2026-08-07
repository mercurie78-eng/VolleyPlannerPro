import { useState } from 'react';
import { Plus, Dumbbell, Pencil, Trash2 } from 'lucide-react';
import { ExerciseFormModal } from '../ExerciseFormModal';
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-400" /> Database Completo Esercizi Pallavolo
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{exercises.length} Esercitazioni disponibili</span>
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
        <div className="p-12 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
          Nessun esercizio nel database. Clicca &quot;Nuovo Esercizio&quot; per iniziare.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    {ex.category}
                  </span>
                  <span className="text-xs font-mono text-purple-400">~{ex.estimatedJumps} salti</span>
                </div>

                <h3 className="text-sm font-bold text-white">{ex.title}</h3>
                <p className="text-xs text-slate-400">{ex.description}</p>

                <div className="flex flex-wrap gap-1">
                  {ex.targetRoles.map((role) => (
                    <span
                      key={role}
                      className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-semibold"
                    >
                      {role}
                    </span>
                  ))}
                </div>

                {ex.coachingPoints.length > 0 && (
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Coaching Points:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
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
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Aggiungi alla Sessione
                </button>
                <button
                  type="button"
                  onClick={() => setFormExercise(ex)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition"
                  aria-label="Modifica"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ex)}
                  className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-xl transition"
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
