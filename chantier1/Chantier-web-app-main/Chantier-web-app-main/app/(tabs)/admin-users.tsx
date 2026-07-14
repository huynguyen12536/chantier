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
} from 'react-native';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useRouter } from 'expo-router';
import { Users, Search, X, Pencil as Edit2, Trash2, Check, ArrowLeft, Plus } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Translations } from '@/i18n';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/services/supabase';
import { Profile, UserRole } from '@/types';
import { isAdminUserRoleLocked } from '@/utils/role';
import { Colors } from '@/constants/colors';
import { isEmailValid } from '@/utils/email';
import {
  isPhoneValid,
  normalizePhone,
} from '@/utils/phone';
import { PhoneField } from '@/components/common/PhoneField';

type EditUserForm = {
  nom: string;
  prenom: string;
  email: string;
  matricule: string;
  phone: string;
  role: UserRole;
};

type CreateUserForm = {
  nom: string;
  prenom: string;
  email: string;
  phone: string;
  role: UserRole;
  password: string;
};

function getRoleLabel(role: UserRole, t: Translations): string {
  const labels: Record<UserRole, string> = {
    ouvrier: t.roles.ouvrier,
    chef_equipe: t.roles.chef_equipe,
    administratif: t.roles.administratif,
    admin: t.roles.admin,
  };
  return labels[role] ?? role;
}

function getUserFormRoles(t: Translations): { value: UserRole; label: string }[] {
  return [
    { value: 'ouvrier', label: t.roles.ouvrier },
    { value: 'chef_equipe', label: t.roles.chef_equipe },
    { value: 'admin', label: t.roles.admin },
  ];
}

function roleColor(role: UserRole): string {
  switch (role) {
    case 'admin': return Colors.error;
    case 'chef_equipe': return Colors.primary;
    case 'administratif': return Colors.info;
    default: return Colors.secondary;
  }
}

