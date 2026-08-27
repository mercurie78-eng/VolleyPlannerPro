import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AppHeader } from './components/AppHeader';
import { AttendanceTab } from './components/tabs/AttendanceTab';
import { BuilderTab } from './components/tabs/BuilderTab';
import { SavedTab } from './components/tabs/SavedTab';
import { DatabaseTab } from './components/tabs/DatabaseTab';
import { PrintTab } from './components/tabs/PrintTab';
import { DEFAULT_SESSION_TARGET_MINUTES, isAnalyticCategory } from './data/constants';
import { buildPresetK1, buildPresetK2 } from './data/presets';
import { useExercises } from './hooks/useExercises';
import { usePlayers } from './hooks/usePlayers';
import { useAttendance } from './hooks/useAttendance';
import { useSavedSessions } from './hooks/useSavedSessions';
import {
  cloneSession,
  computeSessionTotals,
  convertSessionExerciseToParallelBlock,
  isParallelBlock,
  isSessionExercise,
  moveSessionItem,
  suggestExerciseRole,
  toParallelBlock,
  toSessionExercise,
  updateSessionAtIndex,
  withFreshSessionIds,
} from './utils/session';
import { findSavedSessionByIdentity, normalizeSessionTitle, duplicateSavedSession } from './utils/savedSession';
import type { Exercise, ParallelStation, SavedSession, SessionItem, TabId } from './types';
import type { SaveExerciseOptions } from './api/exercises';
import { THEME_CLASSES } from './theme/constants';

