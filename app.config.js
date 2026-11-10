const { Buffer } = require('node:buffer');

function isPublicSupabaseKey(key) {
  if (!key) return false;
  if (key.startsWith('sb_publishable_')) return true;
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

module.exports = ({ config }) => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const developmentLoginEnabled = process.env.NODE_ENV === 'development' &&
    process.env.NFC_DEV_AUTO_LOGIN === 'true';
  return {
    ...config,
    extra: {
      ...config.extra,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabasePublishableKey: isPublicSupabaseKey(key) ? key : undefined,
      developmentLogin: developmentLoginEnabled ? {
        enabled: true,
        email: process.env.NFC_DEV_LOGIN_EMAIL,
        password: process.env.NFC_DEV_LOGIN_PASSWORD,
      } : undefined,
    },
  };
};
