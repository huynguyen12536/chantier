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
import { useIsDesktopLayout } from '@/hooks/useIsDesktopLayout';
import { CONTENT_MAX_WIDTH } from '@/constants/layout';
import { DatePickerModal, ValidationNotificationBell } from '@/components/common';
import { supabase } from '@/services/supabase';
import { getChefManagedChantierIds } from '@/utils/team';
import { getPeriodRange } from '@/utils/payroll';
import {
  buildPayrollExportTable,
  type PayrollExportSourceRow,
} from '@/utils/exportPayrollFormat';
import {
  buildAbsenceExportTable,
  formatAbsenceExportPeriodLabel,
  getNextMonthRange,
} from '@/utils/exportAbsenceFormat';
import { fetchTeamAbsences } from '@/utils/absence';
import { formatDateFieldLabel } from '@/utils/absenceFormat';
import { formatDateKey } from '@/utils/date';
import { computeChantierHoursBreakdown, formatTime } from '@/utils/time';
import { Calendar, Download, Megaphone, BadgeCheck, Hourglass, Timer } from 'lucide-react-native';
import { ExportDesktop, desktopTheme } from '@/components/layoutDesktop';
import { canExport, canReceiveApprovalNotifications } from '@/utils/role';

const STATS_GAP = 12;
const STATS_COLUMNS = 2;
const PAGE_PADDING = 16;
type ExportPeriod = 'week' | 'month' | 'custom' | 'absence';
type PayrollExportPeriod = 'week' | 'month' | 'custom';

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
  const { t, language } = useLanguage();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopLayout = useIsDesktopLayout();
  const [loading, setLoading] = useState(false);
  const [loadingPeriod, setLoadingPeriod] = useState<ExportPeriod | null>(null);
  const isCompact = windowWidth < 400;
  const [stats, setStats] = useState({
    total_declarations: 0,
    validees: 0,
    en_attente: 0,
    total_heures: 0,
  });
  const today = useMemo(() => formatDateKey(new Date()), []);
  const [selectedPeriod, setSelectedPeriod] = useState<ExportPeriod>('week');
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [activeDateField, setActiveDateField] = useState<'from' | 'to' | null>(null);
  const isChef = profile?.role === 'chef_equipe';
  const isAdmin = profile?.role === 'admin';
  const headerTitle = isAdmin ? t.export.titleAdmin : t.export.title;
  const headerSubtitle = isAdmin ? t.export.subtitleAdmin : t.export.subtitle;
  const canUseCustomRange = !isChef;
  const canUseAbsenceExport = !isChef;
  const nextMonthRange = useMemo(() => getNextMonthRange(), []);
  const nextMonthLabel = useMemo(
    () => formatAbsenceExportPeriodLabel(nextMonthRange.start, nextMonthRange.end, language),
    [nextMonthRange.start, nextMonthRange.end, language],
  );

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

  const fetchExportDeclarations = async (
    period: PayrollExportPeriod,
  ): Promise<PayrollExportSourceRow[]> => {
    const { start, end } = getDateRange(period);

    let query = supabase
      .from('periodes_travail')
      .select(`
        date,
        panier_repas,
        deplacement,
        heure_debut,
        heure_fin,
        user_id,
        chantier_id,
        profiles!periodes_travail_user_id_fkey (nom, prenom),
        chantiers (nom, adresse, heure_debut, heure_fin)
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
      const dateIso = String(d.date ?? '');
      if (!dateIso) return;

      const key = `${d.user_id}__${d.chantier_id}__${dateIso}`;
      const existing = grouped.get(key);
      const hDebut = d.heure_debut ? formatTime(d.heure_debut as string) : '';
      const hFin = d.heure_fin ? formatTime(d.heure_fin as string) : '';
      const cDebut = d.chantiers?.heure_debut ? formatTime(d.chantiers.heure_debut as string) : null;
      const cFin = d.chantiers?.heure_fin ? formatTime(d.chantiers.heure_fin as string) : null;
      const periodHours =
        hDebut && hFin
          ? computeChantierHoursBreakdown(hDebut, hFin, cDebut, cFin).totalHeures
          : 0;

      if (existing) {
        existing.nbreDeplacements += d.deplacement ? 1 : 0;
        existing.paniersRepas += d.panier_repas ? 1 : 0;
        existing.totalHeures += periodHours;
      } else {
        grouped.set(key, {
          userId: d.user_id as string,
          prenom: d.profiles?.prenom ?? '',
          nom: d.profiles?.nom ?? '',
          chantierNom: d.chantiers?.nom ?? '',
          chantierAdresse: d.chantiers?.adresse ?? '',
          dateIso,
          nbreDeplacements: d.deplacement ? 1 : 0,
          paniersRepas: d.panier_repas ? 1 : 0,
          totalHeures: periodHours,
        });
      }
    });

    return Array.from(grouped.values()).map((row) => ({
      ...row,
      totalHeures: Math.round(row.totalHeures * 100) / 100,
    }));
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
        validees: data?.filter((d: any) => d.statut === 'validee').length || 0,
        en_attente: data?.filter((d: any) => d.statut === 'terminee').length || 0,
        total_heures: Math.round(totalHeures * 100) / 100,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getDateRange = (period: PayrollExportPeriod): { start: string; end: string } => {
    if (period === 'custom') {
      return { start: customFrom, end: customTo };
    }
    const { start, end } = getPeriodRange(period);
    return { start, end };
  };

  const getExportTable = (data: PayrollExportSourceRow[], periodEnd: string) => {
    const c = t.export.csvColumns;
    return buildPayrollExportTable(
      data,
      periodEnd,
      {
      id: c.id,
      collaborateur: c.collaborateur,
      chantier: c.chantier,
      date: c.date ?? c.listeJours ?? 'Date',
      nbreDeplacements: c.nbreDeplacements,
      paniersRepas: c.paniersRepas,
      totalHeures: c.totalHeures ?? 'Total heures',
      subtotal: c.subtotal,
      grandTotal: c.grandTotal,
      },
      language,
    );
  };

  const deliverExportFile = async (
    periodLabel: string,
    headers: string[],
    rows: { cells: (string | number)[]; isSubtotal?: boolean; isGrandTotal?: boolean }[],
    filenameBase: string,
    sheetTitle: string,
    successMessage: string,
    useGenericWorkbook: boolean,
  ) => {
    if (Platform.OS === 'web') {
      const {
        buildExportWorkbookBuffer,
        buildGenericExportWorkbookBuffer,
        downloadExcelBuffer,
        downloadCsvFallback,
      } = await import('@/utils/exportSpreadsheet.web');
      try {
        const build = useGenericWorkbook
          ? buildGenericExportWorkbookBuffer
          : buildExportWorkbookBuffer;
        const buffer = await build(periodLabel, headers, rows as any, sheetTitle);
        downloadExcelBuffer(buffer, `${filenameBase}.xlsx`);
      } catch (excelError) {
        console.error('Excel export failed, falling back to CSV', excelError);
        downloadCsvFallback(periodLabel, headers, rows as any, `${filenameBase}.csv`);
        Alert.alert(
          t.common.error,
          'Export Excel indisponible — fichier CSV téléchargé (colonnes numériques en texte). Réessayez ou contactez le support.',
        );
        return;
      }
      setTimeout(() => {
        Alert.alert(t.common.success, successMessage);
      }, 500);
      return;
    }

    const { shareExportCsv } = await import('@/utils/exportSpreadsheet.native');
    const flatRows = rows.map((row) => row.cells);
    await shareExportCsv(headers, flatRows, `${filenameBase}.csv`);
    Alert.alert(t.common.success, successMessage);
  };

  const handleAbsenceExport = async () => {
    if (!profile) return;
    setSelectedPeriod('absence');
    setLoading(true);
    setLoadingPeriod('absence');
    try {
      const range = nextMonthRange;
      const absences = await fetchTeamAbsences({
        viewerId: profile.id,
        viewerRole: profile.role,
        startDate: range.start,
        endDate: range.end,
      });

      if (absences.length === 0) {
        Alert.alert('Information', t.export.noAbsenceData);
        return;
      }

      const cols = t.export.csvColumnsAbsence;
      const table = buildAbsenceExportTable(
        absences,
        range,
        {
          collaborateur: cols.collaborateur,
          dateDebut: cols.dateDebut,
          dateFin: cols.dateFin,
          duration: cols.duration,
          motif: cols.motif,
          reason: cols.reason,
        },
        t,
        language,
      );

      await deliverExportFile(
        table.periodLabel,
        table.headers,
        table.rows,
        `export_absences_${range.start}_${range.end}`,
        t.export.absenceTab,
        `${absences.length} ${t.export.absenceExportSuccess}`,
        true,
      );
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    } finally {
      setLoading(false);
      setLoadingPeriod(null);
    }
  };

  const handleExport = async (period: ExportPeriod = selectedPeriod) => {
    if (period === 'absence') {
      await handleAbsenceExport();
      return;
    }

    setSelectedPeriod(period);
    if (period === 'custom' && customFrom > customTo) {
      Alert.alert(t.common.error, t.export.invalidCustomRange);
      return;
    }
    setLoading(true);
    setLoadingPeriod(period);
    try {
      const { start, end } = getDateRange(period);
      const exportData = await fetchExportDeclarations(period);

      if (exportData.length === 0) {
        Alert.alert('Information', t.export.noData);
        return;
      }

      const table = getExportTable(exportData, end);
      await deliverExportFile(
        table.periodLabel,
        table.headers,
        table.rows,
        `export_heures_${start}_${end}`,
        headerTitle,
        `${exportData.length} ${t.export.exportSuccess}`,
        false,
      );
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    } finally {
      setLoading(false);
      setLoadingPeriod(null);
    }
  };

  if (!profile?.role || !canExport(profile.role)) return null;

  const datePickers = (
    <>
      <DatePickerModal
        visible={activeDateField === 'from'}
        value={customFrom}
        onSelect={(value) => {
          setCustomFrom(value);
          if (value > customTo) setCustomTo(value);
        }}
        onClose={() => setActiveDateField(null)}
        closeLabel={t.common.cancel}
        showReset
        onReset={() => {
          setCustomFrom(today);
          if (today > customTo) setCustomTo(today);
        }}
        resetLabel={t.export.resetToToday}
      />
      <DatePickerModal
        visible={activeDateField === 'to'}
        value={customTo}
        onSelect={setCustomTo}
        onClose={() => setActiveDateField(null)}
        closeLabel={t.common.cancel}
        showReset
        onReset={() => setCustomTo(customFrom)}
        resetLabel={t.export.resetToStart}
        minDate={customFrom}
        rangeStart={customFrom}
        rangeEnd={customTo}
        highlightRange
      />
    </>
  );

  if (isDesktopLayout) {
    return (
      <>
        <ExportDesktop
          title={headerTitle}
          subtitle={headerSubtitle}
          showNotificationBell={canReceiveApprovalNotifications(profile?.role)}
          isChef={!!isChef}
          stats={[
            {
              key: 'total',
              Icon: Megaphone,
              color: desktopTheme.stats.declarations.color,
              bg: desktopTheme.stats.declarations.bg,
              border: desktopTheme.stats.declarations.border,
              value: formatDisplayNumber(stats.total_declarations),
              label: t.export.declarations,
            },
            {
              key: 'validees',
              Icon: BadgeCheck,
              color: desktopTheme.stats.approved.color,
              bg: desktopTheme.stats.approved.bg,
              border: desktopTheme.stats.approved.border,
              value: formatDisplayNumber(stats.validees),
              label: t.export.approved,
            },
            {
              key: 'pending',
              Icon: Hourglass,
              color: desktopTheme.stats.pending.color,
              bg: desktopTheme.stats.pending.bg,
              border: desktopTheme.stats.pending.border,
              value: formatDisplayNumber(stats.en_attente),
              label: t.export.pending,
            },
            {
              key: 'hours',
              Icon: Timer,
              color: desktopTheme.stats.hours.color,
              bg: desktopTheme.stats.hours.bg,
              border: desktopTheme.stats.hours.border,
              value: formatDisplayNumber(stats.total_heures, 1),
              label: t.export.totalHours,
              unit: 'h',
            },
          ]}
          onSelectPeriod={setSelectedPeriod}
          loading={loading}
          loadingPeriod={loadingPeriod}
          onExport={handleExport}
          periodLabels={{
            week: t.export.thisWeek,
            month: t.export.thisMonth,
            custom: t.export.customRange,
            absence: t.export.absenceTab,
          }}
          exportPeriodTitle={t.export.exportPeriod}
          exportInfo={
            selectedPeriod === 'absence' ? t.export.absenceExportInfo : t.export.exportInfo
          }
          exportFormat={
            selectedPeriod === 'absence' ? t.export.absenceExportFormat : t.export.exportFormat
          }
          exportButton={t.export.exportButton}
          customRangeEnabled={canUseCustomRange}
          absenceExportEnabled={canUseAbsenceExport}
          absencePeriodLabel={nextMonthLabel}
          absenceHint={t.export.absenceNextMonthHint}
          customFromLabel={t.export.fromLabel}
          customToLabel={t.export.toLabel}
          customFromValue={formatDateFieldLabel(customFrom, language)}
          customToValue={formatDateFieldLabel(customTo, language)}
          onSelectCustomFrom={() => setActiveDateField('from')}
          onSelectCustomTo={() => setActiveDateField('to')}
          instructionsTitle={t.export.instructions}
          instructions={[
            t.export.instruction1,
            t.export.instruction2,
            t.export.instruction3,
            t.export.instruction4,
          ]}
          legendTitle={t.export.indicatorsLegend}
          legendItems={indicatorLegendItems}
        />
        {datePickers}
      </>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{headerTitle}</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>
        </View>
        {canReceiveApprovalNotifications(profile?.role) ? (
          <ValidationNotificationBell variant="light" />
        ) : null}
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
                {canUseCustomRange ? (
                  <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === 'custom' && styles.periodButtonActive]}
                    onPress={() => setSelectedPeriod('custom')}
                  >
                    <Text style={[styles.periodText, selectedPeriod === 'custom' && styles.periodTextActive]}>
                      {t.export.customRange}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {canUseAbsenceExport ? (
                  <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === 'absence' && styles.periodButtonActive]}
                    onPress={() => setSelectedPeriod('absence')}
                  >
                    <Text style={[styles.periodText, selectedPeriod === 'absence' && styles.periodTextActive]}>
                      {t.export.absenceTab}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {canUseCustomRange && selectedPeriod === 'custom' ? (
                <View style={styles.customRangeBox}>
                  <View style={styles.customDateRow}>
                    <TouchableOpacity
                      style={styles.customDateField}
                      onPress={() => setActiveDateField('from')}
                      activeOpacity={0.82}
                    >
                      <Text style={styles.customDateLabel}>{t.export.fromLabel}</Text>
                      <View style={styles.customDateValueRow}>
                        <Calendar size={16} color="#FF6B35" />
                        <Text style={styles.customDateValue}>{formatDateFieldLabel(customFrom, language)}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.customDateField}
                      onPress={() => setActiveDateField('to')}
                      activeOpacity={0.82}
                    >
                      <Text style={styles.customDateLabel}>{t.export.toLabel}</Text>
                      <View style={styles.customDateValueRow}>
                        <Calendar size={16} color="#FF6B35" />
                        <Text style={styles.customDateValue}>{formatDateFieldLabel(customTo, language)}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.customDateHint}>{t.export.customRangeHint}</Text>
                </View>
              ) : null}

              {canUseAbsenceExport && selectedPeriod === 'absence' ? (
                <View style={styles.customRangeBox}>
                  <View style={styles.absencePeriodBox}>
                    <Calendar size={18} color="#FF6B35" />
                    <Text style={styles.absencePeriodText}>{nextMonthLabel}</Text>
                  </View>
                  <Text style={styles.customDateHint}>{t.export.absenceNextMonthHint}</Text>
                </View>
              ) : null}

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  {selectedPeriod === 'absence' ? t.export.absenceExportInfo : t.export.exportInfo}
                </Text>
                <Text style={styles.infoText}>
                  {selectedPeriod === 'absence' ? t.export.absenceExportFormat : t.export.exportFormat}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.exportButton, loading && styles.exportButtonDisabled]}
                onPress={() => {
                  void handleExport();
                }}
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
      {datePickers}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
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
    flexWrap: 'wrap',
    gap: 12,
  },
  periodButton: {
    flexGrow: 1,
    flexBasis: '40%',
    minWidth: 120,
    backgroundColor: '#F5F5F5',
    padding: 14,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  periodTextActive: {
    color: '#FF6B35',
  },
  customRangeBox: {
    gap: 10,
  },
  absencePeriodBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD5C7',
    padding: 14,
  },
  absencePeriodText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  customDateField: {
    flex: 1,
    backgroundColor: '#FFF7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD5C7',
    padding: 14,
    gap: 8,
  },
  customDateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B84512',
  },
  customDateValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customDateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  customDateHint: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
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
    shadowColor: '#FF6B35',
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.42,
    shadowRadius: 8,
    elevation: 5,
    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '2px 6px 14px rgba(255, 107, 53, 0.38), 0 2px 4px rgba(255, 107, 53, 0.22)',
        }
      : null),
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
