// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { ROLES } from '../data/constants';
import { THEME_CLASSES } from '../theme/constants';
import { RoleMultiSelect } from './RoleMultiSelect';
import { formatRoleLabel } from '../utils/roles';
import type { Exercise } from '../types';

export const NEW_PARALLEL_SECTION_INDEX = -1;

export interface ParallelTargetOption {
  index: number;
  title: string;
  kind: 'block' | 'single';
  stationCount?: number;
  suggestedExistingRole?: string;
}

export interface AddParallelStationModalProps {
  exercise: Exercise;
  parallelTargets: ParallelTargetOption[];
  onConfirm: (targetIndex: number, newRole: string, existingRole?: string) => void;
  onClose: () => void;
  onCreateBlock: () => void;
}

export function AddParallelStationModal({
  exercise,
  parallelTargets,
  onConfirm,
  onClose,
  onCreateBlock,
}: AddParallelStationModalProps) {
  const [targetIndex, setTargetIndex] = useState(NEW_PARALLEL_SECTION_INDEX);
  const [newRole, setNewRole] = useState('');
  const [existingRole, setExistingRole] = useState('');
  const [validationError, setValidationError] = useState('');

  const isNewSection = targetIndex === NEW_PARALLEL_SECTION_INDEX;

  const selectedTarget = useMemo(
    () => parallelTargets.find((t) => t.index === targetIndex),
    [parallelTargets, targetIndex]
  );

  const isSingleTarget = selectedTarget?.kind === 'single';

  const suggestedNewRole =
    exercise.targetRoles.find((r) => r !== 'Tutti') ?? exercise.targetRoles[0] ?? ROLES[0];

  useEffect(() => {
    setNewRole(formatRoleLabel([suggestedNewRole]));
  }, [exercise.id, suggestedNewRole]);

  useEffect(() => {
    if (targetIndex === NEW_PARALLEL_SECTION_INDEX) return;
    if (!parallelTargets.some((t) => t.index === targetIndex)) {
      setTargetIndex(NEW_PARALLEL_SECTION_INDEX);
    }
  }, [parallelTargets, targetIndex]);

  useEffect(() => {
    if (selectedTarget?.kind === 'single' && selectedTarget.suggestedExistingRole) {
      setExistingRole(formatRoleLabel([selectedTarget.suggestedExistingRole]));
    }
  }, [selectedTarget]);

  const inputClass = `${THEME_CLASSES.input} text-sm rounded-lg px-3 py-2 w-full`;
  const labelClass = 'text-xs font-semibold text-theme-muted-text block mb-1';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewSection) {
      onCreateBlock();
      return;
    }
    if (!newRole.trim()) {
      setValidationError('Seleziona almeno un ruolo per la stazione.');
      return;
    }
    if (isSingleTarget && !existingRole.trim()) {
      setValidationError("Seleziona il ruolo dell'esercizio già in sessione.");
      return;
    }
    onConfirm(targetIndex, newRole.trim(), isSingleTarget ? existingRole.trim() : undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-overlay/80 backdrop-blur-sm">
      <div className={`${THEME_CLASSES.card} border-theme-border rounded-2xl shadow-2xl w-full max-w-md`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border">
          <h2 className="text-base font-bold text-theme-heading">Aggiungi a Stazione Parallela</h2>
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
          <p className="text-xs text-theme-muted-text">
            Esercizio: <span className="font-bold text-theme-heading">{exercise.title}</span>
          </p>

          <div>
            <label className={labelClass}>Destinazione *</label>
            <select
              value={targetIndex}
              onChange={(e) => {
                setTargetIndex(parseInt(e.target.value, 10));
                setValidationError('');
              }}
              className={inputClass}
            >
              <option value={NEW_PARALLEL_SECTION_INDEX}>+ Nuova sezione parallela</option>
              {parallelTargets.map((target) => (
                <option key={target.index} value={target.index}>
                  {target.kind === 'single'
                    ? `↳ Converti in parallelo: ${target.title}`
                    : `${target.title} (${target.stationCount} stazioni)`}
                </option>
              ))}
            </select>
          </div>

          {isNewSection ? (
            <p className="text-[11px] text-theme-muted-text">
              Configura una nuova sequenza parallela con più stazioni. L&apos;esercizio selezionato
              verrà precompilato nella prima stazione.
            </p>
          ) : (
            <>
              {isSingleTarget && (
                <div>
                  <label className={labelClass}>Ruolo esercizio già in sessione *</label>
                  <RoleMultiSelect
                    value={existingRole}
                    onChange={(value) => {
                      setExistingRole(value);
                      setValidationError('');
                    }}
                    placeholder="Seleziona ruoli..."
                    aria-label="Ruoli esercizio in sessione"
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>
                  {isSingleTarget ? 'Ruolo nuovo esercizio *' : 'Ruolo / Stazione *'}
                </label>
                <RoleMultiSelect
                  value={newRole}
                  onChange={(value) => {
                    setNewRole(value);
                    setValidationError('');
                  }}
                  placeholder="Seleziona ruoli..."
                  aria-label="Ruoli nuovo esercizio"
                />
              </div>

              {isSingleTarget && (
                <p className="text-[11px] text-theme-muted-text">
                  L&apos;esercizio singolo verrà convertito in un blocco parallelo con entrambe le stazioni.
                </p>
              )}
            </>
          )}

          {validationError && (
            <p className="text-xs text-red-400 font-medium">{validationError}</p>
          )}

          <div className="flex gap-2 pt-1">
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
              {isNewSection ? 'Continua…' : isSingleTarget ? 'Converti in Parallelo' : 'Aggiungi Stazione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
