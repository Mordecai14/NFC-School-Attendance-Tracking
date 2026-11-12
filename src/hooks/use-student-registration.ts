import { useEffect, useSyncExternalStore } from 'react';
import Constants from 'expo-constants';
import { randomUUID } from 'expo-crypto';

import { developmentAuth } from '@/hooks/use-development-login';
import { createStudentRegistrar, createStudentRegistrationApi } from '@/services/student-registration';
import { studentRegistrationStorage } from '@/services/student-registration-storage';

const extra = Constants.expoConfig?.extra;
const registrar = createStudentRegistrar({
  storage: studentRegistrationStorage,
  newId: randomUUID,
  send: createStudentRegistrationApi(extra?.supabaseUrl, extra?.supabasePublishableKey, developmentAuth.getAccessToken),
  async getSchoolId() {
    const session = await developmentAuth.signIn();
    if (session.schoolIds.length !== 1) throw new Error('A single authorized school is required');
    return session.schoolIds[0];
  },
});

export function useStudentRegistration() {
  const state = useSyncExternalStore(registrar.subscribe, registrar.getState, registrar.getState);
  useEffect(() => { void registrar.initialize(); }, []);
  return { state, getState: registrar.getState, register: registrar.register, retry: registrar.retry, clear: registrar.clear };
}
