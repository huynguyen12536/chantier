import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, CheckSquare, ChevronDown, Clock, Building2, Square, UtensilsCrossed, Car } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ConfirmModal, SelectWorksiteModal, TimePickerModal } from '@/components/common';
import { Colors } from '@/constants/colors';
import { formatWeekDayLabel, getWeekDateStringsFromDate, parseDateKey } from '@/utils/date';
import {
  computeReplicationOverlapMap,
  fetchPreviousWeekHint,
  type WeekDayReplicationPlan,
} from '@/utils/ouvrierDeclaration';
import {
  formatTime,
  getEndTimeForNewStart,
  getMinEndTime,
  isEndAfterStart,
  timeRangesOverlap,
  toDbTimeString,
} from '@/utils/time';
import { declarationLookupKey } from '@/utils/status';
import { supabase } from '@/services/supabase';

interface Worksite {
  id: string;
  nom: string;
  code: string;
  heure_debut: string | null;
  heure_fin: string | null;
}

interface WorkLine {
  id: string;
  chantier_id: string;
  chantierNom: string;
  heure_debut: string;
  heure_fin: string;
  panier_repas: boolean;
  deplacement: boolean;
}

type ActivePeriod = {
  chantier_id: string;
  heure_debut: string | null;
  heure_fin: string | null;
  statut: string;
};

const WORK_WEEK_LENGTH = 5;

const WEEKDAY_INITIALS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function formatWeekDayCellLabel(dateStr: string): { letter: string; shortLabel: string } {
  const date = parseDateKey(dateStr);
  const short = date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
  return {
    letter: WEEKDAY_INITIALS[date.getDay()],
    shortLabel: short.charAt(0).toUpperCase() + short.slice(1),
  };
}

function filterActivePeriods(
  periods: (ActivePeriod & { date?: string })[],
  dateStr: string,
  declByKey: Map<string, string>,
): ActivePeriod[] {
  return periods.filter((period) => {
    const declStatut = declByKey.get(declarationLookupKey(period.chantier_id, dateStr));
    if (declStatut === 'annulee') return false;
    if (period.statut === 'annulee') return false;
    return true;
  });
}

function hasOverlapWithPeriods(
  dbDebut: string,
  dbFin: string,
  periods: ActivePeriod[],
): boolean {
  return periods.some((existing) => {
    if (!existing.heure_debut || !existing.heure_fin) return false;
    return timeRangesOverlap(dbDebut, dbFin, existing.heure_debut, existing.heure_fin);
  });
}

function resolveParam(value?: string | string[]): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

const createDefaultLine = (): WorkLine => ({
  id: 'line-default',
  chantier_id: '',
  chantierNom: '',
  heure_debut: '07:30',
  heure_fin: '16:45',
  panier_repas: true,
  deplacement: true,
});

