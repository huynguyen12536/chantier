import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { ArrowLeft, Clock, Euro, UtensilsCrossed, Car, TrendingUp } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/colors';
import {
  calculateDeclarationSalary,
  calculatePayrollSummary,
  formatCurrency,
  getPeriodRange,
  PayrollDeclaration,
  PayrollPeriod,
} from '@/utils/payroll';

const headerBackground = require('../../assets/images/bg (2).png');

export default function UserPayrollScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { headerPaddingTop } = useTabBarInset();
  const params = useLocalSearchParams<{
    userId: string;
    prenom?: string;
    nom?: string;
    filter?: string;
    expandedUserId?: string;
  }>();
  const userId = params.userId;
  const fullName = `${params.prenom ?? ''} ${params.nom ?? ''}`.trim() || t.userPayroll.worker;

  const handleBack = () => {
    router.navigate({
      pathname: '/(tabs)/validation',
      params: {
        filter: params.filter === 'pending' || params.filter === 'all' ? params.filter : 'all',
        expandedUserId: params.expandedUserId ?? params.userId ?? '',
      },
    });
  };

  const [period, setPeriod] = useState<PayrollPeriod>('week');
  const [declarations, setDeclarations] = useState<PayrollDeclaration[]>([]);
  const [loading, setLoading] = useState(true);

  const periodRange = useMemo(() => getPeriodRange(period), [period]);
  const summary = useMemo(() => calculatePayrollSummary(declarations), [declarations]);

  const loadDeclarations = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { start, end } = getPeriodRange(period);
      const { data, error } = await supabase
        .from('declarations_heures')
        .select(`
          id,
          date,
          heures_normales,
          heures_supplementaires,
          nb_paniers,
          nb_deplacements,
          statut,
          chantiers (nom, code)
        `)
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (error) throw error;
      setDeclarations((data as unknown as PayrollDeclaration[]) || []);
    } catch (error) {
      console.error('Error loading user payroll:', error);
      setDeclarations([]);
    } finally {
      setLoading(false);
    }
  }, [period, userId]);

  useFocusEffect(
    useCallback(() => {
      void loadDeclarations();
    }, [loadDeclarations])
  );

  const getStatusLabel = (statut: string) => {
    const labels: Record<string, string> = {
      brouillon: t.validation.statusDraft,
      soumise: t.validation.statusPending,
      validee: t.validation.statusApproved,
      rejetee: t.validation.statusRejected,
      annulee: t.validation.statusCancelled,
    };
    return labels[statut] || statut;
  };

  const getStatusStyle = (statut: string) => {
    const stylesMap: Record<string, { backgroundColor: string }> = {
      brouillon: { backgroundColor: '#E5E5E5' },
      soumise: { backgroundColor: '#FFA726' },
      validee: { backgroundColor: '#66BB6A' },
      rejetee: { backgroundColor: '#EF5350' },
      annulee: { backgroundColor: '#94A3B8' },
    };
    return stylesMap[statut] || { backgroundColor: '#E5E5E5' };
  };

  const periodTabs: { key: PayrollPeriod; label: string }[] = [
    { key: 'day', label: t.userPayroll.day },
    { key: 'week', label: t.userPayroll.week },
    { key: 'month', label: t.userPayroll.month },
    { key: 'year', label: t.userPayroll.year },
  ];

  return (
    <View style={styles.container}>
      <ImageBackground source={headerBackground} resizeMode="cover" style={styles.header} imageStyle={styles.headerImage}>
        <View style={[styles.headerOverlay, { paddingTop: headerPaddingTop }]}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <ArrowLeft size={20} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{fullName}</Text>
          <Text style={styles.headerSubtitle}>{t.userPayroll.subtitle}</Text>
          <Text style={styles.periodLabel}>{periodRange.label}</Text>

          <View style={styles.tabBar}>
            {periodTabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, period === tab.key && styles.tabActive]}
                onPress={() => setPeriod(tab.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, period === tab.key && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ImageBackground>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.salaryHero}>
            <View style={styles.salaryHeroTop}>
              <Euro size={22} color={Colors.primary} strokeWidth={2.4} />
              <Text style={styles.salaryHeroLabel}>{t.userPayroll.totalSalary}</Text>
            </View>
            <Text style={styles.salaryHeroValue}>{formatCurrency(summary.validatedSalary)}</Text>
            <Text style={styles.salaryHeroHint}>
              {t.userPayroll.estimatedGross}: {formatCurrency(summary.grossSalary)}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Clock size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{summary.totalHours.toFixed(1)}h</Text>
              <Text style={styles.statLabel}>{t.userPayroll.totalHours}</Text>
            </View>
            <View style={styles.statCard}>
              <TrendingUp size={18} color={Colors.secondary} />
              <Text style={styles.statValue}>{summary.suppHours.toFixed(1)}h</Text>
              <Text style={styles.statLabel}>{t.userPayroll.overtime}</Text>
            </View>
            <View style={styles.statCard}>
              <UtensilsCrossed size={18} color="#F59E0B" />
              <Text style={styles.statValue}>{summary.meals}</Text>
              <Text style={styles.statLabel}>{t.userPayroll.meals}</Text>
            </View>
            <View style={styles.statCard}>
              <Car size={18} color="#3B82F6" />
              <Text style={styles.statValue}>{summary.travels}</Text>
              <Text style={styles.statLabel}>{t.userPayroll.travels}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            {t.userPayroll.entries} ({declarations.length})
          </Text>

          {declarations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t.userPayroll.noEntries}</Text>
            </View>
          ) : (
            declarations.map((decl) => {
              const hours = decl.heures_normales + decl.heures_supplementaires;
              const salary =
                decl.statut === 'annulee' ? 0 : calculateDeclarationSalary(decl);

              return (
                <View key={decl.id} style={styles.entryCard}>
                  <View style={styles.entryTop}>
                    <View style={styles.entryLeft}>
                      <Text style={styles.entryDate}>
                        {new Date(decl.date).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                      <Text style={styles.entryHours}>
                        {decl.heures_normales}h
                        {decl.heures_supplementaires > 0 && (
                          <Text style={styles.entryHoursSupp}>
                            {'  '}+{decl.heures_supplementaires}{t.validation.overtime}
                          </Text>
                        )}
                      </Text>
                      <Text style={styles.entryWorksite} numberOfLines={1}>
                        {decl.chantiers.nom}
                      </Text>
                    </View>
                    <View style={styles.entryRight}>
                      <Text style={styles.entrySalary}>{formatCurrency(salary)}</Text>
                      <View style={[styles.statusBadge, getStatusStyle(decl.statut)]}>
                        <Text style={styles.statusText}>{getStatusLabel(decl.statut)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryMetaText}>{hours.toFixed(1)}h · {decl.nb_paniers} {t.userPayroll.mealsShort} · {decl.nb_deplacements} {t.userPayroll.travelsShort}</Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F2',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    overflow: 'hidden',
  },
  headerImage: {
    opacity: 0.95,
  },
  headerOverlay: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    backgroundColor: 'rgba(255, 107, 53, 0.58)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 3,
    fontWeight: '500',
  },
  periodLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabActive: {
    backgroundColor: '#FFF7F2',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  tabTextActive: {
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  salaryHero: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0E4DC',
  },
  salaryHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  salaryHeroLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  salaryHeroValue: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 8,
  },
  salaryHeroHint: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F0E4DC',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  entryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    padding: 14,
    gap: 8,
  },
  entryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  entryLeft: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  entryDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  entryHours: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  entryHoursSupp: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  entryWorksite: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  entryRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  entrySalary: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.secondaryDark,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  entryMeta: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  entryMetaText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  emptyState: {
    padding: 28,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
