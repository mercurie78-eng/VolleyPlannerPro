// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { ImageIcon } from 'lucide-react';
import type { Exercise } from '../types';

export interface ExerciseImageProps {
  exercise: Pick<Exercise, 'id' | 'title' | 'imageUrl'>;
  previewUrl?: string | null;
  className?: string;
  aspectClass?: string;
  /** cover = riempie il riquadro; contain = proporzioni naturali nel box disponibile */
  fit?: 'cover' | 'contain';
  /** print = stile scheda campo; non mostra placeholder se manca l'immagine */
  variant?: 'default' | 'print';
  /** Se true, non renderizza nulla quando manca l'immagine */
  hideIfMissing?: boolean;
}

function frameClassFor(variant: 'default' | 'print') {
  return variant === 'print'
    ? 'overflow-hidden rounded-lg border border-slate-200 bg-slate-50'
    : 'overflow-hidden rounded-xl border border-theme-border bg-theme-elevated';
}

export function ExerciseImage({
  exercise,
  previewUrl,
  className = '',
  aspectClass = 'aspect-video',
  fit = 'cover',
  variant = 'default',
  hideIfMissing = false,
}: ExerciseImageProps) {
  const src = previewUrl ?? exercise.imageUrl ?? null;
  const frameClass = frameClassFor(variant);

  if (!src) {
    if (variant === 'print' || hideIfMissing) return null;
    const placeholderSizing = fit === 'cover' ? aspectClass : 'h-40';
    return (
      <div
        className={`${frameClass} ${placeholderSizing} flex w-full items-center justify-center ${className}`}
      >
        <ImageIcon className="w-8 h-8 text-theme-subtle" aria-hidden />
        <span className="sr-only">Nessuna immagine per {exercise.title}</span>
      </div>
    );
  }

  const containerClass =
    fit === 'cover'
      ? `${frameClass} ${aspectClass} w-full ${className}`
      : `${frameClass} flex w-full items-center justify-center ${className}`;

  const imageClass =
    fit === 'cover'
      ? 'block h-full w-full object-cover'
      : 'block h-full w-full object-contain';

  return (
    <div className={containerClass}>
      <img
        src={src}
        alt={`Illustrazione esercizio: ${exercise.title}`}
        className={imageClass}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
