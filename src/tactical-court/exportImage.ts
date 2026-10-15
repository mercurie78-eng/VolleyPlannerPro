// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import type { WebGLRenderer } from 'three';

export async function captureRendererAsFile(
  renderer: WebGLRenderer,
  filename: string
): Promise<File> {
  const canvas = renderer.domElement;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Impossibile esportare l\'immagine del campo'));
          return;
        }

        resolve(new File([blob], filename, { type: 'image/png' }));
      },
      'image/png',
      1
    );
  });
}
