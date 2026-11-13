import { useEffect, useSyncExternalStore } from 'react';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';

import { developmentAuth } from '@/hooks/use-development-login';
import { createAttendanceApi } from '@/services/attendance';
import { createAttendanceRecorder } from '@/services/attendance-recorder';
import { attendanceStorage } from '@/services/attendance-storage';

const extra = Constants.expoConfig?.extra;
const api = createAttendanceApi(extra?.supabaseUrl, extra?.supabasePublishableKey, developmentAuth.getAccessToken);
export const attendanceRecorder = createAttendanceRecorder({
  storage: attendanceStorage,
  getDeviceId: api.getDeviceId,
  send: api.send,
  newId: randomUUID,
  now: () => new Date().toISOString(),
});

export function useAttendanceRegistration() {
  const state = useSyncExternalStore(attendanceRecorder.subscribe, attendanceRecorder.getState, attendanceRecorder.getState);
  useEffect(() => { void attendanceRecorder.initialize(); }, []);
  return {
    state,
    record: attendanceRecorder.record,
    retry: attendanceRecorder.retry,
    confirmRepeat: attendanceRecorder.confirmRepeat,
    cancelRepeat: attendanceRecorder.cancelRepeat,
  };
}
