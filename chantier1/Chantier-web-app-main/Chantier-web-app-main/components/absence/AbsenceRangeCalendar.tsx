import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDateKey, parseDateKey, type DateLocale } from '@/utils/date';
import { isDateInSelectedRange } from '@/utils/absenceFormat';

const DAYS_SHORT_FR = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];
const DAYS_SHORT_EN = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  startDate: string;
  endDate: string;
  onSelectDate: (dateKey: string) => void;
};

function monthTitle(year: number, month: number, locale: DateLocale): string {
  const label = new Date(year, month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function AbsenceRangeCalendar({ startDate, endDate, onSelectDate }: Props) {
  const { dateLocale } = useLanguage();
  const daysShort = dateLocale.startsWith('en') ? DAYS_SHORT_EN : DAYS_SHORT_FR;
  const parsedStart = parseDateKey(startDate);
  const [currentMonth, setCurrentMonth] = useState(parsedStart.getMonth());
  const [currentYear, setCurrentYear] = useState(parsedStart.getFullYear());
  const today = formatDateKey(new Date());

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    return days;
  }, [currentMonth, currentYear]);

  return (
    <View style={styles.panel}>
      <View style={styles.monthNav}>
        <Pressable
          style={styles.navBtn}
          onPress={() => {
            const next = new Date(currentYear, currentMonth - 1, 1);
            setCurrentMonth(next.getMonth());
            setCurrentYear(next.getFullYear());
          }}
        >
          <ChevronLeft size={18} color="#FFF" strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthTitle(currentYear, currentMonth, dateLocale)}</Text>
        <Pressable
          style={styles.navBtn}
          onPress={() => {
            const next = new Date(currentYear, currentMonth + 1, 1);
            setCurrentMonth(next.getMonth());
            setCurrentYear(next.getFullYear());
          }}
        >
          <ChevronRight size={18} color="#FFF" strokeWidth={2.5} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.weekRow}>
          {daysShort.map((label, index) => (
            <View key={`${label}-${index}`} style={styles.weekCell}>
              <Text style={styles.weekText}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.grid}>
          {daysInMonth.map((day, idx) => {
            if (day == null) {
              return <View key={`empty-${idx}`} style={styles.cell} />;
            }
            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const inRange = isDateInSelectedRange(dateKey, startDate, endDate);
            const isStart = dateKey === startDate;
            const isEnd = dateKey === endDate;
            const isToday = dateKey === today;

            return (
              <Pressable key={dateKey} style={styles.cell} onPress={() => onSelectDate(dateKey)}>
                <View
                  style={[
                    styles.dayWrap,
                    inRange && styles.dayInRange,
                    (isStart || isEnd) && styles.dayEndpoint,
                    isToday && !inRange && styles.dayToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      inRange && styles.dayTextRange,
                      (isStart || isEnd) && styles.dayTextEndpoint,
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE8DC',
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3EF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE8DC',
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  body: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#FFF9F6',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%` as `${number}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dayWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInRange: {
    backgroundColor: 'rgba(255, 107, 53, 0.18)',
    borderRadius: 8,
  },
  dayEndpoint: {
    backgroundColor: Colors.primary,
  },
  dayToday: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  dayTextRange: {
    color: Colors.primary,
  },
  dayTextEndpoint: {
    color: '#FFF',
    fontWeight: '800',
  },
});
