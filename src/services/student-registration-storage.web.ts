const KEY = 'student-registration-pending-v1';
export const studentRegistrationStorage = {
  async getItem() { return localStorage.getItem(KEY); },
  async setItem(value: string) { localStorage.setItem(KEY, value); },
  async removeItem() { localStorage.removeItem(KEY); },
};
