import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AppHeader } from './components/AppHeader';
import { BuilderTab } from './components/tabs/BuilderTab';
import { SavedTab } from './components/tabs/SavedTab';
import { DatabaseTab } from './components/tabs/DatabaseTab';
import { PrintTab } from './components/tabs/PrintTab';
import { INITIAL_EXERCISES } from './data/exercises';
import { DEFAULT_SESSION_TARGET_MINUTES } from './data/constants';
import { PRESET_K1, PRESET_K2, SAMPLE_SAVED_SESSION } from './data/presets';
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
import type { Exercise, ParallelStation, SavedSession, SessionItem, TabId } from './types';
import { THEME_CLASSES } from './theme/constants';

export default function App() {
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saveToast, setSaveToast] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('builder');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionFocus, setSessionFocus] = useState('');
  const [sessionTargetMinutes, setSessionTargetMinutes] = useState(DEFAULT_SESSION_TARGET_MINUTES);

  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([SAMPLE_SAVED_SESSION]);
  const [session, setSession] = useState<SessionItem[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>(() => cloneSession(INITIAL_EXERCISES));
  const [selectedCategory, setSelectedCategory] = useState('Tutti');
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
      const matchRole =
        selectedRole === 'Tutti' ||
        ex.targetRoles.includes('Tutti') ||
        ex.targetRoles.includes(selectedRole);
      const matchSearch =
        !normalizedSearch ||
        ex.title.toLowerCase().includes(normalizedSearch) ||
        ex.description.toLowerCase().includes(normalizedSearch);
      return matchCategory && matchRole && matchSearch;
    });
  }, [exercises, selectedCategory, selectedRole, normalizedSearch]);

  const showSaveToast = useCallback(() => {
    setSaveToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setSaveToast(false), 3000);
  }, []);

  const handleSaveCurrentSession = useCallback(() => {
    const newSaved: SavedSession = {
      id: `saved-${Date.now()}`,
      date: sessionDate,
      title: sessionTitle || 'Sessione Senza Titolo',
      focus: sessionFocus || 'Nessun focus specificato',
      targetMinutes: sessionTargetMinutes,
      totalMinutes,
      totalJumps,
      items: cloneSession(session),
    };
    setSavedSessions((prev) => [newSaved, ...prev]);
    showSaveToast();
  }, [sessionDate, sessionTitle, sessionFocus, sessionTargetMinutes, totalMinutes, totalJumps, session, showSaveToast]);

  const handleLoadSession = useCallback((savedItem: SavedSession) => {
    setSessionTitle(savedItem.title);
    setSessionFocus(savedItem.focus);
    setSessionDate(savedItem.date);
    setSessionTargetMinutes(savedItem.targetMinutes ?? DEFAULT_SESSION_TARGET_MINUTES);
    setSession(withFreshSessionIds(cloneSession(savedItem.items)));
    setActiveTab('builder');
  }, []);

  const handleNewSession = useCallback(() => {
    setSessionTitle('');
    setSessionFocus('');
    setSessionDate(new Date().toISOString().split('T')[0]);
    setSessionTargetMinutes(DEFAULT_SESSION_TARGET_MINUTES);
    setSession([]);
    setActiveTab('builder');
  }, []);

  const handleDeleteSaved = useCallback((id: string) => {
    setSavedSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

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
              stations: [...block.stations, { role: newRole, exercise: ex }],
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
    const sets = val === '' ? undefined : parseInt(val, 10) || 0;
    setSession((prev) =>
      updateSessionAtIndex(prev, index, (item) => {
        if ('isParallelBlock' in item) return item;
        return { ...item, sets };
      })
    );
  }, []);

  const handleRepsChange = useCallback((index: number, val: string) => {
    const reps = val === '' ? undefined : parseInt(val, 10) || 0;
    setSession((prev) =>
      updateSessionAtIndex(prev, index, (item) => {
        if ('isParallelBlock' in item) return item;
        return { ...item, reps };
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

  const handleGeneratePreset = useCallback((type: 'k1' | 'k2') => {
    const preset = type === 'k1' ? PRESET_K1 : PRESET_K2;
    setSessionTitle(preset.title);
    setSessionFocus(preset.focus);
    setSessionTargetMinutes(preset.targetMinutes);
    setSession(withFreshSessionIds(cloneSession(preset.items)));
  }, []);

  const handleAddFromDatabase = useCallback(
    (ex: Exercise) => {
      handleAddExerciseToSession(ex);
      setActiveTab('builder');
    },
    [handleAddExerciseToSession]
  );

  const handleSaveExercise = useCallback((exercise: Exercise) => {
    setExercises((prev) => {
      const exists = prev.some((ex) => ex.id === exercise.id);
      if (exists) {
        return prev.map((ex) => (ex.id === exercise.id ? exercise : ex));
      }
      return [...prev, exercise];
    });
  }, []);

  const handleDeleteExercise = useCallback((id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  }, []);

  return (
    <div className={`${THEME_CLASSES.page} font-sans pb-12`}>
      <AppHeader
        activeTab={activeTab}
        savedCount={savedSessions.length}
        exerciseCount={exercises.length}
        sessionTargetMinutes={sessionTargetMinutes}
        onTabChange={setActiveTab}
      />

      <main className="max-w-7xl mx-auto px-4 mt-6">
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
            onNotesChange={handleNotesChange}
            onMove={handleMoveItem}
            onRemove={handleRemoveItem}
            onRemoveParallelStation={handleRemoveParallelStation}
            onParallelStationSetsChange={handleParallelStationSetsChange}
            onParallelStationRepsChange={handleParallelStationRepsChange}
            onParallelStationRoleChange={handleParallelStationRoleChange}
            onAddExercise={handleAddExerciseToSession}
            onAddParallelBlock={handleAddParallelBlock}
            onAddExerciseToParallelTarget={handleAddExerciseToParallelTarget}
            onSaveExercise={handleSaveExercise}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onRoleChange={setSelectedRole}
          />
        )}

        {activeTab === 'saved' && (
          <SavedTab
            savedSessions={savedSessions}
            onNewSession={handleNewSession}
            onDelete={handleDeleteSaved}
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
