import { memo } from 'react';
import { Trash2, Clock, ArrowUp, ArrowDown } from 'lucide-react';

export interface ItemControlsProps {
  duration: number;
  onDurationChange: (value: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  /** Se true, la durata è calcolata dal tabata e non è modificabile. */
  durationLocked?: boolean;
  durationTitle?: string;
}

export const ItemControls = memo(function ItemControls({
  duration,
  onDurationChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  durationLocked = false,
  durationTitle,
}: ItemControlsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="flex items-center gap-1 text-xs">
        <Clock className="w-3.5 h-3.5 text-theme-muted-text" />
        <input
          type="number"
          value={duration}
          onChange={(e) => onDurationChange(e.target.value)}
          disabled={durationLocked}
          title={durationTitle}
          className={`w-12 bg-theme-input border border-theme-border text-center text-xs font-bold font-mono text-emerald-400 rounded py-0.5 focus:outline-none focus:border-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed`}
        />
        <span className="text-theme-muted-text text-xs">min</span>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onMoveUp} className="p-1 hover:bg-theme-muted-hover rounded text-theme-muted-text hover:text-theme-heading" aria-label="Sposta su">
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={onMoveDown} className="p-1 hover:bg-theme-muted-hover rounded text-theme-muted-text hover:text-theme-heading" aria-label="Sposta giù">
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={onRemove} className="p-1 hover:bg-rose-500/20 rounded text-rose-400" aria-label="Rimuovi">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
});
