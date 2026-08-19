import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  ClipboardCheck,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { PlayerFormModal } from '../PlayerFormModal';
import { DateRangePicker, formatDateRangeLabel, type DateRange } from '../DateRangePicker';
import { THEME_CLASSES } from '../../theme/constants';
import type { AttendanceRecord, Player, SavedSession } from '../../types';

type AttendanceView = 'register' | 'roster';

export interface AttendanceTabProps {
  players: Player[];
  savedSessions: SavedSession[];
  onSavePlayer: (player: Player) => Promise<void>;
  onDeletePlayer: (id: string) => Promise<void>;
  onLoadAttendance: (sessionId: string) => Promise<void>;
  onSaveAttendance: (sessionId: string, records: AttendanceRecord[]) => Promise<void>;
  onClearAttendance: () => void;
  attendanceRecords: AttendanceRecord[];
  attendanceLoading: boolean;
  attendanceSaving: boolean;
  attendanceError: string | null;
}

function playerFullName(player: Player): string {
  return `${player.lastName} ${player.firstName}`;
}

function formatSessionDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export function AttendanceTab({
  players,
  savedSessions,
  onSavePlayer,
  onDeletePlayer,
  onLoadAttendance,
  onSaveAttendance,
  onClearAttendance,
  attendanceRecords,
  attendanceLoading,
  attendanceSaving,
  attendanceError,
}: AttendanceTabProps) {
  const [view, setView] = useState<AttendanceView>('register');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [filterRange, setFilterRange] = useState<DateRange>({ start: '', end: '' });
  const [localRecords, setLocalRecords] = useState<Map<string, AttendanceRecord>>(new Map());
  const [formPlayer, setFormPlayer] = useState<Player | 'new' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activePlayers = useMemo(() => players.filter((p) => p.active), [players]);
  const selectedSession = savedSessions.find((s) => s.id === selectedSessionId);

  const sortedSessions = useMemo(
    () =>
      [...savedSessions].sort(
        (a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'it')
      ),
    [savedSessions]
  );

  const filteredSessions = useMemo(() => {
    if (!filterRange.start && !filterRange.end) return sortedSessions;

    const start = filterRange.start || filterRange.end;
    const end = filterRange.end || filterRange.start;
    const from = start <= end ? start : end;
    const to = start <= end ? end : start;

    return sortedSessions.filter((session) => session.date >= from && session.date <= to);
  }, [sortedSessions, filterRange]);

  const sessionDates = useMemo(
    () => new Set(savedSessions.map((session) => session.date)),
    [savedSessions]
  );

  const filterRangeLabel = formatDateRangeLabel(filterRange);

  useEffect(() => {
    if (selectedSessionId && !filteredSessions.some((session) => session.id === selectedSessionId)) {
      setSelectedSessionId('');
    }
  }, [filteredSessions, selectedSessionId]);

  useEffect(() => {
    if (selectedSessionId) {
      void onLoadAttendance(selectedSessionId);
    } else {
      onClearAttendance();
    }
  }, [selectedSessionId, onLoadAttendance, onClearAttendance]);

  useEffect(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const record of attendanceRecords) {
      map.set(record.playerId, record);
    }
    setLocalRecords(map);
    setSaveSuccess(false);
  }, [attendanceRecords, selectedSessionId]);

  const getRecordForPlayer = useCallback(
    (playerId: string): AttendanceRecord => {
      const existing = localRecords.get(playerId);
      if (existing) return existing;
      return {
        sessionId: selectedSessionId,
        playerId,
        present: true,
      };
    },
    [localRecords, selectedSessionId]
  );

  const updateRecord = (playerId: string, updates: Partial<AttendanceRecord>) => {
    setLocalRecords((prev) => {
      const next = new Map(prev);
      const current = getRecordForPlayer(playerId);
      next.set(playerId, { ...current, ...updates });
      return next;
    });
    setSaveSuccess(false);
  };

  const presentCount = useMemo(() => {
    return activePlayers.filter((p) => getRecordForPlayer(p.id).present).length;
  }, [activePlayers, getRecordForPlayer]);

  const handleSaveAttendance = async () => {
    if (!selectedSessionId) return;
    setActionError(null);
    try {
      const records = activePlayers.map((player) => getRecordForPlayer(player.id));
      await onSaveAttendance(selectedSessionId, records);
      setSaveSuccess(true);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Salvataggio non riuscito');
    }
  };

  const handleMarkAll = (present: boolean) => {
    setLocalRecords((prev) => {
      const next = new Map(prev);
      for (const player of activePlayers) {
        const existing = prev.get(player.id);
        const current = existing ?? {
          sessionId: selectedSessionId,
          playerId: player.id,
          present: true,
        };
        next.set(player.id, { ...current, present });
      }
      return next;
    });
    setSaveSuccess(false);
  };

  const handleDeletePlayer = async (player: Player) => {
    if (!window.confirm(`Eliminare ${playerFullName(player)} dalla rosa?`)) return;
    setActionError(null);
    try {
      await onDeletePlayer(player.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Eliminazione non riuscita');
    }
  };

  const handleFormSave = async (player: Player) => {
    setActionError(null);
    try {
      await onSavePlayer(player);
      setFormPlayer(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Salvataggio non riuscito');
    }
  };

  const viewButtonClass = (target: AttendanceView) =>
    `flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
      view === target ? THEME_CLASSES.tabActive : THEME_CLASSES.tabInactive
    }`;

  return (
    <div className="space-y-4">
      <div className={`${THEME_CLASSES.card} rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <h2 className="text-base font-bold text-theme-heading flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-400" /> Presenze Allenamenti
          </h2>
          <p className="text-xs text-theme-muted-text mt-1">
            Gestisci la rosa giocatori e registra le presenze per ogni seduta salvata
          </p>
        </div>

        <div className="flex items-center bg-theme-elevated p-1 rounded-xl border border-theme-border">
          <button type="button" onClick={() => setView('register')} className={viewButtonClass('register')}>
            <UserCheck className="w-3.5 h-3.5" /> Registro Presenze
          </button>
          <button type="button" onClick={() => setView('roster')} className={viewButtonClass('roster')}>
            <Users className="w-3.5 h-3.5" /> Rosa ({players.length})
          </button>
        </div>
      </div>

      {(actionError || attendanceError) && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {actionError ?? attendanceError}
        </div>
      )}

      {view === 'register' && (
        <div className="space-y-4">
          <div className={`${THEME_CLASSES.card} rounded-2xl p-4 space-y-4`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <label className="block text-[10px] font-bold text-theme-subtle uppercase mb-2">
                  Filtra per data
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <DateRangePicker
                    value={filterRange}
                    onChange={setFilterRange}
                    highlightedDates={sessionDates}
                  />
                  {filterRangeLabel && (
                    <button
                      type="button"
                      onClick={() => setFilterRange({ start: '', end: '' })}
                      className={`px-3 py-2 ${THEME_CLASSES.mutedButton} text-xs font-bold rounded-xl transition`}
                    >
                      Tutte le date
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-theme-muted-text">
                {filteredSessions.length}{' '}
                {filteredSessions.length === 1 ? 'allenamento' : 'allenamenti'}
                {filterRangeLabel ? ` nel periodo ${filterRangeLabel}` : ' in archivio'}
              </p>
            </div>

            {savedSessions.length === 0 ? (
              <div className={`${THEME_CLASSES.emptyState} rounded-xl p-8 text-center text-sm`}>
                Nessun allenamento in archivio. Salva una seduta dal Planner per registrare le presenze.
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className={`${THEME_CLASSES.emptyState} rounded-xl p-8 text-center text-sm`}>
                Nessun allenamento nel periodo {filterRangeLabel}.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-theme-border">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-theme-border bg-theme-elevated/80">
                      <th className="text-left px-4 py-3 text-[10px] font-bold text-theme-subtle uppercase tracking-wide">
                        Data
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold text-theme-subtle uppercase tracking-wide">
                        Titolo
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold text-theme-subtle uppercase tracking-wide hidden md:table-cell">
                        Focus
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold text-theme-subtle uppercase tracking-wide">
                        Durata
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-bold text-theme-subtle uppercase tracking-wide hidden sm:table-cell">
                        Esercizi
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] font-bold text-theme-subtle uppercase tracking-wide">
                        Azione
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((session) => {
                      const isSelected = selectedSessionId === session.id;
                      return (
                        <tr
                          key={session.id}
                          onClick={() => setSelectedSessionId(session.id)}
                          className={`border-b border-theme-border last:border-b-0 cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/15'
                              : 'hover:bg-theme-muted/40'
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              {formatSessionDate(session.date)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-theme-heading">{session.title}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-theme-muted-text hidden md:table-cell max-w-[200px] truncate">
                            {session.focus}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-theme-muted-text">
                            {session.totalMinutes} / {session.targetMinutes ?? 120} min
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-theme-muted-text hidden sm:table-cell">
                            {session.items.length}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSessionId(session.id);
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : `${THEME_CLASSES.mutedButton} hover:bg-emerald-600 hover:text-white`
                              }`}
                            >
                              {isSelected ? 'Selezionato' : 'Registra'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!selectedSessionId ? (
            <div className={`${THEME_CLASSES.emptyState} rounded-2xl p-12 text-center text-sm`}>
              Seleziona un allenamento dalla tabella per registrare le presenze.
            </div>
          ) : activePlayers.length === 0 ? (
            <div className={`${THEME_CLASSES.emptyState} rounded-2xl p-12 text-center text-sm space-y-3`}>
              <p>Nessun giocatore attivo in rosa.</p>
              <button
                type="button"
                onClick={() => setView('roster')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
              >
                Aggiungi giocatori
              </button>
            </div>
          ) : (
            <>
              {selectedSession && (
                <div className={`${THEME_CLASSES.card} rounded-2xl p-4 flex flex-wrap items-center gap-3 text-xs text-theme-muted-text`}>
                  <span className="flex items-center gap-1.5 font-mono font-bold text-emerald-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatSessionDate(selectedSession.date)}
                  </span>
                  <span className="font-semibold text-theme-heading">{selectedSession.title}</span>
                  <span className="text-theme-subtle hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{selectedSession.focus}</span>
                </div>
              )}

              <div className={`${THEME_CLASSES.card} rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3`}>
                <div className="text-sm">
                  <span className="font-bold text-emerald-400">{presentCount}</span>
                  <span className="text-theme-muted-text"> / {activePlayers.length} presenti</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAll(true)}
                    className={`px-3 py-1.5 ${THEME_CLASSES.mutedButton} text-xs font-bold rounded-xl transition`}
                  >
                    Tutti presenti
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll(false)}
                    className={`px-3 py-1.5 ${THEME_CLASSES.mutedButton} text-xs font-bold rounded-xl transition`}
                  >
                    Tutti assenti
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveAttendance()}
                    disabled={attendanceLoading || attendanceSaving}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {attendanceSaving ? 'Salvataggio...' : 'Salva Presenze'}
                  </button>
                </div>
              </div>

              {saveSuccess && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4" /> Presenze salvate con successo
                </div>
              )}

              {attendanceLoading ? (
                <div className={`${THEME_CLASSES.emptyState} rounded-2xl p-8 text-center text-sm`}>
                  Caricamento presenze...
                </div>
              ) : (
                <div className="space-y-2">
                  {activePlayers.map((player) => {
                    const record = getRecordForPlayer(player.id);
                    return (
                      <div
                        key={player.id}
                        className={`${THEME_CLASSES.card} rounded-xl p-3 flex flex-wrap items-center gap-3`}
                      >
                        <div className="flex items-center gap-3 min-w-[180px] flex-1">
                          {player.jerseyNumber != null && (
                            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center">
                              {player.jerseyNumber}
                            </span>
                          )}
                          <div>
                            <p className="text-sm font-bold text-theme-heading">{playerFullName(player)}</p>
                            <p className="text-[10px] text-theme-muted-text">{player.role}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateRecord(player.id, { present: true })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              record.present
                                ? 'bg-emerald-600 text-white'
                                : `${THEME_CLASSES.mutedButton} text-theme-muted-text`
                            }`}
                          >
                            Presente
                          </button>
                          <button
                            type="button"
                            onClick={() => updateRecord(player.id, { present: false })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              !record.present
                                ? 'bg-rose-600 text-white'
                                : `${THEME_CLASSES.mutedButton} text-theme-muted-text`
                            }`}
                          >
                            Assente
                          </button>
                        </div>

                        <input
                          type="text"
                          value={record.note ?? ''}
                          onChange={(e) => updateRecord(player.id, { note: e.target.value })}
                          placeholder="Nota (es. infortunio, ritardo...)"
                          className={`flex-1 min-w-[200px] ${THEME_CLASSES.inputMuted} text-xs rounded-lg px-3 py-1.5`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view === 'roster' && (
        <div className="space-y-4">
          <div className={`${THEME_CLASSES.card} rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4`}>
            <span className="text-xs text-theme-muted-text">
              {players.length} giocatori in rosa ({activePlayers.length} attivi)
            </span>
            <button
              type="button"
              onClick={() => setFormPlayer('new')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nuovo Giocatore
            </button>
          </div>

          {players.length === 0 ? (
            <div className={`${THEME_CLASSES.emptyState} rounded-2xl p-12 text-center text-sm`}>
              Nessun giocatore in rosa. Aggiungi i componenti della squadra per registrare le presenze.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player) => (
                <div key={player.id} className={`${THEME_CLASSES.card} rounded-2xl p-4 space-y-3`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-theme-heading">{playerFullName(player)}</h3>
                      <p className="text-xs text-theme-muted-text">{player.role}</p>
                    </div>
                    {player.jerseyNumber != null && (
                      <span className="px-2 py-1 rounded-lg bg-theme-muted text-theme-secondary font-mono text-xs font-bold">
                        #{player.jerseyNumber}
                      </span>
                    )}
                  </div>

                  {!player.active && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                      <X className="w-3 h-3" /> Non attivo
                    </span>
                  )}

                  {player.notes && (
                    <p className="text-xs text-theme-subtle italic">{player.notes}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPlayer(player)}
                      className={`flex-1 py-1.5 ${THEME_CLASSES.mutedButton} text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition`}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Modifica
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeletePlayer(player)}
                      className="p-1.5 bg-theme-muted hover:bg-rose-500/20 text-rose-400 rounded-xl transition"
                      aria-label="Elimina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {formPlayer !== null && (
        <PlayerFormModal
          player={formPlayer === 'new' ? null : formPlayer}
          onSave={handleFormSave}
          onClose={() => setFormPlayer(null)}
        />
      )}
    </div>
  );
}
