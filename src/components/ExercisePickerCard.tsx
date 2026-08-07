import { memo } from 'react';
import { Plus } from 'lucide-react';
import type { Exercise } from '../types';

export interface ExercisePickerCardProps {
  exercise: Exercise;
  onAdd: (exercise: Exercise) => void;
}

export const ExercisePickerCard = memo(function ExercisePickerCard({ exercise, onAdd }: ExercisePickerCardProps) {
  return (
    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 hover:border-slate-700 transition flex flex-col justify-between space-y-2">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-emerald-400 uppercase">{exercise.category}</span>
          <span className="text-[10px] text-purple-400 font-mono">~{exercise.estimatedJumps} salti</span>
        </div>
        <h4 className="text-xs font-bold text-white mt-0.5">{exercise.title}</h4>
        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{exercise.description}</p>
      </div>
      <button
        type="button"
        onClick={() => onAdd(exercise)}
        className="w-full py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition"
      >
        <Plus className="w-3.5 h-3.5" /> Aggiungi al Planner
      </button>
    </div>
  );
});
