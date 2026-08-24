import { useMemo, useState } from 'react';
import { Save, Check, Zap, Layers, Search } from 'lucide-react';
import { DatePicker } from '../DateRangePicker';
import { SessionTimelineItem } from '../SessionTimelineItem';
import { SessionCategoryGroupHeader } from '../SessionCategoryGroupHeader';
import { ExercisePickerCard } from '../ExercisePickerCard';
import { ExerciseFormModal } from '../ExerciseFormModal';
import { ParallelBlockFormModal } from '../ParallelBlockFormModal';
import { AddParallelStationModal } from '../AddParallelStationModal';
import { CATEGORIES, EXERCISE_TYPES, ROLES, ANALYTIC_CATEGORY } from '../../data/constants';
import { THEME_CLASSES } from '../../theme/constants';
import { groupSessionByCategorySequence, isParallelBlock, suggestExerciseRole } from '../../utils/session';
import type { SaveExerciseOptions } from '../../api/exercises';
import type { Exercise, ParallelStation, SessionItem } from '../../types';

export interface BuilderTabProps {
  sessionTitle: string;
  sessionFocus: string;
  sessionDate: string;
  sessionTargetMinutes: number;
  saveToast: boolean;
  totalMinutes: number;
  totalJumps: number;
  session: SessionItem[];
  filteredExercises: Exercise[];
  exercises: Exercise[];
  searchQuery: string;
  selectedCategory: string;
  selectedExerciseType: string;
  selectedRole: string;
  onSessionTitleChange: (value: string) => void;
  onSessionFocusChange: (value: string) => void;
  onSessionDateChange: (value: string) => void;
  onSessionTargetMinutesChange: (value: number) => void;
  onSave: () => void;
  onGeneratePreset: (type: 'k1' | 'k2') => void;
  onDurationChange: (index: number, value: string) => void;
  onSetsChange: (index: number, value: string) => void;
  onRepsChange: (index: number, value: string) => void;
  onWorkSecondsChange: (index: number, value: string) => void;
  onRestSecondsChange: (index: number, value: string) => void;
  onNotesChange: (index: number, value: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onRemoveParallelStation: (blockIndex: number, stationIndex: number) => void;
  onParallelStationSetsChange: (blockIndex: number, stationIndex: number, value: string) => void;
  onParallelStationRepsChange: (blockIndex: number, stationIndex: number, value: string) => void;
  onParallelStationWorkSecondsChange: (blockIndex: number, stationIndex: number, value: string) => void;
  onParallelStationRestSecondsChange: (blockIndex: number, stationIndex: number, value: string) => void;
  onParallelStationRoleChange: (blockIndex: number, stationIndex: number, value: string) => void;
  onAddExercise: (exercise: Exercise) => void;
  onAddParallelBlock: (
    title: string,
    duration: number,
    notes: string,
    stations: ParallelStation[]
  ) => void;
  onAddExerciseToParallelTarget: (
    targetIndex: number,
    newRole: string,
    exercise: Exercise,
    existingRole?: string
  ) => void;
  onSaveExercise: (exercise: Exercise, options?: SaveExerciseOptions) => Promise<void>;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onExerciseTypeChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  highlightedSessionDates?: Set<string>;
}

export function BuilderTab({
  sessionTitle,
  sessionFocus,
  sessionDate,
  sessionTargetMinutes,
  saveToast,
  totalMinutes,
  totalJumps,
  session,
  filteredExercises,
  exercises,
  searchQuery,
  selectedCategory,
  selectedExerciseType,
  selectedRole,
  onSessionTitleChange,
  onSessionFocusChange,
  onSessionDateChange,
  onSessionTargetMinutesChange,
  onSave,
  onGeneratePreset,
  onDurationChange,
  onSetsChange,
  onRepsChange,
  onWorkSecondsChange,
  onRestSecondsChange,
  onNotesChange,
  onMove,
  onRemove,
  onRemoveParallelStation,
  onParallelStationSetsChange,
  onParallelStationRepsChange,
  onParallelStationWorkSecondsChange,
  onParallelStationRestSecondsChange,
  onParallelStationRoleChange,
  onAddExercise,
  onAddParallelBlock,
  onAddExerciseToParallelTarget,
  onSaveExercise,
  onSearchChange,
  onCategoryChange,
  onExerciseTypeChange,
  onRoleChange,
  highlightedSessionDates,
}: BuilderTabProps) {
  const [formExercise, setFormExercise] = useState<Exercise | null>(null);
  const [showParallelBlockForm, setShowParallelBlockForm] = useState(false);
  const [parallelBlockFormSeed, setParallelBlockFormSeed] = useState<Exercise | null>(null);
  const [parallelStationExercise, setParallelStationExercise] = useState<Exercise | null>(null);

  const parallelTargets = useMemo(
    () =>
      session.map((item, index) => {
        if (isParallelBlock(item)) {
          return {
            index,
            title: item.parallelTitle,
            kind: 'block' as const,
            stationCount: item.stations.length,
          };
        }
        return {
          index,
          title: item.title,
          kind: 'single' as const,
          suggestedExistingRole: suggestExerciseRole(item),
        };
      }),
    [session]
  );

  const showExerciseTypeFilter =
    selectedCategory === 'Tutti' || selectedCategory === ANALYTIC_CATEGORY;

  const sessionCategoryGroups = useMemo(
    () => groupSessionByCategorySequence(session),
    [session]
  );

  const handleFormSave = async (exercise: Exercise, options?: SaveExerciseOptions) => {
    await onSaveExercise(exercise, options);
    setFormExercise(null);
  };

  const handleParallelBlockSave = (
    title: string,
    duration: number,
    notes: string,
    stations: ParallelStation[]
  ) => {
    onAddParallelBlock(title, duration, notes, stations);
    setShowParallelBlockForm(false);
    setParallelBlockFormSeed(null);
  };

  const openParallelBlockForm = (seedExercise: Exercise) => {
    setParallelBlockFormSeed(seedExercise);
    setShowParallelBlockForm(true);
  };

  const closeParallelBlockForm = () => {
    setShowParallelBlockForm(false);
    setParallelBlockFormSeed(null);
  };

  const handleParallelStationConfirm = (targetIndex: number, newRole: string, existingRole?: string) => {
    if (!parallelStationExercise) return;
    onAddExerciseToParallelTarget(targetIndex, newRole, parallelStationExercise, existingRole);
    setParallelStationExercise(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        <div className={`${THEME_CLASSES.card} rounded-2xl p-5 shadow-sm space-y-4`}>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="flex-1 w-full">
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => onSessionTitleChange(e.target.value)}
                className={`${THEME_CLASSES.input} text-base font-bold rounded-xl px-3.5 py-2 w-full`}
              />
              <input
                type="text"
                value={sessionFocus}
                onChange={(e) => onSessionFocusChange(e.target.value)}
                className="bg-theme-elevated/60 border border-theme-border text-xs text-theme-secondary rounded-lg px-3 py-1.5 w-full focus:outline-none focus:border-emerald-500 mt-2"
                placeholder="Focus e obiettivi della seduta..."
              />
            </div>

            <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
              <DatePicker
                value={sessionDate}
                onChange={onSessionDateChange}
                highlightedDates={highlightedSessionDates}
                compact
              />
              <button
                type="button"
                onClick={onSave}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow transition"
              >
                {saveToast ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saveToast ? 'Salvato!' : 'Salva in Archivio'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-theme-border">
            <div className="bg-theme-elevated/80 rounded-xl p-3 border border-theme-border">
              <span className="text-[10px] text-theme-muted-text uppercase font-semibold block">Tempo Totale</span>
              <div className={`text-lg font-black font-mono flex items-baseline gap-1 ${totalMinutes > sessionTargetMinutes ? 'text-amber-400' : 'text-emerald-400'}`}>
                <span>{totalMinutes}</span>
                <span className="text-xs font-normal text-theme-subtle">/</span>
                <input
                  type="number"
                  min={1}
                  value={sessionTargetMinutes}
                  onChange={(e) => onSessionTargetMinutesChange(parseInt(e.target.value, 10) || 1)}
                  className="w-12 bg-theme-input border border-theme-border text-center text-lg font-black font-mono text-theme-heading rounded py-0.5 focus:outline-none focus:border-emerald-500"
                  aria-label="Durata obiettivo sessione in minuti"
                />
                <span className="text-xs font-normal">min</span>
              </div>
            </div>

            <div className="bg-theme-elevated/80 rounded-xl p-3 border border-theme-border">
              <span className="text-[10px] text-theme-muted-text uppercase font-semibold block">Carico Salti Stimato</span>
              <span className="text-lg font-black font-mono text-purple-400 flex items-center gap-1">
                <Zap className="w-4 h-4 fill-purple-400" /> ~{totalJumps} <span className="text-xs font-normal">salti/gioc.</span>
              </span>
              <span className="text-[10px] text-theme-subtle block mt-0.5">Media squadra pesata per ruolo</span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-theme-elevated/80 rounded-xl p-3 border border-theme-border">
              <span className="text-[10px] text-theme-muted-text uppercase font-semibold block">Preset Rapidi</span>
              <div className="flex gap-1.5 mt-1">
                <button type="button" onClick={() => onGeneratePreset('k1')} className={`px-2 py-0.5 ${THEME_CLASSES.mutedButton} rounded text-[10px] font-bold transition hover:bg-emerald-500 hover:text-slate-950`}>K1</button>
                <button type="button" onClick={() => onGeneratePreset('k2')} className={`px-2 py-0.5 ${THEME_CLASSES.mutedButton} rounded text-[10px] font-bold transition hover:bg-emerald-500 hover:text-slate-950`}>K2</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-theme-secondary uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Sequenza Esercitazioni ({session.length})
            </h3>
            <span className="text-xs text-theme-subtle hidden sm:inline">Usa le frecce per riordinare</span>
          </div>

          {session.length === 0 ? (
            <div className={`p-8 text-center ${THEME_CLASSES.emptyState} rounded-2xl text-xs`}>
              Nessun esercizio presente. Seleziona esercitazioni dal database a destra per iniziare.
            </div>
          ) : (
            <div className="space-y-5">
              {sessionCategoryGroups.map((group) => (
                <div key={`${group.category}-${group.items[0]?.index ?? 0}`} className="space-y-3">
                  <SessionCategoryGroupHeader
                    category={group.category}
                    totalMinutes={group.totalMinutes}
                    itemCount={group.items.length}
                  />
                  {group.items.map(({ item, index }) => (
                    <SessionTimelineItem
                      key={item.id}
                      item={item}
                      index={index}
                      onDurationChange={onDurationChange}
                      onSetsChange={onSetsChange}
                      onRepsChange={onRepsChange}
                      onWorkSecondsChange={onWorkSecondsChange}
                      onRestSecondsChange={onRestSecondsChange}
                      onNotesChange={onNotesChange}
                      onMove={onMove}
                      onRemove={onRemove}
                      onRemoveParallelStation={onRemoveParallelStation}
                      onParallelStationSetsChange={onParallelStationSetsChange}
                      onParallelStationRepsChange={onParallelStationRepsChange}
                      onParallelStationWorkSecondsChange={onParallelStationWorkSecondsChange}
                      onParallelStationRestSecondsChange={onParallelStationRestSecondsChange}
                      onParallelStationRoleChange={onParallelStationRoleChange}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-5 space-y-4">
        <div className={`${THEME_CLASSES.card} rounded-2xl p-4 space-y-3 sticky top-20`}>
          <h3 className="text-sm font-bold text-theme-heading flex items-center justify-between">
            <span>Seleziona Esercizi</span>
            <span className="text-xs text-theme-muted-text font-normal">{filteredExercises.length} trovati</span>
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-theme-subtle absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cerca esercitazione..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`${THEME_CLASSES.input} text-xs rounded-xl pl-9 pr-3 py-2 w-full`}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedCategory}
              onChange={(e) => {
                onCategoryChange(e.target.value);
                if (e.target.value !== 'Tutti' && e.target.value !== ANALYTIC_CATEGORY) {
                  onExerciseTypeChange('Tutti');
                }
              }}
              className={`${THEME_CLASSES.inputMuted} text-xs rounded-lg px-2 py-1.5 flex-1 min-w-[8rem]`}
            >
              <option value="Tutti">Tutte le Categorie</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {showExerciseTypeFilter && (
              <select
                value={selectedExerciseType}
                onChange={(e) => onExerciseTypeChange(e.target.value)}
                className={`${THEME_CLASSES.inputMuted} text-xs rounded-lg px-2 py-1.5 flex-1 min-w-[8rem]`}
              >
                <option value="Tutti">Tutte le tipologie</option>
                {EXERCISE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            )}

            <select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className={`${THEME_CLASSES.inputMuted} text-xs rounded-lg px-2 py-1.5 flex-1 min-w-[8rem]`}
            >
              <option value="Tutti">Tutti i Ruoli</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredExercises.map((ex) => (
              <ExercisePickerCard
                key={ex.id}
                exercise={ex}
                onAdd={onAddExercise}
                onAddToParallel={setParallelStationExercise}
                onEdit={setFormExercise}
              />
            ))}
          </div>
        </div>
      </div>

      {formExercise !== null && (
        <ExerciseFormModal
          exercise={formExercise}
          existingExerciseIds={exercises.map((ex) => ex.id)}
          onSave={handleFormSave}
          onClose={() => setFormExercise(null)}
        />
      )}

      {showParallelBlockForm && parallelBlockFormSeed !== null && (
        <ParallelBlockFormModal
          exercises={exercises}
          initialExercise={parallelBlockFormSeed}
          onSave={handleParallelBlockSave}
          onClose={closeParallelBlockForm}
        />
      )}

      {parallelStationExercise !== null && (
        <AddParallelStationModal
          exercise={parallelStationExercise}
          parallelTargets={parallelTargets}
          onConfirm={handleParallelStationConfirm}
          onClose={() => setParallelStationExercise(null)}
          onCreateBlock={() => {
            openParallelBlockForm(parallelStationExercise);
            setParallelStationExercise(null);
          }}
        />
      )}
    </div>
  );
}
