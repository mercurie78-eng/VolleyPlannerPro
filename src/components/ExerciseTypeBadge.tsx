// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { memo } from 'react';

export interface ExerciseTypeBadgeProps {
  exerciseType: string;
  className?: string;
}

export const ExerciseTypeBadge = memo(function ExerciseTypeBadge({
  exerciseType,
  className = '',
}: ExerciseTypeBadgeProps) {
  return (
    <span
      className={`px-2 py-0.5 rounded border text-[10px] font-bold bg-cyan-500/5 text-cyan-300 border-cyan-500/20 ${className}`}
    >
      {exerciseType}
    </span>
  );
});
