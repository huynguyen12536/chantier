import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useRouter } from 'expo-router';
import {
  Building2,
  Search,
  X,
  Pencil as Edit2,
  Trash2,
  Plus,
  ArrowLeft,
  Users,
  UserPlus,
  Settings,
  Clock,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Translations } from '@/i18n';
import { supabase } from '@/services/supabase';
import { Chantier, Profile } from '@/types';
import { Colors } from '@/constants/colors';
import { CHANTIER_ASSIGNABLE_ROLES, isChantierAssignableRole } from '@/constants';
import { generateWorksiteCode } from '@/utils/worksiteCode';

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

type WorksiteForm = {
  nom: string;
  adresse: string;
  actif: boolean;
  date_debut: string;
  date_fin: string;
  heure_debut: string;
  heure_fin: string;
};

type AssignedUser = {
  affectation_id: string;
  user_id: string;
  profile: Profile;
};

const DEFAULT_HEURE_DEBUT = '07:30';
const DEFAULT_HEURE_FIN = '16:30';

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return '';
}

export default function AdminWorksitesScreen() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const m = t.management.modals;
  const router = useRouter();
  const [worksites, setWorksites] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [editingWS, setEditingWS] = useState<Chantier | null>(null);
  const [form, setForm] = useState<WorksiteForm>({ nom: '', adresse: '', actif: true, date_debut: '', date_fin: '', heure_debut: '', heure_fin: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Chantier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { headerPaddingTop } = useTabBarInset();

  // User management inside edit modal
  const [editTab, setEditTab] = useState<'info' | 'users'>('info');
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [addingUser, setAddingUser] = useState<string | null>(null);
  const [removingUser, setRemoving] = useState<string | null>(null);
  const [removeConfirmUser, setRemoveConfirmUser] = useState<AssignedUser | null>(null);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chantiers')
        .select('*')
        .order('nom', { ascending: true });
      if (error) throw error;
      setWorksites(data || []);
      setError(null);
    } catch {
      setError('Impossible de charger les chantiers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadAssignedUsers = useCallback(async (chantierId: string) => {
    try {
      const { data, error } = await supabase
        .from('affectations_chantiers')
        .select('id, user_id, profiles(*)')
        .eq('chantier_id', chantierId)
        .is('date_fin', null);
      if (error) throw error;
      setAssignedUsers(
        (data || []).map((row: any) => ({
          affectation_id: row.id,
          user_id: row.user_id,
          profile: row.profiles as Profile,
        }))
      );
    } catch {
      setError('Impossible de charger les utilisateurs');
    }
  }, []);

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

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadAllProfiles(); }, [loadAllProfiles]);

  if (profile?.role !== 'admin') return null;

  const filtered = worksites.filter(w =>
    `${w.nom} ${w.code} ${w.adresse}`.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (ws: Chantier) => {
    setEditingWS(ws);
    setForm({ nom: ws.nom, adresse: ws.adresse || '', actif: ws.actif, date_debut: ws.date_debut || '', date_fin: ws.date_fin || '', heure_debut: ws.heure_debut || '', heure_fin: ws.heure_fin || '' });
    setEditTab('info');
    setUserSearch('');
    setAssignedUsers([]);
    setEditModal(true);
    loadAssignedUsers(ws.id);
  };

  const openAdd = () => {
    setForm({
      nom: '',
      adresse: '',
      actif: true,
      date_debut: new Date().toISOString().split('T')[0],
      date_fin: '',
      heure_debut: DEFAULT_HEURE_DEBUT,
      heure_fin: DEFAULT_HEURE_FIN,
    });
    setAddModal(true);
  };

  const deleteWorksite = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_chantier_cascade', {
        p_chantier_id: deleteConfirm.id,
      });
      if (error) throw error;
      setDeleteConfirm(null);
      load();
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('Delete chantier failed', error);
      setError(message ? `Impossible de supprimer ce chantier : ${message}` : 'Impossible de supprimer ce chantier');
    } finally {
      setDeleting(false);
    }
  };

  const saveEdit = async () => {
    if (!editingWS) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('chantiers')
        .update({ nom: form.nom, adresse: form.adresse, actif: form.actif, date_debut: form.date_debut || null, date_fin: form.date_fin || null, heure_debut: form.heure_debut || null, heure_fin: form.heure_fin || null })
        .eq('id', editingWS.id);
      if (error) throw error;
      setEditModal(false);
      load();
    } catch {
      setError('Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  const saveAdd = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('chantiers')
        .insert({
          nom: form.nom,
          code: await generateWorksiteCode(),
          adresse: form.adresse,
          actif: form.actif,
          date_debut: form.date_debut || null,
          date_fin: form.date_fin || null,
          heure_debut: form.heure_debut || null,
          heure_fin: form.heure_fin || null,
        });
      if (error) throw error;
      setAddModal(false);
      load();
    } catch {
      setError('Impossible de créer le chantier');
    } finally {
      setSaving(false);
    }
  };

  const addUserToWorksite = async (p: Profile) => {
    if (!editingWS) return;
    setAddingUser(p.id);
    try {
      const { error } = await supabase.from('affectations_chantiers').insert({
        user_id: p.id,
        chantier_id: editingWS.id,
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: null,
      });
      if (error) throw error;
      await loadAssignedUsers(editingWS.id);
    } catch {
      setError("Impossible d'ajouter cet utilisateur");
    } finally {
      setAddingUser(null);
    }
  };

  const removeUserFromWorksite = async () => {
    if (!removeConfirmUser || !editingWS) return;
    setRemoving(removeConfirmUser.affectation_id);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('affectations_chantiers')
        .update({ date_fin: today })
        .eq('id', removeConfirmUser.affectation_id);
      if (error) throw error;
      setRemoveConfirmUser(null);
      await loadAssignedUsers(editingWS.id);
    } catch {
      setError("Impossible de retirer cet utilisateur");
    } finally {
      setRemoving(null);
    }
  };

  const assignedIds = new Set(assignedUsers.map(u => u.user_id));
  const availableProfiles = allProfiles.filter(p => {
    if (!isChantierAssignableRole(p.role)) return false;
    if (assignedIds.has(p.id)) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return `${p.nom} ${p.prenom} ${p.matricule} ${p.email}`.toLowerCase().includes(q);
  });

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(tabs)/management')}>
          <ArrowLeft size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={[styles.headerIcon, { backgroundColor: Colors.secondary + '18' }]}>
          <Building2 size={20} color={Colors.secondary} />
        </View>
        <View>
          <Text style={styles.headerTitle}>Chantiers</Text>
          <Text style={styles.headerSubtitle}>Gestion des chantiers</Text>
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un chantier..."
            placeholderTextColor={Colors.text.disabled}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

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
          <Text style={styles.countLabel}>
            {filtered.length} chantier{filtered.length > 1 ? 's' : ''}
          </Text>
          {filtered.map((ws) => (
            <TouchableOpacity
              key={ws.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/(tabs)/worksite-detail', params: { id: ws.id } })}
            >
              <View style={styles.cardIcon}>
                <Building2 size={22} color={Colors.primary} strokeWidth={2.2} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>{ws.nom}</Text>
                  {!!ws.adresse && (
                    <Text style={styles.cardAddress} numberOfLines={1}>{ws.adresse}</Text>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={(e) => { e.stopPropagation(); openEdit(ws); }}>
                    <Edit2 size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={(e) => { e.stopPropagation(); setDeleteConfirm(ws); }}>
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      {/* Delete confirmation */}
      <Modal visible={!!deleteConfirm} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <View style={styles.confirmIconWrap}>
              <Trash2 size={28} color={Colors.error} />
            </View>
            <Text style={styles.confirmTitle}>{m.deleteWorksite.title}</Text>
            <Text style={styles.confirmMsg}>
              {m.deleteWorksite.confirmBefore}
              <Text style={{ fontWeight: '700' }}>{deleteConfirm?.nom}</Text>
              {m.deleteWorksite.confirmAfter}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setDeleteConfirm(null)}>
                <Text style={styles.confirmCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDelete} onPress={deleteWorksite} disabled={deleting}>
                {deleting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmDeleteText}>{m.delete}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remove user confirmation */}
      <Modal visible={!!removeConfirmUser} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <View style={styles.confirmIconWrap}>
              <Trash2 size={28} color={Colors.error} />
            </View>
            <Text style={styles.confirmTitle}>{m.removeUserFromWorksite.title}</Text>
            <Text style={styles.confirmMsg}>
              {m.removeUserFromWorksite.messageBefore}
              <Text style={{ fontWeight: '700' }}>
                {removeConfirmUser?.profile?.prenom} {removeConfirmUser?.profile?.nom}
              </Text>
              {m.removeUserFromWorksite.messageAfter}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setRemoveConfirmUser(null)}>
                <Text style={styles.confirmCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDelete}
                onPress={removeUserFromWorksite}
                disabled={!!removingUser}
              >
                {removingUser
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmDeleteText}>{m.remove}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit modal with tabs */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{m.editWorksite.title}</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, editTab === 'info' && styles.tabBtnActive]}
                onPress={() => setEditTab('info')}
              >
                <Settings size={14} color={editTab === 'info' ? Colors.primary : Colors.text.secondary} />
                <Text style={[styles.tabText, editTab === 'info' && styles.tabTextActive]}>{m.worksiteTabs.info}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, editTab === 'users' && styles.tabBtnActive]}
                onPress={() => setEditTab('users')}
              >
                <Users size={14} color={editTab === 'users' ? Colors.primary : Colors.text.secondary} />
                <Text style={[styles.tabText, editTab === 'users' && styles.tabTextActive]}>
                  {m.worksiteTabs.users} {assignedUsers.length > 0 ? `(${assignedUsers.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {editTab === 'info' ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>{m.fields.name}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.nom}
                  onChangeText={v => setForm(f => ({ ...f, nom: v }))}
                  placeholder={m.fields.worksiteName}
                  placeholderTextColor={Colors.text.disabled}
                />
                <Text style={styles.fieldLabel}>{m.fields.address}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.adresse}
                  onChangeText={v => setForm(f => ({ ...f, adresse: v }))}
                  placeholder={m.fields.address}
                  placeholderTextColor={Colors.text.disabled}
                />
                <Text style={styles.fieldLabel}>{m.fields.startDate}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.date_debut}
                  onChangeText={v => setForm(f => ({ ...f, date_debut: v }))}
                  placeholder={m.placeholders.date}
                  placeholderTextColor={Colors.text.disabled}
                />
                <Text style={styles.fieldLabel}>{m.fields.endDateOptional}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={form.date_fin}
                  onChangeText={v => setForm(f => ({ ...f, date_fin: v }))}
                  placeholder={m.placeholders.date}
                  placeholderTextColor={Colors.text.disabled}
                />
                <View style={styles.timeRow}>
                  <View style={styles.timeField}>
                    <Text style={styles.fieldLabel}>{m.fields.startTime}</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={form.heure_debut}
                      onChangeText={v => setForm(f => ({ ...f, heure_debut: v }))}
                      placeholder={m.placeholders.time}
                      placeholderTextColor={Colors.text.disabled}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  <View style={styles.timeField}>
                    <Text style={styles.fieldLabel}>{m.fields.endTime}</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={form.heure_fin}
                      onChangeText={v => setForm(f => ({ ...f, heure_fin: v }))}
                      placeholder={m.placeholders.time}
                      placeholderTextColor={Colors.text.disabled}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                </View>
                <Text style={styles.fieldLabel}>{m.fields.status}</Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, form.actif && styles.toggleBtnActive]}
                    onPress={() => setForm(f => ({ ...f, actif: true }))}
                  >
                    <Text style={[styles.toggleText, form.actif && styles.toggleTextActive]}>{m.fields.active}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, !form.actif && styles.toggleBtnInactive]}
                    onPress={() => setForm(f => ({ ...f, actif: false }))}
                  >
                    <Text style={[styles.toggleText, !form.actif && styles.toggleTextInactive]}>{m.fields.inactive}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 16 }} />
                <TouchableOpacity style={styles.saveBtn} onPress={saveEdit} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveBtnText}>{m.save}</Text>
                  }
                </TouchableOpacity>
                <View style={{ height: 32 }} />
              </ScrollView>
            ) : (
              <View style={styles.usersTab}>
                {/* Assigned users list */}
                {assignedUsers.length > 0 && (
                  <>
                    <Text style={styles.usersSubLabel}>{m.worksiteTabs.assignedMembers}</Text>
                    {assignedUsers.map(au => (
                      <View key={au.affectation_id} style={styles.userRow}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>
                            {(au.profile?.prenom?.[0] || '') + (au.profile?.nom?.[0] || '')}
                          </Text>
                        </View>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{au.profile?.prenom} {au.profile?.nom}</Text>
                          <View style={styles.userMetaRow}>
                            <Text style={styles.userMat}>{au.profile?.matricule}</Text>
                            <View style={[
                              styles.roleBadge,
                              { backgroundColor: (ROLE_COLORS[au.profile?.role] || Colors.info) + '18' }
                            ]}>
                              <Text style={[
                                styles.roleText,
                                { color: ROLE_COLORS[au.profile?.role] || Colors.info }
                              ]}>
                                {getRoleLabel(au.profile?.role ?? '', t)}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.removeUserBtn}
                          onPress={() => setRemoveConfirmUser(au)}
                          disabled={removingUser === au.affectation_id}
                        >
                          {removingUser === au.affectation_id
                            ? <ActivityIndicator size="small" color={Colors.error} />
                            : <Trash2 size={15} color={Colors.error} />
                          }
                        </TouchableOpacity>
                      </View>
                    ))}
                    <View style={styles.divider} />
                  </>
                )}

                {/* Add user section */}
                <Text style={styles.usersSubLabel}>{m.worksiteTabs.addUser}</Text>
                <View style={styles.userSearchBox}>
                  <Search size={14} color={Colors.text.secondary} />
                  <TextInput
                    style={styles.userSearchInput}
                    placeholder={m.search}
                    placeholderTextColor={Colors.text.disabled}
                    value={userSearch}
                    onChangeText={setUserSearch}
                  />
                  {userSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setUserSearch('')}>
                      <X size={14} color={Colors.text.secondary} />
                    </TouchableOpacity>
                  )}
                </View>

                <FlatList
                  data={availableProfiles}
                  keyExtractor={item => item.id}
                  style={styles.availableList}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <Text style={styles.emptyListText}>
                      {allProfiles.length === 0
                        ? m.addUserToWorksite.loading
                        : m.addUserToWorksite.allAssigned}
                    </Text>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.availableRow}
                      onPress={() => addUserToWorksite(item)}
                      disabled={addingUser === item.id}
                    >
                      <View style={[styles.userAvatar, { backgroundColor: Colors.secondary + '15' }]}>
                        <Text style={[styles.userAvatarText, { color: Colors.secondary }]}>
                          {(item.prenom?.[0] || '') + (item.nom?.[0] || '')}
                        </Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.prenom} {item.nom}</Text>
                        <View style={styles.userMetaRow}>
                          <Text style={styles.userMat}>{item.matricule}</Text>
                          <View style={[
                            styles.roleBadge,
                            { backgroundColor: (ROLE_COLORS[item.role] || Colors.info) + '18' }
                          ]}>
                            <Text style={[
                              styles.roleText,
                              { color: ROLE_COLORS[item.role] || Colors.info }
                            ]}>
                              {getRoleLabel(item.role, t)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {addingUser === item.id
                        ? <ActivityIndicator size="small" color={Colors.primary} />
                        : (
                          <View style={styles.addUserIcon}>
                            <UserPlus size={16} color={Colors.primary} />
                          </View>
                        )
                      }
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Add modal (info only) */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{m.addWorksite.title}</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}>
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>{m.fields.name}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.nom}
                onChangeText={v => setForm(f => ({ ...f, nom: v }))}
                placeholder={m.fields.worksiteName}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.fieldLabel}>{m.fields.address}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.adresse}
                onChangeText={v => setForm(f => ({ ...f, adresse: v }))}
                placeholder={m.fields.address}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.fieldLabel}>{m.fields.startDate}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.date_debut}
                onChangeText={v => setForm(f => ({ ...f, date_debut: v }))}
                placeholder={m.placeholders.date}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.fieldLabel}>{m.fields.endDateOptional}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.date_fin}
                onChangeText={v => setForm(f => ({ ...f, date_fin: v }))}
                placeholder={m.placeholders.date}
                placeholderTextColor={Colors.text.disabled}
              />
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={styles.fieldLabel}>{m.fields.startTime}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form.heure_debut}
                    onChangeText={v => setForm(f => ({ ...f, heure_debut: v }))}
                    placeholder={m.placeholders.time}
                    placeholderTextColor={Colors.text.disabled}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={styles.timeField}>
                  <Text style={styles.fieldLabel}>{m.fields.endTime}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={form.heure_fin}
                    onChangeText={v => setForm(f => ({ ...f, heure_fin: v }))}
                    placeholder={m.placeholders.time}
                    placeholderTextColor={Colors.text.disabled}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>
              <Text style={styles.fieldLabel}>{m.fields.status}</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, form.actif && styles.toggleBtnActive]}
                  onPress={() => setForm(f => ({ ...f, actif: true }))}
                >
                  <Text style={[styles.toggleText, form.actif && styles.toggleTextActive]}>{m.fields.active}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, !form.actif && styles.toggleBtnInactive]}
                  onPress={() => setForm(f => ({ ...f, actif: false }))}
                >
                  <Text style={[styles.toggleText, !form.actif && styles.toggleTextInactive]}>{m.fields.inactive}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 16 }} />
              <TouchableOpacity style={styles.saveBtn} onPress={saveAdd} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>{m.save}</Text>
                }
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </ScrollView>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '12',
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  cardAddress: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  code: {
    fontSize: 11,
    color: Colors.text.disabled,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary + '10',
  },
  deleteBtn: {
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
  errorText: {
    color: Colors.error,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    alignSelf: 'center',
    marginTop: 60,
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
    maxHeight: '90%',
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: 16,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  timeField: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  toggleBtnActive: {
    backgroundColor: Colors.secondary + '15',
    borderColor: Colors.secondary,
  },
  toggleBtnInactive: {
    backgroundColor: Colors.error + '10',
    borderColor: Colors.error,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  toggleTextActive: {
    color: Colors.secondary,
  },
  toggleTextInactive: {
    color: Colors.error,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Users tab
  usersTab: {
    flex: 1,
    minHeight: 300,
  },
  usersSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  userMat: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  removeUserBtn: {
    padding: 7,
    borderRadius: 7,
    backgroundColor: Colors.error + '10',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 12,
  },
  userSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: 10,
  },
  userSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },
  availableList: {
    maxHeight: 220,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  addUserIcon: {
    padding: 7,
    borderRadius: 7,
    backgroundColor: Colors.primary + '10',
  },
  emptyListText: {
    fontSize: 13,
    color: Colors.text.disabled,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
