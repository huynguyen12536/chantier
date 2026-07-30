import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import {
  Building2,
  Search,
  X,
  Hash,
  MapPin,
  Pencil as Edit2,
  Trash2,
  Ban,
  Power,
  ListFilter,
  Check,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatform } from '@/contexts/PlatformContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import {
  createCompany,
  deleteCompany,
  fetchCompanies,
  fetchCompany,
  setCompanyStatus,
  updateCompany,
} from '@/services/platform';
import { Colors } from '@/constants/colors';
import { BottomSheetOverlay, SlideUpSheet, useSlideUpSheet } from '@/components/common';
import { Company } from '@/types';
import { formatDate } from '@/utils/date';
import { thrownErrorMessage } from '@/services/supabase';

type StatusFilter = 'all' | Company['status'];

export type PlatformCompaniesSectionHandle = {
  openCreate: () => void;
};

type PlatformCompaniesSectionProps = {
  onError?: (message: string | null) => void;
};

type CompanyForm = {
  name: string;
  slug: string;
  address: string;
  tax_id: string;
};

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const DEFAULT_COMPANY_SLUG = 'default-company';
const TAX_ID_PATTERN = /^[A-Za-z0-9\-.\s]+$/;

function truncate(text: string, max = 48): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function suggestSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function statusLabel(status: Company['status'], t: ReturnType<typeof useLanguage>['t']): string {
  const labels = {
    active: t.platform.companies.statusActive,
    disabled: t.platform.companies.statusDisabled,
    pending: t.platform.companies.statusPending,
  };
  return labels[status];
}

function isDefaultCompany(company: Company): boolean {
  return company.slug === DEFAULT_COMPANY_SLUG;
}

function statusColor(status: Company['status']): string {
  switch (status) {
    case 'active':
      return Colors.secondary;
    case 'disabled':
      return Colors.error;
    default:
      return Colors.warning;
  }
}

export const PlatformCompaniesSection = forwardRef<
  PlatformCompaniesSectionHandle,
  PlatformCompaniesSectionProps
