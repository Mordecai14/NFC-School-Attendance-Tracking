import assert from 'node:assert/strict';
import test from 'node:test';
import { braceletExists, createBraceletRegistrationCheck } from '../src/services/bracelet-registration-check.ts';

const settle = () => new Promise(resolve => setImmediate(resolve));

test('form is gated until a new bracelet is confirmed and existing bracelets remain blocked', async () => {
  const gate = createBraceletRegistrationCheck(async uid => uid === 'existing');
  assert.equal(gate.getState().status, 'idle');
  gate.scan('existing');
  assert.equal(gate.getState().status, 'checking');
  await settle();
  assert.equal(gate.getState().status, 'exists');
  gate.scan('new');
  assert.equal(gate.getState().status, 'checking');
  await settle();
  assert.deepEqual(gate.getState(), { status: 'available', uid: 'new' });
  assert.equal(gate.scan('another'), false, 'verified draft must not silently change bracelets');
  gate.clear();
  assert.deepEqual(gate.getState(), { status: 'idle', uid: null });
});

test('lookup errors fail closed and rescanning allows retry', async () => {
  let fails = true;
  const gate = createBraceletRegistrationCheck(async () => {
    if (fails) throw new Error('offline');
    return false;
  });
  gate.scan('uid');
  await settle();
  assert.equal(gate.getState().status, 'error');
  fails = false;
  assert.equal(gate.scan('uid'), true);
  await settle();
  assert.equal(gate.getState().status, 'available');
});

test('late responses cannot unlock a different bracelet or a cleared/blurred screen', async () => {
  const pending = new Map();
  const gate = createBraceletRegistrationCheck(uid => new Promise(resolve => pending.set(uid, resolve)));
  gate.scan('a');
  assert.equal(gate.scan('a'), false);
  gate.scan('b');
  pending.get('a')(false);
  await settle();
  assert.deepEqual(gate.getState(), { status: 'checking', uid: 'b' });
  gate.clear();
  pending.get('b')(false);
  await settle();
  assert.deepEqual(gate.getState(), { status: 'idle', uid: null });
  assert.equal(gate.scan('  '), false);
});

test('existence RPC sends JWT and accepts only a boolean response', async () => {
  for (const exists of [true, false]) {
    const result = await braceletExists('UID', 'https://example.test/', 'public-key', async () => 'jwt', async (url, options) => {
      assert.equal(url, 'https://example.test/rest/v1/rpc/bracelet_exists');
      assert.equal(options.headers.Authorization, 'Bearer jwt');
      assert.deepEqual(JSON.parse(options.body), { bracelet_uid: 'UID' });
      return new Response(JSON.stringify(exists));
    });
    assert.equal(result, exists);
  }
  for (const value of [null, [], {}, 'false', 0]) {
    await assert.rejects(braceletExists('UID', 'https://example.test', 'key', async () => 'jwt', async () => new Response(JSON.stringify(value))));
  }
});

test('configuration/auth/network/server errors never mean the bracelet is new', async () => {
  let requests = 0;
  const request = async () => { requests++; throw new Error('network'); };
  await assert.rejects(braceletExists('UID', undefined, 'key', async () => 'jwt', request));
  await assert.rejects(braceletExists('UID', 'https://example.test', 'key', async () => '', request));
  await assert.rejects(braceletExists('UID', 'https://example.test', 'key', async () => { throw new Error('auth'); }, request));
  assert.equal(requests, 0);
  await assert.rejects(braceletExists('UID', 'https://example.test', 'key', async () => 'jwt', request));
  await assert.rejects(braceletExists('UID', 'https://example.test', 'key', async () => 'jwt', async () => new Response('false', { status: 403 })));
});
