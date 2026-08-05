import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Absence } from '@/types';
import {
  formatAbsenceDuration,
  formatAbsencePeriodLabel,
  getAbsenceReason,
} from '@/utils/absenceFormat';
import { isAbsenceUpcoming } from '@/utils/absence';

type CardProps = {
  absence: Absence;
  onPress: () => void;
  completed?: boolean;
};

export function AbsenceSummaryCard({ absence, onPress, completed = false }: CardProps) {
  const { t, dateLocale } = useLanguage();
  const a = t.absences;
  const period = formatAbsencePeriodLabel(absence.date_debut, absence.date_fin, dateLocale);
  const duration = formatAbsenceDuration(absence.date_debut, absence.date_fin, t);
  const reason = getAbsenceReason(absence.commentaire);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconWrap}>
        <Calendar size={18} color={Colors.primary} strokeWidth={2.2} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.period}>{period}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {reason} · {duration}
        </Text>
      </View>
      <View style={[styles.pill, completed && styles.pillCompleted]}>
        <Text style={[styles.pillText, completed && styles.pillTextCompleted]}>
          {completed ? a.statusCompleted : a.statusAbsent}
        </Text>
      </View>
      <ChevronRight size={18} color={Colors.text.secondary} />
    </TouchableOpacity>
  );
}

export function AbsenceListSection({
  title,
  items,
  emptyLabel,
  onPressItem,
  completed = false,
}: {
  title: string;
  items: Absence[];
  emptyLabel: string;
  onPressItem: (absence: Absence) => void;
  completed?: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        items.map((item) => (
          <AbsenceSummaryCard
            key={item.id}
            absence={item}
            completed={completed || !isAbsenceUpcoming(item)}
            onPress={() => onPressItem(item)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  empty: {
    fontSize: 14,
    color: Colors.text.disabled,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  period: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  meta: {
    marginTop: 2,
    fontSize: 13,
    color: Colors.text.secondary,
  },
  pill: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillCompleted: {
    borderColor: '#D1D5DB',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  pillTextCompleted: {
    color: Colors.text.secondary,
  },
});
