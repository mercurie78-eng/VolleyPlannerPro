import { useCallback, useState } from 'react';
import * as attendanceApi from '../api/attendance';
import type { AttendanceRecord, SessionAttendance } from '../types';

interface UseAttendanceResult {
  attendance: SessionAttendance | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  loadAttendance: (sessionId: string) => Promise<void>;
  saveAttendance: (sessionId: string, records: AttendanceRecord[]) => Promise<void>;
  clearAttendance: () => void;
}

export function useAttendance(): UseAttendanceResult {
  const [attendance, setAttendance] = useState<SessionAttendance | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await attendanceApi.fetchSessionAttendance(sessionId);
      setAttendance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile caricare le presenze');
      setAttendance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAttendance = useCallback(async (sessionId: string, records: AttendanceRecord[]) => {
    setSaving(true);
    setError(null);
    try {
      const data = await attendanceApi.saveSessionAttendance(sessionId, records);
      setAttendance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvataggio presenze non riuscito');
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const clearAttendance = useCallback(() => {
    setAttendance(null);
    setError(null);
  }, []);

  return {
    attendance,
    loading,
    saving,
    error,
    loadAttendance,
    saveAttendance,
    clearAttendance,
  };
}
