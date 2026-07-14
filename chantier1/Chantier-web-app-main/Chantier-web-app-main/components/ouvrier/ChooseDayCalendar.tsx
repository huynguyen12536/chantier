import { useState, useMemo, useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/colors';
import { formatDateKey, formatWeekDayLabel, getMonday, parseDateKey } from '@/utils/date';
import { declarationLookupKey, resolveLineStatut } from '@/utils/status';
import { supabase } from '@/services/supabase';
import { navigateFromChooseDay, navigateToDaySuggestion } from '@/utils/ouvrierDeclaration';

const DAYS_SHORT = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

type DayStatusType = 'validated' | 'pending' | 'rejected' | 'mixed' | 'undeclared' | 'weekend';

export interface ChooseDayCalendarProps {
  title: string;
  showBackButton?: boolean;
  initialDate?: string;
  headerPaddingTop?: number;
  scrollBottomPadding?: number;
}

export function ChooseDayCalendar({
  title,
  showBackButton = false,
  initialDate,
  headerPaddingTop,
  scrollBottomPadding = 0,
}: ChooseDayCalendarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { t } = useLanguage();

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
    const dayLabel = formatWeekDayLabel(dateStr);
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

    void navigateToDaySuggestion(router, profile.id, dateStr, dayLabel);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/ouvrier-dashboard');
    }
  };

  if (!profile || profile.role !== 'ouvrier') return null;

  return (
    <View style={styles.container}>
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 24 }]}
      >
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
                {MONTHS_FR[currentMonth]} {currentYear}
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
              {DAYS_SHORT.map((d, i) => (
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

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={styles.calendarCell}
                  onPress={() => {
                    if (!isWeekend || hasData || statusType === 'undeclared') handleDayPress(day);
                  }}
                  disabled={isWeekend && !hasData && statusType !== 'undeclared'}
                >
                  <View style={styles.dayCell}>
                    <View style={[
                      styles.dayNumberWrap,
                      inHighlightWeek && styles.dayWeekHighlightRing,
                      isToday && styles.dayCircleToday,
                    ]}>
                      <Text style={[
                        styles.dayText,
                        isToday && styles.dayTextWhite,
                        !isToday && isWeekend && !dotColor && statusType !== 'undeclared' && styles.dayTextWeekend,
                        !isToday && dotColor && {
                          color: dotColor,
                          fontWeight: '600',
                        },
                      ]}>
                        {day}
                      </Text>
                    </View>
                    {dotColor && (
                      <View style={[styles.dayDot, { backgroundColor: dotColor }]} />
                    )}
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
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
              <Text style={styles.legendText}>{t.ouvrierDashboard?.legendValidated ?? 'Validée'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
              <Text style={styles.legendText}>{t.ouvrierDashboard?.legendPending ?? 'En attente'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>{t.ouvrierDashboard?.legendRejected ?? 'Rejetée'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FBBF24' }]} />
              <Text style={styles.legendText}>{t.ouvrierDashboard?.legendMixed ?? 'multiple state'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F2',
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
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '47%',
    backgroundColor: '#FFFCF9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#FFE8DC',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    flex: 1,
    fontSize: 13,
    color: Colors.cardWarm.body,
    fontWeight: '600',
  },
});
