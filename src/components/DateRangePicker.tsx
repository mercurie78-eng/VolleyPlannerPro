import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { THEME_CLASSES } from '../theme/constants';

export interface DateRange {
  start: string;
  end: string;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  highlightedDates?: Set<string>;
}

const MONTH_NAMES = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
] as const;

const WEEKDAY_NAMES = ['Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa', 'Do'] as const;

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseIsoDate(iso: string): { year: number; month: number; day: number } | null {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month: month - 1, day };
}

function formatDisplayDate(iso: string): string {
  const parsed = parseIsoDate(iso);
  if (!parsed) return iso;
  return `${String(parsed.day).padStart(2, '0')}/${String(parsed.month + 1).padStart(2, '0')}/${parsed.year}`;
}

function normalizeRange(start: string, end: string): { from: string; to: string } {
  if (!start && !end) return { from: '', to: '' };
  const a = start || end;
  const b = end || start;
  return a <= b ? { from: a, to: b } : { from: b, to: a };
}

function isDateInRange(iso: string, from: string, to: string): boolean {
  if (!from || !to) return false;
  return iso >= from && iso <= to;
}

export function DateRangePicker({ value, onChange, highlightedDates }: DateRangePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState('');
  const [draftEnd, setDraftEnd] = useState('');
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const appliedRange = normalizeRange(value.start, value.end);
  const hasAppliedFilter = Boolean(appliedRange.from);

  useEffect(() => {
    if (!open) return;
    const applied = normalizeRange(value.start, value.end);
    setDraftStart(applied.from);
    setDraftEnd(applied.to);

    const anchor = applied.from || new Date().toISOString().split('T')[0];
    const parsed = parseIsoDate(anchor);
    if (parsed) {
      setViewDate({ year: parsed.year, month: parsed.month });
    }
  }, [open, value.start, value.end]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const calendarDays = useMemo(() => {
    const firstWeekday = new Date(viewDate.year, viewDate.month, 1).getDay();
    const leadingEmpty = firstWeekday === 0 ? 6 : firstWeekday - 1;
    const totalDays = new Date(viewDate.year, viewDate.month + 1, 0).getDate();

    const cells: Array<{ iso: string; day: number } | null> = [];
    for (let i = 0; i < leadingEmpty; i += 1) cells.push(null);
    for (let day = 1; day <= totalDays; day += 1) {
      cells.push({ iso: toIsoDate(viewDate.year, viewDate.month, day), day });
    }
    return cells;
  }, [viewDate]);

  const draftRange = normalizeRange(draftStart, draftEnd);

  const handleDayClick = (iso: string) => {
    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(iso);
      setDraftEnd('');
      return;
    }

    const range = normalizeRange(draftStart, iso);
    setDraftStart(range.from);
    setDraftEnd(range.to);
  };

  const handleApply = () => {
    if (!draftStart) return;
    const range = normalizeRange(draftStart, draftEnd || draftStart);
    onChange({ start: range.from, end: range.to });
    setOpen(false);
  };

  const handleClear = () => {
    setDraftStart('');
    setDraftEnd('');
    onChange({ start: '', end: '' });
    setOpen(false);
  };

  const triggerLabel = hasAppliedFilter
    ? appliedRange.from === appliedRange.to
      ? formatDisplayDate(appliedRange.from)
      : `${formatDisplayDate(appliedRange.from)} – ${formatDisplayDate(appliedRange.to)}`
    : 'Seleziona periodo';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-2 bg-theme-elevated border border-theme-border rounded-xl px-3 py-2 text-sm transition hover:border-emerald-500/40 ${
          hasAppliedFilter ? 'text-emerald-400' : 'text-theme-heading'
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <CalendarDays className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-mono text-xs sm:text-sm">{triggerLabel}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Seleziona periodo date"
          className={`absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] ${THEME_CLASSES.card} rounded-2xl border border-theme-border shadow-2xl p-4 space-y-4`}
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setViewDate((prev) => {
                  if (prev.month === 0) return { year: prev.year - 1, month: 11 };
                  return { year: prev.year, month: prev.month - 1 };
                })
              }
              className={`p-1.5 rounded-lg ${THEME_CLASSES.mutedButton} transition`}
              aria-label="Mese precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-theme-heading">
              {MONTH_NAMES[viewDate.month]} {viewDate.year}
            </span>
            <button
              type="button"
              onClick={() =>
                setViewDate((prev) => {
                  if (prev.month === 11) return { year: prev.year + 1, month: 0 };
                  return { year: prev.year, month: prev.month + 1 };
                })
              }
              className={`p-1.5 rounded-lg ${THEME_CLASSES.mutedButton} transition`}
              aria-label="Mese successivo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAY_NAMES.map((name) => (
              <span key={name} className="text-[10px] font-bold text-theme-subtle uppercase py-1">
                {name}
              </span>
            ))}
            {calendarDays.map((cell, index) => {
              if (!cell) {
                return <span key={`empty-${index}`} />;
              }

              const inDraftRange = isDateInRange(cell.iso, draftRange.from, draftRange.to);
              const isStart = cell.iso === draftRange.from;
              const isEnd = cell.iso === draftRange.to && draftRange.to !== draftRange.from;
              const isHighlighted = highlightedDates?.has(cell.iso);

              return (
                <button
                  key={cell.iso}
                  type="button"
                  onClick={() => handleDayClick(cell.iso)}
                  className={`relative h-9 rounded-lg text-xs font-semibold transition ${
                    isStart || isEnd
                      ? 'bg-emerald-600 text-white'
                      : inDraftRange
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-theme-secondary hover:bg-theme-muted'
                  }`}
                >
                  {cell.day}
                  {isHighlighted && !inDraftRange && !(isStart || isEnd) && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl bg-theme-elevated border border-theme-border px-3 py-2 text-xs space-y-1">
            <div className="flex justify-between gap-2">
              <span className="text-theme-subtle">Inizio</span>
              <span className="font-mono text-theme-heading">
                {draftStart ? formatDisplayDate(draftStart) : '—'}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-theme-subtle">Fine</span>
              <span className="font-mono text-theme-heading">
                {draftEnd ? formatDisplayDate(draftEnd) : draftStart ? formatDisplayDate(draftStart) : '—'}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-theme-muted-text">
            Clicca la data di inizio, poi la data di fine. Un solo clic imposta lo stesso giorno.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClear}
              className={`flex-1 py-2 ${THEME_CLASSES.mutedButton} text-xs font-bold rounded-xl transition`}
            >
              Cancella
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!draftStart}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
            >
              Applica
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function formatDateRangeLabel(range: DateRange): string {
  const normalized = normalizeRange(range.start, range.end);
  if (!normalized.from) return '';
  if (normalized.from === normalized.to) return formatDisplayDate(normalized.from);
  return `${formatDisplayDate(normalized.from)} – ${formatDisplayDate(normalized.to)}`;
}
