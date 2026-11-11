type Tag = { id?: string };
type Consumer = {
  onTag(tag: Tag): void;
  onAvailability(available: boolean): void;
  onError(): void;
};
type Session = { consumer: Consumer; active: boolean; revision: number };

// Native NFC listeners are global. Serialize handoffs across mounted tab screens.
export function createNfcReaderSession(native: {
  start(): Promise<unknown>;
  isSupported(): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  register(): Promise<unknown>;
  unregister(): Promise<unknown>;
  listenTag(listener: ((tag: Tag) => void) | null): void;
  listenState(listener: (() => void) | null): void;
}) {
  let owner: Session | null = null;
  let registered = false;
  let started = false;
  let queue = Promise.resolve();
  const enqueue = (operation: () => Promise<void>, onError?: () => void) => {
    queue = queue.then(operation).catch(() => {
      // Fail closed; a later refresh can retry native cleanup.
      native.listenTag(null);
      onError?.();
    });
    return queue;
  };
  const stop = async () => {
    native.listenTag(null);
    if (registered) {
      await native.unregister();
      registered = false;
    }
  };

  function acquire(consumer: Consumer) {
    const session: Session = { consumer, active: false, revision: 0 };
    owner = session;
    native.listenTag(null);

    const refresh = (active = session.active) => {
      if (owner !== session) return Promise.resolve();
      session.active = active;
      const revision = ++session.revision;
      // Invalidate callbacks synchronously, before asynchronous native cleanup.
      native.listenTag(null);
      const current = () => owner === session && session.active && session.revision === revision;
      return enqueue(async () => {
        await stop();
        if (!current()) return;
        if (!started) {
          await native.start();
          started = true;
        }
        const supported = await native.isSupported();
        const enabled = supported && await native.isEnabled();
        if (!current()) return;
        consumer.onAvailability(enabled);
        if (!enabled) return;
        native.listenTag(tag => { if (current()) consumer.onTag(tag); });
        try {
          await native.register();
          registered = true;
        } catch {
          // Registration may have partially succeeded; clean up before retrying.
          registered = true;
          await stop();
          if (current()) consumer.onError();
          return;
        }
        if (!current()) await stop();
      }, () => { if (current()) consumer.onError(); });
    };
    native.listenState(() => { void refresh(); });

    return {
      refresh,
      release() {
        if (owner !== session) return;
        owner = null;
        session.active = false;
        session.revision++;
        native.listenTag(null);
        native.listenState(null);
        void enqueue(stop);
      },
    };
  }

  return { acquire };
}
