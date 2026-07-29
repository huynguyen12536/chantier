import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Building2,
  CalendarX2,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  UtensilsCrossed,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/colors';
import { addDaysToDateKey, formatWeekDayLabelWithYear } from '@/utils/date';
import { declarationLookupKey, isShiftEditable, resolveLineStatut, type LineStatut } from '@/utils/status';
import { formatTime } from '@/utils/time';
import { supabase } from '@/services/supabase';
import { isBlockedByPendingDiversChantier } from '@/utils/chantierDivers';
import { alertIfAbsentDay } from '@/utils/ouvrierDeclaration';

const bgApproved = require('../assets/images/bg-03.png');
const bgPending = require('../assets/images/bg (2).png');

function resolveParam(value?: string | string[]): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

interface DayShift {
  id: string;
  chantierId: string;
  chantierNom: string;
  chantierCode: string;
  heureDebut: string;
  heureFin: string;
  panierRepas: boolean;
  deplacement: boolean;
  statut: LineStatut;
  chantierPending: boolean;
}

const STATUT_LABELS: Record<LineStatut, string> = {
  validee: 'Validée',
  attente: 'En attente',
  rejetee: 'Rejetée',
  annulee: 'Annulée',
  draft: 'Brouillon',
};

const STATUT_COLORS: Record<LineStatut, string> = {
  validee: '#22C55E',
  attente: '#F97316',
  rejetee: '#EF4444',
  annulee: '#94A3B8',
  draft: '#9CA3AF',
};

function ShiftCardPanel({
  shift,
  mealLabel,
  displacementLabel,
  cardHeight,
  onPress,
  editable,
}: {
  shift: DayShift;
  mealLabel: string;
  displacementLabel: string;
  cardHeight: number;
  onPress?: () => void;
  editable?: boolean;
}) {
  const chantierLabel =
    shift.chantierNom && shift.chantierCode && shift.chantierNom !== shift.chantierCode
      ? `${shift.chantierNom} (${shift.chantierCode})`
      : shift.chantierNom || shift.chantierCode || '—';

  const isApproved = shift.statut === 'validee';
  const cardBackground = isApproved ? bgApproved : bgPending;

  const card = (
    <ImageBackground
      source={cardBackground}
      style={[
        styles.shiftCard,
        { height: cardHeight, minHeight: cardHeight },
        shift.chantierPending && styles.shiftCardChantierPending,
      ]}
      imageStyle={styles.shiftCardImage}
      resizeMode="cover"
    >
      <View style={styles.shiftCardBody}>
        <View style={styles.shiftCardHeader}>
          <View style={[styles.statutBadge, { backgroundColor: STATUT_COLORS[shift.statut] }]}>
            <Text style={styles.statutBadgeText}>{STATUT_LABELS[shift.statut]}</Text>
          </View>
        </View>

        <View style={styles.shiftChantierRow}>
          <Building2 size={18} color={Colors.secondary} strokeWidth={2.4} />
          <Text style={styles.shiftChantier} numberOfLines={2}>
            {chantierLabel}
          </Text>
        </View>

        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <View style={styles.leadingIcon}>
              <Clock size={17} color="#10B981" strokeWidth={2} />
            </View>
            <Text style={styles.hoursLine}>
              {shift.heureDebut} → {shift.heureFin}
            </Text>
          </View>
          {shift.panierRepas && (
            <View style={styles.detailRow}>
              <View style={styles.leadingIcon}>
                <View style={styles.optionCheck}>
                  <Check size={13} color="#FFF" strokeWidth={3} />
                </View>
              </View>
              <UtensilsCrossed size={18} color="#10B981" strokeWidth={2.2} />
              <Text style={styles.optionText}>{mealLabel}</Text>
            </View>
          )}
          {shift.deplacement && (
            <View style={styles.detailRow}>
              <View style={styles.leadingIcon}>
                <View style={styles.optionCheck}>
                  <Check size={13} color="#FFF" strokeWidth={3} />
                </View>
              </View>
              <Car size={18} color="#10B981" strokeWidth={2.2} />
              <Text style={styles.optionText}>{displacementLabel}</Text>
            </View>
          )}
        </View>
      </View>
    </ImageBackground>
  );

  if (editable && onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {card}
      </TouchableOpacity>
    );
  }

  return card;
}

