import { useMemo, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { ROLES } from '../data/constants';
import { THEME_CLASSES } from '../theme/constants';
import { RoleMultiSelect } from './RoleMultiSelect';
import { formatRoleLabel } from '../utils/roles';
import type { Exercise, ParallelStation } from '../types';

export interface ParallelBlockFormModalProps {
  exercises: Exercise[];
  initialExercise: Exercise;
  onSave: (title: string, duration: number, notes: string, stations: ParallelStation[]) => void;
  onClose: () => void;
}

interface StationDraft {
  key: string;
  exerciseId: string;
  role: string;
}

function createStationKey() {
  return `station-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function emptyStation(): StationDraft {
  return { key: createStationKey(), exerciseId: '', role: '' };
}

function suggestRoleForExercise(exercise: Exercise): string {
  const role = exercise.targetRoles.find((r) => r !== 'Tutti') ?? exercise.targetRoles[0] ?? ROLES[0];
  return formatRoleLabel([role]);
}

function buildInitialStations(initialExercise: Exercise): StationDraft[] {
  return [
    {
      key: createStationKey(),
      exerciseId: initialExercise.id,
      role: suggestRoleForExercise(initialExercise),
    },
    emptyStation(),
  ];
}

export function ParallelBlockFormModal({
  exercises,
  initialExercise,
  onSave,
  onClose,
}: ParallelBlockFormModalProps) {
  const [title, setTitle] = useState('Stazioni in Parallelo');
  const [duration, setDuration] = useState(20);
  const [notes, setNotes] = useState('');
  const [stations, setStations] = useState<StationDraft[]>(() => buildInitialStations(initialExercise));
  const [validationError, setValidationError] = useState('');

  const exerciseById = useMemo(
    () => new Map(exercises.map((exercise) => [exercise.id, exercise])),
    [exercises]
  );

  const inputClass = `${THEME_CLASSES.input} text-sm rounded-lg px-3 py-2 w-full`;
  const labelClass = 'text-xs font-semibold text-theme-muted-text block mb-1';

  const updateStation = (key: string, patch: Partial<Omit<StationDraft, 'key'>>) => {
    setStations((prev) =>
      prev.map((station) => (station.key === key ? { ...station, ...patch } : station))
    );
    setValidationError('');
  };

  const addStation = () => {
    setStations((prev) => [...prev, emptyStation()]);
    setValidationError('');
  };

  const removeStation = (key: string) => {
    setStations((prev) => (prev.length <= 2 ? prev : prev.filter((station) => station.key !== key)));
    setValidationError('');
  };

  const handleExerciseChange = (key: string, exerciseId: string) => {
    const exercise = exerciseById.get(exerciseId);
    updateStation(key, {
      exerciseId,
      role: exercise ? suggestRoleForExercise(exercise) : '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Inserisci un titolo per il blocco.');
      return;
    }

    const completeStations: ParallelStation[] = [];
    for (const station of stations) {
      if (!station.exerciseId && !station.role.trim()) continue;
      const exercise = exerciseById.get(station.exerciseId);
      if (!exercise || !station.role.trim()) {
        setValidationError('Ogni stazione deve avere esercizio e ruolo compilati.');
        return;
      }
      completeStations.push({
        role: station.role.trim(),
        exercise,
        sets: exercise.sets,
        reps: exercise.reps,
        workSeconds: exercise.workSeconds,
        restSeconds: exercise.restSeconds,
      });
    }

    if (completeStations.length < 2) {
      setValidationError('Aggiungi almeno due stazioni con esercizio e ruolo.');
      return;
    }

    const exerciseIds = completeStations.map((station) => station.exercise.id);
    if (new Set(exerciseIds).size !== exerciseIds.length) {
      setValidationError('Ogni stazione deve avere un esercizio diverso.');
      return;
    }

    onSave(title.trim(), duration, notes.trim(), completeStations);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-overlay/80 backdrop-blur-sm">
      <div
        className={`${THEME_CLASSES.card} border-theme-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border shrink-0">
          <h2 className="text-base font-bold text-theme-heading">Nuova Sequenza Parallela</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-theme-muted-hover rounded-lg text-theme-muted-text hover:text-theme-heading"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>Titolo blocco *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                  placeholder="Es. Stazioni Tecnica / Pliometria"
                />
              </div>

              <div>
                <label className={labelClass}>Durata (min)</label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10) || 1)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Note (opzionale)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={inputClass}
                  placeholder="Descrizione del lavoro parallelo..."
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Stazioni parallele *</label>
                <button
                  type="button"
                  onClick={addStation}
                  className="px-2 py-1 text-[11px] font-bold rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" /> Aggiungi stazione
                </button>
              </div>

              {stations.map((station, index) => (
                <div
                  key={station.key}
                  className="p-3 rounded-xl border border-theme-border bg-theme-elevated/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-theme-muted-text uppercase">
                      Stazione {index + 1}
                    </span>
                    {stations.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeStation(station.key)}
                        className="p-1 text-theme-muted-text hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        aria-label={`Rimuovi stazione ${index + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-theme-subtle block mb-1">Esercizio</label>
                      <select
                        value={station.exerciseId}
                        onChange={(e) => handleExerciseChange(station.key, e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Seleziona esercizio...</option>
                        {exercises.map((exercise) => (
                          <option key={exercise.id} value={exercise.id}>
                            {exercise.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-theme-subtle block mb-1">Ruolo</label>
                      <RoleMultiSelect
                        value={station.role}
                        onChange={(role) => updateStation(station.key, { role })}
                        placeholder="Seleziona ruoli..."
                        aria-label={`Ruoli stazione ${index + 1}`}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <p className="text-[11px] text-theme-muted-text">
                Configura almeno due stazioni con esercizio e ruolo distinti. Puoi aggiungerne altre in
                seguito dal pannello esercizi con &quot;In parallelo&quot;.
              </p>

              {validationError && (
                <p className="text-xs text-red-400 font-medium">{validationError}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 p-5 border-t border-theme-border shrink-0">
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
              Crea Sequenza
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
