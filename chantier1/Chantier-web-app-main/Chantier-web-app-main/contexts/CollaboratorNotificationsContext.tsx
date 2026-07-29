import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/services/supabase';
import { parseDateKey } from '@/utils/date';
import { isWorker } from '@/utils/role';
import {
  loadCollaboratorNotificationsReadIds,
  markCollaboratorNotificationRead,
  saveCollaboratorNotificationsReadIds,
} from '@/utils/collaboratorNotificationSeen';
import { UserRole } from '@/types';

export type CollaboratorNotificationKind =
  | 'shift_validated'
  | 'shift_rejected'
  | 'worksite_assigned'
  | 'worksite_approved'
  | 'worksite_rejected'
  | 'worksite_shifts_cancelled';

export type CollaboratorNotification = {
  id: string;
  kind: CollaboratorNotificationKind;
  title: string;
  subtitle: string;
  createdAt: string;
  pathname:
    | '/declare-day-empty'
    | '/declare-day'
    | '/(tabs)/ouvrier-dashboard';
  params: Record<string, string>;
};

type CollaboratorNotificationsContextValue = {
  items: CollaboratorNotification[];
  /** Unread notifications only (badge count). */
  count: number;
  loading: boolean;
  enabled: boolean;
  countIncreased: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  clearCountIncreased: () => void;
  isItemUnread: (id: string) => boolean;
  markAsRead: (id: string) => Promise<void>;
};

const CollaboratorNotificationsContext =
  createContext<CollaboratorNotificationsContextValue | null>(null);

const POLL_MS = 30_000;
const REALTIME_DEBOUNCE_MS = 350;
const LOOKBACK_DAYS = 14;
const SHIFT_NOTIFICATION_LIMIT = 20;

type DiversNotificationRow = {
  chantier_id: string;
  nom: string | null;
  divers_statut: string;
  divers_reviewed_at: string;
  divers_rejection_reason: string | null;
  cancelled_shifts_count: number;
};

const NOTIFICATION_KIND_PRIORITY: Record<CollaboratorNotificationKind, number> = {
  worksite_rejected: 0,
  worksite_shifts_cancelled: 1,
  shift_rejected: 2,
  worksite_assigned: 3,
  worksite_approved: 4,
  shift_validated: 5,
};

function notificationSortRank(item: CollaboratorNotification): number {
  return NOTIFICATION_KIND_PRIORITY[item.kind] ?? 9;
}

function formatShortDate(dateKey: string, locale: string): string {
  try {
    return parseDateKey(dateKey).toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateKey;
  }
}

function lookbackIso(): string {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - LOOKBACK_DAYS);
  return cutoff.toISOString();
}

