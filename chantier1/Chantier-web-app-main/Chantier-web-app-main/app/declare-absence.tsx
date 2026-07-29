import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, CircleAlert, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DatePickerModal } from '@/components/common';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  createAbsence,
  fetchAbsenceById,
  fetchUserWorkDates,
  rangeIncludesWorkDate,
  updateAbsence,
} from '@/utils/absence';
import {
  formatAbsenceDuration,
  formatDateFieldLabel,
  mapAbsenceError,
} from '@/utils/absenceFormat';
import { formatDateKey } from '@/utils/date';
import { appAlert } from '@/utils/appAlert';

const MAX_REASON = 300;

function resolveParam(value?: string | string[]): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function DeclareAbsenceScreen() {
  const { profile } = useAuth();
  const { t, dateLocale } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ absenceId?: string | string[] }>();
  const absenceId = resolveParam(params.absenceId);
  const isEdit = !!absenceId;

  const a = t.absences;
  const today = useMemo(() => formatDateKey(new Date()), []);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin, setDateFin] = useState(today);
  const [reason, setReason] = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<'start' | 'end' | null>(null);
  const [workDates, setWorkDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const dates = await fetchUserWorkDates(profile.id);
        if (!cancelled) setWorkDates(dates);
      } catch {
        if (!cancelled) setWorkDates(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id]);

  useEffect(() => {
    if (!isEdit || !absenceId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const row = await fetchAbsenceById(absenceId);
        if (cancelled) return;
        if (!row || row.user_id !== profile?.id) {
          setSubmitError(a.errors.loadFailed);
          router.replace('/(tabs)/calendar');
          return;
        }
        setDateDebut(row.date_debut);
        setDateFin(row.date_fin);
        setReason(row.commentaire ?? '');
      } catch {
        if (!cancelled) setSubmitError(a.errors.loadFailed);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [absenceId, isEdit, profile?.id, a.errors.loadFailed, router]);

  const rangeHasWorkDays = useMemo(
    () => rangeIncludesWorkDate(dateDebut, dateFin, workDates),
    [dateDebut, dateFin, workDates],
  );

  const durationLabel = formatAbsenceDuration(dateDebut, dateFin, t);
  const reasonInvalid = reasonTouched && !reason.trim();
  const minEndDate = dateDebut >= today ? dateDebut : today;

  const handleBack = useCallback(() => {
    setActiveField(null);
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/calendar');
  }, [router]);

  const handleSubmit = async () => {
    if (!profile?.id || saving) return;
    setReasonTouched(true);
    setSubmitError(null);

    if (dateFin < dateDebut) {
      setSubmitError(a.errors.invalidRange);
      return;
    }
    if (dateDebut < today || dateFin < today) {
      setSubmitError(a.errors.pastDateNotAllowed);
      return;
    }
    if (!reason.trim()) {
      setSubmitError(a.errors.reasonRequired);
      return;
    }
    if (rangeHasWorkDays) {
      setSubmitError(a.errors.dayHasWorkShift);
      appAlert(t.common.error, a.errors.dayHasWorkShift, [{ text: t.common.ok }]);
      return;
    }

    setSaving(true);
    try {
      const input = {
        date_debut: dateDebut,
        date_fin: dateFin,
        motif: null,
        commentaire: reason.trim(),
      };
      const saved = isEdit
        ? await updateAbsence(absenceId, profile.id, input)
        : await createAbsence(profile.id, input);
      setActiveField(null);
      router.replace({
        pathname: '/absence-detail',
        params: { id: saved.id, saved: '1' },
      });
    } catch (error) {
      setSubmitError(mapAbsenceError(error, t));
    } finally {
      setSaving(false);
    }
  };

  if (!profile || profile.role !== 'ouvrier') return null;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF8A50', '#FF6B35', '#E55A2B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>{isEdit ? a.editTitle : a.declareTitle}</Text>
          <Text style={styles.headerSubtitle}>{a.declareSubtitle}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{a.periodSection}</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateField, activeField === 'start' && styles.dateFieldActive]}
                onPress={() => setActiveField('start')}
              >
                <Text style={styles.dateFieldLabel}>{a.fromLabel}</Text>
                <View style={styles.dateFieldValueRow}>
                  <Calendar size={16} color={Colors.primary} />
                  <Text style={styles.dateFieldValue}>{formatDateFieldLabel(dateDebut, dateLocale)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateField, activeField === 'end' && styles.dateFieldActive]}
                onPress={() => setActiveField('end')}
              >
                <Text style={styles.dateFieldLabel}>{a.toLabel}</Text>
                <View style={styles.dateFieldValueRow}>
                  <Calendar size={16} color={Colors.primary} />
                  <Text style={styles.dateFieldValue}>{formatDateFieldLabel(dateFin, dateLocale)}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.durationRow}>
              <Text style={styles.durationLabel}>{a.durationLabel}</Text>
              <Text style={styles.durationValue}>{durationLabel}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{a.reasonSection}</Text>
            <TextInput
              style={[styles.reasonInput, reasonInvalid && styles.reasonInputInvalid]}
              value={reason}
              onChangeText={(text) => {
                setReason(text.slice(0, MAX_REASON));
                if (submitError) setSubmitError(null);
              }}
              onBlur={() => setReasonTouched(true)}
              placeholder={a.reasonPlaceholder}
              placeholderTextColor={Colors.text.disabled}
              multiline
              maxLength={MAX_REASON}
            />
            <Text style={styles.counter}>{reason.length}/{MAX_REASON}</Text>
            {reasonInvalid && (
              <Text style={styles.fieldError}>{a.errors.reasonRequired}</Text>
            )}
          </View>

          <View style={styles.infoBanner}>
            <Info size={18} color={Colors.primary} />
            <Text style={styles.infoText}>{a.infoImmediate}</Text>
          </View>

          {rangeHasWorkDays && (
            <View style={styles.errorBanner}>
              <CircleAlert size={18} color="#DC2626" />
              <Text style={styles.errorText}>{a.errors.dayHasWorkShift}</Text>
            </View>
          )}

          {submitError && !rangeHasWorkDays && (
            <View style={styles.errorBanner}>
              <CircleAlert size={18} color="#DC2626" />
              <Text style={styles.errorText}>{submitError}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleBack} disabled={saving}>
              <Text style={styles.cancelText}>{a.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, rangeHasWorkDays && styles.submitBtnBlocked]}
              onPress={() => void handleSubmit()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitText}>{isEdit ? a.saveChanges : a.submit}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <DatePickerModal
        visible={activeField === 'start'}
        value={dateDebut}
        minDate={today}
        disabledDates={workDates}
        rangeStart={dateDebut}
        rangeEnd={dateFin}
        highlightRange={dateFin >= dateDebut}
        onSelect={(value) => {
          setDateDebut(value);
          if (value > dateFin) setDateFin(value);
          setActiveField(null);
          setSubmitError(null);
        }}
        onClose={() => setActiveField(null)}
        closeLabel={a.cancel}
      />
      <DatePickerModal
        visible={activeField === 'end'}
        value={dateFin}
        minDate={minEndDate}
        disabledDates={workDates}
        rangeStart={dateDebut}
        rangeEnd={dateFin}
        highlightRange
        onSelect={(value) => {
          if (value < dateDebut) {
            setDateDebut(value);
            setDateFin(value);
          } else {
            setDateFin(value);
          }
          setActiveField(null);
          setSubmitError(null);
        }}
        onClose={() => setActiveField(null)}
        closeLabel={a.cancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#B91C1C',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFCF9',
  },
  dateFieldActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF7F2',
  },
  dateFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.secondary,
    marginBottom: 6,
  },
  dateFieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateFieldValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  durationLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  durationValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  reasonInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: Colors.text.primary,
    textAlignVertical: 'top',
    backgroundColor: '#FFF',
  },
  reasonInputInvalid: {
    borderColor: '#FCA5A5',
  },
  fieldError: {
    fontSize: 12,
    color: '#DC2626',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: Colors.text.disabled,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE8DC',
    backgroundColor: '#FFF3EF',
    borderRadius: 12,
    padding: 12,
  },
  warnBanner: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  warnText: {
    color: '#92400E',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  submitBtn: {
    flex: 1.4,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  submitBtnBlocked: {
    opacity: 0.55,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
});
