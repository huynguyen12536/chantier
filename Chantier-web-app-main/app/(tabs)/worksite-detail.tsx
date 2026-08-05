import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Image,
  FlatList,
} from 'react-native';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Users, UserPlus, Trash2, X, Search, Building2, CircleUser as UserCircle } from 'lucide-react-native';
import { TextInput } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Translations } from '@/i18n';
import { supabase } from '@/services/supabase';
import { Chantier, Profile } from '@/types';
import { Colors } from '@/constants/colors';
import { CHANTIER_ASSIGNABLE_ROLES, isChantierAssignableRole } from '@/constants';

const BUILDING_IMAGES = [
  'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1134166/pexels-photo-1134166.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/280221/pexels-photo-280221.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/2157401/pexels-photo-2157401.jpeg?auto=compress&cs=tinysrgb&w=400',
];

type AssignedUser = {
  affectation_id: string;
  user_id: string;
  date_debut: string;
  date_fin: string | null;
  profile: Profile;
};

function getRoleLabel(role: string, t: Translations): string {
  const labels: Record<string, string> = {
    ouvrier: t.roles.ouvrier,
    chef_equipe: t.roles.chef_equipe,
    administratif: t.roles.administratif,
    admin: t.roles.admin,
  };
  return labels[role] ?? role;
}

const ROLE_COLORS: Record<string, string> = {
  ouvrier: Colors.info,
  chef_equipe: Colors.warning,
  administratif: Colors.secondary,
  admin: Colors.primary,
};

