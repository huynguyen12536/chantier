import React, { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoginDesktop } from '@/components/layoutDesktop/LoginDesktop';
import { useIsDesktopLayout } from '@/hooks/useIsDesktopLayout';
import {
  authenticateWithDevicePin,
  getDevicePinCapability,
  getStoredLoginEmail,
  saveCredentialsForBiometric,
  type DevicePinCapability,
} from '@/services/biometricAuth';
import { isAccountNotFoundError } from '@/utils/authErrors';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [devicePin, setDevicePin] = useState<DevicePinCapability>({
    available: false,
    hasStoredCredentials: false,
  });
  const [devicePinChecked, setDevicePinChecked] = useState(false);
  const { signIn } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const isDesktopLayout = useIsDesktopLayout();

  const refreshDevicePin = useCallback(async () => {
    const capability = await getDevicePinCapability();
    setDevicePin(capability);
    setDevicePinChecked(true);

    if (capability.hasStoredCredentials) {
      const storedEmail = await getStoredLoginEmail();
      if (storedEmail) setEmail(storedEmail);
    }
  }, []);

  const showDevicePinSection =
    (Platform.OS === 'ios' || Platform.OS === 'android') &&
    devicePinChecked &&
    devicePin.available &&
    devicePin.hasStoredCredentials;

  const handleDevicePinLogin = useCallback(async () => {
    if (!showDevicePinSection || loading) return;

    setLoading(true);
    setError('');

    try {
      const credentials = await authenticateWithDevicePin({
        promptMessage: t.login.devicePinPrompt,
        cancelLabel: t.login.devicePinCancel,
        promptSubtitle: t.login.devicePinPromptSubtitle,
        promptDescription: t.login.devicePinPromptSubtitle,
      });
      if (!credentials) {
        return;
      }

      await signIn(credentials.email, credentials.password);
    } catch (err) {
      setError(isAccountNotFoundError(err) ? t.login.accountNotFound : t.login.incorrectCredentials);
    } finally {
      setLoading(false);
    }
  }, [
    loading,
    showDevicePinSection,
    signIn,
    t.login.devicePinCancel,
    t.login.devicePinPrompt,
    t.login.devicePinPromptSubtitle,
    t.login.accountNotFound,
    t.login.incorrectCredentials,
  ]);

  useFocusEffect(
    useCallback(() => {
      refreshDevicePin();
    }, [refreshDevicePin])
  );

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t.login.fillAllFields);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
      await saveCredentialsForBiometric(email, password);
      await refreshDevicePin();
    } catch (err: unknown) {
      setError(
        isAccountNotFoundError(err)
          ? t.login.accountNotFound
          : err instanceof Error
            ? err.message
            : t.login.incorrectCredentials,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginDesktop
      email={email}
      password={password}
      loading={loading}
      error={error}
      showPassword={showPassword}
      language={language}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onTogglePassword={() => setShowPassword((prev) => !prev)}
      onLogin={handleLogin}
      onLanguageChange={setLanguage}
      showDevicePinSection={showDevicePinSection}
      onDevicePinLogin={handleDevicePinLogin}
      logoWidth={isDesktopLayout ? 150 : 180}
      contentPaddingTop={Math.max(insets.top, isDesktopLayout ? 40 : 20)}
      contentPaddingBottom={Math.max(insets.bottom, isDesktopLayout ? 40 : 24)}
    />
  );
}
