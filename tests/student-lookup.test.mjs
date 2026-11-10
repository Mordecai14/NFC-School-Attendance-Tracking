import assert from 'node:assert/strict';
import test from 'node:test';
import { lookupStudent } from '../src/services/student-lookup.ts';

test('sends the scanned UID to Supabase and returns the student', async () => {
  const student = { first_name: 'Ana', last_name: 'Ejemplo', grade: '3', group_name: 'A' };
  const result = await lookupStudent('UID', 'https://example.test/', 'public-key', async (url, options) => {
    assert.equal(url, 'https://example.test/rest/v1/rpc/development_student_by_bracelet');
    assert.equal(options.headers.apikey, 'public-key');
    assert.deepEqual(JSON.parse(options.body), { bracelet_uid: 'UID' });
    return new Response(JSON.stringify([student]));
  });
  assert.deepEqual(result, student);
});

test('returns null for an unassigned bracelet', async () => {
  assert.equal(await lookupStudent('unknown', 'https://example.test', 'key', async () => new Response('[]')), null);
});

test('surfaces configuration, network and malformed response errors', async () => {
  await assert.rejects(lookupStudent('UID', undefined, 'key'));
  await assert.rejects(lookupStudent('UID', 'https://example.test', 'key', async () => new Response('', { status: 503 })));
  await assert.rejects(lookupStudent('UID', 'https://example.test', 'key', async () => new Response('[{}]')));
});
