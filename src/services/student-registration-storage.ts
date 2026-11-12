import * as SecureStore from 'expo-secure-store';

const KEY = 'student-registration-pending-v1';
export const studentRegistrationStorage = {
  getItem: () => SecureStore.getItemAsync(KEY),
  setItem: (value: string) => SecureStore.setItemAsync(KEY, value),
  removeItem: () => SecureStore.deleteItemAsync(KEY),
};
