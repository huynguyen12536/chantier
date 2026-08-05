import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, Redirect } from 'expo-router';
import { Calendar, CalendarClock, CalendarRange, History, Search, User, Users } from 'lucide-react-native';
import { ValidationNotificationBell } from '@/components/common/ValidationNotificationBell';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { supabase } from '@/services/supabase';
import type { Absence, Profile } from '@/types';
import {
  fetchTeamAbsences,
  getWeekBounds,
  isAbsenceToday,
  isAbsenceUpcoming,
} from '@/utils/absence';
import {
  formatAbsenceDuration,
  formatAbsencePeriodLabel,
  getAbsenceReason,
} from '@/utils/absenceFormat';
import { formatDateKey, normalizeDateKey } from '@/utils/date';
import { canReceiveApprovalNotifications, canViewTeamAbsences, getHomeRouteForRole } from '@/utils/role';
import { getChefTeamUserIds } from '@/utils/team';

type TeamTab = 'today' | 'upcoming' | 'history';
type PeriodTab = 'day' | 'week';

const REALTIME_DEBOUNCE_MS = 350;
const teamAbsencesHeaderBackground = require('../../assets/images/bg (2).png');

function profileName(profile?: Pick<Profile, 'prenom' | 'nom'> | null): string {
  if (!profile) return '—';
  return `${profile.prenom ?? ''} ${profile.nom ?? ''}`.trim() || '—';
}

