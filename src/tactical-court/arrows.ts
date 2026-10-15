// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import * as THREE from 'three';
import { ARROW_COLOR, CURVE_STRENGTH, MIN_ARROW_LENGTH } from './constants';
import { createTextSprite, disposeSprite } from './sprites';

export type CurveType = 'straight' | 'curve_up';

const ARROW_Y = 0.08;
const SHAFT_HALF_WIDTH = 0.035;
const HEAD_LENGTH = 0.32;
const HEAD_HALF_WIDTH = 0.15;
const ARROW_LABEL_SIZE = 0.38;

export interface ArrowUserData {
  number: number;
  sprite?: THREE.Sprite;
  shaft?: THREE.Mesh;
  arrowhead?: THREE.Mesh;
}

export interface CreateArrowResult {
  group?: THREE.Group;
  error?: string;
}

function getRibbonSide(tangent: THREE.Vector3, halfWidth: number): THREE.Vector3 {
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(tangent, up);
  if (side.lengthSq() < 1e-6) {
    side.set(1, 0, 0);
  }
  side.normalize().multiplyScalar(halfWidth);
  return side;
}

function getPathEndTangent(pathPoints: THREE.Vector3[], fallback: THREE.Vector3): THREE.Vector3 {
  if (pathPoints.length >= 2) {
    const from = pathPoints[pathPoints.length - 2];
    const to = pathPoints[pathPoints.length - 1];
    const tangent = to.clone().sub(from);
    if (tangent.lengthSq() > 1e-6) {
      return tangent.normalize();
    }
  }
  return fallback.clone().normalize();
}

function truncatePathForHead(
  pathPoints: THREE.Vector3[],
  tangent: THREE.Vector3
): { tip: THREE.Vector3; shaftPoints: THREE.Vector3[] } {
  const tip = pathPoints[pathPoints.length - 1].clone();
  const headBase = tip.clone().sub(tangent.clone().multiplyScalar(HEAD_LENGTH));
  const shaftPoints = pathPoints.slice();
  shaftPoints[shaftPoints.length - 1] = headBase;
  return { tip, shaftPoints };
}

function buildFlatShaftGeometry(points: THREE.Vector3[], halfWidth: number): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = p1.x - p0.x;
    const dz = p1.z - p0.z;
    const len = Math.hypot(dx, dz) || 1;
    const px = (-dz / len) * halfWidth;
    const pz = (dx / len) * halfWidth;
    const base = vertices.length / 3;

    vertices.push(
      p0.x + px, p0.y, p0.z + pz,
      p0.x - px, p0.y, p0.z - pz,
      p1.x + px, p1.y, p1.z + pz,
      p1.x - px, p1.y, p1.z - pz
    );

    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildRibbonShaftGeometry(points: THREE.Vector3[], halfWidth: number): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const tangent = p1.clone().sub(p0);
    if (tangent.lengthSq() < 1e-6) {
      continue;
    }
    tangent.normalize();
    const side = getRibbonSide(tangent, halfWidth);
    const base = vertices.length / 3;

    vertices.push(
      p0.x + side.x, p0.y + side.y, p0.z + side.z,
      p0.x - side.x, p0.y - side.y, p0.z - side.z,
      p1.x + side.x, p1.y + side.y, p1.z + side.z,
      p1.x - side.x, p1.y - side.y, p1.z - side.z
    );

    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createArrowhead(
  tip: THREE.Vector3,
  tangent: THREE.Vector3,
  material: THREE.MeshBasicMaterial
): THREE.Mesh {
  const direction = tangent.clone().normalize();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      [
        -HEAD_HALF_WIDTH, 0, 0,
        HEAD_HALF_WIDTH, 0, 0,
        0, 0, HEAD_LENGTH,
      ],
      3
    )
  );

  const arrowhead = new THREE.Mesh(geometry, material);
  const headBase = tip.clone().sub(direction.clone().multiplyScalar(HEAD_LENGTH));
  arrowhead.position.copy(headBase);
  arrowhead.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
  arrowhead.renderOrder = 2;
  return arrowhead;
}

function createArrowMaterial(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: ARROW_COLOR,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}

function addArrowParts(
  curveGroup: THREE.Group,
  number: number,
  shaft: THREE.Mesh,
  arrowhead: THREE.Mesh,
  labelPosition: THREE.Vector3
): THREE.Group {
  const sprite = createTextSprite(String(number), '#FFFFFF', ARROW_LABEL_SIZE, {
    transparentBackground: true,
  });
  sprite.position.copy(labelPosition);
  sprite.renderOrder = 3;

  curveGroup.userData = {
    number,
    sprite,
    shaft,
    arrowhead,
  } satisfies ArrowUserData;

  curveGroup.add(shaft);
  curveGroup.add(arrowhead);
  curveGroup.add(sprite);

  return curveGroup;
}

