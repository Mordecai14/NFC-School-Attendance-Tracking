export type NfcAvailability = 'available' | 'unavailable';

export type NfcCurrentResult =
  | { status: 'waiting' }
  | { status: 'detected'; identifier: string }
  | { status: 'error'; message: string };

export type NfcReaderState = {
  availability: NfcAvailability;
  current: NfcCurrentResult;
  history: string[];
};

export type NfcReaderAction =
  | { type: 'success'; identifier: string }
  | { type: 'error'; message: string }
  | { type: 'availability'; available: boolean }
  | { type: 'no-event' };

const MAX_HISTORY = 5;
const EMPTY_IDENTIFIER_MESSAGE = 'No se pudo leer el identificador de la pulsera.';

export function createInitialNfcReaderState(): NfcReaderState {
  return {
    availability: 'available',
    current: { status: 'waiting' },
    history: [],
  };
}

export function reduceNfcReaderState(
  state: NfcReaderState,
  action: NfcReaderAction,
): NfcReaderState {
  switch (action.type) {
    case 'success': {
      if (!action.identifier.trim()) {
        return {
          ...state,
          current: { status: 'error', message: EMPTY_IDENTIFIER_MESSAGE },
        };
      }

      return {
        ...state,
        current: { status: 'detected', identifier: action.identifier },
        history: [...state.history, action.identifier].slice(-MAX_HISTORY),
      };
    }
    case 'error':
      return {
        ...state,
        current: { status: 'error', message: action.message },
      };
    case 'availability':
      return {
        ...state,
        availability: action.available ? 'available' : 'unavailable',
        current: action.available ? { status: 'waiting' } : state.current,
      };
    case 'no-event':
      return state;
  }
}