export default function AdminUsersScreen() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const m = t.management.modals;
  const userFormRoles = getUserFormRoles(t);
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [form, setForm] = useState<EditUserForm>({ nom: '', prenom: '', email: '', matricule: '', phone: '', role: 'ouvrier' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    role: 'ouvrier',
    password: '',
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const { headerPaddingTop } = useTabBarInset();

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('nom', { ascending: true });
      if (error) throw error;
      setUsers(data || []);
      setError(null);
    } catch {
      setError('Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (profile?.role !== 'admin') return null;

  const filtered = users.filter(u =>
    `${u.prenom} ${u.nom} ${u.email} ${u.matricule}`.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = (user: Profile) => {
    setEditingUser(user);
    setForm({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email ?? '',
      matricule: user.matricule,
      phone: user.phone ?? '',
      role: user.role,
    });
    setEditModal(true);
  };

  const deleteUser = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${supabaseUrl}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ user_id: deleteConfirm.id }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.management.errors.deleteError);
      setDeleteConfirm(null);
      load();
    } catch (e: any) {
      setError(e.message || t.management.errors.deleteUserFailed);
    } finally {
      setDeleting(false);
    }
  };

  const saveUser = async () => {
    if (!editingUser) return;
    if (!form.email.trim() || !isEmailValid(form.email)) {
      setError(t.management.errors.emailInvalid);
      return;
    }
    if (!isPhoneValid(form.phone)) {
      setError(t.management.errors.phoneRequired);
      return;
    }
    setSaving(true);
    try {
      const roleToSave =
        editingUser.id === profile?.id || isAdminUserRoleLocked(editingUser.role)
          ? editingUser.role
          : form.role;

      const { error } = await supabase
        .from('profiles')
        .update({
          nom: form.nom,
          prenom: form.prenom,
          email: form.email,
          matricule: editingUser.matricule,
          phone: normalizePhone(form.phone),
          role: roleToSave,
        })
        .eq('id', editingUser.id);
      if (error) throw error;
      setEditModal(false);
      load();
    } catch {
      setError('Impossible de sauvegarder');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setCreateForm({ nom: '', prenom: '', email: '', phone: '', role: 'ouvrier', password: '' });
    setCreateError(null);
    setCreateModal(true);
  };

  const createUser = async () => {
    if (!createForm.nom.trim() || !createForm.prenom.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError(t.management.errors.createUserRequired);
      return;
    }
    if (!isEmailValid(createForm.email)) {
      setCreateError(t.management.errors.emailInvalid);
      return;
    }
    if (!isPhoneValid(createForm.phone)) {
      setCreateError(t.management.errors.phoneRequired);
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error(t.management.errors.sessionExpired);
      const url = `${supabaseUrl}/functions/v1/create-user`;
      if (!supabaseUrl) throw new Error('Configuration serveur manquante');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          email: createForm.email.trim(),
          password: createForm.password,
          nom: createForm.nom.trim(),
          prenom: createForm.prenom.trim(),
          phone: normalizePhone(createForm.phone),
          role: createForm.role,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.management.errors.createError);
      setCreateModal(false);
      load();
    } catch (e: any) {
      setCreateError(e.message || t.management.errors.createUserFailed);
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.navigate('/(tabs)/management')}>
          <ArrowLeft size={20} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={[styles.headerIcon, { backgroundColor: Colors.info + '18' }]}>
          <Users size={20} color={Colors.info} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Utilisateurs</Text>
          <Text style={styles.headerSubtitle}>Gestion des comptes</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur..."
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
            {filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}
          </Text>
          {filtered.map(user => (
            <View key={user.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={[styles.avatar, { backgroundColor: roleColor(user.role) + '20' }]}>
                  <Text style={[styles.avatarText, { color: roleColor(user.role) }]}>
                    {user.prenom?.[0]}{user.nom?.[0]}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{user.prenom} {user.nom}</Text>
                  <Text style={styles.cardEmail}>{user.email}</Text>
                  <View style={styles.cardMeta}>
                    <View style={[styles.roleBadge, { backgroundColor: roleColor(user.role) + '15' }]}>
                      <Text style={[styles.roleText, { color: roleColor(user.role) }]}>
                        {getRoleLabel(user.role, t)}
                      </Text>
                    </View>
                    {user.matricule ? <Text style={styles.matricule}>#{user.matricule}</Text> : null}
                  </View>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(user)}>
                  <Edit2 size={16} color={Colors.primary} />
                </TouchableOpacity>
                {user.id !== profile?.id && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteConfirm(user)}>
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      <Modal visible={!!deleteConfirm} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <View style={styles.confirmIconWrap}>
              <Trash2 size={28} color={Colors.error} />
            </View>
            <Text style={styles.confirmTitle}>{m.deleteUser.title}</Text>
            <Text style={styles.confirmMsg}>
              {m.deleteUser.confirmBefore}
              <Text style={{ fontWeight: '700' }}>{deleteConfirm?.prenom} {deleteConfirm?.nom}</Text>
              {m.deleteUser.confirmAfter}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setDeleteConfirm(null)}>
                <Text style={styles.confirmCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDelete} onPress={deleteUser} disabled={deleting}>
                {deleting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmDeleteText}>{m.delete}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={createModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{m.newUser.title}</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}>
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {createError && <Text style={styles.modalError}>{createError}</Text>}
              <Text style={styles.fieldLabel}>{m.fields.firstName}</Text>
              <TextInput
                style={styles.fieldInput}
                value={createForm.prenom}
                onChangeText={v => setCreateForm(f => ({ ...f, prenom: v }))}
                placeholder={m.fields.firstName}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.fieldLabel}>{m.fields.lastName}</Text>
              <TextInput
                style={styles.fieldInput}
                value={createForm.nom}
                onChangeText={v => setCreateForm(f => ({ ...f, nom: v }))}
                placeholder={m.fields.lastName}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.fieldLabel}>{m.fields.email}</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  createForm.email.length > 0 && !isEmailValid(createForm.email) && styles.fieldInputInvalid,
                ]}
                value={createForm.email}
                onChangeText={v => { setCreateError(null); setCreateForm(f => ({ ...f, email: v })); }}
                placeholder={m.fields.emailPlaceholder}
                placeholderTextColor={Colors.text.disabled}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
              />
              <Text style={styles.fieldLabel}>{m.fields.password}</Text>
              <TextInput
                style={styles.fieldInput}
                value={createForm.password}
                onChangeText={v => setCreateForm(f => ({ ...f, password: v }))}
                placeholder={m.fields.password}
                placeholderTextColor={Colors.text.disabled}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                importantForAutofill="no"
              />
              <PhoneField
                phone={createForm.phone}
                onChangePhone={phone => { setCreateError(null); setCreateForm(f => ({ ...f, phone })); }}
                fieldKey="admin-create-user"
              />
              <Text style={styles.fieldLabel}>{m.fields.role}</Text>
              <View style={styles.roleChips}>
                {userFormRoles.map(r => {
                  const active = createForm.role === r.value;
                  const color = roleColor(r.value);
                  return (
                    <TouchableOpacity
                      key={r.value}
                      style={[styles.roleChip, active && { backgroundColor: color, borderColor: color }]}
                      onPress={() => setCreateForm(f => ({ ...f, role: r.value }))}
                    >
                      {active && <Check size={13} color="#fff" />}
                      <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ height: 16 }} />
              <TouchableOpacity style={styles.saveBtn} onPress={createUser} disabled={creating}>
                {creating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>{m.addUser.createButton}</Text>
                }
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={editModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{m.editUser.title}</Text>
              <TouchableOpacity onPress={() => setEditModal(false)}>
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>{m.fields.firstName}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.prenom}
                onChangeText={v => setForm(f => ({ ...f, prenom: v }))}
                placeholder={m.fields.firstName}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.fieldLabel}>{m.fields.lastName}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.nom}
                onChangeText={v => setForm(f => ({ ...f, nom: v }))}
                placeholder={m.fields.lastName}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.fieldLabel}>{m.fields.email}</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  form.email.length > 0 && !isEmailValid(form.email) && styles.fieldInputInvalid,
                ]}
                value={form.email}
                onChangeText={v => { setError(null); setForm(f => ({ ...f, email: v })); }}
                placeholder={m.fields.emailPlaceholder}
                placeholderTextColor={Colors.text.disabled}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.fieldLabel}>{m.fields.matricule}</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputDisabled]}
                value={form.matricule}
                editable={false}
                placeholder={m.fields.matricule}
                placeholderTextColor={Colors.text.disabled}
              />
              <PhoneField
                phone={form.phone}
                onChangePhone={phone => { setError(null); setForm(f => ({ ...f, phone })); }}
                fieldKey={editingUser?.id}
              />
              {editingUser && editingUser.id !== profile?.id && (
                <>
                  <Text style={styles.fieldLabel}>{m.fields.role}</Text>
                  {isAdminUserRoleLocked(editingUser.role) ? (
                    <View style={styles.roleLockedBox}>
                      <Text style={styles.roleLockedText}>{getRoleLabel(editingUser.role, t)}</Text>
                    </View>
                  ) : (
                    <View style={styles.roleChips}>
                      {userFormRoles.map(r => {
                        const active = form.role === r.value;
                        const color = roleColor(r.value);
                        return (
                          <TouchableOpacity
                            key={r.value}
                            style={[styles.roleChip, active && { backgroundColor: color, borderColor: color }]}
                            onPress={() => setForm(f => ({ ...f, role: r.value }))}
                          >
                            {active && <Check size={13} color="#fff" />}
                            <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>
                              {r.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </>
              )}
              <View style={{ height: 16 }} />
              <TouchableOpacity style={styles.saveBtn} onPress={saveUser} disabled={saving}>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
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
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
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
    marginTop: 8,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  cardEmail: {
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
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  matricule: {
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalError: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: Colors.error + '10',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInputInvalid: {
    borderColor: Colors.error,
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
  fieldInputDisabled: {
    opacity: 0.7,
    color: Colors.text.secondary,
  },
  roleLockedBox: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    opacity: 0.7,
  },
  roleLockedText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  roleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  roleChipTextActive: {
    color: '#fff',
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
});
