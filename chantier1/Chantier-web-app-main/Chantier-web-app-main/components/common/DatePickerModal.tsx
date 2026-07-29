import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { isDateInSelectedRange } from '@/utils/absenceFormat';
import { formatDateKey, parseDateKey } from '@/utils/date';

const WEEKDAY_LABELS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const WEEKDAY_LABELS_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface DatePickerModalProps {
  visible: boolean;
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  closeLabel?: string;
  showReset?: boolean;
  onReset?: () => void;
  resetLabel?: string;
  rangeStart?: string | null;
  rangeEnd?: string | null;
  highlightRange?: boolean;
  /** YYYY-MM-DD — dates before this are disabled and shown gray. */
  minDate?: string;
  /** YYYY-MM-DD keys — e.g. days with a registered work shift. */
  disabledDates?: ReadonlySet<string>;
}

export function DatePickerModal({
  visible,
  value,
  onSelect,
  onClose,
  closeLabel = 'Fermer',
  showReset = false,
  onReset,
  resetLabel = "Aujourd'hui",
  rangeStart,
  rangeEnd,
  highlightRange = false,
  minDate,
  disabledDates,
}: DatePickerModalProps) {
  const { dateLocale } = useLanguage();
  const weekdayLabels = dateLocale.startsWith('en') ? WEEKDAY_LABELS_EN : WEEKDAY_LABELS_FR;

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const parsed = parseDateKey(value);
    return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
  });

  useEffect(() => {
    if (!visible) return;
    const parsed = parseDateKey(value);
    setVisibleMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }, [visible, value]);

  const selectedValue = formatDateKey(parseDateKey(value));
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const firstWeekOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [
    ...Array.from({ length: firstWeekOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const changeMonth = (direction: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const prevMonthLastDay = formatDateKey(new Date(year, month, 0));
  const canGoPrev = !minDate || prevMonthLastDay >= minDate;

  const monthTitle = visibleMonth
    .toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' });

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
              onPress={() => changeMonth(-1)}
              disabled={!canGoPrev}
            >
              <Text style={[styles.navText, !canGoPrev && styles.navTextDisabled]}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)}
            </Text>
            <TouchableOpacity style={styles.navBtn} onPress={() => changeMonth(1)}>
              <Text style={styles.navText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {weekdayLabels.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekText}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {days.map((day, index) => {
              if (!day) return <View key={`empty-${index}`} style={styles.day} />;
              const dayValue = formatDateKey(new Date(year, month, day));
              const active = dayValue === selectedValue;
              const rangeStartKey = rangeStart && rangeEnd && rangeStart <= rangeEnd ? rangeStart : rangeStart;
              const rangeEndKey = rangeStart && rangeEnd && rangeStart <= rangeEnd ? rangeEnd : rangeEnd;
              const inRange = highlightRange && isDateInSelectedRange(dayValue, rangeStartKey, rangeEndKey);
              const isRangeStart = highlightRange && dayValue === rangeStartKey;
              const isRangeEnd = highlightRange && dayValue === rangeEndKey;
              const isEndpoint = isRangeStart || isRangeEnd;
              const isPast = Boolean(minDate && dayValue < minDate);
              const isWorkDay = Boolean(disabledDates?.has(dayValue));
              const isDisabled = isPast || isWorkDay;

              return (
                <TouchableOpacity
                  key={dayValue}
                  style={[
                    styles.day,
                    inRange && !isDisabled && styles.dayInRange,
                    (active || isEndpoint) && !isDisabled && styles.dayActive,
                    isDisabled && styles.dayDisabled,
                  ]}
                  disabled={isDisabled}
                  onPress={() => {
                    if (isDisabled) return;
                    onSelect(dayValue);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.dayText,
                      inRange && !isEndpoint && !isDisabled && styles.dayTextInRange,
                      (active || isEndpoint) && !isDisabled && styles.dayTextActive,
                      isDisabled && styles.dayTextDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {showReset && onReset ? (
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                onReset();
                onClose();
              }}
            >
              <RotateCcw size={18} color={Colors.primary} strokeWidth={2.4} />
              <Text style={styles.resetText}>{resetLabel}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{closeLabel}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(80,35,10,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF7F2',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.16)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navText: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  navTextDisabled: {
    color: Colors.text.secondary,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayInRange: {
    backgroundColor: 'rgba(255, 107, 53, 0.18)',
  },
  dayActive: {
    backgroundColor: Colors.primary,
    borderRadius: 19,
  },
  dayDisabled: {
    opacity: 0.45,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  dayTextInRange: {
    color: Colors.primary,
  },
  dayTextActive: {
    color: '#FFF',
  },
  dayTextDisabled: {
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  resetBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: '#FFF3EF',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.28)',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  closeBtn: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
});
