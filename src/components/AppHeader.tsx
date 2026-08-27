import { Clock, Dumbbell, Calendar, Printer, Sun, Moon, ClipboardCheck } from 'lucide-react';
import { THEME_CLASSES, THEME_LABELS } from '../theme/constants';
import { useTheme } from '../theme/useTheme';
import type { TabId } from '../types';

interface AppHeaderProps {
  activeTab: TabId;
  savedCount: number;
  exerciseCount: number;
  playerCount: number;
  sessionTargetMinutes: number;
  onTabChange: (tab: TabId) => void;
}

export function AppHeader({
  activeTab,
  savedCount,
  exerciseCount,
  playerCount,
  sessionTargetMinutes,
  onTabChange,
}: AppHeaderProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  const tabClass = (tab: TabId) =>
    `flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
      activeTab === tab ? THEME_CLASSES.tabActive : THEME_CLASSES.tabInactive
    }`;

  return (
    <header className={`${THEME_CLASSES.header} sticky top-0 z-40 shadow-lg print:hidden`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
            🏐
          </div>
          <div>
            <h1 className="text-lg font-bold text-theme-heading tracking-wide">VolleyPlanner PRO</h1>
            <p className="text-xs text-theme-muted-text">Pianificazione Allenamenti Integrati</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-theme-border bg-theme-elevated text-theme-muted-text hover:text-theme-heading hover:bg-theme-muted transition"
            aria-label={`Passa al tema ${isDark ? THEME_LABELS.light : THEME_LABELS.dark}`}
            title={`Tema ${THEME_LABELS[theme]}`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="flex items-center bg-theme-elevated p-1 rounded-xl border border-theme-border">
            <button type="button" onClick={() => onTabChange('builder')} className={tabClass('builder')}>
              <Clock className="w-3.5 h-3.5" /> Planner ({sessionTargetMinutes} min)
            </button>
            <button type="button" onClick={() => onTabChange('saved')} className={tabClass('saved')}>
              <Calendar className="w-3.5 h-3.5" /> Archivio ({savedCount})
            </button>
            <button type="button" onClick={() => onTabChange('database')} className={tabClass('database')}>
              <Dumbbell className="w-3.5 h-3.5" /> Esercizi ({exerciseCount})
            </button>
            <button type="button" onClick={() => onTabChange('attendance')} className={tabClass('attendance')}>
              <ClipboardCheck className="w-3.5 h-3.5" /> Presenze ({playerCount})
            </button>
            <button type="button" onClick={() => onTabChange('print')} className={tabClass('print')}>
              <Printer className="w-3.5 h-3.5" /> Scheda Campo
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
