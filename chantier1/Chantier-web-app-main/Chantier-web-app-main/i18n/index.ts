import { Platform } from 'react-native';
import fr from './fr.json';
import en from './en.json';

export type Language = 'fr' | 'en';
export type Translations = typeof fr;

export const translations: Record<Language, Translations> = { fr, en };

const STORAGE_KEY = 'app_language';

export function saveLanguage(lang: Language): void {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }
}

export function loadLanguage(): Language {
  if (Platform.OS === 'web') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'fr' || stored === 'en') return stored;
    } catch {}
  }
  return 'fr';
}
