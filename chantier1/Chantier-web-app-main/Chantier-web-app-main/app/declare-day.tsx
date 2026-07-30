import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, CheckSquare, ChevronDown, Clock, Building2, Square, UtensilsCrossed, Car } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ConfirmModal, SelectWorksiteModal, TimePickerModal } from '@/components/common';
import {
  ChantierDiversFormModal,
  type CreatedChantierDivers,
} from '@/components/declare-day/ChantierDiversFormModal';
import { DeclareDayDesktop } from '@/components/layoutDesktop';
import { Colors } from '@/constants/colors';
import { useIsDesktopLayout } from '@/hooks/useIsDesktopLayout';
import {
  formatWeekDayLabel,
  getWeekDateStringsFromDate,
  normalizeDateKey,
  parseDateKey,
  weekdayInitials,
  type DateLocale,
} from '@/utils/date';
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
  toDbTimeString,
} from '@/utils/time';
import { requiresFrameReason, isPendingDiversChantier, defaultShiftTimesForWorksite } from '@/utils/chantierDivers';
import { isWorker } from '@/utils/role';
import {
  buildDeclarationStatutMap,
  checkShiftOverlapForDate,
  filterActivePeriodsForShiftOverlap,
  shiftOverlapsActivePeriods,
  type ShiftOverlapPeriod,
} from '@/utils/shiftOverlap';
import { declarationLookupKey, isShiftEditable, resolveLineStatut } from '@/utils/status';
import { supabase } from '@/services/supabase';
import { findAbsenceForDate, findFirstAbsenceOnDates } from '@/utils/absence';
import { appAlert } from '@/utils/appAlert';

import type { ChantierDiversStatut, ChantierSource } from '@/types';

interface Worksite {
  id: string;
  nom: string;
  code: string;
  heure_debut: string | null;
  heure_fin: string | null;
  source?: ChantierSource;
  divers_statut?: ChantierDiversStatut | null;
}

interface WorkLine {
  id: string;
  chantier_id: string;
  chantierNom: string;
  heure_debut: string;
  heure_fin: string;
  panier_repas: boolean;
  deplacement: boolean;
  commentaire: string;
}

const WORK_WEEK_LENGTH = 5;

function formatWeekDayCellLabel(
  dateStr: string,
  locale: DateLocale,
): { letter: string; shortLabel: string } {
  const date = parseDateKey(dateStr);
  const short = date.toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
  return {
    letter: weekdayInitials(locale)[date.getDay()],
    shortLabel: short.charAt(0).toUpperCase() + short.slice(1),
  };
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
  commentaire: '',
});

