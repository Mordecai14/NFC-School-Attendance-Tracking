import { useEffect, useReducer } from 'react';
import { AppState } from 'react-native';
import NfcManager, { NfcAdapter, NfcEvents } from 'react-native-nfc-manager';

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

const READ_ERROR = 'No se pudo leer la pulsera. Podés volver a intentar.';

export function useNfcReader() {
  const [state, dispatch] = useReducer(
    reduceNfcReaderState,
    undefined,
    createInitialNfcReaderState,
  );

  useEffect(() => {
    let active = true;
    let appIsActive = AppState.currentState !== 'background' && AppState.currentState !== 'inactive';
    let managerStarted = false;
    let managerStart: Promise<void> | null = null;
    let readerAvailable = false;
    let shouldRead = false;
    let registered = false;
    let registration: Promise<void> | null = null;
    let availabilityRequest = 0;

    const ensureManagerStarted = () => {
      if (managerStarted) return Promise.resolve();
      if (!managerStart) {
        managerStart = NfcManager.start()
          .then(() => {
            managerStarted = true;
          })
          .finally(() => {
            managerStart = null;
          });
      }
      return managerStart;
    };

    const unregisterNativeReader = async () => {
      if (!registered) return;
      registered = false;
      await NfcManager.unregisterTagEvent().catch(() => undefined);
    };

    const stopReader = async () => {
      shouldRead = false;
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      const pendingRegistration = registration;
      if (pendingRegistration) await pendingRegistration.catch(() => undefined);
      if (!shouldRead) await unregisterNativeReader();
    };

    const onTagDiscovered = (tag: { id?: string }) => {
      if (!active || !appIsActive || !readerAvailable) return;
      if (typeof tag.id === 'string' && tag.id.trim().length > 0) {
        dispatch({ type: 'success', identifier: tag.id });
      } else {
        dispatch({ type: 'success', identifier: '' });
      }
    };

    const startReader = async () => {
      if (!active || !appIsActive || !readerAvailable) return;
      shouldRead = true;
      NfcManager.setEventListener(NfcEvents.DiscoverTag, onTagDiscovered);
      if (registered) return;
      if (registration) {
        await registration;
        return;
      }

      const pendingRegistration = (async () => {
        try {
          await NfcManager.registerTagEvent({
            isReaderModeEnabled: true,
            readerModeFlags: READER_MODE_FLAGS,
          });
          registered = true;
        } catch {
          if (active) dispatch({ type: 'error', message: READ_ERROR });
        }
      })();
      registration = pendingRegistration;
      await pendingRegistration;
      if (registration === pendingRegistration) registration = null;
      if (!shouldRead) await unregisterNativeReader();
    };

    const refreshAvailability = async () => {
      const request = ++availabilityRequest;
      try {
        await ensureManagerStarted();
        const supported = await NfcManager.isSupported();
        const enabled = supported && (await NfcManager.isEnabled());
        if (!active || request !== availabilityRequest) return;
        readerAvailable = enabled;
        dispatch({ type: 'availability', available: enabled });
        if (enabled && appIsActive) await startReader();
        else await stopReader();
      } catch {
        if (!active || request !== availabilityRequest) return;
        readerAvailable = false;
        dispatch({ type: 'availability', available: false });
        await stopReader();
      }
    };

    NfcManager.setEventListener(NfcEvents.StateChanged, () => {
      void refreshAvailability();
    });
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      appIsActive = nextState === 'active';
      if (appIsActive) void refreshAvailability();
      else void stopReader();
    });

    void refreshAvailability();

    return () => {
      active = false;
      availabilityRequest += 1;
      appStateSubscription.remove();
      NfcManager.setEventListener(NfcEvents.StateChanged, null);
      void stopReader();
    };
  }, []);

  return state;
}
