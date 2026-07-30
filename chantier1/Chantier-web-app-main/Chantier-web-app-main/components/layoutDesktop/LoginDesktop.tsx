import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react-native';
import { LoginLogo } from '@/components/brand/LoginLogo';
import { FlagFR, FlagGB } from '@/components/common/FlagIcons';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/colors';
import type { Language } from '@/i18n';

const loginBackground = require('../../assets/images/bg (2).png');

export type LoginDesktopProps = {
  email: string;
  password: string;
  loading: boolean;
  error: string;
  showPassword: boolean;
  language: Language;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onTogglePassword: () => void;
  onLogin: () => void;
  onLanguageChange: (lang: Language) => void;
  showDevicePinSection?: boolean;
  onDevicePinLogin?: () => void;
  logoWidth?: number;
  contentPaddingTop?: number;
  contentPaddingBottom?: number;
};

export function LoginDesktop({
  email,
  password,
  loading,
  error,
  showPassword,
  language,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onLogin,
  onLanguageChange,
  showDevicePinSection = false,
  onDevicePinLogin,
  logoWidth = 150,
  contentPaddingTop = 40,
  contentPaddingBottom = 40,
}: LoginDesktopProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const d = t.login.desktop;

  return (
    <ImageBackground
      source={loginBackground}
      resizeMode="cover"
      style={styles.background}
      imageStyle={styles.backgroundImage}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: contentPaddingTop, paddingBottom: contentPaddingBottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerWrap}>
          <BlurView intensity={55} tint="light" style={styles.formCard}>
            <View style={styles.formInner}>
              <View style={styles.logoWrap}>
                <LoginLogo width={logoWidth} />
              </View>

              <Text style={styles.welcome}>{d.welcome}</Text>
              <Text style={error ? styles.errorText : styles.subtitle}>
                {error || d.subtitle}
              </Text>

              <Text style={styles.label}>{t.login.email}</Text>
              <View style={styles.inputShell}>
                <Mail size={18} color={Colors.primary} />
                <TextInput
                  style={styles.input}
                  placeholder={t.login.emailPlaceholder}
                  placeholderTextColor="#8A8A8A"
                  value={email}
                  onChangeText={onEmailChange}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>

              <Text style={[styles.label, styles.labelSpaced]}>{t.login.password}</Text>
              <View style={styles.inputShell}>
                <Lock size={18} color={Colors.primary} />
                <TextInput
                  style={styles.input}
                  placeholder={t.login.passwordPlaceholder}
                  placeholderTextColor="#8A8A8A"
                  value={password}
                  onChangeText={onPasswordChange}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={onTogglePassword} style={styles.eyeButton}>
                  {showPassword ? (
                    <EyeOff size={18} color="#8A8A8A" />
                  ) : (
                    <Eye size={18} color="#8A8A8A" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotPasswordText}>{t.login.forgotPassword}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={onLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loginButtonText}>{t.login.connect}</Text>
                )}
              </TouchableOpacity>

              {showDevicePinSection ? (
                <View style={styles.devicePinSection}>
                  <View style={styles.devicePinDividerRow}>
                    <View style={styles.devicePinDividerLine} />
                    <Text style={styles.devicePinOrText}>{t.login.devicePinOr}</Text>
                    <View style={styles.devicePinDividerLine} />
                  </View>
                  <TouchableOpacity
                    style={styles.devicePinButton}
                    onPress={onDevicePinLogin}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel={t.login.devicePinLabel}
                  >
                    <KeyRound size={26} color={Colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                  <Text style={styles.devicePinHint}>
                    <Text style={styles.devicePinHintBlack}>{t.login.devicePinLabelPrefix}</Text>
                    <Text style={styles.devicePinHintOrange}>{t.login.devicePinLabelAccent}</Text>
                  </Text>
                </View>
              ) : null}

              <View style={styles.languageSection}>
                <TouchableOpacity style={styles.langOption} onPress={() => onLanguageChange('fr')}>
                  <View style={[styles.flagCircle, language === 'fr' && styles.flagCircleActive]}>
                    <View style={styles.flagClip}>
                      <FlagFR />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.languageButtonText,
                      language === 'fr' && styles.languageButtonTextActive,
                    ]}
                  >
                    {t.login.french}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.langOption} onPress={() => onLanguageChange('en')}>
                  <View style={[styles.flagCircle, language === 'en' && styles.flagCircleActive]}>
                    <View style={styles.flagClip}>
                      <FlagGB />
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.languageButtonText,
                      language === 'en' && styles.languageButtonTextActive,
                    ]}
                  >
                    {t.login.english}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#E8DFD6',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
    paddingHorizontal: 24,
  },
  centerWrap: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 440,
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
        } as object)
      : null),
  },
  formInner: {
    paddingHorizontal: 32,
    paddingVertical: 36,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  welcome: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  labelSpaced: {
    marginTop: 16,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 10,
    marginBottom: 18,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 22,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  devicePinSection: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  devicePinDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  devicePinDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  devicePinOrText: {
    fontSize: 13,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  devicePinButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 248, 245, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devicePinHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  devicePinHintBlack: {
    color: Colors.text.primary,
    fontWeight: '600',
  },
  devicePinHintOrange: {
    color: Colors.primary,
    fontWeight: '700',
  },
  languageSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(240,240,240,0.7)',
  },
  flagCircleActive: {
    borderColor: Colors.primary,
  },
  flagClip: {
    width: 32,
    height: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A8A',
  },
  languageButtonTextActive: {
    color: Colors.primary,
  },
});
