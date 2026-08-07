import { Calendar, Save, Check, Zap, Layers, Search } from 'lucide-react';
import { SessionTimelineItem } from '../SessionTimelineItem';
import { ExercisePickerCard } from '../ExercisePickerCard';
import { CATEGORIES, ROLES, SESSION_TARGET_MINUTES } from '../../data/constants';
import type { Exercise, SessionItem } from '../../types';

export interface BuilderTabProps {
  sessionTitle: string;
  sessionFocus: string;
  sessionDate: string;
  saveToast: boolean;
  totalMinutes: number;
  totalJumps: number;
  session: SessionItem[];
  filteredExercises: Exercise[];
  searchQuery: string;
  selectedCategory: string;
  selectedRole: string;
  onSessionTitleChange: (value: string) => void;
  onSessionFocusChange: (value: string) => void;
  onSessionDateChange: (value: string) => void;
  onSave: () => void;
  onGeneratePreset: (type: 'k1' | 'k2') => void;
  onDurationChange: (index: number, value: string) => void;
  onSetsChange: (index: number, value: string) => void;
  onRepsChange: (index: number, value: string) => void;
  onNotesChange: (index: number, value: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  onRemoveParallelStation: (blockIndex: number, stationIndex: number) => void;
  onAddExercise: (exercise: Exercise) => void;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onRoleChange: (value: string) => void;
}

export function BuilderTab({
  sessionTitle,
  sessionFocus,
  sessionDate,
  saveToast,
  totalMinutes,
  totalJumps,
  session,
  filteredExercises,
  searchQuery,
  selectedCategory,
  selectedRole,
  onSessionTitleChange,
  onSessionFocusChange,
  onSessionDateChange,
  onSave,
  onGeneratePreset,
  onDurationChange,
  onSetsChange,
  onRepsChange,
  onNotesChange,
  onMove,
  onRemove,
  onRemoveParallelStation,
  onAddExercise,
  onSearchChange,
  onCategoryChange,
  onRoleChange,
}: BuilderTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="flex-1 w-full">
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => onSessionTitleChange(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-base font-bold text-white rounded-xl px-3.5 py-2 w-full focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={sessionFocus}
                onChange={(e) => onSessionFocusChange(e.target.value)}
                className="bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 rounded-lg px-3 py-1.5 w-full focus:outline-none focus:border-emerald-500 mt-2"
                placeholder="Focus e obiettivi della seduta..."
              />
            </div>

            <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0">
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => onSessionDateChange(e.target.value)}
                  className="bg-transparent text-white focus:outline-none font-mono text-xs cursor-pointer"
                />
              </div>
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

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tempo Totale</span>
              <span className={`text-lg font-black font-mono ${totalMinutes > SESSION_TARGET_MINUTES ? 'text-amber-400' : 'text-emerald-400'}`}>
                {totalMinutes} / {SESSION_TARGET_MINUTES} <span className="text-xs font-normal">min</span>
              </span>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Carico Salti Stimato</span>
              <span className="text-lg font-black font-mono text-purple-400 flex items-center gap-1">
                <Zap className="w-4 h-4 fill-purple-400" /> ~{totalJumps} <span className="text-xs font-normal">salti/gioc.</span>
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-950/80 rounded-xl p-3 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Preset Rapidi</span>
              <div className="flex gap-1.5 mt-1">
                <button type="button" onClick={() => onGeneratePreset('k1')} className="px-2 py-0.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 rounded text-[10px] font-bold transition">K1</button>
                <button type="button" onClick={() => onGeneratePreset('k2')} className="px-2 py-0.5 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 rounded text-[10px] font-bold transition">K2</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> Sequenza Esercitazioni ({session.length})
            </h3>
            <span className="text-xs text-slate-500">Usa le frecce per riordinare</span>
          </div>

          {session.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
              Nessun esercizio presente. Seleziona esercitazioni dal database a destra per iniziare.
            </div>
          ) : (
            session.map((item, index) => (
              <SessionTimelineItem
                key={item.id}
                item={item}
                index={index}
                onDurationChange={onDurationChange}
                onSetsChange={onSetsChange}
                onRepsChange={onRepsChange}
                onNotesChange={onNotesChange}
                onMove={onMove}
                onRemove={onRemove}
                onRemoveParallelStation={onRemoveParallelStation}
              />
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-5 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 sticky top-20">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Seleziona Esercizi</span>
            <span className="text-xs text-slate-400 font-normal">{filteredExercises.length} trovati</span>
          </h3>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cerca esercitazione..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl pl-9 pr-3 py-2 w-full focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2 py-1.5 flex-1 focus:outline-none"
            >
              <option value="Tutti">Tutte le Categorie</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2 py-1.5 flex-1 focus:outline-none"
            >
              <option value="Tutti">Tutti i Ruoli</option>
              {ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredExercises.map((ex) => (
              <ExercisePickerCard key={ex.id} exercise={ex} onAdd={onAddExercise} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
