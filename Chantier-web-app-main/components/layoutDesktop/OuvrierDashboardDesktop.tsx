import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  X,
} from 'lucide-react-native';
import { PrefillWeekButton } from '@/components/common';
import { ValidationNotificationBell } from '@/components/common/ValidationNotificationBell';
import { Colors } from '@/constants/colors';
import { formatDateKey } from '@/utils/date';
import { DesktopPageHeader } from './DesktopPageHeader';

const ACCENT = '#FF5B24';
const INK = '#0E1320';
const MUTED = '#677084';

const CHART_BAR_WIDTH = 12;
const CHART_BAR_OVERLAP = CHART_BAR_WIDTH / 2;
const CHART_EMPTY = '#FFE5D8';
const CHART_VALID = '#22C55E';
const CHART_PENDING = '#F97316';
const CHART_PENDING_CHANTIER = '#9CA3AF';
const CHART_MAX_BAR_HEIGHT = 96;
const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

export type OuvrierDashboardDesktopDayLine = {
  statut: string;
};

export type OuvrierDashboardDesktopDay = {
  date: string;
  dayLabel: string;
  totalHours: number;
  validatedHours: number;
  pendingHours: number;
  pendingChantierHours: number;
  hasChantierBlocked: boolean;
  lineCount: number;
  lines: OuvrierDashboardDesktopDayLine[];
  onPress: () => void;
};

export type OuvrierDashboardDesktopLabels = {
  totalWeek: string;
  weekDays: string;
  prefillCurrentWeek: string;
  prefillCurrentWeekA11y: string;
  legendTitle: string;
  legendValidated: string;
  legendPending: string;
  legendChantierPending: string;
  toDeclare: string;
  notDeclared: string;
  declareToday: string;
  todayLabel: string;
};

export type OuvrierDashboardDesktopProps = {
  title: string;
  subtitle: string;
  showNotificationBell?: boolean;
  weekLabel: string;
  isCurrentWeek: boolean;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  loading: boolean;
  weekHasNoHours: boolean;
  totalWeekHours: number;
  days: OuvrierDashboardDesktopDay[];
  labels: OuvrierDashboardDesktopLabels;
  onPrefillWeek: () => void;
  onDeclareEmptyWeek: () => void;
};

function dayStatus(day: OuvrierDashboardDesktopDay) {
  const hasValidee = day.lines.some((l) => l.statut === 'validee');
  const hasAttente = day.lines.some(
    (l) => l.statut === 'attente' || l.statut === 'draft' || l.statut === 'chantier_pending',
  );
  const hasRejetee = day.lines.some((l) => l.statut === 'rejetee' || l.statut === 'annulee');
  const statusCount = [hasValidee, hasAttente, hasRejetee].filter(Boolean).length;

  if (day.lineCount === 0) {
    return { color: '#D1D5DB', bg: 'transparent', icon: null as React.ReactNode };
  }
  if (statusCount >= 2) {
    return {
      color: '#FBBF24',
      bg: '#FBBF24',
      icon: <Text style={styles.statusMark}>!</Text>,
    };
  }
  if (hasValidee) {
    return {
      color: '#22C55E',
      bg: '#22C55E',
      icon: <Check size={12} color="#FFF" strokeWidth={3} />,
    };
  }
  if (hasRejetee) {
    return {
      color: '#EF4444',
      bg: '#EF4444',
      icon: <X size={12} color="#FFF" strokeWidth={3} />,
    };
  }
  return {
    color: '#F97316',
    bg: '#F97316',
    icon: <HelpCircle size={12} color="#FFF" strokeWidth={2.5} />,
  };
}

