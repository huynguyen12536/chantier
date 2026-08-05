import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import {
  Calendar,
  CalendarClock,
  Search,
  User,
  X,
} from 'lucide-react-native';
import { ValidationNotificationBell } from '@/components/common/ValidationNotificationBell';
import { UserAvatar } from '@/components/common/UserAvatar';
import { Colors } from '@/constants/colors';
import { DesktopSelect } from './DesktopSelect';
import { desktopHeaderStyles, desktopTheme } from './glassStyles';

const absenceTodayArtwork = require('../../assets/images/absence-stat-today.png');
const absenceWeekArtwork = require('../../assets/images/absence-stat-week.png');

export type TeamAbsencesDesktopFilter = 'day' | 'week' | 'upcoming' | 'history';

type TabIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export type TeamAbsencesDesktopFilterItem = {
  key: TeamAbsencesDesktopFilter;
  label: string;
  badge: number;
  Icon: TabIcon;
};

export type TeamAbsencesDesktopRow = {
  id: string;
  name: string;
  periodLabel: string;
  metaLabel: string;
  statusLabel: string;
  statusUpcoming: boolean;
  avatarPath?: string | null;
  avatarUpdatedAt?: string | null;
  prenom?: string | null;
  nom?: string | null;
  onPress: () => void;
};

export type TeamAbsencesDesktopProps = {
  title: string;
  subtitle: string;
  showNotificationBell?: boolean;
  todayCount: number;
  weekCount: number;
  todayStatLabel: string;
  weekStatLabel: string;
  filter: TeamAbsencesDesktopFilter;
  onFilterChange: (filter: TeamAbsencesDesktopFilter) => void;
  filterOptions: TeamAbsencesDesktopFilterItem[];
  sectionTitle: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  loading: boolean;
  emptyText: string;
  items: TeamAbsencesDesktopRow[];
  listTitle: string;
};

