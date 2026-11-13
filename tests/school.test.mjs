import assert from 'node:assert/strict';
import test from 'node:test';
import { createSchoolApi } from '../src/services/school.ts';

const json = value => new Response(JSON.stringify(value));
const api = (respond, token = 'jwt') => createSchoolApi('https://example.test/', 'public-key', async () => token, respond);

test('reads the school name with the staff JWT', async () => {
  const calls = [];
  const school = api(async (url, options) => { calls.push({ url, options }); return json([{ name: '  Colegio Fixture  ' }]); });
  assert.equal(await school.getName(), 'Colegio Fixture');
  assert.match(calls[0].url, /\/rest\/v1\/schools\?select=name&limit=2$/);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer jwt');
  assert.equal(calls[0].options.headers.apikey, 'public-key');
});

test('never picks a school arbitrarily: none, several or an invalid name give no name', async () => {
  for (const rows of [[], [{ name: 'A' }, { name: 'B' }], [{ name: '' }], [{ name: '   ' }], [{ name: 7 }], [null], {}]) {
    assert.equal(await api(async () => json(rows)).getName(), null);
  }
});

test('configuration, authentication and server errors are reported, not hidden as a name', async () => {
  await assert.rejects(createSchoolApi(undefined, 'key', async () => 'jwt').getName(), /not configured/);
  await assert.rejects(api(async () => assert.fail(), '').getName(), /authentication/);
  await assert.rejects(api(async () => new Response('', { status: 401 })).getName(), /failed/);
});
