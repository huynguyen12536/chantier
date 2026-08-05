import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { CircleX, MapPin, MessageSquare } from 'lucide-react-native';
import { Colors } from '@/constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/services/supabase';
import { Chantier, Profile } from '@/types';
import { scrollViewIntoVisible } from '@/utils/scrollIntoView';

const worksiteCardBackground = require('../../assets/images/bgcard-chantier.png');
// Cancel icon: Icons8 — https://icons8.com/icon/63688/cancel
const rejectIcon = require('../../assets/images/reject-icon.png');

const webWordBreak =
  Platform.OS === 'web'
    ? ({
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        maxWidth: '100%',
      } as object)
    : null;

type RejectedDivers = Chantier & {
  creatorLabel?: string;
  reviewerLabel?: string;
};

type Props = {
  onRejectedCountChange?: (count: number) => void;
  compact?: boolean;
  highlightChantierId?: string | null;
  scrollRef?: React.RefObject<ScrollView | null>;
};

function formatReviewedAt(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function clampIconBoxSize(height: number): number {
  return Math.min(Math.max(Math.round(height), 48), 88);
}

type DetailReasonBlockProps = {
  variant: 'request' | 'rejection';
  title: string;
  body: string;
  compactLayout: boolean;
};

function DetailReasonBlock({
  variant,
  title,
  body,
  compactLayout,
}: DetailReasonBlockProps) {
  const isRequest = variant === 'request';
  const Icon = isRequest ? MessageSquare : CircleX;
  const iconSize = compactLayout ? 16 : 18;

  return (
    <View
      style={[
        styles.detailReasonBlock,
        isRequest ? styles.detailReasonBlockRequest : styles.detailReasonBlockRejection,
        compactLayout && styles.detailReasonBlockCompact,
      ]}
    >
      <View style={styles.detailReasonHeader}>
        <View
          style={[
            styles.detailReasonIconWrap,
            isRequest ? styles.detailReasonIconWrapRequest : styles.detailReasonIconWrapRejection,
          ]}
        >
          <Icon
            size={iconSize}
            color={isRequest ? '#2563EB' : '#DC2626'}
            strokeWidth={2.2}
          />
        </View>
        <View style={styles.detailReasonHeaderText}>
          <Text
            style={[
              styles.detailReasonTitle,
              isRequest ? styles.detailReasonTitleRequest : styles.detailReasonTitleRejection,
              webWordBreak,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.detailReasonBody,
          isRequest ? styles.detailReasonBodyRequest : styles.detailReasonBodyRejection,
          webWordBreak,
        ]}
      >
        {body}
      </Text>
    </View>
  );
}

type RejectedCardContentProps = {
  row: RejectedDivers;
  compactLayout: boolean;
  cd: (typeof import('@/i18n/fr.json'))['chantierDivers'];
  dateLocale: string;
};

function RejectedCardContent({ row, compactLayout, cd, dateLocale }: RejectedCardContentProps) {
  const [iconBoxSize, setIconBoxSize] = useState(48);
  const iconImageSize = Math.round(iconBoxSize * 0.62);

  return (
    <View style={[styles.cardInner, compactLayout && styles.cardInnerCompact]}>
      <View style={[styles.cardIconCol, { width: iconBoxSize, height: iconBoxSize }]}>
        <Image
          source={rejectIcon}
          style={{ width: iconImageSize, height: iconImageSize }}
          resizeMode="contain"
        />
      </View>

      <View
        style={styles.cardBodyCol}
        onLayout={(event) => {
          const next = clampIconBoxSize(event.nativeEvent.layout.height);
          setIconBoxSize((prev) => (prev === next ? prev : next));
        }}
      >
        <View style={[styles.cardInfoRow, compactLayout && styles.cardInfoRowCompact]}>
          <Text
            style={[
              styles.cardTitleMain,
              compactLayout && styles.cardTitleMainCompact,
              webWordBreak,
            ]}
            numberOfLines={2}
          >
            {row.nom}
          </Text>
          {!!row.adresse ? (
            <View style={styles.cardAddressRowMain}>
              <MapPin size={compactLayout ? 12 : 13} color={Colors.primary} strokeWidth={2.3} />
              <Text
                style={[styles.cardMeta, compactLayout && styles.cardMetaCompact, webWordBreak]}
                numberOfLines={2}
              >
                {row.adresse}
              </Text>
            </View>
          ) : null}
          <Text
            style={[
              styles.cardReviewedAtMain,
              compactLayout && styles.cardReviewedAtMainCompact,
              webWordBreak,
            ]}
            numberOfLines={2}
          >
            {formatReviewedAt(row.divers_reviewed_at, dateLocale)}
          </Text>
        </View>

        <View style={[styles.cardReasonBox, compactLayout && styles.cardReasonBoxCompact]}>
          <View style={styles.cardReasonHeader}>
            <View style={styles.cardReasonIconWrap}>
              <CircleX size={compactLayout ? 12 : 13} color="#DC2626" strokeWidth={2.4} />
            </View>
            <Text style={styles.reasonLabel}>{cd.rejectedReasonLabel}</Text>
          </View>
          <Text style={[styles.reasonText, webWordBreak]} numberOfLines={3}>
            {row.divers_rejection_reason?.trim() || cd.noRejectionReason}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function ChantierDiversRejectedSection({
  onRejectedCountChange,
  compact,
  highlightChantierId,
  scrollRef,
}: Props) {
  const { t, dateLocale } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const compactLayout = windowWidth < 640;
  const cd = t.chantierDivers;
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<RejectedDivers[]>([]);
  const [detailTarget, setDetailTarget] = useState<RejectedDivers | null>(null);
  const cardRefs = useRef<Record<string, View | null>>({});
  const lastScrolledIdRef = useRef<string | null>(null);

  const loadRejected = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('chantiers')
        .select('*')
        .eq('source', 'divers')
        .eq('divers_statut', 'rejete')
        .order('divers_reviewed_at', { ascending: false });
      if (fetchError) throw fetchError;
      const rows = (data || []) as Chantier[];

      const profileIds = [
        ...new Set(
          rows.flatMap((r) => [r.created_by, r.divers_reviewed_by].filter(Boolean)),
        ),
      ] as string[];

      let profilesById: Record<string, Profile> = {};
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nom, prenom')
          .in('id', profileIds);
        profilesById = Object.fromEntries(
          (profiles || []).map((p) => [p.id, p as Profile]),
        );
      }

      setItems(
        rows.map((row) => {
          const creator = row.created_by ? profilesById[row.created_by] : undefined;
          const reviewer = row.divers_reviewed_by ? profilesById[row.divers_reviewed_by] : undefined;
          return {
            ...row,
            creatorLabel: creator ? `${creator.prenom} ${creator.nom}`.trim() : '—',
            reviewerLabel: reviewer ? `${reviewer.prenom} ${reviewer.nom}`.trim() : '—',
          };
        }),
      );
      onRejectedCountChange?.(rows.length);
    } catch {
      setItems([]);
      onRejectedCountChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [onRejectedCountChange]);

  useEffect(() => {
    void loadRejected();

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel('admin-divers-rejected')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chantiers' },
        () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            void loadRejected({ silent: true });
          }, 300);
        },
      )
      .subscribe();

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [loadRejected]);

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

  if (loading) {
    return (
      <View style={styles.section}>
        {!compact ? <Text style={styles.sectionTitle}>{cd.rejectedSectionTitle}</Text> : null}
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.section}>
        {!compact ? <Text style={styles.sectionTitle}>{cd.rejectedSectionTitle}</Text> : null}
        <Text style={styles.empty}>{cd.rejectedSectionEmpty}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      {!compact ? <Text style={styles.sectionTitle}>{cd.rejectedSectionTitle}</Text> : null}
      {items.map((row) => (
        <TouchableOpacity
          key={row.id}
          ref={(node) => {
            cardRefs.current[row.id] = node;
          }}
          collapsable={false}
          style={[
            styles.card,
            compactLayout && styles.cardCompact,
            highlightChantierId === row.id && styles.cardHighlighted,
          ]}
          onPress={() => setDetailTarget(row)}
          activeOpacity={0.85}
        >
          <View style={styles.cardBgWrap}>
            <Image source={worksiteCardBackground} style={styles.cardBg} resizeMode="cover" />
            {Platform.OS === 'web' ? (
              <View style={styles.cardOverlay} />
            ) : (
              <BlurView intensity={8} tint="light" style={styles.cardOverlayBlur}>
                <View style={styles.cardOverlayTint} />
              </BlurView>
            )}
          </View>
          <RejectedCardContent
            row={row}
            compactLayout={compactLayout}
            cd={cd}
            dateLocale={dateLocale}
          />
        </TouchableOpacity>
      ))}

      <Modal
        visible={!!detailTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailTarget(null)}
      >
        <View style={[styles.modalOverlay, compactLayout && styles.modalOverlayCompact]}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setDetailTarget(null)}
            accessibilityRole="button"
            accessibilityLabel={t.management.modals.close}
          />
          <View style={[styles.modalCard, compactLayout && styles.modalCardCompact]}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalTitleRow}>
                <Text style={[styles.modalTitle, webWordBreak]}>{cd.rejectedDetailTitle}</Text>
                {!!detailTarget?.nom && (
                  <Text style={[styles.modalTitleName, webWordBreak]}>{detailTarget.nom}</Text>
                )}
              </View>

              {!!detailTarget?.adresse && (
                <View style={styles.modalAddressRow}>
                  <MapPin size={14} color={Colors.primary} strokeWidth={2.2} />
                  <Text style={[styles.modalAddressText, webWordBreak]}>{detailTarget.adresse}</Text>
                </View>
              )}

              <View style={[styles.modalMetaGrid, compactLayout && styles.modalMetaGridCompact]}>
                <Text style={[styles.modalMeta, webWordBreak]}>
                  {cd.createdBy.replace('{{name}}', detailTarget?.creatorLabel || '—')}
                </Text>
                <Text style={[styles.modalMeta, webWordBreak]}>
                  {cd.rejectedBy.replace('{{name}}', detailTarget?.reviewerLabel || '—')}
                </Text>
                <Text style={[styles.modalMeta, webWordBreak]}>
                  {cd.rejectedAt.replace(
                    '{{date}}',
                    formatReviewedAt(detailTarget?.divers_reviewed_at, dateLocale),
                  )}
                </Text>
              </View>

              <View style={styles.modalReasonsStack}>
                {!!detailTarget?.divers_creation_reason?.trim() && (
                <DetailReasonBlock
                  variant="request"
                  title={cd.requestReasonTitle}
                  body={detailTarget.divers_creation_reason.trim()}
                  compactLayout={compactLayout}
                />
                )}

              <DetailReasonBlock
                variant="rejection"
                title={cd.rejectionReasonTitle}
                body={
                  detailTarget?.divers_rejection_reason?.trim() || cd.noRejectionReason
                }
                compactLayout={compactLayout}
              />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailTarget(null)}>
              <Text style={styles.modalCloseText}>{t.management.modals.close}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 20, width: '100%', maxWidth: '100%' },
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
    borderColor: 'rgba(220, 38, 38, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 4,
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  cardCompact: {
    marginHorizontal: 10,
    borderRadius: 14,
  },
  cardHighlighted: {
    borderColor: '#DC2626',
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
    alignItems: 'center',
    padding: 12,
    gap: 10,
    minWidth: 0,
  },
  cardInnerCompact: {
    padding: 8,
    gap: 8,
  },
  cardIconCol: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    flexShrink: 0,
  },
  cardBodyCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    minWidth: 0,
  },
  cardInfoRowCompact: {
    gap: 6,
    flexWrap: 'wrap',
  },
  cardTitleMain: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '28%',
    fontSize: 15,
    fontWeight: '700',
    color: Colors.cardWarm.title,
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  cardTitleMainCompact: {
    maxWidth: '36%',
    fontSize: 14,
  },
  cardAddressRowMain: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    overflow: 'hidden',
  },
  cardReviewedAtMain: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '30%',
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 15,
    textAlign: 'right',
  },
  cardReviewedAtMainCompact: {
    maxWidth: '38%',
    fontSize: 10,
    lineHeight: 14,
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.cardWarm.body,
    lineHeight: 16,
  },
  cardMetaCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
  cardReasonBox: {
    width: '100%',
    alignSelf: 'stretch',
    minWidth: 0,
    overflow: 'hidden',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cardReasonBoxCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardReasonIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'left',
  },
  reasonText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '600',
    color: '#7F1D1D',
    lineHeight: 16,
    textAlign: 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalOverlayCompact: {
    padding: 12,
  },
  modalCard: {
    backgroundColor: '#FFF7F2',
    borderRadius: 20,
    padding: 20,
    maxWidth: 420,
    maxHeight: '90%',
    width: '100%',
    alignSelf: 'center',
    minWidth: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  modalCardCompact: {
    padding: 16,
    borderRadius: 16,
    maxWidth: '100%',
    maxHeight: '92%',
  },
  modalScroll: {
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 0,
    minWidth: 0,
    width: '100%',
  },
  modalTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  modalTitleRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 10,
    width: '100%',
    minWidth: 0,
  },
  modalTitleName: {
    width: '100%',
    flexShrink: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.secondary,
    textAlign: 'left',
  },
  modalAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
    width: '100%',
    minWidth: 0,
  },
  modalAddressText: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  modalMeta: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  modalMetaGrid: {
    gap: 4,
    marginBottom: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalMetaGridCompact: {
    paddingBottom: 10,
    marginBottom: 2,
  },
  modalReasonsStack: {
    gap: 10,
    width: '100%',
    minWidth: 0,
  },
  detailReasonBlock: {
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  detailReasonBlockCompact: {
    padding: 10,
    borderRadius: 10,
  },
  detailReasonBlockRequest: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  detailReasonBlockRejection: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  detailReasonHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    minWidth: 0,
  },
  detailReasonIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailReasonIconWrapRequest: {
    backgroundColor: '#DBEAFE',
  },
  detailReasonIconWrapRejection: {
    backgroundColor: '#FEE2E2',
  },
  detailReasonHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  detailReasonTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight: 16,
  },
  detailReasonTitleRequest: {
    color: '#1E40AF',
  },
  detailReasonTitleRejection: {
    color: '#991B1B',
  },
  detailReasonBody: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  detailReasonBodyRequest: {
    color: '#1E3A8A',
  },
  detailReasonBodyRejection: {
    color: '#7F1D1D',
  },
  modalCloseBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalCloseText: {
    fontWeight: '800',
    color: '#FFF',
    fontSize: 15,
  },
});