export function TeamAbsencesDesktop({
  title,
  subtitle,
  showNotificationBell = true,
  todayCount,
  weekCount,
  todayStatLabel,
  weekStatLabel,
  filter,
  onFilterChange,
  filterOptions,
  sectionTitle: _sectionTitle,
  search,
  onSearchChange,
  searchPlaceholder,
  loading,
  emptyText,
  items,
  listTitle,
}: TeamAbsencesDesktopProps) {
  return (
    <View style={styles.page}>
      <View style={styles.headerPad}>
        <View style={[desktopHeaderStyles.headerRow, styles.headerRowTight]}>
          <View style={desktopHeaderStyles.headerCopy}>
            <Text style={desktopHeaderStyles.title}>{title}</Text>
            <Text style={desktopHeaderStyles.subtitle}>{subtitle}</Text>
          </View>
          <View style={desktopHeaderStyles.headerActions}>
            {showNotificationBell ? <ValidationNotificationBell variant="accent" /> : null}
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statToday]}>
          <Image
            source={absenceTodayArtwork}
            style={styles.statArtwork}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.statOverlay}>
            <View style={[styles.statIcon, styles.statIconToday]}>
              <User size={18} color={desktopTheme.stats.declarations.color} strokeWidth={2.35} />
            </View>
            <View style={styles.statCopy}>
              <Text style={styles.statValue} numberOfLines={1}>
                {todayCount}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {todayStatLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.statCard, styles.statWeek]}>
          <Image
            source={absenceWeekArtwork}
            style={styles.statArtwork}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.statOverlay}>
            <View style={[styles.statIcon, styles.statIconWeek]}>
              <Calendar size={18} color={desktopTheme.stats.hours.color} strokeWidth={2.35} />
            </View>
            <View style={styles.statCopy}>
              <Text style={styles.statValue} numberOfLines={1}>
                {weekCount}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {weekStatLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.toolbarPad}>
        <View style={[desktopHeaderStyles.searchToolbar, styles.toolbarRow]}>
          <DesktopSelect
            value={filter}
            onChange={onFilterChange}
            minWidth={220}
            options={filterOptions.map(({ key, label, badge, Icon }) => ({
              value: key,
              label,
              badge: badge > 0 ? badge : undefined,
              Icon,
            }))}
          />

          <View style={[desktopHeaderStyles.searchBox, styles.searchBox]}>
            <Search size={16} color={Colors.text.secondary} />
            <TextInput
              style={desktopHeaderStyles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor={Colors.text.disabled}
              value={search}
              onChangeText={onSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 ? (
              <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={8}>
                <X size={16} color={Colors.text.secondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.listPanel}>
        <View style={styles.listHeader}>
          <View style={styles.listHeaderAccent} />
          <Text style={styles.listHeaderTitle}>{listTitle}</Text>
          <View style={styles.listHeaderBadge}>
            <Text style={styles.listHeaderBadgeText}>{items.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <CalendarClock size={24} color={Colors.primary} strokeWidth={2} />
                </View>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            ) : (
              items.map((row) => (
                <TouchableOpacity
                  key={row.id}
                  style={styles.rowCard}
                  onPress={row.onPress}
                  activeOpacity={0.85}
                >
                  <UserAvatar
                    avatarPath={row.avatarPath}
                    avatarUpdatedAt={row.avatarUpdatedAt}
                    prenom={row.prenom}
                    nom={row.nom}
                    role="ouvrier"
                    size={44}
                  />
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text style={styles.rowPeriod} numberOfLines={1}>
                      {row.periodLabel}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {row.metaLabel}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      row.statusUpcoming ? styles.statusUpcoming : styles.statusDone,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        row.statusUpcoming ? styles.statusUpcomingText : styles.statusDoneText,
                      ]}
                    >
                      {row.statusLabel}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    minHeight: 0,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  headerPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRowTight: {
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    height: 118,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    shadowColor: '#9A4A2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  statToday: {
    borderColor: desktopTheme.stats.declarations.border,
    backgroundColor: '#F7EFE6',
  },
  statWeek: {
    borderColor: desktopTheme.stats.hours.border,
    backgroundColor: '#EEF3F8',
  },
  statArtwork: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web'
      ? ({
          objectFit: 'cover',
          objectPosition: 'right center',
        } as object)
      : null),
  },
  statOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 14,
    zIndex: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    shadowColor: '#667085',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconToday: {
    borderColor: desktopTheme.stats.declarations.border,
  },
  statIconWeek: {
    borderColor: desktopTheme.stats.hours.border,
  },
  statCopy: {
    maxWidth: '52%',
    minWidth: 0,
    zIndex: 2,
  },
  statValue: {
    color: '#070B14',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    color: '#5E6677',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 2,
  },
  toolbarPad: {
    paddingHorizontal: 16,
    marginBottom: 12,
    zIndex: 40,
    overflow: 'visible',
  },
  toolbarRow: {
    marginBottom: 0,
    zIndex: 40,
    overflow: 'visible',
  },
  searchBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E9F0',
  },
  listPanel: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.78)',
    overflow: 'hidden',
    zIndex: 1,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        } as object)
      : null),
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFF7F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0D1',
  },
  listHeaderAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  listHeaderTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#9A3412',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listHeaderBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  listHeaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  listScroll: {
    flex: 1,
    minHeight: 0,
  },
  listScrollContent: {
    padding: 10,
    gap: 8,
    flexGrow: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: desktopTheme.primarySoft,
    borderWidth: 1,
    borderColor: desktopTheme.primarySoftBorder,
  },
  emptyText: {
    color: desktopTheme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowName: {
    color: desktopTheme.ink,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  rowPeriod: {
    color: '#9A3412',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  rowMeta: {
    color: desktopTheme.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexShrink: 0,
  },
  statusUpcoming: {
    backgroundColor: desktopTheme.primarySoft,
  },
  statusDone: {
    backgroundColor: '#EAF8F0',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusUpcomingText: {
    color: '#C2410C',
  },
  statusDoneText: {
    color: '#15803D',
  },
});
