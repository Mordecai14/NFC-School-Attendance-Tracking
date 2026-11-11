import type { Student } from './student-lookup';

export type AttendanceType = 'entry' | 'exit';
export type AttendanceEvent = {
  id: string;
  school_id: string;
  student_id: string;
  bracelet_id: string;
  device_id: string;
  type: AttendanceType;
  occurred_at: string;
};
export type AttendanceReceipt = Pick<AttendanceEvent, 'id' | 'type' | 'occurred_at'>;

export function createAttendanceApi(
  url: string | undefined,
  key: string | undefined,
  getAccessToken: () => Promise<string>,
  request: typeof fetch = fetch,
) {
  async function json(path: string, body?: unknown): Promise<unknown> {
    if (!url || !key) throw new Error('Supabase is not configured');
    const token = await getAccessToken();
    if (!token) throw new Error('School authentication is required');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await request(`${url.replace(/\/$/, '')}/rest/v1/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Attendance request failed');
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    // Development currently has one active device per school; never pick arbitrarily.
    async getDeviceId(student: Student): Promise<string> {
      const devices = await json(`devices?select=id&school_id=eq.${encodeURIComponent(student.school_id)}&active=eq.true&limit=2`);
      if (!Array.isArray(devices) || devices.length !== 1 ||
          typeof devices[0]?.id !== 'string' || !devices[0].id) {
        throw new Error('A single active school device is required');
      }
      return devices[0].id;
    },
    async send(event: AttendanceEvent): Promise<AttendanceReceipt> {
      const result = await json('rpc/record_attendance', {
        event_id: event.id,
        event_school_id: event.school_id,
        event_student_id: event.student_id,
        event_bracelet_id: event.bracelet_id,
        event_device_id: event.device_id,
        event_type: event.type,
        event_occurred_at: event.occurred_at,
      });
      if (!Array.isArray(result) || result.length !== 1) throw new Error('Missing attendance confirmation');
      const receipt = result[0];
      if (receipt?.id !== event.id || receipt?.type !== event.type ||
          typeof receipt?.occurred_at !== 'string' ||
          Date.parse(receipt.occurred_at) !== Date.parse(event.occurred_at)) {
        throw new Error('Invalid attendance confirmation');
      }
      return { id: receipt.id, type: receipt.type, occurred_at: receipt.occurred_at };
    },
  };
}
