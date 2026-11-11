import type { AttendanceStorage } from './attendance-recorder';

const KEY = 'attendance-pending-v1';

// Web is a development preview with fictitious data, not production provisioning.
export const attendanceStorage: AttendanceStorage = {
  async getItem() { return localStorage.getItem(KEY); },
  async setItem(value) { localStorage.setItem(KEY, value); },
  async removeItem() { localStorage.removeItem(KEY); },
};
