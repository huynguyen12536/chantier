import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CREDENTIALS_KEY = 'chantier_device_pin_credentials';
const LEGACY_CREDENTIALS_KEY = 'chantier_biometric_credentials';

const { SecurityLevel } = LocalAuthentication;

type StoredCredentials = {
  email: string;
  password: string;
};

export type DevicePinCapability = {
  available: boolean;
  hasStoredCredentials: boolean;
};

/** @deprecated Alias for existing imports */
export type BiometricCapability = DevicePinCapability & {
  authType?: 'pin';
  supportsBiometric?: false;
  supportsDevicePin?: boolean;
};

export type DevicePinPromptOptions = {
  promptMessage: string;
  cancelLabel: string;
  promptSubtitle?: string;
  promptDescription?: string;
};

export type BiometricPromptOptions = DevicePinPromptOptions;

export function isNativeMobileDevice(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

async function readStoredCredentials(): Promise<StoredCredentials | null> {
  try {
    let raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!raw) {
      raw = await SecureStore.getItemAsync(LEGACY_CREDENTIALS_KEY);
      if (raw) {
        await SecureStore.setItemAsync(CREDENTIALS_KEY, raw);
        await SecureStore.deleteItemAsync(LEGACY_CREDENTIALS_KEY);
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCredentials;
    if (!parsed?.email || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Verrouillage écran (PIN / schéma / mot de passe) requis — pas seulement capteur biométrique. */
async function canUseDevicePinPrompt(): Promise<boolean> {
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    return level >= SecurityLevel.SECRET;
  } catch {
    return false;
  }
}

export async function getDevicePinCapability(): Promise<DevicePinCapability> {
  const unavailable: DevicePinCapability = {
    available: false,
    hasStoredCredentials: false,
  };

  if (!isNativeMobileDevice()) {
    return unavailable;
  }

  try {
    const stored = await readStoredCredentials();
    if (!stored) {
      return unavailable;
    }

    const canPrompt = await canUseDevicePinPrompt();

    return {
      available: canPrompt,
      hasStoredCredentials: true,
    };
  } catch {
    return unavailable;
  }
}

export async function getBiometricCapability(): Promise<BiometricCapability> {
  const capability = await getDevicePinCapability();
  return {
    ...capability,
    authType: 'pin',
    supportsBiometric: false,
    supportsDevicePin: capability.available,
  };
}

export async function getStoredLoginEmail(): Promise<string | null> {
  const stored = await readStoredCredentials();
  return stored?.email ?? null;
}

/** Sau première connexion e-mail — conservé après déconnexion pour le PIN. */
export async function saveCredentialsForBiometric(
  email: string,
  password: string
): Promise<void> {
  if (!isNativeMobileDevice()) return;

  const payload: StoredCredentials = { email: email.trim(), password };
  await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(payload));
}

export async function clearBiometricCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
    await SecureStore.deleteItemAsync(LEGACY_CREDENTIALS_KEY);
  } catch {
    // ignore if key missing
  }
}

export async function authenticateWithDevicePin(
  options: DevicePinPromptOptions
): Promise<StoredCredentials | null> {
  if (!isNativeMobileDevice()) return null;

  const stored = await readStoredCredentials();
  if (!stored) return null;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: options.promptMessage,
    cancelLabel: options.cancelLabel,
    promptSubtitle: options.promptSubtitle,
    promptDescription: options.promptDescription,
    disableDeviceFallback: false,
    requireConfirmation: false,
  });

  if (!result.success) return null;

  return readStoredCredentials();
}

export const authenticateWithBiometric = authenticateWithDevicePin;
