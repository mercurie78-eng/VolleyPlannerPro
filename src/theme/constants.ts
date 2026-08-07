import type { CategoryName } from '../data/constants';

export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'volley-planner-theme';
export const DEFAULT_THEME: ThemeMode = 'dark';

export const THEME_MODES: readonly ThemeMode[] = ['dark', 'light'] as const;

export const THEME_LABELS: Record<ThemeMode, string> = {
  dark: 'Scuro',
  light: 'Chiaro',
};

/** CSS custom property names applied on `document.documentElement`. */
export const THEME_CSS_VARS = {
  page: '--theme-page',
  card: '--theme-card',
  elevated: '--theme-elevated',
  input: '--theme-input',
  muted: '--theme-muted',
  mutedHover: '--theme-muted-hover',
  border: '--theme-border',
  heading: '--theme-heading',
  body: '--theme-body',
  secondary: '--theme-secondary',
  mutedText: '--theme-muted-text',
  subtle: '--theme-subtle',
  overlay: '--theme-overlay',
} as const;

export interface CategoryStyle {
  badge: string;
  text: string;
  print: string;
}

const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  badge: 'bg-theme-muted text-theme-muted-text border-theme-border',
  text: 'text-theme-muted-text',
  print: 'text-theme-secondary',
};

export const CATEGORY_STYLES: Record<ThemeMode, Record<CategoryName, CategoryStyle>> = {
  dark: {
    Riscaldamento: {
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      text: 'text-amber-400',
      print: 'text-amber-700',
    },
    Pliometria: {
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      text: 'text-purple-400',
      print: 'text-purple-700',
    },
    'Tecnica Analitica': {
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      text: 'text-cyan-400',
      print: 'text-cyan-700',
    },
    'Lavoro Sintetico': {
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      text: 'text-emerald-400',
      print: 'text-emerald-700',
    },
    'Gioco Globale': {
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      text: 'text-rose-400',
      print: 'text-rose-700',
    },
    Defaticamento: {
      badge: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      text: 'text-sky-400',
      print: 'text-sky-700',
    },
  },
  light: {
    Riscaldamento: {
      badge: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
      text: 'text-amber-700',
      print: 'text-amber-700',
    },
    Pliometria: {
      badge: 'bg-purple-500/15 text-purple-800 border-purple-500/30',
      text: 'text-purple-700',
      print: 'text-purple-700',
    },
    'Tecnica Analitica': {
      badge: 'bg-cyan-500/15 text-cyan-800 border-cyan-500/30',
      text: 'text-cyan-700',
      print: 'text-cyan-700',
    },
    'Lavoro Sintetico': {
      badge: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
      text: 'text-emerald-700',
      print: 'text-emerald-700',
    },
    'Gioco Globale': {
      badge: 'bg-rose-500/15 text-rose-800 border-rose-500/30',
      text: 'text-rose-700',
      print: 'text-rose-700',
    },
    Defaticamento: {
      badge: 'bg-sky-500/15 text-sky-800 border-sky-500/30',
      text: 'text-sky-700',
      print: 'text-sky-700',
    },
  },
};

export function getCategoryStyle(category: string, theme: ThemeMode): CategoryStyle {
  return CATEGORY_STYLES[theme][category as CategoryName] ?? DEFAULT_CATEGORY_STYLE;
}

/** Semantic Tailwind utility groups shared across components. */
export const THEME_CLASSES = {
  page: 'min-h-screen bg-theme-page text-theme-body',
  header: 'bg-theme-card border-b border-theme-border',
  card: 'bg-theme-card border border-theme-border',
  cardElevated: 'bg-theme-elevated border border-theme-border',
  input: 'bg-theme-input border border-theme-border text-theme-heading focus:border-emerald-500 focus:outline-none',
  inputMuted: 'bg-theme-input border border-theme-muted text-theme-secondary focus:border-emerald-500 focus:outline-none',
  mutedButton: 'bg-theme-muted hover:bg-theme-muted-hover text-theme-secondary hover:text-theme-heading',
  tabActive: 'bg-emerald-500 text-slate-950 shadow-md font-bold',
  tabInactive: 'text-theme-muted-text hover:text-theme-heading',
  emptyState: 'bg-theme-card/50 border border-dashed border-theme-border text-theme-muted-text',
} as const;