export default function DeclareDayScreen() {
  const { profile } = useAuth();
  const { t, dateLocale } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDesktopLayout = useIsDesktopLayout();
  const params = useLocalSearchParams<{
    date: string;
    dayLabel: string;
    chantierId?: string;
    heureDebut?: string;
    heureFin?: string;
    panierRepas?: string;
    deplacement?: string;
    prefillWeek?: string;
    editMode?: string;
    periodId?: string;
    extraSlot?: string;
  }>();
  const linesInitializedRef = useRef(false);
  const prefillWeekAppliedRef = useRef(false);
  const overlapFetchGenRef = useRef(0);

  const dateStr = resolveParam(params.date);
  const dayLabel = resolveParam(params.dayLabel);
  const prefillWeek = resolveParam(params.prefillWeek) === '1';
  const prefillChantierId = resolveParam(params.chantierId);
  const prefillHeureDebut = resolveParam(params.heureDebut);
  const prefillHeureFin = resolveParam(params.heureFin);
  const hasPanierParam = params.panierRepas !== undefined;
  const hasDeplacementParam = params.deplacement !== undefined;
  const prefillPanierRepas = resolveParam(params.panierRepas) === '1';
  const prefillDeplacement = resolveParam(params.deplacement) === '1';
  const isExtraSlot = resolveParam(params.extraSlot) === '1';
  const hasPrefill = Boolean(prefillChantierId);
  const editPeriodId = resolveParam(params.periodId);
  const isEditMode = resolveParam(params.editMode) === '1' && Boolean(editPeriodId);

  const [worksites, setWorksites] = useState<Worksite[]>([]);
  const [lines, setLines] = useState<WorkLine[]>(() => [createDefaultLine()]);
  const [worksitesLoading, setWorksitesLoading] = useState(true);
  const [showWorksitePicker, setShowWorksitePicker] = useState(false);
  const [showDiversForm, setShowDiversForm] = useState(false);
  const [timePicker, setTimePicker] = useState<{ field: 'heure_debut' | 'heure_fin'; value: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [overlapModalVisible, setOverlapModalVisible] = useState(false);
  const [invalidDurationModalVisible, setInvalidDurationModalVisible] = useState(false);
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

  // Always format from the date key so EN/FR switches correctly
  // (route dayLabel may have been baked in French).
  const formattedDate = useMemo(() => {
    if (!dateStr) return dayLabel || '—';
    return formatWeekDayLabel(dateStr, dateLocale);
  }, [dateStr, dayLabel, dateLocale]);

  useEffect(() => {
    if (!profile?.id || !dateStr) return;
    let cancelled = false;
    void (async () => {
      const absence = await findAbsenceForDate(profile.id, dateStr);
      if (cancelled || !absence) return;
      appAlert(t.common.error, t.absences.errors.dayAlreadyAbsent, [
        {
          text: t.common.ok,
          onPress: () => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/ouvrier-dashboard');
          },
        },
      ]);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, dateStr, router, t]);

  const loadWorksites = useCallback(async () => {
    try {
      setWorksitesLoading(true);
      let query = supabase
        .from('chantiers')
        .select('id, nom, code, heure_debut, heure_fin, actif, source, divers_statut, created_by')
        .order('nom', { ascending: true });

      if (profile?.id && isWorker(profile.role)) {
        query = query.or(
          `actif.eq.true,and(source.eq.divers,divers_statut.eq.en_attente,created_by.eq.${profile.id})`,
        );
      } else {
        query = query.eq('actif', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      const ws: Worksite[] = (data || []).map((c: {
        id: string;
        nom: string;
        code: string;
        heure_debut: string | null;
        heure_fin: string | null;
        source?: ChantierSource;
        divers_statut?: ChantierDiversStatut | null;
      }) => ({
        id: c.id,
        nom: c.nom,
        code: c.code,
        heure_debut: c.heure_debut ?? null,
        heure_fin: c.heure_fin ?? null,
        source: c.source ?? 'standard',
        divers_statut: c.divers_statut ?? null,
      }));
      setWorksites(ws);

      if (!linesInitializedRef.current && ws.length > 0) {
        linesInitializedRef.current = true;
        const prefillWs = (isEditMode || hasPrefill)
          ? ws.find((w) => w.id === prefillChantierId)
          : undefined;
        const defaultWs = prefillWs ?? ws[0];

        let heureDebut = prefillHeureDebut;
        let heureFin = prefillHeureFin;
        if (!heureDebut || !heureFin) {
          const shiftDefaults = defaultShiftTimesForWorksite({
            source: defaultWs.source,
            diversStatut: defaultWs.divers_statut,
            chantierDebut: defaultWs.heure_debut,
            chantierFin: defaultWs.heure_fin,
            formatChantierTime: formatTime,
          });
          heureDebut = heureDebut || shiftDefaults.debut;
          heureFin = heureFin || shiftDefaults.fin;
        }
        // First shift of the day: Meal + Travel ON by default.
        // Extra slot: OFF. Edit: preserve stored values.
        let panierRepas = true;
        let deplacement = true;

        if (isExtraSlot) {
          // 2nd+ shift that day: start at previous end, no end suggestion, allowances off.
          heureDebut = prefillHeureDebut || heureDebut;
          heureFin = '';
          panierRepas = hasPanierParam ? prefillPanierRepas : false;
          deplacement = hasDeplacementParam ? prefillDeplacement : false;
        } else if (isEditMode) {
          // Editing must preserve the stored values passed by the consultation screen.
          heureFin = prefillHeureFin || heureFin;
          panierRepas = hasPanierParam ? prefillPanierRepas : true;
          deplacement = hasDeplacementParam ? prefillDeplacement : true;
        } else {
          // First shift (with or without time/chantier prefill): always Meal + Travel on.
          if (hasPrefill || prefillHeureFin) {
            heureFin = prefillHeureFin || heureFin;
          }
          panierRepas = true;
          deplacement = true;
        }

        let existingCommentaire = '';
        if (isEditMode && editPeriodId && profile?.id) {
          const { data: periodRow } = await supabase
            .from('periodes_travail')
            .select('commentaire')
            .eq('id', editPeriodId)
            .eq('user_id', profile.id)
            .maybeSingle();
          existingCommentaire = typeof periodRow?.commentaire === 'string'
            ? periodRow.commentaire
            : '';
        }

        setLines([{
          id: isEditMode && editPeriodId ? editPeriodId : `line-${Date.now()}`,
          chantier_id: defaultWs.id,
          chantierNom: defaultWs.nom,
          heure_debut: heureDebut,
          heure_fin: heureFin,
          panier_repas: panierRepas,
          deplacement,
          commentaire: existingCommentaire,
        }]);
      }
    } catch (error) {
      console.error('Error loading worksites:', error);
    } finally {
      setWorksitesLoading(false);
    }
  }, [
    hasPrefill,
    isEditMode,
    isExtraSlot,
    editPeriodId,
    profile?.id,
    profile?.role,
    prefillChantierId,
    prefillHeureDebut,
    prefillHeureFin,
    prefillPanierRepas,
    prefillDeplacement,
    hasPanierParam,
    hasDeplacementParam,
  ]);

  useEffect(() => {
    linesInitializedRef.current = false;
    setLines([createDefaultLine()]);
    prefillWeekAppliedRef.current = false;
    void loadWorksites();
  }, [dateStr, loadWorksites, prefillWeek, isEditMode, editPeriodId]);

  const currentLine = lines[0] || null;

  const updateLine = (updates: Partial<WorkLine>) => {
    setLines((prev) => prev.map((l, i) => (i === 0 ? { ...l, ...updates } : l)));
  };

  const handleSelectWorksite = (ws: { id: string; nom: string; code: string }) => {
    const found = worksites.find((w) => w.id === ws.id);
    if (isExtraSlot) {
      // Keep previous-end start and empty end; only change chantier.
      updateLine({
        chantier_id: ws.id,
        chantierNom: ws.nom,
      });
    } else {
      const shiftDefaults = found
        ? defaultShiftTimesForWorksite({
            source: found.source,
            diversStatut: found.divers_statut,
            chantierDebut: found.heure_debut,
            chantierFin: found.heure_fin,
            formatChantierTime: formatTime,
          })
        : {
            debut: currentLine?.heure_debut || '07:30',
            fin: currentLine?.heure_fin || '16:45',
          };
      updateLine({
        chantier_id: ws.id,
        chantierNom: ws.nom,
        heure_debut: shiftDefaults.debut,
        heure_fin: shiftDefaults.fin,
      });
    }
    setShowWorksitePicker(false);
  };

  const handleChantierDiversCreated = useCallback((created: CreatedChantierDivers) => {
    const ws: Worksite = {
      id: created.id,
      nom: created.nom,
      code: created.code,
      heure_debut: formatTime(created.heure_debut),
      heure_fin: formatTime(created.heure_fin),
      source: 'divers',
      divers_statut: 'en_attente',
    };
    setWorksites((prev) => {
      const next = [...prev.filter((w) => w.id !== ws.id), ws];
      return next.sort((a, b) => a.nom.localeCompare(b.nom));
    });
    setLines([{
      id: `line-${Date.now()}`,
      chantier_id: ws.id,
      chantierNom: ws.nom,
      heure_debut: defaultShiftTimesForWorksite({
        source: 'divers',
        diversStatut: 'en_attente',
      }).debut,
      heure_fin: defaultShiftTimesForWorksite({
        source: 'divers',
        diversStatut: 'en_attente',
      }).fin,
      panier_repas: true,
      deplacement: true,
      commentaire: '',
    }]);
    setShowDiversForm(false);
  }, []);

  const handleTimeConfirm = (value: string) => {
    if (!timePicker || !currentLine) return;

    if (timePicker.field === 'heure_debut') {
      if (isExtraSlot && !currentLine.heure_fin) {
        updateLine({ heure_debut: value });
      } else {
        const heure_fin = getEndTimeForNewStart(
          value,
          currentLine.heure_debut,
          currentLine.heure_fin,
        );
        updateLine({ heure_debut: value, heure_fin });
      }
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

  const buildLinePayload = useCallback((line: WorkLine, targetDate: string) => {
    const worksite = worksites.find((w) => w.id === line.chantier_id);
    const needsReason = requiresFrameReason({
      workDebut: line.heure_debut,
      workFin: line.heure_fin,
      chantierDebut: worksite?.heure_debut,
      chantierFin: worksite?.heure_fin,
      chantierSource: worksite?.source,
      diversStatut: worksite?.divers_statut,
    });
    return {
      user_id: profile!.id,
      chantier_id: line.chantier_id,
      date: targetDate,
      heure_debut: toDbTimeString(line.heure_debut),
      heure_fin: toDbTimeString(line.heure_fin),
      panier_repas: line.panier_repas,
      deplacement: line.deplacement,
      commentaire: needsReason ? line.commentaire.trim() : null,
      statut: 'terminee',
      latitude_debut: 0,
      longitude_debut: 0,
      latitude_fin: 0,
      longitude_fin: 0,
    };
  }, [profile, worksites]);

  const selectedWorksite = useMemo(
    () => worksites.find((w) => w.id === currentLine?.chantier_id) ?? null,
    [worksites, currentLine?.chantier_id],
  );

  const reasonRequired = useMemo(() => {
    if (!currentLine?.heure_debut || !currentLine?.heure_fin) return false;
    return requiresFrameReason({
      workDebut: currentLine.heure_debut,
      workFin: currentLine.heure_fin,
      chantierDebut: selectedWorksite?.heure_debut,
      chantierFin: selectedWorksite?.heure_fin,
      chantierSource: selectedWorksite?.source,
      diversStatut: selectedWorksite?.divers_statut,
    });
  }, [
    currentLine?.heure_debut,
    currentLine?.heure_fin,
    selectedWorksite?.heure_debut,
    selectedWorksite?.heure_fin,
    selectedWorksite?.source,
    selectedWorksite?.divers_statut,
  ]);

  useEffect(() => {
    if (reasonRequired) return;
    if (!currentLine?.commentaire) return;
    setLines((prev) => prev.map((line, index) => (
      index === 0 && line.commentaire ? { ...line, commentaire: '' } : line
    )));
  }, [reasonRequired, currentLine?.commentaire]);

  const loadWeekOverlapMap = useCallback(async (line: WorkLine) => {
    if (!profile?.id || weekDates.length === 0) {
      return {} as Record<string, boolean>;
    }
    if (!line.heure_debut || !line.heure_fin) {
      return {} as Record<string, boolean>;
    }

    const [periodsRes, declRes] = await Promise.all([
      supabase
        .from('periodes_travail')
        .select('id, chantier_id, date, heure_debut, heure_fin, statut')
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

    const declByKey = buildDeclarationStatutMap(
      (declRes.data || []) as { chantier_id: string; date: string; statut: string }[],
    );

    const overlapByDate: Record<string, boolean> = {};

    for (const targetDate of weekDates) {
      const dayPeriods = (periodsRes.data || []).filter(
        (p: ShiftOverlapPeriod & { date: string; id?: string }) =>
          normalizeDateKey(p.date) === targetDate && (!isEditMode || p.id !== editPeriodId),
      );
      const activePeriods = filterActivePeriodsForShiftOverlap(dayPeriods, targetDate, declByKey);
      overlapByDate[targetDate] = shiftOverlapsActivePeriods(
        line.heure_debut,
        line.heure_fin,
        activePeriods,
      );
    }

    return overlapByDate;
  }, [profile?.id, weekDates, isEditMode, editPeriodId]);

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

  const computeOverlapConflict = useCallback((
    overlapByDate: Record<string, boolean>,
    selectedDays: Set<string>,
  ) => {
    if (!currentLine?.heure_debut || !currentLine?.heure_fin) return false;
    if (!isEndAfterStart(currentLine.heure_debut, currentLine.heure_fin)) return false;
    if (isEditMode) {
      return Boolean(dateStr && overlapByDate[dateStr]);
    }
    const targetDates = Array.from(
      withLockedCurrentDay(selectedDays, overlapByDate),
    );
    if (targetDates.length === 0) {
      return Boolean(dateStr && overlapByDate[dateStr]);
    }
    return targetDates.some((d) => overlapByDate[d]);
  }, [
    currentLine?.heure_debut,
    currentLine?.heure_fin,
    isEditMode,
    dateStr,
    withLockedCurrentDay,
  ]);

  const refreshWeekSelection = useCallback(async (fetchGen: number) => {
    if (!currentLine?.chantier_id) {
      if (fetchGen === overlapFetchGenRef.current) {
        setWeekOverlapByDate({});
        setApplySelectedDays(new Set());
        setOverlapModalVisible(false);
      }
      return;
    }

    if (!currentLine.heure_debut || !currentLine.heure_fin) {
      if (fetchGen === overlapFetchGenRef.current) {
        setWeekOverlapByDate({});
        setOverlapModalVisible(false);
      }
      return;
    }

    try {
      if (fetchGen === overlapFetchGenRef.current) {
        setApplyWeekLoading(true);
      }
      const overlapByDate = await loadWeekOverlapMap(currentLine);
      if (fetchGen !== overlapFetchGenRef.current) return;

      setWeekOverlapByDate(overlapByDate);

      const filtered = [...applySelectedDays].filter(
        (targetDate) => workWeekDates.includes(targetDate) && !overlapByDate[targetDate],
      );
      const nextSelected = withLockedCurrentDay(filtered, overlapByDate);
      setApplySelectedDays(nextSelected);
    } catch (error: unknown) {
      if (fetchGen !== overlapFetchGenRef.current) return;
      const message = error instanceof Error ? error.message : t.timesheet.errorValidate;
      Alert.alert(t.common.error, message);
    } finally {
      if (fetchGen === overlapFetchGenRef.current) {
        setApplyWeekLoading(false);
      }
    }
  }, [
    currentLine,
    applySelectedDays,
    workWeekDates,
    loadWeekOverlapMap,
    t,
    withLockedCurrentDay,
    computeOverlapConflict,
  ]);

  useEffect(() => {
    if (prefillWeek && !prefillWeekAppliedRef.current) return;
    const fetchGen = ++overlapFetchGenRef.current;
    void refreshWeekSelection(fetchGen);
  }, [
    prefillWeek,
    currentLine?.chantier_id,
    currentLine?.heure_debut,
    currentLine?.heure_fin,
    dateStr,
    weekDates,
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

    if (!currentLine?.chantier_id) return false;
    if (!currentLine.heure_debut || !currentLine.heure_fin) return false;
    if (!isEndAfterStart(currentLine.heure_debut, currentLine.heure_fin)) return false;

    const overlapByDate = await loadWeekOverlapMap(currentLine);

    if (isEditMode && editPeriodId) {
      const dbOverlap = await checkShiftOverlapForDate(
        profile.id,
        dateStr,
        currentLine.heure_debut,
        currentLine.heure_fin,
        editPeriodId,
      );
      if (overlapByDate[dateStr] || dbOverlap) {
        setOverlapModalVisible(true);
        return false;
      }

      const payload = buildLinePayload(currentLine, dateStr);
      const { error } = await supabase
        .from('periodes_travail')
        .update(payload)
        .eq('id', editPeriodId)
        .eq('user_id', profile.id);

      if (error) throw error;

      // Pop edit screen — avoid replace which stacks a second declare-day-empty
      // and forces the user to press Back twice.
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace({
          pathname: '/declare-day-empty',
          params: { date: dateStr, dayLabel },
        });
      }
      return true;
    }

    const uniqueDates = Array.from(new Set(targetDates));

    for (const targetDate of uniqueDates) {
      const dbOverlap = await checkShiftOverlapForDate(
        profile.id,
        targetDate,
        currentLine.heure_debut,
        currentLine.heure_fin,
      );
      if (overlapByDate[targetDate] || dbOverlap) {
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

    if (!currentLine.heure_debut || !currentLine.heure_fin) {
      Alert.alert(t.common.error, t.timesheet.invalidLine);
      return;
    }
    if (!isEndAfterStart(currentLine.heure_debut, currentLine.heure_fin)) {
      Alert.alert(t.common.error, t.timesheet.invalidLine);
      return;
    }

    if (reasonRequired && !currentLine.commentaire.trim()) {
      Alert.alert(
        t.common.error,
        t.ouvrierDashboard?.reasonRequired
          ?? 'Indique une raison lorsque le créneau dépasse les horaires du chantier.',
      );
      return;
    }

    if (isEditMode) {
      const blocked = await findFirstAbsenceOnDates(profile.id, [dateStr]);
      if (blocked) {
        appAlert(t.common.error, t.absences.errors.dayAlreadyAbsent);
        return;
      }
      try {
        setSubmitting(true);
        await submitLinesToDates([dateStr]);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : t.timesheet.errorValidate;
        Alert.alert(t.common.error, message);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Source day is always intended for submit; keep it even if selection Set is empty.
    const targetDates = Array.from(
      withLockedCurrentDay(applySelectedDays, weekOverlapByDate),
    );

    if (targetDates.length === 0) {
      // UI shows the source day as checked, but overlap blocks it from the Set.
      if (weekOverlapByDate[dateStr]) {
        setOverlapModalVisible(true);
        return;
      }
      Alert.alert(t.common.error, t.ouvrierDashboard?.selectAtLeastOneDay ?? 'Sélectionnez au moins un jour');
      return;
    }

    const blocked = await findFirstAbsenceOnDates(profile.id, targetDates);
    if (blocked) {
      appAlert(t.common.error, t.absences.errors.dayAlreadyAbsent);
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

  const overlapBlocksSubmit = useMemo(() => {
    if (applyWeekLoading) return false;
    if (!currentLine?.heure_debut || !currentLine?.heure_fin) return false;
    if (!isEndAfterStart(currentLine.heure_debut, currentLine.heure_fin)) return false;
    return computeOverlapConflict(weekOverlapByDate, applySelectedDays);
  }, [
    currentLine?.heure_debut,
    currentLine?.heure_fin,
    weekOverlapByDate,
    applySelectedDays,
    computeOverlapConflict,
    applyWeekLoading,
  ]);

  const invalidShiftDuration = useMemo(() => {
    if (!currentLine?.heure_debut || !currentLine?.heure_fin) return false;
    return !isEndAfterStart(currentLine.heure_debut, currentLine.heure_fin);
  }, [currentLine?.heure_debut, currentLine?.heure_fin]);

  useEffect(() => {
    if (applyWeekLoading) return;
    if (invalidShiftDuration) {
      setInvalidDurationModalVisible(true);
      setOverlapModalVisible(false);
      return;
    }
    setInvalidDurationModalVisible(false);
  }, [
    applyWeekLoading,
    invalidShiftDuration,
    currentLine?.heure_debut,
    currentLine?.heure_fin,
  ]);

  useEffect(() => {
    if (applyWeekLoading || invalidShiftDuration) return;
    setOverlapModalVisible(overlapBlocksSubmit);
  }, [applyWeekLoading, overlapBlocksSubmit, invalidShiftDuration]);

  const canSubmit = useMemo(() => {
    if (worksitesLoading || applyWeekLoading) return false;
    if (!currentLine?.chantier_id) return false;
    if (!currentLine.heure_debut || !currentLine.heure_fin) return false;
    if (!isEndAfterStart(currentLine.heure_debut, currentLine.heure_fin)) return false;
    if (reasonRequired && !currentLine.commentaire.trim()) return false;
    if (overlapBlocksSubmit) return false;
    if (isEditMode) return true;
    return applySelectedDays.size > 0 || Boolean(dateStr);
  }, [
    currentLine?.chantier_id,
    currentLine?.heure_debut,
    currentLine?.heure_fin,
    currentLine?.commentaire,
    reasonRequired,
    applyWeekLoading,
    worksitesLoading,
    applySelectedDays.size,
    isEditMode,
    dateStr,
    overlapBlocksSubmit,
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
    if (isEditMode && dateStr) {
      router.replace({
        pathname: '/declare-day-empty',
        params: { date: dateStr, dayLabel },
      });
      return;
    }
    router.replace({
      pathname: '/(tabs)/ouvrier-dashboard',
      params: dateStr ? { focusDate: dateStr } : undefined,
    });
  }, [router, dateStr, dayLabel, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !editPeriodId || !profile?.id) return;

    void (async () => {
      const { data, error } = await supabase
        .from('periodes_travail')
        .select('id, statut, chantier_id, date')
        .eq('id', editPeriodId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error || !data) {
        Alert.alert(t.common.error, t.timesheet.errorValidate);
        handleBack();
        return;
      }

      const { data: declRows } = await supabase
        .from('declarations_heures')
        .select('chantier_id, date, statut')
        .eq('user_id', profile.id)
        .eq('date', data.date as string);

      const declByKey = new Map<string, string>();
      for (const row of declRows || []) {
        declByKey.set(
          declarationLookupKey(row.chantier_id as string, row.date as string),
          row.statut as string,
        );
      }

      const resolved = resolveLineStatut(
        data.statut as string,
        data.chantier_id as string,
        data.date as string,
        declByKey,
      );

      if (!isShiftEditable(resolved)) {
        Alert.alert(
          t.common.error,
          t.ouvrierDashboard?.shiftNotEditable ?? 'Ce créneau ne peut plus être modifié.',
        );
        handleBack();
      }
    })();
  }, [isEditMode, editPeriodId, profile?.id, t, handleBack]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [handleBack]);

  if (!profile || profile.role !== 'ouvrier') return null;

  const pageTitle = isEditMode
    ? (t.ouvrierDashboard?.editLineTitle ?? 'Modifier le créneau')
    : (t.ouvrierDashboard?.addLineTitle ?? 'Déclarer ma journée');

  const modals = (
    <>
      <SelectWorksiteModal
        visible={showWorksitePicker}
        title={t.timesheet.selectWorksiteModal}
        selectedId={currentLine?.chantier_id || null}
        worksites={worksiteOptions}
        searchPlaceholder={t.timesheet.searchWorksitePlaceholder}
        noResultsMessage={t.timesheet.noWorksiteSearchResults}
        onClose={() => setShowWorksitePicker(false)}
        onSelect={handleSelectWorksite}
        chantierDiversLabel={
          profile && isWorker(profile.role) ? t.chantierDivers.cta : undefined
        }
        onPressChantierDivers={
          profile && isWorker(profile.role)
            ? () => {
                setShowWorksitePicker(false);
                setShowDiversForm(true);
              }
            : undefined
        }
      />

      <ChantierDiversFormModal
        visible={showDiversForm}
        onClose={() => setShowDiversForm(false)}
        onCreated={handleChantierDiversCreated}
      />

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

      <ConfirmModal
        visible={invalidDurationModalVisible}
        title={t.timesheet.invalidShiftDurationTitle}
        message={t.timesheet.invalidShiftDurationMessage}
        cancelLabel={t.common.cancel}
        confirmLabel={t.common.ok}
        onCancel={() => setInvalidDurationModalVisible(false)}
        onConfirm={() => setInvalidDurationModalVisible(false)}
        singleButton
      />
    </>
  );

  if (isDesktopLayout) {
    return (
      <>
        <DeclareDayDesktop
          title={pageTitle}
          subtitle={formattedDate}
          onBack={handleBack}
          backLabel={t.common.cancel}
          worksiteLabel={(t.timesheet.worksite as string).toUpperCase()}
          worksiteValue={
            worksitesLoading
              ? (t.common.loading as string)
              : (currentLine?.chantierNom || t.timesheet.select)
          }
          worksiteLoading={worksitesLoading}
          worksitePendingBadge={
            selectedWorksite &&
            isPendingDiversChantier(selectedWorksite.source, selectedWorksite.divers_statut)
              ? t.chantierDivers.pendingBadge
              : null
          }
          onPressWorksite={() => setShowWorksitePicker(true)}
          scheduleLabel={t.ouvrierDashboard?.scheduleLabel ?? 'HORAIRES'}
          startLabel={t.timesheet.start}
          endLabel={t.timesheet.end}
          startTime={currentLine?.heure_debut || '07:30'}
          endTime={currentLine?.heure_fin || ''}
          endPlaceholder={t.timesheet.selectTime ?? t.timesheet.select ?? '—'}
          onPressStart={() =>
            currentLine &&
            setTimePicker({
              field: 'heure_debut',
              value: currentLine.heure_debut,
            })
          }
          onPressEnd={() => {
            if (!currentLine) return;
            const endValue =
              currentLine.heure_fin && isEndAfterStart(currentLine.heure_debut, currentLine.heure_fin)
                ? currentLine.heure_fin
                : getMinEndTime(currentLine.heure_debut);
            setTimePicker({ field: 'heure_fin', value: endValue });
          }}
          reasonRequired={reasonRequired}
          reasonLabel={t.ouvrierDashboard?.reasonLabel ?? 'RAISON'}
          reasonPlaceholder={
            t.ouvrierDashboard?.reasonPlaceholder ??
            'Explique pourquoi le créneau sort du cadre horaire…'
          }
          reasonValue={currentLine?.commentaire ?? ''}
          onReasonChange={(value) => updateLine({ commentaire: value })}
          optionsLabel={t.ouvrierDashboard?.optionsLabel ?? 'OPTIONS'}
          mealLabel={t.timesheet.meal}
          displacementLabel={t.timesheet.displacement}
          mealActive={Boolean(currentLine?.panier_repas)}
          displacementActive={Boolean(currentLine?.deplacement)}
          onToggleMeal={() =>
            currentLine && updateLine({ panier_repas: !currentLine.panier_repas })
          }
          onToggleDisplacement={() =>
            currentLine && updateLine({ deplacement: !currentLine.deplacement })
          }
          showWeekSection={!isEditMode}
          weekSectionLabel={t.ouvrierDashboard?.weekSectionLabel ?? 'SEMAINE'}
          applyWeekLoading={applyWeekLoading}
          showToggleAllSuggested={
            otherSuggestableDays.length > 0 && Boolean(currentLine?.chantier_id)
          }
          allSuggestableSelected={allSuggestableSelected}
          selectAllLabel={t.ouvrierDashboard?.fillMyWeek ?? 'Fill my week'}
          deselectAllLabel={t.ouvrierDashboard?.deselectAllSuggested ?? 'Tout désélectionner'}
          onToggleAllSuggested={toggleAllSuggestedDays}
          weekDays={visibleWeekDays.map((targetDate) => {
            const isSourceDay = !prefillWeek && targetDate === dateStr;
            const isWorkDay = workWeekDates.includes(targetDate);
            const hasOverlap = Boolean(weekOverlapByDate[targetDate]);
            const sourceBlocked = isSourceDay && hasOverlap;
            const isChecked =
              (!sourceBlocked && isSourceDay) || applySelectedDays.has(targetDate);
            const canToggle =
              Boolean(currentLine?.chantier_id) && isWorkDay && !isSourceDay && !hasOverlap;
            const { letter, shortLabel } = formatWeekDayCellLabel(targetDate, dateLocale);
            return {
              date: targetDate,
              letter,
              shortLabel,
              isSourceDay,
              isChecked,
              canToggle,
              hasOverlap,
              sourceBlocked,
            };
          })}
          onPressWeekDay={(day) => {
            if (day.sourceBlocked) {
              setOverlapModalVisible(true);
              return;
            }
            if (day.canToggle) toggleApplyDay(day.date);
          }}
          submitLabel={
            isEditMode
              ? (t.ouvrierDashboard?.saveEditCta ?? 'Enregistrer les modifications')
              : (t.ouvrierDashboard?.validateDay ?? 'Valider la journée')
          }
          submitting={submitting}
          canSubmit={canSubmit}
          onSubmit={() => void handleSubmit()}
        />
        {modals}
      </>
    );
  }

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
          <Text style={styles.headerTitle}>{pageTitle}</Text>
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
            {selectedWorksite && isPendingDiversChantier(selectedWorksite.source, selectedWorksite.divers_statut) ? (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>{t.chantierDivers.pendingBadge}</Text>
              </View>
            ) : null}
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
                const endValue = currentLine.heure_fin && isEndAfterStart(currentLine.heure_debut, currentLine.heure_fin)
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
                <Text
                  style={[
                    styles.timeCardTime,
                    !currentLine?.heure_fin && styles.timeCardTimePlaceholder,
                  ]}
                >
                  {currentLine?.heure_fin
                    || (t.timesheet.selectTime ?? t.timesheet.select ?? '—')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {reasonRequired ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>
              {t.ouvrierDashboard?.reasonLabel ?? 'RAISON'}
            </Text>
            <TextInput
              style={styles.reasonInput}
              value={currentLine?.commentaire ?? ''}
              onChangeText={(value) => updateLine({ commentaire: value })}
              placeholder={
                t.ouvrierDashboard?.reasonPlaceholder
                  ?? 'Explique pourquoi le créneau sort du cadre horaire…'
              }
              placeholderTextColor={Colors.text.disabled}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        ) : null}

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
                <UtensilsCrossed
                  size={22}
                  color={currentLine?.panier_repas ? Colors.primary : Colors.text.secondary}
                />
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
                <Car
                  size={22}
                  color={currentLine?.deplacement ? Colors.primary : Colors.text.secondary}
                />
              </View>
              <Text style={[styles.optionLabel, currentLine?.deplacement && styles.optionLabelActive]}>
                {t.timesheet.displacement}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isEditMode ? (
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
                const sourceBlocked = isSourceDay && hasOverlap;
                const isChecked = (!sourceBlocked && isSourceDay) || applySelectedDays.has(targetDate);
                const canToggle = Boolean(currentLine?.chantier_id) && isWorkDay && !isSourceDay && !hasOverlap;
                const { letter, shortLabel } = formatWeekDayCellLabel(targetDate, dateLocale);

                return (
                  <TouchableOpacity
                    key={targetDate}
                    style={[
                      styles.weekDayCell,
                      hasOverlap && styles.weekDayCellDisabled,
                    ]}
                    onPress={() => {
                      if (sourceBlocked) {
                        setOverlapModalVisible(true);
                        return;
                      }
                      if (canToggle) toggleApplyDay(targetDate);
                    }}
                    activeOpacity={canToggle || sourceBlocked ? 0.7 : 1}
                    disabled={!canToggle && !sourceBlocked}
                  >
                    <View style={styles.weekDayBadgeWrap}>
                      {isSourceDay && !sourceBlocked ? (
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
                            sourceBlocked && styles.weekDayBadgeBlocked,
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
        ) : null}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (submitting || !canSubmit) && styles.submitBtnDisabled,
          ]}
          onPress={() => void handleSubmit()}
          disabled={submitting || !canSubmit}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isEditMode
                ? (t.ouvrierDashboard?.saveEditCta ?? 'Enregistrer les modifications')
                : (t.ouvrierDashboard?.validateDay ?? 'Valider la journée')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {modals}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F2',
  },
  containerDesktop: {
    backgroundColor: 'transparent',
  },
  desktopHeaderPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  contentDesktop: {
    paddingTop: 8,
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
  pendingBadge: {
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
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
  timeCardTimePlaceholder: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0,
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
  reasonInput: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE8DC',
    backgroundColor: '#FFF7F2',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text.primary,
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
  weekDayBadgeBlocked: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#F87171',
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
    zIndex: 20,
    elevation: 20,
    gap: 10,
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
    backgroundColor: '#D1D5DB',
    opacity: 1,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
