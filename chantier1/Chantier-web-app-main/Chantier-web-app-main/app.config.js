const appJson = require('./app.json');

// Bolt / StackBlitz: QR must use tunnel (phone cannot reach LAN/localhost in the cloud IDE)
if (!process.env.EXPO_FORCE_WEBCONTAINER_ENV) {
  process.env.EXPO_FORCE_WEBCONTAINER_ENV = '1';
}

/** Unified Backend origin (Phase 13) — override via EXPO_PUBLIC_API_URL */
const EXPO_PUBLIC_API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/** Optional header for legacy Edge callers; Unified API ignores it. */
const EXPO_PUBLIC_API_ANON_KEY =
  process.env.EXPO_PUBLIC_API_ANON_KEY || 'local-anon';

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  name: appJson.expo.name ?? 'Chantier',
  slug: appJson.expo.slug ?? 'bolt-expo-nativewind',
  extra: {
    ...appJson.expo.extra,
    EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_API_ANON_KEY,
    ...(config?.extra ?? {}),
  },
});
