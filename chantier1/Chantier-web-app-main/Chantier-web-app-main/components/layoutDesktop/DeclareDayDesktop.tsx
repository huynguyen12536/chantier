import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Building2,
  Car,
  Check,
  CheckSquare,
  ChevronDown,
  Clock,
  Square,
  UtensilsCrossed,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { DesktopBackground } from './DesktopBackground';
import { DesktopPageHeader } from './DesktopPageHeader';

const ACCENT = '#FF5B24';
const INK = '#0E1320';
const MUTED = '#677084';

export type DeclareDayDesktopWeekDay = {
  date: string;
  letter: string;
  shortLabel: string;
  isSourceDay: boolean;
  isChecked: boolean;
  canToggle: boolean;
  hasOverlap: boolean;
  sourceBlocked: boolean;
};

export type DeclareDayDesktopProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
  backLabel: string;
  worksiteLabel: string;
  worksiteValue: string;
  worksiteLoading: boolean;
  worksitePendingBadge?: string | null;
  onPressWorksite: () => void;
  scheduleLabel: string;
  startLabel: string;
  endLabel: string;
  startTime: string;
  endTime: string;
  endPlaceholder: string;
  onPressStart: () => void;
  onPressEnd: () => void;
  reasonRequired: boolean;
  reasonLabel: string;
  reasonPlaceholder: string;
  reasonValue: string;
  onReasonChange: (value: string) => void;
  optionsLabel: string;
  mealLabel: string;
  displacementLabel: string;
  mealActive: boolean;
  displacementActive: boolean;
  onToggleMeal: () => void;
  onToggleDisplacement: () => void;
  showWeekSection: boolean;
  weekSectionLabel: string;
  applyWeekLoading: boolean;
  showToggleAllSuggested: boolean;
  allSuggestableSelected: boolean;
  selectAllLabel: string;
  deselectAllLabel: string;
  onToggleAllSuggested: () => void;
  weekDays: DeclareDayDesktopWeekDay[];
  onPressWeekDay: (day: DeclareDayDesktopWeekDay) => void;
  submitLabel: string;
  submitting: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
};

