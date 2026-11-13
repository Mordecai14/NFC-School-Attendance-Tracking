import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countByType,
  createAttendanceHistoryApi,
  dayRange,
  filterRecords,
} from '../src/services/attendance-history.ts';

const getAccessToken = async () => 'session-token';
const row = (id, type, first, last, at = '2026-11-12T14:00:00Z') => ({
  id, type, occurred_at: at,
  students: { first_name: first, last_name: last, grade: '3', group_name: 'A' },
});

test('queries attendance with the student embedded, newest first, using the session', async () => {
  const api = createAttendanceHistoryApi('https://example.test/', 'public-key', getAccessToken, async (url, options) => {
    const parsed = new URL(url);
    assert.equal(parsed.origin + parsed.pathname, 'https://example.test/rest/v1/attendance');
    assert.equal(parsed.searchParams.get('select'), 'id,type,occurred_at,students(first_name,last_name,grade,group_name)');
    assert.equal(parsed.searchParams.get('order'), 'occurred_at.desc');
    assert.deepEqual(parsed.searchParams.getAll('occurred_at'), ['gte.2026-11-12T06:00:00.000Z', 'lt.2026-11-13T06:00:00.000Z']);
    assert.equal(options.headers.apikey, 'public-key');
    assert.equal(options.headers.Authorization, 'Bearer session-token');
    return new Response(JSON.stringify([row('a', 'entry', 'Ana', 'Ejemplo')]));
  });
  const records = await api.list({ from: '2026-11-12T06:00:00.000Z', to: '2026-11-13T06:00:00.000Z' });
  assert.deepEqual(records, [{
    id: 'a', type: 'entry', occurred_at: '2026-11-12T14:00:00Z',
    first_name: 'Ana', last_name: 'Ejemplo', grade: '3', group_name: 'A',
  }]);
});

test('surfaces configuration, network and malformed response errors', async () => {
  const range = { from: '2026-11-12T06:00:00.000Z', to: '2026-11-13T06:00:00.000Z' };
  await assert.rejects(createAttendanceHistoryApi(undefined, 'key', getAccessToken).list(range));
  await assert.rejects(createAttendanceHistoryApi('https://example.test', 'key', getAccessToken, async () => new Response('', { status: 503 })).list(range));
  for (const body of [{}, [{ ...row('a', 'late', 'Ana', 'E') }], [{ id: 'a', type: 'entry', occurred_at: '2026-11-12T14:00:00Z', students: null }]]) {
    await assert.rejects(createAttendanceHistoryApi('https://example.test', 'key', getAccessToken, async () => new Response(JSON.stringify(body))).list(range));
  }
});

test('day ranges follow the school time zone', () => {
  // 2026-11-12 23:30 in Mexico City is already 2026-11-13 05:30 UTC.
  const now = new Date('2026-11-13T05:30:00Z');
  assert.deepEqual(dayRange('today', now), { from: '2026-11-12T06:00:00.000Z', to: '2026-11-13T06:00:00.000Z' });
  assert.deepEqual(dayRange('yesterday', now), { from: '2026-11-11T06:00:00.000Z', to: '2026-11-12T06:00:00.000Z' });
  // Month boundary.
  assert.deepEqual(dayRange('yesterday', new Date('2026-12-01T18:00:00Z')), { from: '2026-11-30T06:00:00.000Z', to: '2026-12-01T06:00:00.000Z' });
});

test('counts by type and filters by type and accent-insensitive name', () => {
  const records = ['a', 'b', 'c'].map((id, i) => ({
    id, type: i === 2 ? 'exit' : 'entry', occurred_at: '2026-11-12T14:00:00Z',
    first_name: ['Joaquín', 'Ana', 'Regina'][i], last_name: ['Silva', 'Ejemplo', 'Solís'][i], grade: null, group_name: null,
  }));
  assert.deepEqual(countByType(records), { entry: 2, exit: 1 });
  assert.deepEqual(filterRecords(records, 'exit', '').map(r => r.id), ['c']);
  assert.deepEqual(filterRecords(records, 'all', 'joaquin').map(r => r.id), ['a']);
  assert.deepEqual(filterRecords(records, 'entry', 'solis'), []);
  assert.equal(filterRecords(records, 'all', '  ').length, 3);
});
