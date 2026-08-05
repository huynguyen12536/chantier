import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  BadgeCheck,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  MapPin,
  Search,
  X,
  XCircle,
} from 'lucide-react-native';
import { ValidationNotificationBell } from '@/components/common/ValidationNotificationBell';
import { Colors } from '@/constants/colors';
import { DesktopSelect } from './DesktopSelect';
import { desktopHeaderStyles, desktopTableStyles, desktopTheme } from './glassStyles';

export const VALIDATION_DESKTOP_PAGE_SIZE = 20;

export type ValidationDesktopStatus = 'pending' | 'all' | 'approved' | 'cancelled';

export type ValidationDesktopWorksiteItem = {
  id: string;
  name: string;
  code: string;
  blocked?: boolean;
  badgeCount?: number;
  selected: boolean;
  onSelect: () => void;
};

export type ValidationDesktopProps = {
  title: string;
  subtitle: string;
  showNotificationBell?: boolean;
  status: ValidationDesktopStatus;
  onStatusChange: (status: ValidationDesktopStatus) => void;
  pendingLabel: string;
  allLabel: string;
  approvedLabel: string;
  cancelledLabel: string;
  pendingCount: number;
  allCount: number;
  approvedCount: number;
  cancelledCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  selectPlaceholder?: string;
  worksites: ValidationDesktopWorksiteItem[];
  detailContent?: React.ReactNode;
  emptyText: string;
  emptyDetailText: string;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  showValidateFooter: boolean;
  validateLabel: string;
  validatingAll: boolean;
  onValidateAll: () => void;
  listTitle?: string;
};

