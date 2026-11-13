import { useCallback, useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';

import { developmentAuth } from '@/hooks/use-development-login';
import {
  createAttendanceHistoryApi,
  dayRange,
  type HistoryDay,
  type HistoryRecord,
} from '@/services/attendance-history';

const extra = Constants.expoConfig?.extra;
const api = createAttendanceHistoryApi(extra?.supabaseUrl, extra?.supabasePublishableKey, developmentAuth.getAccessToken);

export type HistoryStatus = 'loading' | 'ready' | 'error';

// A result belongs to the day it was fetched for; any other selected day is still loading.
type Result = { day: HistoryDay; records: HistoryRecord[] | null };

export function useAttendanceHistory(day: HistoryDay) {
  const [result, setResult] = useState<Result | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    let next: Result;
    try {
      next = { day, records: await api.list(dayRange(day, new Date())) };
    } catch {
      next = { day, records: null };
    }
    if (id !== requestId.current) return;
    setResult(next);
    setRefreshing(false);
  }, [day]);

  useEffect(() => { void load(); }, [load]);

  const current = result?.day === day ? result : null;
  const status: HistoryStatus = !current ? 'loading' : current.records ? 'ready' : 'error';

  const refresh = useCallback(() => {
    setRefreshing(true);
    return load();
  }, [load]);
  const retry = useCallback(() => {
    setResult(null);
    return load();
  }, [load]);

  return { records: current?.records ?? [], status, refreshing, refresh, retry };
}
