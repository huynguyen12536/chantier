import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Building2,
  Users,
  HardHat,
  ClipboardList,
  CheckCircle2,
  PauseCircle,
  Clock,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatform } from '@/contexts/PlatformContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import {
  fetchCompanies,
  fetchPlatformDashboard,
  isCompanyDashboard,
  PlatformDashboardStats,
} from '@/services/platform';
import { thrownErrorMessage } from '@/services/supabase';
import { Colors } from '@/constants/colors';
import { UserRole } from '@/types';

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
};

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTopRow}>
        <View style={styles.statIconWrap}>{icon}</View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

type GlobalDashboardProps = {
  stats: PlatformDashboardStats;
  roleLabel: (role: UserRole) => string;
  pd: ReturnType<typeof useLanguage>['t']['platform']['dashboard'];
};

function GlobalDashboard({ stats, roleLabel, pd }: GlobalDashboardProps) {
  if (isCompanyDashboard(stats)) return null;

  const { companies, users_by_role, totals } = stats;
  const s = pd.stats;

  return (
    <>
      <Text style={styles.sectionTitle}>{pd.sections.companies}</Text>
      <View style={styles.statsRow}>
        <StatCard
          label={s.total}
          value={companies.total}
          icon={<Building2 size={22} color={Colors.primary} strokeWidth={2.25} />}
        />
        <StatCard
          label={s.active}
          value={companies.active}
          icon={<CheckCircle2 size={22} color={Colors.primary} strokeWidth={2.25} />}
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          label={s.disabled}
          value={companies.disabled}
          icon={<PauseCircle size={22} color={Colors.primary} strokeWidth={2.25} />}
        />
        <StatCard
          label={s.pending}
          value={companies.pending}
          icon={<Clock size={22} color={Colors.primary} strokeWidth={2.25} />}
        />
      </View>

      <Text style={styles.sectionTitle}>{pd.sections.usersByRole}</Text>
      {users_by_role.length === 0 ? (
        <Text style={styles.emptyText}>{pd.emptyUsers}</Text>
      ) : (
        users_by_role.map(({ role, count }) => (
          <View key={role} style={styles.rowCard}>
            <View style={styles.rowIconWrap}>
              <Users size={20} color={Colors.primary} strokeWidth={2.25} />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowName}>{roleLabel(role as UserRole)}</Text>
              <Text style={styles.rowMeta}>{role}</Text>
            </View>
            <View style={styles.rowPill}>
              <Text style={styles.rowPillText}>{count}</Text>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>{pd.sections.totals}</Text>
      <View style={styles.statsRow}>
        <StatCard
          label={s.worksites}
          value={totals.chantiers}
          icon={<HardHat size={22} color={Colors.primary} strokeWidth={2.25} />}
        />
        <StatCard
          label={s.declarations}
          value={totals.declarations}
          icon={<ClipboardList size={22} color={Colors.primary} strokeWidth={2.25} />}
        />
      </View>
    </>
  );
}

type CompanyDashboardProps = {
  stats: PlatformDashboardStats;
  pd: ReturnType<typeof useLanguage>['t']['platform']['dashboard'];
};

function CompanyDashboard({ stats, pd }: CompanyDashboardProps) {
  if (!isCompanyDashboard(stats)) return null;

  const { company, stats: companyStats } = stats;
  const s = pd.stats;

  return (
    <>
      <View style={styles.companyBanner}>
        <Text style={styles.companyName}>{company.name}</Text>
        <Text style={styles.companyMeta}>
          {company.slug} · {company.status}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>{pd.sections.users}</Text>
      <View style={styles.statsRow}>
        <StatCard
          label={s.admins}
          value={companyStats.admins}
          icon={<Users size={22} color={Colors.primary} strokeWidth={2.25} />}
        />
        <StatCard
          label={s.managers}
          value={companyStats.managers}
          icon={<Users size={22} color={Colors.primary} strokeWidth={2.25} />}
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          label={s.workers}
          value={companyStats.workers}
          icon={<HardHat size={22} color={Colors.primary} strokeWidth={2.25} />}
        />
        <StatCard
          label={s.worksites}
          value={companyStats.chantiers}
          icon={<Building2 size={22} color={Colors.primary} strokeWidth={2.25} />}
        />
      </View>

      <Text style={styles.sectionTitle}>{pd.sections.activity}</Text>
      <View style={styles.statsRow}>
        <StatCard
          label={s.declarations}
          value={companyStats.declarations}
          icon={<ClipboardList size={22} color={Colors.primary} strokeWidth={2.25} />}
        />
        <View style={styles.statCardPlaceholder} />
      </View>
    </>
  );
}

type PlatformDashboardSectionProps = {
  onError?: (message: string | null) => void;
};

export function PlatformDashboardSection({ onError }: PlatformDashboardSectionProps) {
  const { session } = useAuth();
  const { t } = useLanguage();
  const pd = t.platform.dashboard;
  const { setCompanies } = usePlatform();
  const { scrollBottomPadding } = useTabBarInset();
  const [stats, setStats] = useState<PlatformDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const roleLabel = (role: UserRole): string =>
    t.roles[role as keyof typeof t.roles] || role;

  const load = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    try {
      onError?.(null);
      const [dash, co] = await Promise.all([
        fetchPlatformDashboard(session.access_token, null),
        fetchCompanies(session.access_token),
      ]);
      setStats(dash);
      setCompanies(co.companies ?? []);
    } catch (e) {
      const message = thrownErrorMessage(e, pd.errors.loadFailed);
      onError?.(message);
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token, setCompanies, pd.errors.loadFailed, onError]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  if (loading) {
    return <ActivityIndicator color={Colors.primary} style={styles.loader} />;
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding + 24 }]}
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
      {stats ? (
        isCompanyDashboard(stats) ? (
          <CompanyDashboard stats={stats} pd={pd} />
        ) : (
          <GlobalDashboard stats={stats} roleLabel={roleLabel} pd={pd} />
        )
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: 32,
  },
  content: {
    padding: 16,
    paddingTop: 12,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardPlaceholder: {
    flex: 1,
    opacity: 0,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 4,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
    width: '100%',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    padding: 14,
  },
  rowIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  rowPill: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  rowPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.disabled,
    fontStyle: 'italic',
  },
  companyBanner: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    padding: 16,
    gap: 4,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  companyMeta: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});
