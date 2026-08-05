import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { ScrollText, Search, X, User, Zap, Building2, Box, ListFilter, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatform } from '@/contexts/PlatformContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { fetchAuditLogs, fetchCompanies, PlatformAuditLog } from '@/services/platform';
import { Colors } from '@/constants/colors';
import { Company } from '@/types';

const adminHeaderBackground = require('../../assets/images/bg (2).png');

function companyLabel(companyId: string | null | undefined, companies: Company[]): string {
  if (!companyId) return '—';
  const co = companies.find((c) => c.id === companyId);
  return co?.name ?? '—';
}

function formatTimestamp(iso: string, locale: string): string {
  const date = new Date(iso);
  return date.toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function actionColor(action: string): string {
  if (action.includes('create') || action.includes('CREATE')) return Colors.secondary;
  if (action.includes('delete') || action.includes('DELETE') || action.includes('disable')) return Colors.error;
  if (action.includes('update') || action.includes('UPDATE') || action.includes('patch')) return Colors.info;
  return Colors.primary;
}

export default function PlatformAuditScreen() {
  const { session } = useAuth();
  const { t, dateLocale } = useLanguage();
  const pa = t.platform.audit;
  const pc = t.platform.common;
  const { selectedCompanyId, setSelectedCompanyId, companies, setCompanies } = usePlatform();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();

  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filterModal, setFilterModal] = useState(false);

  const activeCompanyLabel = selectedCompanyId
    ? companies.find((c) => c.id === selectedCompanyId)?.name ?? pc.allCompanies
    : pc.allCompanies;

  const onSelectCompany = (id: string | null) => {
    setSelectedCompanyId(id);
    setFilterModal(false);
  };

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const [res, co] = await Promise.all([
        fetchAuditLogs(session.access_token, selectedCompanyId),
        fetchCompanies(session.access_token),
      ]);
      setLogs((res.logs ?? []) as PlatformAuditLog[]);
      setCompanies(co.companies ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : pa.errors.loadFailed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token, selectedCompanyId, setCompanies, pa.errors.loadFailed]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      const company = companyLabel(l.company_id, companies).toLowerCase();
      const entity = `${l.entity_type ?? ''} ${l.entity_id ?? ''}`.toLowerCase();
      return `${l.action} ${l.actor_email ?? ''} ${company} ${entity}`.toLowerCase().includes(q);
    });
  }, [logs, search, companies]);

  const countLabel =
    filtered.length === 1
      ? pa.count.replace('{{count}}', String(filtered.length))
      : pa.countPlural.replace('{{count}}', String(filtered.length));

  return (
    <View style={styles.container}>
      <ImageBackground
        source={adminHeaderBackground}
        resizeMode="cover"
        style={styles.header}
        imageStyle={styles.headerImage}
      >
        <View style={[styles.headerOverlay, { paddingTop: headerPaddingTop }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>{pa.title}</Text>
              <Text style={styles.headerSubtitle}>{pa.subtitle}</Text>
            </View>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={pa.searchPlaceholder}
            placeholderTextColor={Colors.text.disabled}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel={pa.searchPlaceholder}
          />
          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <X size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, selectedCompanyId && styles.filterBtnActive]}
          onPress={() => setFilterModal(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${pc.companyFilter}: ${activeCompanyLabel}`}
        >
          <ListFilter
            size={16}
            color={selectedCompanyId ? Colors.primary : Colors.text.secondary}
            strokeWidth={2.2}
          />
          {selectedCompanyId ? (
            <Text style={styles.filterBtnLabel} numberOfLines={1}>
              {activeCompanyLabel}
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

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
            <View style={styles.emptyWrap}>
              <ScrollText size={40} color={Colors.text.disabled} strokeWidth={1.5} />
              <Text style={styles.emptyText}>{pa.empty}</Text>
            </View>
          ) : (
            filtered.map((log) => {
              const accent = actionColor(log.action);
              const coName = log.company_id ? companyLabel(log.company_id, companies) : null;
              return (
                <View key={log.id} style={styles.userCard}>
                  <View style={styles.userCardMainRow}>
                    <View style={[styles.avatar, { backgroundColor: accent + '15' }]}>
                      <Zap size={18} color={accent} strokeWidth={2.25} />
                    </View>
                    <View style={styles.userInfo}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.timestamp}>{formatTimestamp(log.created_at, dateLocale)}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: accent + '15' }]}>
                          <Text style={[styles.roleText, { color: accent }]} numberOfLines={1}>
                            {log.action}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.metaRow}>
                        <User size={12} color={Colors.text.secondary} />
                        <Text style={styles.metaLabel}>{pa.fields.actor}</Text>
                        <Text style={styles.metaValue} numberOfLines={1}>
                          {log.actor_email ?? '—'}
                        </Text>
                      </View>
                      {(log.entity_type || log.entity_id) && (
                        <View style={styles.metaRow}>
                          <Box size={12} color={Colors.text.secondary} />
                          <Text style={styles.metaLabel}>{pa.fields.entity}</Text>
                          <Text style={styles.metaValue} numberOfLines={1}>
                            {[log.entity_type, log.entity_id].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                      )}
                      {coName && coName !== '—' && (
                        <View style={styles.metaRow}>
                          <Building2 size={12} color={Colors.text.secondary} />
                          <Text style={styles.metaLabel}>{pa.fields.company}</Text>
                          <Text style={styles.metaValue} numberOfLines={1}>
                            {coName}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <Modal visible={filterModal} animationType="fade" transparent onRequestClose={() => setFilterModal(false)}>
        <TouchableOpacity
          style={styles.filterOverlay}
          activeOpacity={1}
          onPress={() => setFilterModal(false)}
          accessibilityRole="button"
          accessibilityLabel={t.common.cancel}
        >
          <View style={styles.filterSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>{pc.companyFilterTitle}</Text>
              <TouchableOpacity onPress={() => setFilterModal(false)} accessibilityRole="button">
                <X size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.filterOption, !selectedCompanyId && styles.filterOptionActive]}
              onPress={() => onSelectCompany(null)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: !selectedCompanyId }}
            >
              <Text style={[styles.filterOptionText, !selectedCompanyId && styles.filterOptionTextActive]}>
                {pc.allCompanies}
              </Text>
              {!selectedCompanyId ? <Check size={18} color={Colors.primary} strokeWidth={2.5} /> : null}
            </TouchableOpacity>
            {companies.map((c) => {
              const selected = selectedCompanyId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.filterOption, selected && styles.filterOptionActive]}
                  onPress={() => onSelectCompany(c.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.filterOptionText, selected && styles.filterOptionTextActive]}>
                    {c.name}
                  </Text>
                  {selected ? <Check size={18} color={Colors.primary} strokeWidth={2.5} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  scrollView: { flex: 1 },
  header: { overflow: 'hidden' },
  headerImage: { opacity: 0.95 },
  headerOverlay: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.58)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  headerCopy: { flex: 1, minWidth: 0, paddingRight: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 3, fontWeight: '500' },
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
    maxHeight: '70%',
  },
  filterSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterSheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  filterOptionActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  filterOptionTextActive: {
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
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    paddingHorizontal: 24,
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
    gap: 12,
    width: '100%',
    minWidth: 0,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1, minWidth: 0, gap: 4 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '55%',
  },
  roleText: { fontSize: 11, fontWeight: '700' },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaValue: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.primary,
  },
});