export default function DeclareDayEmptyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { t, dateLocale } = useLanguage();
  const params = useLocalSearchParams<{ date?: string; dayLabel?: string }>();

  const date = resolveParam(params.date);
  const dayLabel = date
    ? formatWeekDayLabelWithYear(date, dateLocale)
    : resolveParam(params.dayLabel);

  const [shifts, setShifts] = useState<DayShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [carouselHeight, setCarouselHeight] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const isCompactLayout = windowWidth < 768;
  const pageIndexRef = useRef(0);
  const shiftsLengthRef = useRef(0);

  const loadShifts = useCallback(async () => {
    if (!profile?.id || !date) {
      setShifts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [periodsRes, declRes] = await Promise.all([
        supabase
          .from('periodes_travail')
          .select(
            'id, heure_debut, heure_fin, statut, chantier_id, panier_repas, deplacement, chantiers(nom, code, source, divers_statut)',
          )
          .eq('user_id', profile.id)
          .eq('date', date)
          .order('heure_debut', { ascending: true }),
        supabase
          .from('declarations_heures')
          .select('chantier_id, date, statut')
          .eq('user_id', profile.id)
          .eq('date', date),
      ]);

      if (periodsRes.error) throw periodsRes.error;

      const declByKey = new Map<string, string>();
      for (const row of declRes.data || []) {
        declByKey.set(
          declarationLookupKey(row.chantier_id as string, row.date as string),
          row.statut as string,
        );
      }

      const rows: DayShift[] = (periodsRes.data || []).map((period) => {
        const chantier = period.chantiers as {
          nom?: string;
          code?: string;
          source?: string;
          divers_statut?: string;
        } | null;
        const nom = chantier?.nom?.trim() ?? '';
        const code = chantier?.code?.trim() ?? '';
        const chantierPending = isBlockedByPendingDiversChantier(
          chantier?.source as 'standard' | 'divers' | undefined,
          chantier?.divers_statut as 'en_attente' | 'approuve' | 'rejete' | undefined,
        );
        return {
          id: period.id as string,
          chantierId: period.chantier_id as string,
          chantierNom: nom,
          chantierCode: code,
          heureDebut: period.heure_debut ? formatTime(period.heure_debut as string) : '—',
          heureFin: period.heure_fin ? formatTime(period.heure_fin as string) : '—',
          panierRepas: Boolean(period.panier_repas),
          deplacement: Boolean(period.deplacement),
          statut: resolveLineStatut(
            period.statut as string,
            period.chantier_id as string,
            date,
            declByKey,
          ),
          chantierPending,
        };
      });

      setShifts(rows);
    } catch (error) {
      console.error('Error loading day shifts:', error);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, date]);

  useEffect(() => {
    void loadShifts();
  }, [loadShifts]);

  useEffect(() => {
    setPageIndex(0);
  }, [shifts.length, date]);

  useFocusEffect(
    useCallback(() => {
      void loadShifts();
    }, [loadShifts]),
  );

  const hasShifts = shifts.length > 0;
  const currentShift = shifts[pageIndex];
  const canEditCurrentShift = Boolean(currentShift && isShiftEditable(currentShift.statut));

  const openEditShift = (shift: DayShift) => {
    if (!isShiftEditable(shift.statut)) return;
    router.push({
      pathname: '/declare-day',
      params: {
        date,
        dayLabel,
        editMode: '1',
        periodId: shift.id,
        chantierId: shift.chantierId,
        heureDebut: shift.heureDebut,
        heureFin: shift.heureFin,
        panierRepas: shift.panierRepas ? '1' : '0',
        deplacement: shift.deplacement ? '1' : '0',
      },
    });
  };

  /** First shift of an empty day — Meal + Travel default ON in declare-day. */
  const openFirstShift = async () => {
    if (!profile?.id) return;
    if (await alertIfAbsentDay(profile.id, date, {
      title: t.common.error,
      message: t.absences.errors.dayAlreadyAbsent,
    })) return;
    router.push({
      pathname: '/declare-day',
      params: { date, dayLabel },
    });
  };

  const openAddShift = async () => {
    if (!profile?.id) return;
    if (await alertIfAbsentDay(profile.id, date, {
      title: t.common.error,
      message: t.absences.errors.dayAlreadyAbsent,
    })) return;
    // Extra slot (2nd+): start at previous shift end; no end suggestion; allowances off.
    const previousEnd =
      shifts.length > 0
        ? shifts.reduce((latest, shift) => {
            if (!shift.heureFin || shift.heureFin === '—') return latest;
            if (!latest) return shift.heureFin;
            const [lh, lm] = latest.split(':').map(Number);
            const [sh, sm] = shift.heureFin.split(':').map(Number);
            return sh * 60 + sm >= lh * 60 + lm ? shift.heureFin : latest;
          }, '' as string)
        : '';

    router.push({
      pathname: '/declare-day',
      params: {
        date,
        dayLabel,
        extraSlot: '1',
        ...(previousEnd ? { heureDebut: previousEnd } : {}),
        heureFin: '',
        panierRepas: '0',
        deplacement: '0',
      },
    });
  };

  const headerStatus = useMemo(() => {
    if (!hasShifts) {
      return t.ouvrierDashboard?.notDeclared ?? 'Non déclarée';
    }
    if (shifts.length === 1) return t.ouvrierDashboard?.shiftCountOne ?? '1 shift';
    return `${pageIndex + 1} / ${shifts.length}`;
  }, [hasShifts, shifts.length, pageIndex, t.ouvrierDashboard?.notDeclared, t.ouvrierDashboard?.shiftCountOne]);

  const cardWidth = windowWidth * (isCompactLayout ? 0.86 : 0.8);
  const hasMultipleShifts = shifts.length > 1;
  const showSideArrows = hasMultipleShifts && !isCompactLayout;

  const goToPage = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(index, 0), Math.max(shifts.length - 1, 0));
      setPageIndex(clamped);
    },
    [shifts.length],
  );

  pageIndexRef.current = pageIndex;
  shiftsLengthRef.current = shifts.length;

  const swipePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) =>
          shiftsLengthRef.current > 1
          && Math.abs(gesture.dx) > 10
          && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
        onMoveShouldSetPanResponderCapture: (_, gesture) =>
          shiftsLengthRef.current > 1
          && Math.abs(gesture.dx) > 10
          && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, gesture) => {
          if (shiftsLengthRef.current <= 1) return;
          const threshold = 42;
          const current = pageIndexRef.current;
          if (gesture.dx <= -threshold || gesture.vx <= -0.35) {
            goToPage(current + 1);
          } else if (gesture.dx >= threshold || gesture.vx >= 0.35) {
            goToPage(current - 1);
          }
        },
      }),
    [goToPage],
  );

  const cardHeight = useMemo(() => {
    if (carouselHeight <= 0) {
      return Math.max(Math.round(Dimensions.get('window').height * 0.52), 430);
    }
    const dotsH = shifts.length > 1 ? 26 : 0;
    return Math.round((carouselHeight - dotsH) * 0.8);
  }, [carouselHeight, shifts.length]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/choose-day');
  };

  const navigateDay = useCallback(
    (delta: number) => {
      if (!date) return;
      const nextDate = addDaysToDateKey(date, delta);
      const nextLabel = formatWeekDayLabelWithYear(nextDate, dateLocale);
      router.replace({
        pathname: '/declare-day-empty',
        params: { date: nextDate, dayLabel: nextLabel },
      });
    },
    [date, dateLocale, router],
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF8A50', '#FF6B35', '#E55A2B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerDateRow}>
            <TouchableOpacity
              onPress={() => navigateDay(-1)}
              style={styles.headerNavBtn}
              disabled={!date}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t.ouvrierDashboard?.previousDay ?? 'Previous day'}
            >
              <ChevronLeft size={22} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
            <View style={styles.headerDateCopy}>
              <Text style={styles.headerDate}>{dayLabel || '—'}</Text>
              <Text style={styles.headerStatus}>{headerStatus}</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigateDay(1)}
              style={styles.headerNavBtn}
              disabled={!date}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t.ouvrierDashboard?.nextDay ?? 'Next day'}
            >
              <ChevronRight size={22} color="#FFF" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : hasShifts ? (
        <View style={styles.pagerArea}>
          <View
            style={styles.carouselWrap}
            onLayout={(e) => {
              const h = Math.round(e.nativeEvent.layout.height);
              if (h > 0) setCarouselHeight(h);
            }}
          >
            <View style={styles.carouselBlock}>
              <View
                style={[
                  styles.carouselRow,
                  Platform.OS === 'web' && hasMultipleShifts ? styles.carouselRowSwipeable : null,
                ]}
                {...(hasMultipleShifts ? swipePanResponder.panHandlers : {})}
              >
                {showSideArrows ? (
                  <TouchableOpacity
                    style={[styles.carouselNavBtn, pageIndex === 0 && styles.carouselNavBtnDisabled]}
                    onPress={() => goToPage(pageIndex - 1)}
                    disabled={pageIndex === 0}
                    accessibilityRole="button"
                    accessibilityLabel={t.ouvrierDashboard?.previousShift ?? 'Créneau précédent'}
                  >
                    <ChevronLeft
                      size={26}
                      color={pageIndex === 0 ? '#D1D5DB' : Colors.primary}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={isCompactLayout ? styles.carouselNavSpacerCompact : styles.carouselNavSpacer} />
                )}

                <View style={[styles.pageCardWrap, { width: cardWidth }]}>
                  {currentShift ? (
                    <ShiftCardPanel
                      shift={currentShift}
                      mealLabel={t.timesheet.meal}
                      displacementLabel={t.timesheet.displacement}
                      cardHeight={cardHeight}
                      editable={isShiftEditable(currentShift.statut)}
                      onPress={() => openEditShift(currentShift)}
                    />
                  ) : null}
                </View>

                {showSideArrows ? (
                  <TouchableOpacity
                    style={[
                      styles.carouselNavBtn,
                      pageIndex === shifts.length - 1 && styles.carouselNavBtnDisabled,
                    ]}
                    onPress={() => goToPage(pageIndex + 1)}
                    disabled={pageIndex === shifts.length - 1}
                    accessibilityRole="button"
                    accessibilityLabel={t.ouvrierDashboard?.nextShift ?? 'Créneau suivant'}
                  >
                    <ChevronRight
                      size={26}
                      color={pageIndex === shifts.length - 1 ? '#D1D5DB' : Colors.primary}
                      strokeWidth={2.5}
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={isCompactLayout ? styles.carouselNavSpacerCompact : styles.carouselNavSpacer} />
                )}
              </View>

              {hasMultipleShifts && (
                <View style={styles.dotsRow}>
                  {shifts.map((shift, index) => (
                    <TouchableOpacity
                      key={shift.id}
                      onPress={() => goToPage(index)}
                      accessibilityRole="button"
                      accessibilityLabel={`${index + 1} / ${shifts.length}`}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      <View style={[styles.dot, index === pageIndex && styles.dotActive]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.emptyCard}>
            <View style={styles.iconWrap}>
              <CalendarX2 size={44} color="#D8B9A9" strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>
              {t.ouvrierDashboard?.noDeclarationTitle ?? 'Aucune déclaration'}
            </Text>
            <Text style={styles.emptyDescription}>
              {t.ouvrierDashboard?.noDeclarationDescription ??
                'Déclare tes heures travaillées pour ce jour.'}
            </Text>
          </View>
        </View>
      )}

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {canEditCurrentShift ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.86}
              onPress={() => openEditShift(currentShift)}
            >
              <Text style={styles.primaryButtonText}>
                {t.ouvrierDashboard?.editShiftCta ?? 'Modifier ce créneau'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.86}
              onPress={openAddShift}
            >
              <Text style={styles.secondaryButtonText}>
                {t.ouvrierDashboard?.addExtraSlotCta ?? 'Ajouter un créneau supplémentaire'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.86}
            onPress={hasShifts ? openAddShift : openFirstShift}
          >
            <Text style={styles.primaryButtonText}>
              {hasShifts
                ? (t.ouvrierDashboard?.addExtraSlotCta ?? 'Ajouter un créneau supplémentaire')
                : (t.ouvrierDashboard?.declareDayCta ?? 'Déclarer ma journée')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  headerNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDateCopy: {
    flexShrink: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  headerDate: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  headerStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagerArea: {
    flex: 1,
    minHeight: 200,
    backgroundColor: '#FFF',
  },
  carouselWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselBlock: {
    width: '100%',
    alignItems: 'center',
  },
  carouselRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  carouselRowSwipeable: {
    // Let PanResponder own the gesture so horizontal swipe works on mobile web.
    // @ts-expect-error web-only CSS
    touchAction: 'none',
    userSelect: 'none',
    cursor: 'grab',
  },
  carouselNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 6,
  },
  carouselNavBtnDisabled: {
    opacity: 0.45,
  },
  carouselNavSpacer: {
    width: 44,
    marginHorizontal: 6,
  },
  carouselNavSpacerCompact: {
    width: 8,
    marginHorizontal: 0,
  },
  pageCardWrap: {
    maxWidth: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    width: 22,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  shiftCard: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  shiftCardChantierPending: {
    opacity: 0.55,
  },
  shiftCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  shiftCardBody: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 30,
    gap: 28,
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  shiftChantierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shiftChantier: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
    lineHeight: 23,
  },
  statutBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statutBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  detailsBox: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leadingIcon: {
    width: 26,
    alignItems: 'center',
  },
  hoursLine: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  optionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
    backgroundColor: '#FFF',
  },
  emptyCard: {
    width: '100%',
    minHeight: 340,
    borderRadius: 18,
    backgroundColor: '#FFF8F3',
    borderWidth: 1,
    borderColor: '#F6E5D9',
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: 22,
    paddingTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 10,
  },
  iconWrap: {
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4B3A2F',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#8A6E5D',
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  secondaryButton: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
});
