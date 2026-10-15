// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { memo } from 'react';
import { getCategoryStyle } from '../theme/constants';
import { useTheme } from '../theme/useTheme';

export interface CategoryBadgeProps {
  category: string;
  variant?: 'badge' | 'text' | 'print';
  className?: string;
}

export const CategoryBadge = memo(function CategoryBadge({
  category,
  variant = 'badge',
  className = '',
}: CategoryBadgeProps) {
  const { theme } = useTheme();
  const style = getCategoryStyle(category, theme);

  if (variant === 'text') {
    return (
      <span className={`text-[10px] font-bold uppercase ${style.text} ${className}`}>
        {category}
      </span>
    );
  }

  if (variant === 'print') {
    return (
      <span className={`font-semibold ${style.print} ${className}`}>
        {category}
      </span>
    );
  }

  return (
    <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${style.badge} ${className}`}>
      {category}
    </span>
  );
});
