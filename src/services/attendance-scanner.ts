import type { Student } from './student-lookup';
import type { AttendanceType } from './attendance';
import type { createAttendanceRecorder } from './attendance-recorder';

type ScanState = {
  mode: AttendanceType;
  readingMode: AttendanceType | null;
  identifier: string | null;
  student: Student | null;
  status: 'ready' | 'looking-up' | 'identified' | 'unknown' | 'error' | 'duplicate';
};

export function createAttendanceScanner(options: {
  lookup(identifier: string): Promise<Student | null>;
  recorder: Pick<ReturnType<typeof createAttendanceRecorder>, 'getState' | 'record'>;
}) {
  let state: ScanState = { mode: 'entry', readingMode: null, identifier: null, student: null, status: 'ready' };
  let busy = false;
  let rearmedConfirmationId: string | null = null;
  const listeners = new Set<() => void>();
  const update = (next: ScanState) => {
    state = next;
    listeners.forEach(listener => listener());
  };
  const available = () => !busy && ['idle', 'saved'].includes(options.recorder.getState().status);

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
