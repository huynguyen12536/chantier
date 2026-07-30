import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, ImageBackground, InteractionManager, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CheckCircle2, Clock, AlertCircle, HelpCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, Check, Clock3, X } from 'lucide-react-native';
import { PrefillWeekButton, CollaboratorNotificationBell } from '@/components/common';
import { OuvrierDashboardDesktop } from '@/components/layoutDesktop';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsDesktopLayout } from '@/hooks/useIsDesktopLayout';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { Colors } from '@/constants/colors';
import { formatDateKey, formatWeekDayLabel, getMonday, parseDateKey } from '@/utils/date';
import { formatTime } from '@/utils/time';
import { supabase } from '@/services/supabase';
import { WeekSuggestionModal } from '@/components/ouvrier/WeekSuggestionModal';
import {
  isBlockedByPendingDiversChantier,
  type ChantierDiversStatut,
  type ChantierSource,
} from '@/utils/chantierDivers';
import {
  fetchPreviousWeekHint,
  navigateOuvrierWeekDay,
  navigateToDaySuggestion,
  navigateToPrefillCurrentWeek,
  replicatePreviousValidatedWeek,
  type PreviousWeekHint,
} from '@/utils/ouvrierDeclaration';
import { canReceiveApprovalNotifications } from '@/utils/role';

const headerBackground = require('../../assets/images/bg (2).png');

const CHART_BAR_WIDTH = 10;
const CHART_BAR_OVERLAP = CHART_BAR_WIDTH / 2;
const CHART_EMPTY = '#FFE5D8';
const CHART_VALID = '#22C55E';
const CHART_PENDING = '#F97316';
const CHART_PENDING_CHANTIER = '#9CA3AF';
const CHART_MAX_BAR_HEIGHT = 44;
/** Fallback when realtime miss (admin validate from another session). */
const DASHBOARD_POLL_MS = 5_000;
const DASHBOARD_REALTIME_DEBOUNCE_MS = 350;

interface PeriodLine {
  id: string;
  chantierNom: string;
  heure_debut: string;
  heure_fin: string;
  statut: string;
}

interface DaySummary {
  date: string;
  dayLabel: string;
  totalHours: number;
  validatedHours: number;
  pendingHours: number;
  pendingChantierHours: number;
  hasChantierBlocked: boolean;
  hasDeclared: boolean;
  allValidated: boolean;
  hasRejected: boolean;
  lineCount: number;
  lines: PeriodLine[];
}

function formatCount(count: number, one: string, many: string): string {
  return (count === 1 ? one : many).replace('{{count}}', String(count));
}

