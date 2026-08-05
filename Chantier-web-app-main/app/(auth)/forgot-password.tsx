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
import { useRouter } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoginLogo } from '@/components/brand/LoginLogo';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { mapPasswordResetError, sendPasswordResetOtp } from '@/utils/passwordResetOtp';

const loginBackground = require('../../assets/images/bg (2).png');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, language } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError(t.forgotPassword.fillEmail);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetOtp(email, language === 'en' ? 'en' : 'fr');
      router.push({
        pathname: '/(auth)/reset-password',
        params: { email: email.trim().toLowerCase() },
      });
    } catch (err: any) {
      setError(mapPasswordResetError(err?.message || 'request_failed', t));
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
                <Text style={styles.title}>{t.forgotPassword.title}</Text>
                <Text style={styles.subtitle}>{t.forgotPassword.subtitle}</Text>

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

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>{t.forgotPassword.sendOtp}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  <ArrowLeft size={16} color="#FF6B35" />
                  <Text style={styles.backLinkText}>{t.forgotPassword.backToLogin}</Text>
                </TouchableOpacity>
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
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
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
