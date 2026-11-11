import { useSyncExternalStore } from 'react';
import Constants from 'expo-constants';

import { developmentAuth } from '@/hooks/use-development-login';
import { attendanceRecorder } from '@/hooks/use-attendance-registration';
import { createAttendanceScanner } from '@/services/attendance-scanner';
import { lookupStudent } from '@/services/student-lookup';

const extra = Constants.expoConfig?.extra;
const scanner = createAttendanceScanner({
  recorder: attendanceRecorder,
  lookup: identifier => lookupStudent(identifier, extra?.supabaseUrl, extra?.supabasePublishableKey, developmentAuth.getAccessToken),
});

export function useAttendanceScanner() {
  const state = useSyncExternalStore(scanner.subscribe, scanner.getState, scanner.getState);
  return { state, scan: scanner.scan, selectMode: scanner.selectMode };
}
