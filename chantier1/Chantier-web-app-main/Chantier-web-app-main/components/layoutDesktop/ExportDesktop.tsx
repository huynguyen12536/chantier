import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  ImageBackground,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  CalendarDays,
  CalendarRange,
  Download,
  Info,
} from 'lucide-react-native';
import { ValidationNotificationBell } from '@/components/common/ValidationNotificationBell';
import { Colors } from '@/constants/colors';
import { desktopHeaderStyles } from './glassStyles';

const statArtwork = {
  total: require('../../assets/images/export-stat-declarations.png'),
  validees: require('../../assets/images/export-stat-approved.png'),
  pending: require('../../assets/images/export-stat-pending.png'),
  hours: require('../../assets/images/export-stat-hours.png'),
} as const;

const instructionsFlowArtwork = require('../../assets/images/export-instructions-flow-transparent.png');

const ACCENT = '#FF5B24';
const INK = '#0E1320';
const MUTED = '#677084';
const BRAND_BLACK = '#111111';

export type ExportDesktopStatItem = {
  key: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color: string;
  bg: string;
  border?: string;
  value: string;
  label: string;
  unit?: string;
};

export type ExportDesktopProps = {
  title: string;
  subtitle: string;
  showNotificationBell: boolean;
  isChef: boolean;
  stats: ExportDesktopStatItem[];
  onSelectPeriod: (period: 'week' | 'month') => void;
  loading: boolean;
  loadingPeriod?: 'week' | 'month' | null;
  onExport: (period: 'week' | 'month') => void;
  periodLabels: { week: string; month: string };
  exportPeriodTitle: string;
  exportInfo: string;
  exportFormat: string;
  exportButton: string;
  instructionsTitle: string;
  instructions: string[];
  legendTitle: string;
  legendItems: string[];
};

function getStatArtwork(key: string) {
  return statArtwork[key as keyof typeof statArtwork] ?? statArtwork.total;
}

