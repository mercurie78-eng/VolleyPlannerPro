import * as THREE from 'three';
import { createArrow, disposeArrow, type ArrowUserData, type CurveType } from './arrows';
import type { PlayerType } from './constants';
import { createPlayerAt, disposePlayer, getPlayerUserData } from './players';
import { applyCameraZoom, DEFAULT_CAMERA_ZOOM, type SceneApp } from './scene';

export interface TacticalPoint {
  x: number;
  y: number;
  z: number;
}

export interface TacticalPlayerState {
  type: PlayerType;
  x: number;
  z: number;
}

export interface TacticalArrowState {
  number: number;
  start: TacticalPoint;
  end: TacticalPoint;
  curveType: CurveType;
}

export interface TacticalSceneData {
  version: 1;
  zoomLevel: number;
  players: TacticalPlayerState[];
  arrows: TacticalArrowState[];
}

export interface ArrowTacticalMeta {
  start: TacticalPoint;
  end: TacticalPoint;
  curveType: CurveType;
}

export function pointFromVector(vector: THREE.Vector3): TacticalPoint {
  return { x: vector.x, y: vector.y, z: vector.z };
}

export function vectorFromPoint(point: TacticalPoint): THREE.Vector3 {
  return new THREE.Vector3(point.x, point.y, point.z);
}

export function exportTacticalScene(
  players: THREE.Group[],
  arrows: THREE.Group[],
  zoomLevel: number
): TacticalSceneData {
  return {
    version: 1,
    zoomLevel,
    players: players.map((player) => ({
      type: getPlayerUserData(player).type,
      x: player.position.x,
      z: player.position.z,
    })),
    arrows: [...arrows]
      .map((arrow) => {
        const userData = arrow.userData as ArrowUserData & { tactical?: ArrowTacticalMeta };
        if (!userData.tactical) {
          return null;
        }
        return {
          number: userData.number,
          start: userData.tactical.start,
          end: userData.tactical.end,
          curveType: userData.tactical.curveType,
        };
      })
      .filter((arrow): arrow is TacticalArrowState => arrow !== null)
      .sort((left, right) => left.number - right.number),
  };
}

export function importTacticalScene(
  app: SceneApp,
  scene: TacticalSceneData,
  players: THREE.Group[],
  arrows: THREE.Group[]
): number {
  players.splice(0).forEach((player) => {
    app.scene.remove(player);
    disposePlayer(player);
  });

  arrows.splice(0).forEach((arrow) => {
    app.scene.remove(arrow);
    disposeArrow(arrow);
  });

  scene.players.forEach((playerState) => {
    const player = createPlayerAt(playerState.type, playerState.x, playerState.z);
    app.scene.add(player);
    players.push(player);
  });

  scene.arrows.forEach((arrowState) => {
    const result = createArrow(
      vectorFromPoint(arrowState.start),
      vectorFromPoint(arrowState.end),
      arrowState.curveType,
      arrowState.number
    );

    if (!result.group) {
      return;
    }

    (result.group.userData as ArrowUserData & { tactical: ArrowTacticalMeta }).tactical = {
      start: arrowState.start,
      end: arrowState.end,
      curveType: arrowState.curveType,
    };

    app.scene.add(result.group);
    arrows.push(result.group);
  });

  const zoomLevel = scene.zoomLevel ?? DEFAULT_CAMERA_ZOOM;
  applyCameraZoom(app.camera, zoomLevel);
  return zoomLevel;
}
