import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import { AbsenceListSection } from '@/components/absence/AbsenceListSection';
import { CollaboratorNotificationBell } from '@/components/common';
import { ChooseDayCalendar } from '@/components/ouvrier/ChooseDayCalendar';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { supabase } from '@/services/supabase';
import type { Absence } from '@/types';
import { buildAbsenceDateMap, fetchUserAbsences, isAbsenceUpcoming } from '@/utils/absence';

const REALTIME_DEBOUNCE_MS = 350;

export default function CalendarTabScreen() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();
  const a = t.absences;

  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAbsences = useCallback(async (silent = false) => {
    if (!profile?.id) return;
    if (!silent) setLoading(true);
    try {
      const rows = await fetchUserAbsences(profile.id);
      setAbsences(rows);
    } catch {
      setAbsences([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    void loadAbsences();
  }, [loadAbsences]);

  useFocusEffect(
    useCallback(() => {
      void loadAbsences(true);
    }, [loadAbsences]),
  );

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`absences-user-${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'absences', filter: `user_id=eq.${profile.id}` },
        () => {
          if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
          reloadTimerRef.current = setTimeout(() => {
            void loadAbsences(true);
          }, REALTIME_DEBOUNCE_MS);
        },
      )
      .subscribe();

    return () => {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [profile?.id, loadAbsences]);

  const absenceByDate = useMemo(() => buildAbsenceDateMap(absences), [absences]);
  const upcoming = useMemo(
    () => absences.filter((row) => isAbsenceUpcoming(row)).sort((x, y) => x.date_debut.localeCompare(y.date_debut)),
    [absences],
  );
  const past = useMemo(
    () => absences.filter((row) => !isAbsenceUpcoming(row)),
    [absences],
  );

  if (!profile || profile.role !== 'ouvrier') return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF8A50', '#FF6B35', '#E55A2B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: headerPaddingTop }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{a.title}</Text>
            <Text style={styles.headerSubtitle}>{a.subtitle}</Text>
          </View>
          <CollaboratorNotificationBell variant="light" />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding + 24 }]}
      >
        <ChooseDayCalendar
          title={t.tabs.calendar}
          hideHeader
          headerPaddingTop={0}
          scrollBottomPadding={0}
          absenceByDate={absenceByDate}
          onAbsencePress={(id) => router.push(`/absence-detail?id=${encodeURIComponent(id)}`)}
        />

        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push('/declare-absence')}
          activeOpacity={0.9}
        >
          <Plus size={18} color="#FFF" strokeWidth={2.5} />
          <Text style={styles.ctaText}>{a.declareCta}</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.listLoader} />
        ) : (
          <View style={styles.listWrap}>
            <AbsenceListSection
              title={a.upcomingSection}
              items={upcoming}
              emptyLabel={a.emptyUpcoming}
              onPressItem={(item) => router.push(`/absence-detail?id=${encodeURIComponent(item.id)}`)}
            />
            <AbsenceListSection
              title={a.pastSection}
              items={past}
              emptyLabel={a.emptyPast}
              completed
              onPressItem={(item) => router.push(`/absence-detail?id=${encodeURIComponent(item.id)}`)}
            />
          </View>
        )}
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
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
    gap: 18,
  },
  listLoader: {
    marginVertical: 12,
  },
});
