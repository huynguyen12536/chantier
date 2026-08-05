import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Pencil,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfirmModal } from '@/components/common';
import { DesktopPageHeader } from '@/components/layoutDesktop';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsDesktopLayout } from '@/hooks/useIsDesktopLayout';
import type { Absence } from '@/types';
import { deleteAbsence, fetchAbsenceById } from '@/utils/absence';
import {
  formatAbsenceDuration,
  formatAbsencePeriodLabel,
  getAbsenceReason,
  getMotifLabel,
} from '@/utils/absenceFormat';

function resolveParam(value?: string | string[]): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function formatDeclaredAt(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const datePart = date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} • ${timePart}`;
}

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  showDivider?: boolean;
}

function DetailRow({ icon, label, value, showDivider = true }: DetailRowProps) {
  return (
    <>
      <View style={styles.detailRow}>
        <View style={styles.detailIconWrap}>{icon}</View>
        <View style={styles.detailCopy}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </>
  );
}

export default function AbsenceDetailScreen() {
  const { profile } = useAuth();
  const { t, dateLocale } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDesktopLayout = useIsDesktopLayout();
  const params = useLocalSearchParams<{ id?: string | string[]; saved?: string | string[] }>();
  const absenceId = resolveParam(params.id);

  const a = t.absences;
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [absence, setAbsence] = useState<Absence | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const handleBack = useCallback(() => {
    router.replace('/(tabs)/calendar');
  }, [router]);

  const loadAbsence = useCallback(async () => {
    if (!absenceId || !profile?.id) return;
    if (!hasLoadedOnceRef.current) setLoading(true);
    setLoadError(null);
    try {
      const row = await fetchAbsenceById(absenceId);
      if (!row || row.user_id !== profile.id) {
        setLoadError(a.errors.loadFailed);
        return;
      }
      setAbsence(row);
      hasLoadedOnceRef.current = true;
    } catch {
      setLoadError(a.errors.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [absenceId, profile?.id, a.errors.loadFailed]);

  useFocusEffect(
    useCallback(() => {
      void loadAbsence();
    }, [loadAbsence]),
  );

  const handleDelete = async () => {
    if (!profile?.id || !absence || deleting) return;
    setDeleting(true);
    try {
      await deleteAbsence(absence.id, profile.id);
      setConfirmDelete(false);
      router.replace('/(tabs)/calendar');
    } catch {
      setConfirmDelete(false);
      setLoadError(a.errors.deleteFailed);
    } finally {
      setDeleting(false);
    }
  };

  if (!profile || profile.role !== 'ouvrier') return null;

  const period = absence
    ? formatAbsencePeriodLabel(absence.date_debut, absence.date_fin, dateLocale)
    : '';
  const duration = absence
    ? formatAbsenceDuration(absence.date_debut, absence.date_fin, t)
    : '';
  const motifLabel = absence ? getMotifLabel(absence.motif, t) : '';
  const reasonText = absence ? getAbsenceReason(absence.commentaire) : '';
  const declaredAt = absence ? formatDeclaredAt(absence.created_at, dateLocale) : '';
  const hasMotifEnum = Boolean(absence?.motif);
  const showCommentSection = Boolean(absence?.commentaire?.trim());

  return (
    <View style={[styles.container, isDesktopLayout && styles.containerDesktop]}>
      {isDesktopLayout ? (
        <View style={styles.desktopHeaderPad}>
          <DesktopPageHeader
            title={a.detailTitle}
            subtitle={a.declareSubtitle}
            onBack={handleBack}
            backLabel={a.cancel}
          />
        </View>
      ) : (
        <LinearGradient
          colors={['#FF8A50', '#FF6B35', '#E55A2B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} accessibilityRole="button">
            <ArrowLeft size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{a.detailTitle}</Text>
            <Text style={styles.headerSubtitle}>{a.declareSubtitle}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </LinearGradient>
      )}

      {loading && !absence ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : loadError && !absence ? (
        <View style={styles.loaderWrap}>
          <Text style={styles.errorText}>{loadError}</Text>
          <TouchableOpacity style={styles.backLinkBtn} onPress={handleBack}>
            <Text style={styles.backLinkText}>{a.cancel}</Text>
          </TouchableOpacity>
        </View>
      ) : absence ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        >
          <View style={styles.successBanner}>
            <View style={styles.successIconWrap}>
              <Check size={20} color="#FFF" strokeWidth={3} />
            </View>
            <View style={styles.successCopy}>
              <Text style={styles.successTitle}>{a.savedTitle}</Text>
              <Text style={styles.successMessage}>{a.savedMessage}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>{a.detailSection}</Text>

            <DetailRow
              icon={<Calendar size={18} color={Colors.primary} strokeWidth={2.2} />}
              label={a.periodSection}
              value={period}
            />
            <DetailRow
              icon={<Clock size={18} color={Colors.primary} strokeWidth={2.2} />}
              label={a.durationLabel}
              value={duration}
            />
            {hasMotifEnum ? (
              <DetailRow
                icon={<FileText size={18} color={Colors.primary} strokeWidth={2.2} />}
                label={a.motifLabel}
                value={motifLabel}
              />
            ) : null}
            <DetailRow
              icon={<CalendarDays size={18} color={Colors.primary} strokeWidth={2.2} />}
              label={a.declaredOn}
              value={declaredAt}
              showDivider={false}
            />
          </View>

          {showCommentSection ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>{a.commentLabel}</Text>
              <Text style={styles.commentBody}>{reasonText}</Text>
            </View>
          ) : null}

          <View style={styles.infoBanner}>
            <Calendar size={18} color={Colors.primary} strokeWidth={2.2} />
            <Text style={styles.infoText}>{a.calendarSync}</Text>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push(`/declare-absence?absenceId=${encodeURIComponent(absence.id)}`)}
          >
            <Pencil size={18} color={Colors.primary} strokeWidth={2.2} />
            <Text style={styles.editText}>{a.edit}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteLink} onPress={() => setConfirmDelete(true)}>
            <Text style={styles.deleteLinkText}>{a.delete}</Text>
          </TouchableOpacity>

          <Text style={styles.footerHelp}>{a.editHelp}</Text>
        </ScrollView>
      ) : null}

      {confirmDelete ? (
        <ConfirmModal
          visible
          title={a.deleteConfirmTitle}
          message={a.deleteConfirmMessage}
          cancelLabel={a.cancel}
          confirmLabel={a.delete}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void handleDelete()}
          loading={deleting}
          confirmVariant="danger"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F2',
  },
  containerDesktop: {
    backgroundColor: 'transparent',
  },
  desktopHeaderPad: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
    paddingHorizontal: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
  },
  backLinkBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.primary,
  },
  backLinkText: {
    color: '#FFF',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  successIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCopy: {
    flex: 1,
    gap: 4,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16A34A',
  },
  successMessage: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopy: {
    flex: 1,
    gap: 4,
    paddingTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    lineHeight: 21,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0E4DC',
  },
  commentBody: {
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
    paddingBottom: 10,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE8DC',
    backgroundColor: '#FFF3EF',
    borderRadius: 14,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 19,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 15,
  },
  editText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  deleteLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  deleteLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  footerHelp: {
    fontSize: 12,
    color: Colors.text.disabled,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
});