export function CollaboratorNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const { t, dateLocale } = useLanguage();
  const n = t.collaboratorNotifications;
  const [items, setItems] = useState<CollaboratorNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [readLoaded, setReadLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countIncreased, setCountIncreased] = useState(false);
  const prevUnreadCountRef = useRef(0);
  const role = profile?.role as UserRole | undefined;
  const enabled = !!profile?.id && !!role && isWorker(role);

  const isItemUnread = useCallback(
    (id: string) => !readIds.has(id),
    [readIds],
  );

  const unreadCount = useMemo(
    () => items.filter((item) => !readIds.has(item.id)).length,
    [items, readIds],
  );

  useEffect(() => {
    if (!profile?.id || !enabled) {
      setReadIds(new Set());
      setReadLoaded(false);
      return;
    }
    let cancelled = false;
    void loadCollaboratorNotificationsReadIds(profile.id).then((stored) => {
      if (cancelled) return;
      setReadIds(stored);
      setReadLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, profile?.id]);

  const markAsRead = useCallback(
    async (id: string) => {
      if (!profile?.id || readIds.has(id)) return;
      const next = await markCollaboratorNotificationRead(profile.id, id, readIds);
      setReadIds(next);
    },
    [profile?.id, readIds],
  );

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled || !profile?.id) {
        setItems([]);
        setLoading(false);
        prevUnreadCountRef.current = 0;
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }

      try {
        const cutoff = lookbackIso();
        const next: CollaboratorNotification[] = [];

        const { data: periods, error: periodsError } = await supabase
          .from('periodes_travail')
          .select('id, date, statut, updated_at, chantiers (nom)')
          .eq('user_id', profile.id)
          .in('statut', ['validee', 'rejetee'])
          .gte('updated_at', cutoff)
          .order('updated_at', { ascending: false })
          .limit(SHIFT_NOTIFICATION_LIMIT);
        if (periodsError) throw periodsError;

        for (const row of periods ?? []) {
          const worksiteName = (row.chantiers as { nom?: string } | null)?.nom ?? '—';
          const dateLabel = formatShortDate(String(row.date ?? ''), dateLocale);
          const validated = row.statut === 'validee';

          next.push({
            id: `shift-${row.id}`,
            kind: validated ? 'shift_validated' : 'shift_rejected',
            title: validated ? n.shiftValidatedTitle : n.shiftRejectedTitle,
            subtitle: n.shiftSubtitle
              .replace('{{worksite}}', worksiteName)
              .replace('{{date}}', dateLabel),
            createdAt: String(row.updated_at ?? row.date ?? ''),
            pathname: '/declare-day-empty',
            params: { date: String(row.date ?? '') },
          });
        }

        const { data: affectations, error: affError } = await supabase
          .from('affectations_chantiers')
          .select('id, created_at, chantiers (nom, code)')
          .eq('user_id', profile.id)
          .gte('created_at', cutoff)
          .order('created_at', { ascending: false })
          .limit(20);
        if (affError) throw affError;

        for (const row of affectations ?? []) {
          const worksiteName = (row.chantiers as { nom?: string } | null)?.nom ?? '—';
          next.push({
            id: `assigned-${row.id}`,
            kind: 'worksite_assigned',
            title: n.worksiteAssignedTitle,
            subtitle: n.worksiteAssignedSubtitle.replace('{{name}}', worksiteName),
            createdAt: String(row.created_at ?? ''),
            pathname: '/(tabs)/ouvrier-dashboard',
            params: {},
          });
        }

        type DiversRpcResult = {
          data: DiversNotificationRow[] | null;
          error: { message?: string } | null;
        };

        let diversRows: DiversNotificationRow[] = [];
        const rpcResult = (await supabase.rpc('get_collaborator_divers_notifications', {
          p_since: cutoff,
        })) as DiversRpcResult;

        if (rpcResult.error) {
          console.warn(
            '[collaboratorNotifications] divers RPC unavailable, falling back to direct query',
            rpcResult.error.message,
          );
          const { data, error: diversError } = await supabase
            .from('chantiers')
            .select('id, nom, divers_statut, divers_reviewed_at, divers_rejection_reason')
            .eq('created_by', profile.id)
            .eq('source', 'divers')
            .in('divers_statut', ['approuve', 'rejete'])
            .not('divers_reviewed_at', 'is', null)
            .gte('divers_reviewed_at', cutoff)
            .order('divers_reviewed_at', { ascending: false })
            .limit(20);
          if (diversError) throw diversError;
          diversRows = (data ?? []).map((row) => ({
            chantier_id: row.id,
            nom: row.nom,
            divers_statut: String(row.divers_statut ?? ''),
            divers_reviewed_at: String(row.divers_reviewed_at ?? ''),
            divers_rejection_reason: row.divers_rejection_reason ?? null,
            cancelled_shifts_count: 0,
          }));
        } else {
          diversRows = rpcResult.data ?? [];
        }

        const rejectedChantierIds: string[] = [];

        for (const row of diversRows) {
          const approved = row.divers_statut === 'approuve';
          if (!approved) {
            rejectedChantierIds.push(row.chantier_id);
          }
          const reason =
            row.divers_rejection_reason?.trim() || n.noRejectionReason;
          next.push({
            id: `divers-${row.chantier_id}`,
            kind: approved ? 'worksite_approved' : 'worksite_rejected',
            title: approved ? n.worksiteApprovedTitle : n.worksiteRejectedTitle,
            subtitle: approved
              ? n.worksiteReviewSubtitle.replace('{{name}}', row.nom ?? '—')
              : n.worksiteRejectedSubtitle
                  .replace('{{name}}', row.nom ?? '—')
                  .replace('{{reason}}', reason),
            createdAt: String(row.divers_reviewed_at ?? ''),
            pathname: '/(tabs)/ouvrier-dashboard',
            params: {},
          });

          if (!approved && Number(row.cancelled_shifts_count) > 0) {
            next.push({
              id: `shifts-cancelled-${row.chantier_id}`,
              kind: 'worksite_shifts_cancelled',
              title: n.worksiteShiftsCancelledTitle,
              subtitle: n.worksiteShiftsCancelledSubtitle
                .replace('{{count}}', String(row.cancelled_shifts_count))
                .replace('{{worksite}}', row.nom ?? '—'),
              createdAt: String(row.divers_reviewed_at ?? ''),
              pathname: '/(tabs)/ouvrier-dashboard',
              params: {},
            });
          }
        }

        if (rejectedChantierIds.length > 0 && rpcResult.error) {
          const { data: cancelledDecls, error: cancelledError } = await supabase
            .from('declarations_heures')
            .select('id, chantier_id, date, updated_at, chantiers (nom)')
            .eq('user_id', profile.id)
            .eq('statut', 'annulee')
            .in('chantier_id', rejectedChantierIds)
            .gte('updated_at', cutoff)
            .order('updated_at', { ascending: false })
            .limit(60);
          if (cancelledError) throw cancelledError;

          const grouped = new Map<string, { count: number; worksite: string; latestAt: string }>();
          for (const row of cancelledDecls ?? []) {
            const chantierId = String(row.chantier_id);
            const worksiteName =
              (row.chantiers as { nom?: string } | null)?.nom ?? '—';
            const updatedAt = String(row.updated_at ?? row.date ?? '');
            const existing = grouped.get(chantierId);
            if (existing) {
              existing.count += 1;
              if (updatedAt > existing.latestAt) {
                existing.latestAt = updatedAt;
              }
            } else {
              grouped.set(chantierId, {
                count: 1,
                worksite: worksiteName,
                latestAt: updatedAt,
              });
            }
          }

          for (const [chantierId, info] of grouped) {
            next.push({
              id: `shifts-cancelled-${chantierId}`,
              kind: 'worksite_shifts_cancelled',
              title: n.worksiteShiftsCancelledTitle,
              subtitle: n.worksiteShiftsCancelledSubtitle
                .replace('{{count}}', String(info.count))
                .replace('{{worksite}}', info.worksite),
              createdAt: info.latestAt,
              pathname: '/(tabs)/ouvrier-dashboard',
              params: {},
            });
          }
        }

        next.sort((a, b) => {
          const rankDiff = notificationSortRank(a) - notificationSortRank(b);
          if (rankDiff !== 0) return rankDiff;
          return a.createdAt < b.createdAt ? 1 : -1;
        });

        setItems(next);
        setReadIds((prev) => {
          const validIds = new Set(next.map((item) => item.id));
          const pruned = new Set([...prev].filter((id) => validIds.has(id)));
          if (pruned.size !== prev.size && profile?.id) {
            void saveCollaboratorNotificationsReadIds(profile.id, pruned);
          }
          return pruned.size === prev.size ? prev : pruned;
        });
      } catch (error) {
        console.warn('[collaboratorNotifications] load failed', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [
      dateLocale,
      enabled,
      n.shiftRejectedTitle,
      n.shiftSubtitle,
      n.shiftValidatedTitle,
      n.worksiteApprovedTitle,
      n.worksiteAssignedSubtitle,
      n.worksiteAssignedTitle,
      n.worksiteRejectedTitle,
      n.worksiteRejectedSubtitle,
      n.worksiteReviewSubtitle,
      n.worksiteShiftsCancelledSubtitle,
      n.worksiteShiftsCancelledTitle,
      n.noRejectionReason,
      profile?.id,
    ],
  );

  useEffect(() => {
    if (!enabled || !profile?.id) {
      setItems([]);
      setLoading(false);
      prevUnreadCountRef.current = 0;
      return;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    const userFilter = `user_id=eq.${profile.id}`;
    const creatorFilter = `created_by=eq.${profile.id}`;

    const scheduleReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void load({ silent: true });
      }, REALTIME_DEBOUNCE_MS);
    };

    void load();

    const channelName = `collaborator-notifications-${profile.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'periodes_travail', filter: userFilter },
        scheduleReload,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'declarations_heures', filter: userFilter },
        scheduleReload,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'affectations_chantiers', filter: userFilter },
        scheduleReload,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chantiers', filter: creatorFilter },
        scheduleReload,
      )
      .subscribe((status, err) => {
        if (__DEV__ && status === 'SUBSCRIBED') {
          console.debug('[collaboratorNotifications] realtime subscribed', channelName);
        }
        if (status === 'CHANNEL_ERROR' || err) {
          console.warn('[collaboratorNotifications] realtime issue', status, err?.message ?? err);
        }
      });

    pollTimer = setInterval(() => {
      void load({ silent: true });
    }, POLL_MS);

    const onAppState = (next: AppStateStatus) => {
      if (next === 'active') {
        void load({ silent: true });
      }
    };
    const appSub = AppState.addEventListener('change', onAppState);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (pollTimer) clearInterval(pollTimer);
      appSub.remove();
      supabase.removeChannel(channel);
    };
  }, [enabled, load, profile?.id]);

  useFocusEffect(
    useCallback(() => {
      if (enabled) {
        void load({ silent: true });
      }
    }, [enabled, load]),
  );

  useEffect(() => {
    if (!readLoaded) return;
    if (unreadCount > prevUnreadCountRef.current) {
      setCountIncreased(true);
    }
    prevUnreadCountRef.current = unreadCount;
  }, [readLoaded, unreadCount]);

  const clearCountIncreased = useCallback(() => {
    setCountIncreased(false);
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: unreadCount,
      loading,
      enabled,
      countIncreased,
      refresh: load,
      clearCountIncreased,
      isItemUnread,
      markAsRead,
    }),
    [
      clearCountIncreased,
      countIncreased,
      enabled,
      isItemUnread,
      items,
      load,
      loading,
      markAsRead,
      unreadCount,
    ],
  );

  return (
    <CollaboratorNotificationsContext.Provider value={value}>
      {children}
    </CollaboratorNotificationsContext.Provider>
  );
}

export function useCollaboratorNotifications() {
  const ctx = useContext(CollaboratorNotificationsContext);
  if (!ctx) {
    throw new Error('useCollaboratorNotifications must be used within CollaboratorNotificationsProvider');
  }
  return ctx;
}