export default function DeclareDayScreen() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    date: string;
    dayLabel: string;
    chantierId?: string;
    heureDebut?: string;
    heureFin?: string;
    panierRepas?: string;
    deplacement?: string;
    prefillWeek?: string;
  }>();
  const linesInitializedRef = useRef(false);
  const prefillWeekAppliedRef = useRef(false);

  const dateStr = resolveParam(params.date);
  const dayLabel = resolveParam(params.dayLabel);
  const prefillWeek = resolveParam(params.prefillWeek) === '1';
  const prefillChantierId = resolveParam(params.chantierId);
  const prefillHeureDebut = resolveParam(params.heureDebut);
  const prefillHeureFin = resolveParam(params.heureFin);
  const prefillPanierRepas = resolveParam(params.panierRepas) === '1';
  const prefillDeplacement = resolveParam(params.deplacement) === '1';
  const hasPrefill = Boolean(prefillChantierId);

  const [worksites, setWorksites] = useState<Worksite[]>([]);
  const [lines, setLines] = useState<WorkLine[]>(() => [createDefaultLine()]);
  const [worksitesLoading, setWorksitesLoading] = useState(true);
  const [showWorksitePicker, setShowWorksitePicker] = useState(false);
  const [timePicker, setTimePicker] = useState<{ field: 'heure_debut' | 'heure_fin'; value: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [overlapModalVisible, setOverlapModalVisible] = useState(false);
  const [applyWeekLoading, setApplyWeekLoading] = useState(false);
  const [applySelectedDays, setApplySelectedDays] = useState<Set<string>>(new Set());
  const [weekOverlapByDate, setWeekOverlapByDate] = useState<Record<string, boolean>>({});

  const weekDates = useMemo(
    () => (dateStr ? getWeekDateStringsFromDate(dateStr) : []),
    [dateStr],
  );

  const workWeekDates = useMemo(
    () => weekDates.slice(0, WORK_WEEK_LENGTH),
    [weekDates],
  );

  const formattedDate = useMemo(() => {
    if (dayLabel) return dayLabel;
    if (!dateStr) return '—';
    return formatWeekDayLabel(dateStr);
  }, [dateStr, dayLabel]);

  const loadWorksites = useCallback(async () => {
    try {
      setWorksitesLoading(true);
      const { data, error } = await supabase
        .from('chantiers')
        .select('id, nom, code, heure_debut, heure_fin, actif')
        .eq('actif', true)
        .order('nom', { ascending: true });

      if (error) throw error;

      const ws: Worksite[] = (data || []).map((c: any) => ({
        id: c.id,
        nom: c.nom,
        code: c.code,
        heure_debut: c.heure_debut ?? null,
        heure_fin: c.heure_fin ?? null,
      }));
      setWorksites(ws);

      if (!linesInitializedRef.current && ws.length > 0) {
        linesInitializedRef.current = true;
        const prefillWs = hasPrefill ? ws.find((w) => w.id === prefillChantierId) : undefined;
        const defaultWs = prefillWs ?? ws[0];
        setLines([{
          id: `line-${Date.now()}`,
          chantier_id: defaultWs.id,
          chantierNom: defaultWs.nom,
          heure_debut: prefillHeureDebut
            || (defaultWs.heure_debut ? formatTime(defaultWs.heure_debut) : '07:30'),
          heure_fin: prefillHeureFin
            || (defaultWs.heure_fin ? formatTime(defaultWs.heure_fin) : '16:45'),
          panier_repas: hasPrefill ? prefillPanierRepas : true,
          deplacement: hasPrefill ? prefillDeplacement : true,
        }]);
      }
    } catch (error) {
      console.error('Error loading worksites:', error);
    } finally {
      setWorksitesLoading(false);
    }
  }, [
    hasPrefill,
    prefillChantierId,
    prefillHeureDebut,
    prefillHeureFin,
    prefillPanierRepas,
    prefillDeplacement,
  ]);

  useEffect(() => {
    linesInitializedRef.current = false;
    setLines([createDefaultLine()]);
    prefillWeekAppliedRef.current = false;
    void loadWorksites();
  }, [dateStr, loadWorksites, prefillWeek]);

  const currentLine = lines[0] || null;

  const updateLine = (updates: Partial<WorkLine>) => {
    setLines((prev) => prev.map((l, i) => (i === 0 ? { ...l, ...updates } : l)));
  };

  const handleSelectWorksite = (ws: { id: string; nom: string; code: string }) => {
    const found = worksites.find((w) => w.id === ws.id);
    updateLine({
      chantier_id: ws.id,
      chantierNom: ws.nom,
      heure_debut: found?.heure_debut ? formatTime(found.heure_debut) : currentLine?.heure_debut || '07:30',
      heure_fin: found?.heure_fin ? formatTime(found.heure_fin) : currentLine?.heure_fin || '16:45',
    });
    setShowWorksitePicker(false);
  };

  const handleTimeConfirm = (value: string) => {
    if (!timePicker || !currentLine) return;

    if (timePicker.field === 'heure_debut') {
      const heure_fin = getEndTimeForNewStart(
        value,
        currentLine.heure_debut,
        currentLine.heure_fin,
      );
      updateLine({ heure_debut: value, heure_fin });
    } else {
      const heure_fin = isEndAfterStart(currentLine.heure_debut, value)
        ? value
        : getMinEndTime(currentLine.heure_debut);
      updateLine({ heure_fin });
    }

    setTimePicker(null);
  };

  const navigateToDashboard = useCallback((declaredDate: string) => {
    router.replace({
      pathname: '/(tabs)/ouvrier-dashboard',
      params: { focusDate: declaredDate },
    });
  }, [router]);

  const buildLinePayload = useCallback((line: WorkLine, targetDate: string) => ({
    user_id: profile!.id,
    chantier_id: line.chantier_id,
    date: targetDate,
    heure_debut: toDbTimeString(line.heure_debut),
    heure_fin: toDbTimeString(line.heure_fin),
    panier_repas: line.panier_repas,
    deplacement: line.deplacement,
    statut: 'terminee',
    latitude_debut: 0,
    longitude_debut: 0,
    latitude_fin: 0,
    longitude_fin: 0,
  }), [profile]);

  const loadWeekOverlapMap = useCallback(async (line: WorkLine) => {
    if (!profile?.id || weekDates.length === 0) {
      return {} as Record<string, boolean>;
    }

    const [periodsRes, declRes] = await Promise.all([
      supabase
        .from('periodes_travail')
        .select('chantier_id, date, heure_debut, heure_fin, statut')
        .eq('user_id', profile.id)
        .gte('date', weekDates[0])
        .lte('date', weekDates[6]),
      supabase
        .from('declarations_heures')
        .select('chantier_id, date, statut')
        .eq('user_id', profile.id)
        .gte('date', weekDates[0])
        .lte('date', weekDates[6]),
    ]);

    if (periodsRes.error) throw periodsRes.error;
    if (declRes.error) throw declRes.error;

    const declByKey = new Map<string, string>();
    for (const row of declRes.data || []) {
      declByKey.set(
        declarationLookupKey(row.chantier_id as string, row.date as string),
        row.statut as string,
      );
    }

    const dbDebut = toDbTimeString(line.heure_debut);
    const dbFin = toDbTimeString(line.heure_fin);
    const overlapByDate: Record<string, boolean> = {};

    for (const targetDate of weekDates) {
      const dayPeriods = (periodsRes.data || []).filter(
        (p: ActivePeriod & { date: string }) => p.date === targetDate,
      );
      const activePeriods = filterActivePeriods(dayPeriods, targetDate, declByKey);
      overlapByDate[targetDate] = hasOverlapWithPeriods(dbDebut, dbFin, activePeriods);
    }

    return overlapByDate;
  }, [profile?.id, weekDates]);

  const withLockedCurrentDay = useCallback((
    dates: Iterable<string>,
    overlapByDate: Record<string, boolean>,
  ) => {
    const next = new Set(dates);
    if (prefillWeek) return next;
    if (dateStr && weekDates.includes(dateStr) && !overlapByDate[dateStr]) {
      next.add(dateStr);
    }
    return next;
  }, [prefillWeek, dateStr, weekDates]);

  const refreshWeekSelection = useCallback(async () => {
    if (!currentLine?.chantier_id) {
      setWeekOverlapByDate({});
      setApplySelectedDays(new Set());
      return;
    }

    try {
      setApplyWeekLoading(true);
      const overlapByDate = await loadWeekOverlapMap(currentLine);
      setWeekOverlapByDate(overlapByDate);
      setApplySelectedDays((prev) => withLockedCurrentDay(
        [...prev].filter(
          (targetDate) => workWeekDates.includes(targetDate) && !overlapByDate[targetDate],
        ),
        overlapByDate,
      ));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t.timesheet.errorValidate;
      Alert.alert(t.common.error, message);
    } finally {
      setApplyWeekLoading(false);
    }
  }, [currentLine, dateStr, weekDates, workWeekDates, loadWeekOverlapMap, t, withLockedCurrentDay]);

  useEffect(() => {
    if (prefillWeek && !prefillWeekAppliedRef.current) return;
    void refreshWeekSelection();
  }, [
    prefillWeek,
    currentLine?.chantier_id,
    currentLine?.heure_debut,
    currentLine?.heure_fin,
    dateStr,
    weekDates,
    refreshWeekSelection,
  ]);

  const toggleApplyDay = (targetDate: string) => {
    if (!prefillWeek && targetDate === dateStr) return;

    setApplySelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(targetDate)) next.delete(targetDate);
      else next.add(targetDate);
      return withLockedCurrentDay(next, weekOverlapByDate);
    });
  };

  const buildPayloadForDate = useCallback((targetDate: string) => {
    return buildLinePayload(currentLine!, targetDate);
  }, [currentLine, buildLinePayload]);

  const submitLinesToDates = async (targetDates: string[]) => {
    if (!profile?.id || !dateStr) return false;

    const uniqueDates = Array.from(new Set(targetDates));

    if (!currentLine?.chantier_id) return false;
    const overlapByDate = await loadWeekOverlapMap(currentLine);
    for (const targetDate of uniqueDates) {
      if (overlapByDate[targetDate]) {
        setOverlapModalVisible(true);
        return false;
      }
    }

    const payloads = uniqueDates.map((targetDate) => buildPayloadForDate(targetDate));
    const { error } = await supabase.from('periodes_travail').insert(payloads);
    if (error) throw error;

    navigateToDashboard(dateStr);
    return true;
  };

  const handleSubmit = async () => {
    if (!profile?.id || !dateStr) return;

    if (!currentLine?.chantier_id) {
      Alert.alert(t.common.error, t.timesheet.invalidLine);
      return;
    }

    const targetDates = Array.from(applySelectedDays);
    if (targetDates.length === 0) {
      Alert.alert(t.common.error, t.ouvrierDashboard?.selectAtLeastOneDay ?? 'Sélectionnez au moins un jour');
      return;
    }

    try {
      setSubmitting(true);
      await submitLinesToDates(targetDates);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t.timesheet.errorValidate;
      Alert.alert(t.common.error, message);
    } finally {
      setSubmitting(false);
    }
  };

  const worksiteOptions = useMemo(
    () => worksites.map((w) => ({ id: w.id, nom: w.nom, code: w.code })),
    [worksites]
  );

  const canSubmit = useMemo(() => {
    if (applyWeekLoading || worksitesLoading || applySelectedDays.size === 0) return false;
    return Boolean(currentLine?.chantier_id);
  }, [
    currentLine?.chantier_id,
    applyWeekLoading,
    worksitesLoading,
    applySelectedDays.size,
  ]);

  const suggestableWeekDays = useMemo(
    () => workWeekDates.filter((targetDate) => !weekOverlapByDate[targetDate]),
    [workWeekDates, weekOverlapByDate],
  );

  /** Remplir ma semaine : cocher tous les jours ouvrables (données du formulaire, pas la semaine précédente). */
  useEffect(() => {
    if (!prefillWeek || prefillWeekAppliedRef.current) return;
    if (applyWeekLoading || worksitesLoading) return;
    if (!profile?.id || !currentLine?.chantier_id) return;

    prefillWeekAppliedRef.current = true;

    void (async () => {
      try {
        setApplyWeekLoading(true);
        const overlap = await loadWeekOverlapMap(currentLine);
        setWeekOverlapByDate(overlap);
        const selected = workWeekDates.filter((targetDate) => !overlap[targetDate]);
        setApplySelectedDays(new Set(selected));
      } catch (error: unknown) {
        prefillWeekAppliedRef.current = false;
        const message = error instanceof Error ? error.message : t.timesheet.errorValidate;
        Alert.alert(t.common.error, message);
      } finally {
        setApplyWeekLoading(false);
      }
    })();
  }, [
    prefillWeek,
    applyWeekLoading,
    worksitesLoading,
    profile?.id,
    currentLine,
    workWeekDates,
    loadWeekOverlapMap,
    t,
  ]);

  const otherSuggestableDays = useMemo(
    () => (prefillWeek
      ? suggestableWeekDays
      : suggestableWeekDays.filter((d) => d !== dateStr)),
    [prefillWeek, suggestableWeekDays, dateStr],
  );

  const visibleWeekDays = useMemo(() => weekDates, [weekDates]);

  const allSuggestableSelected = useMemo(
    () => otherSuggestableDays.length === 0
      || otherSuggestableDays.every((d) => applySelectedDays.has(d)),
    [otherSuggestableDays, applySelectedDays],
  );

  const toggleAllSuggestedDays = () => {
    if (allSuggestableSelected) {
      setApplySelectedDays(withLockedCurrentDay([], weekOverlapByDate));
      return;
    }
    setApplySelectedDays(new Set(suggestableWeekDays));
  };

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace({
      pathname: '/(tabs)/ouvrier-dashboard',
      params: dateStr ? { focusDate: dateStr } : undefined,
    });
  }, [router, dateStr]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF8A50', '#FF6B35', '#E55A2B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {t.ouvrierDashboard?.addLineTitle ?? 'Déclarer ma journée'}
          </Text>
          <Text style={styles.headerDate}>{formattedDate}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 168 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>
            {(t.timesheet.worksite as string).toUpperCase()}
          </Text>
          <TouchableOpacity
            style={styles.worksiteCard}
            onPress={() => setShowWorksitePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.worksiteIcon}>
              <Building2 size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.worksiteName, worksitesLoading && styles.worksiteNameLoading]} numberOfLines={1}>
              {worksitesLoading
                ? (t.common.loading as string)
                : (currentLine?.chantierNom || t.timesheet.select)}
            </Text>
            <ChevronDown size={18} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>
            {t.ouvrierDashboard?.scheduleLabel ?? 'HORAIRES'}
          </Text>
          <View style={styles.timeRow}>
            <TouchableOpacity
              style={styles.timeCard}
              onPress={() => currentLine && setTimePicker({
                field: 'heure_debut',
                value: currentLine.heure_debut,
              })}
              activeOpacity={0.7}
            >
              <Text style={styles.timeCardLabel}>{t.timesheet.start}</Text>
              <View style={styles.timeCardValue}>
                <View style={styles.timeIconWrap}>
                  <Clock size={16} color={Colors.primary} />
                </View>
                <Text style={styles.timeCardTime}>{currentLine?.heure_debut || '07:30'}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.timeArrowWrap}>
              <Text style={styles.timeArrow}>→</Text>
            </View>

            <TouchableOpacity
              style={styles.timeCard}
              onPress={() => {
                if (!currentLine) return;
                const endValue = isEndAfterStart(currentLine.heure_debut, currentLine.heure_fin)
                  ? currentLine.heure_fin
                  : getMinEndTime(currentLine.heure_debut);
                setTimePicker({ field: 'heure_fin', value: endValue });
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.timeCardLabel}>{t.timesheet.end}</Text>
              <View style={styles.timeCardValue}>
                <View style={styles.timeIconWrap}>
                  <Clock size={16} color={Colors.primary} />
                </View>
                <Text style={styles.timeCardTime}>{currentLine?.heure_fin || '16:45'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>
            {t.ouvrierDashboard?.optionsLabel ?? 'OPTIONS'}
          </Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionCard, currentLine?.panier_repas && styles.optionCardActive]}
              onPress={() => currentLine && updateLine({ panier_repas: !currentLine.panier_repas })}
              activeOpacity={0.7}
            >
              {currentLine?.panier_repas && (
                <View style={styles.optionBadge}>
                  <Check size={11} color="#FFF" strokeWidth={3} />
                </View>
              )}
              <View style={[styles.optionIconWrap, currentLine?.panier_repas && styles.optionIconWrapActive]}>
                <UtensilsCrossed size={22} color={currentLine?.panier_repas ? Colors.primary : Colors.text.secondary} />
              </View>
              <Text style={[styles.optionLabel, currentLine?.panier_repas && styles.optionLabelActive]}>
                {t.timesheet.meal}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionCard, currentLine?.deplacement && styles.optionCardActive]}
              onPress={() => currentLine && updateLine({ deplacement: !currentLine.deplacement })}
              activeOpacity={0.7}
            >
              {currentLine?.deplacement && (
                <View style={styles.optionBadge}>
                  <Check size={11} color="#FFF" strokeWidth={3} />
                </View>
              )}
              <View style={[styles.optionIconWrap, currentLine?.deplacement && styles.optionIconWrapActive]}>
                <Car size={22} color={currentLine?.deplacement ? Colors.primary : Colors.text.secondary} />
              </View>
              <Text style={[styles.optionLabel, currentLine?.deplacement && styles.optionLabelActive]}>
                {t.timesheet.displacement}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.weekSectionCard}>
          <View style={styles.weekSectionHeader}>
            <Text style={styles.weekSectionTitle}>
              {t.ouvrierDashboard?.weekSectionLabel ?? 'SEMAINE'}
            </Text>
            <View style={styles.weekSectionHeaderActions}>
              {!applyWeekLoading && otherSuggestableDays.length > 0 && currentLine?.chantier_id ? (
                <TouchableOpacity
                  style={styles.toggleAllSuggestedBtn}
                  onPress={toggleAllSuggestedDays}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {allSuggestableSelected ? (
                    <CheckSquare size={18} color={Colors.primary} strokeWidth={2.5} />
                  ) : (
                    <Square size={18} color={Colors.primary} strokeWidth={2.5} />
                  )}
                  <Text style={styles.toggleAllSuggestedText} allowFontScaling={false}>
                    {allSuggestableSelected
                      ? (t.ouvrierDashboard?.deselectAllSuggested ?? 'Tout désélectionner')
                      : (t.ouvrierDashboard?.fillMyWeek ?? 'Fill my week')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {applyWeekLoading ? (
            <View style={styles.weekDaysLoading}>
              <ActivityIndicator color={Colors.primary} size="small" />
            </View>
          ) : visibleWeekDays.length > 0 ? (
            <View style={styles.weekDayTable}>
              {visibleWeekDays.map((targetDate) => {
                const isSourceDay = !prefillWeek && targetDate === dateStr;
                const isWorkDay = workWeekDates.includes(targetDate);
                const hasOverlap = Boolean(weekOverlapByDate[targetDate]);
                const isChecked = isSourceDay || applySelectedDays.has(targetDate);
                const canToggle = Boolean(currentLine?.chantier_id) && isWorkDay && !isSourceDay && !hasOverlap;
                const { letter, shortLabel } = formatWeekDayCellLabel(targetDate);

                return (
                  <TouchableOpacity
                    key={targetDate}
                    style={[
                      styles.weekDayCell,
                      hasOverlap && styles.weekDayCellDisabled,
                    ]}
                    onPress={() => canToggle && toggleApplyDay(targetDate)}
                    activeOpacity={canToggle ? 0.7 : 1}
                    disabled={!canToggle}
                  >
                    <View style={styles.weekDayBadgeWrap}>
                      {isSourceDay ? (
                        <View style={styles.weekDayBadgeRing}>
                          <View style={styles.weekDayBadgeCurrent}>
                            <Text style={styles.weekDayLetterSelected} numberOfLines={1}>
                              {letter}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.weekDayBadge,
                            isChecked && styles.weekDayBadgeSelected,
                            !isChecked && styles.weekDayBadgeUnselected,
                          ]}
                        >
                          <Text
                            style={[
                              isChecked ? styles.weekDayLetterSelected : styles.weekDayLetterUnselected,
                              hasOverlap && styles.weekDayLetterDisabled,
                            ]}
                            numberOfLines={1}
                          >
                            {letter}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.weekDayShortLabel,
                        isSourceDay && styles.weekDayShortLabelCurrent,
                        !isChecked && styles.weekDayShortLabelMuted,
                        hasOverlap && styles.weekDayShortLabelMuted,
                      ]}
                      numberOfLines={1}
                    >
                      {shortLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>
              {t.ouvrierDashboard?.validateDay ?? 'Valider la journée'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Worksite Picker */}
      <SelectWorksiteModal
        visible={showWorksitePicker}
        title={t.timesheet.selectWorksiteModal}
        selectedId={currentLine?.chantier_id || null}
        worksites={worksiteOptions}
        onClose={() => setShowWorksitePicker(false)}
        onSelect={handleSelectWorksite}
      />

      {/* Time Picker */}
      {timePicker && (
        <TimePickerModal
          key={`${timePicker.field}-${timePicker.value}`}
          visible={!!timePicker}
          title={timePicker.field === 'heure_fin' ? t.timesheet.end : t.timesheet.start}
          value={timePicker.value}
          minTime={
            timePicker.field === 'heure_fin' && currentLine?.heure_debut
              ? getMinEndTime(currentLine.heure_debut)
              : undefined
          }
          confirmLabel={t.common.validate}
          cancelLabel={t.common.cancel}
          onClose={() => setTimePicker(null)}
          onConfirm={handleTimeConfirm}
        />
      )}

      {/* Overlap conflict modal */}
      <ConfirmModal
        visible={overlapModalVisible}
        title={t.timesheet.duplicateSlotTitle}
        message={t.timesheet.duplicateSlotMessage}
        cancelLabel={t.common.cancel}
        confirmLabel={t.common.ok}
        onCancel={() => setOverlapModalVisible(false)}
        onConfirm={() => setOverlapModalVisible(false)}
        singleButton
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F2',
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 18,
    zIndex: 2,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  headerDate: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    minHeight: 18,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  worksiteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7F2',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFE8DC',
  },
  worksiteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  worksiteName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    minHeight: 22,
  },
  worksiteNameLoading: {
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#FFF7F2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#FFE8DC',
  },
  timeCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timeCardValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeCardTime: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  timeArrowWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeArrow: {
    fontSize: 18,
    color: Colors.text.disabled,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#FFF7F2',
    borderWidth: 1.5,
    borderColor: '#FFE8DC',
    position: 'relative',
  },
  optionCardActive: {
    backgroundColor: '#FFFCF9',
    borderColor: Colors.primary,
  },
  optionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  optionIconWrapActive: {
    backgroundColor: '#FFF3EF',
    borderColor: '#FFD4C2',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  optionLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  weekDaysLoading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  weekSectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  weekSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  weekSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 22,
  },
  weekSectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  weekDayTable: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  weekDayCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    paddingHorizontal: 1,
  },
  weekDayCellDisabled: {
    opacity: 0.45,
  },
  weekDayBadgeWrap: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayBadgeUnselected: {
    backgroundColor: '#F3F4F6',
  },
  weekDayBadgeSelected: {
    backgroundColor: Colors.primary,
  },
  weekDayBadgeRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayBadgeCurrent: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayLetterSelected: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  weekDayLetterUnselected: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  weekDayLetterDisabled: {
    color: '#D1D5DB',
  },
  weekDayShortLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  weekDayShortLabelCurrent: {
    color: '#22C55E',
    fontWeight: '700',
  },
  weekDayShortLabelMuted: {
    color: '#9CA3AF',
  },
  toggleAllSuggestedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  toggleAllSuggestedText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 20,
    flexShrink: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF7F2',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
