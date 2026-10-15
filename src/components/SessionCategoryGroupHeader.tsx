// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { memo } from 'react';
import { CategoryBadge } from './CategoryBadge';
import { THEME_CLASSES } from '../theme/constants';

export interface SessionCategoryGroupHeaderProps {
  category: string;
  totalMinutes: number;
  itemCount: number;
}

export const SessionCategoryGroupHeader = memo(function SessionCategoryGroupHeader({
  category,
  totalMinutes,
  itemCount,
}: SessionCategoryGroupHeaderProps) {
  return (
    <div
      className={`${THEME_CLASSES.cardElevated} rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border border-theme-border`}
    >
      <div className="flex items-center gap-2">
        <CategoryBadge category={category} />
        <span className="text-[10px] text-theme-muted-text">
          {itemCount} {itemCount === 1 ? 'esercizio' : 'esercizi'}
        </span>
      </div>
      <span className="text-xs font-black font-mono text-emerald-400">
        {totalMinutes} min
      </span>
    </div>
  );
});
