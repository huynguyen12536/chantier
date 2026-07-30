import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppAlertProvider } from '@/contexts/AppAlertContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CompanyDisabledProvider } from '@/contexts/CompanyDisabledContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { canAccessAppRoute, getHomeRouteForRole } from '@/utils/role';
import { isCompanyDisabledPending } from '@/utils/companyDisabled';
import '../global.css';

function RootNavigator() {
  const { session, loading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const segs = segments as string[];
    const inAuthGroup = segs[0] === '(auth)';
    const authScreen = segs[1];
    const publicAuthScreens = ['login', 'forgot-password', 'reset-password'];
    const onPublicAuthScreen =
      inAuthGroup && authScreen != null && publicAuthScreens.includes(authScreen);

    if (!session && !onPublicAuthScreen) {
      router.replace('/(auth)/login');
      return;
    }

    if (session && !profile && !loading && !isCompanyDisabledPending()) {
      router.replace('/(auth)/login');
      return;
    }

    if (!session || !profile) return;

    const homeRoute = getHomeRouteForRole(profile.role);

    if (inAuthGroup && authScreen === 'login') {
      router.replace(homeRoute);
      return;
    }

    const inTabs = segs[0] === '(tabs)';
    const tabRoute = segs[1];
    const onLegacyHome = inTabs && (!tabRoute || tabRoute === 'index');
    const onForbiddenRoute = !canAccessAppRoute(profile.role, segs);

    if (onLegacyHome || onForbiddenRoute) {
      router.replace(homeRoute);
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
      <Stack.Screen name="declare-absence" options={{ presentation: 'card', animation: 'fade' }} />
      <Stack.Screen name="absence-detail" options={{ presentation: 'card', animation: 'fade' }} />
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
        <AppAlertProvider>
          <AuthProvider>
            <CompanyDisabledProvider>
              <RootNavigator />
            </CompanyDisabledProvider>
            <StatusBar style="auto" />
          </AuthProvider>
        </AppAlertProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
