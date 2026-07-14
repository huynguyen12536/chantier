import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoginLogo } from '@/components/brand/LoginLogo';
import { Mail, Lock, Eye, EyeOff, KeyRound } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import {
  authenticateWithDevicePin,
  getDevicePinCapability,
  getStoredLoginEmail,
  saveCredentialsForBiometric,
  type DevicePinCapability,
} from '@/services/biometricAuth';
import { FlagFR, FlagGB } from '@/components/common/FlagIcons';

const loginBackground = require('../../assets/images/bg (2).png');

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
    } catch {
      setError(t.login.incorrectCredentials);
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
    } catch (err: any) {
      setError(err?.message || t.login.incorrectCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ImageBackground
        source={loginBackground}
        resizeMode="cover"
        style={styles.background}
        imageStyle={styles.backgroundImage}
      >
        <View style={[styles.overlay, { paddingTop: insets.top }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.mainBlock}>
              <LoginLogo />

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.login.email}</Text>
                  <View style={styles.inputContainer}>
                    <Mail size={20} color="#FF6B35" />
                    <TextInput
                      style={styles.input}
                      placeholder={t.login.emailPlaceholder}
                      placeholderTextColor="#999"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.login.password}</Text>
                  <View style={styles.inputContainer}>
                    <Lock size={20} color="#FF6B35" />
                    <TextInput
                      style={styles.input}
                      placeholder={t.login.passwordPlaceholder}
                      placeholderTextColor="#999"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#999" />
                      ) : (
                        <Eye size={20} color="#999" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>{t.login.forgotPassword}</Text>
                </TouchableOpacity>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
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
                      onPress={handleDevicePinLogin}
                      disabled={loading}
                      accessibilityRole="button"
                      accessibilityLabel={t.login.devicePinLabel}
                    >
                      <KeyRound size={28} color={Colors.primary} strokeWidth={2} />
                    </TouchableOpacity>
                    <Text style={styles.devicePinHint}>
                      <Text style={styles.devicePinHintBlack}>{t.login.devicePinLabelPrefix}</Text>
                      <Text style={styles.devicePinHintOrange}>{t.login.devicePinLabelAccent}</Text>
                    </Text>
                  </View>
                ) : null}

                <View style={styles.languageSection}>
                  <TouchableOpacity style={styles.langOption} onPress={() => setLanguage('fr')}>
                    <View style={[styles.flagCircle, language === 'fr' && styles.flagCircleActive]}>
                      <View style={styles.flagClip}><FlagFR /></View>
                    </View>
                    <Text style={[styles.languageButtonText, language === 'fr' && styles.languageButtonTextActive]}>
                      {t.login.french}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.langOption} onPress={() => setLanguage('en')}>
                    <View style={[styles.flagCircle, language === 'en' && styles.flagCircleActive]}>
                      <View style={styles.flagClip}><FlagGB /></View>
                    </View>
                    <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>
                      {t.login.english}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ImageBackground>

      <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Text style={styles.bottomText}>{t.login.tagline}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 52,
  },
  mainBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  form: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
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
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  languageSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginTop: 4,
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
    backgroundColor: '#F0F0F0',
  },
  flagCircleActive: {
    borderColor: '#FF6B35',
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
    color: '#999',
  },
  languageButtonTextActive: {
    color: '#FF6B35',
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    marginTop: 2,
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
    backgroundColor: '#E9ECEF',
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
    borderColor: '#FF6B35',
    backgroundColor: '#FFF8F5',
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
  bottomSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  bottomText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(255, 255, 255, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
