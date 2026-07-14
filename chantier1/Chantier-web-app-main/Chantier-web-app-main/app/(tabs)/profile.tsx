import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { HeaderLanguageSwitcher } from '@/components/common/HeaderLanguageSwitcher';
import { User, LogOut, HardHat, Mail, Hash } from 'lucide-react-native';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSignOut = () => {
    setShowLogoutModal(true);
  };

  const confirmSignOut = async () => {
    setShowLogoutModal(false);
    await signOut();
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

  return (
    <View style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerLanguageRow}>
          <HeaderLanguageSwitcher variant="light" />
        </View>
        <View style={styles.avatarContainer}>
          <User size={48} color="#FFF" strokeWidth={2} />
        </View>
        <Text style={styles.name}>
          {profile?.prenom} {profile?.nom}
        </Text>
        <Text style={styles.roleText}>{getRoleLabel(profile?.role || '')}</Text>
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
            <Text style={styles.infoValue}>{getRoleLabel(profile?.role || '')}</Text>
            <Text style={styles.infoDescription}>
              {getRoleDescription(profile?.role || '')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.profile.permissions}</Text>

        <View style={styles.permissionsList}>
          <View style={styles.permissionItem}>
            <View style={styles.permissionDot} />
            <Text style={styles.permissionText}>{t.profile.permTimeDeclaration}</Text>
          </View>

          {(profile?.role === 'chef_equipe' || profile?.role === 'admin') && (
            <View style={styles.permissionItem}>
              <View style={styles.permissionDot} />
              <Text style={styles.permissionText}>{t.profile.permValidation}</Text>
            </View>
          )}

          {(profile?.role === 'administratif' || profile?.role === 'admin') && (
            <View style={styles.permissionItem}>
              <View style={styles.permissionDot} />
              <Text style={styles.permissionText}>{t.profile.permExport}</Text>
            </View>
          )}

          {profile?.role === 'admin' && (
            <>
              <View style={styles.permissionItem}>
                <View style={styles.permissionDot} />
                <Text style={styles.permissionText}>{t.profile.permWorksiteManagement}</Text>
              </View>
              <View style={styles.permissionItem}>
                <View style={styles.permissionDot} />
                <Text style={styles.permissionText}>{t.profile.permUserManagement}</Text>
              </View>
            </>
          )}
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

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.profile.logoutTitle}</Text>
            <Text style={styles.modalMessage}>{t.profile.logoutMessage}</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalButtonTextCancel}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={confirmSignOut}>
                <Text style={styles.modalButtonTextConfirm}>{t.profile.logoutTitle}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
