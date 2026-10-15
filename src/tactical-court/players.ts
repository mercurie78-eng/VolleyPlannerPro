// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import * as THREE from 'three';
import {
  COURT_LENGTH,
  COURT_WIDTH,
  PLAYER_TYPES,
  type PlayerType,
} from './constants';
import { BODY_HEIGHT, buildPlayerFigure, disposeFigure } from './playerModel';
import { createTextSprite, disposeSprite } from './sprites';

export interface PlayerUserData {
  type: PlayerType;
}

const ROLE_LABEL_SIZE = 0.38;

function attachFigure(playerGroup: THREE.Group, color: number): void {
  const figure = buildPlayerFigure(color);
  playerGroup.add(figure);
}

function attachRoleLabel(playerGroup: THREE.Group, type: PlayerType): void {
  const roleSprite = createTextSprite(type, '#FFFFFF', ROLE_LABEL_SIZE, {
    transparentBackground: true,
  });
  roleSprite.position.y = BODY_HEIGHT / 2;
  roleSprite.renderOrder = 10;
  roleSprite.material.depthTest = false;
  roleSprite.material.depthWrite = false;
  roleSprite.userData.isRoleLabel = true;
  playerGroup.add(roleSprite);
}

export function createPlayerAt(type: PlayerType, x: number, z: number): THREE.Group {
  const player = createPlayer(type);
  player.position.set(x, 0, z);
  return player;
}

export function createPlayer(type: PlayerType): THREE.Group {
  const config = PLAYER_TYPES[type];
  const playerGroup = new THREE.Group();
  playerGroup.name = `Player_${type}_${Date.now()}`;
  playerGroup.userData = { type } satisfies PlayerUserData;

  const baseDragGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
  const baseDragMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const baseDrag = new THREE.Mesh(baseDragGeometry, baseDragMaterial);
  baseDrag.position.y = 0.05;
  baseDrag.userData.draggable = true;
  playerGroup.add(baseDrag);

  attachFigure(playerGroup, config.color);
  attachRoleLabel(playerGroup, type);

  playerGroup.position.set(
    Math.random() * COURT_WIDTH - COURT_WIDTH / 2,
    0,
    Math.random() * COURT_LENGTH - COURT_LENGTH / 2
  );

  return playerGroup;
}

export function disposePlayer(player: THREE.Group): void {
  player.children.forEach((child) => {
    if (child.userData?.isRoleLabel) {
      disposeSprite(child as THREE.Sprite);
      return;
    }

    if (child.name === 'Figure') {
      disposeFigure(child as THREE.Group);
      return;
    }

    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else {
        material.dispose();
      }
    }
  });
}

export function getDraggableObjects(players: THREE.Group[]): THREE.Mesh[] {
  return players
    .map((player) => player.children.find((child) => child.userData.draggable))
    .filter((child): child is THREE.Mesh => Boolean(child));
}

export function getPlayerUserData(player: THREE.Group): PlayerUserData {
  return player.userData as PlayerUserData;
}
