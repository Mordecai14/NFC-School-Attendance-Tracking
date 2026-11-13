export function createSchoolApi(
  url: string | undefined,
  key: string | undefined,
  getAccessToken: () => Promise<string>,
  request: typeof fetch = fetch,
) {
  return {
    // RLS limits the result to the signed-in staff's schools; never pick one arbitrarily.
    async getName(): Promise<string | null> {
      if (!url || !key) throw new Error('Supabase is not configured');
      const token = await getAccessToken();
      if (!token) throw new Error('School authentication is required');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await request(`${url.replace(/\/$/, '')}/rest/v1/schools?select=name&limit=2`, {
          method: 'GET',
          headers: { apikey: key, Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('School request failed');
        const data: unknown = await response.json();
        if (!Array.isArray(data) || data.length !== 1) return null;
        const name = (data[0] as { name?: unknown } | null)?.name;
        return typeof name === 'string' && name.trim() ? name.trim() : null;
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
