import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES, INTENSITIES, ROLES } from '../data/constants';
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

  const toggleRole = (role: string) => {
    if (role === 'Tutti') {
      setForm((prev) => ({ ...prev, targetRoles: ['Tutti'] }));
      return;
    }
    setForm((prev) => {
      const withoutTutti = prev.targetRoles.filter((r) => r !== 'Tutti');
      const next = withoutTutti.includes(role)
        ? withoutTutti.filter((r) => r !== role)
        : [...withoutTutti, role];
      return { ...prev, targetRoles: next.length > 0 ? next : ['Tutti'] };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const coachingPoints = coachingText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    onSave({ ...form, title: form.title.trim(), coachingPoints });
  };

  const inputClass =
    'bg-slate-950 border border-slate-700 text-sm text-white rounded-lg px-3 py-2 w-full focus:outline-none focus:border-emerald-500';
  const labelClass = 'text-xs font-semibold text-slate-400 block mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-bold text-white">
            {isEditing ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleRole('Tutti')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                  form.targetRoles.includes('Tutti')
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                Tutti
              </button>
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    form.targetRoles.includes(role)
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
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
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition"
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