export function OuvrierDashboardDesktop({
  title,
  subtitle,
  showNotificationBell = false,
  weekLabel,
  isCurrentWeek,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  loading,
  weekHasNoHours,
  totalWeekHours,
  days,
  labels,
  onPrefillWeek,
  onDeclareEmptyWeek,
}: OuvrierDashboardDesktopProps) {
  const todayKey = formatDateKey(new Date());
  const weekMax = days.reduce(
    (max, day) => Math.max(max, day.validatedHours, day.pendingHours, day.pendingChantierHours),
    0,
  );
  const chartHourScale = weekMax > 0 ? CHART_MAX_BAR_HEIGHT / weekMax : 0;
  const barHeight = (hours: number) =>
    hours > 0 && chartHourScale > 0 ? Math.max(hours * chartHourScale, 8) : 5;
  const declaredDays = days.filter((d) => d.lineCount > 0).length;

  return (
    <View style={styles.page}>
      <View style={styles.headerPad}>
        <DesktopPageHeader
          title={title}
          subtitle={subtitle}
          right={
            <View style={styles.headerRight}>
              <View style={styles.weekNav}>
                <TouchableOpacity
                  onPress={onPreviousWeek}
                  style={styles.weekNavBtn}
                  activeOpacity={0.85}
                >
                  <ChevronLeft size={18} color="#FFF" strokeWidth={2.4} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onCurrentWeek}
                  style={styles.weekLabelWrap}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.weekLabel, !isCurrentWeek && styles.weekLabelOther]}>
                    {weekLabel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onNextWeek}
                  style={styles.weekNavBtn}
                  activeOpacity={0.85}
                >
                  <ChevronRight size={18} color="#FFF" strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
              {showNotificationBell ? <ValidationNotificationBell variant="accent" /> : null}
            </View>
          }
        />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <View style={styles.columns}>
          <View style={styles.leftCol}>
            <View style={styles.dayListCard}>
              <View style={styles.dayListHeader}>
                <View style={styles.dayListTitleRow}>
                  <View style={styles.listHeaderAccent} />
                  <Text style={styles.dayListTitle}>{labels.weekDays}</Text>
                </View>
                <PrefillWeekButton
                  onPress={onPrefillWeek}
                  label={labels.prefillCurrentWeek}
                  accessibilityLabel={labels.prefillCurrentWeekA11y}
                />
              </View>

              <ScrollView
                style={styles.dayListScroll}
                contentContainerStyle={styles.dayListContent}
                showsVerticalScrollIndicator={false}
              >
                {days.map((day) => {
                  const status = dayStatus(day);
                  const isToday = day.date === todayKey;
                  return (
                    <TouchableOpacity
                      key={day.date}
                      style={[
                        styles.dayRow,
                        day.lineCount > 0 && styles.dayRowHighlighted,
                        day.hasChantierBlocked && styles.dayRowBlocked,
                        isToday && styles.dayRowToday,
                      ]}
                      onPress={day.onPress}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.dayStatusDot, { backgroundColor: status.color }]} />
                      <View style={styles.dayInfo}>
                        <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
                          {day.dayLabel}
                        </Text>
                        {isToday ? <Text style={styles.todayTag}>{labels.todayLabel}</Text> : null}
                      </View>
                      <View style={styles.dayHoursWrap}>
                        {day.totalHours > 0 ? (
                          <Text style={styles.dayHours}>{day.totalHours.toFixed(1)}h</Text>
                        ) : (
                          <Text style={styles.dayHoursEmpty}>—</Text>
                        )}
                      </View>
                      {status.icon ? (
                        <View style={[styles.dayCheckbox, { backgroundColor: status.bg }]}>
                          {status.icon}
                        </View>
                      ) : (
                        <View style={styles.dayCheckboxPlaceholder} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <View style={styles.rightCol}>
            <ScrollView
              style={styles.rightScroll}
              contentContainerStyle={styles.rightContent}
              showsVerticalScrollIndicator={false}
            >
              {weekHasNoHours ? (
                <TouchableOpacity
                  style={styles.todayCard}
                  activeOpacity={0.88}
                  onPress={onDeclareEmptyWeek}
                >
                  <LinearGradient
                    colors={['#FF8A50', '#FF6B35', '#E55A2B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.todayCardGradient}
                  >
                    <Text style={styles.todayToDeclareLabel}>{labels.toDeclare}</Text>
                    <Text style={styles.todayHoursValue}>0h00</Text>
                    <Text style={styles.todayNotDeclaredText}>{labels.notDeclared}</Text>
                    <View style={styles.todayDeclareBtn}>
                      <Text style={styles.todayDeclareBtnText}>{labels.declareToday}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={styles.summaryHero}>
                    <View style={styles.summaryIconWrap}>
                      <Clock size={22} color={ACCENT} strokeWidth={2.2} />
                    </View>
                    <View style={styles.summaryCopy}>
                      <Text style={styles.summaryLabel}>{labels.totalWeek}</Text>
                      <Text style={styles.summaryValue}>{totalWeekHours.toFixed(1)}h</Text>
                    </View>
                  </View>

                  <View style={styles.statRow}>
                    <View style={styles.statChip}>
                      <Text style={styles.statValue}>{declaredDays}</Text>
                      <Text style={styles.statLabel}>jours</Text>
                    </View>
                    <View style={styles.statChip}>
                      <Text style={styles.statValue}>
                        {days.filter((d) => d.lines.some((l) => l.statut === 'validee')).length}
                      </Text>
                      <Text style={styles.statLabel}>{labels.legendValidated}</Text>
                    </View>
                    <View style={styles.statChip}>
                      <Text style={styles.statValue}>
                        {
                          days.filter((d) =>
                            d.lines.some(
                              (l) =>
                                l.statut === 'attente' ||
                                l.statut === 'draft' ||
                                l.statut === 'chantier_pending',
                            ),
                          ).length
                        }
                      </Text>
                      <Text style={styles.statLabel}>{labels.legendPending}</Text>
                    </View>
                  </View>

                  <View style={styles.chartContainer}>
                    <View style={styles.chartRow}>
                      {days.map((day, idx) => {
                        const isToday = day.date === todayKey;
                        return (
                          <TouchableOpacity
                            key={day.date}
                            style={styles.chartCol}
                            onPress={day.onPress}
                            activeOpacity={0.8}
                          >
                            <View style={styles.chartBarGroup}>
                              <View
                                style={[
                                  styles.chartBar,
                                  styles.chartBarFirst,
                                  {
                                    height: barHeight(day.validatedHours),
                                    backgroundColor:
                                      day.validatedHours > 0 ? CHART_VALID : CHART_EMPTY,
                                  },
                                ]}
                              />
                              <View
                                style={[
                                  styles.chartBar,
                                  styles.chartBarSecond,
                                  {
                                    height: barHeight(day.pendingHours),
                                    backgroundColor:
                                      day.pendingHours > 0 ? CHART_PENDING : CHART_EMPTY,
                                  },
                                ]}
                              />
                              <View
                                style={[
                                  styles.chartBar,
                                  styles.chartBarThird,
                                  {
                                    height: barHeight(day.pendingChantierHours),
                                    backgroundColor:
                                      day.pendingChantierHours > 0
                                        ? CHART_PENDING_CHANTIER
                                        : CHART_EMPTY,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={[styles.chartLabel, isToday && styles.chartLabelToday]}>
                              {DAY_LETTERS[idx]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.chartLegend}>
                    <Text style={styles.chartLegendTitle}>{labels.legendTitle}</Text>
                    <View style={styles.chartLegendRow}>
                      <View style={styles.chartLegendItem}>
                        <View style={[styles.chartLegendDot, { backgroundColor: CHART_VALID }]} />
                        <Text style={styles.chartLegendText}>{labels.legendValidated}</Text>
                      </View>
                      <View style={styles.chartLegendItem}>
                        <View style={[styles.chartLegendDot, { backgroundColor: CHART_PENDING }]} />
                        <Text style={styles.chartLegendText}>{labels.legendPending}</Text>
                      </View>
                      <View style={styles.chartLegendItem}>
                        <View
                          style={[
                            styles.chartLegendDot,
                            { backgroundColor: CHART_PENDING_CHANTIER },
                          ]}
                        />
                        <Text style={styles.chartLegendText}>{labels.legendChantierPending}</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const glassPanel = {
  borderRadius: 24,
  borderWidth: 1,
  borderColor: '#E8ECF2',
  backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.72)' : '#FFFFFF',
  ...(Platform.OS === 'web'
    ? ({
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      } as object)
    : null),
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    backgroundColor: 'transparent',
  },
  headerPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weekNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabelWrap: {
    minWidth: 148,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD5C4',
  },
  weekLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.2,
  },
  weekLabelOther: {
    color: ACCENT,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columns: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  leftCol: {
    flex: 1.2,
    minWidth: 0,
  },
  rightCol: {
    flex: 0.9,
    minWidth: 300,
    maxWidth: 420,
    ...glassPanel,
    overflow: 'hidden',
  },
  rightScroll: {
    flex: 1,
  },
  rightContent: {
    padding: 20,
    gap: 16,
    flexGrow: 1,
  },
  dayListCard: {
    flex: 1,
    minHeight: 0,
    ...glassPanel,
    padding: 18,
  },
  dayListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  dayListTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  listHeaderAccent: {
    width: 4,
    height: 22,
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  dayListTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.2,
  },
  dayListScroll: {
    flex: 1,
  },
  dayListContent: {
    gap: 4,
    paddingBottom: 4,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 12,
  },
  dayRowHighlighted: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
  },
  dayRowBlocked: {
    backgroundColor: 'rgba(254, 243, 199, 0.65)',
  },
  dayRowToday: {
    borderWidth: 1,
    borderColor: '#FFD5C4',
    backgroundColor: '#FFF7F2',
  },
  dayStatusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  dayInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '700',
    color: INK,
  },
  dayNameToday: {
    color: ACCENT,
  },
  todayTag: {
    fontSize: 11,
    fontWeight: '700',
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dayHoursWrap: {
    minWidth: 52,
    alignItems: 'flex-end',
  },
  dayHours: {
    fontSize: 15,
    fontWeight: '800',
    color: INK,
  },
  dayHoursEmpty: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C4C9D4',
  },
  dayCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCheckboxPlaceholder: {
    width: 26,
    height: 26,
  },
  statusMark: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  todayCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  todayCardGradient: {
    paddingTop: 40,
    paddingBottom: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 4,
    minHeight: 280,
    justifyContent: 'center',
  },
  todayToDeclareLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  todayHoursValue: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1.5,
    marginVertical: 4,
  },
  todayNotDeclaredText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 18,
  },
  todayDeclareBtn: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '84%',
    alignSelf: 'center',
  },
  todayDeclareBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF6B35',
    letterSpacing: 0.2,
  },
  summaryHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFF7F2',
    borderWidth: 1,
    borderColor: '#FFE8DC',
  },
  summaryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD5C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: {
    gap: 2,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  summaryValue: {
    fontSize: 34,
    fontWeight: '900',
    color: ACCENT,
    letterSpacing: -0.8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: INK,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#FFF7F2',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#FFE8DC',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  chartBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: CHART_BAR_WIDTH + 2 * CHART_BAR_OVERLAP,
    justifyContent: 'center',
  },
  chartBar: {
    width: CHART_BAR_WIDTH,
    borderRadius: 6,
    minHeight: 5,
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
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
  },
  chartLabelToday: {
    color: ACCENT,
    fontWeight: '800',
  },
  chartLegend: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  chartLegendTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartLegendText: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
});
