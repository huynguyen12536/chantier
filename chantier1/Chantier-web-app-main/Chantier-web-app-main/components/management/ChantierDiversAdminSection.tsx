import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Building2, Check, MapPin, X } from 'lucide-react-native';
import { Colors } from '@/constants';
import { TimePickerModal } from '@/components/common';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/services/supabase';
import { Chantier, Profile } from '@/types';
import { formatTime, getMinEndTime, isEndAfterStart, toDbTimeString } from '@/utils/time';
import { scrollViewIntoVisible } from '@/utils/scrollIntoView';

const worksiteCardBackground = require('../../assets/images/bgcard-chantier.png');

type PendingDivers = Chantier & {
  creatorLabel?: string;
};

type Props = {
  onChanged?: () => void;
  onPendingCountChange?: (count: number) => void;
  compact?: boolean;
  highlightChantierId?: string | null;
  scrollRef?: React.RefObject<ScrollView | null>;
};

export function ChantierDiversAdminSection({
  onChanged,
  onPendingCountChange,
  compact,
  highlightChantierId,
  scrollRef,
}: Props) {
  const { t } = useLanguage();
  const cd = t.chantierDivers;
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PendingDivers[]>([]);
  const [approveTarget, setApproveTarget] = useState<PendingDivers | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingDivers | null>(null);
  const [heureDebut, setHeureDebut] = useState('07:30');
  const [heureFin, setHeureFin] = useState('16:30');
  const [rejectReason, setRejectReason] = useState('');
  const [timeField, setTimeField] = useState<'heure_debut' | 'heure_fin' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, View | null>>({});
  const lastScrolledIdRef = useRef<string | null>(null);

  const loadPending = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('chantiers')
        .select('*')
        .eq('source', 'divers')
        .eq('divers_statut', 'en_attente')
        .order('created_at', { ascending: true });
      if (fetchError) throw fetchError;
      const rows = (data || []) as Chantier[];
      const creatorIds = [...new Set(rows.map((r) => r.created_by).filter(Boolean))] as string[];
      let profilesById: Record<string, Profile> = {};
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nom, prenom')
          .in('id', creatorIds);
        profilesById = Object.fromEntries(
          (profiles || []).map((p) => [p.id, p as Profile]),
        );
      }
      setItems(
        rows.map((row) => {
          const creator = row.created_by ? profilesById[row.created_by] : undefined;
          const creatorLabel = creator
            ? `${creator.prenom} ${creator.nom}`.trim()
            : '—';
          return { ...row, creatorLabel };
        }),
      );
      onPendingCountChange?.(rows.length);
    } catch {
      setItems([]);
      onPendingCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    void loadPending();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel('admin-divers-pending')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chantiers' },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            void loadPending({ silent: true });
          }, 300);
        },
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [loadPending]);

  useEffect(() => {
    if (!highlightChantierId || loading) return;
    if (lastScrolledIdRef.current === highlightChantierId) return;

    let cancelled = false;
    let attempts = 0;

    const tryScroll = () => {
      if (cancelled) return;
      attempts += 1;
      const target = cardRefs.current[highlightChantierId];
      if (target) {
        scrollViewIntoVisible(scrollRef, target, { delayMs: 120, offset: 120 });
        lastScrolledIdRef.current = highlightChantierId;
        return;
      }
      if (attempts < 8) {
        setTimeout(tryScroll, 200);
      }
    };

    const starter = setTimeout(tryScroll, 300);
    return () => {
      cancelled = true;
      clearTimeout(starter);
    };
  }, [highlightChantierId, items, loading, scrollRef]);

  useEffect(() => {
    if (!highlightChantierId) {
      lastScrolledIdRef.current = null;
    }
  }, [highlightChantierId]);

  const openApprove = (row: PendingDivers) => {
    setApproveTarget(row);
    setHeureDebut(row.heure_debut ? formatTime(row.heure_debut) : '07:30');
    setHeureFin(row.heure_fin ? formatTime(row.heure_fin) : '16:30');
    setError(null);
  };

  const openReject = (row: PendingDivers) => {
    setRejectTarget(row);
    setRejectReason('');
    setError(null);
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    if (!isEndAfterStart(heureDebut, heureFin)) {
      setError(cd.invalidHours);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('approve_chantier_divers', {
        p_chantier_id: approveTarget.id,
        p_heure_debut: toDbTimeString(heureDebut),
        p_heure_fin: toDbTimeString(heureFin),
        p_nom: approveTarget.nom,
        p_adresse: approveTarget.adresse,
      });
      if (rpcError) throw rpcError;
      setApproveTarget(null);
      await loadPending();
      onChanged?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : cd.approveFailed);
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setBusy(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('reject_chantier_divers', {
        p_chantier_id: rejectTarget.id,
        p_reason: rejectReason.trim() || null,
      });
      if (rpcError) throw rpcError;
      setRejectTarget(null);
      await loadPending();
      onChanged?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : cd.rejectFailed);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.section}>
        {!compact ? <Text style={styles.sectionTitle}>{cd.adminSectionTitle}</Text> : null}
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.section}>
        {!compact ? <Text style={styles.sectionTitle}>{cd.adminSectionTitle}</Text> : null}
        <Text style={styles.empty}>{cd.adminSectionEmpty}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {!compact ? <Text style={styles.sectionTitle}>{cd.adminSectionTitle}</Text> : null}
      {items.map((row) => (
        <View
          key={row.id}
          ref={(node) => {
            cardRefs.current[row.id] = node;
          }}
          collapsable={false}
          style={[styles.card, highlightChantierId === row.id && styles.cardHighlighted]}
        >
          <View style={styles.cardBgWrap}>
            <Image
              source={worksiteCardBackground}
              style={styles.cardBg}
              resizeMode="cover"
            />
            {Platform.OS === 'web' ? (
              <View style={styles.cardOverlay} />
            ) : (
              <BlurView intensity={8} tint="light" style={styles.cardOverlayBlur}>
                <View style={styles.cardOverlayTint} />
              </BlurView>
            )}
          </View>
          <View style={styles.cardInner}>
            <View style={styles.cardIcon}>
              <Building2 size={20} color={Colors.primary} strokeWidth={2.2} />
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle} numberOfLines={2}>{row.nom}</Text>
                <Text style={styles.cardHours}>
                  {formatTime(row.heure_debut || '')} – {formatTime(row.heure_fin || '')}
                </Text>
              </View>
              {!!row.adresse && (
                <View style={styles.cardAddressRow}>
                  <MapPin size={13} color={Colors.primary} strokeWidth={2.3} />
                  <Text style={styles.cardMeta} numberOfLines={1}>{row.adresse}</Text>
                </View>
              )}
              <Text style={styles.cardMetaLine}>
                {cd.createdBy.replace('{{name}}', row.creatorLabel || '—')}
              </Text>
              <Text style={styles.cardMetaLine} numberOfLines={2}>
                <Text style={styles.cardMetaLabel}>{cd.adminReasonLabel}: </Text>
                {row.divers_creation_reason?.trim() || '—'}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => openReject(row)}
                  activeOpacity={0.85}
                >
                  <X size={15} color="#FFF" strokeWidth={2.5} />
                  <Text style={styles.actionBtnText}>{cd.reject}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => openApprove(row)}
                  activeOpacity={0.85}
                >
                  <Check size={15} color="#FFF" strokeWidth={2.5} />
                  <Text style={styles.actionBtnText}>{cd.approve}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      ))}

      <Modal visible={!!approveTarget} transparent animationType="fade" onRequestClose={() => setApproveTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{cd.approveTitle}</Text>
            <Text style={styles.modalSubtitle}>{approveTarget?.nom}</Text>
            {approveTarget?.divers_creation_reason?.trim() ? (
              <View style={styles.creationReasonBox}>
                <Text style={styles.creationReasonLabel}>{cd.adminReasonLabel}</Text>
                <Text style={styles.creationReasonText}>
                  {approveTarget.divers_creation_reason.trim()}
                </Text>
              </View>
            ) : null}
            <View style={styles.timeRow}>
              <TouchableOpacity style={styles.timeChip} onPress={() => setTimeField('heure_debut')}>
                <Text style={styles.timeLabel}>{cd.startLabel}</Text>
                <Text style={styles.timeValue}>{heureDebut}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.timeChip} onPress={() => setTimeField('heure_fin')}>
                <Text style={styles.timeLabel}>{cd.endLabel}</Text>
                <Text style={styles.timeValue}>{heureFin}</Text>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setApproveTarget(null)}>
                <Text style={styles.modalCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, busy && styles.disabled]}
                disabled={busy}
                onPress={() => void handleApprove()}
              >
                {busy ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={styles.modalConfirmText}>{cd.approve}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!rejectTarget} transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{cd.rejectTitle}</Text>
            <Text style={styles.modalSubtitle}>{rejectTarget?.nom}</Text>
            <Text style={styles.timeLabel}>{cd.rejectReasonLabel}</Text>
            <TextInput
              style={styles.reasonInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder={cd.rejectReasonPlaceholder}
              placeholderTextColor={Colors.text.disabled}
              multiline
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRejectTarget(null)}>
                <Text style={styles.modalCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, styles.rejectConfirm, busy && styles.disabled]}
                disabled={busy}
                onPress={() => void handleReject()}
              >
                {busy ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={styles.modalConfirmText}>{cd.reject}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {timeField ? (
        <TimePickerModal
          visible
          title={timeField === 'heure_fin' ? cd.endLabel : cd.startLabel}
          value={timeField === 'heure_fin' ? heureFin : heureDebut}
          minTime={timeField === 'heure_fin' ? getMinEndTime(heureDebut) : undefined}
          confirmLabel={t.common.validate}
          cancelLabel={t.common.cancel}
          onClose={() => setTimeField(null)}
          onConfirm={(time) => {
            if (timeField === 'heure_debut') {
              setHeureDebut(time);
              if (!isEndAfterStart(time, heureFin)) setHeureFin(getMinEndTime(time));
            } else {
              setHeureFin(isEndAfterStart(heureDebut, time) ? time : getMinEndTime(heureDebut));
            }
            setTimeField(null);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  empty: {
    fontSize: 14,
    color: Colors.text.disabled,
    fontStyle: 'italic',
    marginHorizontal: 16,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 4,
  },
  cardHighlighted: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  cardBgWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  cardBg: {
    position: 'absolute',
    top: '-12%',
    left: '-8%',
    width: '116%',
    height: '124%',
    opacity: 0.88,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(1.5px)',
          WebkitBackdropFilter: 'blur(1.5px)',
        } as object)
      : null),
  },
  cardOverlayBlur: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  cardOverlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  cardInner: {
    position: 'relative',
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.cardWarm.title,
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  cardHours: {
    flexShrink: 0,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 20,
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  cardAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardMeta: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.cardWarm.body,
    lineHeight: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  cardMetaLine: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.cardWarm.meta,
    lineHeight: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  cardMetaLabel: { fontWeight: '700', color: Colors.cardWarm.label },
  creationReasonBox: {
    backgroundColor: '#FFF7F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0D2',
    padding: 12,
    marginBottom: 12,
  },
  creationReasonLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9A6A5B',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  creationReasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 107, 53, 0.16)',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 20,
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
  },
  actionBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: '#FFF7F2', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.text.primary },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '600',
  },
  timeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  timeChip: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE0D2',
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9A6A5B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timeValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  reasonInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0D2',
    padding: 12,
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  error: { color: Colors.error, fontSize: 13, marginBottom: 8, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#FFE8DD',
  },
  modalCancelText: { fontWeight: '800', color: Colors.primary },
  modalConfirm: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  rejectConfirm: { backgroundColor: Colors.error },
  modalConfirmText: { fontWeight: '800', color: '#FFF' },
  disabled: { opacity: 0.6 },
});
