const appJson = require('./app.json');

// Bolt / StackBlitz: QR must use tunnel (phone cannot reach LAN/localhost in the cloud IDE)
if (!process.env.EXPO_FORCE_WEBCONTAINER_ENV) {
  process.env.EXPO_FORCE_WEBCONTAINER_ENV = '1';
}

/** Public Supabase (anon) — committed so Bolt works without a local .env file */
const EXPO_PUBLIC_SUPABASE_URL = 'https://afgveikzneaablcuzwdb.supabase.co';
const EXPO_PUBLIC_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZ3ZlaWt6bmVhYWJsY3V6d2RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMDk1MTEsImV4cCI6MjA5Mzc4NTUxMX0.UWeon-CT6Qy4CFIe8H1X_AMizyTGzJ8SX_9YofTZCyg';

/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  ...appJson.expo,
  name: appJson.expo.name ?? 'Chantier',
  slug: appJson.expo.slug ?? 'bolt-expo-nativewind',
  extra: {
    ...appJson.expo.extra,
    EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY,
    ...(config?.extra ?? {}),
  },
});
