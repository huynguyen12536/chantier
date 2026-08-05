import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/i18n';
import { FlagFR, FlagGB } from '@/components/common/FlagIcons';

type HeaderLanguageSwitcherProps = {
  variant?: 'light' | 'dark';
};

const FLAGS: { lang: Language; Flag: typeof FlagFR }[] = [
  { lang: 'fr', Flag: FlagFR },
  { lang: 'en', Flag: FlagGB },
];

export function HeaderLanguageSwitcher({ variant = 'light' }: HeaderLanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const isLight = variant === 'light';

  return (
    <View style={styles.container}>
      {FLAGS.map(({ lang, Flag }) => {
        const isActive = language === lang;
        return (
          <TouchableOpacity
            key={lang}
            onPress={() => setLanguage(lang)}
            accessibilityRole="button"
            accessibilityLabel={lang === 'fr' ? 'Français' : 'English'}
            accessibilityState={{ selected: isActive }}
          >
            <View
              style={[
                styles.flagCircle,
                isLight ? styles.flagCircleLight : styles.flagCircleDark,
                isActive && (isLight ? styles.flagCircleActiveLight : styles.flagCircleActiveDark),
              ]}
            >
              <View style={styles.flagClip}>
                <Flag />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flagCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  flagCircleLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  flagCircleDark: {
    backgroundColor: '#F0F0F0',
  },
  flagCircleActiveLight: {
    borderColor: '#FFF',
  },
  flagCircleActiveDark: {
    borderColor: '#FF6B35',
  },
  flagClip: {
    width: 32,
    height: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
