import { useEffect, useState } from 'react';
import { ImagePlus, PenLine, Trash2, X } from 'lucide-react';
import { CATEGORIES, EXERCISE_TYPES, INTENSITIES, isAnalyticCategory } from '../data/constants';
import { THEME_CLASSES } from '../theme/constants';
import { ExerciseImageCreatorModal } from './ExerciseImageCreatorModal';
import { ExerciseImage } from './ExerciseImage';
import { RoleMultiSelect } from './RoleMultiSelect';
import type { TacticalSceneData } from '../types';
import { exerciseJumps } from '../utils/jumps';
import { nextExerciseId } from '../utils/exerciseId';
import type { SaveExerciseOptions } from '../api/exercises';
import type { Exercise } from '../types';

export interface ExerciseFormModalProps {
  exercise: Exercise | null;
  existingExerciseIds: string[];
  onSave: (exercise: Exercise, options?: SaveExerciseOptions) => Promise<void>;
  onClose: () => void;
}

function emptyExercise(category: string, existingExerciseIds: string[]): Exercise {
  return {
    id: nextExerciseId(category, existingExerciseIds),
    title: '',
    category,
    exerciseType: null,
    targetRoles: ['Tutti'],
    durationMin: 10,
    intensity: INTENSITIES[1],
    description: '',
    coachingPoints: [],
    sets: 0,
    reps: 0,
    workSeconds: 0,
    restSeconds: 0,
    imageUrl: null,
    tacticalImageData: null,
  };
}

export function ExerciseFormModal({ exercise, existingExerciseIds, onSave, onClose }: ExerciseFormModalProps) {
  const isEditing = exercise !== null;
  const [form, setForm] = useState<Exercise>(() =>
    exercise ?? emptyExercise(CATEGORIES[0], existingExerciseIds)
  );
  const [coachingText, setCoachingText] = useState(() =>
    (exercise?.coachingPoints ?? []).join('\n')
  );
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingTacticalData, setPendingTacticalData] = useState<TacticalSceneData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [showImageCreator, setShowImageCreator] = useState(false);
  const [imageCreatorMode, setImageCreatorMode] = useState<'create' | 'edit'>('create');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setForm(exercise ?? emptyExercise(CATEGORIES[0], existingExerciseIds));
    setCoachingText((exercise?.coachingPoints ?? []).join('\n'));
    setPendingImageFile(null);
    setPendingTacticalData(null);
    setPreviewUrl(null);
    setRemoveImage(false);
    setShowImageCreator(false);
    setImageCreatorMode('create');
    setSaveError(null);
  }, [exercise, existingExerciseIds]);

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
    setPendingTacticalData(null);
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setPendingImageFile(null);
    setPendingTacticalData(null);
    setPreviewUrl(null);
    setRemoveImage(true);
  };

  const handleCreatedImage = (file: File, sceneData: TacticalSceneData) => {
    setPendingImageFile(file);
    setPendingTacticalData(sceneData);
    setRemoveImage(false);
    setShowImageCreator(false);
  };

  const openImageCreator = (mode: 'create' | 'edit') => {
    setImageCreatorMode(mode);
    setShowImageCreator(true);
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
          tacticalImageData: removeImage
            ? null
            : pendingTacticalData ?? form.tacticalImageData ?? null,
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
  const activeTacticalData =
    pendingTacticalData ?? (!removeImage ? form.tacticalImageData ?? null : null);
  const canEditTacticalImage = Boolean(activeTacticalData);
  const imageCreatorInitialScene =
    imageCreatorMode === 'edit' ? activeTacticalData : null;

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
            <ExerciseImage exercise={form} previewUrl={previewUrl} fit="contain" className="w-full h-64" />
            <div className="flex flex-wrap gap-2 mt-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-theme-muted hover:bg-theme-muted-hover text-theme-secondary text-xs font-bold rounded-xl cursor-pointer transition">
                <ImagePlus className="w-3.5 h-3.5" />
                {hasImage ? 'Sostituisci immagine' : 'Importa immagine'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleImageChange}
                />
              </label>
              <button
                type="button"
                onClick={() => openImageCreator(canEditTacticalImage ? 'edit' : 'create')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-xl transition"
              >
                <PenLine className="w-3.5 h-3.5" />
                {canEditTacticalImage ? 'Modifica immagine' : 'Crea immagine'}
              </button>
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
            {isEditing ? (
              <p className="mt-1 text-[10px] font-mono text-theme-subtle">ID: {form.id}</p>
            ) : (
              <p className="mt-1 text-[10px] font-mono text-theme-subtle">
                ID assegnato: {form.id}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Categoria</label>
              <select
                value={form.category}
                onChange={(e) => {
                  const category = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    category,
                    exerciseType: isAnalyticCategory(category) ? prev.exerciseType : null,
                    id: isEditing
                      ? prev.id
                      : nextExerciseId(category, existingExerciseIds),
                  }));
                }}
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

          {isAnalyticCategory(form.category) && (
            <div>
              <label className={labelClass}>Tipologia esercizio</label>
              <select
                value={form.exerciseType ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    exerciseType: e.target.value === '' ? null : e.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="">Seleziona tipologia...</option>
                {EXERCISE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}

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
            <div>
              <label className={labelClass}>Lavoro (sec)</label>
              <input
                type="number"
                min={0}
                value={form.workSeconds}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, workSeconds: parseInt(e.target.value, 10) || 0 }))
                }
                className={inputClass}
                placeholder="es. 20"
              />
            </div>
            <div>
              <label className={labelClass}>Pausa (sec)</label>
              <input
                type="number"
                min={0}
                value={form.restSeconds}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, restSeconds: parseInt(e.target.value, 10) || 0 }))
                }
                className={inputClass}
                placeholder="es. 10"
              />
            </div>
          </div>

          <p className="text-xs text-purple-400 font-mono">
            Salti stimati: {exerciseJumps(form)} ({form.sets} × {form.reps})
            {form.workSeconds > 0 || form.restSeconds > 0
              ? ` · Tabata: ${form.sets > 0 ? `${form.sets}× ` : ''}(${form.workSeconds}s / ${form.restSeconds}s)`
              : ''}
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

      {showImageCreator && (
        <ExerciseImageCreatorModal
          exerciseTitle={form.title}
          initialScene={imageCreatorInitialScene}
          onConfirm={handleCreatedImage}
          onClose={() => setShowImageCreator(false)}
        />
      )}
    </div>
  );
}
