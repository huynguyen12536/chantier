import { StyleSheet, type ViewStyle, type ImageSourcePropType } from 'react-native';
import { Colors } from '@/constants/colors';

/** Palette desktop app — nền trang dùng ảnh `desktopBackgroundImage`. */
export const desktopTheme = {
  pageBg: '#FFFFFF',
  sidebarBg: 'transparent',
  cardBg: 'transparent',
  cardBorder: '#E8ECF2',
  warmBorder: '#E8ECF2',
  textPrimary: Colors.text.primary,
  textSecondary: '#6B7280',
  textMuted: '#8A8A8A',
  primary: Colors.primary,
  primarySoft: '#FFF0EB',
  primarySoftBorder: '#FFD9C8',
  ink: '#0E1320',
  stats: {
    declarations: { bg: '#FFF0EB', border: '#FFD9C8', color: '#FF6B35', iconBg: '#FFFFFF' },
    approved: { bg: '#EAF8F0', border: '#C6EBD5', color: '#10B981', iconBg: '#FFFFFF' },
    pending: { bg: '#FFF6E8', border: '#FFE0B2', color: '#F59E0B', iconBg: '#FFFFFF' },
    hours: { bg: '#EEF4FF', border: '#D0DFFF', color: '#3B82F6', iconBg: '#FFFFFF' },
  },
  infoBg: '#FFF0EB',
  infoText: '#C2410C',
  infoTextMuted: '#9A3412',
  periodInactiveBg: '#F8FAFC',
  periodActiveBg: '#FFF0EB',
} as const;

/** Ảnh nền chung cho toàn bộ layout desktop. */
export const desktopBackgroundImage: ImageSourcePropType = require('../../assets/images/bg-destop.png');

export const glassSurface = (opts?: {
  backgroundColor?: string;
  borderColor?: string;
  radius?: number;
  shadow?: boolean;
  blur?: number;
}): ViewStyle => ({
  overflow: 'hidden',
  borderRadius: opts?.radius ?? 28,
  borderWidth: 1,
  borderColor: opts?.borderColor ?? desktopTheme.cardBorder,
  backgroundColor: opts?.backgroundColor ?? desktopTheme.cardBg,
  ...(opts?.shadow === false
    ? {}
    : {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 3,
      }),
});

/** Header trang desktop — title/subtitle trái, actions phải (chuông…). */
export const desktopHeaderStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    gap: 10,
  },
  title: {
    color: desktopTheme.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: Colors.primary,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 2,
  },
  /** Hàng tìm kiếm + nút thêm (cùng dòng). */
  searchToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: desktopTheme.cardBorder,
  },
  filterChipActive: {
    backgroundColor: '#FFF0EB',
    borderColor: '#FFD5C4',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
  },
  filterChipBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  filterChipBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: desktopTheme.cardBorder,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: desktopTheme.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    flexShrink: 0,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export const desktopPageStyles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  main: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'transparent',
  },
  mainScroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
});

/** Bảng desktop — header cam, full chiều cao, scroll trong body. */
export const desktopTableStyles = StyleSheet.create({
  panel: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  wrap: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: desktopTheme.cardBorder,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.primary,
  },
  headCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  bodyContent: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F4F8',
    backgroundColor: '#FFFFFF',
  },
  cell: {
    fontSize: 14,
    color: desktopTheme.ink,
  },
  primaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: desktopTheme.ink,
  },
  mutedText: {
    fontSize: 13,
    color: desktopTheme.textSecondary,
  },
  userCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  iconTextCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  iconText: {
    flex: 1,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#FFE8DE',
    backgroundColor: '#FFF8F5',
  },
  pageBtn: {
    width: 36,
    height: 36,
    minWidth: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: desktopTheme.cardBorder,
  },
  pageBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: desktopTheme.ink,
  },
  pageBtnTextActive: {
    color: '#FFFFFF',
  },
  pageMeta: {
    fontSize: 13,
    fontWeight: '600',
    color: desktopTheme.textSecondary,
    marginHorizontal: 8,
  },
});
