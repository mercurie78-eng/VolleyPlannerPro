import { Plus, Dumbbell } from 'lucide-react';
import { INITIAL_EXERCISES } from '../../data/exercises';
import type { Exercise } from '../../types';

export interface DatabaseTabProps {
  onAddExercise: (exercise: Exercise) => void;
}

export function DatabaseTab({ onAddExercise }: DatabaseTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-400" /> Database Completo Esercizi Pallavolo
        </h2>
        <span className="text-xs text-slate-400">{INITIAL_EXERCISES.length} Esercitazioni disponibili</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INITIAL_EXERCISES.map((ex) => (
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

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Coaching Points:</span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                  {ex.coachingPoints.map((cp) => (
                    <li key={cp}>{cp}</li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAddExercise(ex)}
              className="w-full py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Aggiungi alla Sessione
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
