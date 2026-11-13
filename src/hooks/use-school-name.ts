import { useEffect, useState } from 'react';
import Constants from 'expo-constants';

import { developmentAuth } from '@/hooks/use-development-login';
import { createSchoolApi } from '@/services/school';

const extra = Constants.expoConfig?.extra;
const api = createSchoolApi(extra?.supabaseUrl, extra?.supabasePublishableKey, developmentAuth.getAccessToken);

// Null until the name is known; a failure keeps the screen's neutral fallback title.
export function useSchoolName(): string | null {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    api.getName().then(value => { if (active) setName(value); }, () => {});
    return () => { active = false; };
  }, []);
  return name;
}
