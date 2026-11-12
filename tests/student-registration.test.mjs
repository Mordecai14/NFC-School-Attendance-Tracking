import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createStudentRegistrar, createStudentRegistrationApi, normalizeDraft, RegistrationRejected,
} from '../src/services/student-registration.ts';

const id = n => `bcaf0000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const draft = { first_name: ' Ana ', last_name: ' Fixture ', student_number: '', grade: '3', group_name: 'A' };
const receipt = attempt => ({ registration_id: attempt.registration_id, school_id: attempt.school_id,
  bracelet_uid: attempt.bracelet_uid, student_id: id(3), bracelet_id: id(4) });
function fixture(overrides = {}) {
  let raw = null;
  const sent = [];
  const storage = {
    async getItem() { return raw; }, async setItem(value) { raw = value; }, async removeItem() { raw = null; },
  };
  const options = {
    storage, getSchoolId: async () => id(2), newId: () => id(1),
    async send(attempt) { assert.ok(raw); sent.push(structuredClone(attempt)); return receipt(attempt); },
    ...overrides,
  };
  return { options, storage, sent, getRaw: () => raw, setRaw: value => { raw = value; } };
}

test('normalizes names without splitting a full name or inventing a required enrollment/grade', () => {
  assert.equal(normalizeDraft(draft).first_name, 'Ana');
  for (const invalid of [{ ...draft, first_name: ' ' }, { ...draft, last_name: '' }, { ...draft, first_name: 'x'.repeat(101) }]) {
    assert.throws(() => normalizeDraft(invalid), RegistrationRejected);
  }
});

test('saves a frozen request before sending, confirms the pair, and requires explicit reset', async () => {
  const f = fixture();
  const registrar = createStudentRegistrar(f.options);
  await registrar.initialize();
  await registrar.register(draft, 'UID');
  assert.equal(f.sent.length, 1);
  assert.equal(f.sent[0].first_name, 'Ana');
  assert.equal(registrar.getState().status, 'saved');
  assert.equal(f.getRaw(), null);
  await registrar.register(draft, 'OTHER');
  assert.equal(f.sent.length, 1);
  assert.equal(registrar.clear(), true);
  assert.equal(registrar.getState().status, 'idle');
});

test('lost response survives restart and retries the same UUID, school, UID and data', async () => {
  const f = fixture();
  const delivered = [];
  let lost = true;
  f.options.send = async attempt => {
    delivered.push(structuredClone(attempt));
    if (lost) throw new Error('lost response');
    return receipt(attempt);
  };
  const first = createStudentRegistrar(f.options);
  await first.initialize();
  await first.register(draft, 'UID');
  assert.equal(first.getState().status, 'pending');
  assert.equal(first.clear(), false);
  const restored = createStudentRegistrar(f.options);
  await restored.initialize();
  assert.equal(restored.getState().status, 'pending');
  lost = false;
  await restored.retry();
  assert.deepEqual(delivered[0], delivered[1]);
  assert.equal(restored.getState().status, 'saved');
});

test('double presses, blur-like reset and further submissions cannot replace an in-flight attempt', async () => {
  let complete;
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  const f = fixture({ send: attempt => new Promise(resolve => { complete = () => resolve(receipt(attempt)); entered(); }) });
  const registrar = createStudentRegistrar(f.options);
  await registrar.initialize();
  const pending = registrar.register(draft, 'UID');
  await started;
  assert.equal(registrar.clear(), false);
  await registrar.register({ ...draft, first_name: 'Different' }, 'OTHER');
  complete();
  await pending;
  assert.equal(registrar.getState().attempt.bracelet_uid, 'UID');
  assert.equal(registrar.getState().attempt.first_name, 'Ana');
});

test('local write failures never send and cleanup failure preserves idempotent recovery', async () => {
  const f = fixture();
  let fails = true;
  f.storage.setItem = async value => { if (fails) throw new Error('disk'); f.setRaw(value); };
  const registrar = createStudentRegistrar(f.options);
  await registrar.initialize();
  await registrar.register(draft, 'UID');
  assert.equal(f.sent.length, 0);
  assert.equal(registrar.getState().error, 'storage');
  fails = false;
  f.storage.removeItem = async () => { throw new Error('cleanup'); };
  await registrar.retry();
  assert.equal(registrar.getState().status, 'pending');
  assert.ok(f.getRaw());
  f.storage.removeItem = async () => f.setRaw(null);
  await registrar.retry();
  assert.deepEqual(f.sent[0], f.sent[1]);
  assert.equal(registrar.getState().status, 'saved');
});

test('malformed durable attempts block without deleting or sending them', async () => {
  const f = fixture();
  f.setRaw('{broken');
  const registrar = createStudentRegistrar(f.options);
  await registrar.initialize();
  assert.equal(registrar.getState().status, 'blocked');
  assert.equal(registrar.clear(), false);
  assert.equal(f.getRaw(), '{broken');
  await registrar.register(draft, 'UID');
  assert.equal(f.sent.length, 0);
});

test('definitive conflict can be cleared but lost authorization preserves an uncertain attempt', async () => {
  for (const reason of ['conflict', 'invalid', 'forbidden']) {
    const f = fixture({ send: async () => { throw new RegistrationRejected(reason); } });
    const registrar = createStudentRegistrar(f.options);
    await registrar.initialize();
    await registrar.register(draft, 'UID');
    assert.equal(registrar.getState().status, reason === 'forbidden' ? 'pending' : 'rejected');
    assert.equal(f.getRaw() !== null, reason === 'forbidden');
  }
});

test('invalid inputs and ambiguous/preparation errors cannot send a registration', async () => {
  const f = fixture({ getSchoolId: async () => { throw new Error('ambiguous school'); } });
  const registrar = createStudentRegistrar(f.options);
  await registrar.initialize();
  await registrar.register({ ...draft, last_name: '' }, 'UID');
  assert.equal(registrar.getState().error, 'invalid');
  await registrar.register(draft, 'UID');
  assert.equal(registrar.getState().error, 'prepare');
  assert.equal(f.sent.length, 0);
  assert.equal(f.getRaw(), null);
});

test('API sends authenticated frozen arguments and validates confirmation against the request', async () => {
  const attempt = { ...normalizeDraft(draft), version: 1, registration_id: id(1), school_id: id(2), bracelet_uid: 'UID' };
  const api = createStudentRegistrationApi('https://example.test/', 'key', async () => 'jwt', async (url, options) => {
    assert.equal(url, 'https://example.test/rest/v1/rpc/register_student');
    assert.equal(options.headers.Authorization, 'Bearer jwt');
    assert.equal(JSON.parse(options.body).p_registration_id, attempt.registration_id);
    assert.equal(JSON.parse(options.body).p_bracelet_uid, 'UID');
    return new Response(JSON.stringify(receipt(attempt)));
  });
  assert.deepEqual(await api(attempt), receipt(attempt));
  for (const changed of [{ school_id: id(6) }, { bracelet_uid: 'OTHER' }, { student_id: 'invalid' }, { registration_id: id(8) }]) {
    const invalid = createStudentRegistrationApi('https://example.test', 'key', async () => 'jwt', async () => new Response(JSON.stringify({ ...receipt(attempt), ...changed })));
    await assert.rejects(invalid(attempt));
  }
});

test('API classifies only explicit SQL rejection codes; a server error remains uncertain', async () => {
  const attempt = { ...normalizeDraft(draft), version: 1, registration_id: id(1), school_id: id(2), bracelet_uid: 'UID' };
  for (const [code, reason] of [['23505', 'conflict'], ['22023', 'invalid'], ['42501', 'forbidden']]) {
    const api = createStudentRegistrationApi('https://example.test', 'key', async () => 'jwt', async () => new Response(JSON.stringify({ code }), { status: 400 }));
    await assert.rejects(api(attempt), error => error instanceof RegistrationRejected && error.reason === reason);
  }
  const api = createStudentRegistrationApi('https://example.test', 'key', async () => 'jwt', async () => new Response('unavailable', { status: 503 }));
  await assert.rejects(api(attempt), error => !(error instanceof RegistrationRejected));
});
