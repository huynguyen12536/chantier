import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useIsDesktopLayout } from '@/hooks/useIsDesktopLayout';
import { HeaderLanguageSwitcher } from '@/components/common/HeaderLanguageSwitcher';
import { UserAvatar } from '@/components/common';
import { ProfileDesktop } from '@/components/layoutDesktop';
import { Building2, LogOut, HardHat, Mail, Hash } from 'lucide-react-native';
import { pickAvatarImage, uploadUserAvatar } from '@/utils/avatar';

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const isDesktopLayout = useIsDesktopLayout();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleSignOut = () => {
    setShowLogoutModal(true);
  };

  const confirmSignOut = async () => {
    setShowLogoutModal(false);
    await signOut();
  };

  const handleChangeAvatar = async () => {
    if (!profile?.id || avatarUploading) return;
    try {
      const asset = await pickAvatarImage();
      if (!asset?.uri) return;
      setAvatarUploading(true);
      await uploadUserAvatar({
        userId: profile.id,
        imageUri: asset.uri,
        mimeType: asset.mimeType,
        previousAvatarPath: profile.avatar_path,
      });
      await refreshProfile();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'PERMISSION_DENIED') {
        Alert.alert(t.profile.changeAvatar, t.profile.avatarPermissionDenied);
      } else {
        Alert.alert(t.profile.changeAvatar, t.profile.avatarUploadFailed);
      }
    } finally {
      setAvatarUploading(false);
    }
  };

  const getRoleLabel = (role: string): string => {
    return t.roles[role as keyof typeof t.roles] || role;
  };

  const getRoleDescription = (role: string): string => {
    const descriptions: Record<string, string> = {
      ouvrier: t.profile.roleDescOuvrier,
      chef_equipe: t.profile.roleDescChef,
      administratif: t.profile.roleDescAdmin2,
      admin: t.profile.roleDescAdmin,
    };
    return descriptions[role] || '';
  };

  const roleKey = profile?.role || '';
  const roleLabel = getRoleLabel(roleKey);
  const roleDescription = getRoleDescription(roleKey);

  const permissions = useMemo(() => {
    const list = [t.profile.permTimeDeclaration];
    if (roleKey === 'chef_equipe' || roleKey === 'admin') {
      list.push(t.profile.permValidation);
    }
    if (roleKey === 'administratif' || roleKey === 'admin') {
      list.push(t.profile.permExport);
    }
    if (roleKey === 'admin') {
      list.push(t.profile.permWorksiteManagement, t.profile.permUserManagement);
    }
    return list;
  }, [roleKey, t.profile]);

  const logoutModal = (
    <Modal
      visible={showLogoutModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowLogoutModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t.profile.logoutTitle}</Text>
          <Text style={styles.modalMessage}>{t.profile.logoutMessage}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalButtonCancel}
              onPress={() => setShowLogoutModal(false)}
            >
              <Text style={styles.modalButtonTextCancel}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButtonConfirm} onPress={confirmSignOut}>
              <Text style={styles.modalButtonTextConfirm}>{t.profile.logoutTitle}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isDesktopLayout) {
    return (
      <>
        <ProfileDesktop
          title={t.tabs.profile}
          subtitle={t.profile.personalInfo}
          fullName={`${profile?.prenom ?? ''} ${profile?.nom ?? ''}`.trim()}
          roleLabel={roleLabel}
          roleDescription={roleDescription}
          email={profile?.email ?? ''}
          emailLabel={t.profile.email}
          companyName={profile?.company_name}
          companyLabel={t.profile.company}
          matricule={profile?.matricule ?? ''}
          matriculeLabel={t.profile.matricule}
          roleFieldLabel={t.profile.role}
          personalInfoTitle={t.profile.personalInfo}
          permissionsTitle={t.profile.permissions}
          permissions={permissions}
          changeAvatarLabel={t.profile.changeAvatar}
          avatarPath={profile?.avatar_path}
          avatarUpdatedAt={profile?.avatar_updated_at}
          prenom={profile?.prenom}
          nom={profile?.nom}
          role={profile?.role}
          avatarUploading={avatarUploading}
          onChangeAvatar={handleChangeAvatar}
        />
      </>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerLanguageRow}>
          <HeaderLanguageSwitcher variant="light" />
        </View>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={handleChangeAvatar}
          disabled={avatarUploading}
          accessibilityRole="button"
          accessibilityLabel={t.profile.changeAvatar}
        >
          <UserAvatar
            avatarPath={profile?.avatar_path}
            avatarUpdatedAt={profile?.avatar_updated_at}
            prenom={profile?.prenom}
            nom={profile?.nom}
            role={profile?.role}
            size={96}
            variant="profile"
          />
          {avatarUploading ? (
            <View style={styles.avatarLoadingOverlay}>
              <ActivityIndicator color="#FFF" />
            </View>
          ) : null}
        </TouchableOpacity>
        <Text style={styles.name}>
          {profile?.prenom} {profile?.nom}
        </Text>
        <Text style={styles.roleText}>{roleLabel}</Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.profile.personalInfo}</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Mail size={20} color="#FF6B35" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t.profile.email}</Text>
              <Text style={styles.infoValue}>{profile?.email}</Text>
            </View>
          </View>

          {profile?.company_name ? (
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Building2 size={20} color="#FF6B35" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t.profile.company}</Text>
                <Text style={styles.infoValue}>{profile.company_name}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Hash size={20} color="#FF6B35" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t.profile.matricule}</Text>
              <Text style={styles.infoValue}>{profile?.matricule}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <HardHat size={20} color="#FF6B35" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t.profile.role}</Text>
              <Text style={styles.infoValue}>{roleLabel}</Text>
              <Text style={styles.infoDescription}>{roleDescription}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.profile.permissions}</Text>

          <View style={styles.permissionsList}>
            {permissions.map((item) => (
              <View key={item} style={styles.permissionItem}>
                <View style={styles.permissionDot} />
                <Text style={styles.permissionText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.profile.about}</Text>
          <Text style={styles.aboutText}>{t.profile.appTitle}</Text>
          <Text style={styles.versionText}>{t.profile.version}</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LogOut size={24} color="#FFF" />
          <Text style={styles.logoutButtonText}>{t.profile.logout}</Text>
        </TouchableOpacity>
      </ScrollView>

      {logoutModal}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerLanguageRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  permissionsList: {
    gap: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#66BB6A',
  },
  permissionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  aboutText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  versionText: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#EF5350',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 18,
    borderRadius: 12,
    gap: 12,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    height: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalButtonConfirm: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#EF5350',
    alignItems: 'center',
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
