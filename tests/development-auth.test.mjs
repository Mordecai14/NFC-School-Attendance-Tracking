import assert from 'node:assert/strict';
import test from 'node:test';
import { createDevelopmentAuth } from '../src/services/development-auth.ts';

const configuration = {
  enabled: true, url: 'https://example.test/', publicKey: 'sb_publishable_example',
  email: 'school@example.test', password: 'test-only-password',
};
const identity = { access_token: 'test-token', expires_in: 3600, user: { id: 'test-user' } };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });

test('signs in with password, verifies school access and retains the session in memory', async () => {
  const calls = [];
  const auth = createDevelopmentAuth(configuration, async (url, options) => {
    calls.push({ url, options });
    return json(calls.length === 1 ? identity : [{ school_id: 'test-school' }]);
  });
  const [first, second] = await Promise.all([auth.signIn(), auth.signIn()]);
  assert.equal(first, second);
  assert.equal(first.userId, 'test-user');
  assert.deepEqual(first.schoolIds, ['test-school']);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://example.test/auth/v1/token?grant_type=password');
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    email: configuration.email, password: configuration.password,
  });
  assert.equal(calls[1].options.headers.Authorization, 'Bearer test-token');
  assert.match(calls[1].url, /school_access\?select=school_id&profile_id=eq.test-user$/);
  assert.equal(await auth.getAccessToken(), 'test-token');
  assert.equal(calls.length, 2);
});

test('does not make requests when disabled or missing credentials', async () => {
  const request = async () => { assert.fail('Unexpected authentication request'); };
  await assert.rejects(createDevelopmentAuth({ ...configuration, enabled: false }, request).signIn(), /disabled/);
  await assert.rejects(createDevelopmentAuth({ ...configuration, password: undefined }, request).signIn(), /configured/);
});

test('rejects failed login, invalid responses and accounts without school access', async () => {
  for (const result of [null, {}, { ...identity, expires_in: 0 }]) {
    await assert.rejects(createDevelopmentAuth(configuration, async () => json(result)).signIn(), /Invalid/);
  }
  await assert.rejects(createDevelopmentAuth(configuration, async () => json({}, 400)).signIn(), /failed/);
  for (const links of [[], null, [{ school_id: null }]]) {
    let count = 0;
    const auth = createDevelopmentAuth(configuration, async () => json(++count === 1 ? identity : links));
    await assert.rejects(auth.signIn(), /school access/);
  }
});

test('allows retry after a network failure without retaining a successful session', async () => {
  let count = 0;
  const auth = createDevelopmentAuth(configuration, async () => {
    if (++count === 1) throw new Error('Network unavailable');
    return json(count === 2 ? identity : [{ school_id: 'test-school' }]);
  });
  await assert.rejects(auth.signIn(), /Network/);
  assert.equal((await auth.signIn()).userId, 'test-user');
  assert.equal(count, 3);
});

test('reauthenticates on demand before the in-memory token expires', async () => {
  let time = 1_000;
  let count = 0;
  const auth = createDevelopmentAuth(configuration, async () => {
    count++;
    return json(count % 2 ? identity : [{ school_id: 'test-school' }]);
  }, () => time);
  await auth.signIn();
  time += 3_590_000;
  await auth.getAccessToken();
  assert.equal(count, 4);
});
