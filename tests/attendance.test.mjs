import assert from 'node:assert/strict';
import test from 'node:test';
import { AttendanceRejection, createAttendanceApi } from '../src/services/attendance.ts';
import { createAttendanceRecorder } from '../src/services/attendance-recorder.ts';

const uuid = n => `ab000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const student = { id: uuid(1), school_id: uuid(2), bracelet_id: uuid(3), first_name: 'Ana', last_name: 'Fixture', grade: '3', group_name: 'A' };
const time = '2026-11-10T12:00:00.000Z';
const event = { id: uuid(5), school_id: uuid(2), student_id: uuid(1), bracelet_id: uuid(3), device_id: uuid(4), type: 'entry', occurred_at: time };
const response = value => new Response(JSON.stringify(value));
const receipt = value => ({ id: value.id, type: value.type, occurred_at: value.occurred_at });

function setup(overrides = {}) {
  let value = null;
  let ids = 4;
  const sent = [];
  const storage = {
    async getItem() { return value; },
    async setItem(next) { value = next; },
    async removeItem() { value = null; },
  };
  const options = {
    storage, getDeviceId: async () => uuid(4), newId: () => uuid(++ids), now: () => time,
    async send(event) { assert.ok(value, 'Event must be persisted first'); sent.push(event); return receipt(event); },
    ...overrides,
  };
  return { options, storage, sent, getStored: () => value, recorder: createAttendanceRecorder(options) };
}

test('records a frozen event and confirms only after server acknowledgement and journal cleanup', async () => {
  const fixture = setup();
  await fixture.recorder.initialize();
  await fixture.recorder.record(student, 'entry');
  assert.deepEqual(fixture.sent, [event]);
  assert.equal(fixture.getStored(), null);
  assert.equal(fixture.recorder.getState().status, 'saved');
  assert.equal(fixture.recorder.getState().confirmed.studentName, 'Ana Fixture');
});

test('a lost response survives a restart and retries with the exact same ID and payload', async () => {
  const attempts = [];
  const fixture = setup({ async send(event) { attempts.push({ ...event }); throw new Error('Lost response'); } });
  await fixture.recorder.initialize();
  await fixture.recorder.record(student, 'exit');
  assert.equal(fixture.recorder.getState().status, 'pending');
  const restored = createAttendanceRecorder({ ...fixture.options, send: async event => { attempts.push({ ...event }); return receipt(event); } });
  await restored.initialize();
  await restored.record({ ...student, first_name: 'Another child' }, 'entry');
  assert.equal(attempts.length, 1, 'Pending event must block new registrations');
  await restored.retry();
  assert.deepEqual(attempts[0], attempts[1]);
  assert.equal(restored.getState().status, 'saved');
  assert.equal(restored.getState().confirmed.studentName, 'Ana Fixture');
});

test('does not send when storage fails and does not silently discard malformed pending data', async () => {
  let sent = false;
  const fixture = setup({
    storage: { async getItem() { return null; }, async setItem() { throw new Error('Disk full'); }, async removeItem() {} },
    async send() { sent = true; return receipt(event); },
  });
  await fixture.recorder.initialize();
  await fixture.recorder.record(student, 'entry');
  assert.equal(sent, false);
  assert.equal(fixture.recorder.getState().status, 'pending');
  assert.equal(fixture.recorder.getState().pending.event.id, uuid(5));
  const corrupt = setup({ storage: { async getItem() { return 'broken'; }, async setItem() { assert.fail(); }, async removeItem() { assert.fail(); } } });
  await corrupt.recorder.initialize();
  await corrupt.recorder.record(student, 'entry');
  assert.equal(corrupt.recorder.getState().status, 'blocked');
});

test('a journal cleanup failure retains the event for an idempotent retry', async () => {
  const fixture = setup();
  const remove = fixture.storage.removeItem;
  fixture.storage.removeItem = async () => { throw new Error('Storage unavailable'); };
  await fixture.recorder.initialize();
  await fixture.recorder.record(student, 'entry');
  assert.equal(fixture.recorder.getState().status, 'pending');
  fixture.storage.removeItem = remove;
  await fixture.recorder.retry();
  assert.deepEqual(fixture.sent[0], fixture.sent[1]);
  assert.equal(fixture.recorder.getState().status, 'saved');
});

test('double presses produce only one event while a request is in flight', async () => {
  let finish;
  const fixture = setup({ send: () => new Promise(resolve => { finish = resolve; }) });
  await fixture.recorder.initialize();
  const first = fixture.recorder.record(student, 'entry');
  await new Promise(resolve => setImmediate(resolve));
  await fixture.recorder.record(student, 'exit');
  assert.equal(JSON.parse(fixture.getStored()).event.type, 'entry');
  finish(receipt(event));
  await first;
  assert.equal(fixture.recorder.getState().status, 'saved');
});

test('a device preparation failure does not send an event and allows another explicit attempt', async () => {
  let unavailable = true;
  const fixture = setup({ getDeviceId: async () => {
    if (unavailable) throw new Error('No unambiguous device');
    return uuid(4);
  } });
  await fixture.recorder.initialize();
  await fixture.recorder.record(student, 'entry');
  assert.equal(fixture.recorder.getState().error, 'prepare');
  assert.equal(fixture.sent.length, 0);
  assert.equal(fixture.getStored(), null);
  unavailable = false;
  await fixture.recorder.record(student, 'entry');
  assert.equal(fixture.recorder.getState().status, 'saved');
});

test('API selects only an unambiguous active school device and sends JWT and stable event data', async () => {
  const calls = [];
  const api = createAttendanceApi('https://example.test/', 'public-key', async () => 'jwt', async (url, options) => {
    calls.push({ url, options });
    return response(url.includes('devices?') ? [{ id: uuid(4) }] : [receipt(event)]);
  });
  assert.equal(await api.getDeviceId(student), uuid(4));
  assert.match(calls[0].url, /school_id=eq\..*&active=eq.true&limit=2/);
  assert.deepEqual(await api.send(event), receipt(event));
  assert.equal(calls[1].options.headers.Authorization, 'Bearer jwt');
  assert.equal(JSON.parse(calls[1].options.body).event_id, event.id);
  assert.equal(JSON.parse(calls[1].options.body).event_occurred_at, time);
});

test('API rejects ambiguous devices, mismatched confirmations, authorization and network errors', async () => {
  for (const devices of [[], [{ id: uuid(4) }, { id: uuid(6) }], [{ id: null }]]) {
    const api = createAttendanceApi('https://example.test', 'key', async () => 'jwt', async () => response(devices));
    await assert.rejects(api.getDeviceId(student));
  }
  for (const result of [[], [{ ...receipt(event), id: uuid(9) }], [{ ...receipt(event), type: 'exit' }], [{ ...receipt(event), occurred_at: 'invalid' }]]) {
    const api = createAttendanceApi('https://example.test', 'key', async () => 'jwt', async () => response(result));
    await assert.rejects(api.send(event));
  }
  const denied = createAttendanceApi('https://example.test', 'key', async () => '', async () => assert.fail());
  await assert.rejects(denied.send(event), /authentication/);
  const failed = createAttendanceApi('https://example.test', 'key', async () => 'jwt', async () => new Response('', { status: 403 }));
  await assert.rejects(failed.send(event), /failed/);
});

test('API maps the daily-rule error codes to typed rejections and only sends the confirmation when asked', async () => {
  const bodies = [];
  const reject = code => createAttendanceApi('https://example.test', 'key', async () => 'jwt',
    async () => new Response(JSON.stringify({ code, message: 'x' }), { status: 400 }));
  await assert.rejects(reject('AT001').send(event), error => error instanceof AttendanceRejection && error.kind === 'duplicate');
  await assert.rejects(reject('AT002').send(event), error => error instanceof AttendanceRejection && error.kind === 'confirmation-required');
  await assert.rejects(reject('42501').send(event), error => !(error instanceof AttendanceRejection) && /failed/.test(error.message));
  const api = createAttendanceApi('https://example.test', 'key', async () => 'jwt', async (url, options) => {
    bodies.push(JSON.parse(options.body));
    return response([receipt(event)]);
  });
  await api.send(event);
  await api.send(event, { confirmed: true });
  assert.equal('event_confirmed' in bodies[0], false);
  assert.equal(bodies[1].event_confirmed, true);
});

test('a duplicate rejection stores nothing, clears the journal and lets the next scan proceed', async () => {
  const fixture = setup({ async send() { throw new AttendanceRejection('duplicate'); } });
  await fixture.recorder.initialize();
  await fixture.recorder.record(student, 'entry');
  const state = fixture.recorder.getState();
  assert.equal(state.status, 'idle');
  assert.equal(state.error, 'duplicate');
  assert.equal(state.pending, null);
  assert.equal(fixture.getStored(), null);
  await fixture.recorder.record(student, 'entry');
  assert.equal(fixture.recorder.getState().error, 'duplicate');
});

test('a confirmation request keeps the journal and resends the same event once the teacher accepts', async () => {
  const sent = [];
  const fixture = setup({
    async send(event, options) {
      sent.push({ id: event.id, confirmed: options?.confirmed === true });
      if (!options?.confirmed) throw new AttendanceRejection('confirmation-required');
      return receipt(event);
    },
  });
  await fixture.recorder.initialize();
  await fixture.recorder.record(student, 'entry');
  assert.equal(fixture.recorder.getState().status, 'confirm');
  assert.equal(fixture.recorder.getState().pending.event.type, 'entry');
  assert.ok(fixture.getStored(), 'The event must stay journaled while waiting for the teacher');
  await fixture.recorder.record(student, 'exit'); // ignored while a confirmation is open
  assert.equal(sent.length, 1);

  await fixture.recorder.confirmRepeat();
  assert.deepEqual(sent, [{ id: uuid(5), confirmed: false }, { id: uuid(5), confirmed: true }]);
  assert.equal(fixture.recorder.getState().status, 'saved');
  assert.equal(fixture.recorder.getState().confirmed.event.id, uuid(5));
  assert.equal(fixture.getStored(), null);
});

test('declining a confirmation clears the journal without storing anything; a restart asks again', async () => {
  const reject = async () => { throw new AttendanceRejection('confirmation-required'); };
  const fixture = setup({ send: reject });
  await fixture.recorder.initialize();
  await fixture.recorder.record(student, 'entry');
  await fixture.recorder.cancelRepeat();
  assert.equal(fixture.recorder.getState().status, 'idle');
  assert.equal(fixture.recorder.getState().pending, null);
  assert.equal(fixture.getStored(), null);

  const again = setup({ send: reject });
  await again.recorder.initialize();
  await again.recorder.record(student, 'entry');
  const restarted = createAttendanceRecorder({ ...again.options });
  await restarted.initialize();
  assert.equal(restarted.getState().status, 'pending');
  await restarted.retry();
  assert.equal(restarted.getState().status, 'confirm');
});
