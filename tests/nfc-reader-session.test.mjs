import assert from 'node:assert/strict';
import test from 'node:test';
import { createNfcReaderSession } from '../src/services/nfc-reader-session.ts';

function setup() {
  let tagListener = null;
  let stateListener = null;
  let enabled = true;
  let registering = async () => {};
  let unregistering = async () => {};
  let readers = 0;
  const calls = [];
  const reader = createNfcReaderSession({
    async start() { calls.push('start'); },
    async isSupported() { return true; },
    async isEnabled() { return enabled; },
    async register() {
      calls.push('register');
      await registering();
      readers++;
      assert.equal(readers, 1, 'only one native reader may be registered');
    },
    async unregister() { calls.push('unregister'); await unregistering(); readers--; },
    listenTag(listener) { tagListener = listener; },
    listenState(listener) { stateListener = listener; },
  });
  const consumer = () => {
    const tags = [];
    const availability = [];
    const errors = [];
    const session = reader.acquire({ onTag: tag => tags.push(tag.id), onAvailability: value => availability.push(value), onError: () => errors.push(true) });
    return { session, tags, availability, errors };
  };
  return {
    consumer, calls,
    tag: () => tagListener,
    state: () => stateListener,
    setEnabled(value) { enabled = value; },
    setRegistration(value) { registering = value; },
    setUnregistration(value) { unregistering = value; },
  };
}

test('hands NFC to registration and rejects callbacks from the old attendance tab', async () => {
  const f = setup();
  const attendance = f.consumer();
  await attendance.session.refresh(true);
  const oldCallback = f.tag();
  oldCallback({ id: 'attendance' });
  attendance.session.release();
  oldCallback({ id: 'late' });
  const registration = f.consumer();
  await registration.session.refresh(true);
  f.tag()({ id: 'bracelet-for-form' });
  attendance.session.release(); // A late blur must not disable the new owner.
  assert.ok(f.tag());
  assert.deepEqual(attendance.tags, ['attendance']);
  assert.deepEqual(registration.tags, ['bracelet-for-form']);
  assert.deepEqual(f.calls, ['start', 'register', 'unregister', 'register']);
});

test('leaving for a non-reading tab stops callbacks and returning enables reading again', async () => {
  const f = setup();
  const first = f.consumer();
  await first.session.refresh(true);
  first.session.release();
  assert.equal(f.tag(), null);
  assert.equal(f.state(), null);
  const returned = f.consumer();
  await returned.session.refresh(true);
  f.tag()({ id: 'new-read' });
  assert.deepEqual(returned.tags, ['new-read']);
});

test('serializes a pending native registration before acquiring another tab', async () => {
  const f = setup();
  let complete;
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  f.setRegistration(() => new Promise(resolve => { complete = resolve; entered(); }));
  const old = f.consumer();
  const pending = old.session.refresh(true);
  await started;
  const oldCallback = f.tag();
  old.session.release();
  const next = f.consumer();
  f.setRegistration(async () => {});
  const transferred = next.session.refresh(true);
  oldCallback({ id: 'stale' });
  complete();
  await Promise.all([pending, transferred]);
  f.tag()({ id: 'new' });
  assert.deepEqual(old.tags, []);
  assert.deepEqual(next.tags, ['new']);
  assert.deepEqual(f.calls, ['start', 'register', 'unregister', 'register']);
});

test('backgrounding disables immediately; foreground and NFC availability restore only current owner', async () => {
  const f = setup();
  const current = f.consumer();
  await current.session.refresh(true);
  const oldCallback = f.tag();
  const background = current.session.refresh(false);
  oldCallback({ id: 'background' });
  assert.equal(f.tag(), null);
  await background;
  f.setEnabled(false);
  await current.session.refresh(true);
  assert.equal(f.tag(), null);
  assert.deepEqual(current.availability, [true, false]);
  f.setEnabled(true);
  await current.session.refresh(true);
  f.tag()({ id: 'foreground' });
  assert.deepEqual(current.tags, ['foreground']);
});

test('rapid focus changes skip stale queued sessions', async () => {
  const f = setup();
  const a = f.consumer();
  const pa = a.session.refresh(true);
  const b = f.consumer();
  const pb = b.session.refresh(true);
  a.session.release();
  const c = f.consumer();
  const pc = c.session.refresh(true);
  b.session.release();
  await Promise.all([pa, pb, pc]);
  f.tag()({ id: 'last-tab' });
  assert.deepEqual(a.tags, []);
  assert.deepEqual(b.tags, []);
  assert.deepEqual(c.tags, ['last-tab']);
  assert.deepEqual(f.calls, ['start', 'register']);
});

test('failed native cleanup blocks the next reader until cleanup succeeds', async () => {
  const f = setup();
  const a = f.consumer();
  await a.session.refresh(true);
  f.setUnregistration(async () => { throw new Error('native busy'); });
  a.session.release();
  const b = f.consumer();
  await b.session.refresh(true);
  assert.equal(f.tag(), null);
  assert.equal(b.errors.length, 1);
  assert.equal(f.calls.filter(call => call === 'register').length, 1);
  f.setUnregistration(async () => {});
  await b.session.refresh(true);
  f.tag()({ id: 'recovered' });
  assert.deepEqual(b.tags, ['recovered']);
});

test('a delayed native unregister cannot disable the reader of the next tab', async () => {
  const f = setup();
  const a = f.consumer();
  await a.session.refresh(true);
  let complete;
  let entered;
  const stopping = new Promise(resolve => { entered = resolve; });
  f.setUnregistration(() => new Promise(resolve => { complete = resolve; entered(); }));
  a.session.release();
  await stopping;
  const b = f.consumer();
  const ready = b.session.refresh(true);
  assert.equal(f.tag(), null);
  assert.equal(f.calls.filter(call => call === 'register').length, 1);
  complete();
  await ready;
  f.tag()({ id: 'registration' });
  assert.deepEqual(b.tags, ['registration']);
});

test('a native state-change callback from a released tab cannot restart reading', async () => {
  const f = setup();
  const a = f.consumer();
  await a.session.refresh(true);
  const staleStateListener = f.state();
  a.session.release();
  staleStateListener();
  const b = f.consumer();
  await b.session.refresh(true);
  assert.deepEqual(f.calls, ['start', 'register', 'unregister', 'register']);
  f.tag()({ id: 'current' });
  assert.deepEqual(a.tags, []);
  assert.deepEqual(b.tags, ['current']);
});
