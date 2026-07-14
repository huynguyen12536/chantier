import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { getHomeRouteForRole } from '@/utils/role';

function RootNavigator() {
  const { session, loading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (!session || !profile) return;

    const homeRoute = getHomeRouteForRole(profile.role);

    if (inAuthGroup) {
      router.replace(homeRoute);
      return;
    }

    const inTabs = segments[0] === '(tabs)';
    const tabRoute = segments[1] as string | undefined;
    const onLegacyHome = inTabs && (!tabRoute || tabRoute === 'index');
    const onHiddenTimesheet = inTabs && tabRoute === 'timesheet' && profile.role === 'ouvrier';
    if (onLegacyHome || onHiddenTimesheet) {
      router.navigate(homeRoute);
    }
  }, [session, loading, profile, router, segments]);

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="declare-day" options={{ presentation: 'card', animation: 'fade' }} />
      <Stack.Screen
        name="declare-day-suggestion"
        options={{ presentation: 'card', animation: 'fade' }}
      />
      <Stack.Screen name="declare-day-empty" options={{ presentation: 'card', animation: 'fade' }} />
      <Stack.Screen name="choose-day" options={{ presentation: 'card', animation: 'fade' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const [fontsLoaded] = useFonts(
    Platform.OS === 'web'
      ? {
          TwemojiMozilla: require('../node_modules/react-native-country-select/lib/assets/fonts/TwemojiMozilla.woff2'),
        }
      : {}
  );

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <RootNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
