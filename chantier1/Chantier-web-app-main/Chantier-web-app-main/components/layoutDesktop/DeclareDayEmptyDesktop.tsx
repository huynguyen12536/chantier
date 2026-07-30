import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  ImageBackground,
  Platform,
} from 'react-native';
import {
  Building2,
  CalendarX2,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  UtensilsCrossed,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { isShiftEditable, type LineStatut } from '@/utils/status';
import { DesktopBackground } from './DesktopBackground';
import { DesktopPageHeader } from './DesktopPageHeader';

const ACCENT = '#FF5B24';
const INK = '#0E1320';
const MUTED = '#677084';
const GRID_GAP = 14;
/** Fixed card size — không co giãn theo chiều rộng trang. */
const CARD_WIDTH = 248;
const CARD_HEIGHT = 380;

const bgApproved = require('../../assets/images/bg-03.png');
const bgPending = require('../../assets/images/bg (2).png');

const STATUT_COLORS: Record<LineStatut, string> = {
  validee: '#22C55E',
  attente: '#F97316',
  rejetee: '#EF4444',
  annulee: '#94A3B8',
  draft: '#9CA3AF',
};

export type DeclareDayEmptyDesktopShift = {
  id: string;
  chantierLabel: string;
  heureDebut: string;
  heureFin: string;
  panierRepas: boolean;
  deplacement: boolean;
  statut: LineStatut;
  statutLabel: string;
  chantierPending?: boolean;
};

export type DeclareDayEmptyDesktopProps = {
  title: string;
  subtitle: string;
  onBack: () => void;
  backLabel: string;
  onPreviousDay: () => void;
  onNextDay: () => void;
  previousDayLabel: string;
  nextDayLabel: string;
  canNavigateDay: boolean;
  loading: boolean;
  shifts: DeclareDayEmptyDesktopShift[];
  mealLabel: string;
  displacementLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  addCta: string;
  editCta: string;
  onAddShift: () => void;
  onEditShift: (shiftId: string) => void;
};

function MobileStyleShiftCard({
  shift,
  mealLabel,
  displacementLabel,
  onEdit,
}: {
  shift: DeclareDayEmptyDesktopShift;
  mealLabel: string;
  displacementLabel: string;
  onEdit: () => void;
}) {
  const editable = isShiftEditable(shift.statut);
  const isApproved = shift.statut === 'validee';
  const cardBackground = isApproved ? bgApproved : bgPending;

  const card = (
    <ImageBackground
      source={cardBackground}
      style={[styles.shiftCard, shift.chantierPending && styles.shiftCardPending]}
      imageStyle={styles.shiftCardImage}
      resizeMode="cover"
    >
      <View style={styles.shiftCardBody}>
        <View style={styles.shiftCardHeader}>
          <View style={[styles.statutBadge, { backgroundColor: STATUT_COLORS[shift.statut] }]}>
            <Text style={styles.statutBadgeText}>{shift.statutLabel}</Text>
          </View>
        </View>

        <View style={styles.shiftChantierRow}>
          <Building2 size={18} color={Colors.secondary} strokeWidth={2.4} />
          <Text style={styles.shiftChantier} numberOfLines={2}>
            {shift.chantierLabel}
          </Text>
        </View>

        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <View style={styles.leadingIcon}>
              <Clock size={16} color="#10B981" strokeWidth={2} />
            </View>
            <Text style={styles.hoursLine}>
              {shift.heureDebut} → {shift.heureFin}
            </Text>
          </View>

          {shift.panierRepas ? (
            <View style={styles.detailRow}>
              <View style={styles.leadingIcon}>
                <View style={styles.optionCheck}>
                  <Check size={12} color="#FFF" strokeWidth={3} />
                </View>
              </View>
              <UtensilsCrossed size={16} color="#10B981" strokeWidth={2.2} />
              <Text style={styles.optionText}>{mealLabel}</Text>
            </View>
          ) : null}

          {shift.deplacement ? (
            <View style={styles.detailRow}>
              <View style={styles.leadingIcon}>
                <View style={styles.optionCheck}>
                  <Check size={12} color="#FFF" strokeWidth={3} />
                </View>
              </View>
              <Car size={16} color="#10B981" strokeWidth={2.2} />
              <Text style={styles.optionText}>{displacementLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </ImageBackground>
  );

  if (editable) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onEdit} style={styles.cardHit}>
        {card}
      </TouchableOpacity>
    );
  }

  return <View style={styles.cardHit}>{card}</View>;
}

export function DeclareDayEmptyDesktop({
  title,
  subtitle,
  onBack,
  backLabel,
  onPreviousDay,
  onNextDay,
  previousDayLabel,
  nextDayLabel,
  canNavigateDay,
  loading,
  shifts,
  mealLabel,
  displacementLabel,
  emptyTitle,
  emptyDescription,
  addCta,
  onAddShift,
  onEditShift,
}: DeclareDayEmptyDesktopProps) {
  const dayNavBtn = (delta: -1 | 1, label: string) => (
    <TouchableOpacity
      onPress={delta < 0 ? onPreviousDay : onNextDay}
      style={[styles.dayNavBtn, !canNavigateDay && styles.dayNavBtnDisabled]}
      disabled={!canNavigateDay}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.85}
    >
      {delta < 0 ? (
        <ChevronLeft size={18} color="#FFF" strokeWidth={2.5} />
      ) : (
        <ChevronRight size={18} color="#FFF" strokeWidth={2.5} />
      )}
    </TouchableOpacity>
  );

  return (
    <DesktopBackground style={styles.page}>
      <View style={styles.headerPad}>
        <DesktopPageHeader
          title={title}
          subtitle={subtitle}
          onBack={onBack}
          backLabel={backLabel}
          titleLeading={dayNavBtn(-1, previousDayLabel)}
          titleTrailing={dayNavBtn(1, nextDayLabel)}
        />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <View style={styles.body}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {shifts.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <CalendarX2 size={36} color="#D8B9A9" strokeWidth={1.8} />
                </View>
                <Text style={styles.emptyTitle}>{emptyTitle}</Text>
                <Text style={styles.emptyDescription}>{emptyDescription}</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {shifts.map((shift) => (
                  <MobileStyleShiftCard
                    key={shift.id}
                    shift={shift}
                    mealLabel={mealLabel}
                    displacementLabel={displacementLabel}
                    onEdit={() => onEditShift(shift.id)}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.addBtn} onPress={onAddShift} activeOpacity={0.88}>
              <Plus size={18} color="#FFF" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>{addCta}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </DesktopBackground>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    backgroundColor: 'transparent',
  },
  headerPad: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  dayNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dayNavBtnDisabled: {
    opacity: 0.4,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    width: '100%',
    minHeight: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    paddingBottom: 12,
    flexGrow: 1,
  },
  cardHit: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    flexGrow: 0,
    flexShrink: 0,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    gap: GRID_GAP,
  },
  shiftCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  shiftCardPending: {
    opacity: 0.7,
  },
  shiftCardImage: {
    borderRadius: 22,
  },
  shiftCardBody: {
    flex: 1,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    padding: 16,
    gap: 12,
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statutBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statutBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  shiftChantierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shiftChantier: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
    lineHeight: 21,
  },
  detailsBox: {
    marginTop: 'auto',
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        } as object)
      : null),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leadingIcon: {
    width: 22,
    alignItems: 'center',
  },
  hoursLine: {
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  optionCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '700',
    color: MUTED,
  },
  emptyCard: {
    width: '100%',
    marginTop: 32,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 48,
    paddingHorizontal: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    backgroundColor: Platform.OS === 'web' ? 'rgba(255,255,255,0.78)' : '#FFFFFF',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: INK,
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    width: '100%',
    paddingTop: 12,
  },
  addBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: ACCENT,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
