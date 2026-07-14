import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Check, Clock, Pencil, Sparkles, UtensilsCrossed, Car, Building2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ConfirmModal } from '@/components/common';
import { Colors } from '@/constants/colors';
import { formatWeekDayLabelWithYear } from '@/utils/date';
import { fetchLatestValidatedPeriod } from '@/utils/ouvrierDeclaration';
import { timeRangesOverlap, toDbTimeString } from '@/utils/time';
import { supabase } from '@/services/supabase';

const pageBackground = require('../assets/images/bg-03.png');

function resolveParam(value?: string | string[]): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

interface LoadedHabit {
  chantierId: string;
  chantierNom: string;
  chantierCode: string;
  heureDebut: string;
  heureFin: string;
  panierRepas: boolean;
  deplacement: boolean;
  pauseMinutes: number;
}

/** Page suggestion ATN (carte verte) — distincte du formulaire orange declare-day. */
export default function DeclareDaySuggestionScreen() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    date: string;
    dayLabel: string;
    chantierId?: string;
    chantierNom?: string;
    chantierCode?: string;
    heureDebut?: string;
    heureFin?: string;
    panierRepas?: string;
    deplacement?: string;
    pauseMinutes?: string;
  }>();

  const dateStr = resolveParam(params.date);
  const dayLabel = resolveParam(params.dayLabel);
  const routeChantierId = resolveParam(params.chantierId);
  const s = t.ouvrierDashboard.suggestion;

  const [habit, setHabit] = useState<LoadedHabit | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [overlapModalVisible, setOverlapModalVisible] = useState(false);

  const formattedDate = useMemo(() => {
    if (!dateStr) return '—';
    return formatWeekDayLabelWithYear(dateStr);
  }, [dateStr]);

  const cardDateLabel = formattedDate;

  const chantierName = useMemo(() => {
    if (!habit) return '—';
    const nom = habit.chantierNom.trim();
    const code = habit.chantierCode.trim();
    if (nom && code && nom !== code) return `${nom} (${code})`;
    return nom || code || '—';
  }, [habit]);

  const hoursLine = useMemo(() => {
    if (!habit) return '—';
    return `${habit.heureDebut} → ${habit.heureFin}`;
  }, [habit]);

  const applySuggestion = useCallback(
    (suggestion: {
      chantier_id: string;
      chantierNom: string;
      chantierCode: string;
      heure_debut: string;
      heure_fin: string;
      panier_repas: boolean;
      deplacement: boolean;
      pauseMinutes: number;
    }) => {
      setHabit({
        chantierId: suggestion.chantier_id,
        chantierNom: suggestion.chantierNom,
        chantierCode: suggestion.chantierCode,
        heureDebut: suggestion.heure_debut,
        heureFin: suggestion.heure_fin,
        panierRepas: suggestion.panier_repas,
        deplacement: suggestion.deplacement,
        pauseMinutes: suggestion.pauseMinutes,
      });
    },
    [],
  );

  useEffect(() => {
    if (!dateStr) {
      setLoading(false);
      return;
    }

    if (routeChantierId) {
      setHabit({
        chantierId: routeChantierId,
        chantierNom: resolveParam(params.chantierNom),
        chantierCode: resolveParam(params.chantierCode),
        heureDebut: resolveParam(params.heureDebut),
        heureFin: resolveParam(params.heureFin),
        panierRepas: resolveParam(params.panierRepas) === '1',
        deplacement: resolveParam(params.deplacement) === '1',
        pauseMinutes: Number(resolveParam(params.pauseMinutes) || '0'),
      });
      setLoading(false);
      return;
    }

    if (!profile?.id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      const validated = await fetchLatestValidatedPeriod(profile.id, dateStr);
      if (cancelled) return;

      if (!validated) {
        router.replace({
          pathname: '/declare-day',
          params: { date: dateStr, dayLabel },
        });
        return;
      }

      applySuggestion(validated);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    profile?.id,
    dateStr,
    dayLabel,
    routeChantierId,
    router,
    applySuggestion,
    params.chantierNom,
    params.chantierCode,
    params.heureDebut,
    params.heureFin,
    params.panierRepas,
    params.deplacement,
    params.pauseMinutes,
  ]);

  const navigateToDashboard = useCallback(
    (declaredDate: string) => {
      router.replace({
        pathname: '/(tabs)/ouvrier-dashboard',
        params: { focusDate: declaredDate },
      });
    },
    [router],
  );

  const handleModify = () => {
    const base = { date: dateStr, dayLabel };
    if (!habit) {
      router.push({ pathname: '/declare-day', params: base });
      return;
    }
    router.push({
      pathname: '/declare-day',
      params: {
        ...base,
        chantierId: habit.chantierId,
        heureDebut: habit.heureDebut,
        heureFin: habit.heureFin,
        panierRepas: habit.panierRepas ? '1' : '0',
        deplacement: habit.deplacement ? '1' : '0',
      },
    });
  };

  const handleSubmit = async () => {
    if (!profile?.id || !dateStr || !habit?.chantierId) return;

    try {
      setSubmitting(true);

      const [periodsRes, declRes] = await Promise.all([
        supabase
          .from('periodes_travail')
          .select('chantier_id, heure_debut, heure_fin, statut')
          .eq('user_id', profile.id)
          .eq('date', dateStr),
        supabase
          .from('declarations_heures')
          .select('chantier_id, date, statut')
          .eq('user_id', profile.id)
          .eq('date', dateStr),
      ]);

      const declByKey = new Map<string, string>();
      for (const row of declRes.data || []) {
        declByKey.set(row.chantier_id as string, row.statut as string);
      }

      const activePeriods = (periodsRes.data || []).filter((p: { chantier_id: string; statut: string }) => {
        const declStatut = declByKey.get(p.chantier_id);
        if (declStatut === 'annulee') return false;
        if (p.statut === 'annulee') return false;
        return true;
      });

      const dbDebut = toDbTimeString(habit.heureDebut);
      const dbFin = toDbTimeString(habit.heureFin);

      const hasOverlap = activePeriods.some((existing: { heure_debut: string; heure_fin: string }) => {
        if (!existing.heure_debut || !existing.heure_fin) return false;
        return timeRangesOverlap(dbDebut, dbFin, existing.heure_debut, existing.heure_fin);
      });

      if (hasOverlap) {
        setOverlapModalVisible(true);
        return;
      }

      const { error } = await supabase.from('periodes_travail').insert({
        user_id: profile.id,
        chantier_id: habit.chantierId,
        date: dateStr,
        heure_debut: dbDebut,
        heure_fin: dbFin,
        panier_repas: habit.panierRepas,
        deplacement: habit.deplacement,
        statut: 'terminee',
        latitude_debut: 0,
        longitude_debut: 0,
        latitude_fin: 0,
        longitude_fin: 0,
      });

      if (error) throw error;
      navigateToDashboard(dateStr);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t.timesheet.errorValidate;
      Alert.alert(t.common.error, message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF8A50', '#FF6B35', '#E55A2B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace({ pathname: '/(tabs)/ouvrier-dashboard' });
          }}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t.ouvrierDashboard.addLineTitle}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <ImageBackground
          source={pageBackground}
          style={styles.mainCard}
          imageStyle={styles.mainCardImage}
          resizeMode="cover"
        >
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardTitleBlock}>
                <View style={styles.sparkleIconBox}>
                  <Sparkles size={20} color={Colors.secondary} strokeWidth={2.5} />
                </View>
                <View style={styles.cardTitleTexts}>
                  <Text style={styles.suggestionTitle}>{s.title}</Text>
                  <Text style={styles.suggestionSubtitle}>{s.subtitle}</Text>
                </View>
              </View>
            </View>

            <View style={styles.dateRow}>
              <Calendar size={17} color="#10B981" strokeWidth={2} />
              <Text style={styles.cardDate}>{cardDateLabel}</Text>
            </View>

            <View style={styles.chantierRow}>
              <Building2 size={18} color={Colors.secondary} strokeWidth={2.4} />
              <Text style={styles.chantierName} numberOfLines={2}>
                {chantierName}
              </Text>
            </View>

            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <View style={styles.leadingIcon}>
                  <Clock size={17} color="#10B981" strokeWidth={2} />
                </View>
                <Text style={styles.hoursLine}>{hoursLine}</Text>
              </View>
              {habit?.panierRepas && (
                <View style={styles.detailRow}>
                  <View style={styles.leadingIcon}>
                    <View style={styles.optionCheck}>
                      <Check size={13} color="#FFF" strokeWidth={3} />
                    </View>
                  </View>
                  <UtensilsCrossed size={18} color="#10B981" strokeWidth={2.2} />
                  <Text style={styles.optionText}>{t.timesheet.meal}</Text>
                </View>
              )}
              {habit?.deplacement && (
                <View style={styles.detailRow}>
                  <View style={styles.leadingIcon}>
                    <View style={styles.optionCheck}>
                      <Check size={13} color="#FFF" strokeWidth={3} />
                    </View>
                  </View>
                  <Car size={18} color="#10B981" strokeWidth={2.2} />
                  <Text style={styles.optionText}>{t.timesheet.displacement}</Text>
                </View>
              )}
              {habit != null && habit.pauseMinutes > 0 && (
                <View style={styles.detailRow}>
                  <View style={styles.leadingIcon}>
                    <Clock size={17} color={Colors.text.disabled} />
                  </View>
                  <Text style={styles.optionTextMuted}>
                    {s.pause} {habit.pauseMinutes} min
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ImageBackground>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity
          style={[styles.primaryBtn, (submitting || !habit) && styles.primaryBtnDisabled]}
          onPress={() => void handleSubmit()}
          disabled={submitting || !habit}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>{s.validate}</Text>
              <Check size={20} color="#FFF" strokeWidth={3} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleModify}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Pencil size={18} color="#10B981" strokeWidth={2} />
          <Text style={styles.secondaryBtnText}>{s.modify}</Text>
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={overlapModalVisible}
        title={t.timesheet.duplicateSlotTitle}
        message={t.timesheet.duplicateSlotMessage}
        confirmLabel={t.common.ok}
        cancelLabel={t.common.cancel}
        onConfirm={() => setOverlapModalVisible(false)}
        onCancel={() => setOverlapModalVisible(false)}
        singleButton
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 22,
    zIndex: 2,
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
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 42,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
    backgroundColor: '#FFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 30,
  },
  mainCard: {
    backgroundColor: '#FFF',
    borderRadius: 26,
    overflow: 'hidden',
    flexGrow: 1,
    minHeight: 430,
  },
  mainCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 30,
    gap: 28,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    minWidth: 0,
  },
  sparkleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleTexts: {
    flex: 1,
    gap: 20,
    marginTop: -3,
    minWidth: 0,
  },
  suggestionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#047857',
    lineHeight: 24,
    includeFontPadding: false,
  },
  suggestionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 17,
    includeFontPadding: false,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  chantierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chantierName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
    lineHeight: 23,
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
  optionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  optionTextMuted: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    zIndex: 2,
    backgroundColor: '#FFF',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 17,
  },
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 17,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFF',
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
});
