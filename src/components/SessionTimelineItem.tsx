import { memo } from 'react';
import { Split } from 'lucide-react';
import { ItemControls } from './ItemControls';
import { isParallelBlock } from '../utils/session';
import type { SessionItem } from '../types';

export interface SessionTimelineItemProps {
  item: SessionItem;
  index: number;
  onDurationChange: (index: number, value: string) => void;
  onNotesChange: (index: number, value: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
}

export const SessionTimelineItem = memo(function SessionTimelineItem({
  item,
  index,
  onDurationChange,
  onNotesChange,
  onMove,
  onRemove,
}: SessionTimelineItemProps) {
  if (isParallelBlock(item)) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
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
          <h4 className="text-sm font-bold text-white">{item.parallelTitle}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {item.stations.map((st) => (
              <div key={`${st.role}-${st.exercise.id}`} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-teal-400 block">{st.role}</span>
                <p className="text-xs font-bold text-slate-200">{st.exercise.title}</p>
                <span className="text-[10px] text-purple-400 font-mono block">~{st.exercise.estimatedJumps} salti</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold tracking-wide mr-2">
              {item.category}
            </span>
            <h4 className="text-sm font-bold text-white inline-block">{item.title}</h4>
          </div>
          <ItemControls
            duration={item.sessionDuration || item.durationMin}
            onDurationChange={(val) => onDurationChange(index, val)}
            onMoveUp={() => onMove(index, -1)}
            onMoveDown={() => onMove(index, 1)}
            onRemove={() => onRemove(index)}
          />
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
        <input
          type="text"
          placeholder="Note personalizzate dell'allenatore..."
          value={item.notes || ''}
          onChange={(e) => onNotesChange(index, e.target.value)}
          className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-2.5 py-1 w-full focus:outline-none focus:border-slate-700"
        />
      </div>
    </div>
  );
});
