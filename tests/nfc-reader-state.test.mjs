import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInitialNfcReaderState,
  reduceNfcReaderState,
} from '../src/hooks/nfc-reader-state.ts';

test('starts waiting with no current reading', () => {
  assert.deepEqual(createInitialNfcReaderState(), {
    availability: 'available',
    current: { status: 'waiting' },
  });
});

test('a successful reading becomes the current result', () => {
  const state = reduceNfcReaderState(createInitialNfcReaderState(), { type: 'success', identifier: 'A' });

  assert.deepEqual(state.current, { status: 'detected', identifier: 'A' });
});

test('treats a missing identifier as an error', () => {
  let state = createInitialNfcReaderState();
  state = reduceNfcReaderState(state, { type: 'success', identifier: 'known-id' });
  state = reduceNfcReaderState(state, { type: 'success', identifier: '' });

  assert.deepEqual(state.current, {
    status: 'error',
    message: 'No se pudo leer el identificador de la pulsera.',
  });
});

test('a reported failure clears only the current result; a later success recovers', () => {
  let state = createInitialNfcReaderState();
  state = reduceNfcReaderState(state, { type: 'success', identifier: 'known-id' });
  state = reduceNfcReaderState(state, { type: 'error', message: 'Fallo de lectura.' });

  assert.deepEqual(state.current, { status: 'error', message: 'Fallo de lectura.' });

  state = reduceNfcReaderState(state, { type: 'success', identifier: 'new-id' });
  assert.deepEqual(state.current, { status: 'detected', identifier: 'new-id' });
});

test('does not produce a new result when no reader event occurs', () => {
  const state = reduceNfcReaderState(createInitialNfcReaderState(), {
    type: 'success',
    identifier: 'known-id',
  });
  const unchanged = reduceNfcReaderState(state, { type: 'no-event' });

  assert.deepEqual(unchanged, state);
});
