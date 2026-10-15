// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 Fabio Bellintani

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Minus, PenLine, Plus, Trash2, X } from 'lucide-react';
import type * as THREE from 'three';
import { createArrow, disposeArrow, renumberArrows, type CurveType } from '../tactical-court/arrows';
import {
  PLAYER_BUTTON_COLORS,
  PLAYER_TYPE_LIST,
  type PlayerType,
} from '../tactical-court/constants';
import { captureRendererAsFile } from '../tactical-court/exportImage';
import {
  exportTacticalScene,
  importTacticalScene,
  pointFromVector,
  type ArrowTacticalMeta,
  type TacticalSceneData,
} from '../tactical-court/sceneState';
import {
  createPlayer,
  disposePlayer,
  getDraggableObjects,
  getPlayerUserData,
} from '../tactical-court/players';
import {
  applyCameraZoom,
  CAMERA_ZOOM_STEP,
  createSceneApp,
  DEFAULT_CAMERA_ZOOM,
  disposeSceneApp,
  getCourtIntersection,
  MAX_CAMERA_ZOOM,
  MIN_CAMERA_ZOOM,
  resizeScene,
  updatePointerFromEvent,
  type SceneApp,
} from '../tactical-court/scene';
import { THEME_CLASSES } from '../theme/constants';

export interface ExerciseImageCreatorModalProps {
  exerciseTitle: string;
  initialScene?: TacticalSceneData | null;
  onConfirm: (file: File, sceneData: TacticalSceneData) => void;
  onClose: () => void;
}

interface PlayerEntry {
  id: string;
  type: PlayerType;
}

interface ArrowEntry {
  id: string;
  number: number;
}

interface StatusMessage {
  text: string;
  tone: 'info' | 'success' | 'warning' | 'error';
}

