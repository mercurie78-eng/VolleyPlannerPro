import { Clock, Dumbbell, Calendar, Printer } from 'lucide-react';
import { SESSION_TARGET_MINUTES } from '../data/constants';
import type { TabId } from '../types';

interface AppHeaderProps {
  activeTab: TabId;
  savedCount: number;
  exerciseCount: number;
  onTabChange: (tab: TabId) => void;
}

export function AppHeader({ activeTab, savedCount, exerciseCount, onTabChange }: AppHeaderProps) {
  const tabClass = (tab: TabId) =>
    `flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
      activeTab === tab
        ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
        : 'text-slate-400 hover:text-white'
    }`;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
            🏐
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">VolleyPlanner PRO</h1>
            <p className="text-xs text-slate-400">Pianificazione Allenamenti Integrati & Pliometria</p>
          </div>
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button type="button" onClick={() => onTabChange('builder')} className={tabClass('builder')}>
            <Clock className="w-3.5 h-3.5" /> Planner ({SESSION_TARGET_MINUTES} min)
          </button>
          <button type="button" onClick={() => onTabChange('saved')} className={tabClass('saved')}>
            <Calendar className="w-3.5 h-3.5" /> Archivio ({savedCount})
          </button>
          <button type="button" onClick={() => onTabChange('database')} className={tabClass('database')}>
            <Dumbbell className="w-3.5 h-3.5" /> Esercizi ({exerciseCount})
          </button>
          <button type="button" onClick={() => onTabChange('print')} className={tabClass('print')}>
            <Printer className="w-3.5 h-3.5" /> Scheda Campo
          </button>
        </div>
      </div>
    </header>
  );
}
