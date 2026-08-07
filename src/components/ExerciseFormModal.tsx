import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES, INTENSITIES } from '../data/constants';
import { THEME_CLASSES } from '../theme/constants';
import { RoleMultiSelect } from './RoleMultiSelect';
import type { Exercise } from '../types';

export interface ExerciseFormModalProps {
  exercise: Exercise | null;
  onSave: (exercise: Exercise) => void;
  onClose: () => void;
}

function emptyExercise(id: string): Exercise {
  return {
    id,
    title: '',
    category: CATEGORIES[0],
    targetRoles: ['Tutti'],
    durationMin: 10,
    intensity: INTENSITIES[1],
    description: '',
    coachingPoints: [],
    estimatedJumps: 0,
  };
}

export function ExerciseFormModal({ exercise, onSave, onClose }: ExerciseFormModalProps) {
  const isEditing = exercise !== null;
  const [form, setForm] = useState<Exercise>(() => exercise ?? emptyExercise(`ex-${Date.now()}`));
  const [coachingText, setCoachingText] = useState(() =>
    (exercise?.coachingPoints ?? []).join('\n')
  );

  useEffect(() => {
    setForm(exercise ?? emptyExercise(`ex-${Date.now()}`));
    setCoachingText((exercise?.coachingPoints ?? []).join('\n'));
  }, [exercise]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const coachingPoints = coachingText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    onSave({ ...form, title: form.title.trim(), coachingPoints });
  };

  const inputClass = `${THEME_CLASSES.input} text-sm rounded-lg px-3 py-2 w-full`;
  const labelClass = 'text-xs font-semibold text-theme-muted-text block mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-overlay/80 backdrop-blur-sm">
      <div className={`${THEME_CLASSES.card} border-theme-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border">
          <h2 className="text-base font-bold text-theme-heading">
            {isEditing ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-theme-muted-hover rounded-lg text-theme-muted-text hover:text-theme-heading"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className={labelClass}>Titolo *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className={inputClass}
              placeholder="Nome dell'esercitazione..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Categoria</label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className={inputClass}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Intensità</label>
              <select
                value={form.intensity}
                onChange={(e) => setForm((prev) => ({ ...prev, intensity: e.target.value }))}
                className={inputClass}
              >
                {INTENSITIES.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Ruoli target</label>
            <RoleMultiSelect
              mode="array"
              includeTutti
              value={form.targetRoles}
              onChange={(targetRoles) => setForm((prev) => ({ ...prev, targetRoles }))}
              placeholder="Seleziona ruoli target..."
              aria-label="Ruoli target esercizio"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Durata (min)</label>
              <input
                type="number"
                min={1}
                value={form.durationMin}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, durationMin: parseInt(e.target.value, 10) || 0 }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Salti stimati</label>
              <input
                type="number"
                min={0}
                value={form.estimatedJumps}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, estimatedJumps: parseInt(e.target.value, 10) || 0 }))
                }
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Descrizione</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className={`${inputClass} resize-none`}
              placeholder="Descrizione dell'esercizio..."
            />
          </div>

          <div>
            <label className={labelClass}>Coaching Points (uno per riga)</label>
            <textarea
              rows={3}
              value={coachingText}
              onChange={(e) => setCoachingText(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Punto 1&#10;Punto 2..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-theme-muted hover:bg-theme-muted-hover text-theme-secondary text-sm font-bold rounded-xl transition"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition"
            >
              {isEditing ? 'Salva Modifiche' : 'Aggiungi Esercizio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