>(function PlatformCompaniesSection({ onError }, ref) {
  const { session } = useAuth();
  const { t, dateLocale } = useLanguage();
  const pc = t.platform.companies;
  const { setCompanies } = usePlatform();
  const { scrollBottomPadding } = useTabBarInset();

  const [companies, setLocalCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [filterModal, setFilterModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [form, setForm] = useState<CompanyForm>({ name: '', slug: '', address: '', tax_id: '' });
  const [editModal, setEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editForm, setEditForm] = useState<CompanyForm>({ name: '', slug: '', address: '', tax_id: '' });
  const [editSlugManual, setEditSlugManual] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState<Company | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [detailCompany, setDetailCompany] = useState<Company | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetchCompanies(session.access_token);
      const list = res.companies ?? [];
      setLocalCompanies(list);
      setCompanies(list);
      setError(null);
      onError?.(null);
    } catch (e) {
      const message = thrownErrorMessage(e, pc.errors.loadFailed);
      setError(message);
      onError?.(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token, setCompanies, pc.errors.loadFailed, onError]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return companies.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (!q) return true;
      return `${c.name} ${c.slug} ${c.address ?? ''} ${c.tax_id ?? ''}`.toLowerCase().includes(q);
    });
  }, [companies, search, statusFilter]);

  const countLabel =
    filtered.length === 1
      ? pc.count.replace('{{count}}', String(filtered.length))
      : pc.countPlural.replace('{{count}}', String(filtered.length));

  const openCreate = () => {
    setCreateError(null);
    setSlugManual(false);
    setForm({ name: '', slug: '', address: '', tax_id: '' });
    setCreateModal(true);
  };

  useImperativeHandle(ref, () => ({ openCreate }), []);

  const onNameChange = (name: string) => {
    setCreateError(null);
    setForm((prev) => ({
      name,
      slug: slugManual ? prev.slug : suggestSlug(name),
    }));
  };

  const onSlugChange = (slug: string) => {
    setCreateError(null);
    setSlugManual(true);
    setForm((prev) => ({ ...prev, slug: slug.toLowerCase() }));
  };

  const onCreate = async () => {
    if (!session?.access_token) return;
    const name = form.name.trim();
    const slug = form.slug.trim();
    const address = form.address.trim();
    const tax_id = form.tax_id.trim();
    if (!name) {
      setCreateError(pc.errors.nameRequired);
      return;
    }
    if (!slug) {
      setCreateError(pc.errors.slugRequired);
      return;
    }
    if (!SLUG_PATTERN.test(slug)) {
      setCreateError(pc.errors.slugInvalid);
      return;
    }
    if (tax_id && !TAX_ID_PATTERN.test(tax_id)) {
      setCreateError(pc.errors.taxIdInvalid);
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createCompany(session.access_token, {
        name,
        slug,
        address: address || null,
        tax_id: tax_id || null,
      });
      createSheet.dismiss();
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : pc.errors.createFailed);
    } finally {
      setCreating(false);
    }
  };

  const validateCompanyForm = (
    values: CompanyForm,
    setFieldError: (msg: string) => void,
  ): boolean => {
    const name = values.name.trim();
    const slug = values.slug.trim();
    const tax_id = values.tax_id.trim();
    if (!name) {
      setFieldError(pc.errors.nameRequired);
      return false;
    }
    if (!slug) {
      setFieldError(pc.errors.slugRequired);
      return false;
    }
    if (!SLUG_PATTERN.test(slug)) {
      setFieldError(pc.errors.slugInvalid);
      return false;
    }
    if (tax_id && !TAX_ID_PATTERN.test(tax_id)) {
      setFieldError(pc.errors.taxIdInvalid);
      return false;
    }
    return true;
  };

  const openEdit = (company: Company) => {
    setEditingCompany(company);
    setEditSlugManual(true);
    setEditError(null);
    setEditForm({
      name: company.name,
      slug: company.slug,
      address: company.address ?? '',
      tax_id: company.tax_id ?? '',
    });
    setEditModal(true);
  };

  const onEditNameChange = (name: string) => {
    setEditError(null);
    setEditForm((prev) => ({
      ...prev,
      name,
      slug: editSlugManual ? prev.slug : suggestSlug(name),
    }));
  };

  const onEditSlugChange = (slug: string) => {
    setEditError(null);
    setEditSlugManual(true);
    setEditForm((prev) => ({ ...prev, slug: slug.toLowerCase() }));
  };

  const onSaveEdit = async () => {
    if (!session?.access_token || !editingCompany) return;
    if (!validateCompanyForm(editForm, setEditError)) return;
    setSaving(true);
    setEditError(null);
    try {
      await updateCompany(session.access_token, editingCompany.id, {
        name: editForm.name.trim(),
        slug: editForm.slug.trim(),
        address: editForm.address.trim() || null,
        tax_id: editForm.tax_id.trim() || null,
      });
      editSheet.dismiss();
      await load();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : pc.errors.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  const onToggleStatus = async () => {
    if (!session?.access_token || !statusConfirm) return;
    const nextStatus: Company['status'] =
      statusConfirm.status === 'disabled' ? 'active' : 'disabled';
    setTogglingStatus(true);
    setError(null);
    try {
      await setCompanyStatus(session.access_token, statusConfirm.id, nextStatus);
      setStatusConfirm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : pc.errors.statusFailed);
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
      await deleteCompany(session.access_token, deleteConfirm.id);
      setDeleteConfirm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : pc.errors.deleteFailed);
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: pc.statusAll },
    { key: 'active', label: pc.statusActive },
    { key: 'disabled', label: pc.statusDisabled },
    { key: 'pending', label: pc.statusPending },
  ];

  const activeStatusLabel =
    statusOptions.find((option) => option.key === statusFilter)?.label ?? pc.statusAll;

  const onSelectStatus = (key: StatusFilter) => {
    setStatusFilter(key);
    filterSheet.dismiss();
  };

  const hideFilter = useCallback(() => setFilterModal(false), []);
  const filterSheet = useSlideUpSheet(hideFilter);

  const hideCreate = useCallback(() => setCreateModal(false), []);
  const createSheet = useSlideUpSheet(hideCreate);

  const hideEdit = useCallback(() => {
    setEditModal(false);
    setEditingCompany(null);
  }, []);
  const editSheet = useSlideUpSheet(hideEdit);

  const hideDetail = useCallback(() => {
    setDetailCompany(null);
    setDetailError(null);
    setDetailLoading(false);
  }, []);
  const detailSheet = useSlideUpSheet(hideDetail);

  useEffect(() => {
    if (filterModal) filterSheet.open();
  }, [filterModal, filterSheet.open]);

  useEffect(() => {
    if (createModal) createSheet.open();
  }, [createModal, createSheet.open]);

  useEffect(() => {
    if (editModal) editSheet.open();
  }, [editModal, editSheet.open]);

  useEffect(() => {
    if (detailCompany) detailSheet.open();
  }, [detailCompany, detailSheet.open]);

  const closeDetail = () => detailSheet.dismiss();

  const openDetail = async (company: Company) => {
    setDetailCompany(company);
    setDetailError(null);
    if (!session?.access_token) return;
    setDetailLoading(true);
    try {
      const res = await fetchCompany(session.access_token, company.id);
      setDetailCompany(res.company);
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : pc.errors.detailFailed);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={pc.searchPlaceholder}
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
        <TouchableOpacity
          style={[styles.filterBtn, statusFilter !== 'all' && styles.filterBtnActive]}
          onPress={() => setFilterModal(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${pc.statusFilter}: ${activeStatusLabel}`}
        >
          <ListFilter
            size={16}
            color={statusFilter !== 'all' ? Colors.primary : Colors.text.secondary}
            strokeWidth={2.2}
          />
          {statusFilter !== 'all' ? (
            <Text style={styles.filterBtnLabel} numberOfLines={1}>
              {activeStatusLabel}
            </Text>
          ) : null}
        </TouchableOpacity>
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

          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>{pc.empty}</Text>
          ) : (
            filtered.map((company) => {
              const color = statusColor(company.status);
              const protectedCompany = isDefaultCompany(company);
              const canToggleStatus = !protectedCompany;
              const canRemove = !protectedCompany;
              return (
                <View key={company.id} style={styles.userCard}>
                  <View style={styles.userCardMainRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.cardPressArea,
                        pressed && styles.cardPressAreaPressed,
                      ]}
                      onPress={() => openDetail(company)}
                      accessibilityRole="button"
                      accessibilityLabel={pc.detailModal.viewDetails.replace(
                        '{{name}}',
                        company.name,
                      )}
                    >
                      <View style={styles.avatar}>
                        <Building2 size={20} color={Colors.primary} strokeWidth={2.2} />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.cardName} numberOfLines={2}>
                          {company.name}
                        </Text>
                        <View style={styles.cardMeta}>
                          <View style={styles.slugBadge}>
                            <Hash size={11} color={Colors.text.disabled} />
                            <Text style={styles.matricule}>{company.slug}</Text>
                          </View>
                        </View>
                        {company.address ? (
                          <View style={styles.cardDetails}>
                            <View style={styles.detailRow}>
                              <MapPin
                                size={11}
                                color={Colors.text.disabled}
                                style={styles.detailIcon}
                              />
                              <Text style={styles.detailText}>{company.address}</Text>
                            </View>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                    <View style={styles.cardActionColumn}>
                      <View style={[styles.statusBadge, { backgroundColor: color + '15' }]}>
                        <Text style={[styles.statusText, { color }]}>
                          {statusLabel(company.status, t)}
                        </Text>
                      </View>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => openEdit(company)}
                          accessibilityRole="button"
                          accessibilityLabel={pc.actions.edit}
                        >
                          <Edit2 size={16} color={Colors.primary} />
                        </TouchableOpacity>
                        {canToggleStatus ? (
                          <TouchableOpacity
                            style={styles.statusBtn}
                            onPress={() => setStatusConfirm(company)}
                            accessibilityRole="button"
                            accessibilityLabel={
                              company.status === 'disabled'
                                ? pc.actions.activate
                                : pc.actions.disable
                            }
                          >
                            {company.status === 'disabled' ? (
                              <Power size={16} color={Colors.secondary} />
                            ) : (
                              <Ban size={16} color={Colors.warning} />
                            )}
                          </TouchableOpacity>
                        ) : null}
                        {canRemove ? (
                          <TouchableOpacity
                            style={styles.deleteBtn}
                            onPress={() => setDeleteConfirm(company)}
                            accessibilityRole="button"
                            accessibilityLabel={pc.actions.delete}
                          >
                            <Trash2 size={16} color={Colors.error} />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal visible={filterModal} animationType="fade" transparent onRequestClose={filterSheet.dismiss}>
        <BottomSheetOverlay style={styles.filterOverlay} onDismiss={filterSheet.dismiss}>
          <SlideUpSheet slideAnim={filterSheet.slideAnim} style={styles.filterSheet}>
            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>{pc.filterTitle}</Text>
              <TouchableOpacity onPress={filterSheet.dismiss} accessibilityRole="button">
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            {statusOptions.map(({ key, label }) => {
              const selected = statusFilter === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.filterOption, selected && styles.filterOptionActive]}
                  onPress={() => onSelectStatus(key)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.filterOptionText, selected && styles.filterOptionTextActive]}>
                    {label}
                  </Text>
                  {selected ? <Check size={18} color={Colors.primary} strokeWidth={2.5} /> : null}
                </TouchableOpacity>
              );
            })}
          </SlideUpSheet>
        </BottomSheetOverlay>
      </Modal>

      <Modal visible={createModal} animationType="fade" transparent onRequestClose={createSheet.dismiss}>
        <BottomSheetOverlay style={styles.modalOverlay} onDismiss={createSheet.dismiss}>
          <SlideUpSheet slideAnim={createSheet.slideAnim} style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pc.createModal.title}</Text>
              <TouchableOpacity onPress={createSheet.dismiss} accessibilityRole="button">
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {createError ? <Text style={styles.modalError}>{createError}</Text> : null}

              <Text style={styles.fieldLabel}>{pc.fields.name}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.name}
                onChangeText={onNameChange}
                placeholder={pc.fields.name}
                placeholderTextColor={Colors.text.disabled}
                autoCapitalize="words"
              />

              <Text style={styles.fieldLabel}>{pc.fields.slug}</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  form.slug.length > 0 && !SLUG_PATTERN.test(form.slug) && styles.fieldInputInvalid,
                ]}
                value={form.slug}
                onChangeText={onSlugChange}
                placeholder="my-company"
                placeholderTextColor={Colors.text.disabled}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.fieldHint}>{pc.createModal.slugHint}</Text>

              <Text style={styles.fieldLabel}>{pc.fields.address}</Text>
              <TextInput
                style={styles.fieldInput}
                value={form.address}
                onChangeText={(address) => {
                  setCreateError(null);
                  setForm((prev) => ({ ...prev, address }));
                }}
                placeholder={pc.fields.address}
                placeholderTextColor={Colors.text.disabled}
                autoCapitalize="sentences"
              />

              <Text style={styles.fieldLabel}>{pc.fields.taxId}</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  form.tax_id.length > 0 && !TAX_ID_PATTERN.test(form.tax_id) && styles.fieldInputInvalid,
                ]}
                value={form.tax_id}
                onChangeText={(tax_id) => {
                  setCreateError(null);
                  setForm((prev) => ({ ...prev, tax_id }));
                }}
                placeholder={pc.fields.taxId}
                placeholderTextColor={Colors.text.disabled}
                autoCapitalize="characters"
                autoCorrect={false}
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
                  <Text style={styles.saveBtnText}>{pc.createModal.createButton}</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: Platform.OS === 'web' ? 16 : 32 }} />
            </ScrollView>
          </SlideUpSheet>
        </BottomSheetOverlay>
      </Modal>

      <Modal
        visible={editModal}
        animationType="fade"
        transparent
        onRequestClose={editSheet.dismiss}
      >
        <BottomSheetOverlay style={styles.modalOverlay} onDismiss={editSheet.dismiss}>
          <SlideUpSheet slideAnim={editSheet.slideAnim} style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pc.editModal.title}</Text>
              <TouchableOpacity onPress={editSheet.dismiss} accessibilityRole="button">
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {editError ? <Text style={styles.modalError}>{editError}</Text> : null}

              <Text style={styles.fieldLabel}>{pc.fields.name}</Text>
              <TextInput
                style={styles.fieldInput}
                value={editForm.name}
                onChangeText={onEditNameChange}
                placeholder={pc.fields.name}
                placeholderTextColor={Colors.text.disabled}
                autoCapitalize="words"
              />

              <Text style={styles.fieldLabel}>{pc.fields.slug}</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  editForm.slug.length > 0 && !SLUG_PATTERN.test(editForm.slug) && styles.fieldInputInvalid,
                ]}
                value={editForm.slug}
                onChangeText={onEditSlugChange}
                placeholder="my-company"
                placeholderTextColor={Colors.text.disabled}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.fieldHint}>{pc.editModal.slugHint}</Text>

              <Text style={styles.fieldLabel}>{pc.fields.address}</Text>
              <TextInput
                style={styles.fieldInput}
                value={editForm.address}
                onChangeText={(address) => {
                  setEditError(null);
                  setEditForm((prev) => ({ ...prev, address }));
                }}
                placeholder={pc.fields.address}
                placeholderTextColor={Colors.text.disabled}
                autoCapitalize="sentences"
              />

              <Text style={styles.fieldLabel}>{pc.fields.taxId}</Text>
              <TextInput
                style={[
                  styles.fieldInput,
                  editForm.tax_id.length > 0 && !TAX_ID_PATTERN.test(editForm.tax_id) && styles.fieldInputInvalid,
                ]}
                value={editForm.tax_id}
                onChangeText={(tax_id) => {
                  setEditError(null);
                  setEditForm((prev) => ({ ...prev, tax_id }));
                }}
                placeholder={pc.fields.taxId}
                placeholderTextColor={Colors.text.disabled}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={onSaveEdit}
                disabled={saving}
                accessibilityRole="button"
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{pc.editModal.saveButton}</Text>
                )}
              </TouchableOpacity>
              <View style={{ height: Platform.OS === 'web' ? 16 : 32 }} />
            </ScrollView>
          </SlideUpSheet>
        </BottomSheetOverlay>
      </Modal>

      <Modal visible={!!detailCompany} animationType="fade" transparent onRequestClose={closeDetail}>
        <BottomSheetOverlay style={styles.modalOverlay} onDismiss={closeDetail}>
          <SlideUpSheet slideAnim={detailSheet.slideAnim} style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pc.detailModal.title}</Text>
              <TouchableOpacity onPress={closeDetail} accessibilityRole="button">
                <X size={22} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            {detailCompany ? (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.detailScrollContent}
              >
                {detailLoading ? (
                  <ActivityIndicator
                    style={styles.detailLoader}
                    color={Colors.primary}
                    size="small"
                  />
                ) : null}
                {detailError ? <Text style={styles.modalError}>{detailError}</Text> : null}

                <Text style={styles.fieldLabel}>{pc.fields.name}</Text>
                <View style={styles.detailValueBox}>
                  <Text style={styles.detailValueText}>{detailCompany.name}</Text>
                </View>

                <Text style={styles.fieldLabel}>{pc.fields.slug}</Text>
                <View style={styles.detailValueBox}>
                  <Text style={styles.detailValueText}>{detailCompany.slug}</Text>
                </View>

                <Text style={styles.fieldLabel}>{pc.detailModal.status}</Text>
                <View style={styles.detailStatusRow}>
                  <View
                    style={[
                      styles.detailStatusBadge,
                      { backgroundColor: statusColor(detailCompany.status) + '15' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailStatusText,
                        { color: statusColor(detailCompany.status) },
                      ]}
                    >
                      {statusLabel(detailCompany.status, t)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.fieldLabel}>{pc.fields.address}</Text>
                <View style={styles.detailValueBox}>
                  <Text style={styles.detailValueText}>
                    {detailCompany.address?.trim() || pc.detailModal.noAddress}
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>{pc.fields.taxId}</Text>
                <View style={styles.detailValueBox}>
                  <Text style={styles.detailValueText}>
                    {detailCompany.tax_id?.trim() || pc.detailModal.noTaxId}
                  </Text>
                </View>

                {detailCompany.created_at ? (
                  <>
                    <Text style={styles.fieldLabel}>{pc.detailModal.createdAt}</Text>
                    <View style={styles.detailValueBox}>
                      <Text style={styles.detailValueText}>
                        {formatDate(detailCompany.created_at, dateLocale)}
                      </Text>
                    </View>
                  </>
                ) : null}

                <TouchableOpacity
                  style={styles.detailCloseBtn}
                  onPress={closeDetail}
                  accessibilityRole="button"
                  accessibilityLabel={pc.detailModal.closeButton}
                >
                  <Text style={styles.detailCloseBtnText}>{pc.detailModal.closeButton}</Text>
                </TouchableOpacity>
                <View style={{ height: Platform.OS === 'web' ? 16 : 32 }} />
              </ScrollView>
            ) : null}
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
                    (statusConfirm?.status === 'disabled' ? Colors.secondary : Colors.warning) + '15',
                },
              ]}
            >
              {statusConfirm?.status === 'disabled' ? (
                <Power size={28} color={Colors.secondary} />
              ) : (
                <Ban size={28} color={Colors.warning} />
              )}
            </View>
            <Text style={styles.confirmTitle}>
              {statusConfirm?.status === 'disabled'
                ? pc.activateModal.title
                : pc.disableModal.title}
            </Text>
            <Text style={styles.confirmMsg}>
              {statusConfirm?.status === 'disabled'
                ? pc.activateModal.messageBefore
                : pc.disableModal.messageBefore}
              <Text style={{ fontWeight: '700' }}>{statusConfirm?.name}</Text>
              {statusConfirm?.status === 'disabled'
                ? pc.activateModal.messageAfter
                : pc.disableModal.messageAfter}
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
                  statusConfirm?.status === 'disabled'
                    ? styles.confirmActivate
                    : styles.confirmDisable,
                ]}
                onPress={onToggleStatus}
                disabled={togglingStatus}
                accessibilityRole="button"
              >
                {togglingStatus ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmPrimaryText}>
                    {statusConfirm?.status === 'disabled'
                      ? pc.activateModal.confirm
                      : pc.disableModal.confirm}
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
            <Text style={styles.confirmTitle}>{pc.deleteModal.title}</Text>
            <Text style={styles.confirmMsg}>
              {pc.deleteModal.messageBefore}
              <Text style={{ fontWeight: '700' }}>{deleteConfirm?.name}</Text>
              {pc.deleteModal.messageAfter}
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
                  <Text style={styles.confirmDeleteText}>{pc.deleteModal.confirm}</Text>
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
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
    maxWidth: 140,
  },
  filterBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },
  filterBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    flexShrink: 1,
  },
  filterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'web' ? 24 : 36,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterSheetTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  filterOptionActive: { backgroundColor: 'rgba(255, 107, 53, 0.08)' },
  filterOptionText: { fontSize: 15, fontWeight: '500', color: Colors.text.primary },
  filterOptionTextActive: { fontWeight: '700', color: Colors.primary },
  errorBanner: {
    backgroundColor: Colors.error + '10',
    borderBottomWidth: 1,
    borderBottomColor: Colors.error + '30',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: { fontSize: 13, color: Colors.error },
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
  cardPressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minWidth: 0,
    borderRadius: 10,
    margin: -4,
    padding: 4,
  },
  cardPressAreaPressed: {
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1, minWidth: 0, alignSelf: 'stretch', alignItems: 'flex-start' },
  cardName: { fontSize: 15, fontWeight: '600', color: Colors.text.primary, alignSelf: 'stretch' },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  slugBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  matricule: { fontSize: 11, color: Colors.text.disabled, fontWeight: '500' },
  cardDetails: { marginTop: 8, gap: 4, alignSelf: 'stretch', width: '100%' },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    minWidth: 0,
    alignSelf: 'stretch',
    width: '100%',
  },
  detailIcon: { marginTop: 2, flexShrink: 0 },
  detailText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 11,
    color: Colors.text.secondary,
    minWidth: 0,
    textAlign: 'left',
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
  fieldInputInvalid: { borderColor: Colors.error },
  fieldHint: { fontSize: 12, color: Colors.text.disabled, marginBottom: 16 },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  detailScrollContent: {
    flexGrow: 1,
    maxWidth: '100%',
    width: '100%',
    alignSelf: 'stretch',
  },
  detailLoader: { marginBottom: 12 },
  detailValueBox: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: 16,
    minWidth: 0,
    maxWidth: '100%',
    alignSelf: 'stretch',
    flexWrap: 'wrap',
  },
  detailValueText: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
    flexShrink: 1,
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  detailStatusRow: {
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'stretch',
  },
  detailStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  detailStatusText: { fontSize: 13, fontWeight: '600' },
  detailCloseBtn: {
    marginTop: 4,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  detailCloseBtnText: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
});