export function DeclareDayDesktop({
  title,
  subtitle,
  onBack,
  backLabel,
  worksiteLabel,
  worksiteValue,
  worksiteLoading,
  worksitePendingBadge,
  onPressWorksite,
  scheduleLabel,
  startLabel,
  endLabel,
  startTime,
  endTime,
  endPlaceholder,
  onPressStart,
  onPressEnd,
  reasonRequired,
  reasonLabel,
  reasonPlaceholder,
  reasonValue,
  onReasonChange,
  optionsLabel,
  mealLabel,
  displacementLabel,
  mealActive,
  displacementActive,
  onToggleMeal,
  onToggleDisplacement,
  showWeekSection,
  weekSectionLabel,
  applyWeekLoading,
  showToggleAllSuggested,
  allSuggestableSelected,
  selectAllLabel,
  deselectAllLabel,
  onToggleAllSuggested,
  weekDays,
  onPressWeekDay,
  submitLabel,
  submitting,
  canSubmit,
  onSubmit,
}: DeclareDayDesktopProps) {
  return (
    <DesktopBackground style={styles.page}>
      <View style={styles.headerPad}>
        <DesktopPageHeader
          title={title}
          subtitle={subtitle}
          onBack={onBack}
          backLabel={backLabel}
        />
      </View>

      <View style={styles.body}>
        <BlurView intensity={55} tint="light" style={styles.formFrame}>
          <View style={styles.formInner}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.columns}>
                <View style={styles.column}>
                  <Text style={styles.sectionLabel}>{worksiteLabel}</Text>
                  <TouchableOpacity
                    style={styles.fieldCard}
                    onPress={onPressWorksite}
                    activeOpacity={0.75}
                  >
                    <View style={styles.fieldIcon}>
                      <Building2 size={18} color={ACCENT} strokeWidth={2.3} />
                    </View>
                    <Text
                      style={[styles.fieldValue, worksiteLoading && styles.fieldValueMuted]}
                      numberOfLines={1}
                    >
                      {worksiteValue}
                    </Text>
                    {worksitePendingBadge ? (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>{worksitePendingBadge}</Text>
                      </View>
                    ) : null}
                    <ChevronDown size={18} color={MUTED} />
                  </TouchableOpacity>

                  <Text style={styles.sectionLabel}>{scheduleLabel}</Text>
                  <View style={styles.timeRow}>
                    <TouchableOpacity style={styles.timeCard} onPress={onPressStart} activeOpacity={0.75}>
                      <Text style={styles.timeCardLabel}>{startLabel}</Text>
                      <View style={styles.timeCardValue}>
                        <Clock size={16} color={ACCENT} strokeWidth={2.2} />
                        <Text style={styles.timeCardTime}>{startTime}</Text>
                      </View>
                    </TouchableOpacity>
                    <Text style={styles.timeArrow}>→</Text>
                    <TouchableOpacity style={styles.timeCard} onPress={onPressEnd} activeOpacity={0.75}>
                      <Text style={styles.timeCardLabel}>{endLabel}</Text>
                      <View style={styles.timeCardValue}>
                        <Clock size={16} color={ACCENT} strokeWidth={2.2} />
                        <Text style={[styles.timeCardTime, !endTime && styles.fieldValueMuted]}>
                          {endTime || endPlaceholder}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {reasonRequired ? (
                    <>
                      <Text style={styles.sectionLabel}>{reasonLabel}</Text>
                      <TextInput
                        style={styles.reasonInput}
                        value={reasonValue}
                        onChangeText={onReasonChange}
                        placeholder={reasonPlaceholder}
                        placeholderTextColor="#B0B7C3"
                        multiline
                        textAlignVertical="top"
                        maxLength={500}
                      />
                    </>
                  ) : null}
                </View>

                <View style={styles.columnDivider} />

                <View style={styles.column}>
                  <Text style={styles.sectionLabel}>{optionsLabel}</Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={[styles.optionCard, mealActive && styles.optionCardActive]}
                      onPress={onToggleMeal}
                      activeOpacity={0.75}
                    >
                      {mealActive ? (
                        <View style={styles.optionBadge}>
                          <Check size={11} color="#FFF" strokeWidth={3} />
                        </View>
                      ) : null}
                      <View style={[styles.optionIconWrap, mealActive && styles.optionIconWrapActive]}>
                        <UtensilsCrossed size={22} color={mealActive ? ACCENT : MUTED} />
                      </View>
                      <Text style={[styles.optionLabel, mealActive && styles.optionLabelActive]}>
                        {mealLabel}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.optionCard, displacementActive && styles.optionCardActive]}
                      onPress={onToggleDisplacement}
                      activeOpacity={0.75}
                    >
                      {displacementActive ? (
                        <View style={styles.optionBadge}>
                          <Check size={11} color="#FFF" strokeWidth={3} />
                        </View>
                      ) : null}
                      <View
                        style={[
                          styles.optionIconWrap,
                          displacementActive && styles.optionIconWrapActive,
                        ]}
                      >
                        <Car size={22} color={displacementActive ? ACCENT : MUTED} />
                      </View>
                      <Text
                        style={[styles.optionLabel, displacementActive && styles.optionLabelActive]}
                      >
                        {displacementLabel}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {showWeekSection ? (
                    <>
                      <View style={styles.weekHeader}>
                        <Text style={styles.sectionLabel}>{weekSectionLabel}</Text>
                        {showToggleAllSuggested && !applyWeekLoading ? (
                          <TouchableOpacity
                            style={styles.toggleAllBtn}
                            onPress={onToggleAllSuggested}
                            activeOpacity={0.75}
                          >
                            {allSuggestableSelected ? (
                              <CheckSquare size={16} color={ACCENT} strokeWidth={2.5} />
                            ) : (
                              <Square size={16} color={ACCENT} strokeWidth={2.5} />
                            )}
                            <Text style={styles.toggleAllText}>
                              {allSuggestableSelected ? deselectAllLabel : selectAllLabel}
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>

                      {applyWeekLoading ? (
                        <View style={styles.weekLoading}>
                          <ActivityIndicator color={Colors.primary} size="small" />
                        </View>
                      ) : (
                        <View style={styles.weekDayTable}>
                          {weekDays.map((day) => (
                            <TouchableOpacity
                              key={day.date}
                              style={[
                                styles.weekDayCell,
                                day.hasOverlap && styles.weekDayCellDisabled,
                              ]}
                              onPress={() => onPressWeekDay(day)}
                              activeOpacity={day.canToggle || day.sourceBlocked ? 0.7 : 1}
                              disabled={!day.canToggle && !day.sourceBlocked}
                            >
                              <View
                                style={[
                                  styles.weekDayBadge,
                                  day.isSourceDay && !day.sourceBlocked && styles.weekDayBadgeCurrent,
                                  day.isChecked &&
                                    !day.isSourceDay &&
                                    styles.weekDayBadgeSelected,
                                  !day.isChecked &&
                                    !(day.isSourceDay && !day.sourceBlocked) &&
                                    styles.weekDayBadgeUnselected,
                                  day.sourceBlocked && styles.weekDayBadgeBlocked,
                                ]}
                              >
                                <Text
                                  style={[
                                    day.isChecked || (day.isSourceDay && !day.sourceBlocked)
                                      ? styles.weekDayLetterSelected
                                      : styles.weekDayLetterUnselected,
                                    day.hasOverlap && styles.weekDayLetterDisabled,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {day.letter}
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.weekDayShortLabel,
                                  day.isSourceDay && styles.weekDayShortLabelCurrent,
                                  !day.isChecked && styles.weekDayShortLabelMuted,
                                  day.hasOverlap && styles.weekDayShortLabelMuted,
                                ]}
                                numberOfLines={1}
                              >
                                {day.shortLabel}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </>
                  ) : null}
                </View>
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.submitBtn, (submitting || !canSubmit) && styles.submitBtnDisabled]}
                onPress={onSubmit}
                disabled={submitting || !canSubmit}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>{submitLabel}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    </DesktopBackground>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    minHeight: 0,
  },
  headerPad: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  body: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  formFrame: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        } as object)
      : null),
  },
  formInner: {
    flex: 1,
    minHeight: 0,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    flexGrow: 1,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    width: '100%',
  },
  column: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  columnDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(232, 236, 242, 0.95)',
  },
  sectionLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '800',
    color: ACCENT,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  fieldCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  fieldIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: INK,
  },
  fieldValueMuted: {
    color: MUTED,
    fontWeight: '600',
  },
  pendingBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timeCard: {
    flex: 1,
    gap: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  timeCardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeCardValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeCardTime: {
    fontSize: 18,
    fontWeight: '800',
    color: INK,
  },
  timeArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: ACCENT,
  },
  reasonInput: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: INK,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 112,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E8ECF2',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  optionCardActive: {
    borderColor: '#FFD5C4',
    backgroundColor: '#FFF7F2',
  },
  optionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconWrapActive: {
    backgroundColor: '#FFF0EB',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: MUTED,
  },
  optionLabelActive: {
    color: ACCENT,
  },
  weekHeader: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  toggleAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
  },
  weekLoading: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayTable: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekDayCell: {
    width: 64,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 14,
  },
  weekDayCellDisabled: {
    opacity: 0.55,
  },
  weekDayBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  weekDayBadgeCurrent: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  weekDayBadgeSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  weekDayBadgeUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8ECF2',
  },
  weekDayBadgeBlocked: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  weekDayLetterSelected: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF',
  },
  weekDayLetterUnselected: {
    fontSize: 14,
    fontWeight: '700',
    color: MUTED,
  },
  weekDayLetterDisabled: {
    color: '#94A3B8',
  },
  weekDayShortLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: INK,
  },
  weekDayShortLabelCurrent: {
    color: ACCENT,
    fontWeight: '800',
  },
  weekDayShortLabelMuted: {
    color: MUTED,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 236, 242, 0.95)',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  submitBtn: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
