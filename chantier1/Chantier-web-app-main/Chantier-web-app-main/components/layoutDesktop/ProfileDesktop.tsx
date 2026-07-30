import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Camera, HardHat, Hash, Mail, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FlagFR, FlagGB } from '@/components/common/FlagIcons';
import { UserAvatar } from '@/components/common';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/colors';
import type { Language } from '@/i18n';
import { desktopHeaderStyles, desktopTheme } from './glassStyles';

const ACCENT = '#FF5B24';
const INK = '#0E1320';
const MUTED = '#677084';

export type ProfileDesktopProps = {
  title: string;
  subtitle: string;
  fullName: string;
  roleLabel: string;
  roleDescription: string;
  email: string;
  emailLabel: string;
  matricule: string;
  matriculeLabel: string;
  roleFieldLabel: string;
  personalInfoTitle: string;
  permissionsTitle: string;
  permissions: string[];
  changeAvatarLabel: string;
  avatarPath?: string | null;
  avatarUpdatedAt?: string | null;
  prenom?: string | null;
  nom?: string | null;
  role?: string | null;
  avatarUploading: boolean;
  onChangeAvatar: () => void;
};

export function ProfileDesktop({
  title,
  subtitle,
  fullName,
  roleLabel,
  roleDescription,
  email,
  emailLabel,
  matricule,
  matriculeLabel,
  roleFieldLabel,
  personalInfoTitle,
  permissionsTitle,
  permissions,
  changeAvatarLabel,
  avatarPath,
  avatarUpdatedAt,
  prenom,
  nom,
  role,
  avatarUploading,
  onChangeAvatar,
}: ProfileDesktopProps) {
  const { language, setLanguage, t } = useLanguage();

  const languageOptions: { lang: Language; Flag: typeof FlagFR; label: string }[] = [
    { lang: 'fr', Flag: FlagFR, label: t.login.french },
    { lang: 'en', Flag: FlagGB, label: t.login.english },
  ];

  return (
    <View style={styles.page}>
      <View style={[desktopHeaderStyles.headerRow, styles.headerRow]}>
        <View style={desktopHeaderStyles.headerCopy}>
          <Text style={desktopHeaderStyles.title}>{title}</Text>
          <Text style={desktopHeaderStyles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <BlurView intensity={55} tint="light" style={styles.formFrame}>
        <View style={styles.formInner}>
          <LinearGradient
            colors={['rgba(255, 91, 36, 0.12)', 'rgba(255, 255, 255, 0.35)', 'rgba(255, 255, 255, 0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.identityHero}
          >
            <TouchableOpacity
              style={styles.avatarHit}
              onPress={onChangeAvatar}
              disabled={avatarUploading}
              accessibilityRole="button"
              accessibilityLabel={changeAvatarLabel}
              activeOpacity={0.88}
            >
              <View style={styles.avatarRing}>
                <UserAvatar
                  avatarPath={avatarPath}
                  avatarUpdatedAt={avatarUpdatedAt}
                  prenom={prenom}
                  nom={nom}
                  role={role}
                  size={94}
                  variant="profile"
                  emptyIconColor={ACCENT}
                  emptyBackgroundColor="#FFF0EB"
                />
                {avatarUploading ? (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator color="#FFF" />
                  </View>
                ) : null}
              </View>
              {!avatarUploading ? (
                <View style={styles.cameraBadge}>
                  <Camera size={14} color="#FFFFFF" strokeWidth={2.4} />
                </View>
              ) : null}
            </TouchableOpacity>

            <View style={styles.identityCopy}>
              <Text style={styles.identityEyebrow}>{roleLabel}</Text>
              <Text style={styles.identityName} numberOfLines={1}>
                {fullName}
              </Text>
              {roleDescription ? (
                <Text style={styles.identityDesc} numberOfLines={2}>
                  {roleDescription}
                </Text>
              ) : null}
              {email ? (
                <View style={styles.metaChip}>
                  <Mail size={14} color={ACCENT} strokeWidth={2.3} />
                  <Text style={styles.metaChipText} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>

          <View style={styles.divider} />

          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>{personalInfoTitle}</Text>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Mail size={18} color={ACCENT} strokeWidth={2.2} />
                </View>
                <View style={styles.infoCopy}>
                  <Text style={styles.infoLabel}>{emailLabel}</Text>
                  <Text style={styles.infoValue}>{email || '—'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Hash size={18} color={ACCENT} strokeWidth={2.2} />
                </View>
                <View style={styles.infoCopy}>
                  <Text style={styles.infoLabel}>{matriculeLabel}</Text>
                  <Text style={styles.infoValue}>{matricule || '—'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <HardHat size={18} color={ACCENT} strokeWidth={2.2} />
                </View>
                <View style={styles.infoCopy}>
                  <Text style={styles.infoLabel}>{roleFieldLabel}</Text>
                  <Text style={styles.infoValue}>{roleLabel}</Text>
                  {roleDescription ? (
                    <Text style={styles.infoHint}>{roleDescription}</Text>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.columnDivider} />

            <View style={styles.column}>
              <Text style={styles.sectionTitle}>{permissionsTitle}</Text>
              <View style={styles.permissionsList}>
                {permissions.map((item) => (
                  <View key={item} style={styles.permissionItem}>
                    <View style={styles.permissionIcon}>
                      <ShieldCheck size={16} color="#10B981" strokeWidth={2.4} />
                    </View>
                    <Text style={styles.permissionText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.footerBlock}>
            <View style={styles.divider} />
            <View style={styles.footerRow}>
              <View style={styles.languageSection}>
                {languageOptions.map(({ lang, Flag, label }) => {
                  const active = language === lang;
                  return (
                    <TouchableOpacity
                      key={lang}
                      style={styles.langOption}
                      onPress={() => setLanguage(lang)}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      accessibilityState={{ selected: active }}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.flagCircle, active && styles.flagCircleActive]}>
                        <View style={styles.flagClip}>
                          <Flag />
                        </View>
                      </View>
                      <Text style={[styles.langLabel, active && styles.langLabelActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  headerRow: {
    marginBottom: 10,
    flexShrink: 0,
  },
  formFrame: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 0,
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
          outlineWidth: 0,
          outlineStyle: 'none',
          height: '100%',
        } as object)
      : null),
  },
  formInner: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
  },
  identityHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    flexShrink: 0,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    overflow: 'hidden',
  },
  avatarHit: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: ACCENT,
    overflow: 'hidden',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  identityEyebrow: {
    color: ACCENT,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  identityName: {
    color: INK,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  identityDesc: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    maxWidth: 520,
  },
  metaChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 200, 0.9)',
  },
  metaChipText: {
    color: INK,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    maxWidth: 360,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 16,
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 0,
    gap: 0,
  },
  column: {
    flex: 1,
    minWidth: 0,
  },
  columnDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 28,
  },
  sectionTitle: {
    color: INK,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 240, 235, 0.9)',
    borderWidth: 1,
    borderColor: desktopTheme.primarySoftBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    justifyContent: 'center',
  },
  infoLabel: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  infoValue: {
    color: INK,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
  },
  infoHint: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 2,
  },
  permissionsList: {
    gap: 10,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  permissionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EAF8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    flex: 1,
    color: INK,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  footerBlock: {
    marginTop: 'auto',
    flexShrink: 0,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 24,
  },
  languageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
    flexShrink: 1,
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
  langLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8A8A8A',
  },
  langLabelActive: {
    color: Colors.primary,
  },
});
