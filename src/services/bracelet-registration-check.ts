export async function braceletExists(
  uid: string,
  url: string | undefined,
  key: string | undefined,
  getAccessToken: () => Promise<string>,
  request: typeof fetch = fetch,
): Promise<boolean> {
  if (!uid.trim() || !url || !key) throw new Error('Bracelet lookup is not configured');
  const token = await getAccessToken();
  if (!token) throw new Error('School authentication is required');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await request(`${url.replace(/\/$/, '')}/rest/v1/rpc/bracelet_exists`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bracelet_uid: uid }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Bracelet lookup failed');
    const data: unknown = await response.json();
    if (typeof data !== 'boolean') throw new Error('Invalid bracelet lookup response');
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

type State = {
  status: 'idle' | 'checking' | 'exists' | 'available' | 'error';
  uid: string | null;
};

export function createBraceletRegistrationCheck(exists: (uid: string) => Promise<boolean>) {
  let state: State = { status: 'idle', uid: null };
  let revision = 0;
  const listeners = new Set<() => void>();
  const update = (next: State) => { state = next; listeners.forEach(listener => listener()); };

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    clear() {
      revision++;
      update({ status: 'idle', uid: null });
    },
    scan(uid: string): boolean {
      // Keep a verified bracelet attached to its draft until explicitly cleared.
      if (!uid.trim() || state.status === 'available' ||
          (state.uid === uid && ['checking', 'exists'].includes(state.status))) return false;
      const request = ++revision;
      update({ status: 'checking', uid });
      void (async () => {
        try {
          const found = await exists(uid);
          if (request === revision) update({ status: found ? 'exists' : 'available', uid });
        } catch {
          if (request === revision) update({ status: 'error', uid });
        }
      })();
      return true;
    },
  };
}
