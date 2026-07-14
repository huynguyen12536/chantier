import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Building2, CalendarX2, Car, Check, Clock, UtensilsCrossed } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/colors';
import { formatWeekDayLabelWithYear } from '@/utils/date';
import { declarationLookupKey, resolveLineStatut, type LineStatut } from '@/utils/status';
import { formatTime } from '@/utils/time';
import { supabase } from '@/services/supabase';

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
  chantierNom: string;
  chantierCode: string;
  heureDebut: string;
  heureFin: string;
  panierRepas: boolean;
  deplacement: boolean;
  statut: LineStatut;
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
}: {
  shift: DayShift;
  mealLabel: string;
  displacementLabel: string;
  cardHeight: number;
}) {
  const chantierLabel =
    shift.chantierNom && shift.chantierCode && shift.chantierNom !== shift.chantierCode
      ? `${shift.chantierNom} (${shift.chantierCode})`
      : shift.chantierNom || shift.chantierCode || '—';

  const isApproved = shift.statut === 'validee';
  const cardBackground = isApproved ? bgApproved : bgPending;

  return (
    <ImageBackground
      source={cardBackground}
      style={[styles.shiftCard, { height: cardHeight, minHeight: cardHeight }]}
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
}

export default function DeclareDayEmptyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ date?: string; dayLabel?: string }>();

  const date = resolveParam(params.date);
  const dayLabel = resolveParam(params.dayLabel) || (date ? formatWeekDayLabelWithYear(date) : '');

  const [shifts, setShifts] = useState<DayShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [carouselHeight, setCarouselHeight] = useState(0);

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
            'id, heure_debut, heure_fin, statut, chantier_id, panier_repas, deplacement, chantiers(nom, code)',
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
        const chantier = period.chantiers as { nom?: string; code?: string } | null;
        const nom = chantier?.nom?.trim() ?? '';
        const code = chantier?.code?.trim() ?? '';
        return {
          id: period.id as string,
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

  const headerStatus = useMemo(() => {
    if (!hasShifts) {
      return t.ouvrierDashboard?.notDeclared ?? 'Non déclarée';
    }
    if (shifts.length === 1) return t.ouvrierDashboard?.shiftCountOne ?? '1 shift';
    return `${pageIndex + 1} / ${shifts.length}`;
  }, [hasShifts, shifts.length, pageIndex, t.ouvrierDashboard?.notDeclared, t.ouvrierDashboard?.shiftCountOne]);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth * 0.8;
  const snapStep = screenWidth;
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
          <Text style={styles.headerDate}>{dayLabel || '—'}</Text>
          <Text style={styles.headerStatus}>{headerStatus}</Text>
        </View>
        <View style={styles.headerSpacer} />
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
              <ScrollView
                horizontal
                style={styles.pagerScroll}
                contentContainerStyle={styles.pagerContent}
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={snapStep}
                snapToAlignment="center"
                disableIntervalMomentum
                scrollEventThrottle={16}
                onScroll={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / snapStep);
                  const clamped = Math.min(Math.max(index, 0), shifts.length - 1);
                  if (clamped !== pageIndex) setPageIndex(clamped);
                }}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / snapStep);
                  setPageIndex(Math.min(Math.max(index, 0), shifts.length - 1));
                }}
              >
                {shifts.map((shift) => (
                  <View key={shift.id} style={[styles.page, { width: screenWidth }]}>
                    <View style={[styles.pageCardWrap, { width: cardWidth }]}>
                      <ShiftCardPanel
                        shift={shift}
                        mealLabel={t.timesheet.meal}
                        displacementLabel={t.timesheet.displacement}
                        cardHeight={cardHeight}
                      />
                    </View>
                  </View>
                ))}
              </ScrollView>

              {shifts.length > 1 && (
                <View style={styles.dotsRow}>
                  {shifts.map((shift, index) => (
                    <View
                      key={shift.id}
                      style={[styles.dot, index === pageIndex && styles.dotActive]}
                    />
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
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.86}
          onPress={() =>
            router.push({
              pathname: '/declare-day',
              params: { date, dayLabel },
            })
          }
        >
          <Text style={styles.primaryButtonText}>
            {hasShifts
              ? (t.ouvrierDashboard?.addExtraSlotCta ?? 'Ajouter un créneau supplémentaire')
              : (t.ouvrierDashboard?.declareDayCta ?? 'Déclarer ma journée')}
          </Text>
        </TouchableOpacity>
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
    gap: 4,
  },
  headerSpacer: {
    width: 42,
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
  pagerScroll: {
    width: '100%',
    flexGrow: 0,
  },
  pagerContent: {
    alignItems: 'center',
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
  page: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  pageCardWrap: {
    width: '100%',
    maxWidth: '100%',
  },
  shiftCard: {
    width: '100%',
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#FFF',
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
});
