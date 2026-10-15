import { memo } from 'react';
import { Split, Trash2 } from 'lucide-react';
import { CategoryBadge } from './CategoryBadge';
import { ExerciseTypeBadge } from './ExerciseTypeBadge';
import { ExerciseImage } from './ExerciseImage';
import { ItemControls } from './ItemControls';
import { RoleMultiSelect } from './RoleMultiSelect';
import { THEME_CLASSES } from '../theme/constants';
import { isParallelBlock, getSessionItemMinutes } from '../utils/session';
import {
  computeTabataDurationMinutes,
  computeTabataTotalSeconds,
  formatWorkRestLabel,
  isTabataTiming,
} from '../utils/tabata';
import { sessionItemJumps, stationJumps } from '../utils/jumps';
import { countPlayersForRoleLabel, countPlayersForRoles } from '../utils/roles';
import type { SessionItem } from '../types';

export interface SessionTimelineItemProps {
  item: SessionItem;
  index: number;
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
}

const numberInputClass =
  'bg-theme-input border border-theme-border text-center font-bold font-mono text-amber-400 rounded py-0.5 focus:outline-none focus:border-emerald-500';

export const SessionTimelineItem = memo(function SessionTimelineItem({
  item,
  index,
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
}: SessionTimelineItemProps) {
  if (isParallelBlock(item)) {
    return (
      <div className={`${THEME_CLASSES.card} rounded-xl p-4 shadow-sm hover:border-theme-muted-hover transition`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
              <Split className="w-3 h-3" /> STAZIONI IN PARALLELO SIMULTANEE
            </span>
            <ItemControls
              duration={item.sessionDuration}
              onDurationChange={(val) => onDurationChange(index, val)}
              onMoveUp={() => onMove(index, -1)}
              onMoveDown={() => onMove(index, 1)}
              onRemove={() => onRemove(index)}
            />
          </div>
          <h4 className="text-sm font-bold text-theme-heading">{item.parallelTitle}</h4>
          {item.stations.length === 0 ? (
            <p className="text-xs text-theme-muted-text italic bg-theme-elevated border border-dashed border-theme-border rounded-lg p-3">
              Nessuna stazione. Usa &quot;In parallelo&quot; nel pannello a destra per aggiungere esercizi a questo blocco.
            </p>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {item.stations.map((st, stationIndex) => (
              <div key={`${index}-${stationIndex}-${st.exercise.id}`} className="bg-theme-elevated p-2.5 rounded-lg border border-theme-border flex flex-col gap-1 min-h-0">
                <div className="flex items-start justify-between gap-1">
                  <label className="flex-1 min-w-0">
                    <span className="sr-only">Ruolo stazione</span>
                    <RoleMultiSelect
                      compact
                      value={st.role}
                      onChange={(val) => onParallelStationRoleChange(index, stationIndex, val)}
                      placeholder="Ruoli..."
                      aria-label={`Ruoli per ${st.exercise.title}`}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemoveParallelStation(index, stationIndex)}
                    className="p-0.5 hover:bg-rose-500/20 rounded text-rose-400/70 hover:text-rose-400 transition shrink-0"
                    aria-label={`Rimuovi ${st.exercise.title}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs font-bold text-theme-secondary">{st.exercise.title}</p>
                <p className="text-[10px] font-mono text-theme-subtle">{st.exercise.id}</p>
                <ExerciseImage
                  exercise={st.exercise}
                  fit="contain"
                  className="w-full h-32 sm:h-36"
                  hideIfMissing
                />
                <p className="text-xs text-theme-muted-text leading-relaxed whitespace-pre-wrap">{st.exercise.description}</p>
                <span className="text-[10px] text-purple-400 font-mono block">
                  ~{stationJumps(st)} salti × {countPlayersForRoleLabel(st.role)} gioc.
                </span>
                <div className="flex flex-wrap items-center gap-2 text-[10px] pt-0.5">
                  <label className="flex items-center gap-1 text-theme-muted-text">
                    <span className="font-semibold">Serie</span>
                    <input
                      type="number"
                      min={0}
                      value={st.sets}
                      onChange={(e) => onParallelStationSetsChange(index, stationIndex, e.target.value)}
                      className={`w-10 ${numberInputClass}`}
                      title="Serie in questa seduta"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-theme-muted-text">
                    <span className="font-semibold">Rip.</span>
                    <input
                      type="number"
                      min={0}
                      value={st.reps}
                      onChange={(e) => onParallelStationRepsChange(index, stationIndex, e.target.value)}
                      className={`w-10 ${numberInputClass}`}
                      title="Ripetizioni in questa seduta"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-theme-muted-text">
                    <span className="font-semibold">Lav.</span>
                    <input
                      type="number"
                      min={0}
                      value={st.workSeconds || ''}
                      onChange={(e) => onParallelStationWorkSecondsChange(index, stationIndex, e.target.value)}
                      className={`w-10 ${numberInputClass}`}
                      title="Secondi di lavoro in questa seduta"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-theme-muted-text">
                    <span className="font-semibold">Pausa</span>
                    <input
                      type="number"
                      min={0}
                      value={st.restSeconds || ''}
                      onChange={(e) => onParallelStationRestSecondsChange(index, stationIndex, e.target.value)}
                      className={`w-10 ${numberInputClass}`}
                      title="Secondi di pausa in questa seduta"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${THEME_CLASSES.card} rounded-xl p-4 shadow-sm hover:border-theme-muted-hover transition`}>
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CategoryBadge category={item.category} className="mr-2 tracking-wide" />
            {item.exerciseType && (
              <ExerciseTypeBadge exerciseType={item.exerciseType} className="mr-2 align-middle" />
            )}
            <h4 className="text-sm font-bold text-theme-heading inline-block">{item.title}</h4>
            <p className="text-[10px] font-mono text-theme-subtle mt-0.5">{item.exerciseId}</p>
          </div>
          <ItemControls
            duration={getSessionItemMinutes(item)}
            onDurationChange={(val) => onDurationChange(index, val)}
            onMoveUp={() => onMove(index, -1)}
            onMoveDown={() => onMove(index, 1)}
            onRemove={() => onRemove(index)}
            durationLocked={isTabataTiming(item.workSeconds, item.restSeconds, item.sets)}
            durationTitle={
              isTabataTiming(item.workSeconds, item.restSeconds, item.sets)
                ? `Calcolato da tabata (${computeTabataTotalSeconds(item.workSeconds, item.restSeconds, item.sets, item.reps)}s)`
                : undefined
            }
          />
        </div>
        <ExerciseImage exercise={item} fit="contain" className="w-full h-36 sm:h-44" hideIfMissing />
        <p className="text-xs text-theme-muted-text leading-relaxed whitespace-pre-wrap">{item.description}</p>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-[10px] text-purple-400 font-mono">
            ~{sessionItemJumps(item)} salti × {countPlayersForRoles(item.targetRoles)} gioc.
          </span>
          <label className="flex items-center gap-1.5 text-theme-muted-text">
            <span className="font-semibold">Serie</span>
            <input
              type="number"
              min={0}
              placeholder="—"
              value={item.sets}
              onChange={(e) => onSetsChange(index, e.target.value)}
              className={`w-12 ${numberInputClass}`}
            />
          </label>
          <label className="flex items-center gap-1.5 text-theme-muted-text">
            <span className="font-semibold">Ripetizioni</span>
            <input
              type="number"
              min={0}
              placeholder="—"
              value={item.reps}
              onChange={(e) => onRepsChange(index, e.target.value)}
              className={`w-12 ${numberInputClass}`}
              title="Esercizi nel circuito tabata"
            />
          </label>
          <label className="flex items-center gap-1.5 text-theme-muted-text">
            <span className="font-semibold">Lavoro</span>
            <input
              type="number"
              min={0}
              placeholder="—"
              value={item.workSeconds || ''}
              onChange={(e) => onWorkSecondsChange(index, e.target.value)}
              className={`w-12 ${numberInputClass}`}
              title="Secondi di lavoro"
            />
            <span className="text-[10px]">s</span>
          </label>
          <label className="flex items-center gap-1.5 text-theme-muted-text">
            <span className="font-semibold">Pausa</span>
            <input
              type="number"
              min={0}
              placeholder="—"
              value={item.restSeconds || ''}
              onChange={(e) => onRestSecondsChange(index, e.target.value)}
              className={`w-12 ${numberInputClass}`}
              title="Secondi di pausa"
            />
            <span className="text-[10px]">s</span>
          </label>
        </div>
        {formatWorkRestLabel(item.workSeconds, item.restSeconds, item.sets, item.reps) && (
          <p className="text-[10px] font-mono text-cyan-400">
            Tabata: {formatWorkRestLabel(item.workSeconds, item.restSeconds, item.sets, item.reps)}
            {computeTabataTotalSeconds(item.workSeconds, item.restSeconds, item.sets, item.reps) != null && (
              <>
                {' '}
                → {computeTabataTotalSeconds(item.workSeconds, item.restSeconds, item.sets, item.reps)}s
                {' '}
                ({computeTabataDurationMinutes(item.workSeconds, item.restSeconds, item.sets, item.reps)} min)
              </>
            )}
          </p>
        )}
        <input
          type="text"
          placeholder="Note personalizzate dell'allenatore..."
          value={item.notes || ''}
          onChange={(e) => onNotesChange(index, e.target.value)}
          className="bg-theme-input border border-theme-border text-xs text-theme-secondary rounded-lg px-2.5 py-1 w-full focus:outline-none focus:border-emerald-500"
        />
      </div>
    </div>
  );
});
