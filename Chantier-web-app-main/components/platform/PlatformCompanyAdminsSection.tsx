import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Search, X, Building2, Shield, Users, User, Pencil as Edit2, Trash2, Ban, Power } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatform } from '@/contexts/PlatformContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import {
  createCompanyAdmin,
  deletePlatformUser,
  fetchCompanies,
  fetchPlatformUsers,
  lockPlatformUser,
  PlatformUser,
  PlatformUserRoleFilter,
  resetPlatformUserPassword,
  unlockPlatformUser,
  updatePlatformUser,
} from '@/services/platform';
import { thrownErrorMessage } from '@/services/supabase';
import { Colors } from '@/constants/colors';
import { BottomSheetOverlay, SlideUpSheet, useSlideUpSheet, UserAvatar } from '@/components/common';
import { Company, UserRole } from '@/types';
import { isEmailValid } from '@/utils/email';
import { CompanySelectField } from '@/components/platform/CompanySelectField';

export type AdminSubTab = 'admins' | 'managers' | 'collab';

const SUB_TAB_ROLE: Record<AdminSubTab, PlatformUserRoleFilter> = {
  admins: 'admin',
  managers: 'chef_equipe',
  collab: 'ouvrier',
};

type CreateForm = {
  company_id: string;
  email: string;
  password: string;
  nom: string;
  prenom: string;
};

type EditForm = {
  prenom: string;
  nom: string;
  email: string;
  password: string;
};

function userDisplayName(user: PlatformUser): string {
  return `${user.prenom} ${user.nom}`.trim();
}

function accountStatusColor(actif: boolean): string {
  return actif ? Colors.secondary : Colors.error;
}

export type PlatformCompanyAdminsSectionHandle = {
  openCreate: () => void;
};

type PlatformCompanyAdminsSectionProps = {
  onError?: (message: string | null) => void;
  onSubTabChange?: (subTab: AdminSubTab) => void;
};

function companyLabel(companyId: string | null | undefined, companies: Company[], unknownLabel: string): string {
  if (!companyId) return '—';
  const co = companies.find((c) => c.id === companyId);
  return co?.name ?? unknownLabel;
}

function companySlug(companyId: string | null | undefined, companies: Company[]): string | null {
  if (!companyId) return null;
  return companies.find((c) => c.id === companyId)?.slug ?? null;
}

function roleColor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return Colors.error;
    case 'chef_equipe':
      return Colors.primary;
    case 'ouvrier':
      return Colors.info;
    default:
      return Colors.secondary;
  }
}

function roleLabel(role: UserRole, roles: Record<string, string>): string {
  return roles[role] ?? role;
}

export const PlatformCompanyAdminsSection = forwardRef<
  PlatformCompanyAdminsSectionHandle,
  PlatformCompanyAdminsSectionProps