export default function OuvrierDashboardScreen() {
  const { profile } = useAuth();
  const { t, dateLocale } = useLanguage();
  const router = useRouter();
  const params = useLocalSearchParams<{ focusDate?: string }>();
  const isDesktopLayout = useIsDesktopLayout();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();
  const skipWeekReloadRef = useRef(false);
  const weekEffectReadyRef = useRef(false);
  /** 'empty' = dismissed when no source week existed; reopen if validated shifts appear later. */
  const dismissedWeekKeysRef = useRef<Map<string, 'empty' | 'all'>>(new Map());
  const weekSuggestionRequestRef = useRef(0);
  const hasLoadedWeekOnceRef = useRef(false);
  const loadWeekDataRef = useRef<(weekBase?: Date) => Promise<void>>(async () => undefined);

  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const weekKey = useMemo(() => formatDateKey(weekStart), [weekStart]);
  const [daySummaries, setDaySummaries] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekSuggestionVisible, setWeekSuggestionVisible] = useState(false);
  const [weekSuggestionMode, setWeekSuggestionMode] = useState<'suggestion' | 'empty'>('empty');
  const [previousWeekHint, setPreviousWeekHint] = useState<PreviousWeekHint | null>(null);

  const getDateString = useCallback(
    (dayOffset: number) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + dayOffset);
      return formatDateKey(d);
    },
    [weekStart]
  );

  const weekLabel = useMemo(() => {
    const start = new Date(weekStart);
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${start.toLocaleDateString(dateLocale, opts)} - ${end.toLocaleDateString(dateLocale, opts)}`;
  }, [weekStart, dateLocale]);

  const totalWeekHours = useMemo(
    () => daySummaries.reduce((sum, d) => sum + d.totalHours, 0),
    [daySummaries]
  );

  const chartHourScale = useMemo(() => {
    const weekMax = daySummaries.reduce(
      (max, day) => Math.max(max, day.validatedHours, day.pendingHours, day.pendingChantierHours),
      0,
    );
    return weekMax > 0 ? CHART_MAX_BAR_HEIGHT / weekMax : 0;
  }, [daySummaries]);

  const chartBarHeight = useCallback(
    (hours: number) =>
      hours > 0 && chartHourScale > 0 ? Math.max(hours * chartHourScale, 6) : 4,
    [chartHourScale],
  );

  const resolveStatut = (
    periodStatut: string,
    chantierId: string,
    date: string,
    declByKey: Map<string, string>,
  ): string => {
    const key = `${chantierId}__${date}`;
    const decl = declByKey.get(key);

    if (decl === 'annulee') return 'annulee';
    if (periodStatut === 'validee' || decl === 'validee') return 'validee';
    if (periodStatut === 'rejetee' || decl === 'rejetee') return 'rejetee';
    if (periodStatut === 'terminee') return 'attente';
    return 'draft';
  };

  const getWeekDateStrings = useCallback((base: Date) => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      dates.push(formatDateKey(d));
    }
    return { startDate: dates[0], endDate: dates[6], dates };
  }, []);

  const loadWeekData = useCallback(async (weekBase?: Date) => {
    if (!profile?.id) return;

    const base = weekBase ? new Date(weekBase) : new Date(weekStart);
    const { startDate, endDate, dates } = getWeekDateStrings(base);

    const loadedWeekKey = formatDateKey(base);

    try {
      if (!hasLoadedWeekOnceRef.current) {
        setLoading(true);
      }

      const [periodsRes, declRes] = await Promise.all([
        supabase
          .from('periodes_travail')
          .select('id, date, heure_debut, heure_fin, statut, chantier_id, chantiers(nom, source, divers_statut)')
          .eq('user_id', profile.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true })
          .order('heure_debut', { ascending: true }),
        supabase
          .from('declarations_heures')
          .select('chantier_id, date, statut')
          .eq('user_id', profile.id)
          .gte('date', startDate)
          .lte('date', endDate),
      ]);

      if (periodsRes.error) throw periodsRes.error;
      if (declRes.error) throw declRes.error;

      const declByKey = new Map<string, string>();
      for (const row of declRes.data || []) {
        declByKey.set(`${row.chantier_id}__${row.date}`, row.statut as string);
      }

      const summaries: DaySummary[] = [];

      for (let i = 0; i < 7; i++) {
        const dateStr = dates[i];
        const dayPeriods = (periodsRes.data || []).filter((p: any) => p.date === dateStr);

        let totalHours = 0;
        let validatedHours = 0;
        let pendingHours = 0;
        let pendingChantierHours = 0;
        const lines: PeriodLine[] = [];

        for (const period of dayPeriods) {
          const chantierMeta = period.chantiers as {
            nom?: string;
            source?: ChantierSource | null;
            divers_statut?: ChantierDiversStatut | null;
          } | null;
          const blockedByChantier = isBlockedByPendingDiversChantier(
            chantierMeta?.source,
            chantierMeta?.divers_statut,
          );

          let resolvedStatut = resolveStatut(
            period.statut as string,
            period.chantier_id as string,
            period.date as string,
            declByKey,
          );
          if (blockedByChantier && (resolvedStatut === 'attente' || resolvedStatut === 'draft')) {
            resolvedStatut = 'chantier_pending';
          }

          if (period.heure_debut && period.heure_fin) {
            const [sh, sm] = (period.heure_debut as string).split(':').map(Number);
            const [eh, em] = (period.heure_fin as string).split(':').map(Number);
            const durationHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
            if (resolvedStatut === 'validee') {
              totalHours += durationHours;
              validatedHours += durationHours;
            } else if (resolvedStatut === 'chantier_pending') {
              pendingChantierHours += durationHours;
            } else if (resolvedStatut === 'attente' || resolvedStatut === 'draft') {
              pendingHours += durationHours;
            }
          }

          lines.push({
            id: period.id as string,
            chantierNom: chantierMeta?.nom || '',
            heure_debut: period.heure_debut ? formatTime(period.heure_debut as string) : '',
            heure_fin: period.heure_fin ? formatTime(period.heure_fin as string) : '',
            statut: resolvedStatut,
          });
        }

        const hasChantierBlocked = lines.some((l) => l.statut === 'chantier_pending');

        const hasDeclared = dayPeriods.length > 0 && dayPeriods.every(
          (p: any) => p.heure_debut && p.heure_fin
        );
        const allValidated = lines.length > 0 && lines.every((l) => l.statut === 'validee');
        const hasRejected = lines.some((l) => l.statut === 'rejetee' || l.statut === 'annulee');

        summaries.push({
          date: dateStr,
          dayLabel: formatWeekDayLabel(dateStr, dateLocale),
          totalHours: Math.round(totalHours * 100) / 100,
          validatedHours: Math.round(validatedHours * 100) / 100,
          pendingHours: Math.round(pendingHours * 100) / 100,
          pendingChantierHours: Math.round(pendingChantierHours * 100) / 100,
          hasChantierBlocked,
          hasDeclared,
          allValidated,
          hasRejected,
          lineCount: dayPeriods.length,
          lines,
        });
      }

      setDaySummaries(summaries);

      const weekTotal = summaries.reduce((sum, d) => sum + d.totalHours, 0);

      const weekEmpty = summaries.length > 0
        && summaries.every((d) => d.lineCount === 0)
        && weekTotal === 0;

      if (weekEmpty && profile?.id) {
        const requestId = weekSuggestionRequestRef.current + 1;
        weekSuggestionRequestRef.current = requestId;

        InteractionManager.runAfterInteractions(() => {
          void (async () => {
            const hint = await fetchPreviousWeekHint(profile.id, loadedWeekKey);
            if (weekSuggestionRequestRef.current !== requestId) return;

            const dismissedMode = dismissedWeekKeysRef.current.get(loadedWeekKey);
            if (hint.hasPreviousWeekData && dismissedMode === 'empty') {
              dismissedWeekKeysRef.current.delete(loadedWeekKey);
            }
            if (dismissedWeekKeysRef.current.has(loadedWeekKey)) return;

            setPreviousWeekHint(hint);
            setWeekSuggestionMode(hint.hasPreviousWeekData ? 'suggestion' : 'empty');
            setWeekSuggestionVisible(true);
          })();
        });
      } else {
        setWeekSuggestionVisible(false);
      }
    } catch (error) {
      console.error('Error loading week data:', error);
    } finally {
      setLoading(false);
      hasLoadedWeekOnceRef.current = true;
    }
  }, [profile?.id, weekStart, getWeekDateStrings, dateLocale]);

  loadWeekDataRef.current = loadWeekData;

  useFocusEffect(
    useCallback(() => {
      const raw = params.focusDate;
      const focusDate = Array.isArray(raw) ? raw[0] : raw;
      if (focusDate) {
        const monday = getMonday(parseDateKey(focusDate));
        skipWeekReloadRef.current = true;
        setWeekStart(monday);
        void loadWeekData(monday);
        router.setParams({ focusDate: '' });
      } else {
        void loadWeekData();
      }
    }, [params.focusDate, loadWeekData, router])
  );

  // Realtime + poll while the tab stays mounted (Expo tabs often keep the screen alive).
  useEffect(() => {
    if (!profile?.id) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const channelName = `ouvrier-dashboard-${profile.id}`;

    const reload = () => {
      void loadWeekDataRef.current();
    };

    const scheduleReloadFromRealtime = (payload: {
      eventType?: string;
      table?: string;
      new?: { user_id?: string; statut?: string } | null;
      old?: { user_id?: string; statut?: string } | null;
    }) => {
      const nextUserId = payload?.new?.user_id ?? payload?.old?.user_id;
      if (nextUserId && nextUserId !== profile.id) return;

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        reload();
      }, DASHBOARD_REALTIME_DEBOUNCE_MS);
    };

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'periodes_travail' },
        scheduleReloadFromRealtime,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'declarations_heures' },
        scheduleReloadFromRealtime,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chantiers' },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            reload();
          }, DASHBOARD_REALTIME_DEBOUNCE_MS);
        },
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || err) {
          console.warn('[ouvrier-dashboard] realtime channel issue', status, err?.message ?? err);
        }
      });

    const pollTimer = setInterval(reload, DASHBOARD_POLL_MS);

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') reload();
    };
    const appSub = AppState.addEventListener('change', onAppState);

    let removeVisibility: (() => void) | undefined;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const onVisibility = () => {
        if (document.visibilityState === 'visible') reload();
      };
      document.addEventListener('visibilitychange', onVisibility);
      removeVisibility = () => document.removeEventListener('visibilitychange', onVisibility);
    }

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(pollTimer);
      appSub.remove();
      removeVisibility?.();
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  useEffect(() => {
    weekSuggestionRequestRef.current += 1;
    setWeekSuggestionVisible(false);
  }, [weekKey]);

  useEffect(() => {
    if (!weekEffectReadyRef.current) {
      weekEffectReadyRef.current = true;
      return;
    }
    if (skipWeekReloadRef.current) {
      skipWeekReloadRef.current = false;
      return;
    }
    void loadWeekData();
  }, [weekStart, loadWeekData]);

  const goToPreviousWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  };

  const goToCurrentWeek = () => {
    setWeekStart(getMonday(new Date()));
  };

  const isCurrentWeek = useMemo(() => {
    const current = getMonday(new Date());
    return weekStart.toDateString() === current.toDateString();
  }, [weekStart]);

  const todaySummary = useMemo(() => {
    const todayKey = formatDateKey(new Date());
    return daySummaries.find((d) => d.date === todayKey) ?? null;
  }, [daySummaries]);

  const todayDateLabel = useMemo(
    () => formatWeekDayLabel(formatDateKey(new Date()), dateLocale),
    [dateLocale],
  );

  const weekHasNoHours = !loading && daySummaries.length > 0 && totalWeekHours === 0
    && daySummaries.every((d) => d.lineCount === 0);

  const weekSuggestionCopy = useMemo(() => {
    const ws = t.ouvrierDashboard?.weekSuggestion;
    if (!previousWeekHint) {
      return {
        title: ws?.titleEmpty ?? 'Nouvelle semaine',
        message: ws?.messageEmpty ?? 'Cette semaine n\'a pas encore d\'heures déclarées. Souhaitez-vous commencer une déclaration ?',
      };
    }
    if (weekSuggestionMode === 'suggestion') {
      const template = ws?.messageWithPrevious
        ?? 'Reproduire votre planning de la semaine {{week}} ({{count}} jours ouvrés) ?';
      return {
        title: ws?.title ?? 'Suggestion de planning',
        message: template
          .replace('{{week}}', previousWeekHint.prevWeekLabel)
          .replace('{{count}}', String(previousWeekHint.workDayCount)),
      };
    }
    return {
      title: ws?.titleEmpty ?? 'Nouvelle semaine',
      message: ws?.messageEmpty ?? 'Cette semaine n\'a pas encore d\'heures déclarées. Souhaitez-vous commencer une déclaration ?',
    };
  }, [t, previousWeekHint, weekSuggestionMode]);

  const dismissWeekSuggestion = () => {
    // Remember dismiss so poll/realtime/in-flight hint fetch cannot reopen this week.
    dismissedWeekKeysRef.current.set(
      weekKey,
      weekSuggestionMode === 'suggestion' ? 'all' : 'empty',
    );
    weekSuggestionRequestRef.current += 1;
    setWeekSuggestionVisible(false);
  };

  const handleWeekSuggestionValidate = () => {
    if (!profile?.id) return;
    dismissedWeekKeysRef.current.set(weekKey, 'all');
    setWeekSuggestionVisible(false);

    if (weekSuggestionMode === 'suggestion' && (previousWeekHint?.dayPlans.length ?? 0) > 0) {
      void (async () => {
        try {
          const result = await replicatePreviousValidatedWeek(profile.id, weekKey);
          if (result.overlap) {
            Alert.alert(
              t.common.error,
              t.timesheet.duplicateSlotMessage,
            );
            return;
          }
          if (result.ok) {
            void loadWeekData();
            router.navigate({
              pathname: '/(tabs)/ouvrier-dashboard',
              params: { focusDate: weekKey },
            });
            return;
          }
          void navigateToPrefillCurrentWeek(router, profile.id, weekKey);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : t.timesheet.errorValidate;
          Alert.alert(t.common.error, message);
        }
      })();
      return;
    }

    const today = formatDateKey(new Date());
    const weekDates = Array.from({ length: 7 }, (_, i) => getDateString(i));
    if (weekDates.includes(today)) {
      void navigateToDaySuggestion(
        router,
        profile.id,
        today,
        formatWeekDayLabel(today, dateLocale),
        { title: t.common.error, message: t.absences.errors.dayAlreadyAbsent },
      );
      return;
    }

    router.push({
      pathname: '/choose-day',
      params: { initialDate: weekKey },
    });
  };

  const handleDayPress = (day: DaySummary) => {
    if (!profile?.id) return;
    void navigateOuvrierWeekDay(
      router,
      profile.id,
      day.date,
      day.dayLabel,
      day.lines,
      { title: t.common.error, message: t.absences.errors.dayAlreadyAbsent },
    );
  };

  const handlePrefillCurrentWeek = () => {
    if (!profile?.id) return;
    void navigateToPrefillCurrentWeek(router, profile.id, formatDateKey(weekStart));
  };

  if (!profile || profile.role !== 'ouvrier') return null;

  const declaredDaysCount = daySummaries.filter((d) => d.hasDeclared || d.lineCount > 0).length;
  const desktopSubtitle = formatCount(
    declaredDaysCount,
    t.ouvrierDashboard?.dayCount ?? '{{count}} declared day',
    t.ouvrierDashboard?.dayCountPlural ?? '{{count}} declared days',
  );

  const weekSuggestionModal = (
    <WeekSuggestionModal
      visible={weekSuggestionVisible}
      mode={weekSuggestionMode}
      hint={previousWeekHint}
      title={weekSuggestionCopy.title}
      message={weekSuggestionCopy.message}
      validateLabel={t.common.validate}
      cancelLabel={t.common.cancel}
      onValidate={handleWeekSuggestionValidate}
      onCancel={dismissWeekSuggestion}
    />
  );

  if (isDesktopLayout) {
    return (
      <>
        <OuvrierDashboardDesktop
          title={t.tabs.dashboard}
          subtitle={desktopSubtitle}
          showNotificationBell={canReceiveApprovalNotifications(profile.role)}
          weekLabel={weekLabel}
          isCurrentWeek={isCurrentWeek}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          onCurrentWeek={goToCurrentWeek}
          loading={loading}
          weekHasNoHours={weekHasNoHours}
          totalWeekHours={totalWeekHours}
          days={daySummaries.map((day) => ({
            date: day.date,
            dayLabel: day.dayLabel,
            totalHours: day.totalHours,
            validatedHours: day.validatedHours,
            pendingHours: day.pendingHours,
            pendingChantierHours: day.pendingChantierHours,
            hasChantierBlocked: day.hasChantierBlocked,
            lineCount: day.lineCount,
            lines: day.lines.map((line) => ({ statut: line.statut })),
            onPress: () => handleDayPress(day),
          }))}
          labels={{
            totalWeek: t.ouvrierDashboard?.totalWeek ?? 'Week total',
            weekDays: t.ouvrierDashboard?.weekDays ?? 'Days of the week',
            prefillCurrentWeek: t.ouvrierDashboard?.prefillCurrentWeek ?? 'Fill my week',
            prefillCurrentWeekA11y:
              t.ouvrierDashboard?.prefillCurrentWeekA11y ?? 'Pre-fill the current week',
            legendTitle: t.ouvrierDashboard?.legendTitle ?? 'Legend',
            legendValidated: t.ouvrierDashboard?.legendValidated ?? 'Validated',
            legendPending: t.ouvrierDashboard?.legendPending ?? 'Pending',
            legendChantierPending:
              t.ouvrierDashboard?.legendChantierPending ?? 'Worksite pending',
            toDeclare: t.ouvrierDashboard?.toDeclare ?? 'TO DECLARE',
            notDeclared: t.ouvrierDashboard?.notDeclared ?? 'Not declared',
            declareToday: t.ouvrierDashboard?.declareToday ?? "Declare today",
            todayLabel: t.ouvrierDashboard?.todayLabel ?? t.home.today,
          }}
          onPrefillWeek={handlePrefillCurrentWeek}
          onDeclareEmptyWeek={() => {
            router.push({
              pathname: '/choose-day',
              params: { initialDate: formatDateKey(weekStart) },
            });
          }}
        />
        {weekSuggestionModal}
      </>
    );
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={headerBackground}
        resizeMode="cover"
        style={styles.header}
        imageStyle={styles.headerImage}
        blurRadius={10}
      >
        <LinearGradient
          colors={['rgba(255,138,80,0.78)', 'rgba(255,107,53,0.84)', 'rgba(229,90,43,0.88)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        />
        <View style={[styles.headerContent, { paddingTop: headerPaddingTop }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.greeting}>
                {t.home.greeting} {profile.prenom}
              </Text>
              <Text style={styles.role}>{t.roles.ouvrier}</Text>
            </View>
            <CollaboratorNotificationBell variant="light" />
          </View>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
      >
        {/* Week Navigator */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={goToPreviousWeek} style={styles.weekNavBtn}>
            <ChevronLeft size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToCurrentWeek} style={styles.weekLabelWrap}>
            <Text style={[styles.weekLabel, !isCurrentWeek && styles.weekLabelOther]}>
              {weekLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextWeek} style={styles.weekNavBtn}>
            <ChevronRight size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {!loading && daySummaries.length > 0 && (
          weekHasNoHours ? (
            <TouchableOpacity
              style={styles.todayCard}
              activeOpacity={0.85}
              onPress={() => {
                router.push({
                  pathname: '/choose-day',
                  params: { initialDate: formatDateKey(weekStart) },
                });
              }}
            >
              <LinearGradient
                colors={['#FF8A50', '#FF6B35', '#E55A2B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.todayCardGradient}
              >
                <Text style={styles.todayToDeclareLabel}>
                  {t.ouvrierDashboard?.toDeclare ?? 'À DÉCLARER'}
                </Text>
                <Text style={styles.todayHoursValue}>0h00</Text>
                <Text style={styles.todayNotDeclaredText}>
                  {t.ouvrierDashboard?.notDeclared ?? 'Non déclarée'}
                </Text>
                <View style={styles.todayDeclareBtn}>
                  <Text style={styles.todayDeclareBtnText}>
                    {t.ouvrierDashboard?.declareToday ?? 'Déclarer aujourd\'hui'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.summaryIconWrap}>
                  <Clock size={18} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.summaryLabel}>
                    {t.ouvrierDashboard?.totalWeek ?? 'Total semaine'}
                  </Text>
                  <Text style={styles.summaryValue}>
                    {totalWeekHours.toFixed(1)}h
                  </Text>
                </View>
              </View>

              <View style={styles.chartContainer}>
                <View style={styles.chartRow}>
                  {daySummaries.map((day, idx) => {
                    const todayKey = formatDateKey(new Date());
                    const isToday = day.date === todayKey;

                    return (
                      <View key={day.date} style={styles.chartCol}>
                        <View style={styles.chartBarGroup}>
                          <View
                            style={[
                              styles.chartBar,
                              styles.chartBarFirst,
                              {
                                height: chartBarHeight(day.validatedHours),
                                backgroundColor: day.validatedHours > 0 ? CHART_VALID : CHART_EMPTY,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.chartBar,
                              styles.chartBarSecond,
                              {
                                height: chartBarHeight(day.pendingHours),
                                backgroundColor: day.pendingHours > 0 ? CHART_PENDING : CHART_EMPTY,
                              },
                            ]}
                          />
                          <View
                            style={[
                              styles.chartBar,
                              styles.chartBarThird,
                              {
                                height: chartBarHeight(day.pendingChantierHours),
                                backgroundColor: day.pendingChantierHours > 0 ? CHART_PENDING_CHANTIER : CHART_EMPTY,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.chartLabel, isToday && styles.chartLabelToday]}>
                          {['L', 'M', 'M', 'J', 'V', 'S', 'D'][idx]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View style={styles.chartLegend}>
                <Text style={styles.chartLegendTitle}>
                  {t.ouvrierDashboard?.legendTitle ?? 'Légende'}
                </Text>
                <View style={styles.chartLegendRow}>
                  <View style={styles.chartLegendItem}>
                    <View style={[styles.chartLegendDot, { backgroundColor: CHART_VALID }]} />
                    <Text style={styles.chartLegendText}>{t.ouvrierDashboard?.legendValidated ?? 'Validée'}</Text>
                  </View>
                  <View style={styles.chartLegendItem}>
                    <View style={[styles.chartLegendDot, { backgroundColor: CHART_PENDING }]} />
                    <Text style={styles.chartLegendText}>{t.ouvrierDashboard?.legendPending ?? 'En attente'}</Text>
                  </View>
                  <View style={styles.chartLegendItem}>
                    <View style={[styles.chartLegendDot, { backgroundColor: CHART_PENDING_CHANTIER }]} />
                    <Text style={styles.chartLegendText}>{t.ouvrierDashboard?.legendChantierPending ?? 'Chantier en attente'}</Text>
                  </View>
                </View>
              </View>
            </View>
          )
        )}

        {/* Day List */}
        {!loading && daySummaries.length > 0 && (
        <View style={styles.dayListCard}>
          <View style={styles.dayListHeader}>
            <Text style={styles.dayListTitle}>
              {t.ouvrierDashboard?.weekDays ?? 'Jours de la semaine'}
            </Text>
            <PrefillWeekButton
              onPress={handlePrefillCurrentWeek}
              label={t.ouvrierDashboard?.prefillCurrentWeek ?? 'Remplir ma semaine'}
              accessibilityLabel={t.ouvrierDashboard?.prefillCurrentWeekA11y ?? 'Pre-fill current week'}
            />
          </View>
          {daySummaries.map((day) => {
            let statusColor: string;
            let statusBg: string;
            let StatusIcon: React.ReactNode;

            const hasValidee = day.lines.some((l) => l.statut === 'validee');
            const hasAttente = day.lines.some(
              (l) => l.statut === 'attente' || l.statut === 'draft' || l.statut === 'chantier_pending',
            );
            const hasRejetee = day.lines.some((l) => l.statut === 'rejetee' || l.statut === 'annulee');
            const statusCount = [hasValidee, hasAttente, hasRejetee].filter(Boolean).length;

            if (day.lineCount === 0) {
              statusColor = '#D1D5DB';
              statusBg = 'transparent';
              StatusIcon = null;
            } else if (statusCount >= 2) {
              statusColor = '#FBBF24';
              statusBg = '#FBBF24';
              StatusIcon = <Text style={styles.statusMark}>!</Text>;
            } else if (hasValidee) {
              statusColor = '#22C55E';
              statusBg = '#22C55E';
              StatusIcon = <Check size={12} color="#FFF" strokeWidth={3} />;
            } else if (hasRejetee) {
              statusColor = '#EF4444';
              statusBg = '#EF4444';
              StatusIcon = <X size={12} color="#FFF" strokeWidth={3} />;
            } else {
              statusColor = '#F97316';
              statusBg = '#F97316';
              StatusIcon = <HelpCircle size={12} color="#FFF" strokeWidth={2.5} />;
            }

            const hasColoredDot = day.lineCount > 0;

            return (
              <TouchableOpacity
                key={day.date}
                style={[
                  styles.dayRow,
                  hasColoredDot && styles.dayRowHighlighted,
                  day.hasChantierBlocked && styles.dayRowBlocked,
                ]}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.7}
              >
                <View style={[styles.dayStatusDot, { backgroundColor: statusColor }]} />
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{day.dayLabel}</Text>
                </View>
                <View style={styles.dayHoursWrap}>
                  {day.totalHours > 0 ? (
                    <Text style={styles.dayHours}>{day.totalHours.toFixed(1)}h</Text>
                  ) : (
                    <Text style={styles.dayHoursEmpty}>—</Text>
                  )}
                </View>
                {StatusIcon && (
                  <View style={[styles.dayCheckbox, { backgroundColor: statusBg }]}>
                    {StatusIcon}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
        )}

      </ScrollView>

      {weekSuggestionModal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F2',
  },
  header: {
    overflow: 'hidden',
  },
  headerImage: {
    opacity: 0.95,
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    paddingBottom: 18,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  greeting: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  role: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 14,
    paddingBottom: 32,
    gap: 14,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  weekLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weekLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  weekLabelOther: {
    color: Colors.primary,
  },
  todayCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    backgroundColor: '#FF6B35',
  },
  todayCardGradient: {
    paddingTop: 22,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 2,
  },
  todayToDeclareLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  todayHoursValue: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    marginVertical: 2,
  },
  todayNotDeclaredText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 14,
  },
  todayDeclareBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  todayDeclareBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF6B35',
    letterSpacing: 0.2,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: '#FFE8DC',
    elevation: 3,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  chartContainer: {
    backgroundColor: '#FFF7F2',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#FFE8DC',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  chartBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: CHART_BAR_WIDTH + 2 * CHART_BAR_OVERLAP,
    justifyContent: 'center',
  },
  chartBar: {
    width: CHART_BAR_WIDTH,
    borderRadius: 5,
    minHeight: 4,
  },
  chartBarFirst: {
    zIndex: 0,
  },
  chartBarSecond: {
    marginLeft: -CHART_BAR_OVERLAP,
    zIndex: 1,
  },
  chartBarThird: {
    marginLeft: -CHART_BAR_OVERLAP,
    zIndex: 2,
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.cardWarm.muted,
  },
  chartLabelToday: {
    color: Colors.primary,
    fontWeight: '800',
  },
  chartLegend: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7F2',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#FFE8DC',
  },
  chartLegendTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLegendText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  dayListCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 18,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  dayListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  dayListTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 0,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  dayRowHighlighted: {
    backgroundColor: '#FFFCF9',
    borderRadius: 10,
    borderBottomColor: 'transparent',
  },
  dayRowBlocked: {
    backgroundColor: '#F3F4F6',
    opacity: 0.85,
  },
  dayStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  dayDate: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  dayHoursWrap: {
    minWidth: 50,
    alignItems: 'flex-end',
  },
  dayHours: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  dayHoursMuted: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9CA3AF',
    opacity: 0.85,
  },
  dayHoursEmpty: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.disabled,
  },
  dayCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusMark: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 13,
    includeFontPadding: false,
    textAlign: 'center',
  },
  expandBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  dayExpanded: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 8,
    padding: 12,
    gap: 8,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  lineTime: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  lineStatutWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lineStatutLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  lineStatut: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineStatutValidee: {
    backgroundColor: '#22C55E',
  },
  lineStatutAttente: {
    backgroundColor: '#F97316',
  },
  lineStatutAnnulee: {
    backgroundColor: '#EF4444',
  },
  noLines: {
    fontSize: 13,
    color: Colors.text.disabled,
    textAlign: 'center',
    paddingVertical: 8,
  },
  addLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: '#FFF7F2',
  },
  addLineBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
