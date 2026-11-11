import * as SecureStore from 'expo-secure-store';
import type { AttendanceStorage } from './attendance-recorder';

const KEY = 'attendance-pending-v1';

export const attendanceStorage: AttendanceStorage = {
  getItem: () => SecureStore.getItemAsync(KEY),
  setItem: value => SecureStore.setItemAsync(KEY, value),
  removeItem: () => SecureStore.deleteItemAsync(KEY),
};
