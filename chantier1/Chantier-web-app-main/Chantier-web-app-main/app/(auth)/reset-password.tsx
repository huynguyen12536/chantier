import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoginLogo } from '@/components/brand/LoginLogo';
import { Lock, Eye, EyeOff, ArrowLeft, KeyRound, Mail } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import {
  mapPasswordResetError,
  resetPasswordWithOtp,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
} from '@/utils/passwordResetOtp';

const loginBackground = require('../../assets/images/bg (2).png');
const MIN_PASSWORD_LENGTH = 6;

type ResetStep = 'otp' | 'password' | 'success';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const initialEmail = typeof params.email === 'string' ? params.email : '';

  const [email] = useState(initialEmail);
  const [step, setStep] = useState<ResetStep>('otp');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t, language } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleResendOtp = async () => {
    if (!email.trim()) {
      setError(t.forgotPassword.fillEmail);
      return;
    }

    setResending(true);
    setError('');

    try {
      await sendPasswordResetOtp(email, language === 'en' ? 'en' : 'fr');
    } catch (err: any) {
      setError(mapPasswordResetError(err?.message || 'request_failed', t));
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!email.trim()) {
      setError(t.forgotPassword.fillEmail);
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError(t.resetPassword.invalidOtp);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyPasswordResetOtp(email, otp);
      setStep('password');
    } catch (err: any) {
      setError(mapPasswordResetError(err?.message || 'request_failed', t));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t.resetPassword.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.resetPassword.passwordMismatch);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPasswordWithOtp(email, otp, password);
      setStep('success');
    } catch (err: any) {
      setError(mapPasswordResetError(err?.message || 'request_failed', t));
    } finally {
      setLoading(false);
    }
  };

  const subtitle =
    step === 'otp' ? t.resetPassword.subtitleVerifyOtp : t.resetPassword.subtitleNewPassword;

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
                {step === 'success' ? (
                  <>
                    <Text style={styles.title}>{t.resetPassword.title}</Text>
                    <Text style={styles.successText}>{t.resetPassword.success}</Text>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={() => router.replace('/(auth)/login')}
                    >
                      <Text style={styles.primaryButtonText}>{t.resetPassword.backToLogin}</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.title}>{t.resetPassword.title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>

                    {email ? (
                      <View style={styles.inputGroup}>
                        <Text style={styles.label}>{t.login.email}</Text>
                        <View style={[styles.inputContainer, styles.inputContainerReadOnly]}>
                          <Mail size={20} color="#FF6B35" />
                          <Text style={styles.readOnlyEmail} numberOfLines={1} ellipsizeMode="tail">
                            {email}
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {step === 'otp' ? (
                      <>
                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>{t.resetPassword.otpCode}</Text>
                          <View style={styles.inputContainer}>
                            <KeyRound size={20} color="#FF6B35" />
                            <TextInput
                              style={[styles.input, styles.otpInput]}
                              placeholder={t.resetPassword.otpPlaceholder}
                              placeholderTextColor="#999"
                              value={otp}
                              onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                              keyboardType="number-pad"
                              maxLength={6}
                              editable={!loading}
                            />
                          </View>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity
                          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                          onPress={handleVerifyOtp}
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator color="#FFF" />
                          ) : (
                            <Text style={styles.primaryButtonText}>{t.resetPassword.verifyOtp}</Text>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.resendLink}
                          onPress={handleResendOtp}
                          disabled={resending || loading}
                        >
                          <Text style={styles.resendLinkText}>
                            {resending ? t.resetPassword.resendingOtp : t.resetPassword.resendOtp}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>{t.resetPassword.newPassword}</Text>
                          <View style={styles.inputContainer}>
                            <Lock size={20} color="#FF6B35" />
                            <TextInput
                              style={styles.input}
                              placeholder={t.resetPassword.newPasswordPlaceholder}
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

                        <View style={styles.inputGroup}>
                          <Text style={styles.label}>{t.resetPassword.confirmPassword}</Text>
                          <View style={styles.inputContainer}>
                            <Lock size={20} color="#FF6B35" />
                            <TextInput
                              style={styles.input}
                              placeholder={t.resetPassword.confirmPasswordPlaceholder}
                              placeholderTextColor="#999"
                              value={confirmPassword}
                              onChangeText={setConfirmPassword}
                              secureTextEntry={!showConfirmPassword}
                              editable={!loading}
                            />
                            <TouchableOpacity
                              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                              style={styles.eyeButton}
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={20} color="#999" />
                              ) : (
                                <Eye size={20} color="#999" />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity
                          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                          onPress={handleResetPassword}
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator color="#FFF" />
                          ) : (
                            <Text style={styles.primaryButtonText}>{t.resetPassword.submit}</Text>
                          )}
                        </TouchableOpacity>
                      </>
                    )}

                    <TouchableOpacity
                      style={styles.backLink}
                      onPress={() =>
                        step === 'password'
                          ? setStep('otp')
                          : router.replace('/(auth)/login')
                      }
                    >
                      <ArrowLeft size={16} color="#FF6B35" />
                      <Text style={styles.backLinkText}>
                        {step === 'password' ? t.resetPassword.otpCode : t.resetPassword.backToLogin}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
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
    maxWidth: '100%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
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
    minWidth: 0,
    overflow: 'hidden',
  },
  inputContainerReadOnly: {
    backgroundColor: '#F1F3F5',
    minWidth: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  readOnlyEmail: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
    fontSize: 16,
    color: '#666',
    overflow: 'hidden',
  },
  otpInput: {
    letterSpacing: 4,
    fontWeight: '700',
  },
  eyeButton: {
    padding: 4,
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
  successText: {
    color: '#166534',
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  resendLink: {
    alignItems: 'center',
    marginTop: 2,
  },
  resendLinkText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  backLinkText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
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
