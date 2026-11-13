import assert from 'node:assert/strict';
import test from 'node:test';
import { createAttendanceScanner } from '../src/services/attendance-scanner.ts';
import { createAttendanceRecorder } from '../src/services/attendance-recorder.ts';

const student = { id: 'student-a', school_id: 'school-a', bracelet_id: 'bracelet-a', first_name: 'Ana', last_name: 'Fixture', grade: '3', group_name: 'A' };

function setup(lookup = async () => student) {
  const records = [];
  let registration = { status: 'idle', confirmed: null };
  const recorder = {
    getState: () => registration,
    async record(student, type) {
      records.push({ student, type });
      registration = { status: 'saved', confirmed: { event: {
        id: `event-${records.length}`, student_id: student.id, school_id: student.school_id,
        bracelet_id: student.bracelet_id, type, occurred_at: '2026-11-11T07:48:12Z',
      } } };
    },
    async retry() {},
    async confirmRepeat() {},
    async cancelRepeat() {},
  };
  return {
    scanner: createAttendanceScanner({ lookup, recorder }), records, recorder,
    setRegistration(value) { registration = value; },
  };
}

function scanAndWait(scanner, uid) {
  return new Promise(resolve => {
    const unsubscribe = scanner.subscribe(() => {
      if (scanner.getState().status !== 'looking-up') {
        unsubscribe();
        resolve(true);
      }
    });
    if (!scanner.scan(uid)) {
      unsubscribe();
      resolve(false);
    }
  });
}

test('selects exit before scanning and freezes it while the student lookup is in flight', async () => {
  let completeLookup;
  const { scanner, records } = setup(() => new Promise(resolve => { completeLookup = resolve; }));
  assert.equal(scanner.getState().mode, 'entry');
  assert.equal(scanner.selectMode('exit'), true);
  const completion = scanAndWait(scanner, 'uid-a');
  assert.equal(scanner.getState().readingMode, 'exit');
  assert.equal(scanner.selectMode('entry'), false);
  assert.equal(scanner.scan('uid-b'), false);
  completeLookup(student);
  await completion;
  assert.equal(records.length, 1);
  assert.equal(records[0].type, 'exit');
  assert.equal(scanner.getState().status, 'identified');
});

test('changing the mode does not replay a previous reading; the next scan uses the new mode', async () => {
  const { scanner, records } = setup();
  await scanAndWait(scanner, 'uid-a');
  assert.equal(records[0].type, 'entry');
  scanner.selectMode('exit');
  assert.equal(records.length, 1);
  assert.equal(scanner.getState().readingMode, 'entry');
  await scanAndWait(scanner, 'uid-a');
  assert.equal(records.length, 2);
  assert.equal(records[1].type, 'exit');
});

test('the server verdict decides duplicates: no client-side filtering, no recent movement', async () => {
  const fixture = setup();
  fixture.recorder.record = async (student, type) => {
    fixture.records.push({ student, type });
    fixture.setRegistration({ status: 'idle', confirmed: null, error: 'duplicate' });
  };
  await scanAndWait(fixture.scanner, 'uid-a');
  assert.equal(fixture.scanner.getState().status, 'duplicate');
  assert.deepEqual(fixture.scanner.getState().recent, { entry: [], exit: [] });
  await scanAndWait(fixture.scanner, 'uid-a');
  assert.equal(fixture.records.length, 2, 'Every scan is sent; the server rejects repeats');
});

test('a movement that needs confirmation is listed only after the teacher confirms it', async () => {
  const fixture = setup();
  const event = { id: 'event-c', student_id: student.id, school_id: student.school_id, bracelet_id: student.bracelet_id, type: 'entry', occurred_at: '2026-11-11T07:48:12Z' };
  let cancelled = 0;
  fixture.recorder.record = async () => {
    fixture.setRegistration({ status: 'confirm', confirmed: null, pending: { event } });
  };
  fixture.recorder.confirmRepeat = async () => {
    fixture.setRegistration({ status: 'saved', confirmed: { event }, pending: null });
  };
  fixture.recorder.cancelRepeat = async () => { cancelled += 1; };
  await scanAndWait(fixture.scanner, 'uid-a');
  assert.deepEqual(fixture.scanner.getState().recent, { entry: [], exit: [] });
  assert.equal(fixture.scanner.scan('uid-b'), false);

  await fixture.scanner.confirmRepeat();
  assert.equal(fixture.scanner.getState().recent.entry.length, 1);
  assert.equal(fixture.scanner.getState().recent.entry[0].id, 'event-c');

  await fixture.scanner.cancelRepeat();
  assert.equal(cancelled, 1);
});

test('does not accept scans or mode changes while loading, blocked or resolving another event', async () => {
  let lookups = 0;
  const fixture = setup(async () => { lookups++; return student; });
  for (const status of ['loading', 'saving', 'pending', 'blocked']) {
    fixture.setRegistration({ status, confirmed: null });
    assert.equal(fixture.scanner.selectMode('exit'), false);
    assert.equal(fixture.scanner.scan('uid-a'), false);
  }
  assert.equal(lookups, 0);
  assert.equal(fixture.records.length, 0);
});