export function ValidationDesktop({
  title,
  subtitle,
  showNotificationBell = true,
  status,
  onStatusChange,
  pendingLabel,
  allLabel,
  approvedLabel,
  cancelledLabel,
  pendingCount,
  allCount,
  approvedCount,
  cancelledCount,
  search,
  onSearchChange,
  searchPlaceholder,
  selectPlaceholder,
  worksites,
  detailContent,
  emptyText,
  emptyDetailText,
  page,
  totalPages,
  totalCount,
  onPageChange,
  showValidateFooter,
  validateLabel,
  validatingAll,
  onValidateAll,
  listTitle,
}: ValidationDesktopProps) {
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * VALIDATION_DESKTOP_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * VALIDATION_DESKTOP_PAGE_SIZE, totalCount);
  const selectedWorksite = worksites.find((w) => w.selected) ?? null;

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

      <View style={styles.toolbarPad}>
        <View style={[desktopHeaderStyles.searchToolbar, styles.toolbarRow]}>
          <DesktopSelect
            value={status}
            onChange={onStatusChange}
            placeholder={selectPlaceholder}
            minWidth={240}
            options={[
              { value: 'pending', label: pendingLabel, badge: pendingCount, Icon: Clock },
              { value: 'all', label: allLabel, badge: allCount, Icon: List },
              { value: 'approved', label: approvedLabel, badge: approvedCount, Icon: BadgeCheck },
              { value: 'cancelled', label: cancelledLabel, badge: cancelledCount, Icon: XCircle },
            ]}
          />

          <View style={[desktopHeaderStyles.searchBox, styles.searchBoxSoft]}>
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

      <View style={styles.splitPanel}>
        <View style={styles.listPane}>
          <View style={styles.listHeader}>
            <View style={styles.listHeaderAccent} />
            <Text style={styles.listHeaderTitle}>{listTitle ?? 'Worksites'}</Text>
            <View style={styles.listHeaderBadge}>
              <Text style={styles.listHeaderBadgeText}>{totalCount}</Text>
            </View>
          </View>

          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {worksites.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{emptyText}</Text>
              </View>
            ) : (
              worksites.map((worksite) => {
                const hasCount =
                  typeof worksite.badgeCount === 'number' && worksite.badgeCount > 0;
                return (
                  <TouchableOpacity
                    key={worksite.id}
                    style={[
                      styles.worksiteCard,
                      worksite.selected && styles.worksiteCardSelected,
                      worksite.blocked && styles.worksiteCardBlocked,
                    ]}
                    activeOpacity={0.85}
                    onPress={worksite.onSelect}
                  >
                    {worksite.selected ? <View style={styles.worksiteCardRail} /> : null}

                    <View
                      style={[
                        styles.worksiteIcon,
                        worksite.selected && styles.worksiteIconSelected,
                      ]}
                    >
                      <Building2 size={16} color={Colors.primary} strokeWidth={2.3} />
                    </View>

                    <View style={styles.worksiteCopy}>
                      <Text
                        style={[
                          styles.worksiteName,
                          worksite.selected && styles.worksiteNameSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {worksite.name}
                      </Text>
                      <View style={styles.worksiteMeta}>
                        <MapPin size={12} color="#9CA3AF" strokeWidth={2.2} />
                        <Text style={styles.worksiteCode} numberOfLines={1}>
                          {worksite.code}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.countBtn,
                        hasCount ? styles.countBtnActive : styles.countBtnEmpty,
                        worksite.selected && hasCount && styles.countBtnSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.countBtnText,
                          hasCount ? styles.countBtnTextActive : styles.countBtnTextMuted,
                          worksite.selected && hasCount && styles.countBtnTextOnPrimary,
                        ]}
                      >
                        {hasCount ? worksite.badgeCount : '—'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {totalPages > 1 ? (
            <View style={styles.listFooter}>
              <TouchableOpacity
                style={[
                  desktopTableStyles.pageBtn,
                  page <= 1 && desktopTableStyles.pageBtnDisabled,
                ]}
                disabled={page <= 1}
                onPress={() => onPageChange(page - 1)}
                activeOpacity={0.8}
              >
                <ChevronLeft size={16} color={desktopTheme.ink} strokeWidth={2.4} />
              </TouchableOpacity>

              <Text style={desktopTableStyles.pageMeta}>
                {rangeStart}–{rangeEnd} / {totalCount}
              </Text>

              <TouchableOpacity
                style={[
                  desktopTableStyles.pageBtn,
                  page >= totalPages && desktopTableStyles.pageBtnDisabled,
                ]}
                disabled={page >= totalPages}
                onPress={() => onPageChange(page + 1)}
                activeOpacity={0.8}
              >
                <ChevronRight size={16} color={desktopTheme.ink} strokeWidth={2.4} />
              </TouchableOpacity>
            </View>
          ) : null}

          {showValidateFooter ? (
            <View style={styles.worksitesActionBar}>
              <TouchableOpacity
                style={styles.validateButton}
                onPress={onValidateAll}
                disabled={validatingAll}
                activeOpacity={0.85}
              >
                {validatingAll ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Check size={17} color="#FFF" strokeWidth={2.5} />
                    <Text style={styles.validateButtonText} numberOfLines={1}>
                      {validateLabel}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={styles.detailPane}>
          <View style={styles.detailWrap}>
            {selectedWorksite ? (
              <View style={styles.detailTopBar}>
                <View style={styles.detailTopIcon}>
                  <Building2 size={15} color="#FFFFFF" strokeWidth={2.3} />
                </View>
                <View style={styles.detailTopCopy}>
                  <Text style={styles.detailTopTitle} numberOfLines={1}>
                    {selectedWorksite.name}
                  </Text>
                  <Text style={styles.detailTopCode} numberOfLines={1}>
                    {selectedWorksite.code}
                  </Text>
                </View>
                {typeof selectedWorksite.badgeCount === 'number' &&
                selectedWorksite.badgeCount > 0 ? (
                  <View style={styles.detailTopBadge}>
                    <Text style={styles.detailTopBadgeText}>{selectedWorksite.badgeCount}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <ScrollView
              style={styles.detailScroll}
              contentContainerStyle={[
                styles.detailScrollContent,
                !selectedWorksite && styles.detailEmptyContent,
              ]}
              showsVerticalScrollIndicator
            >
              {selectedWorksite && detailContent ? (
                <View style={styles.detailBody}>{detailContent}</View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <Building2 size={26} color={Colors.primary} strokeWidth={1.9} />
                  </View>
                  <Text style={[styles.emptyText, styles.emptyDetailText]}>{emptyDetailText}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  headerPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRowTight: {
    marginBottom: 10,
  },
  toolbarPad: {
    paddingHorizontal: 16,
    zIndex: 30,
    marginBottom: 2,
  },
  toolbarRow: {
    zIndex: 30,
    overflow: 'visible',
    marginBottom: 10,
  },
  searchBoxSoft: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E9F0',
  },
  splitPanel: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 1,
  },
  listPane: {
    width: 300,
    maxWidth: '34%',
    minWidth: 250,
    flexShrink: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    backgroundColor: '#FFFFFF',
  },
  listScrollContent: {
    padding: 8,
    gap: 6,
    flexGrow: 1,
  },
  worksiteCard: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EBEEF3',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  worksiteCardSelected: {
    borderColor: '#FFD0BC',
    backgroundColor: '#FFF8F4',
  },
  worksiteCardBlocked: {
    opacity: 0.78,
  },
  worksiteCardRail: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  worksiteIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E8ECF2',
  },
  worksiteIconSelected: {
    backgroundColor: '#FFF0EB',
    borderColor: '#FFD9C8',
  },
  worksiteCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  worksiteName: {
    fontSize: 14,
    fontWeight: '700',
    color: desktopTheme.ink,
  },
  worksiteNameSelected: {
    color: '#9A3412',
  },
  worksiteMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  worksiteCode: {
    flex: 1,
    fontSize: 12,
    color: '#8B93A7',
    fontWeight: '500',
  },
  countBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBtnActive: {
    backgroundColor: '#FFF0EB',
    borderWidth: 1,
    borderColor: '#FFD9C8',
  },
  countBtnEmpty: {
    backgroundColor: '#F3F4F6',
  },
  countBtnSelected: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  countBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  countBtnTextActive: {
    color: '#C2410C',
  },
  countBtnTextMuted: {
    color: '#9CA3AF',
  },
  countBtnTextOnPrimary: {
    color: '#FFFFFF',
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F6',
    backgroundColor: '#FFFFFF',
  },
  worksitesActionBar: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8F5E9',
    backgroundColor: '#F7FBF8',
  },
  validateButton: {
    minHeight: 42,
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  detailPane: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },
  detailWrap: {
    flex: 1,
    minHeight: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E9F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  detailTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
  },
  detailTopIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  detailTopCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  detailTopTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailTopCode: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
  },
  detailTopBadge: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  detailTopBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  detailScroll: {
    flex: 1,
    minHeight: 0,
    backgroundColor: '#FFFFFF',
  },
  detailScrollContent: {
    flexGrow: 1,
  },
  detailBody: {
    padding: 10,
    gap: 8,
  },
  detailEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0EB',
    borderWidth: 1,
    borderColor: '#FFD9C8',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyDetailText: {
    maxWidth: 260,
  },
});
