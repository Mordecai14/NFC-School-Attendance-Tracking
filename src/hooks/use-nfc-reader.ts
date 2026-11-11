import { useCallback, useReducer } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';
import NfcManager, { NfcAdapter, NfcEvents } from 'react-native-nfc-manager';

import { createNfcReaderSession } from '../services/nfc-reader-session';
import {
  createInitialNfcReaderState,
  reduceNfcReaderState,
} from './nfc-reader-state';

const READER_MODE_FLAGS =
  NfcAdapter.FLAG_READER_NFC_A |
  NfcAdapter.FLAG_READER_NFC_B |
  NfcAdapter.FLAG_READER_NFC_F |
  NfcAdapter.FLAG_READER_NFC_V |
  NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK;

const reader = createNfcReaderSession({
  start: () => NfcManager.start(),
  isSupported: () => NfcManager.isSupported(),
  isEnabled: () => NfcManager.isEnabled(),
  register: () => NfcManager.registerTagEvent({
    isReaderModeEnabled: true,
    readerModeFlags: READER_MODE_FLAGS,
  }),
  unregister: () => NfcManager.unregisterTagEvent(),
  listenTag: listener => NfcManager.setEventListener(NfcEvents.DiscoverTag, listener),
  listenState: listener => NfcManager.setEventListener(NfcEvents.StateChanged, listener),
});

export function useNfcReader(onRead?: (identifier: string) => boolean) {
  const [state, dispatch] = useReducer(reduceNfcReaderState, undefined, createInitialNfcReaderState);

  useFocusEffect(useCallback(() => {
    const session = reader.acquire({
      onTag(tag) {
        const identifier = typeof tag.id === 'string' ? tag.id : '';
        if (identifier.trim() && onRead && !onRead(identifier)) return;
        dispatch({ type: 'success', identifier });
      },
      onAvailability: available => dispatch({ type: 'availability', available }),
      onError: () => dispatch({ type: 'error', message: 'No se pudo leer la pulsera. Puedes volver a intentar.' }),
    });
    const subscription = AppState.addEventListener('change', next => {
      void session.refresh(next === 'active');
    });
    void session.refresh(AppState.currentState === 'active');
    return () => {
      subscription.remove();
      session.release();
    };
  }, [onRead]));

  return state;
}
