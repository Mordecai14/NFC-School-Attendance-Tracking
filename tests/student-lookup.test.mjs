import assert from 'node:assert/strict';
import test from 'node:test';
import { lookupStudent } from '../src/services/student-lookup.ts';

const getAccessToken = async () => 'session-token';

test('sends the scanned UID with the authenticated session and returns the student', async () => {
  const student = { first_name: 'Ana', last_name: 'Ejemplo', grade: '3', group_name: 'A' };
  const result = await lookupStudent('UID', 'https://example.test/', 'public-key', getAccessToken, async (url, options) => {
    assert.equal(url, 'https://example.test/rest/v1/rpc/student_by_bracelet');
    assert.equal(options.headers.apikey, 'public-key');
    assert.equal(options.headers.Authorization, 'Bearer session-token');
    assert.deepEqual(JSON.parse(options.body), { bracelet_uid: 'UID' });
    return new Response(JSON.stringify([student]));
  });
  assert.deepEqual(result, student);
});

test('returns null for an unassigned bracelet', async () => {
  assert.equal(await lookupStudent('unknown', 'https://example.test', 'key', getAccessToken, async () => new Response('[]')), null);
});

test('surfaces configuration, network and malformed response errors', async () => {
  await assert.rejects(lookupStudent('UID', undefined, 'key', getAccessToken));
  await assert.rejects(lookupStudent('UID', 'https://example.test', 'key', getAccessToken, async () => new Response('', { status: 503 })));
  await assert.rejects(lookupStudent('UID', 'https://example.test', 'key', getAccessToken, async () => new Response('[{}]')));
});

test('does not send a lookup request when authentication fails or returns an empty token', async () => {
  const request = async () => assert.fail('Lookup must not fall back to anonymous access');
  await assert.rejects(lookupStudent('UID', 'https://example.test', 'key', async () => {
    throw new Error('Login failed');
  }, request), /Login failed/);
  await assert.rejects(lookupStudent('UID', 'https://example.test', 'key', async () => '', request), /authentication/);
});

test('surfaces a rejected JWT without retrying anonymously', async () => {
  let calls = 0;
  await assert.rejects(lookupStudent('UID', 'https://example.test', 'key', getAccessToken, async () => {
    calls++;
    return new Response('', { status: 401 });
  }), /lookup failed/);
  assert.equal(calls, 1);
});
