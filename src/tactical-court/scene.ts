import * as THREE from 'three';
import { ATTACK_ZONE, COURT_LENGTH, COURT_WIDTH, NET_HEIGHT } from './constants';

export const CAMERA_LOOK_AT = new THREE.Vector3(0, 0, 0);
export const DEFAULT_CAMERA_ZOOM = 1;
export const MIN_CAMERA_ZOOM = 0.55;
export const MAX_CAMERA_ZOOM = 2.2;
export const CAMERA_ZOOM_STEP = 0.15;

const BASE_CAMERA_OFFSET = new THREE.Vector3(0, 8.8, COURT_LENGTH * 0.72);

export interface SceneApp {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
}

export function createSceneApp(sceneContainer: HTMLElement, width: number, height: number): SceneApp {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdce6f0);

  const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 1000);
  applyCameraZoom(camera, DEFAULT_CAMERA_ZOOM);

  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  sceneContainer.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.82);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0xf8fbff, 0xb8c6d8, 0.45);
  scene.add(hemiLight);

  const directionalLight = new THREE.DirectionalLight(0xfff8f0, 0.72);
  directionalLight.position.set(8, 18, 12);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  scene.add(directionalLight);

  createCourt(scene);
  createNet(scene);

  return {
    scene,
    camera,
    renderer,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
  };
}

export function resizeScene(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  width: number,
  height: number
): void {
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

export function applyCameraZoom(camera: THREE.PerspectiveCamera, zoomLevel: number): number {
  const clamped = Math.min(MAX_CAMERA_ZOOM, Math.max(MIN_CAMERA_ZOOM, zoomLevel));
  const offset = BASE_CAMERA_OFFSET.clone().sub(CAMERA_LOOK_AT).multiplyScalar(1 / clamped);
  camera.position.copy(CAMERA_LOOK_AT).add(offset);
  camera.lookAt(CAMERA_LOOK_AT);
  camera.updateProjectionMatrix();
  return clamped;
}

export function updatePointerFromEvent(
  mouse: THREE.Vector2,
  event: PointerEvent,
  domElement: HTMLElement
): void {
  const rect = domElement.getBoundingClientRect();

  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

export function getCourtIntersection(
  app: SceneApp,
  event: PointerEvent,
  domElement: HTMLElement
): THREE.Vector3 | null {
  updatePointerFromEvent(app.mouse, event, domElement);
  app.raycaster.setFromCamera(app.mouse, app.camera);

  const intersects = app.raycaster.intersectObjects(getCourtMeshes(app.scene), false);
  return intersects[0]?.point ?? null;
}

function createCourt(scene: THREE.Scene): void {
  const courtGroup = new THREE.Group();
  const courtMaterialBack = new THREE.MeshLambertMaterial({ color: 0x5f7f96 });
  const courtMaterialFront = new THREE.MeshLambertMaterial({ color: 0x7fa0b5 });

  const geometryFront1 = new THREE.PlaneGeometry(COURT_WIDTH, ATTACK_ZONE);
  const meshFront1 = new THREE.Mesh(geometryFront1, courtMaterialFront);
  meshFront1.rotation.x = -Math.PI / 2;
  meshFront1.position.set(0, 0.01, ATTACK_ZONE / 2);
  meshFront1.receiveShadow = true;
  courtGroup.add(meshFront1);

  const geometryBack1 = new THREE.PlaneGeometry(COURT_WIDTH, COURT_LENGTH / 2 - ATTACK_ZONE);
  const meshBack1 = new THREE.Mesh(geometryBack1, courtMaterialBack);
  meshBack1.rotation.x = -Math.PI / 2;
  meshBack1.position.set(0, 0.01, ATTACK_ZONE + (COURT_LENGTH / 2 - ATTACK_ZONE) / 2);
  meshBack1.receiveShadow = true;
  courtGroup.add(meshBack1);

  const geometryFront2 = new THREE.PlaneGeometry(COURT_WIDTH, ATTACK_ZONE);
  const meshFront2 = new THREE.Mesh(geometryFront2, courtMaterialFront);
  meshFront2.rotation.x = -Math.PI / 2;
  meshFront2.position.set(0, 0.01, -ATTACK_ZONE / 2);
  meshFront2.receiveShadow = true;
  courtGroup.add(meshFront2);

  const geometryBack2 = new THREE.PlaneGeometry(COURT_WIDTH, COURT_LENGTH / 2 - ATTACK_ZONE);
  const meshBack2 = new THREE.Mesh(geometryBack2, courtMaterialBack);
  meshBack2.rotation.x = -Math.PI / 2;
  meshBack2.position.set(0, 0.01, -(ATTACK_ZONE + (COURT_LENGTH / 2 - ATTACK_ZONE) / 2));
  meshBack2.receiveShadow = true;
  courtGroup.add(meshBack2);

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xf8fafc, linewidth: 3 });

  addLine(courtGroup, 0, -COURT_WIDTH / 2, 0.02, 0, COURT_WIDTH / 2, 0.02, lineMaterial);
  addLine(courtGroup, COURT_LENGTH / 2, -COURT_WIDTH / 2, 0.02, -COURT_LENGTH / 2, -COURT_WIDTH / 2, 0.02, lineMaterial);
  addLine(courtGroup, COURT_LENGTH / 2, COURT_WIDTH / 2, 0.02, -COURT_LENGTH / 2, COURT_WIDTH / 2, 0.02, lineMaterial);
  addLine(courtGroup, COURT_LENGTH / 2, -COURT_WIDTH / 2, 0.02, COURT_LENGTH / 2, COURT_WIDTH / 2, 0.02, lineMaterial);
  addLine(courtGroup, -COURT_LENGTH / 2, -COURT_WIDTH / 2, 0.02, -COURT_LENGTH / 2, COURT_WIDTH / 2, 0.02, lineMaterial);
  addLine(courtGroup, ATTACK_ZONE, -COURT_WIDTH / 2, 0.02, ATTACK_ZONE, COURT_WIDTH / 2, 0.02, lineMaterial);
  addLine(courtGroup, -ATTACK_ZONE, -COURT_WIDTH / 2, 0.02, -ATTACK_ZONE, COURT_WIDTH / 2, 0.02, lineMaterial);

  courtGroup.rotation.y = Math.PI / 2;
  courtGroup.name = 'Court';
  scene.add(courtGroup);
}

