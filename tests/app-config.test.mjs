import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const configure = require('../app.config.js');

test('passes existing public Supabase configuration to Expo', () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.test';
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_example';
    const config = configure({ config: { name: 'App', extra: { existing: true } } });
    assert.equal(config.extra.supabaseUrl, 'https://example.test');
    assert.equal(config.extra.supabasePublishableKey, 'sb_publishable_example');
    assert.equal(config.extra.existing, true);
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_secret_not-public';
    assert.equal(configure({ config: {} }).extra.supabasePublishableKey, undefined);
  } finally {
    if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});

test('includes development login only with explicit opt-in and never in production', () => {
  const names = ['NODE_ENV', 'NFC_DEV_AUTO_LOGIN', 'NFC_DEV_LOGIN_EMAIL', 'NFC_DEV_LOGIN_PASSWORD'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    process.env.NODE_ENV = 'development';
    process.env.NFC_DEV_AUTO_LOGIN = 'true';
    process.env.NFC_DEV_LOGIN_EMAIL = 'school@example.test';
    process.env.NFC_DEV_LOGIN_PASSWORD = 'test-only-password';
    assert.deepEqual(configure({ config: {} }).extra.developmentLogin, {
      enabled: true, email: 'school@example.test', password: 'test-only-password',
    });
    process.env.NODE_ENV = 'production';
    assert.equal(configure({ config: { extra: { developmentLogin: { password: 'stale' } } } }).extra.developmentLogin, undefined);
    process.env.NODE_ENV = 'development';
    delete process.env.NFC_DEV_AUTO_LOGIN;
    assert.equal(configure({ config: {} }).extra.developmentLogin, undefined);
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});

test('adds the secure storage plugin without removing or duplicating existing plugins', () => {
  const config = { plugins: ['expo-router', ['expo-secure-store', {}]] };
  assert.deepEqual(configure({ config }).plugins, config.plugins);
  assert.deepEqual(configure({ config: { plugins: ['expo-router'] } }).plugins, ['expo-router', 'expo-secure-store']);
});