export default function TeamAbsencesScreen() {
  const { profile } = useAuth();
  const { t, dateLocale } = useLanguage();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();
  const a = t.absences;

  const [tab, setTab] = useState<TeamTab>('today');
  const [periodTab, setPeriodTab] = useState<PeriodTab>('day');
  const [loading, setLoading] = useState(true);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [teamCount, setTeamCount] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Absence | null>(null);
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  const loadData = useCallback(async (silent = false) => {
    if (!profile?.id || !canViewTeamAbsences(profile.role)) return;
    if (!silent) setLoading(true);
    try {
      const rows = await fetchTeamAbsences({
        viewerId: profile.id,
        viewerRole: profile.role,
      });
      setAbsences(rows);

      if (profile.role === 'chef_equipe') {
        const ids = await getChefTeamUserIds(profile.id);
        setTeamCount(ids.length);
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'ouvrier');
        if (error) throw error;
        setTeamCount(data?.length ?? 0);
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[team-absences] load failed', err);
      }
      setAbsences([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [profile?.id, profile?.role]);

  useEffect(() => {
    setAbsences([]);
    setSearch('');
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData(true);
    }, [loadData]),
  );

  useEffect(() => {
    if (!profile?.id || !canViewTeamAbsences(profile.role)) return;
    const channel = supabase
      .channel(`absences-team-${profile.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'absences' },
        () => {
          if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
          reloadTimerRef.current = setTimeout(() => {
            void loadData(true);
          }, REALTIME_DEBOUNCE_MS);
        },
      )
      .subscribe();

    return () => {
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.role, loadData]);

  const weekBounds = useMemo(() => getWeekBounds(), []);

  const stats = useMemo(() => {
    const todayCount = absences.filter((row) => isAbsenceToday(row, todayKey)).length;
    const weekCount = absences.filter(
      (row) => row.date_debut <= weekBounds.end && row.date_fin >= weekBounds.start,
    ).length;
    return { todayCount, weekCount };
  }, [absences, todayKey, weekBounds.end, weekBounds.start]);

  const absenceEndKey = useCallback(
    (row: Pick<Absence, 'date_fin'>) => normalizeDateKey(row.date_fin),
    [],
  );
  const absenceStartKey = useCallback(
    (row: Pick<Absence, 'date_debut'>) => normalizeDateKey(row.date_debut),
    [],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let rows = absences;
    if (tab === 'today') {
      if (periodTab === 'day') {
        rows = rows.filter((row) => isAbsenceToday(row, todayKey));
      } else {
        rows = rows.filter(
          (row) =>
            absenceStartKey(row) <= weekBounds.end && absenceEndKey(row) >= weekBounds.start,
        );
      }
    } else if (tab === 'upcoming') {
      rows = rows.filter((row) => absenceStartKey(row) > todayKey);
    } else {
      rows = rows.filter((row) => absenceEndKey(row) < todayKey);
    }
    if (!query) return rows;
    return rows.filter((row) => {
      const name = profileName(row.profiles).toLowerCase();
      const matricule = row.profiles?.matricule?.toLowerCase() ?? '';
      return name.includes(query) || matricule.includes(query);
    });
  }, [
    absences,
    search,
    tab,
    periodTab,
    todayKey,
    weekBounds.end,
    weekBounds.start,
    absenceEndKey,
    absenceStartKey,
  ]);

  const historyBadge = useMemo(
    () => absences.filter((row) => absenceEndKey(row) < todayKey).length,
    [absences, todayKey, absenceEndKey],
  );

  const emptyMessage = useMemo(() => {
    if (tab === 'history') return a.emptyTeamHistory;
    if (tab === 'upcoming') return a.emptyTeamUpcoming;
    if (tab === 'today') return a.emptyTeamToday;
    return a.emptyTeam;
  }, [a.emptyTeam, a.emptyTeamHistory, a.emptyTeamToday, a.emptyTeamUpcoming, tab]);

  const todayBadge = useMemo(
    () => absences.filter((row) => isAbsenceToday(row, todayKey)).length,
    [absences, todayKey],
  );

  const dayBadge = todayBadge;

  const weekBadge = useMemo(
    () => absences.filter(
      (row) => row.date_debut <= weekBounds.end && row.date_fin >= weekBounds.start,
    ).length,
    [absences, weekBounds.end, weekBounds.start],
  );

  const upcomingBadge = useMemo(
    () => absences.filter((row) => row.date_debut > todayKey).length,
    [absences, todayKey],
  );

  const mainTabs = useMemo(
    () =>
      [
        { key: 'today' as const, label: a.tabToday, badge: todayBadge, Icon: Calendar },
        { key: 'upcoming' as const, label: a.tabUpcoming, badge: upcomingBadge, Icon: CalendarClock },
        { key: 'history' as const, label: a.tabHistory, badge: historyBadge, Icon: History },
      ],
    [a.tabToday, a.tabUpcoming, a.tabHistory, todayBadge, upcomingBadge, historyBadge],
  );

  const periodTabs = useMemo(
    () =>
      [
        { key: 'day' as const, label: a.tabDay, badge: dayBadge, Icon: Calendar },
        { key: 'week' as const, label: a.tabWeek, badge: weekBadge, Icon: CalendarRange },
      ],
    [a.tabDay, a.tabWeek, dayBadge, weekBadge],
  );

  if (!profile?.role || !canViewTeamAbsences(profile.role)) {
    return <Redirect href={getHomeRouteForRole(profile?.role)} />;
  }

  const sectionTitle =
    tab === 'today'
      ? periodTab === 'day'
        ? a.sectionToday
        : a.sectionWeek
      : tab === 'upcoming'
        ? a.sectionUpcoming
        : a.sectionHistory;

  return (
    <View style={styles.container}>
      <ImageBackground
        source={teamAbsencesHeaderBackground}
        resizeMode="cover"
        style={styles.header}
        imageStyle={styles.headerImage}
      >
        <View style={[styles.headerOverlay, { paddingTop: headerPaddingTop }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>{a.teamTitle}</Text>
              <View style={styles.subtitleRow}>
                <Users size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.headerSubtitle}>
                  {a.teamSubtitle.replace('{{count}}', String(teamCount))}
                </Text>
              </View>
            </View>
            {canReceiveApprovalNotifications(profile.role) && (
              <ValidationNotificationBell variant="light" />
            )}
          </View>

          <View style={styles.tabBar}>
            {mainTabs.map(({ key, label, badge, Icon }) => {
              const active = tab === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setTab(key)}
                  activeOpacity={0.8}
                >
                  <Icon
                    size={16}
                    color={active ? Colors.primary : 'rgba(255,255,255,0.85)'}
                    strokeWidth={2.25}
                  />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
                  {badge > 0 && (
                    <View style={styles.tabCount}>
                      <Text style={styles.tabCountText}>{badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ImageBackground>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <View style={styles.statIconWrap}>
                <User size={22} color={Colors.primary} strokeWidth={2.25} />
              </View>
              <Text style={styles.statValue}>{stats.todayCount}</Text>
            </View>
            <Text style={styles.statLabel} numberOfLines={1}>
              {a.statToday}
            </Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <View style={styles.statIconWrap}>
                <Calendar size={22} color={Colors.primary} strokeWidth={2.25} />
              </View>
              <Text style={styles.statValue}>{stats.weekCount}</Text>
            </View>
            <Text style={styles.statLabel} numberOfLines={1}>
              {a.statWeek}
            </Text>
          </View>
        </View>

        {tab === 'today' ? (
          <View style={styles.periodTabBar}>
            {periodTabs.map(({ key, label, badge, Icon }) => {
              const active = periodTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.periodTab, active && styles.periodTabActive]}
                  onPress={() => setPeriodTab(key)}
                  activeOpacity={0.8}
                >
                  <Icon
                    size={15}
                    color={active ? Colors.primary : Colors.text.secondary}
                    strokeWidth={2.25}
                  />
                  <Text style={[styles.periodTabText, active && styles.periodTabTextActive]}>
                    {label}
                  </Text>
                  {badge > 0 && (
                    <View style={[styles.periodTabCount, active && styles.periodTabCountActive]}>
                      <Text
                        style={[
                          styles.periodTabCountText,
                          active && styles.periodTabCountTextActive,
                        ]}
                      >
                        {badge}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        )}

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Search size={16} color={Colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={a.searchPlaceholder}
              placeholderTextColor={Colors.text.disabled}
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>{emptyMessage}</Text>
        ) : (
          filtered.map((row) => (
            <TouchableOpacity
              key={row.id}
              style={styles.rowCard}
              onPress={() => setSelected(row)}
              activeOpacity={0.85}
            >
              <UserAvatar
                avatarPath={row.profiles?.avatar_path}
                avatarUpdatedAt={row.profiles?.avatar_updated_at}
                prenom={row.profiles?.prenom}
                nom={row.profiles?.nom}
                role="ouvrier"
                size={44}
              />
              <View style={styles.rowCopy}>
                <Text style={styles.rowName}>{profileName(row.profiles)}</Text>
                <Text style={styles.rowPeriod}>
                  {formatAbsencePeriodLabel(row.date_debut, row.date_fin, dateLocale)}
                </Text>
                <Text style={styles.rowMeta} numberOfLines={1}>
                  {getAbsenceReason(row.commentaire)} · {formatAbsenceDuration(row.date_debut, row.date_fin, t)}
                </Text>
              </View>
              <View style={styles.rowPill}>
                <Text style={styles.rowPillText}>
                  {isAbsenceUpcoming(row, todayKey) ? a.statusAbsent : a.statusCompleted}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setSelected(null)}>
          <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            {selected && (
              <>
                <View style={styles.modalHeader}>
                  <UserAvatar
                    avatarPath={selected.profiles?.avatar_path}
                    avatarUpdatedAt={selected.profiles?.avatar_updated_at}
                    prenom={selected.profiles?.prenom}
                    nom={selected.profiles?.nom}
                    role="ouvrier"
                    size={52}
                  />
                  <View style={styles.modalHeaderCopy}>
                    <Text style={styles.modalName}>{profileName(selected.profiles)}</Text>
                    <Text style={styles.modalMatricule}>{selected.profiles?.matricule ?? '—'}</Text>
                  </View>
                </View>
                <View style={styles.modalCard}>
                  <Calendar size={18} color={Colors.primary} />
                  <View style={styles.modalCardCopy}>
                    <Text style={styles.modalPeriod}>
                      {formatAbsencePeriodLabel(selected.date_debut, selected.date_fin, dateLocale)}
                    </Text>
                    <Text style={styles.modalMeta}>
                      {getAbsenceReason(selected.commentaire)} · {formatAbsenceDuration(selected.date_debut, selected.date_fin, t)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.modalClose} onPress={() => setSelected(null)}>
                  <Text style={styles.modalCloseText}>{a.cancel}</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  headerOverlay: {
    paddingBottom: 0,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.58)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 20,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  content: {
    padding: 16,
    paddingTop: 12,
    gap: 14,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabActive: {
    backgroundColor: '#FFF7F2',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  tabTextActive: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
  tabCount: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 4,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text.secondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  periodTabBar: {
    flexDirection: 'row',
    gap: 8,
  },
  periodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  periodTabActive: {
    backgroundColor: '#FFF',
    borderColor: 'rgba(255, 107, 53, 0.22)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  periodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  periodTabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  periodTabCount: {
    backgroundColor: Colors.primary + '18',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  periodTabCountActive: {
    backgroundColor: Colors.primary + '22',
  },
  periodTabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  periodTabCountTextActive: {
    color: Colors.primary,
  },
  loader: {
    marginVertical: 16,
  },
  empty: {
    fontSize: 14,
    color: Colors.text.disabled,
    fontStyle: 'italic',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    padding: 14,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  rowPeriod: {
    marginTop: 2,
    fontSize: 13,
    color: Colors.text.primary,
  },
  rowMeta: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  rowPill: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rowPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  modalSheet: {
    backgroundColor: '#FFF7F2',
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalHeaderCopy: {
    flex: 1,
  },
  modalName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  modalMatricule: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  modalCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    padding: 14,
  },
  modalCardCopy: {
    flex: 1,
    gap: 4,
  },
  modalPeriod: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalMeta: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  modalComment: {
    marginTop: 6,
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  modalClose: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
});
