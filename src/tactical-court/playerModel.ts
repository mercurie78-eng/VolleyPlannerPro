import * as THREE from 'three';

export const BODY_HEIGHT = 1.0;
export const BODY_RADIUS = 0.25;
export const HEAD_RADIUS = 0.35;

export function buildPlayerFigure(color: number): THREE.Group {
  const figure = new THREE.Group();
  figure.name = 'Figure';

  const material = new THREE.MeshPhongMaterial({ color });

  const bodyGeometry = new THREE.CylinderGeometry(BODY_RADIUS, BODY_RADIUS, BODY_HEIGHT, 16);
  const body = new THREE.Mesh(bodyGeometry, material);
  body.position.y = BODY_HEIGHT / 2;
  body.castShadow = true;
  body.name = 'Body';

  const headGeometry = new THREE.SphereGeometry(HEAD_RADIUS, 32, 16);
  const head = new THREE.Mesh(headGeometry, material);
  head.position.y = BODY_HEIGHT + HEAD_RADIUS / 2;
  head.castShadow = true;
  head.name = 'Head';

  figure.add(body);
  figure.add(head);

  return figure;
}

export function disposeFigure(figure: THREE.Group): void {
  figure.traverse((child) => {
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
