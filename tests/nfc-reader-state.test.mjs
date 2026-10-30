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
    history: [],
  });
});

test('adds successful readings and retains only the latest five', () => {
  let state = createInitialNfcReaderState();

  for (const identifier of ['A', 'B', 'C', 'D', 'E', 'F']) {
    state = reduceNfcReaderState(state, { type: 'success', identifier });
  }

  assert.deepEqual(state.current, { status: 'detected', identifier: 'F' });
  assert.deepEqual(state.history, ['B', 'C', 'D', 'E', 'F']);
});

test('preserves distinct attempts that have the same identifier', () => {
  let state = createInitialNfcReaderState();
  state = reduceNfcReaderState(state, { type: 'success', identifier: 'same-id' });
  state = reduceNfcReaderState(state, { type: 'success', identifier: 'same-id' });

  assert.deepEqual(state.history, ['same-id', 'same-id']);
});

test('treats a missing identifier as an error without changing history', () => {
  let state = createInitialNfcReaderState();
  state = reduceNfcReaderState(state, { type: 'success', identifier: 'known-id' });
  state = reduceNfcReaderState(state, { type: 'success', identifier: '' });

  assert.deepEqual(state.current, {
    status: 'error',
    message: 'No se pudo leer el identificador de la pulsera.',
  });
  assert.deepEqual(state.history, ['known-id']);
});

test('a reported failure clears only the current result; a later success recovers', () => {
  let state = createInitialNfcReaderState();
  state = reduceNfcReaderState(state, { type: 'success', identifier: 'known-id' });
  state = reduceNfcReaderState(state, { type: 'error', message: 'Fallo de lectura.' });

  assert.deepEqual(state.current, { status: 'error', message: 'Fallo de lectura.' });
  assert.deepEqual(state.history, ['known-id']);

  state = reduceNfcReaderState(state, { type: 'success', identifier: 'new-id' });
  assert.deepEqual(state.current, { status: 'detected', identifier: 'new-id' });
  assert.deepEqual(state.history, ['known-id', 'new-id']);
});

test('does not produce a new result when no reader event occurs', () => {
  const state = reduceNfcReaderState(createInitialNfcReaderState(), {
    type: 'success',
    identifier: 'known-id',
  });
  const unchanged = reduceNfcReaderState(state, { type: 'no-event' });

  assert.deepEqual(unchanged, state);
});