export function ExportDesktop({
  title,
  subtitle,
  showNotificationBell,
  isChef,
  stats,
  onSelectPeriod,
  loading,
  loadingPeriod = null,
  onExport,
  periodLabels,
  exportPeriodTitle,
  exportInfo,
  exportFormat,
  exportButton,
  instructionsTitle,
  instructions,
  legendTitle,
  legendItems,
}: ExportDesktopProps) {
  const sideItems = isChef ? legendItems : instructions;
  const sideTitle = isChef ? legendTitle : instructionsTitle;

  return (
    <View style={styles.page}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={desktopHeaderStyles.headerRow}>
          <View style={desktopHeaderStyles.headerCopy}>
            <Text style={desktopHeaderStyles.title}>{title}</Text>
            <Text style={desktopHeaderStyles.subtitle}>{subtitle}</Text>
          </View>

          <View style={desktopHeaderStyles.headerActions}>
            {showNotificationBell ? (
              <ValidationNotificationBell variant="accent" />
            ) : (
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
                <Bell size={21} color="#FFF" strokeWidth={2.2} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((item) => (
            <ImageBackground
              key={item.key}
              source={getStatArtwork(item.key)}
              resizeMode="cover"
              style={[
                styles.statCard,
                {
                  borderColor: item.border ?? item.bg,
                },
              ]}
              imageStyle={styles.statCardImage}
            >
              <View style={styles.statOverlay}>
                <View style={[styles.statIcon, { borderColor: item.border ?? item.bg }]}>
                  <item.Icon size={22} color={item.color} strokeWidth={2.35} />
                </View>

                <View style={styles.statCopy}>
                  <View style={styles.statValueRow}>
                    <Text style={styles.statValue} numberOfLines={1}>
                      {item.value}
                    </Text>
                    {item.unit ? <Text style={styles.statUnit}>{item.unit}</Text> : null}
                  </View>
                  <Text style={styles.statLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          ))}
        </View>

        <View style={styles.panelsRow}>
          {!isChef ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{exportPeriodTitle}</Text>

              <View style={styles.periodCards}>
                <View style={styles.periodCard}>
                  <View style={styles.periodCardHeader}>
                    <View style={styles.periodCardIcon}>
                      <CalendarDays size={22} color={ACCENT} strokeWidth={2.2} />
                    </View>
                    <Text style={styles.periodCardTitle}>{periodLabels.week}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.periodExportButton,
                      loading && loadingPeriod === 'week' && styles.exportButtonDisabled,
                    ]}
                    onPress={() => {
                      onSelectPeriod('week');
                      onExport('week');
                    }}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#FF743D', ACCENT, '#F04410']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.periodExportButtonGradient}
                    >
                      {loading && loadingPeriod === 'week' ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <>
                          <Download size={20} color="#FFF" strokeWidth={2.4} />
                          <Text style={styles.periodExportButtonText}>{exportButton}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={styles.periodCard}>
                  <View style={styles.periodCardHeader}>
                    <View style={styles.periodCardIcon}>
                      <CalendarRange size={22} color={ACCENT} strokeWidth={2.2} />
                    </View>
                    <Text style={styles.periodCardTitle}>{periodLabels.month}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.periodExportButton,
                      loading && loadingPeriod === 'month' && styles.exportButtonDisabled,
                    ]}
                    onPress={() => {
                      onSelectPeriod('month');
                      onExport('month');
                    }}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#FF743D', ACCENT, '#F04410']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.periodExportButtonGradient}
                    >
                      {loading && loadingPeriod === 'month' ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <>
                          <Download size={20} color="#FFF" strokeWidth={2.4} />
                          <Text style={styles.periodExportButtonText}>{exportButton}</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoBox}>
                <View style={styles.infoIcon}>
                  <Info size={18} color="#2F80ED" strokeWidth={2.5} />
                </View>
                <View style={styles.infoCopy}>
                  <Text style={styles.infoText}>{exportInfo}</Text>
                  <Text style={styles.infoTextMuted}>{exportFormat}</Text>
                </View>
              </View>
            </View>
          ) : null}

          <View style={[styles.panel, isChef && styles.panelFull]}>
            <Text style={styles.panelTitle}>{sideTitle}</Text>

            <View style={styles.instructions}>
              {sideItems.map((item, idx) => {
                const isLast = idx === sideItems.length - 1;
                return (
                  <View key={`${sideTitle}-${idx}`} style={styles.instructionItem}>
                    <View style={styles.instructionTrack}>
                      <View style={styles.instructionNumber}>
                        <Text style={styles.instructionNumberText}>{idx + 1}</Text>
                      </View>
                      {!isLast ? <View style={styles.instructionLine} /> : null}
                    </View>
                    <Text style={[styles.instructionText, !isLast && styles.instructionTextSpaced]}>
                      {item}
                    </Text>
                  </View>
                );
              })}
            </View>

            {!isChef ? (
              <View style={styles.exportFlow}>
                <Image
                  source={instructionsFlowArtwork}
                  resizeMode="contain"
                  style={styles.exportFlowImage}
                  accessibilityLabel="Export workflow illustration"
                />
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACCENT,
    borderWidth: 1,
    borderColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 22,
    width: '100%',
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 188,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#9A4A2A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  statCardImage: {
    borderRadius: 22,
    width: '100%',
    height: '100%',
  },
  statOverlay: {
    flex: 1,
    minHeight: 188,
    paddingTop: 18,
    paddingBottom: 20,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#667085',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  statCopy: {
    maxWidth: '55%',
    zIndex: 2,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statValue: {
    color: '#070B14',
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    color: '#252B37',
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: '#5E6677',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 4,
  },
  panelsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 20,
    width: '100%',
  },
  panel: {
    flex: 1,
    minWidth: 0,
    minHeight: 410,
    overflow: 'hidden',
    borderRadius: 28,
    borderWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          outlineWidth: 0,
          outlineStyle: 'none',
        } as object)
      : null),
  },
  panelFull: {
    flex: 1,
  },
  panelTitle: {
    color: INK,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '900',
    marginBottom: 16,
  },
  periodCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  periodCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  periodCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  periodCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF0EB',
    borderWidth: 1,
    borderColor: '#FFD5C4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodCardTitle: {
    color: INK,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  periodExportButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  periodExportButtonGradient: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  periodExportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DCEBFF',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  infoIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  infoText: {
    color: '#1D67D8',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  infoTextMuted: {
    color: '#5E6677',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  exportButtonDisabled: {
    opacity: 0.62,
  },
  instructions: {
    gap: 0,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },
  instructionTrack: {
    width: 28,
    alignItems: 'center',
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#FF5B24',
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.42,
    shadowRadius: 8,
    elevation: 5,
    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '2px 6px 14px rgba(255, 91, 36, 0.38), 0 2px 4px rgba(255, 91, 36, 0.22)',
        }
      : null),
  },
  instructionNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  instructionLine: {
    width: 1.5,
    flexGrow: 1,
    minHeight: 18,
    marginTop: 4,
    marginBottom: 2,
    borderRadius: 999,
    backgroundColor: '#FFD5C4',
  },
  instructionText: {
    flex: 1,
    color: '#262B36',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    paddingTop: 3,
  },
  instructionTextSpaced: {
    paddingBottom: 18,
  },
  exportFlow: {
    marginTop: 'auto',
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  exportFlowImage: {
    width: '118%',
    height: 236,
    marginLeft: -22,
    marginRight: -22,
  },
});
