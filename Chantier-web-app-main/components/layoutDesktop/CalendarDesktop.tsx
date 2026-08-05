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
import { Plus } from 'lucide-react-native';
import { AbsenceListSection } from '@/components/absence/AbsenceListSection';
import { ChooseDayCalendar } from '@/components/ouvrier/ChooseDayCalendar';
import { Colors } from '@/constants/colors';
import type { Absence } from '@/types';
import { DesktopPageHeader } from './DesktopPageHeader';

export type CalendarDesktopProps = {
  title: string;
  subtitle: string;
  calendarTitle: string;
  declareCta: string;
  onDeclareAbsence: () => void;
  absenceByDate: Record<string, string>;
  onAbsencePress: (absenceId: string) => void;
  loading: boolean;
  upcomingTitle: string;
  upcomingItems: Absence[];
  upcomingEmpty: string;
  pastTitle: string;
  pastItems: Absence[];
  pastEmpty: string;
  onPressAbsenceItem: (absence: Absence) => void;
};

export function CalendarDesktop({
  title,
  subtitle,
  calendarTitle,
  declareCta,
  onDeclareAbsence,
  absenceByDate,
  onAbsencePress,
  loading,
  upcomingTitle,
  upcomingItems,
  upcomingEmpty,
  pastTitle,
  pastItems,
  pastEmpty,
  onPressAbsenceItem,
}: CalendarDesktopProps) {
  return (
    <View style={styles.page}>
      <View style={styles.headerPad}>
        <DesktopPageHeader title={title} subtitle={subtitle} />
      </View>

      <View style={styles.columns}>
        <ScrollView
          style={styles.leftCol}
          contentContainerStyle={styles.leftContent}
          showsVerticalScrollIndicator={false}
        >
          <ChooseDayCalendar
            title={calendarTitle}
            hideHeader
            headerPaddingTop={0}
            scrollBottomPadding={0}
            absenceByDate={absenceByDate}
            onAbsencePress={onAbsencePress}
          />

          <TouchableOpacity style={styles.cta} onPress={onDeclareAbsence} activeOpacity={0.9}>
            <Plus size={18} color="#FFF" strokeWidth={2.5} />
            <Text style={styles.ctaText}>{declareCta}</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.rightCol}>
          <ScrollView
            style={styles.rightScroll}
            contentContainerStyle={styles.rightContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator color={Colors.primary} style={styles.listLoader} />
            ) : (
              <View style={styles.listWrap}>
                <AbsenceListSection
                  title={upcomingTitle}
                  items={upcomingItems}
                  emptyLabel={upcomingEmpty}
                  onPressItem={onPressAbsenceItem}
                />
                <AbsenceListSection
                  title={pastTitle}
                  items={pastItems}
                  emptyLabel={pastEmpty}
                  completed
                  onPressItem={onPressAbsenceItem}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

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
    flex: 1.15,
    minWidth: 0,
  },
  leftContent: {
    gap: 14,
    paddingBottom: 8,
  },
  rightCol: {
    flex: 0.95,
    minWidth: 280,
    maxWidth: 460,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.72)' : '#FFFFFF',
    overflow: 'hidden',
  },
  rightScroll: {
    flex: 1,
  },
  rightContent: {
    padding: 18,
    paddingBottom: 24,
    flexGrow: 1,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  listWrap: {
    gap: 22,
  },
  listLoader: {
    marginVertical: 24,
  },
});