>(function PlatformCompanyAdminsSection({ onError, onSubTabChange }, ref) {
  const { session } = useAuth();
  const { t } = useLanguage();
  const pa = t.platform.admins;
  const pc = t.platform.common;
  const { companies, setCompanies } = usePlatform();
  const { scrollBottomPadding } = useTabBarInset();
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('admins');
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ prenom: '', nom: '', email: '', password: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<PlatformUser | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<PlatformUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<CreateForm>({
    company_id: '',
    email: '',
    password: '123456',
    nom: 'Admin',
    prenom: 'Company',
  });

  const switchSubTab = useCallback(
    (subTab: AdminSubTab) => {
      setActiveSubTab(subTab);
      setSearch('');
      onSubTabChange?.(subTab);
    },
    [onSubTabChange],
  );

  useEffect(() => {
    onSubTabChange?.(activeSubTab);
  }, [activeSubTab, onSubTabChange]);

  const load = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    const role = SUB_TAB_ROLE[activeSubTab];
    try {
      const [co, us] = await Promise.all([
        fetchCompanies(session.access_token),
        fetchPlatformUsers(session.access_token, { role }),
      ]);
      setCompanies(co.companies ?? []);
      setUsers(us.users ?? []);
      setError(null);
      onError?.(null);
    } catch (e) {
      const message = thrownErrorMessage(e, pa.errors.loadFailed);
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token, activeSubTab, setCompanies, pa.errors.loadFailed, onError]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const company = companyLabel(u.company_id, companies, pc.unknownCompany).toLowerCase();
      const slug = companySlug(u.company_id, companies)?.toLowerCase() ?? '';
      return `${u.prenom} ${u.nom} ${u.email} ${company} ${slug}`.toLowerCase().includes(q);
    });
  }, [users, search, companies, pc.unknownCompany]);

  const countLabel = useMemo(() => {
    const n = String(filtered.length);
    if (activeSubTab === 'managers') {
      return filtered.length === 1
        ? pa.countManagers.replace('{{count}}', n)
        : pa.countManagersPlural.replace('{{count}}', n);
    }
    if (activeSubTab === 'collab') {
      return filtered.length === 1
        ? pa.countCollab.replace('{{count}}', n)
        : pa.countCollabPlural.replace('{{count}}', n);
    }
    return filtered.length === 1
      ? pa.count.replace('{{count}}', n)
      : pa.countPlural.replace('{{count}}', n);
  }, [activeSubTab, filtered.length, pa]);

  const emptyLabel = useMemo(() => {
    if (activeSubTab === 'managers') return pa.emptyManagers;
    if (activeSubTab === 'collab') return pa.emptyCollab;
    return pa.empty;
  }, [activeSubTab, pa]);

  const openCreate = () => {
    setCreateError(null);
    setForm({
      company_id: '',
      email: '',
      password: '123456',
      nom: 'Admin',
      prenom: 'Company',
    });
    setCreateModal(true);
  };

  useImperativeHandle(ref, () => ({ openCreate }), []);

  const hideCreate = useCallback(() => setCreateModal(false), []);
  const createSheet = useSlideUpSheet(hideCreate);

  useEffect(() => {
    if (createModal) createSheet.open();
  }, [createModal, createSheet.open]);

  const hideEdit = useCallback(() => {
    setEditModal(false);
    setEditingUser(null);
  }, []);
  const editSheet = useSlideUpSheet(hideEdit);

  useEffect(() => {
    if (editModal) editSheet.open();
  }, [editModal, editSheet.open]);

  const canManageUser = activeSubTab === 'admins';

  const openEdit = (user: PlatformUser) => {
    setEditingUser(user);
    setEditError(null);
    setEditForm({
      prenom: user.prenom,
      nom: user.nom,
      email: user.email ?? '',
      password: '',
    });
    setEditModal(true);
  };

  const onSaveEdit = async () => {
    if (!session?.access_token || !editingUser) return;
    if (!editForm.email.trim() || !isEmailValid(editForm.email)) {
      setEditError(pa.errors.invalidEmail);
      return;
    }
    if (!editForm.nom.trim() || !editForm.prenom.trim()) {
      setEditError(pa.errors.requiredFields);
      return;
    }
    const newPassword = editForm.password.trim();
    if (newPassword && newPassword.length < 6) {
      setEditError(pa.errors.passwordMinLength);
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      await updatePlatformUser(session.access_token, editingUser.id, {
        prenom: editForm.prenom.trim(),
        nom: editForm.nom.trim(),
        email: editForm.email.trim(),
      });
      if (newPassword) {
        await resetPlatformUserPassword(session.access_token, editingUser.id, newPassword);
      }
      editSheet.dismiss();
      await load();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : pa.errors.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  const onToggleStatus = async () => {
    if (!session?.access_token || !statusConfirm) return;
    setTogglingStatus(true);
    setError(null);
    try {
      if (statusConfirm.actif) {
        await lockPlatformUser(session.access_token, statusConfirm.id);
      } else {
        await unlockPlatformUser(session.access_token, statusConfirm.id);
      }
      setStatusConfirm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : pa.errors.statusFailed);
      setStatusConfirm(null);
    } finally {
      setTogglingStatus(false);
    }
  };

  const onDelete = async () => {
    if (!session?.access_token || !deleteConfirm) return;
    setDeleting(true);
    setError(null);
    try {
      await deletePlatformUser(session.access_token, deleteConfirm.id);
      setDeleteConfirm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : pa.errors.deleteFailed);
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  const onCreate = async () => {
    if (!session?.access_token) return;
    if (!form.company_id) {
      setCreateError(pa.errors.selectCompany);
      return;
    }
    if (!form.email.trim() || !isEmailValid(form.email)) {
      setCreateError(pa.errors.invalidEmail);
      return;
    }
    if (!form.nom.trim() || !form.prenom.trim() || form.password.length < 6) {
      setCreateError(pa.errors.requiredFields);
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createCompanyAdmin(session.access_token, {
        company_id: form.company_id,
        email: form.email.trim(),
        password: form.password,
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
      });
      createSheet.dismiss();
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : pa.errors.createFailed);
    } finally {
      setCreating(false);
    }
  };

  const subTabs: { key: AdminSubTab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'admins',
      label: pa.subTabs.admins,
      icon: (
        <Shield
          size={16}
          color={activeSubTab === 'admins' ? Colors.primary : Colors.text.secondary}
        />
      ),
    },
    {
      key: 'managers',
      label: pa.subTabs.managers,
      icon: (
        <Users
          size={16}
          color={activeSubTab === 'managers' ? Colors.primary : Colors.text.secondary}
        />
      ),
    },
    {
      key: 'collab',
      label: pa.subTabs.collab,
      icon: (
        <User
          size={16}
          color={activeSubTab === 'collab' ? Colors.primary : Colors.text.secondary}
        />
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <View style={styles.subTabBar}>
          {subTabs.map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              style={[styles.subTab, activeSubTab === key && styles.subTabActive]}
              onPress={() => switchSubTab(key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: activeSubTab === key }}
            >
              {icon}
              <Text style={[styles.subTabText, activeSubTab === key && styles.subTabTextActive]}>
                {label}
              </Text>
              {activeSubTab === key && filtered.length > 0 ? (
                <View style={styles.tabCount}>
                  <Text style={styles.tabCountText}>{filtered.length}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={pa.searchPlaceholder}
            placeholderTextColor={Colors.text.disabled}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityRole="button">
              <X size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.centered} color={Colors.primary} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={Colors.primary}
            />
          }
        >
          <Text style={styles.countLabel}>{countLabel}</Text>
          {!canManageUser && filtered.length > 0 ? (
            <Text style={styles.monitoringHint}>{pa.monitoringHint}</Text>
          ) : null}

          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>{emptyLabel}</Text>
          ) : (
            filtered.map((user) => {
              const name = companyLabel(user.company_id, companies, pc.unknownCompany);
              const slug = companySlug(user.company_id, companies);
              const role = user.role as UserRole;
              const badgeColor = roleColor(role);
              const statusColor = accountStatusColor(user.actif);
              const displayName = userDisplayName(user);
              return (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userCardMainRow}>
                    <View style={styles.cardContent}>
                      <UserAvatar
                        avatarPath={user.avatar_path}
                        avatarUpdatedAt={user.avatar_updated_at}
                        prenom={user.prenom}
                        nom={user.nom}
                        role={role}
                        size={44}
                        variant="initials"
                        style={styles.avatar}
                      />
                      <View style={styles.userInfo}>
                        <View style={styles.nameRow}>
                          <Text style={styles.cardName} numberOfLines={1}>
                            {displayName}
                          </Text>
                          {!canManageUser ? (
                            <View style={[styles.roleBadge, { backgroundColor: badgeColor + '15' }]}>
                              <Text style={[styles.roleText, { color: badgeColor }]}>
                                {roleLabel(role, t.roles)}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {!!user.email && (
                          <Text style={styles.cardEmail} numberOfLines={1}>
                            {user.email}
                          </Text>
                        )}
                        <View style={styles.companyBadge}>
                          <Building2 size={11} color={Colors.primary} />
                          <Text style={styles.companyBadgeText} numberOfLines={1}>
                            {name}
                            {slug ? ` · ${slug}` : ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {canManageUser ? (
                      <View style={styles.cardActionColumn}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {user.actif ? pa.statusActive : pa.statusDisabled}
                          </Text>
                        </View>
                        <View style={styles.cardActions}>
                          <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => openEdit(user)}
                            accessibilityRole="button"
                            accessibilityLabel={pa.actions.edit}
                          >
                            <Edit2 size={16} color={Colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.statusBtn}
                            onPress={() => setStatusConfirm(user)}
                            accessibilityRole="button"
                            accessibilityLabel={user.actif ? pa.actions.disable : pa.actions.activate}
                          >
                            {user.actif ? (
                              <Ban size={16} color={Colors.warning} />
                            ) : (
                              <Power size={16} color={Colors.secondary} />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => setDeleteConfirm(user)}
                            accessibilityRole="button"
                            accessibilityLabel={pa.actions.delete}
                          >
                            <Trash2 size={16} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal visible={createModal} animationType="fade" transparent onRequestClose={createSheet.dismiss}>
        <BottomSheetOverlay style={styles.modalOverlay} onDismiss={createSheet.dismiss}>
          <SlideUpSheet slideAnim={createSheet.slideAnim} style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pa.createModal.title}</Text>
              <TouchableOpacity onPress={createSheet.dismiss} accessibilityRole="button">
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {createError ? <Text style={styles.modalError}>{createError}</Text> : null}

              <Text style={styles.fieldLabel}>{pa.fields.company}</Text>
              <CompanySelectField
                value={form.company_id}
                onChange={(company_id) => {
                  setCreateError(null);
                  setForm((f) => ({ ...f, company_id }));
                }}
                companies={companies}
                placeholder={pa.placeholders.company}
                sheetTitle={pa.fields.company}
              />

              <Text style={styles.fieldLabel}>{pa.fields.firstName}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.prenom}
                onChangeText={(prenom) => setForm((f) => ({ ...f, prenom }))}
                placeholder={pa.placeholders.firstName}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.fieldLabel}>{pa.fields.lastName}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.nom}
                onChangeText={(nom) => setForm((f) => ({ ...f, nom }))}
                placeholder={pa.placeholders.lastName}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.fieldLabel}>{pa.fields.email}</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  form.email.length > 0 && !isEmailValid(form.email) && styles.fieldInputInvalid,
                ]}
                value={form.email}
                onChangeText={(email) => {
                  setCreateError(null);
                  setForm((f) => ({ ...f, email }));
                }}
                placeholder={pa.placeholders.email}
                placeholderTextColor={Colors.text.disabled}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.fieldLabel}>{pa.fields.password}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.password}
                onChangeText={(password) => setForm((f) => ({ ...f, password }))}
                placeholder={pa.placeholders.password}
                placeholderTextColor={Colors.text.disabled}
                secureTextEntry
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={onCreate}
                disabled={creating}
                accessibilityRole="button"
              >
                {creating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{pa.createModal.createButton}</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: Platform.OS === 'web' ? 16 : 32 }} />
            </ScrollView>
          </SlideUpSheet>
        </BottomSheetOverlay>
      </Modal>

      <Modal visible={editModal} animationType="fade" transparent onRequestClose={editSheet.dismiss}>
        <BottomSheetOverlay style={styles.modalOverlay} onDismiss={editSheet.dismiss}>
          <SlideUpSheet slideAnim={editSheet.slideAnim} style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pa.editModal.title}</Text>
              <TouchableOpacity onPress={editSheet.dismiss} accessibilityRole="button">
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {editError ? <Text style={styles.modalError}>{editError}</Text> : null}

              <Text style={styles.fieldLabel}>{pa.fields.firstName}</Text>
              <TextInput
                style={styles.fieldInput}
                value={editForm.prenom}
                onChangeText={(prenom) => {
                  setEditError(null);
                  setEditForm((f) => ({ ...f, prenom }));
                }}
                placeholder={pa.placeholders.firstName}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.fieldLabel}>{pa.fields.lastName}</Text>
              <TextInput
                style={styles.fieldInput}
                value={editForm.nom}
                onChangeText={(nom) => {
                  setEditError(null);
                  setEditForm((f) => ({ ...f, nom }));
                }}
                placeholder={pa.placeholders.lastName}
                placeholderTextColor={Colors.text.disabled}
              />
              <Text style={styles.fieldLabel}>{pa.fields.email}</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  editForm.email.length > 0 && !isEmailValid(editForm.email) && styles.fieldInputInvalid,
                ]}
                value={editForm.email}
                onChangeText={(email) => {
                  setEditError(null);
                  setEditForm((f) => ({ ...f, email }));
                }}
                placeholder={pa.placeholders.email}
                placeholderTextColor={Colors.text.disabled}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.fieldLabel}>{pa.fields.password}</Text>
              <TextInput
                style={styles.fieldInput}
                value={editForm.password}
                onChangeText={(password) => {
                  setEditError(null);
                  setEditForm((f) => ({ ...f, password }));
                }}
                placeholder={pa.placeholders.password}
                placeholderTextColor={Colors.text.disabled}
                secureTextEntry
              />
              <Text style={styles.fieldHint}>{pa.editModal.passwordHint}</Text>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={onSaveEdit}
                disabled={saving}
                accessibilityRole="button"
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{pa.editModal.saveButton}</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: Platform.OS === 'web' ? 16 : 32 }} />
            </ScrollView>
          </SlideUpSheet>
        </BottomSheetOverlay>
      </Modal>

      <Modal visible={!!statusConfirm} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <View
              style={[
                styles.confirmIconWrap,
                {
                  backgroundColor:
                    (statusConfirm?.actif ? Colors.warning : Colors.secondary) + '15',
                },
              ]}
            >
              {statusConfirm?.actif ? (
                <Ban size={28} color={Colors.warning} />
              ) : (
                <Power size={28} color={Colors.secondary} />
              )}
            </View>
            <Text style={styles.confirmTitle}>
              {statusConfirm?.actif ? pa.disableModal.title : pa.activateModal.title}
            </Text>
            <Text style={styles.confirmMsg}>
              {statusConfirm?.actif ? pa.disableModal.messageBefore : pa.activateModal.messageBefore}
              <Text style={{ fontWeight: '700' }}>
                {statusConfirm ? userDisplayName(statusConfirm) : ''}
              </Text>
              {statusConfirm?.actif ? pa.disableModal.messageAfter : pa.activateModal.messageAfter}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setStatusConfirm(null)}
                accessibilityRole="button"
              >
                <Text style={styles.confirmCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmPrimary,
                  statusConfirm?.actif ? styles.confirmDisable : styles.confirmActivate,
                ]}
                onPress={onToggleStatus}
                disabled={togglingStatus}
                accessibilityRole="button"
              >
                {togglingStatus ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmPrimaryText}>
                    {statusConfirm?.actif ? pa.disableModal.confirm : pa.activateModal.confirm}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!deleteConfirm} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <View style={styles.confirmIconWrap}>
              <Trash2 size={28} color={Colors.error} />
            </View>
            <Text style={styles.confirmTitle}>{pa.deleteModal.title}</Text>
            <Text style={styles.confirmMsg}>
              {pa.deleteModal.messageBefore}
              <Text style={{ fontWeight: '700' }}>
                {deleteConfirm ? userDisplayName(deleteConfirm) : ''}
              </Text>
              {pa.deleteModal.messageAfter}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.confirmCancel}
                onPress={() => setDeleteConfirm(null)}
                accessibilityRole="button"
              >
                <Text style={styles.confirmCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDelete}
                onPress={onDelete}
                disabled={deleting}
                accessibilityRole="button"
              >
                {deleting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteText}>{pa.deleteModal.confirm}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  scrollView: { flex: 1 },
  subHeader: {
    backgroundColor: '#FFF7F2',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 53, 0.14)',
  },
  subTabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },
  subTabActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  subTabTextActive: {
    color: Colors.text.primary,
  },
  tabCount: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF7F2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 53, 0.14)',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text.primary },
  centered: { flex: 1, alignSelf: 'center', marginTop: 60 },
  countLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  monitoringHint: {
    fontSize: 12,
    color: Colors.text.disabled,
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontStyle: 'italic',
  },
  emptyText: {
    padding: 24,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  userCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    minWidth: 0,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.12)',
  },
  userCardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
    minWidth: 0,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minWidth: 0,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  userInfo: { flex: 1, minWidth: 0, gap: 4 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    flexShrink: 1,
    minWidth: 0,
  },
  cardEmail: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
    flexShrink: 1,
    minWidth: 0,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0,
  },
  roleText: { fontSize: 11, fontWeight: '600' },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    maxWidth: '100%',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: Colors.primary + '10',
  },
  companyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    flexShrink: 1,
  },
  cardActionColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  editBtn: { padding: 8, borderRadius: 8, backgroundColor: Colors.primary + '10' },
  statusBtn: { padding: 8, borderRadius: 8, backgroundColor: Colors.warning + '10' },
  deleteBtn: { padding: 8, borderRadius: 8, backgroundColor: Colors.error + '10' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-end',
    flexShrink: 0,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
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
    maxWidth: 420,
    width: '100%',
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
    textAlign: 'center',
  },
  confirmMsg: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  confirmCancelText: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  confirmPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmDisable: { backgroundColor: Colors.warning },
  confirmActivate: { backgroundColor: Colors.secondary },
  confirmPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  confirmDelete: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: Colors.error,
  },
  confirmDeleteText: { fontSize: 15, fontWeight: '700', color: '#fff' },
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
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  modalError: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: Colors.error + '10',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    marginBottom: 8,
  },
  fieldHint: { fontSize: 12, color: Colors.text.disabled, marginBottom: 16 },
  fieldInputInvalid: { borderColor: Colors.error },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
