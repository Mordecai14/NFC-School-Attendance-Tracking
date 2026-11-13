import type { AttendanceType } from './attendance';

// Same zone the server uses for the daily attendance rule (ADR 002).
export const SCHOOL_TIME_ZONE = 'America/Mexico_City';

export type HistoryRecord = {
  id: string;
  type: AttendanceType;
  occurred_at: string;
  first_name: string;
  last_name: string;
  grade: string | null;
  group_name: string | null;
};
export type HistoryDay = 'today' | 'yesterday';
export type HistoryTypeFilter = 'all' | AttendanceType;

function zoneParts(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

function zoneOffset(instant: number, timeZone: string): number {
  const p = zoneParts(instant, timeZone);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(instant / 1000) * 1000;
}

// Instant at which the given calendar day starts in the school time zone.
function dayStart(year: number, month: number, day: number, timeZone: string): number {
  const guess = Date.UTC(year, month - 1, day);
  const first = guess - zoneOffset(guess, timeZone);
  return guess - zoneOffset(first, timeZone);
}

export function dayRange(day: HistoryDay, now: Date, timeZone = SCHOOL_TIME_ZONE): { from: string; to: string } {
  const today = zoneParts(now.getTime(), timeZone);
  // Calendar arithmetic on UTC dates avoids month/year edge cases.
  const target = new Date(Date.UTC(today.year, today.month - 1, today.day - (day === 'yesterday' ? 1 : 0)));
  const next = new Date(target.getTime() + 86_400_000);
  return {
    from: new Date(dayStart(target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate(), timeZone)).toISOString(),
    to: new Date(dayStart(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), timeZone)).toISOString(),
  };
}

export function countByType(records: HistoryRecord[]): { entry: number; exit: number } {
  return {
    entry: records.filter(record => record.type === 'entry').length,
    exit: records.filter(record => record.type === 'exit').length,
  };
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function filterRecords(records: HistoryRecord[], type: HistoryTypeFilter, query: string): HistoryRecord[] {
  const needle = normalize(query);
  return records.filter(record =>
    (type === 'all' || record.type === type) &&
    (!needle || normalize(`${record.first_name} ${record.last_name}`).includes(needle)));
}

function parseRecord(row: unknown): HistoryRecord {
  const value = row as { id?: unknown; type?: unknown; occurred_at?: unknown; students?: unknown } | null;
  const student = value?.students as Record<string, unknown> | null | undefined;
  if (
    !value || typeof value.id !== 'string' || !value.id ||
    (value.type !== 'entry' && value.type !== 'exit') ||
    typeof value.occurred_at !== 'string' || Number.isNaN(Date.parse(value.occurred_at)) ||
    !student || typeof student !== 'object' ||
    typeof student.first_name !== 'string' || typeof student.last_name !== 'string' ||
    (student.grade !== null && typeof student.grade !== 'string') ||
    (student.group_name !== null && typeof student.group_name !== 'string')
  ) throw new Error('Invalid attendance history response');
  return {
    id: value.id,
    type: value.type,
    occurred_at: value.occurred_at,
    first_name: student.first_name,
    last_name: student.last_name,
    grade: student.grade as string | null,
    group_name: student.group_name as string | null,
  };
}

export function createAttendanceHistoryApi(
  url: string | undefined,
  key: string | undefined,
  getAccessToken: () => Promise<string>,
  request: typeof fetch = fetch,
) {
  return {
    async list(range: { from: string; to: string }): Promise<HistoryRecord[]> {
      if (!url || !key) throw new Error('Supabase is not configured');
      const token = await getAccessToken();
      if (!token) throw new Error('School authentication is required');
      const query =
        'attendance?select=id,type,occurred_at,students(first_name,last_name,grade,group_name)' +
        `&occurred_at=gte.${encodeURIComponent(range.from)}&occurred_at=lt.${encodeURIComponent(range.to)}` +
        '&order=occurred_at.desc';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await request(`${url.replace(/\/$/, '')}/rest/v1/${query}`, {
          method: 'GET',
          headers: { apikey: key, Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Attendance history request failed');
        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error('Invalid attendance history response');
        return data.map(parseRecord);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
