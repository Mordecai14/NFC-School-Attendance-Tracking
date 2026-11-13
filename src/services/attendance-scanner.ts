import type { Student } from './student-lookup';
import type { AttendanceType } from './attendance';
import type { createAttendanceRecorder } from './attendance-recorder';

export type RecentMovement = { id: string; student: Student; occurred_at: string };

const MAX_RECENT = 5;

type ScanState = {
  mode: AttendanceType;
  // Movimientos recientes por modo; cambiar de modo nunca borra el otro.
  recent: Record<AttendanceType, RecentMovement[]>;
  readingMode: AttendanceType | null;
  identifier: string | null;
  student: Student | null;
  status: 'ready' | 'looking-up' | 'identified' | 'unknown' | 'error' | 'duplicate';
};

export function createAttendanceScanner(options: {
  lookup(identifier: string): Promise<Student | null>;
  recorder: Pick<ReturnType<typeof createAttendanceRecorder>, 'getState' | 'record' | 'retry' | 'confirmRepeat' | 'cancelRepeat'>;
}) {
  let state: ScanState = { mode: 'entry', recent: { entry: [], exit: [] }, readingMode: null, identifier: null, student: null, status: 'ready' };
  let busy = false;
  const listeners = new Set<() => void>();
  const update = (next: ScanState) => {
    state = next;
    listeners.forEach(listener => listener());
  };
  const available = () => !busy && ['idle', 'saved'].includes(options.recorder.getState().status);

  function remember(student: Student, mode: AttendanceType) {
    const registration = options.recorder.getState();
    // Only movements the server acknowledged are listed; pending ones show in the registration card.
    const event = registration.status === 'saved' ? registration.confirmed?.event : null;
    if (!event || event.student_id !== student.id || event.type !== mode) return;
    if (state.recent[mode].some(item => item.id === event.id)) return;
    const recent = [{ id: event.id, student, occurred_at: event.occurred_at }, ...state.recent[mode]].slice(0, MAX_RECENT);
    state = { ...state, recent: { ...state.recent, [mode]: recent } };
  }

  async function process(identifier: string, mode: AttendanceType) {
    let result: Pick<ScanState, 'student' | 'status'> = { student: null, status: 'error' };
    try {
      const student = await options.lookup(identifier);
      if (!student) {
        result = { student: null, status: 'unknown' };
      } else {
        // The daily rule is enforced by the server (ADR 002); the recorder reports its verdict.
        await options.recorder.record(student, mode);
        remember(student, mode);
        result = { student, status: options.recorder.getState().error === 'duplicate' ? 'duplicate' : 'identified' };
      }
    } catch {
      result = { student: null, status: 'error' };
    } finally {
      busy = false;
      update({ ...state, ...result });
    }
  }

  async function resolve(action: () => Promise<void>, type: AttendanceType | undefined) {
    const { student } = state;
    busy = true;
    try {
      await action();
      if (student && type) remember(student, type);
    } finally {
      busy = false;
      update(options.recorder.getState().error === 'duplicate' ? { ...state, status: 'duplicate' } : { ...state });
    }
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    selectMode(mode: AttendanceType): boolean {
      if (!available()) return false;
      if (state.mode !== mode) update({ ...state, mode });
      return true;
    },
    // The teacher accepted the additional movement the server asked to confirm.
    async confirmRepeat(): Promise<void> {
      if (busy || options.recorder.getState().status !== 'confirm') return;
      await resolve(() => options.recorder.confirmRepeat(), options.recorder.getState().pending?.event.type);
    },
    // Retrying a pending event can also end in a server verdict, so it goes through the same path.
    async retry(): Promise<void> {
      if (busy || options.recorder.getState().status !== 'pending') return;
      await resolve(() => options.recorder.retry(), options.recorder.getState().pending?.event.type);
    },
    async cancelRepeat(): Promise<void> {
      await options.recorder.cancelRepeat();
      if (options.recorder.getState().status === 'idle') {
        // The teacher declined: leave no stale "waiting for confirmation" reading behind.
        update({ ...state, status: 'ready', readingMode: null, identifier: null, student: null });
      } else {
        update({ ...state });
      }
    },
    scan(identifier: string): boolean {
      if (!available() || !identifier.trim()) return false;
      const mode = state.mode;
      busy = true;
      update({ ...state, readingMode: mode, identifier, student: null, status: 'looking-up' });
      void process(identifier, mode);
      return true;
    },
  };
}
