import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ROLES } from '../data/constants';
import { THEME_CLASSES } from '../theme/constants';
import type { Player } from '../types';

export interface PlayerFormModalProps {
  player: Player | null;
  onSave: (player: Player) => Promise<void>;
  onClose: () => void;
}

function emptyPlayer(id: string): Player {
  return {
    id,
    firstName: '',
    lastName: '',
    role: ROLES[0],
    jerseyNumber: null,
    active: true,
    medicalVisitExpiry: null,
    notes: '',
  };
}

export function PlayerFormModal({ player, onSave, onClose }: PlayerFormModalProps) {
  const isEditing = player !== null;
  const [form, setForm] = useState<Player>(() => player ?? emptyPlayer(`player-${Date.now()}`));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setForm(player ?? emptyPlayer(`player-${Date.now()}`));
    setSaveError(null);
  }, [player]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || saving) return;

    setSaving(true);
    setSaveError(null);
    try {
      await onSave({
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        medicalVisitExpiry: form.medicalVisitExpiry?.trim() || null,
        notes: form.notes?.trim() || undefined,
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Salvataggio non riuscito');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`${THEME_CLASSES.card} rounded-2xl w-full max-w-md shadow-2xl border border-theme-border`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border">
          <h2 className="text-sm font-bold text-theme-heading">
            {isEditing ? 'Modifica Giocatore' : 'Nuovo Giocatore'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-theme-muted text-theme-muted-text transition"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-theme-subtle uppercase mb-1">Nome</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                className={`w-full ${THEME_CLASSES.input} text-sm rounded-lg px-3 py-2`}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-theme-subtle uppercase mb-1">Cognome</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                className={`w-full ${THEME_CLASSES.input} text-sm rounded-lg px-3 py-2`}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-theme-subtle uppercase mb-1">Ruolo</label>
              <select
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                className={`w-full ${THEME_CLASSES.input} text-sm rounded-lg px-3 py-2`}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-theme-subtle uppercase mb-1">Numero maglia</label>
              <input
                type="number"
                min={1}
                max={99}
                value={form.jerseyNumber ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    jerseyNumber: e.target.value === '' ? null : parseInt(e.target.value, 10) || null,
                  }))
                }
                className={`w-full ${THEME_CLASSES.input} text-sm rounded-lg px-3 py-2`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-theme-subtle uppercase mb-1">
              Scadenza visita medica
            </label>
            <input
              type="date"
              value={form.medicalVisitExpiry ?? ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  medicalVisitExpiry: e.target.value === '' ? null : e.target.value,
                }))
              }
              className={`w-full ${THEME_CLASSES.input} text-sm rounded-lg px-3 py-2`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-theme-subtle uppercase mb-1">Note</label>
            <textarea
              value={form.notes ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className={`w-full ${THEME_CLASSES.input} text-sm rounded-lg px-3 py-2 resize-none`}
              placeholder="Infortuni, ruoli alternativi..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-theme-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              className="rounded border-theme-border text-emerald-500 focus:ring-emerald-500"
            />
            Giocatore attivo in rosa
          </label>

          {saveError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {saveError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2 ${THEME_CLASSES.mutedButton} text-xs font-bold rounded-xl transition`}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving || !form.firstName.trim() || !form.lastName.trim()}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
            >
              {saving ? 'Salvataggio...' : isEditing ? 'Salva Modifiche' : 'Aggiungi Giocatore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
