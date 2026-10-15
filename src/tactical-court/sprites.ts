// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import * as THREE from 'three';

export interface TextSpriteOptions {
  transparentBackground?: boolean;
}

export function createTextSprite(
  text: string,
  color: string,
  size: number,
  options: TextSpriteOptions = {}
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  const fontSize = 120;
  context.font = `bold ${fontSize}px Inter, sans-serif`;

  const metrics = context.measureText(text);
  const textWidth = metrics.width;

  canvas.width = textWidth + 40;
  canvas.height = fontSize + 40;

  context.font = `bold ${fontSize}px Inter, sans-serif`;

  if (!options.transparentBackground) {
    context.fillStyle = 'rgba(0, 0, 0, 0.72)';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set((canvas.width / canvas.height) * size, size, 1);

  return sprite;
}

export function disposeSprite(sprite: THREE.Sprite): void {
  if (!sprite.material) {
    return;
  }

  if (sprite.material.map) {
    sprite.material.map.dispose();
  }

  sprite.material.dispose();
}
