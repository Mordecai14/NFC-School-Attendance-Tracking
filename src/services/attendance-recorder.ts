import type { Student } from './student-lookup';
import type { AttendanceEvent, AttendanceReceipt, AttendanceRejectionKind, AttendanceType } from './attendance';

export type PendingAttendance = { version: 1; event: AttendanceEvent; studentName: string };
export type AttendanceStorage = {
  getItem(): Promise<string | null>;
  setItem(value: string): Promise<void>;
  removeItem(): Promise<void>;
};
type RecorderState = {
  // 'confirm': the server asked for an explicit confirmation of an additional movement.
  status: 'loading' | 'idle' | 'saving' | 'pending' | 'confirm' | 'saved' | 'blocked';
  pending: PendingAttendance | null;
  confirmed: PendingAttendance | null;
  // 'duplicate': the server rejected the event as a repeat of the last movement; nothing was stored.
  error: 'prepare' | 'storage' | 'network' | 'duplicate' | null;
};

// Type-only import of the error class keeps this module loadable by the Node test runner.
function rejectionKind(error: unknown): AttendanceRejectionKind | null {
  const { name, kind } = (error ?? {}) as { name?: unknown; kind?: unknown };
  return name === 'AttendanceRejection' && (kind === 'duplicate' || kind === 'confirmation-required') ? kind : null;
}

function restore(value: string): PendingAttendance {
  const data = JSON.parse(value);
  const event = data?.event;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (data?.version !== 1 || typeof data.studentName !== 'string' || !event ||
      !['id', 'school_id', 'student_id', 'bracelet_id', 'device_id'].every(key =>
        typeof event[key] === 'string' && uuid.test(event[key])) ||
      !['entry', 'exit'].includes(event.type) || typeof event.occurred_at !== 'string' ||
      !Number.isFinite(Date.parse(event.occurred_at))) {
    throw new Error('Invalid pending attendance; preserve storage for recovery');
  }
  return data;
}

export function createAttendanceRecorder(options: {
  storage: AttendanceStorage;
  getDeviceId(student: Student): Promise<string>;
  send(event: AttendanceEvent, options?: { confirmed?: boolean }): Promise<AttendanceReceipt>;
  newId(): string;
  now(): string;
}) {
  let state: RecorderState = { status: 'loading', pending: null, confirmed: null, error: null };
  let busy = false;
  let initialization: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const update = (next: RecorderState) => {
    state = next;
    listeners.forEach(listener => listener());
  };

  async function commit(pending: PendingAttendance, confirmed = false) {
    update({ ...state, status: 'saving', pending, error: null });
    try {
      // Never send an event unless its stable ID and payload survived a local write.
      await options.storage.setItem(JSON.stringify(pending));
    } catch {
      update({ ...state, status: 'pending', error: 'storage' });
      return;
    }
    try {
      await options.send(pending.event, confirmed ? { confirmed: true } : undefined);
    } catch (error) {
      const rejection = rejectionKind(error);
      if (rejection === 'confirmation-required') {
        // Keep the journal: if the app closes, the same question is asked again.
        update({ ...state, status: 'confirm', pending, error: null });
        return;
      }
      if (rejection) {
        // The server stored nothing, so the local journal no longer protects any event.
        try {
          await options.storage.removeItem();
        } catch {
          update({ ...state, status: 'pending', error: 'storage' });
          return;
        }
        update({ ...state, status: 'idle', pending: null, error: 'duplicate' });
        return;
      }
      update({ ...state, status: 'pending', error: 'network' });
      return;
    }
    try {
      await options.storage.removeItem();
    } catch {
      // The server may already have committed: retry the same ID, not a new event.
      update({ ...state, status: 'pending', error: 'storage' });
      return;
    }
    update({ status: 'saved', pending: null, confirmed: pending, error: null });
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
          const value = await options.storage.getItem();
          update({ status: value === null ? 'idle' : 'pending', pending: value === null ? null : restore(value), confirmed: null, error: null });
        } catch {
          update({ status: 'blocked', pending: null, confirmed: null, error: 'storage' });
        }
      })();
      return initialization;
    },
    async record(student: Student, type: AttendanceType): Promise<void> {
      if (busy || !['idle', 'saved'].includes(state.status)) return;
      busy = true;
      update({ ...state, status: 'saving', error: null });
      try {
        const deviceId = await options.getDeviceId(student);
        const pending: PendingAttendance = {
          version: 1,
          studentName: `${student.first_name} ${student.last_name}`.slice(0, 160),
          event: {
            id: options.newId(), school_id: student.school_id, student_id: student.id,
            bracelet_id: student.bracelet_id, device_id: deviceId, type, occurred_at: options.now(),
          },
        };
        await commit(pending);
      } catch {
        update({ ...state, status: 'idle', error: 'prepare' });
      } finally {
        busy = false;
      }
    },
    async retry(): Promise<void> {
      if (busy || state.status !== 'pending' || !state.pending) return;
      busy = true;
      try { await commit(state.pending); } finally { busy = false; }
    },
    // The teacher accepted the additional movement: resend the same event with the confirmation.
    async confirmRepeat(): Promise<void> {
      if (busy || state.status !== 'confirm' || !state.pending) return;
      busy = true;
      try { await commit(state.pending, true); } finally { busy = false; }
    },
    // The teacher declined: the event was never stored, so the local journal can be dropped.
    async cancelRepeat(): Promise<void> {
      if (busy || state.status !== 'confirm') return;
      busy = true;
      try {
        await options.storage.removeItem();
        update({ ...state, status: 'idle', pending: null, error: null });
      } catch {
        update({ ...state, status: 'confirm', error: 'storage' });
      } finally {
        busy = false;
      }
    },
  };
}
