// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { CategoryBadge } from '../CategoryBadge';
import { ExerciseImage } from '../ExerciseImage';
import { computeSessionSchedule, getSessionItemMinutes, isParallelBlock } from '../../utils/session';
import { formatSetsRepsLabel, formatWorkRestLabel } from '../../utils/tabata';
import { DEFAULT_SESSION_START_TIME } from '../../data/constants';
import type { SessionItem } from '../../types';

export interface PrintTabProps {
  sessionTitle: string;
  sessionFocus: string;
  sessionDate: string;
  sessionStartTime: string;
  sessionTargetMinutes: number;
  totalMinutes: number;
  totalJumps: number;
  session: SessionItem[];
}

export function PrintTab({
  sessionTitle,
  sessionFocus,
  sessionDate,
  sessionStartTime,
  sessionTargetMinutes,
  totalMinutes,
  totalJumps,
  session,
}: PrintTabProps) {
  const schedule = useMemo(
    () => computeSessionSchedule(session, sessionStartTime || DEFAULT_SESSION_START_TIME),
    [session, sessionStartTime]
  );

  return (
    <div className="space-y-4 max-w-4xl mx-auto print:max-w-none print:mx-0 print:space-y-0">
      <div className="flex justify-end gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow"
        >
          <Printer className="w-4 h-4" /> Stampa Scheda Campo
        </button>
      </div>

      <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl space-y-6 font-sans print:p-0 print:rounded-none print:shadow-none print:space-y-2">
        <div className="border-b border-slate-300 pb-4 print:pb-1 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">{sessionTitle}</h1>
            <p className="text-xs font-semibold text-emerald-700 mt-1 print:mt-0.5">Focus: {sessionFocus}</p>
          </div>
          <div className="text-right text-xs text-slate-600 font-mono">
            <p><strong>Data:</strong> {sessionDate}</p>
            <p><strong>Inizio:</strong> {sessionStartTime || DEFAULT_SESSION_START_TIME}</p>
            <p><strong>Durata:</strong> {totalMinutes} / {sessionTargetMinutes} min</p>
            <p><strong>Carico Salti:</strong> ~{totalJumps} salti/giocatore (media squadra pesata per ruolo)</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1 print:pb-0.5 print:mb-0">Programma dell&apos;Allenamento</h3>

          {session.map((item, idx) => {
            const slot = schedule[idx];
            const timeLabel = slot ? `${slot.startTime}` : '';
            const setsRepsLabel = !isParallelBlock(item)
              ? formatSetsRepsLabel(item.sets, item.reps)
              : null;

            return (
            <div key={item.id} className="border-b border-slate-200 pb-3 print:break-inside-avoid print-exercise-item">
              {isParallelBlock(item) ? (
                <div className="space-y-2">
                  <div className="font-bold text-xs text-emerald-800">
                    {timeLabel && <span className="font-mono text-slate-700">{timeLabel} </span>}
                    MODULO {idx + 1}: {item.parallelTitle} (STAZIONI PARALLELE) ({item.sessionDuration} MIN)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {item.stations.map((st) => {
                      const setsRepsLabel = formatSetsRepsLabel(st.sets, st.reps, { repsShort: true });

                      return (
                      <div key={`${st.role}-${st.exercise.id}`} className="bg-slate-100 p-2 rounded text-xs space-y-1">
                        <strong className="block text-slate-900">{st.role}:</strong>
                        <span>{st.exercise.title}</span>
                        <ExerciseImage
                          exercise={st.exercise}
                          variant="print"
                          fit="contain"
                          className="w-full h-24"
                        />
                        {setsRepsLabel && (
                          <span className="block font-semibold text-amber-700 mt-0.5">
                            {setsRepsLabel}
                          </span>
                        )}
                        {formatWorkRestLabel(
                          st.workSeconds,
                          st.restSeconds,
                          st.sets,
                          st.reps
                        ) && (
                          <span className="block font-semibold text-cyan-700 mt-0.5">
                            {formatWorkRestLabel(
                              st.workSeconds,
                              st.restSeconds,
                              st.sets,
                              st.reps
                            )}
                          </span>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
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
                  <div className="font-bold text-xs text-slate-900">
                    {timeLabel && <span className="font-mono text-slate-700">{timeLabel} </span>}
                    MODULO {idx + 1}: {item.title} (
                    <CategoryBadge category={item.category} variant="print" className="inline" />
                    ) ({getSessionItemMinutes(item)} MIN)
                  </div>
                  <div className="mt-1">
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{item.description}</p>
                    {setsRepsLabel && (
                      <p className="text-xs font-semibold text-amber-700 mt-0.5">
                        {setsRepsLabel}
                      </p>
                    )}
                    {formatWorkRestLabel(item.workSeconds, item.restSeconds, item.sets, item.reps) && (
                      <p className="text-xs font-semibold text-cyan-700 mt-0.5">
                        Tabata: {formatWorkRestLabel(item.workSeconds, item.restSeconds, item.sets, item.reps)}
                      </p>
                    )}
                    {item.notes && <p className="text-xs italic text-emerald-700 mt-0.5">Note: {item.notes}</p>}
                  </div>
                  <div className="clear-both" aria-hidden />
                </div>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
