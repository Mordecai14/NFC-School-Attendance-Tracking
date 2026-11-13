import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInitialNfcReaderState,
  reduceNfcReaderState,
} from '../src/hooks/nfc-reader-state.ts';

test('starts waiting with no current reading or history', () => {
  assert.deepEqual(createInitialNfcReaderState(), {
    availability: 'available',
    current: { status: 'waiting' },
    history: { entry: [], exit: [] },
  });
});

test('adds successful readings and retains only the latest five', () => {
  let state = createInitialNfcReaderState();

  for (const identifier of ['A', 'B', 'C', 'D', 'E', 'F']) {
    state = reduceNfcReaderState(state, { type: 'success', identifier, mode: 'entry' });
  }

  assert.deepEqual(state.current, { status: 'detected', identifier: 'F' });
  assert.deepEqual(state.history.entry, ['B', 'C', 'D', 'E', 'F']);
});

test('preserves distinct attempts that have the same identifier', () => {
  let state = createInitialNfcReaderState();
  state = reduceNfcReaderState(state, { type: 'success', mode: 'entry', identifier: 'same-id' });
  state = reduceNfcReaderState(state, { type: 'success', mode: 'entry', identifier: 'same-id' });

  assert.deepEqual(state.history.entry, ['same-id', 'same-id']);
});

test('treats a missing identifier as an error without changing history', () => {
  let state = createInitialNfcReaderState();
  state = reduceNfcReaderState(state, { type: 'success', mode: 'entry', identifier: 'known-id' });
  state = reduceNfcReaderState(state, { type: 'success', mode: 'entry', identifier: '' });

  assert.deepEqual(state.current, {
    status: 'error',
    message: 'No se pudo leer el identificador de la pulsera.',
  });
  assert.deepEqual(state.history.entry, ['known-id']);
});

test('a reported failure clears only the current result; a later success recovers', () => {
  let state = createInitialNfcReaderState();
  state = reduceNfcReaderState(state, { type: 'success', mode: 'entry', identifier: 'known-id' });
  state = reduceNfcReaderState(state, { type: 'error', message: 'Fallo de lectura.' });

  assert.deepEqual(state.current, { status: 'error', message: 'Fallo de lectura.' });
  assert.deepEqual(state.history.entry, ['known-id']);

  state = reduceNfcReaderState(state, { type: 'success', mode: 'entry', identifier: 'new-id' });
  assert.deepEqual(state.current, { status: 'detected', identifier: 'new-id' });
  assert.deepEqual(state.history.entry, ['known-id', 'new-id']);
});

test('does not produce a new result when no reader event occurs', () => {
  const state = reduceNfcReaderState(createInitialNfcReaderState(), {
    type: 'success',
    mode: 'entry',
    identifier: 'known-id',
  });
  const unchanged = reduceNfcReaderState(state, { type: 'no-event' });

  assert.deepEqual(unchanged, state);
});

test('keeps a separate history per mode; switching never clears the other', () => {
  let state = createInitialNfcReaderState();
  state = reduceNfcReaderState(state, { type: 'success', mode: 'entry', identifier: 'in-1' });
  state = reduceNfcReaderState(state, { type: 'success', mode: 'exit', identifier: 'out-1' });
  state = reduceNfcReaderState(state, { type: 'success', mode: 'entry', identifier: 'in-2' });

  assert.deepEqual(state.history, { entry: ['in-1', 'in-2'], exit: ['out-1'] });
});
