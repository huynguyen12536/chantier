/**
 * Local session store for Imp-02 /auth/v1 tokens (DR-P13-002=B).
 * AsyncStorage on native; localStorage on web.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const KEY = 'chantier.unified.session.v1';

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  nom?: string;
  prenom?: string;
  matricule?: string | null;
  phone?: string;
  actif?: boolean;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in?: number | string;
  user: AuthUser;
};

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return AsyncStorage.getItem(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function storageRemove(key: string): Promise<void> {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

export async function loadSession(): Promise<AuthSession | null> {
  try {
    const raw = await storageGet(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.access_token || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveSession(session: AuthSession | null): Promise<void> {
  if (!session) {
    await storageRemove(KEY);
    return;
  }
  await storageSet(KEY, JSON.stringify(session));
}
