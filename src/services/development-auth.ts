export type DevelopmentLoginConfiguration = {
  enabled: boolean;
  url?: string;
  publicKey?: string;
  email?: string;
  password?: string;
};

export type SchoolSession = {
  accessToken: string;
  expiresAt: number;
  userId: string;
  schoolIds: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

export function createDevelopmentAuth(
  config: DevelopmentLoginConfiguration,
  request: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  let session: SchoolSession | null = null;
  let pending: Promise<SchoolSession> | null = null;

  async function requestJson(url: string, options: RequestInit): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await request(url, { ...options, signal: controller.signal });
      if (!response.ok) throw new Error('School authentication request failed');
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function authenticate(): Promise<SchoolSession> {
    if (!config.enabled) throw new Error('Development login is disabled');
    const { url, publicKey, email, password } = config;
    if (!url || !publicKey || !email || !password) {
      throw new Error('Development login is not configured');
    }

    const baseUrl = url.replace(/\/$/, '');
    const result = await requestJson(`${baseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: publicKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (
      !isRecord(result) || typeof result.access_token !== 'string' || !result.access_token ||
      typeof result.expires_in !== 'number' || !Number.isFinite(result.expires_in) || result.expires_in <= 0 ||
      !isRecord(result.user) || typeof result.user.id !== 'string' || !result.user.id
    ) throw new Error('Invalid authentication response');

    const accessToken = result.access_token;
    const userId = result.user.id;
    const expiresAt = now() + result.expires_in * 1000;
    const links = await requestJson(
      `${baseUrl}/rest/v1/school_access?select=school_id&profile_id=eq.${encodeURIComponent(userId)}`,
      { headers: { apikey: publicKey, Authorization: `Bearer ${accessToken}` } },
    );
    if (
      !Array.isArray(links) || links.length === 0 ||
      links.some(link => !isRecord(link) || typeof link.school_id !== 'string' || !link.school_id)
    ) throw new Error('Account has no verified school access');

    return { accessToken, expiresAt, userId, schoolIds: links.map(link => link.school_id) };
  }

  function signIn(): Promise<SchoolSession> {
    if (session && session.expiresAt > now() + 30_000) return Promise.resolve(session);
    if (!pending) {
      session = null;
      pending = authenticate()
        .then(result => { session = result; return result; })
        .finally(() => { pending = null; });
    }
    return pending;
  }

  return {
    signIn,
    async getAccessToken() { return (await signIn()).accessToken; },
  };
}
