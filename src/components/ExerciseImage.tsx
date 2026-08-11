import { ImageIcon } from 'lucide-react';
import type { Exercise } from '../types';

export interface ExerciseImageProps {
  exercise: Pick<Exercise, 'id' | 'title' | 'imageUrl'>;
  previewUrl?: string | null;
  className?: string;
  aspectClass?: string;
  /** cover = riempie il riquadro (catalogo); contain = proporzioni naturali (timeline) */
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
    return (
      <div
        className={`${frameClass} ${aspectClass} flex items-center justify-center ${className}`}
      >
        <ImageIcon className="w-8 h-8 text-theme-subtle" aria-hidden />
        <span className="sr-only">Nessuna immagine per {exercise.title}</span>
      </div>
    );
  }

  if (fit === 'contain') {
    return (
      <div className={frameClass}>
        <img
          src={src}
          alt={`Illustrazione esercizio: ${exercise.title}`}
          className={`block w-full max-w-full object-contain ${className}`}
        />
      </div>
    );
  }

  return (
    <div className={`${frameClass} ${aspectClass} w-full ${className}`}>
      <img
        src={src}
        alt={`Illustrazione esercizio: ${exercise.title}`}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