function addLine(
  group: THREE.Group,
  z1: number,
  x1: number,
  y: number,
  z2: number,
  x2: number,
  y2: number,
  material: THREE.LineBasicMaterial
): void {
  const points = [new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y2, z2)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geometry, material);
  group.add(line);
}

function createNet(scene: THREE.Scene): void {
  const netGroup = new THREE.Group();

  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, NET_HEIGHT + 0.5, 32);
  const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

  const pole1 = new THREE.Mesh(poleGeometry, poleMaterial);
  pole1.position.set(COURT_WIDTH / 2, (NET_HEIGHT + 0.5) / 2, 0);
  pole1.castShadow = true;
  netGroup.add(pole1);

  const pole2 = new THREE.Mesh(poleGeometry, poleMaterial);
  pole2.position.set(-COURT_WIDTH / 2, (NET_HEIGHT + 0.5) / 2, 0);
  pole2.castShadow = true;
  netGroup.add(pole2);

  const netGeometry = new THREE.PlaneGeometry(COURT_WIDTH, NET_HEIGHT);
  const netMaterial = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });

  const netMesh = new THREE.Mesh(netGeometry, netMaterial);
  netMesh.position.set(0, NET_HEIGHT / 2, 0);
  netGroup.add(netMesh);

  netGroup.rotation.y = Math.PI / 2;
  netGroup.name = 'Net';
  scene.add(netGroup);
}

function getCourtMeshes(scene: THREE.Scene): THREE.Mesh[] {
  const court = scene.getObjectByName('Court');
  if (!court) {
    return [];
  }

  return court.children.filter((child): child is THREE.Mesh => child.type === 'Mesh');
}

export function disposeSceneApp(app: SceneApp, container: HTMLElement): void {
  container.removeChild(app.renderer.domElement);
  app.renderer.dispose();
}
