import { useEffect, useState } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import { CATEGORIES, INTENSITIES } from '../data/constants';
import { THEME_CLASSES } from '../theme/constants';
import { ExerciseImage } from './ExerciseImage';
import { RoleMultiSelect } from './RoleMultiSelect';
import { exerciseJumps } from '../utils/jumps';
import type { SaveExerciseOptions } from '../api/exercises';
import type { Exercise } from '../types';

export interface ExerciseFormModalProps {
  exercise: Exercise | null;
  onSave: (exercise: Exercise, options?: SaveExerciseOptions) => Promise<void>;
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
    sets: 0,
    reps: 0,
    imageUrl: null,
  };
}

export function ExerciseFormModal({ exercise, onSave, onClose }: ExerciseFormModalProps) {
  const isEditing = exercise !== null;
  const [form, setForm] = useState<Exercise>(() => exercise ?? emptyExercise(`ex-${Date.now()}`));
  const [coachingText, setCoachingText] = useState(() =>
    (exercise?.coachingPoints ?? []).join('\n')
  );
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setForm(exercise ?? emptyExercise(`ex-${Date.now()}`));
    setCoachingText((exercise?.coachingPoints ?? []).join('\n'));
    setPendingImageFile(null);
    setPreviewUrl(null);
    setRemoveImage(false);
    setSaveError(null);
  }, [exercise]);

  useEffect(() => {
    if (!pendingImageFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(pendingImageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [pendingImageFile]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingImageFile(file);
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setPendingImageFile(null);
    setPreviewUrl(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || saving) return;

    const coachingPoints = coachingText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    setSaving(true);
    setSaveError(null);
    try {
      await onSave(
        {
          ...form,
          title: form.title.trim(),
          coachingPoints,
          imageUrl: removeImage ? null : form.imageUrl ?? null,
        },
        {
          imageFile: pendingImageFile,
          removeImage: removeImage && !pendingImageFile,
        }
      );
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Salvataggio non riuscito');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `${THEME_CLASSES.input} text-sm rounded-lg px-3 py-2 w-full`;
  const labelClass = 'text-xs font-semibold text-theme-muted-text block mb-1';
  const hasImage = Boolean(previewUrl || (!removeImage && form.imageUrl));

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
          {saveError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {saveError}
            </div>
          )}

          <div>
            <label className={labelClass}>Immagine esercizio</label>
            <ExerciseImage exercise={form} previewUrl={previewUrl} />
            <div className="flex flex-wrap gap-2 mt-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-theme-muted hover:bg-theme-muted-hover text-theme-secondary text-xs font-bold rounded-xl cursor-pointer transition">
                <ImagePlus className="w-3.5 h-3.5" />
                {hasImage ? 'Sostituisci immagine' : 'Carica immagine'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleImageChange}
                />
              </label>
              {hasImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Rimuovi
                </button>
              )}
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Serie</label>
              <input
                type="number"
                min={0}
                value={form.sets}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sets: parseInt(e.target.value, 10) || 0 }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ripetizioni</label>
              <input
                type="number"
                min={0}
                value={form.reps}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, reps: parseInt(e.target.value, 10) || 0 }))
                }
                className={inputClass}
              />
            </div>
          </div>

          <p className="text-xs text-purple-400 font-mono">
            Salti stimati: {exerciseJumps(form)} ({form.sets} × {form.reps})
          </p>

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
              disabled={saving}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition"
            >
              {saving ? 'Salvataggio...' : isEditing ? 'Salva Modifiche' : 'Aggiungi Esercizio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
