import assert from 'node:assert/strict';
import test from 'node:test';
import { createAttendanceScanner } from '../src/services/attendance-scanner.ts';

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
  };
  return {
    scanner: createAttendanceScanner({ lookup, recorder }), records,
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

test('suppresses repeated callbacks for the last confirmed bracelet until explicitly rearmed', async () => {
  const { scanner, records } = setup();
  await scanAndWait(scanner, 'uid-a');
  await scanAndWait(scanner, 'uid-a');
  assert.equal(records.length, 1);
  assert.equal(scanner.getState().status, 'duplicate');
  scanner.selectMode('entry');
  assert.equal(records.length, 1);
  await scanAndWait(scanner, 'uid-a');
  assert.equal(records.length, 2);
  await scanAndWait(scanner, 'uid-a');
  assert.equal(records.length, 2);
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

test('a recovered confirmation also protects against a repeated scan after retrying a pending event', async () => {
  const fixture = setup();
  fixture.setRegistration({ status: 'saved', confirmed: { event: {
    id: 'recovered-event', student_id: student.id, school_id: student.school_id,
    bracelet_id: student.bracelet_id, type: 'entry',
  } } });
  await scanAndWait(fixture.scanner, 'uid-a');
  assert.equal(fixture.records.length, 0);
  assert.equal(fixture.scanner.getState().status, 'duplicate');
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

test('unknown bracelets, errors and repeated callbacks add no recent movement', async () => {
  const unknown = setup(async () => null);
  await scanAndWait(unknown.scanner, 'uid-x');
  const failing = setup(async () => { throw new Error('offline'); });
  await scanAndWait(failing.scanner, 'uid-y');
  const repeated = setup();
  await scanAndWait(repeated.scanner, 'uid-a');
  await scanAndWait(repeated.scanner, 'uid-a');

  assert.deepEqual(unknown.scanner.getState().recent, { entry: [], exit: [] });
  assert.deepEqual(failing.scanner.getState().recent, { entry: [], exit: [] });
  assert.equal(repeated.scanner.getState().status, 'duplicate');
  assert.equal(repeated.scanner.getState().recent.entry.length, 1);
});