export default function App() {
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saveToast, setSaveToast] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('builder');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionFocus, setSessionFocus] = useState('');
  const [sessionTargetMinutes, setSessionTargetMinutes] = useState(DEFAULT_SESSION_TARGET_MINUTES);

  const { exercises, loading: exercisesLoading, error: exercisesError, saveExercise, deleteExercise, reload: reloadExercises } = useExercises();
  const { savedSessions, loading: sessionsLoading, error: sessionsError, saveSession, updateSession, deleteSession, reload: reloadSessions } = useSavedSessions();
  const { players, loading: playersLoading, error: playersError, savePlayer, deletePlayer, reload: reloadPlayers } = usePlayers();
  const {
    attendance,
    loading: attendanceLoading,
    saving: attendanceSaving,
    error: attendanceError,
    loadAttendance,
    saveAttendance,
    clearAttendance,
  } = useAttendance();
  const [session, setSession] = useState<SessionItem[]>([]);
  const [loadedSavedSessionId, setLoadedSavedSessionId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
  const [selectedExerciseType, setSelectedExerciseType] = useState('Tutti');
  const [selectedRole, setSelectedRole] = useState('Tutti');
  const [searchQuery, setSearchQuery] = useState('');

  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const { totalMinutes, totalJumps } = useMemo(() => computeSessionTotals(session), [session]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchCategory = selectedCategory === 'Tutti' || ex.category === selectedCategory;
      const matchExerciseType =
        selectedExerciseType === 'Tutti' ||
        !isAnalyticCategory(ex.category) ||
        ex.exerciseType === selectedExerciseType;
      const matchRole =
        selectedRole === 'Tutti' ||
        ex.targetRoles.includes('Tutti') ||
        ex.targetRoles.includes(selectedRole);
      const matchSearch =
        !normalizedSearch ||
        ex.title.toLowerCase().includes(normalizedSearch) ||
        ex.description.toLowerCase().includes(normalizedSearch);
      return matchCategory && matchExerciseType && matchRole && matchSearch;
    });
  }, [exercises, selectedCategory, selectedExerciseType, selectedRole, normalizedSearch]);

  const highlightedSessionDates = useMemo(
    () => new Set(savedSessions.map((session) => session.date)),
    [savedSessions]
  );

  const showSaveToast = useCallback(() => {
    setSaveToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setSaveToast(false), 3000);
  }, []);

  const handleSaveCurrentSession = useCallback(async () => {
    const title = normalizeSessionTitle(sessionTitle);
    const payload: SavedSession = {
      id: `saved-${Date.now()}`,
      date: sessionDate,
      title,
      focus: sessionFocus || 'Nessun focus specificato',
      targetMinutes: sessionTargetMinutes,
      totalMinutes,
      totalJumps,
      items: cloneSession(session),
    };

    const existing = findSavedSessionByIdentity(
      savedSessions,
      title,
      sessionDate,
      loadedSavedSessionId
    );

    if (existing) {
      const overwrite = window.confirm(
        `Esiste già un allenamento "${title}" del ${sessionDate}.\n\nVuoi sovrascrivere il salvataggio precedente?`
      );
      if (!overwrite) return;

      await updateSession({ ...payload, id: existing.id });
      setLoadedSavedSessionId(existing.id);
      showSaveToast();
      return;
    }

    const saved = await saveSession(payload);
    setLoadedSavedSessionId(saved.id);
    showSaveToast();
  }, [
    sessionDate,
    sessionTitle,
    sessionFocus,
    sessionTargetMinutes,
    totalMinutes,
    totalJumps,
    session,
    savedSessions,
    loadedSavedSessionId,
    saveSession,
    updateSession,
    showSaveToast,
  ]);

  const handleLoadSession = useCallback((savedItem: SavedSession) => {
    setSessionTitle(savedItem.title);
    setSessionFocus(savedItem.focus);
    setSessionDate(savedItem.date);
    setSessionTargetMinutes(savedItem.targetMinutes ?? DEFAULT_SESSION_TARGET_MINUTES);
    setSession(withFreshSessionIds(cloneSession(savedItem.items)));
    setLoadedSavedSessionId(savedItem.id);
    setActiveTab('builder');
  }, []);

  const handleNewSession = useCallback(() => {
    setSessionTitle('');
    setSessionFocus('');
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSessionTargetMinutes(DEFAULT_SESSION_TARGET_MINUTES);
    setSession([]);
    setLoadedSavedSessionId(null);
    setActiveTab('builder');
  }, []);

  const handleDeleteSaved = useCallback(async (id: string) => {
    await deleteSession(id);
    if (loadedSavedSessionId === id) {
      setLoadedSavedSessionId(null);
    }
  }, [deleteSession, loadedSavedSessionId]);

  const handleDuplicateSession = useCallback(async (source: SavedSession) => {
    const copy = duplicateSavedSession(source, savedSessions);
    await saveSession(copy);
  }, [savedSessions, saveSession]);

  const handleAddExerciseToSession = useCallback((ex: Exercise) => {
    setSession((prev) => [...prev, toSessionExercise(ex)]);
  }, []);

  const handleAddParallelBlock = useCallback(
    (parallelTitle: string, sessionDuration: number, notes = '', stations: ParallelStation[] = []) => {
      setSession((prev) => [...prev, toParallelBlock(parallelTitle, sessionDuration, notes, stations)]);
    },
    []
  );

  const handleAddExerciseToParallelTarget = useCallback(
    (targetIndex: number, newRole: string, ex: Exercise, existingRole?: string) => {
      setSession((prev) => {
        const item = prev[targetIndex];
        if (!item) return prev;

        if (isParallelBlock(item)) {
          return updateSessionAtIndex(prev, targetIndex, (block) => {
            if (!isParallelBlock(block)) return block;
            return {
              ...block,
              stations: [...block.stations, {
                role: newRole,
                exercise: ex,
                sets: ex.sets,
                reps: ex.reps,
                workSeconds: ex.workSeconds,
                restSeconds: ex.restSeconds,
              }],
            };
          });
        }

        if (!isSessionExercise(item)) return prev;

        const parallelBlock = convertSessionExerciseToParallelBlock(
          item,
          existingRole?.trim() || suggestExerciseRole(item),
          { role: newRole, exercise: ex }
        );

        return prev.map((sessionItem, index) => (index === targetIndex ? parallelBlock : sessionItem));
      });
    },
    []
  );

  const handleRemoveItem = useCallback((index: number) => {
    setSession((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRemoveParallelStation = useCallback((blockIndex: number, stationIndex: number) => {
    setSession((prev) => {
      const item = prev[blockIndex];
      if (!item || !isParallelBlock(item)) return prev;

      const newStations = item.stations.filter((_, i) => i !== stationIndex);
      if (newStations.length === 0) {
        return prev.filter((_, i) => i !== blockIndex);
      }

      return updateSessionAtIndex(prev, blockIndex, (block) => {
        if (!isParallelBlock(block)) return block;
        return { ...block, stations: newStations };
      });
    });
  }, []);

  const handleMoveItem = useCallback((index: number, direction: -1 | 1) => {
    setSession((prev) => moveSessionItem(prev, index, direction));
  }, []);

  const handleDurationChange = useCallback((index: number, val: string) => {
    const dur = parseInt(val, 10) || 0;
    setSession((prev) =>
      updateSessionAtIndex(prev, index, (item) => ({ ...item, sessionDuration: dur }))
    );
  }, []);

  const handleNotesChange = useCallback((index: number, val: string) => {
    setSession((prev) =>
      updateSessionAtIndex(prev, index, (item) => ({ ...item, notes: val }))
    );
  }, []);

  const handleSetsChange = useCallback((index: number, val: string) => {
    const sets = val === '' ? 0 : parseInt(val, 10) || 0;
    setSession((prev) =>
      updateSessionAtIndex(prev, index, (item) => {
        if ('isParallelBlock' in item) return item;
        return { ...item, sets };
      })
    );
  }, []);

  const handleRepsChange = useCallback((index: number, val: string) => {
    const reps = val === '' ? 0 : parseInt(val, 10) || 0;
    setSession((prev) =>
      updateSessionAtIndex(prev, index, (item) => {
        if ('isParallelBlock' in item) return item;
        return { ...item, reps };
      })
    );
  }, []);

  const handleWorkSecondsChange = useCallback((index: number, val: string) => {
    const workSeconds = val === '' ? 0 : parseInt(val, 10) || 0;
    setSession((prev) =>
      updateSessionAtIndex(prev, index, (item) => {
        if ('isParallelBlock' in item) return item;
        return { ...item, workSeconds };
      })
    );
  }, []);

  const handleRestSecondsChange = useCallback((index: number, val: string) => {
    const restSeconds = val === '' ? 0 : parseInt(val, 10) || 0;
    setSession((prev) =>
      updateSessionAtIndex(prev, index, (item) => {
        if ('isParallelBlock' in item) return item;
        return { ...item, restSeconds };
      })
    );
  }, []);

  const handleParallelStationSetsChange = useCallback(
    (blockIndex: number, stationIndex: number, val: string) => {
      const sets = val === '' ? undefined : parseInt(val, 10) || 0;
      setSession((prev) =>
        updateSessionAtIndex(prev, blockIndex, (item) => {
          if (!isParallelBlock(item)) return item;
          return {
            ...item,
            stations: item.stations.map((st, i) =>
              i === stationIndex ? { ...st, sets } : st
            ),
          };
        })
      );
    },
    []
  );

  const handleParallelStationRoleChange = useCallback(
    (blockIndex: number, stationIndex: number, val: string) => {
      setSession((prev) =>
        updateSessionAtIndex(prev, blockIndex, (item) => {
          if (!isParallelBlock(item)) return item;
          return {
            ...item,
            stations: item.stations.map((st, i) =>
              i === stationIndex ? { ...st, role: val } : st
            ),
          };
        })
      );
    },
    []
  );

  const handleParallelStationRepsChange = useCallback(
    (blockIndex: number, stationIndex: number, val: string) => {
      const reps = val === '' ? undefined : parseInt(val, 10) || 0;
      setSession((prev) =>
        updateSessionAtIndex(prev, blockIndex, (item) => {
          if (!isParallelBlock(item)) return item;
          return {
            ...item,
            stations: item.stations.map((st, i) =>
              i === stationIndex ? { ...st, reps } : st
            ),
          };
        })
      );
    },
    []
  );

  const handleParallelStationWorkSecondsChange = useCallback(
    (blockIndex: number, stationIndex: number, val: string) => {
      const workSeconds = val === '' ? undefined : parseInt(val, 10) || 0;
      setSession((prev) =>
        updateSessionAtIndex(prev, blockIndex, (item) => {
          if (!isParallelBlock(item)) return item;
          return {
            ...item,
            stations: item.stations.map((st, i) =>
              i === stationIndex ? { ...st, workSeconds } : st
            ),
          };
        })
      );
    },
    []
  );

  const handleParallelStationRestSecondsChange = useCallback(
    (blockIndex: number, stationIndex: number, val: string) => {
      const restSeconds = val === '' ? undefined : parseInt(val, 10) || 0;
      setSession((prev) =>
        updateSessionAtIndex(prev, blockIndex, (item) => {
          if (!isParallelBlock(item)) return item;
          return {
            ...item,
            stations: item.stations.map((st, i) =>
              i === stationIndex ? { ...st, restSeconds } : st
            ),
          };
        })
      );
    },
    []
  );

  const handleGeneratePreset = useCallback((type: 'k1' | 'k2') => {
    const preset = type === 'k1' ? buildPresetK1(exercises) : buildPresetK2(exercises);
    setSessionTitle(preset.title);
    setSessionFocus(preset.focus);
    setSessionTargetMinutes(preset.targetMinutes);
    setSession(withFreshSessionIds(cloneSession(preset.items)));
  }, [exercises]);

  const handleAddFromDatabase = useCallback(
    (ex: Exercise) => {
      handleAddExerciseToSession(ex);
      setActiveTab('builder');
    },
    [handleAddExerciseToSession]
  );

  const handleSaveExercise = useCallback(async (exercise: Exercise, options?: SaveExerciseOptions) => {
    await saveExercise(exercise, options);
    await reloadSessions();
  }, [saveExercise, reloadSessions]);

  const handleDeleteExercise = useCallback(async (id: string) => {
    await deleteExercise(id);
  }, [deleteExercise]);

  if (exercisesLoading || sessionsLoading || playersLoading) {
    return (
      <div className={`${THEME_CLASSES.page} font-sans min-h-screen flex items-center justify-center`}>
        <p className="text-theme-muted-text text-sm">Caricamento dati dal database...</p>
      </div>
    );
  }

  if (exercisesError || sessionsError || playersError) {
    const errorMessage = exercisesError ?? sessionsError ?? playersError;
    return (
      <div className={`${THEME_CLASSES.page} font-sans min-h-screen flex flex-col items-center justify-center gap-4 px-4`}>
        <p className="text-rose-400 text-sm text-center">{errorMessage}</p>
        <p className="text-theme-muted-text text-xs text-center">
          Avvia il server API con <code className="font-mono">npm run dev:server</code> oppure <code className="font-mono">npm run dev</code>.
        </p>
        <button
          type="button"
          onClick={() => void Promise.all([reloadExercises(), reloadSessions(), reloadPlayers()])}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className={`${THEME_CLASSES.page} font-sans pb-12 print:pb-0 print:bg-white`}>
      <AppHeader
        activeTab={activeTab}
        savedCount={savedSessions.length}
        exerciseCount={exercises.length}
        playerCount={players.length}
        sessionTargetMinutes={sessionTargetMinutes}
        onTabChange={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 mt-6 print:max-w-none print:mx-0 print:px-0 print:mt-0">
        {activeTab === 'builder' && (
          <BuilderTab
            sessionTitle={sessionTitle}
            sessionFocus={sessionFocus}
            sessionDate={sessionDate}
            sessionTargetMinutes={sessionTargetMinutes}
            saveToast={saveToast}
            totalMinutes={totalMinutes}
            totalJumps={totalJumps}
            session={session}
            filteredExercises={filteredExercises}
            exercises={exercises}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedExerciseType={selectedExerciseType}
            selectedRole={selectedRole}
            onSessionTitleChange={setSessionTitle}
            onSessionFocusChange={setSessionFocus}
            onSessionDateChange={setSessionDate}
            onSessionTargetMinutesChange={setSessionTargetMinutes}
            onSave={handleSaveCurrentSession}
            onGeneratePreset={handleGeneratePreset}
            onDurationChange={handleDurationChange}
            onSetsChange={handleSetsChange}
            onRepsChange={handleRepsChange}
            onWorkSecondsChange={handleWorkSecondsChange}
            onRestSecondsChange={handleRestSecondsChange}
            onNotesChange={handleNotesChange}
            onMove={handleMoveItem}
            onRemove={handleRemoveItem}
            onRemoveParallelStation={handleRemoveParallelStation}
            onParallelStationSetsChange={handleParallelStationSetsChange}
            onParallelStationRepsChange={handleParallelStationRepsChange}
            onParallelStationWorkSecondsChange={handleParallelStationWorkSecondsChange}
            onParallelStationRestSecondsChange={handleParallelStationRestSecondsChange}
            onParallelStationRoleChange={handleParallelStationRoleChange}
            onAddExercise={handleAddExerciseToSession}
            onAddParallelBlock={handleAddParallelBlock}
            onAddExerciseToParallelTarget={handleAddExerciseToParallelTarget}
            onSaveExercise={handleSaveExercise}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onExerciseTypeChange={setSelectedExerciseType}
            onRoleChange={setSelectedRole}
            highlightedSessionDates={highlightedSessionDates}
          />
        )}

        {activeTab === 'saved' && (
          <SavedTab
            savedSessions={savedSessions}
            onNewSession={handleNewSession}
            onDelete={handleDeleteSaved}
            onDuplicate={handleDuplicateSession}
            onLoad={handleLoadSession}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseTab
            exercises={exercises}
            onAddExercise={handleAddFromDatabase}
            onSaveExercise={handleSaveExercise}
            onDeleteExercise={handleDeleteExercise}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab
            players={players}
            savedSessions={savedSessions}
            onSavePlayer={savePlayer}
            onDeletePlayer={deletePlayer}
            onLoadAttendance={loadAttendance}
            onSaveAttendance={saveAttendance}
            onClearAttendance={clearAttendance}
            attendanceRecords={attendance?.records ?? []}
            attendanceLoading={attendanceLoading}
            attendanceSaving={attendanceSaving}
            attendanceError={attendanceError}
          />
        )}

        {activeTab === 'print' && (
          <PrintTab
            sessionTitle={sessionTitle}
            sessionFocus={sessionFocus}
            sessionDate={sessionDate}
            sessionTargetMinutes={sessionTargetMinutes}
            totalMinutes={totalMinutes}
            totalJumps={totalJumps}
            session={session}
          />
        )}
      </main>
    </div>
  );
}