const STATUS_TONE_CLASSES: Record<StatusMessage['tone'], string> = {
  info: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  error: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

export function ExerciseImageCreatorModal({
  exerciseTitle,
  initialScene = null,
  onConfirm,
  onClose,
}: ExerciseImageCreatorModalProps) {
  const isEditing = Boolean(initialScene);
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<SceneApp | null>(null);
  const playersRef = useRef<THREE.Group[]>([]);
  const arrowsRef = useRef<THREE.Group[]>([]);
  const activePlayerRef = useRef<THREE.Object3D | null>(null);
  const isDraggingCourtRef = useRef(false);
  const dragStartPointRef = useRef<THREE.Vector3 | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isRemovingModeRef = useRef(false);
  const curveTypeRef = useRef<CurveType>('straight');
  const zoomLevelRef = useRef(DEFAULT_CAMERA_ZOOM);

  const [playerEntries, setPlayerEntries] = useState<PlayerEntry[]>([]);
  const [arrowEntries, setArrowEntries] = useState<ArrowEntry[]>([]);
  const [isRemovingMode, setIsRemovingMode] = useState(false);
  const [curveType, setCurveType] = useState<CurveType>('straight');
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_CAMERA_ZOOM);
  const [status, setStatus] = useState<StatusMessage>({
    text: 'Aggiungi giocatori e trascina sul campo per disegnare le traiettorie.',
    tone: 'info',
  });
  const [exporting, setExporting] = useState(false);

  const showStatus = useCallback((text: string, tone: StatusMessage['tone']) => {
    setStatus({ text, tone });
  }, []);

  const syncPlayerEntries = useCallback(() => {
    setPlayerEntries(
      playersRef.current.map((player) => {
        const userData = getPlayerUserData(player);
        return {
          id: player.uuid,
          type: userData.type,
        };
      })
    );
  }, []);

  const syncArrowEntries = useCallback(() => {
    setArrowEntries(
      [...arrowsRef.current]
        .sort(
          (left, right) =>
            (left.userData as { number: number }).number -
            (right.userData as { number: number }).number
        )
        .map((arrow) => ({
          id: arrow.uuid,
          number: (arrow.userData as { number: number }).number,
        }))
    );
  }, []);

  const removePlayerByUuid = useCallback(
    (uuid: string) => {
      const app = appRef.current;
      if (!app) return;

      const player = playersRef.current.find((entry) => entry.uuid === uuid);
      if (!player) return;

      app.scene.remove(player);
      disposePlayer(player);
      playersRef.current = playersRef.current.filter((entry) => entry.uuid !== uuid);
      syncPlayerEntries();
      showStatus('Giocatore rimosso.', 'success');
    },
    [showStatus, syncPlayerEntries]
  );

  const removeAllArrows = useCallback(() => {
    const app = appRef.current;
    if (!app) return;

    arrowsRef.current.forEach((arrow) => {
      app.scene.remove(arrow);
      disposeArrow(arrow);
    });

    arrowsRef.current = [];
    syncArrowEntries();
    showStatus('Tutte le frecce rimosse.', 'success');
  }, [showStatus, syncArrowEntries]);

  const deleteArrowByNumber = useCallback(
    (numberToDelete: number) => {
      const app = appRef.current;
      if (!app) return;

      const arrowIndex = arrowsRef.current.findIndex(
        (arrow) => (arrow.userData as { number: number }).number === numberToDelete
      );

      if (arrowIndex === -1) {
        showStatus(`Freccia con numero ${numberToDelete} non trovata.`, 'warning');
        return;
      }

      const [arrowToRemove] = arrowsRef.current.splice(arrowIndex, 1);
      app.scene.remove(arrowToRemove);
      disposeArrow(arrowToRemove);
      renumberArrows(arrowsRef.current);

      syncArrowEntries();
      showStatus(`Freccia #${numberToDelete} eliminata.`, 'success');
    },
    [showStatus, syncArrowEntries]
  );

  const addPlayer = useCallback(
    (type: PlayerType) => {
      const app = appRef.current;
      if (!app) return;

      const player = createPlayer(type);
      app.scene.add(player);
      playersRef.current.push(player);
      syncPlayerEntries();
      showStatus(`Giocatore ${type} aggiunto.`, 'success');
    },
    [showStatus, syncPlayerEntries]
  );

  const adjustZoom = useCallback(
    (direction: 'in' | 'out') => {
      const app = appRef.current;
      if (!app) return;

      const delta = direction === 'in' ? CAMERA_ZOOM_STEP : -CAMERA_ZOOM_STEP;
      const next = applyCameraZoom(app.camera, zoomLevelRef.current + delta);
      zoomLevelRef.current = next;
      setZoomLevel(next);
    },
    []
  );

  const toggleRemoveMode = useCallback(() => {
    const app = appRef.current;
    if (!app) return;

    const next = !isRemovingModeRef.current;
    isRemovingModeRef.current = next;
    setIsRemovingMode(next);
    app.renderer.domElement.style.cursor = next ? 'crosshair' : 'auto';

    if (next) {
      showStatus('Modalità rimozione attiva: clicca su un giocatore per rimuoverlo.', 'warning');
      return;
    }

    showStatus('Modalità rimozione disattivata.', 'info');
  }, [showStatus]);

  useEffect(() => {
    isRemovingModeRef.current = isRemovingMode;
  }, [isRemovingMode]);

  useEffect(() => {
    curveTypeRef.current = curveType;
  }, [curveType]);

  useEffect(() => {
    const container = sceneContainerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const app = createSceneApp(container, width, height);
    appRef.current = app;

    if (initialScene) {
      const restoredZoom = importTacticalScene(
        app,
        initialScene,
        playersRef.current,
        arrowsRef.current
      );
      zoomLevelRef.current = restoredZoom;
      setZoomLevel(restoredZoom);
      syncPlayerEntries();
      syncArrowEntries();
    }

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      app.renderer.render(app.scene, app.camera);
    };

    render();

    const resizeObserver = new ResizeObserver(() => {
      const nextWidth = container.clientWidth;
      const nextHeight = container.clientHeight;
      if (nextWidth > 0 && nextHeight > 0) {
        resizeScene(app.camera, app.renderer, nextWidth, nextHeight);
      }
    });

    resizeObserver.observe(container);

    const onPointerDown = (event: PointerEvent) => {
      updatePointerFromEvent(app.mouse, event, app.renderer.domElement);

      if (isRemovingModeRef.current) {
        app.raycaster.setFromCamera(app.mouse, app.camera);
        const draggableObjects = getDraggableObjects(playersRef.current);
        const intersects = app.raycaster.intersectObjects(draggableObjects, false);

        if (intersects.length > 0) {
          const parent = intersects[0].object.parent;
          if (parent) {
            removePlayerByUuid(parent.uuid);
          }
        }
        return;
      }

      const intersectionPoint = getCourtIntersection(app, event, app.renderer.domElement);

      app.raycaster.setFromCamera(app.mouse, app.camera);
      const draggableObjects = getDraggableObjects(playersRef.current);
      const playerIntersects = app.raycaster.intersectObjects(draggableObjects, false);

      if (playerIntersects.length > 0) {
        activePlayerRef.current = playerIntersects[0].object.parent;
        app.renderer.domElement.style.cursor = 'grabbing';
        return;
      }

      if (intersectionPoint) {
        isDraggingCourtRef.current = true;
        dragStartPointRef.current = intersectionPoint.clone();
        app.renderer.domElement.style.cursor = 'crosshair';
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      updatePointerFromEvent(app.mouse, event, app.renderer.domElement);

      if (activePlayerRef.current) {
        const intersectionPoint = getCourtIntersection(app, event, app.renderer.domElement);

        if (intersectionPoint) {
          activePlayerRef.current.position.x = intersectionPoint.x;
          activePlayerRef.current.position.z = intersectionPoint.z;
        }
        return;
      }

      if (isRemovingModeRef.current) {
        return;
      }

      app.raycaster.setFromCamera(app.mouse, app.camera);
      const draggableObjects = getDraggableObjects(playersRef.current);
      const intersects = app.raycaster.intersectObjects(draggableObjects, false);

      if (intersects.length > 0) {
        app.renderer.domElement.style.cursor = 'grab';
      } else if (!isDraggingCourtRef.current) {
        app.renderer.domElement.style.cursor = 'auto';
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (activePlayerRef.current) {
        activePlayerRef.current = null;
        app.renderer.domElement.style.cursor = 'auto';
        return;
      }

      if (!isDraggingCourtRef.current) {
        return;
      }

      isDraggingCourtRef.current = false;
      app.renderer.domElement.style.cursor = 'auto';

      const endPoint = getCourtIntersection(app, event, app.renderer.domElement);

      if (endPoint && dragStartPointRef.current) {
        const nextArrowNumber = arrowsRef.current.length + 1;
        const result = createArrow(
          dragStartPointRef.current,
          endPoint,
          curveTypeRef.current,
          nextArrowNumber
        );

        if (result.error) {
          showStatus(result.error, 'warning');
        } else if (result.group) {
          result.group.userData.tactical = {
            start: pointFromVector(dragStartPointRef.current),
            end: pointFromVector(endPoint),
            curveType: curveTypeRef.current,
          } satisfies ArrowTacticalMeta;
          arrowsRef.current.push(result.group);
          app.scene.add(result.group);
          syncArrowEntries();
          showStatus(
            `Freccia #${nextArrowNumber} tracciata (${curveTypeRef.current === 'curve_up' ? 'curva' : 'dritta'}).`,
            'success'
          );
        }
      }

      dragStartPointRef.current = null;
    };

    app.renderer.domElement.addEventListener('pointerdown', onPointerDown);
    app.renderer.domElement.addEventListener('pointermove', onPointerMove);
    app.renderer.domElement.addEventListener('pointerup', onPointerUp);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      app.renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      app.renderer.domElement.removeEventListener('pointermove', onPointerMove);
      app.renderer.domElement.removeEventListener('pointerup', onPointerUp);
      resizeObserver.disconnect();

      arrowsRef.current.forEach((arrow) => disposeArrow(arrow));
      playersRef.current.forEach((player) => disposePlayer(player));
      disposeSceneApp(app, container);
      appRef.current = null;
    };
  }, [initialScene, removePlayerByUuid, showStatus, syncArrowEntries, syncPlayerEntries]);

  const handleExport = async () => {
    const app = appRef.current;
    if (!app || exporting) return;

    setExporting(true);
    try {
      app.renderer.render(app.scene, app.camera);
      const safeName = exerciseTitle.trim().replace(/\s+/g, '-').toLowerCase() || 'esercizio';
      const file = await captureRendererAsFile(app.renderer, `${safeName}-campo.png`);
      const sceneData = exportTacticalScene(
        playersRef.current,
        arrowsRef.current,
        zoomLevelRef.current
      );
      onConfirm(file, sceneData);
      onClose();
    } catch (err) {
      showStatus(err instanceof Error ? err.message : 'Esportazione non riuscita', 'error');
    } finally {
      setExporting(false);
    }
  };

  const inputClass = `${THEME_CLASSES.input} text-sm rounded-lg px-3 py-2 w-full`;
  const labelClass = 'text-xs font-semibold text-theme-muted-text block mb-1';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-theme-overlay/80 backdrop-blur-sm">
      <div
        className={`${THEME_CLASSES.card} border-theme-border rounded-2xl shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border shrink-0">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-theme-heading">
                {isEditing ? 'Modifica immagine tattica' : 'Crea immagine tattica'}
              </h2>
              {exerciseTitle.trim() && (
                <p className="text-xs text-theme-muted-text mt-0.5">{exerciseTitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-theme-muted-hover rounded-lg text-theme-muted-text hover:text-theme-heading"
            aria-label="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          <aside className="w-64 shrink-0 border-r border-theme-border overflow-y-auto p-4 space-y-4 bg-theme-elevated/50">
            <div className={`rounded-xl border px-3 py-2 text-xs ${STATUS_TONE_CLASSES[status.tone]}`}>
              {status.text}
            </div>

            <div>
              <h3 className={labelClass}>Giocatori</h3>
              <div className="grid grid-cols-3 gap-2">
                {PLAYER_TYPE_LIST.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addPlayer(type)}
                    className={`py-2 rounded-xl text-white text-xs font-bold shadow transition ${PLAYER_BUTTON_COLORS[type]}`}
                  >
                    {type}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={toggleRemoveMode}
                  className={`py-2 rounded-xl text-white text-xs font-bold shadow transition ${
                    isRemovingMode
                      ? 'bg-rose-500 hover:bg-rose-400'
                      : 'bg-theme-muted hover:bg-theme-muted-hover text-theme-secondary'
                  }`}
                >
                  {isRemovingMode ? 'Rimozione ON' : 'Rimuovi'}
                </button>
              </div>
            </div>

            <div className="border-t border-theme-border pt-4">
              <h3 className={labelClass}>Traiettorie</h3>
              <label className={labelClass} htmlFor="curve-type">
                Tipo di freccia
              </label>
              <select
                id="curve-type"
                value={curveType}
                onChange={(event) => setCurveType(event.target.value as CurveType)}
                className={inputClass}
              >
                <option value="straight">Dritta</option>
                <option value="curve_up">Curva in alto</option>
              </select>
              <p className="text-[10px] text-theme-subtle mt-2">
                Clicca e trascina sul campo per disegnare la freccia.
              </p>

              <button
                type="button"
                onClick={removeAllArrows}
                className="mt-3 w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition"
              >
                Rimuovi tutte le frecce
              </button>

              <div className="mt-3">
                <p className="text-[10px] font-semibold text-theme-muted-text mb-1">Frecce attive</p>
                <div className="max-h-32 overflow-y-auto rounded-xl border border-theme-border bg-theme-input p-2 space-y-1">
                  {arrowEntries.length === 0 ? (
                    <p className="text-[10px] italic text-theme-subtle">Nessuna freccia tracciata.</p>
                  ) : (
                    arrowEntries.map((arrow) => (
                      <div
                        key={arrow.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 hover:bg-theme-muted/40"
                      >
                        <span className="text-[10px] font-mono text-theme-secondary">
                          → Freccia N° {arrow.number}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteArrowByNumber(arrow.number)}
                          className="p-1 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10"
                          aria-label={`Elimina freccia ${arrow.number}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-theme-border pt-4">
              <h3 className={labelClass}>Giocatori attivi</h3>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {playerEntries.length === 0 ? (
                  <p className="text-[10px] italic text-theme-subtle">Nessun giocatore aggiunto.</p>
                ) : (
                  playerEntries.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-theme-border bg-theme-card px-2 py-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-3 h-3 rounded-full shrink-0 ${PLAYER_BUTTON_COLORS[player.type].split(' ')[0]}`}
                        />
                        <span className="text-xs text-theme-secondary truncate">
                          {index + 1} ({player.type})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePlayerByUuid(player.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10"
                        aria-label={`Rimuovi giocatore ${index + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0 relative">
            <div ref={sceneContainerRef} className="absolute inset-0 bg-[#dce6f0]" />
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 rounded-xl border border-theme-border bg-theme-card/95 p-1 shadow-lg backdrop-blur-sm">
              <button
                type="button"
                onClick={() => adjustZoom('in')}
                disabled={zoomLevel >= MAX_CAMERA_ZOOM}
                className="p-2 rounded-lg text-theme-secondary hover:bg-theme-muted-hover hover:text-theme-heading disabled:opacity-40 disabled:pointer-events-none transition"
                aria-label="Zoom avanti"
                title="Zoom +"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono text-center text-theme-muted-text py-0.5">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => adjustZoom('out')}
                disabled={zoomLevel <= MIN_CAMERA_ZOOM}
                className="p-2 rounded-lg text-theme-secondary hover:bg-theme-muted-hover hover:text-theme-heading disabled:opacity-40 disabled:pointer-events-none transition"
                aria-label="Zoom indietro"
                title="Zoom -"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-5 py-4 border-t border-theme-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-theme-muted hover:bg-theme-muted-hover text-theme-secondary text-sm font-bold rounded-xl transition"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition inline-flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {exporting ? 'Esportazione...' : 'Usa immagine'}
          </button>
        </div>
      </div>
    </div>
  );
}