export default function WorksiteDetailScreen() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const m = t.management.modals;
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; imageIndex: string }>();

  const [chantier, setChantier] = useState<Chantier | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addUserModal, setAddUserModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  const [removeConfirm, setRemoveConfirm] = useState<AssignedUser | null>(null);
  const [removing, setRemoving] = useState(false);
  const { headerPaddingTop } = useTabBarInset();

  const imageIndex = parseInt(params.imageIndex || '0', 10);
  const imageUri = BUILDING_IMAGES[imageIndex % BUILDING_IMAGES.length];

  const loadChantier = useCallback(async () => {
    if (!params.id) return;
    try {
      const { data, error } = await supabase
        .from('chantiers')
        .select('*')
        .eq('id', params.id)
        .maybeSingle();
      if (error) throw error;
      setChantier(data);
    } catch {
      setError('Impossible de charger le chantier');
    }
  }, [params.id]);

  const loadAssignedUsers = useCallback(async () => {
    if (!params.id) return;
    try {
      const { data, error } = await supabase
        .from('affectations_chantiers')
        .select('id, user_id, date_debut, date_fin, profiles(*)')
        .eq('chantier_id', params.id)
        .is('date_fin', null);
      if (error) throw error;
      const mapped: AssignedUser[] = (data || []).map((row: any) => ({
        affectation_id: row.id,
        user_id: row.user_id,
        date_debut: row.date_debut,
        date_fin: row.date_fin,
        profile: row.profiles as Profile,
      }));
      setAssignedUsers(mapped);
    } catch {
      setError('Impossible de charger les utilisateurs');
    }
  }, [params.id]);

  const loadAllProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', [...CHANTIER_ASSIGNABLE_ROLES])
        .order('nom', { ascending: true });
      if (error) throw error;
      setAllProfiles(data || []);
    } catch {
      // silent
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadChantier(), loadAssignedUsers(), loadAllProfiles()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadChantier, loadAssignedUsers, loadAllProfiles]);

  useEffect(() => { load(); }, [load]);

  if (profile?.role !== 'admin') return null;

  const assignedUserIds = new Set(assignedUsers.map(u => u.user_id));

  const availableProfiles = allProfiles.filter(p => {
    if (!isChantierAssignableRole(p.role)) return false;
    if (assignedUserIds.has(p.id)) return false;
    if (!addSearch.trim()) return true;
    const q = addSearch.toLowerCase();
    return `${p.nom} ${p.prenom} ${p.matricule} ${p.email}`.toLowerCase().includes(q);
  });

  const addUser = async (profileItem: Profile) => {
    setAdding(profileItem.id);
    try {
      const { error } = await supabase
        .from('affectations_chantiers')
        .insert({
          user_id: profileItem.id,
          chantier_id: params.id,
          date_debut: new Date().toISOString().split('T')[0],
          date_fin: null,
        });
      if (error) throw error;
      await loadAssignedUsers();
    } catch {
      setError('Impossible d\'ajouter cet utilisateur');
    } finally {
      setAdding(null);
    }
  };

  const removeUser = async () => {
    if (!removeConfirm) return;
    setRemoving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('affectations_chantiers')
        .update({ date_fin: today })
        .eq('id', removeConfirm.affectation_id);
      if (error) throw error;
      setRemoveConfirm(null);
      await loadAssignedUsers();
    } catch {
      setError('Impossible de retirer cet utilisateur');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(tabs)/admin-worksites')}>
          <ArrowLeft size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={[styles.headerIcon, { backgroundColor: Colors.secondary + '18' }]}>
          <Building2 size={20} color={Colors.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chantier?.nom || 'Chantier'}
          </Text>
          <Text style={styles.headerSubtitle}>Détail du chantier</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.centered} color={Colors.primary} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(); }}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Chantier info card */}
          <View style={styles.infoCard}>
            <Image source={{ uri: imageUri }} style={styles.infoImage} resizeMode="cover" />
            {chantier && !chantier.actif && <View style={styles.inactiveOverlay} />}
            <View style={styles.infoBody}>
              <View style={styles.infoTopRow}>
                <Text style={styles.infoName}>{chantier?.nom}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: chantier?.actif ? Colors.secondary + '15' : Colors.border.light }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: chantier?.actif ? Colors.secondary : Colors.text.disabled }
                  ]}>
                    {chantier?.actif ? 'Actif' : 'Inactif'}
                  </Text>
                </View>
              </View>
              <Text style={styles.infoAddress}>{chantier?.adresse || 'Adresse non renseignée'}</Text>
              <View style={styles.infoMetaRow}>
                <Text style={styles.infoCode}>Code: {chantier?.code}</Text>
                {chantier?.date_debut && (
                  <Text style={styles.infoDate}>Début: {chantier.date_debut}</Text>
                )}
              </View>
            </View>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Users section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Users size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                Utilisateurs affectés ({assignedUsers.length})
              </Text>
            </View>
            <TouchableOpacity style={styles.addUserBtn} onPress={() => setAddUserModal(true)}>
              <UserPlus size={16} color="#fff" />
              <Text style={styles.addUserBtnText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {assignedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <UserCircle size={40} color={Colors.border.medium} />
              <Text style={styles.emptyText}>Aucun utilisateur affecté</Text>
              <Text style={styles.emptySubtext}>Appuyez sur "Ajouter" pour affecter des utilisateurs à ce chantier</Text>
            </View>
          ) : (
            assignedUsers.map(au => (
              <View key={au.affectation_id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {(au.profile?.prenom?.[0] || '') + (au.profile?.nom?.[0] || '')}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{au.profile?.prenom} {au.profile?.nom}</Text>
                  <Text style={styles.userMat}>{au.profile?.matricule}</Text>
                  <View style={[
                    styles.roleBadge,
                    { backgroundColor: (ROLE_COLORS[au.profile?.role] || Colors.info) + '15' }
                  ]}>
                    <Text style={[
                      styles.roleText,
                      { color: ROLE_COLORS[au.profile?.role] || Colors.info }
                    ]}>
                      {getRoleLabel(au.profile?.role ?? '', t)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.removeBtn} onPress={() => setRemoveConfirm(au)}>
                  <Trash2 size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Remove confirmation modal */}
      <Modal visible={!!removeConfirm} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <View style={styles.confirmIconWrap}>
              <Trash2 size={28} color={Colors.error} />
            </View>
            <Text style={styles.confirmTitle}>{m.removeUserFromWorksite.title}</Text>
            <Text style={styles.confirmMsg}>
              {m.removeUserFromWorksite.confirmBefore}
              <Text style={{ fontWeight: '700' }}>
                {removeConfirm?.profile?.prenom} {removeConfirm?.profile?.nom}
              </Text>
              {m.removeUserFromWorksite.confirmAfter}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setRemoveConfirm(null)}>
                <Text style={styles.confirmCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDelete} onPress={removeUser} disabled={removing}>
                {removing
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmDeleteText}>{m.remove}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add user modal */}
      <Modal visible={addUserModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{m.addUserToWorksite.title}</Text>
              <TouchableOpacity onPress={() => { setAddUserModal(false); setAddSearch(''); }}>
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchBox}>
              <Search size={16} color={Colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={m.searchUser}
                placeholderTextColor={Colors.text.disabled}
                value={addSearch}
                onChangeText={setAddSearch}
                autoFocus
              />
              {addSearch.length > 0 && (
                <TouchableOpacity onPress={() => setAddSearch('')}>
                  <X size={16} color={Colors.text.secondary} />
                </TouchableOpacity>
              )}
            </View>
            {availableProfiles.length === 0 ? (
              <View style={styles.modalEmpty}>
                <Text style={styles.modalEmptyText}>{m.addUserToWorksite.empty}</Text>
              </View>
            ) : (
              <FlatList
                data={availableProfiles}
                keyExtractor={item => item.id}
                style={styles.profileList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.profileRow}
                    onPress={() => addUser(item)}
                    disabled={adding === item.id}
                  >
                    <View style={styles.profileAvatar}>
                      <Text style={styles.profileAvatarText}>
                        {(item.prenom?.[0] || '') + (item.nom?.[0] || '')}
                      </Text>
                    </View>
                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName}>{item.prenom} {item.nom}</Text>
                      <Text style={styles.profileMeta}>{item.matricule} · {getRoleLabel(item.role, t)}</Text>
                    </View>
                    {adding === item.id
                      ? <ActivityIndicator size="small" color={Colors.primary} />
                      : (
                        <View style={styles.profileAddBtn}>
                          <UserPlus size={16} color={Colors.primary} />
                        </View>
                      )
                    }
                  </TouchableOpacity>
                )}
              />
            )}
            <View style={{ height: 16 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  centered: {
    flex: 1,
    alignSelf: 'center',
    marginTop: 60,
  },
  infoCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.light,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  infoImage: {
    width: '100%',
    height: 140,
  },
  inactiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  infoBody: {
    padding: 16,
  },
  infoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  infoMetaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoCode: {
    fontSize: 12,
    color: Colors.text.disabled,
    fontWeight: '500',
  },
  infoDate: {
    fontSize: 12,
    color: Colors.text.disabled,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  addUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addUserBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.text.disabled,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  userMat: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 5,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  removeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.error + '10',
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginHorizontal: 24,
    padding: 24,
    alignItems: 'center',
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  confirmMsg: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmBtns: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  confirmDelete: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.error,
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },
  profileList: {
    flexGrow: 0,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  profileMeta: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  profileAddBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
  },
  modalEmpty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
    color: Colors.text.disabled,
  },
});
