import { Plus, Trash2, Calendar, FolderOpen } from 'lucide-react';
import { THEME_CLASSES } from '../../theme/constants';
import { isParallelBlock } from '../../utils/session';
import type { SavedSession } from '../../types';

export interface SavedTabProps {
  savedSessions: SavedSession[];
  onNewSession: () => void;
  onDelete: (id: string) => Promise<void>;
  onLoad: (session: SavedSession) => void;
}

export function SavedTab({ savedSessions, onNewSession, onDelete, onLoad }: SavedTabProps) {
  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Eliminare "${title}" dall'archivio?`)) return;
    await onDelete(id);
  };

  return (
    <div className="space-y-6">
      <div className={`${THEME_CLASSES.card} rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <h2 className="text-base font-bold text-theme-heading flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" /> Archivio Allenamenti Salvati
          </h2>
          <p className="text-xs text-theme-muted-text">Consulta o carica le sedute salvate ordinate per data</p>
        </div>

        <button
          type="button"
          onClick={onNewSession}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
        >
          <Plus className="w-4 h-4" /> Nuova Sessione
        </button>
      </div>

      {savedSessions.length === 0 ? (
        <div className={`${THEME_CLASSES.card} rounded-2xl p-12 text-center text-theme-muted-text space-y-2`}>
          <FolderOpen className="w-10 h-10 mx-auto text-theme-subtle" />
          <p className="text-sm font-semibold">Nessun allenamento presente in archivio.</p>
          <p className="text-xs text-theme-subtle">Crea una nuova scheda nel Planner e clicca su &quot;Salva in Archivio&quot;.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedSessions.map((item) => (
            <div key={item.id} className={`${THEME_CLASSES.card} rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-theme-muted-hover transition`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> {item.date}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-theme-muted-text font-mono">
                    <span>{item.totalMinutes} / {item.targetMinutes ?? 120} min</span>
                    <span>•</span>
                    <span className="text-purple-400">~{item.totalJumps} salti</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-theme-heading">{item.title}</h3>
                  <p className="text-xs text-theme-muted-text italic mt-0.5">{item.focus}</p>
                </div>

                <div className="bg-theme-elevated p-3 rounded-xl border border-theme-border text-xs text-theme-secondary space-y-1">
                  <span className="text-[10px] uppercase font-bold text-theme-subtle block">Esercitazioni ({item.items.length}):</span>
                  <ul className="list-disc list-inside space-y-0.5 text-theme-muted-text max-h-24 overflow-y-auto">
                    {item.items.map((ex) => (
                      <li key={ex.id} className="truncate">
                        <span className="text-theme-secondary font-semibold">
                          {isParallelBlock(ex) ? ex.parallelTitle : ex.title}
                        </span>{' '}
                        ({ex.sessionDuration || ('durationMin' in ex ? ex.durationMin : 0)}m)
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-theme-border pt-3">
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id, item.title)}
                  className="px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Elimina
                </button>

                <button
                  type="button"
                  onClick={() => onLoad(item)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> Carica nel Planner
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
