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
  recorder: Pick<ReturnType<typeof createAttendanceRecorder>, 'getState' | 'record'>;
}) {
  let state: ScanState = { mode: 'entry', recent: { entry: [], exit: [] }, readingMode: null, identifier: null, student: null, status: 'ready' };
  let busy = false;
  let rearmedConfirmationId: string | null = null;
  const listeners = new Set<() => void>();
  const update = (next: ScanState) => {
    state = next;
    listeners.forEach(listener => listener());
  };
  const available = () => !busy && ['idle', 'saved'].includes(options.recorder.getState().status);

  function remember(student: Student, mode: AttendanceType) {
    const registration = options.recorder.getState();
    const saved = registration.status === 'saved' ? registration.confirmed : registration.status === 'pending' ? registration.pending : null;
    const event = saved?.event;
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
        const confirmed = options.recorder.getState().confirmed?.event;
        if (confirmed?.bracelet_id === student.bracelet_id && confirmed.student_id === student.id &&
            confirmed.school_id === student.school_id && confirmed.type === mode &&
            confirmed.id !== rearmedConfirmationId) {
          // A repeated callback for the last confirmed bracelet is not a new movement.
          result = { student, status: 'duplicate' };
        } else {
          await options.recorder.record(student, mode);
          remember(student, mode);
          result = { student, status: 'identified' };
        }
      }
    } catch {
      result = { student: null, status: 'error' };
    } finally {
      busy = false;
      update({ ...state, ...result });
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
      // An explicit selection can arm an intentional repeat, but never replays an old read.
      rearmedConfirmationId = options.recorder.getState().confirmed?.event.id ?? null;
      if (state.mode !== mode) update({ ...state, mode });
      return true;
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