function createStraightArrow(
  start: THREE.Vector3,
  end: THREE.Vector3,
  number: number
): THREE.Group {
  const curveGroup = new THREE.Group();
  curveGroup.name = `Arrow_${number}`;
  curveGroup.userData = { number };

  const curveStart = start.clone();
  const curveEnd = end.clone();
  curveStart.setY(ARROW_Y);
  curveEnd.setY(ARROW_Y);

  const pathPoints = [curveStart, curveEnd];
  const fallbackTangent = curveEnd.clone().sub(curveStart);
  const tangent = getPathEndTangent(pathPoints, fallbackTangent);
  const { tip, shaftPoints } = truncatePathForHead(pathPoints, tangent);

  const material = createArrowMaterial();
  const shaft = new THREE.Mesh(buildFlatShaftGeometry(shaftPoints, SHAFT_HALF_WIDTH), material);
  shaft.renderOrder = 1;
  const arrowhead = createArrowhead(tip, tangent, material.clone());

  const labelPosition = new THREE.Vector3(curveStart.x, ARROW_Y + 0.04, curveStart.z);
  return addArrowParts(curveGroup, number, shaft, arrowhead, labelPosition);
}

function createCurvedArrow(
  start: THREE.Vector3,
  end: THREE.Vector3,
  length: number,
  number: number
): THREE.Group {
  const curveGroup = new THREE.Group();
  curveGroup.name = `Arrow_${number}`;
  curveGroup.userData = { number };

  const curveStart = start.clone();
  const curveEnd = end.clone();
  const controlPoint = start.clone().add(end).multiplyScalar(0.5);

  curveStart.setY(ARROW_Y);
  curveEnd.setY(ARROW_Y);
  controlPoint.setY(ARROW_Y);
  controlPoint.y += length * CURVE_STRENGTH * 1.5;

  const curve = new THREE.QuadraticBezierCurve3(curveStart, controlPoint, curveEnd);
  const pathPoints = curve.getPoints(48);
  const fallbackTangent = curve.getTangent(1);
  const tangent = getPathEndTangent(pathPoints, fallbackTangent);
  const { tip, shaftPoints } = truncatePathForHead(pathPoints, tangent);

  const material = createArrowMaterial();
  const shaft = new THREE.Mesh(buildRibbonShaftGeometry(shaftPoints, SHAFT_HALF_WIDTH), material);
  shaft.renderOrder = 1;
  const arrowhead = createArrowhead(tip, tangent, material.clone());

  const labelPosition = pathPoints[0].clone().add(new THREE.Vector3(0, 0.04, 0));
  return addArrowParts(curveGroup, number, shaft, arrowhead, labelPosition);
}

export function createArrow(
  start: THREE.Vector3,
  end: THREE.Vector3,
  curveType: CurveType,
  number: number
): CreateArrowResult {
  const length = end.clone().sub(start).length();

  if (length < MIN_ARROW_LENGTH) {
    return {
      error: `Freccia troppo corta (${length.toFixed(2)}m). Prova a trascinare di più.`,
    };
  }

  const group =
    curveType === 'curve_up'
      ? createCurvedArrow(start, end, length, number)
      : createStraightArrow(start, end, number);

  return { group };
}

export function updateArrowNumber(arrow: THREE.Group, number: number): void {
  const userData = arrow.userData as ArrowUserData;
  userData.number = number;
  arrow.name = `Arrow_${number}`;

  if (!userData.sprite) {
    return;
  }

  const position = userData.sprite.position.clone();
  disposeSprite(userData.sprite);
  arrow.remove(userData.sprite);

  const sprite = createTextSprite(String(number), '#FFFFFF', ARROW_LABEL_SIZE, {
    transparentBackground: true,
  });
  sprite.position.copy(position);
  sprite.renderOrder = 3;
  userData.sprite = sprite;
  arrow.add(sprite);
}

export function renumberArrows(arrows: THREE.Group[]): void {
  const sorted = [...arrows].sort((left, right) => {
    const leftNumber = (left.userData as ArrowUserData).number;
    const rightNumber = (right.userData as ArrowUserData).number;
    return leftNumber - rightNumber;
  });

  sorted.forEach((arrow, index) => {
    const nextNumber = index + 1;
    const currentNumber = (arrow.userData as ArrowUserData).number;
    if (currentNumber !== nextNumber) {
      updateArrowNumber(arrow, nextNumber);
    }
  });
}

export function disposeArrow(arrow: THREE.Group): void {
  const userData = arrow.userData as ArrowUserData;

  if (userData.sprite) {
    disposeSprite(userData.sprite);
  }

  if (userData.shaft) {
    userData.shaft.geometry.dispose();
    const shaftMaterial = userData.shaft.material;
    if (Array.isArray(shaftMaterial)) {
      shaftMaterial.forEach((entry) => entry.dispose());
    } else {
      shaftMaterial.dispose();
    }
  }

  if (userData.arrowhead) {
    userData.arrowhead.geometry.dispose();
    const material = userData.arrowhead.material;
    if (Array.isArray(material)) {
      material.forEach((entry) => entry.dispose());
    } else {
      material.dispose();
    }
  }
}
