export type StudentDraft = {
  first_name: string;
  last_name: string;
  student_number: string;
  grade: string;
  group_name: string;
};
export type StudentRegistration = StudentDraft & {
  version: 1;
  registration_id: string;
  school_id: string;
  bracelet_uid: string;
};
export type RegistrationReceipt = {
  registration_id: string;
  school_id: string;
  student_id: string;
  bracelet_id: string;
  bracelet_uid: string;
};

export class RegistrationRejected extends Error {
  readonly reason: 'conflict' | 'invalid' | 'forbidden';
  constructor(reason: 'conflict' | 'invalid' | 'forbidden') {
    super(`Student registration rejected: ${reason}`);
    this.reason = reason;
  }
}

export function normalizeDraft(draft: StudentDraft): StudentDraft {
  const result = {
    first_name: draft.first_name.trim(), last_name: draft.last_name.trim(),
    student_number: draft.student_number.trim(), grade: draft.grade.trim(), group_name: draft.group_name.trim(),
  };
  if (!result.first_name || !result.last_name || result.first_name.length > 100 || result.last_name.length > 100 ||
      result.student_number.length > 60 || result.grade.length > 40 || result.group_name.length > 40) {
    throw new RegistrationRejected('invalid');
  }
  return result;
}

export function createStudentRegistrationApi(
  url: string | undefined, key: string | undefined,
  getAccessToken: () => Promise<string>, request: typeof fetch = fetch,
) {
  return async (attempt: StudentRegistration): Promise<RegistrationReceipt> => {
    if (!url || !key) throw new Error('Supabase is not configured');
    const token = await getAccessToken();
    if (!token) throw new Error('School authentication is required');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await request(`${url.replace(/\/$/, '')}/rest/v1/rpc/register_student`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_registration_id: attempt.registration_id, p_school_id: attempt.school_id,
          p_bracelet_uid: attempt.bracelet_uid, p_first_name: attempt.first_name, p_last_name: attempt.last_name,
          p_student_number: attempt.student_number, p_grade: attempt.grade, p_group_name: attempt.group_name,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        // Only explicit database rejections prove that this attempt did not commit.
        let error: unknown;
        try { error = await response.json(); } catch { /* Keep the outcome uncertain. */ }
        const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
        if (code === '23505') throw new RegistrationRejected('conflict');
        if (code === '22023') throw new RegistrationRejected('invalid');
        if (code === '42501') throw new RegistrationRejected('forbidden');
        throw new Error('Student registration was not confirmed');
      }
      const data: unknown = await response.json();
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!data || typeof data !== 'object' ||
          !('registration_id' in data) || data.registration_id !== attempt.registration_id ||
          !('school_id' in data) || data.school_id !== attempt.school_id ||
          !('bracelet_uid' in data) || data.bracelet_uid !== attempt.bracelet_uid ||
          !('student_id' in data) || typeof data.student_id !== 'string' || !uuid.test(data.student_id) ||
          !('bracelet_id' in data) || typeof data.bracelet_id !== 'string' || !uuid.test(data.bracelet_id)) {
        throw new Error('Invalid registration confirmation');
      }
      return data as RegistrationReceipt;
    } finally { clearTimeout(timeout); }
  };
}

type Storage = {
  getItem(): Promise<string | null>;
  setItem(value: string): Promise<void>;
  removeItem(): Promise<void>;
};
type RegistrationState = {
  status: 'loading' | 'idle' | 'preparing' | 'saving' | 'pending' | 'saved' | 'rejected' | 'blocked';
  attempt: StudentRegistration | null;
  receipt: RegistrationReceipt | null;
  error: 'invalid' | 'prepare' | 'network' | 'storage' | 'conflict' | 'forbidden' | null;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function restoreRegistration(raw: string): StudentRegistration {
  const value = JSON.parse(raw);
  if (value?.version !== 1 || typeof value.registration_id !== 'string' || !uuid.test(value.registration_id) ||
      typeof value.school_id !== 'string' || !uuid.test(value.school_id) ||
      typeof value.bracelet_uid !== 'string' || !value.bracelet_uid.trim() || value.bracelet_uid.length > 128 ||
      !['first_name', 'last_name', 'student_number', 'grade', 'group_name'].every(key => typeof value[key] === 'string')) {
    throw new Error('Invalid pending student registration');
  }
  normalizeDraft(value);
  return value;
}

export function createStudentRegistrar(options: {
  storage: Storage;
  getSchoolId(): Promise<string>;
  send(attempt: StudentRegistration): Promise<RegistrationReceipt>;
  newId(): string;
}) {
  let state: RegistrationState = { status: 'loading', attempt: null, receipt: null, error: null };
  let busy = false;
  let initialization: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const update = (next: RegistrationState) => { state = next; listeners.forEach(listener => listener()); };

  async function commit(attempt: StudentRegistration) {
    update({ status: 'saving', attempt, receipt: null, error: null });
    try { await options.storage.setItem(JSON.stringify(attempt)); } catch {
      update({ ...state, status: 'pending', error: 'storage' });
      return;
    }
    let receipt: RegistrationReceipt;
    try {
      // Never allow an injected sender to mutate the durable request.
      receipt = await options.send({ ...attempt });
    } catch (error) {
      if (error instanceof RegistrationRejected && error.reason !== 'forbidden') {
        try { await options.storage.removeItem(); } catch {
          update({ ...state, status: 'pending', error: 'storage' });
          return;
        }
        update({ ...state, status: 'rejected', error: error.reason });
      } else {
        // Permission loss may hide an already committed request: do not discard it.
        update({ ...state, status: 'pending', error: error instanceof RegistrationRejected ? 'forbidden' : 'network' });
      }
      return;
    }
    try { await options.storage.removeItem(); } catch {
      update({ ...state, status: 'pending', error: 'storage' });
      return;
    }
    update({ status: 'saved', attempt, receipt, error: null });
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    initialize(): Promise<void> {
      if (!initialization) initialization = (async () => {
        try {
          const raw = await options.storage.getItem();
          update({ status: raw === null ? 'idle' : 'pending', attempt: raw === null ? null : restoreRegistration(raw), receipt: null, error: null });
        } catch {
          update({ status: 'blocked', attempt: null, receipt: null, error: 'storage' });
        }
      })();
      return initialization;
    },
    async register(draft: StudentDraft, braceletUid: string) {
      if (busy || !['idle', 'rejected'].includes(state.status)) return;
      let normalized: StudentDraft;
      try {
        normalized = normalizeDraft(draft);
        if (!braceletUid.trim() || braceletUid.length > 128) throw new Error('Invalid UID');
      } catch { update({ ...state, error: 'invalid' }); return; }
      busy = true;
      update({ status: 'preparing', attempt: null, receipt: null, error: null });
      try {
        const schoolId = await options.getSchoolId();
        const id = options.newId();
        if (!uuid.test(schoolId) || !uuid.test(id)) throw new Error('Invalid registration identity');
        await commit({ ...normalized, version: 1, school_id: schoolId, registration_id: id, bracelet_uid: braceletUid.trim() });
      } catch {
        update({ ...state, status: state.attempt ? 'pending' : 'idle', error: state.attempt ? 'network' : 'prepare' });
      }
      finally { busy = false; }
    },
    async retry() {
      if (busy || state.status !== 'pending' || !state.attempt) return;
      busy = true;
      try { await commit(state.attempt); } finally { busy = false; }
    },
    clear(): boolean {
      if (busy || !['idle', 'saved', 'rejected'].includes(state.status)) return false;
      update({ status: 'idle', attempt: null, receipt: null, error: null });
      return true;
    },
  };
}
