import { Printer } from 'lucide-react';
import { CategoryBadge } from '../CategoryBadge';
import { ExerciseImage } from '../ExerciseImage';
import { isParallelBlock } from '../../utils/session';
import { formatWorkRestLabel } from '../../utils/tabata';
import type { SessionItem } from '../../types';

export interface PrintTabProps {
  sessionTitle: string;
  sessionFocus: string;
  sessionDate: string;
  sessionTargetMinutes: number;
  totalMinutes: number;
  totalJumps: number;
  session: SessionItem[];
}

export function PrintTab({
  sessionTitle,
  sessionFocus,
  sessionDate,
  sessionTargetMinutes,
  totalMinutes,
  totalJumps,
  session,
}: PrintTabProps) {
  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow"
        >
          <Printer className="w-4 h-4" /> Stampa Scheda Campo
        </button>
      </div>

      <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl space-y-6 font-sans">
        <div className="border-b border-slate-300 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">{sessionTitle}</h1>
            <p className="text-xs font-semibold text-emerald-700 mt-1">Focus: {sessionFocus}</p>
          </div>
          <div className="text-right text-xs text-slate-600 font-mono">
            <p><strong>Data:</strong> {sessionDate}</p>
            <p><strong>Durata:</strong> {totalMinutes} / {sessionTargetMinutes} min</p>
            <p><strong>Carico Salti:</strong> ~{totalJumps} salti/giocatore (media squadra pesata per ruolo)</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">Programma dell&apos;Allenamento</h3>

          {session.map((item, idx) => (
            <div key={item.id} className="border-b border-slate-200 pb-3">
              {isParallelBlock(item) ? (
                <div className="space-y-2">
                  <div className="flex justify-between font-bold text-xs text-emerald-800">
                    <span>MODULO {idx + 1}: {item.parallelTitle} (STAZIONI PARALLELE)</span>
                    <span>{item.sessionDuration} MIN</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {item.stations.map((st) => (
                      <div key={`${st.role}-${st.exercise.id}`} className="bg-slate-100 p-2 rounded text-xs space-y-1">
                        <strong className="block text-slate-900">{st.role}:</strong>
                        <span>{st.exercise.title}</span>
                        <ExerciseImage
                          exercise={st.exercise}
                          variant="print"
                          fit="contain"
                          className="w-full h-24"
                        />
                        {(st.sets != null || st.reps != null) && (
                          <span className="block font-semibold text-amber-700 mt-0.5">
                            {st.sets != null && st.reps != null
                              ? `${st.sets} serie × ${st.reps} rip.`
                              : st.sets != null
                                ? `${st.sets} serie`
                                : `${st.reps} rip.`}
                          </span>
                        )}
                        {formatWorkRestLabel(
                          st.workSeconds ?? st.exercise.workSeconds,
                          st.restSeconds ?? st.exercise.restSeconds,
                          st.sets ?? st.exercise.sets
                        ) && (
                          <span className="block font-semibold text-cyan-700 mt-0.5">
                            {formatWorkRestLabel(
                              st.workSeconds ?? st.exercise.workSeconds,
                              st.restSeconds ?? st.exercise.restSeconds,
                              st.sets ?? st.exercise.sets
                            )}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between font-bold text-xs text-slate-900">
                    <span>
                      MODULO {idx + 1}: {item.title} (
                      <CategoryBadge category={item.category} variant="print" className="inline" />
                      )
                    </span>
                    <span>{item.sessionDuration || item.durationMin} MIN</span>
                  </div>
                  <div className="mt-1">
                    {item.imageUrl && (
                      <div className="float-right ml-3 mb-1 w-36 h-32">
                        <ExerciseImage
                          exercise={item}
                          variant="print"
                          fit="contain"
                          className="w-full h-full"
                        />
                      </div>
                    )}
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{item.description}</p>
                    {(item.sets != null || item.reps != null) && (
                      <p className="text-xs font-semibold text-amber-700 mt-0.5">
                        {item.sets != null && item.reps != null
                          ? `${item.sets} serie × ${item.reps} ripetizioni`
                          : item.sets != null
                            ? `${item.sets} serie`
                            : `${item.reps} ripetizioni`}
                      </p>
                    )}
                    {formatWorkRestLabel(item.workSeconds, item.restSeconds, item.sets) && (
                      <p className="text-xs font-semibold text-cyan-700 mt-0.5">
                        Tabata: {formatWorkRestLabel(item.workSeconds, item.restSeconds, item.sets)}
                      </p>
                    )}
                    {item.notes && <p className="text-xs italic text-emerald-700 mt-0.5">Note: {item.notes}</p>}
                    <div className="clear-both" aria-hidden />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-300 pt-4 flex justify-between text-xs text-slate-500">
          <span>VolleyPlanner PRO - Scheda Tecnica Campo</span>
          <span>Firma Allenatore: ______________________</span>
        </div>
      </div>
    </div>
  );
}
