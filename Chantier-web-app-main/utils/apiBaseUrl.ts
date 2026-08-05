import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

/**
 * Resolve Unified API origin.
 * On public web hosts (ngrok / deploy), prefer same-origin so nginx can proxy
 * /rest /auth /api /events and avoid CORS + dual-tunnel collisions.
 */
export function resolveApiBaseUrl(): string {
  const baked = (
    process.env.EXPO_PUBLIC_API_URL ||
    (extra as { EXPO_PUBLIC_API_URL?: string }).EXPO_PUBLIC_API_URL ||
    ''
  ).replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return origin;
    }
  }

  return baked || 'http://localhost:3000';
}
