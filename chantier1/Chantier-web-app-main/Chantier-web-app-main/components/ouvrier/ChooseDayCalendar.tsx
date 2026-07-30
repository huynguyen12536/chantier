import { useState, useMemo, useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DesktopPageHeader } from '@/components/layoutDesktop';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsDesktopLayout } from '@/hooks/useIsDesktopLayout';
import { Colors } from '@/constants/colors';
import { formatDateKey, formatWeekDayLabel, getMonday, parseDateKey, type DateLocale } from '@/utils/date';
import { declarationLookupKey, resolveLineStatut } from '@/utils/status';
import { supabase } from '@/services/supabase';
import { navigateFromChooseDay, navigateToDaySuggestion } from '@/utils/ouvrierDeclaration';
import { appAlert } from '@/utils/appAlert';

const DAYS_SHORT_FR = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];
const DAYS_SHORT_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function monthTitle(year: number, month: number, locale: DateLocale): string {
  const label = new Date(year, month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

type DayStatusType = 'validated' | 'pending' | 'rejected' | 'mixed' | 'undeclared' | 'weekend';

export interface ChooseDayCalendarProps {
  title: string;
  showBackButton?: boolean;
  hideHeader?: boolean;
  initialDate?: string;
  headerPaddingTop?: number;
  scrollBottomPadding?: number;
  absenceByDate?: Record<string, string>;
  onAbsencePress?: (absenceId: string) => void;
}

export function ChooseDayCalendar({
  title,
  showBackButton = false,
  hideHeader = false,
  initialDate,
  headerPaddingTop,
  scrollBottomPadding = 0,
  absenceByDate = {},
  onAbsencePress,
}: ChooseDayCalendarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDesktopLayout = useIsDesktopLayout();
  const { profile } = useAuth();
  const { t, dateLocale } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const compactLegend = windowWidth < 400;
  const daysShort = dateLocale.startsWith('en') ? DAYS_SHORT_EN : DAYS_SHORT_FR;

  const parsedInitial = initialDate ? parseDateKey(initialDate) : new Date();
  const [currentMonth, setCurrentMonth] = useState(parsedInitial.getMonth());
  const [currentYear, setCurrentYear] = useState(parsedInitial.getFullYear());
  const [dayStatuses, setDayStatuses] = useState<Record<string, DayStatusType>>({});
  const [pressedNav, setPressedNav] = useState<'prev' | 'next' | null>(null);

  const topInset = headerPaddingTop ?? insets.top + 8;
  const bottomInset = Math.max(scrollBottomPadding, insets.bottom, 16);

  const today = useMemo(() => formatDateKey(new Date()), []);

  const highlightWeekDates = useMemo(() => {
    if (!initialDate) return new Set<string>();
    const monday = getMonday(parseDateKey(initialDate));
    const dates = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      dates.add(formatDateKey(d));
    }
    return dates;
  }, [initialDate]);

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [currentMonth, currentYear]);

  const loadMonthStatuses = useCallback(async () => {
    if (!profile?.id) return;

    const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [periodsRes, declRes] = await Promise.all([
      supabase
        .from('periodes_travail')
        .select('date, statut, chantier_id')
        .eq('user_id', profile.id)
        .gte('date', startDate)
        .lte('date', endDate),
      supabase
        .from('declarations_heures')
        .select('chantier_id, date, statut')
        .eq('user_id', profile.id)
        .gte('date', startDate)
        .lte('date', endDate),
    ]);

    const declByKey = new Map<string, string>();
    for (const row of declRes.data || []) {
      declByKey.set(declarationLookupKey(row.chantier_id as string, row.date as string), row.statut as string);
    }

    const statuses: Record<string, DayStatusType> = {};
    const dateRecords = new Map<string, { hasValidee: boolean; hasAttente: boolean; hasRejetee: boolean }>();

    const applyResolved = (dateStr: string, resolved: ReturnType<typeof resolveLineStatut>) => {
      const existing = dateRecords.get(dateStr) || { hasValidee: false, hasAttente: false, hasRejetee: false };
      if (resolved === 'validee') existing.hasValidee = true;
      else if (resolved === 'rejetee' || resolved === 'annulee') existing.hasRejetee = true;
      else existing.hasAttente = true;
      dateRecords.set(dateStr, existing);
    };

    for (const row of periodsRes.data || []) {
      const dateStr = row.date as string;
      const resolved = resolveLineStatut(
        row.statut as string,
        row.chantier_id as string,
        dateStr,
        declByKey,
      );
      applyResolved(dateStr, resolved);
    }

    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const record = dateRecords.get(dateStr);

      if (record) {
        const count = [record.hasValidee, record.hasAttente, record.hasRejetee].filter(Boolean).length;
        if (count >= 2) statuses[dateStr] = 'mixed';
        else if (record.hasValidee) statuses[dateStr] = 'validated';
        else if (record.hasRejetee) statuses[dateStr] = 'rejected';
        else statuses[dateStr] = 'pending';
      } else if (isWeekend) {
        statuses[dateStr] = 'weekend';
      } else {
        statuses[dateStr] = 'undeclared';
      }
    }
    setDayStatuses(statuses);
  }, [profile?.id, currentMonth, currentYear]);

  useEffect(() => {
    void loadMonthStatuses();
  }, [loadMonthStatuses]);

  useFocusEffect(
    useCallback(() => {
      void loadMonthStatuses();
    }, [loadMonthStatuses]),
  );

  const releaseNavPress = () => setPressedNav(null);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    releaseNavPress();
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    releaseNavPress();
  };

  const handleDayPress = (day: number) => {
    if (!profile?.id) return;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const absenceId = absenceByDate[dateStr];
    if (absenceId) {
      if (onAbsencePress) {
        onAbsencePress(absenceId);
      } else {
        appAlert(t.common.error, t.absences.errors.dayAlreadyAbsent);
      }
      return;
    }

    const dayLabel = formatWeekDayLabel(dateStr, dateLocale);
    const status = dayStatuses[dateStr];
    const canView =
      status === 'validated'
      || status === 'pending'
      || status === 'mixed'
      || status === 'rejected';

    if (canView) {
      navigateFromChooseDay(router, profile.id, dateStr, dayLabel);
      return;
    }

    void navigateToDaySuggestion(router, profile.id, dateStr, dayLabel, {
      title: t.common.error,
      message: t.absences.errors.dayAlreadyAbsent,
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/ouvrier-dashboard');
    }
  };

  if (!profile || profile.role !== 'ouvrier') return null;

  const calendarBody = (
    <>
        <View style={styles.calendarPanel}>
          <View style={styles.monthNav}>
            <Pressable
              onPress={goToPrevMonth}
              onPressIn={() => setPressedNav('prev')}
              onPressOut={() => setPressedNav(null)}
              onPressCancel={() => setPressedNav(null)}
              style={[
                styles.monthNavBtn,
                pressedNav === 'prev' && styles.monthNavBtnPressed,
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mois précédent"
            >
              <ChevronLeft size={20} color="#FFF" strokeWidth={2.5} />
            </Pressable>
            <View style={styles.monthLabelWrap} pointerEvents="none">
              <Text style={styles.monthLabel} numberOfLines={1}>
                {monthTitle(currentYear, currentMonth, dateLocale)}
              </Text>
            </View>
            <Pressable
              onPress={goToNextMonth}
              onPressIn={() => setPressedNav('next')}
              onPressOut={() => setPressedNav(null)}
              onPressCancel={() => setPressedNav(null)}
              style={[
                styles.monthNavBtn,
                pressedNav === 'next' && styles.monthNavBtnPressed,
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mois suivant"
            >
              <ChevronRight size={20} color="#FFF" strokeWidth={2.5} />
            </Pressable>
          </View>

          <View style={styles.calendarBody}>
            <View style={styles.dayHeaderRow}>
              {daysShort.map((d, i) => (
                <View key={i} style={styles.dayHeaderCell}>
                  <Text style={styles.dayHeaderText}>{d}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
            {daysInMonth.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.calendarCell} />;
              }

              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const status = dayStatuses[dateStr];
              const isToday = dateStr === today;
              const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isAbsent = !!absenceByDate[dateStr];

              const statusType = status ?? 'weekend';
              const statusDotColors: Record<string, string> = {
                validated: '#22C55E',
                pending: '#F97316',
                rejected: '#EF4444',
                mixed: '#FBBF24',
              };
              const statusDot = statusDotColors[statusType];
              const hasData = !!statusDot;
              const dotColor = statusDot || null;
              const inHighlightWeek = highlightWeekDates.has(dateStr);
              const canPressDay = isAbsent || !isWeekend || hasData || statusType === 'undeclared';

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={styles.calendarCell}
                  onPress={() => {
                    if (canPressDay) handleDayPress(day);
                  }}
                  disabled={!canPressDay}
                >
                  <View style={styles.dayCell}>
                    <View style={[
                      styles.dayNumberWrap,
                      inHighlightWeek && styles.dayWeekHighlightRing,
                      isToday && styles.dayCircleToday,
                      isAbsent && !isToday && styles.dayAbsentRing,
                    ]}>
                      <Text style={[
                        styles.dayText,
                        isToday && styles.dayTextWhite,
                        !isToday && isWeekend && !dotColor && !isAbsent && statusType !== 'undeclared' && styles.dayTextWeekend,
                        !isToday && dotColor && {
                          color: dotColor,
                          fontWeight: '600',
                        },
                        !isToday && isAbsent && !dotColor && styles.dayTextAbsent,
                      ]}>
                        {day}
                      </Text>
                    </View>
                    <View style={styles.dotsRow}>
                      {isAbsent && (
                        <View style={[styles.dayDot, { backgroundColor: Colors.primary }]} />
                      )}
                      {dotColor && (
                        <View style={[styles.dayDot, { backgroundColor: dotColor }]} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            </View>
          </View>
        </View>

        <View style={styles.legendPanel}>
          <Text style={styles.legendTitle}>
            {t.ouvrierDashboard?.legendTitle ?? 'Légende'}
          </Text>
          <View style={styles.legendGrid}>
            <View style={[styles.legendItem, compactLegend && styles.legendItemCompact]}>
              <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
              <Text style={[styles.legendText, compactLegend && styles.legendTextCompact]}>
                {t.ouvrierDashboard?.legendValidated ?? 'Validée'}
              </Text>
            </View>
            <View style={[styles.legendItem, compactLegend && styles.legendItemCompact]}>
              <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
              <Text style={[styles.legendText, compactLegend && styles.legendTextCompact]}>
                {t.ouvrierDashboard?.legendPending ?? 'En attente'}
              </Text>
            </View>
            <View style={[styles.legendItem, compactLegend && styles.legendItemCompact]}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.legendText, compactLegend && styles.legendTextCompact]}>
                {t.ouvrierDashboard?.legendRejected ?? 'Rejetée'}
              </Text>
            </View>
            <View style={[styles.legendItem, compactLegend && styles.legendItemCompact]}>
              <View style={[styles.legendDot, { backgroundColor: '#FBBF24' }]} />
              <Text style={[styles.legendText, compactLegend && styles.legendTextCompact]}>
                {t.ouvrierDashboard?.legendMixed ?? 'État multiple'}
              </Text>
            </View>
            <View style={[styles.legendItem, compactLegend && styles.legendItemCompact]}>
              <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
              <Text style={[styles.legendText, compactLegend && styles.legendTextCompact]}>
                {t.absences?.legendAbsent ?? 'Absent'}
              </Text>
            </View>
          </View>
        </View>
    </>
  );

  if (hideHeader) {
    return <View style={styles.embeddedWrap}>{calendarBody}</View>;
  }

  return (
    <View style={[styles.container, isDesktopLayout && styles.containerDesktop]}>
      {isDesktopLayout ? (
        <View style={styles.desktopHeaderPad}>
          <DesktopPageHeader
            title={title}
            onBack={showBackButton ? handleBack : undefined}
            backLabel={t.common.cancel}
          />
        </View>
      ) : (
        <LinearGradient
          colors={['#FF8A50', '#FF6B35', '#E55A2B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: topInset }]}
        >
          {showBackButton ? (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft size={22} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </LinearGradient>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          isDesktopLayout && styles.contentDesktop,
          { paddingBottom: bottomInset + 24 },
        ]}
      >
        {calendarBody}
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  contentDesktop: {
    paddingTop: 8,
  },
  embeddedWrap: {
    gap: 14,
  },
  calendarPanel: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE8DC',
    elevation: 2,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3EF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE8DC',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 8,
  },
  monthNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 2,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  monthNavBtnPressed: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 0.9 }],
    opacity: 0.92,
  },
  monthLabelWrap: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  monthLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  calendarBody: {
    backgroundColor: '#FFF9F6',
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#FFF3EF',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFE8DC',
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.cardWarm.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    gap: 4,
  },
  dayNumberWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayWeekHighlightRing: {
    borderWidth: 2,
    borderColor: '#FF8A50',
    backgroundColor: '#FFFCF9',
  },
  dayCircleToday: {
    backgroundColor: '#FF6B35',
  },
  dayAbsentRing: {
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    minHeight: 6,
  },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  dayTextWeekend: {
    color: '#D1D5DB',
  },
  dayTextAbsent: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dayTextWhite: {
    color: '#FFF',
    fontWeight: '700',
  },
  legendPanel: {
    backgroundColor: '#FFF3EF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE8DC',
    elevation: 2,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '31%',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 96,
    backgroundColor: '#FFFCF9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#FFE8DC',
  },
  legendItemCompact: {
    width: '47%',
    minWidth: 0,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  legendText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    color: Colors.cardWarm.body,
    fontWeight: '600',
    lineHeight: 16,
  },
  legendTextCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
});
