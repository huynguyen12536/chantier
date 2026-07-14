import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator, ImageBackground, AppState, AppStateStatus } from 'react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Redirect, useFocusEffect } from 'expo-router';
import { Clock, Calendar, CalendarRange, Check, Plus, Trash2, ChevronDown, ChevronLeft, ChevronRight, X, Building2, UtensilsCrossed, MapPin, ChartBar as BarChart3, Briefcase, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { DatePickerModal, IncompleteLineBorder, SelectWorksiteModal, TimePickerModal, ConfirmModal } from '@/components/common';
import { Colors } from '@/constants/colors';
import { formatDateKey, formatDisplayDate, getMonday, getTodayString, parseDateKey } from '@/utils/date';
import {
  computeChantierHoursBreakdown,
  formatTime,
  getMinEndTime,
  isEndAfterStart,
  timeRangesOverlap,
  toDbTimeString,
} from '@/utils/time';

interface Worksite {
  id: string;
  nom: string;
  code: string;
  date_debut: string | null;
  date_fin: string | null;
  heure_debut: string | null;
  heure_fin: string | null;
}

interface ZoneGroup {
  zoneId: string | null;
  zoneName: string;
  worksites: Worksite[];
}

interface LineSnapshot {
  chantier_id: string;
  heure_debut: string;
  heure_fin: string;
  panier_repas: boolean;
  deplacement: boolean;
}

type LineStatut = 'draft' | 'attente' | 'validee' | 'rejetee' | 'annulee';

interface WorkLine {
  id: string;
  chantier_id: string;
  heure_debut: string;
  heure_fin: string;
  panier_repas: boolean;
  deplacement: boolean;
  statut: LineStatut;
  applyBatchId?: string | null;
  appliedFromLineId?: string | null;
  lastAppliedSnapshot?: LineSnapshot | null;
}

function declarationLookupKey(chantier_id: string, date: string): string {
  return `${chantier_id}__${date}`;
}

/** Merge periodes_travail + declarations_heures (annulee / soumise live in declarations). */
function resolveWorkLineStatut(
  periodStatut: string,
  chantier_id: string,
  date: string,
  declByKey: Map<string, string>,
): LineStatut {
  const decl = declByKey.get(declarationLookupKey(chantier_id, date));

  if (decl === 'annulee') return 'annulee';
  if (periodStatut === 'validee' || decl === 'validee') return 'validee';
  if (periodStatut === 'rejetee' || decl === 'rejetee') return 'rejetee';
  if (periodStatut === 'terminee') return 'attente';

  return 'draft';
}

interface DayEntry {
  date: string;
  lines: WorkLine[];
}

interface WeeklySummary {
  totalHeures: number;
  heuresNormales: number;
  heuresSupp: number;
  nbPaniers: number;
  nbDeplacements: number;
}

const timesheetHeaderBackground = require('../../assets/images/bg (2).png');

const TIMESHEET_POLL_MS = 35_000;
const TIMESHEET_REALTIME_RELOAD_DEBOUNCE_MS = 400;

export default function TimesheetScreen() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();
  const [worksites, setWorksites] = useState<Worksite[]>([]);
  const [zoneGroups, setZoneGroups] = useState<ZoneGroup[]>([]);
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [weekCalendarVisible, setWeekCalendarVisible] = useState(false);
  const [entries, setEntries] = useState<Record<string, DayEntry>>({});
  const [summary, setSummary] = useState<WeeklySummary>({
    totalHeures: 0,
    heuresNormales: 0,
    heuresSupp: 0,
    nbPaniers: 0,
    nbDeplacements: 0,
  });
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showWorksitePicker, setShowWorksitePicker] = useState<{
    dayIndex: number;
    lineId: string;
  } | null>(null);
  const [submittingLineIds, setSubmittingLineIds] = useState<Record<string, boolean>>({});
  const [applyModal, setApplyModal] = useState<{
    sourceDateStr: string;
    sourceLine: WorkLine;
  } | null>(null);
  const [applySelectedDays, setApplySelectedDays] = useState<Set<string>>(new Set());
  const [timePicker, setTimePicker] = useState<{
    dateStr: string;
    lineId: string;
    field: 'heure_debut' | 'heure_fin';
    value: string;
  } | null>(null);
  const [duplicateSlotModalVisible, setDuplicateSlotModalVisible] = useState(false);

  const loadWeekEntries = useCallback(async () => {
    if (!profile?.id) return;

    try {
      const startDate = getDateString(0);
      const endDate = getDateString(6);

      const [periodsRes, declRes] = await Promise.all([
        supabase
          .from('periodes_travail')
          .select('*')
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
        declByKey.set(declarationLookupKey(row.chantier_id as string, row.date as string), row.statut as string);
      }

      const entriesMap: Record<string, DayEntry> = {};

      periodsRes.data?.forEach((period: any) => {
        if (!entriesMap[period.date]) {
          entriesMap[period.date] = {
            date: period.date,
            lines: [],
          };
        }

        const statut = resolveWorkLineStatut(
          period.statut,
          period.chantier_id,
          period.date,
          declByKey,
        );

        entriesMap[period.date].lines.push({
          id: period.id,
          chantier_id: period.chantier_id,
          heure_debut: formatTime(period.heure_debut),
          heure_fin: formatTime(period.heure_fin),
          panier_repas: period.panier_repas || false,
          deplacement: period.deplacement || false,
          statut,
        });
      });

      setEntries((prev) => {
        const merged: Record<string, DayEntry> = { ...entriesMap };

        // Keep unsaved local draft lines when realtime/poll refreshes data from DB.
        Object.entries(prev).forEach(([date, dayEntry]) => {
          const localDraftLines = dayEntry.lines.filter(
            (line) => line.id.startsWith('new-') && line.statut === 'draft'
          );
          if (localDraftLines.length === 0) return;

          const existing = merged[date]?.lines ?? [];
          merged[date] = {
            date,
            lines: [...existing, ...localDraftLines],
          };
        });

        return merged;
      });
    } catch (error) {
      console.error('Error loading week entries:', error);
    }
  }, [profile?.id, weekStart]);

  useEffect(() => {
    loadWorksites();
    loadWeekEntries();
  }, [weekStart, profile?.id, loadWeekEntries]);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return;

      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let pollTimer: ReturnType<typeof setInterval> | null = null;

      const scheduleReloadFromRealtime = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          void loadWeekEntries();
        }, TIMESHEET_REALTIME_RELOAD_DEBOUNCE_MS);
      };

      void loadWeekEntries();

      const channelName = `timesheet-entries-${profile.id}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'periodes_travail',
            filter: `user_id=eq.${profile.id}`,
          },
          scheduleReloadFromRealtime
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'declarations_heures',
            filter: `user_id=eq.${profile.id}`,
          },
          scheduleReloadFromRealtime
        )
        .subscribe((status, err) => {
          if (__DEV__ && status === 'SUBSCRIBED') {
            console.debug('[timesheet] realtime subscribed', channelName);
          }
          if (status === 'CHANNEL_ERROR' || err) {
            console.warn('[timesheet] realtime channel issue', status, err?.message ?? err);
          }
        });

      pollTimer = setInterval(() => {
        void loadWeekEntries();
      }, TIMESHEET_POLL_MS);

      const onAppState = (next: AppStateStatus) => {
        if (next === 'active') {
          void loadWeekEntries();
        }
      };
      const appSub = AppState.addEventListener('change', onAppState);

      return () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (pollTimer) clearInterval(pollTimer);
        appSub.remove();
        supabase.removeChannel(channel);
      };
    }, [profile?.id, loadWeekEntries])
  );

  useEffect(() => {
    calculateSummary();
  }, [entries]);

  function getDateString(offset: number): string {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + offset);
    return formatDateKey(date);
  }

  const handleSelectWeekDate = (dateStr: string) => {
    setWeekStart(getMonday(parseDateKey(dateStr)));
    setExpandedDay(dateStr);
  };

  const goToToday = () => {
    const today = getTodayString();
    setWeekStart(getMonday(new Date()));
    setExpandedDay(today);
  };

  const today = getTodayString();
  const isOnTodayWeek = formatDateKey(weekStart) === formatDateKey(getMonday(new Date()));
  const showResetToToday = !isOnTodayWeek || (expandedDay !== null && expandedDay !== today);

  const loadWorksites = async () => {
    try {
      if (!profile?.id) {
        setWorksites([]);
        setZoneGroups([]);
        return;
      }
      const { data, error } = await supabase
        .from('chantiers')
        .select('id, nom, code, date_debut, date_fin, heure_debut, heure_fin, actif')
        .eq('actif', true)
        .order('nom', { ascending: true });

      if (error) throw error;

      const allWorksites: Worksite[] = (data || []).map((c) => ({
        id: c.id,
        nom: c.nom,
        code: c.code,
        date_debut: c.date_debut ?? null,
        date_fin: c.date_fin ?? null,
        heure_debut: c.heure_debut ?? null,
        heure_fin: c.heure_fin ?? null,
      }));

      setWorksites(allWorksites);
      setZoneGroups([
        {
          zoneId: null,
          zoneName: t.timesheet.worksite,
          worksites: allWorksites,
        },
      ]);
    } catch (error) {
      console.error('Error loading worksites:', error);
    }
  };

  const getDefaultWorksiteHours = (chantierId: string): { debut: string; fin: string } => {
    const ws = worksites.find((w) => w.id === chantierId);
    return {
      debut: ws?.heure_debut ? formatTime(ws.heure_debut) : '07:30',
      fin: ws?.heure_fin ? formatTime(ws.heure_fin) : '16:30',
    };
  };

  const addWorkLine = (dateStr: string) => {
    const chantierId = worksites[0]?.id || '';
    const defaults = getDefaultWorksiteHours(chantierId);
    const newLine: WorkLine = {
      id: `new-${Date.now()}`,
      chantier_id: chantierId,
      heure_debut: defaults.debut,
      heure_fin: defaults.fin,
      panier_repas: true,
      deplacement: true,
      statut: 'draft',
    };

    setEntries(prev => ({
      ...prev,
      [dateStr]: {
        date: dateStr,
        lines: [...(prev[dateStr]?.lines || []), newLine],
      },
    }));
  };

  const removeWorkLine = async (dateStr: string, lineId: string) => {
    if (!lineId.startsWith('new-')) {
      try {
        await supabase
          .from('periodes_travail')
          .delete()
          .eq('id', lineId)
          .eq('user_id', profile?.id);
      } catch (error) {
        console.error('Error deleting work line:', error);
      }
    }

    setEntries(prev => {
      const dayEntry = prev[dateStr];
      if (!dayEntry) return prev;

      const updatedLines = dayEntry.lines.filter(line => line.id !== lineId);

      if (updatedLines.length === 0) {
        const { [dateStr]: removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [dateStr]: {
          ...dayEntry,
          lines: updatedLines,
        },
      };
    });
  };

  const updateWorkLine = (dateStr: string, lineId: string, field: keyof WorkLine, value: any) => {
    setEntries(prev => {
      const dayEntry = prev[dateStr];
      if (!dayEntry) return prev;

      return {
        ...prev,
        [dateStr]: {
          ...dayEntry,
          lines: dayEntry.lines.map((line) => {
            if (line.id !== lineId) return line;
            if (field === 'heure_fin') {
              const heure_fin = isEndAfterStart(line.heure_debut, value as string)
                ? (value as string)
                : getMinEndTime(line.heure_debut);
              return { ...line, heure_fin, statut: 'draft' as const };
            }
            return { ...line, [field]: value, statut: 'draft' as const };
          }),
        },
      };
    });
  };

  const timePickerLine = useMemo(() => {
    if (!timePicker) return null;
    return entries[timePicker.dateStr]?.lines.find((line) => line.id === timePicker.lineId) ?? null;
  }, [timePicker, entries]);

  const isWorkLineComplete = (line: WorkLine): boolean =>
    Boolean(line.chantier_id && line.heure_debut && line.heure_fin);

  /** A line cannot overlap another line on the same day, except cancelled lines. */
  const hasTimeOverlapConflict = (a: WorkLine, b: WorkLine): boolean => {
    if (a.statut === 'annulee' || b.statut === 'annulee') return false;
    if (!isWorkLineComplete(a) || !isWorkLineComplete(b)) return false;
    return timeRangesOverlap(a.heure_debut, a.heure_fin, b.heure_debut, b.heure_fin);
  };

  const submitLineForValidation = async (dateStr: string, line: WorkLine) => {
    if (!isWorkLineComplete(line)) {
      Alert.alert(t.common.error, t.timesheet.invalidLine);
      return;
    }

    const dayEntry = entries[dateStr];
    const hasOverlapConflict =
      dayEntry?.lines.some((other) => other.id !== line.id && hasTimeOverlapConflict(line, other)) ?? false;
    if (hasOverlapConflict) {
      setDuplicateSlotModalVisible(true);
      return;
    }

    try {
      setSubmittingLineIds(prev => ({ ...prev, [line.id]: true }));

      const payload = {
        user_id: profile?.id,
        chantier_id: line.chantier_id,
        date: dateStr,
        heure_debut: toDbTimeString(line.heure_debut),
        heure_fin: toDbTimeString(line.heure_fin),
        panier_repas: line.panier_repas,
        deplacement: line.deplacement,
        statut: 'terminee',
        latitude_debut: 0,
        longitude_debut: 0,
        latitude_fin: 0,
        longitude_fin: 0,
      };

      if (line.id.startsWith('new-')) {
        const { data, error } = await supabase
          .from('periodes_travail')
          .insert(payload)
          .select('id')
          .single();

        if (error) throw error;

        if (data?.id) {
          setEntries(prev => {
            const dayEntry = prev[dateStr];
            if (!dayEntry) return prev;

            return {
              ...prev,
              [dateStr]: {
                ...dayEntry,
                lines: dayEntry.lines.map(existingLine =>
                  existingLine.id === line.id ? { ...existingLine, id: data.id, statut: 'attente' } : existingLine
                ),
              },
            };
          });
        }
      } else {
        const { error } = await supabase
          .from('periodes_travail')
          .update(payload)
          .eq('id', line.id)
          .eq('user_id', profile?.id);

        if (error) throw error;

        setEntries(prev => {
          const dayEntry = prev[dateStr];
          if (!dayEntry) return prev;

          return {
            ...prev,
            [dateStr]: {
              ...dayEntry,
              lines: dayEntry.lines.map(existingLine =>
                existingLine.id === line.id ? { ...existingLine, statut: 'attente' } : existingLine
              ),
            },
          };
        });
      }

      Alert.alert(t.common.success, t.timesheet.lineSubmitted);
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || t.timesheet.errorValidate);
    } finally {
      setSubmittingLineIds(prev => {
        const { [line.id]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const changeWeek = (offset: number) => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setWeekStart(getMonday(newDate));
  };

  const calculateDuration = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return (endMinutes - startMinutes) / 60;
  };

  const calculateDayTotal = (dateStr: string): number => {
    const dayEntry = entries[dateStr];
    if (!dayEntry) return 0;

    return dayEntry.lines.reduce((total, line) => {
      if (line.heure_debut && line.heure_fin) {
        return total + calculateDuration(line.heure_debut, line.heure_fin);
      }
      return total;
    }, 0);
  };

  const calculateSummary = () => {
    let totalHeures = 0;
    let heuresNormales = 0;
    let heuresSupp = 0;
    let nbPaniers = 0;
    let nbDeplacements = 0;

    Object.values(entries).forEach(dayEntry => {
      let dayTotal = 0;

      dayEntry.lines.forEach(line => {
        if (line.statut !== 'validee') return;
        if (!line.chantier_id || !line.heure_debut || !line.heure_fin) return;

        const ws = worksites.find((w) => w.id === line.chantier_id);
        const breakdown = computeChantierHoursBreakdown(
          line.heure_debut,
          line.heure_fin,
          ws?.heure_debut,
          ws?.heure_fin,
        );
        dayTotal += breakdown.totalHeures;
        heuresNormales += breakdown.heuresNormales;
        heuresSupp += breakdown.heuresSupplementaires;

        if (line.panier_repas) nbPaniers++;
        if (line.deplacement) nbDeplacements++;
      });

      totalHeures += dayTotal;
    });

    setSummary({
      totalHeures: Math.round(totalHeures * 100) / 100,
      heuresNormales: Math.round(heuresNormales * 100) / 100,
      heuresSupp: Math.round(heuresSupp * 100) / 100,
      nbPaniers,
      nbDeplacements,
    });
  };

  const getWorksiteName = (chantierId: string): string => {
    const worksite = worksites.find(ws => ws.id === chantierId);
    return worksite?.nom || t.timesheet.select;
  };

  const isChantierAvailableOnDate = (chantierId: string, dateStr: string): boolean => {
    const worksite = worksites.find(ws => ws.id === chantierId);
    if (!worksite) return false;
    if (worksite.date_debut && worksite.date_debut > dateStr) return false;
    if (worksite.date_fin && worksite.date_fin < dateStr) return false;
    return true;
  };

  const getLineSnapshot = (line: WorkLine): LineSnapshot => ({
    chantier_id: line.chantier_id,
    heure_debut: line.heure_debut,
    heure_fin: line.heure_fin,
    panier_repas: line.panier_repas,
    deplacement: line.deplacement,
  });

  const snapshotsEqual = (a: LineSnapshot, b: LineSnapshot): boolean =>
    a.chantier_id === b.chantier_id
    && a.heure_debut === b.heure_debut
    && a.heure_fin === b.heure_fin
    && a.panier_repas === b.panier_repas
    && a.deplacement === b.deplacement;

  const isLineLocked = (line: WorkLine): boolean =>
    line.statut === 'attente' || line.statut === 'validee' || line.statut === 'annulee';

  const isLineRejected = (line: WorkLine): boolean => line.statut === 'rejetee';

  const getLineStatusMeta = (line: WorkLine) => {
    if (line.statut === 'validee') {
      return {
        label: t.timesheet.statusApproved,
        style: styles.lineStatusApproved,
        textStyle: styles.lineStatusTextApproved,
      };
    }
    if (line.statut === 'rejetee') {
      return {
        label: t.timesheet.statusRejected,
        style: styles.lineStatusRejected,
        textStyle: styles.lineStatusTextRejected,
      };
    }
    if (line.statut === 'annulee') {
      return {
        label: t.timesheet.statusCancelled,
        style: styles.lineStatusCancelled,
        textStyle: styles.lineStatusTextCancelled,
      };
    }
    if (line.statut === 'attente') {
      return {
        label: t.timesheet.statusSent,
        style: styles.lineStatusSent,
        textStyle: styles.lineStatusTextSent,
      };
    }
    return {
      label: null as string | null,
      style: styles.lineStatusIncomplete,
      textStyle: styles.lineStatusTextIncomplete,
    };
  };

  const hasApplyPendingChanges = (line: WorkLine): boolean => {
    if (line.appliedFromLineId) return false;
    if (!isWorkLineComplete(line)) return false;
    if (!line.lastAppliedSnapshot) return true;
    return !snapshotsEqual(getLineSnapshot(line), line.lastAppliedSnapshot);
  };

  const getAppliedLineOnDate = (batchId: string, dateStr: string): WorkLine | undefined =>
    entries[dateStr]?.lines.find((l) => l.applyBatchId === batchId);

  const openApplyModal = (sourceDateStr: string, line: WorkLine) => {
    if (!isWorkLineComplete(line)) {
      Alert.alert(t.common.error, t.timesheet.invalidLine);
      return;
    }

    const batchId = line.applyBatchId;
    const selected = new Set<string>();

    for (let i = 0; i < 7; i++) {
      const targetDate = getDateString(i);
      if (targetDate === sourceDateStr) continue;
      if (!isChantierAvailableOnDate(line.chantier_id, targetDate)) continue;

      if (batchId) {
        if (getAppliedLineOnDate(batchId, targetDate)) {
          selected.add(targetDate);
        }
      } else {
        selected.add(targetDate);
      }
    }

    setApplySelectedDays(selected);
    setApplyModal({ sourceDateStr, sourceLine: line });
  };

  const toggleApplyDay = (dateStr: string) => {
    setApplySelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  };

  const confirmApplySelection = () => {
    if (!applyModal) return;

    const { sourceDateStr, sourceLine } = applyModal;
    const batchId = sourceLine.applyBatchId ?? `batch-${sourceLine.id}-${Date.now()}`;
    const snapshot = getLineSnapshot(sourceLine);

    setEntries((prev) => {
      const next: Record<string, DayEntry> = { ...prev };

      const sourceEntry = next[sourceDateStr];
      if (sourceEntry) {
        next[sourceDateStr] = {
          ...sourceEntry,
          lines: sourceEntry.lines.map((l) =>
            l.id === sourceLine.id
              ? { ...l, applyBatchId: batchId, lastAppliedSnapshot: snapshot }
              : l
          ),
        };
      }

      const template = sourceLine;

      for (let i = 0; i < 7; i++) {
        const targetDate = getDateString(i);
        if (targetDate === sourceDateStr) continue;

        const shouldHave = applySelectedDays.has(targetDate);
        const existingLines = next[targetDate]?.lines ?? [];
        const appliedLine = existingLines.find((l) => l.applyBatchId === batchId);

        if (!shouldHave) {
          if (!appliedLine || isLineLocked(appliedLine)) continue;
          const remaining = existingLines.filter((l) => l.id !== appliedLine.id);
          if (remaining.length === 0) {
            const { [targetDate]: removed, ...rest } = next;
            Object.assign(next, rest);
          } else {
            next[targetDate] = { date: targetDate, lines: remaining };
          }
          continue;
        }

        if (!isChantierAvailableOnDate(template.chantier_id, targetDate)) continue;
        if (appliedLine) continue;

        const duplicate = existingLines.some(
          (l) => l.applyBatchId !== batchId && hasTimeOverlapConflict(l, template),
        );
        if (duplicate) continue;

        const clonedLine: WorkLine = {
          id: `new-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
          chantier_id: template.chantier_id,
          heure_debut: template.heure_debut,
          heure_fin: template.heure_fin,
          panier_repas: template.panier_repas,
          deplacement: template.deplacement,
          statut: 'draft',
          applyBatchId: batchId,
          appliedFromLineId: sourceLine.id,
        };

        next[targetDate] = {
          date: targetDate,
          lines: [...existingLines, clonedLine],
        };
      }

      return next;
    });

    setApplyModal(null);
    Alert.alert(t.common.success, t.timesheet.lineAppliedToWeek);
  };

  const pickerSelectedChantierId = showWorksitePicker
    ? entries[getDateString(showWorksitePicker.dayIndex)]?.lines.find(
        (line) => line.id === showWorksitePicker.lineId
      )?.chantier_id ?? null
    : null;
  const pickerZoneGroups = useMemo(() => {
    if (!showWorksitePicker) return [];
    return zoneGroups;
  }, [showWorksitePicker, zoneGroups]);

  if (profile?.role === 'ouvrier') {
    return <Redirect href="/(tabs)/ouvrier-dashboard" />;
  }

  return (
    <View style={styles.container}>
      <ImageBackground
        source={timesheetHeaderBackground}
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
            <Text style={styles.title}>{t.timesheet.title}</Text>
            <Text style={styles.subtitle}>Gestion des heures de travail</Text>
          </View>

          <View style={styles.weekSelector}>
            <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.weekButton} activeOpacity={0.8}>
              <ChevronLeft size={20} color={Colors.primary} strokeWidth={2.6} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.weekInfo}
              onPress={() => setWeekCalendarVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.weekCalendarBtn}>
                <Calendar size={20} color={Colors.primary} strokeWidth={2.4} />
              </View>
              <Text style={styles.weekText}>
                {formatDisplayDate(getDateString(0))} - {formatDisplayDate(getDateString(6))}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeWeek(1)} style={styles.weekButton} activeOpacity={0.8}>
              <ChevronRight size={20} color={Colors.primary} strokeWidth={2.6} />
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {t.timesheet.days.map((day, index) => {
          const dateStr = getDateString(index);
          const dayEntry = entries[dateStr];
          const dayTotal = calculateDayTotal(dateStr);
          const isExpanded = expandedDay === dateStr;

          return (
            <View key={dateStr} style={styles.dayCard}>
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={() => setExpandedDay(isExpanded ? null : dateStr)}
                activeOpacity={0.75}
              >
                <View style={styles.dayHeaderLeft}>
                  <View style={styles.dayCalendarIcon}>
                    <Calendar size={15} color={Colors.primary} strokeWidth={2.4} />
                  </View>
                  <Text style={styles.dayNameCombined}>
                    {day} {formatDisplayDate(dateStr)}
                  </Text>
                </View>
                <View style={styles.dayHeaderRight}>
                  {dayEntry && dayEntry.lines.length > 0 && (
                    <View style={styles.dayTotalBlock}>
                      <Text style={styles.dayTotal}>{dayTotal.toFixed(1)}h</Text>
                    </View>
                  )}
                  <View style={[styles.chevronWrap, isExpanded && styles.chevronWrapExpanded]}>
                    <ChevronDown size={18} color={Colors.text.secondary} strokeWidth={2.4} />
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.dayContent}>
                  {dayEntry?.lines.map((line, lineIndex) => {
                    const isLineReady = isWorkLineComplete(line);
                    const isLineSubmitting = Boolean(submittingLineIds[line.id]);
                    const isLineLockedStatus = isLineLocked(line);
                    const isLineRejectedStatus = isLineRejected(line);
                    const lineStatus = getLineStatusMeta(line);

                    return (
                    <IncompleteLineBorder
                      key={line.id}
                      active={line.statut === 'draft' || line.statut === 'rejetee'}
                      rejected={line.statut === 'rejetee'}
                    >
                      <View style={styles.workLineHeader}>
                        <View style={styles.workLineTitleRow}>
                          <Text style={styles.workLineNumber}>{t.timesheet.line} {lineIndex + 1}</Text>
                          {lineStatus.label ? (
                            <View style={[styles.lineStatusBadge, lineStatus.style]}>
                              <Text style={[styles.lineStatusText, lineStatus.textStyle]}>{lineStatus.label}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.workLineActions}>
                          {hasApplyPendingChanges(line) && !isLineLockedStatus && !isLineRejectedStatus && (
                            <TouchableOpacity
                              onPress={() => openApplyModal(dateStr, line)}
                              style={styles.applyLineButton}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              activeOpacity={0.75}
                            >
                              <View style={styles.applyLineIconWrap}>
                                <CalendarRange size={20} color={Colors.primary} strokeWidth={2.4} />
                              </View>
                              <Text
                                style={styles.applyLineButtonText}
                                numberOfLines={2}
                              >
                                {t.timesheet.applyLineOnWeek}
                              </Text>
                            </TouchableOpacity>
                          )}
                          {(!isLineLockedStatus || isLineRejectedStatus) && (
                            <TouchableOpacity
                              onPress={() => removeWorkLine(dateStr, line.id)}
                              style={styles.deleteLineButton}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Trash2 size={15} color={Colors.error} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.chantierField}
                        onPress={() => !isLineLockedStatus && setShowWorksitePicker({ dayIndex: index, lineId: line.id })}
                        activeOpacity={isLineLockedStatus ? 1 : 0.8}
                        disabled={isLineLockedStatus}
                      >
                        <View style={styles.chantierIconWrap}>
                          <Building2 size={17} color={Colors.primary} strokeWidth={2.3} />
                        </View>
                        <Text style={styles.chantierText} numberOfLines={1}>
                          {getWorksiteName(line.chantier_id)}
                        </Text>
                        <ChevronDown size={18} color={Colors.text.disabled} />
                      </TouchableOpacity>

                      <View style={styles.timeRow}>
                        <View style={styles.timeField}>
                          <Text style={styles.label}>{t.timesheet.start}</Text>
                          <View style={styles.timeInput}>
                            <Text style={styles.timeText}>{line.heure_debut || '07:30'}</Text>
                            <TouchableOpacity
                              style={styles.timeIconButton}
                              onPress={() => !isLineLockedStatus && setTimePicker({
                                dateStr,
                                lineId: line.id,
                                field: 'heure_debut',
                                value: line.heure_debut,
                              })}
                              activeOpacity={isLineLockedStatus ? 1 : 0.8}
                              disabled={isLineLockedStatus}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Clock size={16} color={Colors.primary} strokeWidth={2.3} />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <Text style={styles.arrow}>›</Text>

                        <View style={styles.timeField}>
                          <Text style={styles.label}>{t.timesheet.end}</Text>
                          <View style={styles.timeInput}>
                            <Text style={styles.timeText}>{line.heure_fin || '16:30'}</Text>
                            <TouchableOpacity
                              style={styles.timeIconButton}
                              onPress={() => !isLineLockedStatus && setTimePicker({
                                dateStr,
                                lineId: line.id,
                                field: 'heure_fin',
                                value: line.heure_fin,
                              })}
                              activeOpacity={isLineLockedStatus ? 1 : 0.8}
                              disabled={isLineLockedStatus}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Clock size={16} color={Colors.primary} strokeWidth={2.3} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>

                      <View style={styles.toggleRow}>
                        <TouchableOpacity
                          style={styles.toggle}
                          onPress={() => !isLineLockedStatus && updateWorkLine(dateStr, line.id, 'panier_repas', !line.panier_repas)}
                          activeOpacity={isLineLockedStatus ? 1 : 0.8}
                          disabled={isLineLockedStatus}
                        >
                          <View style={[styles.toggleCheckbox, line.panier_repas && styles.toggleCheckboxChecked]}>
                            {line.panier_repas ? (
                              <Check size={11} color="#FFF" strokeWidth={3} />
                            ) : null}
                          </View>
                          <UtensilsCrossed
                            size={14}
                            color={line.panier_repas ? Colors.secondaryDark : Colors.text.secondary}
                            strokeWidth={2.3}
                          />
                          <Text style={[styles.toggleText, line.panier_repas && styles.toggleTextActive]}>
                            {t.timesheet.meal}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.toggle}
                          onPress={() => !isLineLockedStatus && updateWorkLine(dateStr, line.id, 'deplacement', !line.deplacement)}
                          activeOpacity={isLineLockedStatus ? 1 : 0.8}
                          disabled={isLineLockedStatus}
                        >
                          <View style={[styles.toggleCheckbox, line.deplacement && styles.toggleCheckboxChecked]}>
                            {line.deplacement ? (
                              <Check size={11} color="#FFF" strokeWidth={3} />
                            ) : null}
                          </View>
                          <MapPin
                            size={14}
                            color={line.deplacement ? Colors.secondaryDark : Colors.text.secondary}
                            strokeWidth={2.3}
                          />
                          <Text style={[styles.toggleText, line.deplacement && styles.toggleTextActive]}>
                            {t.timesheet.displacement}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {!isLineLockedStatus || isLineRejectedStatus ? (
                        <TouchableOpacity
                          style={[
                            styles.confirmLineButton,
                            isLineRejectedStatus && styles.confirmLineButtonResubmit,
                            (!isLineReady || isLineSubmitting) && !isLineRejectedStatus && styles.confirmLineButtonDisabled,
                          ]}
                          onPress={() => submitLineForValidation(dateStr, line)}
                          disabled={!isLineReady || isLineSubmitting}
                          activeOpacity={0.85}
                        >
                          {isLineSubmitting ? (
                            <ActivityIndicator size="small" color="#FFF" />
                          ) : (
                            <Check size={17} color="#FFF" strokeWidth={2.8} />
                          )}
                          <Text style={styles.confirmLineButtonText}>
                            {isLineSubmitting
                              ? t.timesheet.submittingLine
                              : isLineRejectedStatus
                              ? t.timesheet.resubmitLine
                              : t.timesheet.confirmLine}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </IncompleteLineBorder>
                    );
                  })}

                  <TouchableOpacity
                    style={styles.addLineButton}
                    onPress={() => addWorkLine(dateStr)}
                    activeOpacity={0.8}
                  >
                    <Plus size={17} color="#FFF" strokeWidth={2.6} />
                    <Text style={styles.addLineButtonText}>{t.timesheet.addLine}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeaderIcon}>
              <BarChart3 size={15} color={Colors.primary} strokeWidth={2.4} />
            </View>
            <Text style={styles.summaryTitle}>{t.timesheet.weeklySummary}</Text>
          </View>

          <View style={styles.summaryTotalRow}>
            <View style={[styles.summaryStatIcon, styles.summaryStatIconTotal]}>
              <Clock size={16} color={Colors.primary} strokeWidth={2.3} />
            </View>
            <Text style={styles.summaryStatLabel}>{t.timesheet.total}</Text>
            <Text style={styles.summaryTotalValue}>{summary.totalHeures}h</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryStatCard}>
              <View style={[styles.summaryStatIcon, styles.summaryStatIconNormal]}>
                <Briefcase size={14} color={Colors.secondaryDark} strokeWidth={2.2} />
              </View>
              <View style={styles.summaryStatBody}>
                <Text style={styles.summaryStatLabel}>{t.timesheet.normal}</Text>
                <Text style={[styles.summaryStatValue, styles.summaryStatValueNormal]}>
                  {summary.heuresNormales}h
                </Text>
              </View>
            </View>

            <View style={[styles.summaryStatCard, styles.summaryStatCardHighlight]}>
              <View style={[styles.summaryStatIcon, styles.summaryStatIconSupp]}>
                <TrendingUp size={14} color="#E65100" strokeWidth={2.2} />
              </View>
              <View style={styles.summaryStatBody}>
                <Text style={styles.summaryStatLabel}>{t.timesheet.additional}</Text>
                <Text style={[styles.summaryStatValue, styles.summaryStatValueSupp]}>
                  {summary.heuresSupp}h
                </Text>
              </View>
            </View>

            <View style={styles.summaryStatCard}>
              <View style={[styles.summaryStatIcon, styles.summaryStatIconMeal]}>
                <UtensilsCrossed size={14} color="#1565C0" strokeWidth={2.2} />
              </View>
              <View style={styles.summaryStatBody}>
                <Text style={styles.summaryStatLabel}>{t.timesheet.meals}</Text>
                <Text style={[styles.summaryStatValue, styles.summaryStatValueMeal]}>
                  {summary.nbPaniers}
                </Text>
              </View>
            </View>

            <View style={styles.summaryStatCard}>
              <View style={[styles.summaryStatIcon, styles.summaryStatIconTravel]}>
                <MapPin size={14} color="#6A1B9A" strokeWidth={2.2} />
              </View>
              <View style={styles.summaryStatBody}>
                <Text style={styles.summaryStatLabel}>{t.timesheet.displacements}</Text>
                <Text style={[styles.summaryStatValue, styles.summaryStatValueTravel]}>
                  {summary.nbDeplacements}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={duplicateSlotModalVisible}
        title={t.timesheet.duplicateSlotTitle}
        message={t.timesheet.duplicateSlotMessage}
        cancelLabel={t.common.cancel}
        confirmLabel={t.common.ok}
        onCancel={() => setDuplicateSlotModalVisible(false)}
        onConfirm={() => setDuplicateSlotModalVisible(false)}
        singleButton
        confirmVariant="muted"
      />

      <Modal
        visible={applyModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setApplyModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.applyModalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{t.timesheet.applyLineToWeekTitle}</Text>
                <Text style={styles.modalSubtitle}>{t.timesheet.applyLineSelectDays}</Text>
                {applyModal && (
                  <Text style={styles.applyModalHint}>{t.timesheet.applyLineToWeekMessage}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setApplyModal(null)} style={styles.modalCloseButton}>
                <X size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>

            {applyModal && (
              <ScrollView
                style={styles.applyDayList}
                contentContainerStyle={styles.applyDayListContent}
                showsVerticalScrollIndicator={false}
              >
                {t.timesheet.days.map((day, dayIndex) => {
                  const targetDate = getDateString(dayIndex);
                  const isSourceDay = targetDate === applyModal.sourceDateStr;
                  const batchId = applyModal.sourceLine.applyBatchId;
                  const appliedLine = batchId ? getAppliedLineOnDate(batchId, targetDate) : undefined;
                  const chantierOk = isChantierAvailableOnDate(applyModal.sourceLine.chantier_id, targetDate);
                  const isLocked = appliedLine ? isLineLocked(appliedLine) : false;
                  const isChecked = applySelectedDays.has(targetDate);
                  const canToggle = !isSourceDay && chantierOk && !isLocked;

                  return (
                    <TouchableOpacity
                      key={targetDate}
                      style={[
                        styles.applyDayOption,
                        isChecked && styles.applyDayOptionActive,
                        (!canToggle || isSourceDay) && styles.applyDayOptionDisabled,
                      ]}
                      onPress={() => canToggle && toggleApplyDay(targetDate)}
                      activeOpacity={canToggle ? 0.8 : 1}
                      disabled={!canToggle}
                    >
                      <View style={[styles.applyDayCheckbox, isChecked && styles.applyDayCheckboxActive]}>
                        {isChecked && <Check size={12} color="#FFF" strokeWidth={3} />}
                      </View>
                      <View style={styles.applyDayInfo}>
                        <Text style={[styles.applyDayName, isChecked && styles.applyDayNameActive]}>
                          {day}
                        </Text>
                        <Text style={styles.applyDayDate}>{formatDisplayDate(targetDate)}</Text>
                      </View>
                      {isSourceDay && (
                        <Text style={styles.applyDayMeta}>{t.timesheet.line}</Text>
                      )}
                      {!chantierOk && !isSourceDay && (
                        <Text style={styles.applyDayMeta}>{t.timesheet.applyLineUnavailable}</Text>
                      )}
                      {isLocked && (
                        <Text style={styles.applyDayMeta}>{t.timesheet.applyLineSubmittedLocked}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.applyModalActions}>
              <TouchableOpacity style={styles.applyModalCancel} onPress={() => setApplyModal(null)}>
                <Text style={styles.applyModalCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyModalConfirm} onPress={confirmApplySelection}>
                <Text style={styles.applyModalConfirmText}>{t.timesheet.applyLineSave}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={weekCalendarVisible}
        value={expandedDay ?? getDateString(0)}
        onSelect={handleSelectWeekDate}
        onClose={() => setWeekCalendarVisible(false)}
        showReset={showResetToToday}
        onReset={goToToday}
        resetLabel={t.timesheet.backToToday}
      />

      <TimePickerModal
        key={timePicker ? `${timePicker.field}-${timePicker.lineId}-${timePicker.value}` : 'closed'}
        visible={timePicker !== null}
        title={timePicker?.field === 'heure_fin' ? t.timesheet.end : t.timesheet.start}
        value={timePicker?.value || '07:30'}
        minTime={
          timePicker?.field === 'heure_fin' && timePickerLine?.heure_debut
            ? getMinEndTime(timePickerLine.heure_debut)
            : undefined
        }
        confirmLabel={t.common.validate}
        cancelLabel={t.common.cancel}
        onClose={() => setTimePicker(null)}
        onConfirm={(nextValue) => {
          if (!timePicker) return;
          updateWorkLine(timePicker.dateStr, timePicker.lineId, timePicker.field, nextValue);
          setTimePicker(null);
        }}
      />

      <SelectWorksiteModal
        visible={showWorksitePicker !== null}
        title={t.timesheet.selectWorksiteModal}
        subtitle={t.timesheet.worksite}
        selectedId={pickerSelectedChantierId}
        zoneGroups={pickerZoneGroups}
        emptyMessage="Aucun chantier disponible pour ce jour"
        onClose={() => setShowWorksitePicker(null)}
        onSelect={(worksite) => {
          if (!showWorksitePicker) return;
          const dateStr = getDateString(showWorksitePicker.dayIndex);
          updateWorkLine(dateStr, showWorksitePicker.lineId, 'chantier_id', worksite.id);
          setShowWorksitePicker(null);
        }}
      />
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
    gap: 18,
  },
  headerTop: {
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 10,
    gap: 8,
    shadowColor: '#7A3B22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  weekButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3EF',
    borderRadius: 19,
  },
  weekCalendarBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF3EF',
    borderRadius: 19,
  },
  weekInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  weekText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  dayCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dayCalendarIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNameCombined: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayTotalBlock: {
    alignItems: 'flex-end',
  },
  dayTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 22,
  },
  chevronWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    transform: [{ rotate: '0deg' }],
  },
  chevronWrapExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  dayContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 8,
  },
  workLineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applyLineButton: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF3EF',
    borderWidth: 1,
    borderColor: '#FFD1C0',
  },
  applyLineIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  applyLineButtonText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 20,
  },
  workLineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
    gap: 8,
  },
  workLineNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
    textTransform: 'uppercase',
  },
  workLineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  lineStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  lineStatusIncomplete: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFE082',
  },
  lineStatusSent: {
    backgroundColor: '#FFF3E8',
    borderColor: '#FFD8C8',
  },
  lineStatusApproved: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  lineStatusRejected: {
    backgroundColor: '#FFEBEE',
    borderColor: '#EF9A9A',
  },
  lineStatusCancelled: {
    backgroundColor: '#E2E8F0',
    borderColor: '#94A3B8',
  },
  lineStatusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  lineStatusTextIncomplete: {
    color: '#F57F17',
  },
  lineStatusTextSent: {
    color: '#C2410C',
  },
  lineStatusTextApproved: {
    color: '#2E7D32',
  },
  lineStatusTextRejected: {
    color: '#C62828',
  },
  lineStatusTextCancelled: {
    color: '#475569',
  },
  deleteLineButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#FFEBEE',
  },
  chantierField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  chantierIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chantierText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeField: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
  },
  timeIconButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FFF3EF',
  },
  arrow: {
    fontSize: 20,
    color: '#CCC',
    marginTop: 16,
    fontWeight: '300',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },
  toggleCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#C8C8C8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  toggleCheckboxChecked: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  toggleTextActive: {
    color: Colors.secondaryDark,
  },
  addLineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  addLineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  confirmLineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingVertical: 11,
    borderRadius: 12,
  },
  confirmLineButtonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  confirmLineButtonResubmit: {
    backgroundColor: '#E53935',
  },
  confirmLineButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
    shadowColor: '#7A3B22',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text.primary,
    flex: 1,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8F5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#FFE0D4',
  },
  summaryTotalValue: {
    marginLeft: 'auto',
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryStatCard: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  summaryStatCardHighlight: {
    backgroundColor: '#FFFBF7',
    borderColor: '#FFE0CC',
  },
  summaryStatBody: {
    flex: 1,
    gap: 1,
  },
  summaryStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatIconTotal: {
    backgroundColor: '#FFF3EF',
  },
  summaryStatIconNormal: {
    backgroundColor: '#E8F8F1',
  },
  summaryStatIconSupp: {
    backgroundColor: '#FFF3E0',
  },
  summaryStatIconMeal: {
    backgroundColor: '#E8F4FD',
  },
  summaryStatIconTravel: {
    backgroundColor: '#F3E5F5',
  },
  summaryStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  summaryStatValueNormal: {
    color: Colors.secondaryDark,
  },
  summaryStatValueSupp: {
    color: '#E65100',
  },
  summaryStatValueMeal: {
    color: '#1565C0',
  },
  summaryStatValueTravel: {
    color: '#6A1B9A',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#FFD1C0',
    marginBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0D2',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  modalSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#9A6A5B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#FFE8DD',
  },
  applyModalContent: {
    backgroundColor: '#FFF7F2',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    maxHeight: '78%',
    shadowColor: '#7A3B22',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
  },
  applyModalHint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: '#9A6A5B',
  },
  applyDayList: {
    maxHeight: 360,
  },
  applyDayListContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  applyDayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFE8DD',
  },
  applyDayOptionActive: {
    backgroundColor: '#FFF3EF',
    borderColor: '#FF6B35',
  },
  applyDayOptionDisabled: {
    opacity: 0.72,
  },
  applyDayCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD1C0',
    backgroundColor: '#FFF7F2',
  },
  applyDayCheckboxActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  applyDayInfo: {
    flex: 1,
  },
  applyDayName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  applyDayNameActive: {
    color: '#FF6B35',
  },
  applyDayDate: {
    marginTop: 2,
    fontSize: 12,
    color: '#9A6A5B',
    fontWeight: '600',
  },
  applyDayMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9A6A5B',
    textAlign: 'right',
    maxWidth: 110,
  },
  applyModalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#FFE0D2',
  },
  applyModalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFE0D2',
  },
  applyModalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  applyModalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FF6B35',
  },
  applyModalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
