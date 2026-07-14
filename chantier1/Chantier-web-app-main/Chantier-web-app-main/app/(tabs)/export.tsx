import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { CONTENT_MAX_WIDTH } from '@/constants/layout';
import { supabase } from '@/services/supabase';
import { getChefManagedChantierIds } from '@/utils/team';
import { getPeriodRange } from '@/utils/payroll';
import {
  buildPayrollExportTable,
  dayOfMonthFromIso,
  type PayrollExportSourceRow,
} from '@/utils/exportPayrollFormat';
import { computeChantierHoursBreakdown, formatTime } from '@/utils/time';
import { Download, Megaphone, BadgeCheck, Hourglass, Timer } from 'lucide-react-native';


const STATS_GAP = 12;
const STATS_COLUMNS = 2;
const PAGE_PADDING = 16;

function formatDisplayNumber(value: number, decimals = 0): string {
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  if (decimals === 0 || Number.isInteger(rounded)) {
    return Math.round(rounded).toLocaleString('fr-FR');
  }
  return rounded.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export default function ExportScreen() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();
  const { width: windowWidth } = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const isCompact = windowWidth < 400;
  const [stats, setStats] = useState({
    total_declarations: 0,
    validees: 0,
    en_attente: 0,
    total_heures: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const isChef = profile?.role === 'chef_equipe';
  const isAdmin = profile?.role === 'admin';
  const headerTitle = isAdmin ? t.export.titleAdmin : t.export.title;
  const headerSubtitle = isAdmin ? t.export.subtitleAdmin : t.export.subtitle;

  const statItems = useMemo(
    () => [
      {
        key: 'total',
        Icon: Megaphone,
        color: '#FF6B35',
        bg: '#FFF1EC',
        border: '#FFD5C7',
        value: formatDisplayNumber(stats.total_declarations),
        label: t.export.declarations,
      },
      {
        key: 'validees',
        Icon: BadgeCheck,
        color: '#16A34A',
        bg: '#ECFDF3',
        border: '#BBF7D0',
        value: formatDisplayNumber(stats.validees),
        label: t.export.approved,
      },
      {
        key: 'pending',
        Icon: Hourglass,
        color: '#F59E0B',
        bg: '#FFFAEB',
        border: '#FDE68A',
        value: formatDisplayNumber(stats.en_attente),
        label: t.export.pending,
      },
      {
        key: 'hours',
        Icon: Timer,
        color: '#2563EB',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        value: formatDisplayNumber(stats.total_heures, 1),
        label: t.export.totalHours,
        unit: 'h',
      },
    ],
    [stats, t.export],
  );

  const statIconSize = isCompact ? 20 : 22;
  const statRows = useMemo(
    () => [statItems.slice(0, STATS_COLUMNS), statItems.slice(STATS_COLUMNS, STATS_COLUMNS * 2)],
    [statItems],
  );

  const indicatorLegendItems = useMemo(
    () => [
      `${t.export.declarations} : ${t.export.indicatorDeclarationsDesc}`,
      `${t.export.approved} : ${t.export.indicatorApprovedDesc}`,
      `${t.export.pending} : ${t.export.indicatorPendingDesc}`,
      `${t.export.totalHours} : ${t.export.indicatorTotalHoursDesc}`,
    ],
    [t.export],
  );

  useEffect(() => {
    if (!profile) return;
    loadStats();
  }, [profile?.id, profile?.role]);

  const fetchExportDeclarations = async (): Promise<PayrollExportSourceRow[]> => {
    const { start, end } = getDateRange();

    let query = supabase
      .from('periodes_travail')
      .select(`
        date,
        panier_repas,
        deplacement,
        user_id,
        chantier_id,
        profiles!periodes_travail_user_id_fkey (nom, prenom),
        chantiers (nom, adresse)
      `)
      .eq('statut', 'validee')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true });

    if (profile?.role === 'chef_equipe') {
      const chantierIds = await getChefManagedChantierIds(profile!.id);
      if (chantierIds.length === 0) return [];
      query = query.in('chantier_id', chantierIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    const grouped = new Map<string, PayrollExportSourceRow>();

    (data ?? []).forEach((d: any) => {
      const key = `${d.user_id}__${d.chantier_id}`;
      const jour = dayOfMonthFromIso(d.date as string);
      const existing = grouped.get(key);

      if (existing) {
        existing.jours.push(jour);
        existing.nbreDeplacements += d.deplacement ? 1 : 0;
        existing.paniersRepas += d.panier_repas ? 1 : 0;
      } else {
        grouped.set(key, {
          userId: d.user_id as string,
          prenom: d.profiles?.prenom ?? '',
          nom: d.profiles?.nom ?? '',
          chantierNom: d.chantiers?.nom ?? '',
          chantierAdresse: d.chantiers?.adresse ?? '',
          jours: [jour],
          nbreDeplacements: d.deplacement ? 1 : 0,
          paniersRepas: d.panier_repas ? 1 : 0,
        });
      }
    });

    return Array.from(grouped.values());
  };

  const loadStats = async () => {
    try {
      let query = supabase
        .from('periodes_travail')
        .select('statut, heure_debut, heure_fin, chantiers (heure_debut, heure_fin)')
        .not('heure_fin', 'is', null);

      if (profile?.role === 'chef_equipe') {
        const chantierIds = await getChefManagedChantierIds(profile.id);
        if (chantierIds.length === 0) {
          setStats({ total_declarations: 0, validees: 0, en_attente: 0, total_heures: 0 });
          return;
        }
        query = query.in('chantier_id', chantierIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      const validStatuses = ['terminee', 'validee'];
      let totalHeures = 0;
      data?.forEach((d: any) => {
        if (!validStatuses.includes(d.statut)) return;
        const hDebut = formatTime(d.heure_debut);
        const hFin = formatTime(d.heure_fin);
        const cDebut = d.chantiers?.heure_debut ? formatTime(d.chantiers.heure_debut) : null;
        const cFin = d.chantiers?.heure_fin ? formatTime(d.chantiers.heure_fin) : null;
        const b = computeChantierHoursBreakdown(hDebut, hFin, cDebut, cFin);
        totalHeures += b.totalHeures;
      });

      setStats({
        total_declarations: data?.length || 0,
        validees: data?.filter((d) => d.statut === 'validee').length || 0,
        en_attente: data?.filter((d) => d.statut === 'terminee').length || 0,
        total_heures: Math.round(totalHeures * 100) / 100,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getDateRange = (): { start: string; end: string } => {
    const { start, end } = getPeriodRange(selectedPeriod);
    return { start, end };
  };

  const getExportTable = (data: PayrollExportSourceRow[], periodEnd: string) => {
    const c = t.export.csvColumns;
    return buildPayrollExportTable(data, periodEnd, {
      id: c.id,
      collaborateur: c.collaborateur,
      chantier: c.chantier,
      nbreDeplacements: c.nbreDeplacements,
      listeJours: c.listeJours,
      paniersRepas: c.paniersRepas,
      subtotal: c.subtotal,
      grandTotal: c.grandTotal,
    });
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const exportData = await fetchExportDeclarations();

      if (exportData.length === 0) {
        Alert.alert('Information', t.export.noData);
        setLoading(false);
        return;
      }

      const table = getExportTable(exportData, end);

      if (Platform.OS === 'web') {
        const { buildExportWorkbookBuffer, downloadExcelBuffer, downloadCsvFallback } = await import(
          '@/utils/exportSpreadsheet.web'
        );
        try {
          const buffer = await buildExportWorkbookBuffer(
            table.periodLabel,
            table.headers,
            table.rows,
            headerTitle,
          );
          downloadExcelBuffer(buffer, `export_heures_${start}_${end}.xlsx`);
        } catch {
          downloadCsvFallback(
            table.periodLabel,
            table.headers,
            table.rows,
            `export_heures_${start}_${end}.csv`,
          );
        }
        setTimeout(() => {
          Alert.alert(t.common.success, `${exportData.length} ${t.export.exportSuccess}`);
        }, 500);
      } else {
        const { shareExportCsv } = await import('@/utils/exportSpreadsheet.native');
        const flatRows = table.rows.map((row) => row.cells);
        await shareExportCsv(table.headers, flatRows, `export_heures_${start}_${end}.csv`);
        Alert.alert(t.common.success, `${exportData.length} ${t.export.exportSuccess}`);
      }
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <Text style={styles.title}>{headerTitle}</Text>
        <Text style={styles.subtitle}>{headerSubtitle}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.body, { maxWidth: CONTENT_MAX_WIDTH }]}>
          <View style={styles.statsGrid}>
            {statRows.map((row, rowIndex) => (
              <View key={`stats-row-${rowIndex}`} style={styles.statsRow}>
                {row.map((item) => (
                  <View
                    key={item.key}
                    style={[
                      styles.statCard,
                      { borderColor: item.border },
                      isChef && styles.statCardChef,
                      isCompact && styles.statCardCompact,
                    ]}
                  >
                    <View style={styles.statTopRow}>
                      <View
                        style={[
                          styles.statIconBadge,
                          isChef && styles.statIconBadgeChef,
                          { backgroundColor: item.bg },
                        ]}
                      >
                        <item.Icon size={statIconSize} color={item.color} strokeWidth={2.35} />
                      </View>
                      <View style={styles.statValueRow}>
                        <Text
                          style={[
                            styles.statValue,
                            isChef && styles.statValueChef,
                            !isChef && isCompact && styles.statValueCompact,
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.value}
                        </Text>
                        {item.unit ? (
                          <Text
                            style={[styles.statUnit, isChef && styles.statUnitChef]}
                            numberOfLines={1}
                          >
                            {item.unit}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.statLabel,
                        isChef && styles.statLabelChef,
                        !isChef && isCompact && styles.statLabelCompact,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {!isChef && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.export.exportPeriod}</Text>

              <View style={styles.periodButtons}>
                <TouchableOpacity
                  style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
                  onPress={() => setSelectedPeriod('week')}
                >
                  <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
                    {t.export.thisWeek}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
                  onPress={() => setSelectedPeriod('month')}
                >
                  <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
                    {t.export.thisMonth}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{t.export.exportInfo}</Text>
                <Text style={styles.infoText}>{t.export.exportFormat}</Text>
              </View>

              <TouchableOpacity
                style={[styles.exportButton, loading && styles.exportButtonDisabled]}
                onPress={handleExport}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Download size={24} color="#FFF" />
                    <Text style={styles.exportButtonText}>{t.export.exportButton}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {isChef ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.export.indicatorsLegend}</Text>
              <View style={styles.instructions}>
                {indicatorLegendItems.map((item, idx) => (
                  <View key={idx} style={styles.instructionItem}>
                    <View style={styles.instructionNumber}>
                      <Text style={styles.instructionNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.instructionText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.export.instructions}</Text>
              <View style={styles.instructions}>
                {[t.export.instruction1, t.export.instruction2, t.export.instruction3, t.export.instruction4].map(
                  (instruction, idx) => (
                    <View key={idx} style={styles.instructionItem}>
                      <View style={styles.instructionNumber}>
                        <Text style={styles.instructionNumberText}>{idx + 1}</Text>
                      </View>
                      <Text style={styles.instructionText}>{instruction}</Text>
                    </View>
                  ),
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: PAGE_PADDING,
    paddingTop: 18,
  },
  body: {
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingBottom: 24,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  statsGrid: {
    gap: STATS_GAP,
    marginBottom: 18,
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    gap: STATS_GAP,
    width: '100%',
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    minHeight: 88,
    overflow: 'hidden',
    shadowColor: '#9A4A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  statCardChef: {
    padding: 16,
    gap: 10,
    minHeight: 96,
    borderRadius: 18,
  },
  statCardCompact: {
    padding: 12,
    minHeight: 82,
    gap: 6,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  statIconBadge: {
    width: 42,
    height: 42,
    flexShrink: 0,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBadgeChef: {
    width: 50,
    height: 50,
    borderRadius: 16,
  },
  statValueRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    minWidth: 0,
  },
  statValue: {
    flexShrink: 1,
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  statValueChef: {
    fontSize: 30,
  },
  statValueCompact: {
    fontSize: 22,
  },
  statUnit: {
    flexShrink: 0,
    fontSize: 14,
    fontWeight: '800',
    color: '#7A7A7A',
  },
  statUnitChef: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    lineHeight: 17,
    minWidth: 0,
  },
  statLabelChef: {
    fontSize: 16,
    lineHeight: 22,
  },
  statLabelCompact: {
    fontSize: 12,
  },
  card: {
    backgroundColor: '#FFF',
    marginBottom: PAGE_PADDING,
    padding: 20,
    borderRadius: 18,
    gap: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F0E4DC',
    shadowColor: '#9A4A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  periodButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  periodButtonActive: {
    backgroundColor: '#FFF3EF',
    borderColor: '#FF6B35',
  },
  periodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  periodTextActive: {
    color: '#FF6B35',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  exportButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 12,
  },
  exportButtonDisabled: {
    opacity: 0.6,
  },
  exportButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  instructions: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
    lineHeight: 24,
  },
});