test('unknown bracelets and lookup failures never trigger an attendance write', async () => {
  const unknown = setup(async () => null);
  await scanAndWait(unknown.scanner, 'unknown');
  assert.equal(unknown.scanner.getState().status, 'unknown');
  assert.equal(unknown.records.length, 0);
  const failed = setup(async () => { throw new Error('Network failed'); });
  await scanAndWait(failed.scanner, 'uid-a');
  assert.equal(failed.scanner.getState().status, 'error');
  assert.equal(failed.records.length, 0);
  assert.equal(failed.scanner.scan('   '), false);
});

test('a bracelet reassigned to another student is not mistaken for a repeated attendance', async () => {
  let currentStudent = student;
  const fixture = setup(async () => currentStudent);
  await scanAndWait(fixture.scanner, 'uid-a');
  currentStudent = { ...student, id: 'student-b', first_name: 'Other' };
  await scanAndWait(fixture.scanner, 'uid-a');
  assert.equal(fixture.records.length, 2);
  assert.equal(fixture.records[1].student.id, 'student-b');
});

test('keeps the registered student per mode, newest first, capped at five; switching mode keeps both lists', async () => {
  const { scanner, setRegistration } = setup();
  await scanAndWait(scanner, 'uid-a');
  scanner.selectMode('exit');
  await scanAndWait(scanner, 'uid-b');
  scanner.selectMode('entry');
  for (let index = 0; index < 6; index += 1) {
    setRegistration({ status: 'idle', confirmed: null });
    scanner.selectMode('entry');
    await scanAndWait(scanner, `uid-${index}`);
  }

  const { recent } = scanner.getState();
  assert.equal(recent.exit.length, 1);
  assert.equal(recent.exit[0].student.first_name, 'Ana');
  assert.equal(recent.exit[0].occurred_at, '2026-11-11T07:48:12Z');
  assert.equal(recent.entry.length, 5);
  assert.equal(new Set(recent.entry.map(item => item.id)).size, 5);
});

test('unknown bracelets and lookup errors add no recent movement', async () => {
  const unknown = setup(async () => null);
  await scanAndWait(unknown.scanner, 'uid-x');
  const failing = setup(async () => { throw new Error('offline'); });
  await scanAndWait(failing.scanner, 'uid-y');
  assert.deepEqual(unknown.scanner.getState().recent, { entry: [], exit: [] });
  assert.deepEqual(failing.scanner.getState().recent, { entry: [], exit: [] });
});

// The scanner with the real recorder: server verdicts that arrive after a retry or a confirmation.
function realSetup(send) {
  let journal = null;
  let ids = 0;
  const recorder = createAttendanceRecorder({
    storage: { async getItem() { return journal; }, async setItem(v) { journal = v; }, async removeItem() { journal = null; } },
    getDeviceId: async () => 'ab000000-0000-4000-8000-000000000004',
    newId: () => `ab000000-0000-4000-8000-0000000000${String(++ids).padStart(2, '0')}`,
    now: () => '2026-11-11T07:48:12.000Z',
    send,
  });
  const ids3 = { id: 'ab000000-0000-4000-8000-000000000001', school_id: 'ab000000-0000-4000-8000-000000000002', bracelet_id: 'ab000000-0000-4000-8000-000000000003' };
  const real = { ...student, ...ids3 };
  return { recorder, scanner: createAttendanceScanner({ lookup: async () => real, recorder }), getJournal: () => journal };
}
const rejection = kind => Object.assign(new Error(kind), { name: 'AttendanceRejection', kind });

test('a retry rejected as duplicate is reported and never listed as a recent movement', async () => {
  let attempt = 0;
  const fixture = realSetup(async event => {
    attempt += 1;
    if (attempt === 1) throw new Error('network');
    throw rejection('duplicate');
  });
  await fixture.recorder.initialize();
  await scanAndWait(fixture.scanner, 'uid-a');
  assert.equal(fixture.recorder.getState().status, 'pending');
  assert.deepEqual(fixture.scanner.getState().recent, { entry: [], exit: [] });
  await fixture.scanner.retry();
  assert.equal(fixture.recorder.getState().error, 'duplicate');
  assert.equal(fixture.scanner.getState().status, 'duplicate');
  assert.deepEqual(fixture.scanner.getState().recent, { entry: [], exit: [] });
  assert.equal(fixture.getJournal(), null);
});

test('a confirmation rejected as duplicate is reported; a confirmed movement is listed; cancel leaves no stale reading', async () => {
  let mode = 'duplicate';
  const fixture = realSetup(async (event, options) => {
    if (!options?.confirmed) throw rejection('confirmation-required');
    if (mode === 'duplicate') throw rejection('duplicate');
    return { id: event.id, type: event.type, occurred_at: event.occurred_at };
  });
  await fixture.recorder.initialize();
  await scanAndWait(fixture.scanner, 'uid-a');
  assert.equal(fixture.recorder.getState().status, 'confirm');
  await fixture.scanner.confirmRepeat();
  assert.equal(fixture.scanner.getState().status, 'duplicate');
  assert.deepEqual(fixture.scanner.getState().recent, { entry: [], exit: [] });

  mode = 'ok';
  await scanAndWait(fixture.scanner, 'uid-a');
  await fixture.scanner.confirmRepeat();
  assert.equal(fixture.scanner.getState().recent.entry.length, 1);

  await scanAndWait(fixture.scanner, 'uid-a');
  await fixture.scanner.cancelRepeat();
  assert.equal(fixture.scanner.getState().status, 'ready');
  assert.equal(fixture.scanner.getState().student, null);
  assert.equal(fixture.getJournal(), null);
});
