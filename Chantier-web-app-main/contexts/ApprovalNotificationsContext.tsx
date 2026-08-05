import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/services/supabase';
import { UserRole } from '@/types';
import { parseDateKey } from '@/utils/date';
import { canReviewChantierDivers, canValidate } from '@/utils/role';
import { getChefManagedChantierIds } from '@/utils/team';
import {
  loadApprovalNotificationsReadIds,
  markApprovalNotificationRead,
  saveApprovalNotificationsReadIds,
} from '@/utils/approvalNotificationSeen';

export type ApprovalNotificationKind = 'timesheet' | 'worksite_request';

export type ApprovalNotification = {
  id: string;
  kind: ApprovalNotificationKind;
  title: string;
  subtitle: string;
  createdAt: string;
  pathname: '/(tabs)/validation' | '/(tabs)/management' | '/(tabs)/admin-worksites';
  params: Record<string, string>;
};

type ApprovalNotificationsContextValue = {
  items: ApprovalNotification[];
  /** Unread pending notifications (badge count). */
  count: number;
  loading: boolean;
  enabled: boolean;
  countIncreased: boolean;
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  clearCountIncreased: () => void;
  isItemUnread: (id: string) => boolean;
  markAsRead: (id: string) => Promise<void>;
};

const ApprovalNotificationsContext = createContext<ApprovalNotificationsContextValue | null>(null);

const POLL_MS = 30_000;
const REALTIME_DEBOUNCE_MS = 350;

function worksitePendingTarget(
  role: UserRole,
  chantierId: string,
): Pick<ApprovalNotification, 'pathname' | 'params'> {
  if (role === 'administratif') {
    return {
      pathname: '/(tabs)/admin-worksites',
      params: { worksiteView: 'pending', highlightChantierId: chantierId },
    };
  }
  return {
    pathname: '/(tabs)/management',
    params: { tab: 'worksites', worksiteView: 'pending', highlightChantierId: chantierId },
  };
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

export function ApprovalNotificationsProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const { t, dateLocale } = useLanguage();
  const n = t.approvalNotifications;
  const [items, setItems] = useState<ApprovalNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [readLoaded, setReadLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [countIncreased, setCountIncreased] = useState(false);
  const prevUnreadCountRef = useRef(0);
  const role = profile?.role as UserRole | undefined;
  const enabled =
    !!profile?.id &&
    !!role &&
    (canValidate(role) || canReviewChantierDivers(role));

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
    void loadApprovalNotificationsReadIds(profile.id).then((stored) => {
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
      const next = await markApprovalNotificationRead(profile.id, id, readIds);
      setReadIds(next);
    },
    [profile?.id, readIds],
  );

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled || !profile?.id || !role) {
        setItems([]);
        setLoading(false);
        prevUnreadCountRef.current = 0;
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }

      try {
        const next: ApprovalNotification[] = [];

        if (canValidate(role)) {
          let managedIds: string[] | null = null;
          if (role === 'chef_equipe') {
            managedIds = await getChefManagedChantierIds(profile.id);
            if (managedIds.length === 0) {
              managedIds = null;
            }
          }

          if (role !== 'chef_equipe' || (managedIds && managedIds.length > 0)) {
            let declQuery = supabase
              .from('declarations_heures')
              .select(`
                id,
                user_id,
                chantier_id,
                date,
                created_at,
                profiles!declarations_heures_user_id_fkey (nom, prenom),
                chantiers (nom)
              `)
              .eq('statut', 'soumise')
              .order('created_at', { ascending: false })
              .limit(40);

            if (managedIds?.length) {
              declQuery = declQuery.in('chantier_id', managedIds);
            }

            const { data, error } = await declQuery;
            if (error) throw error;

            for (const row of data ?? []) {
              const prenom = (row.profiles as { prenom?: string } | null)?.prenom ?? '';
              const nom = (row.profiles as { nom?: string } | null)?.nom ?? '';
              const workerName = `${prenom} ${nom}`.trim() || '—';
              const worksiteName = (row.chantiers as { nom?: string } | null)?.nom ?? '—';
              const dateLabel = formatShortDate(String(row.date ?? ''), dateLocale);

              next.push({
                id: `timesheet-${row.id}`,
                kind: 'timesheet',
                title: n.timesheetTitle,
                subtitle: n.timesheetSubtitle
                  .replace('{{name}}', workerName)
                  .replace('{{worksite}}', worksiteName)
                  .replace('{{date}}', dateLabel),
                createdAt: String(row.created_at ?? row.date ?? ''),
                pathname: '/(tabs)/validation',
                params: {
                  filter: 'pending',
                  highlightChantierId: String(row.chantier_id),
                  expandedUserId: String(row.user_id),
                  highlightDeclId: String(row.id),
                },
              });
            }
          }
        }

        if (canReviewChantierDivers(role)) {
          const { data, error } = await supabase
            .from('chantiers')
            .select('id, nom, adresse, created_at, created_by')
            .eq('source', 'divers')
            .eq('divers_statut', 'en_attente')
            .order('created_at', { ascending: false })
            .limit(40);
          if (error) throw error;

          const creatorIds = [...new Set((data ?? []).map((r) => r.created_by).filter(Boolean))] as string[];
          let creatorLabels: Record<string, string> = {};
          if (creatorIds.length > 0) {
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, nom, prenom')
              .in('id', creatorIds);
            creatorLabels = Object.fromEntries(
              (profiles ?? []).map((p) => [p.id, `${p.prenom} ${p.nom}`.trim()]),
            );
          }

          for (const row of data ?? []) {
            const creator = row.created_by ? creatorLabels[row.created_by] ?? '—' : '—';
            const target = worksitePendingTarget(role, row.id);
            next.push({
              id: `worksite-${row.id}`,
              kind: 'worksite_request',
              title: n.worksiteTitle,
              subtitle: n.worksiteSubtitle
                .replace('{{name}}', row.nom ?? '—')
                .replace('{{creator}}', creator),
              createdAt: String(row.created_at ?? ''),
              ...target,
            });
          }
        }

        next.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

        setItems(next);
        setReadIds((prev) => {
          const validIds = new Set(next.map((item) => item.id));
          const pruned = new Set([...prev].filter((id) => validIds.has(id)));
          if (pruned.size !== prev.size && profile?.id) {
            void saveApprovalNotificationsReadIds(profile.id, pruned);
          }
          return pruned.size === prev.size ? prev : pruned;
        });
      } catch (error) {
        console.warn('[approvalNotifications] load failed', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [
      dateLocale,
      enabled,
      n.timesheetSubtitle,
      n.timesheetTitle,
      n.worksiteSubtitle,
      n.worksiteTitle,
      profile?.id,
      role,
    ],
  );

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      prevUnreadCountRef.current = 0;
      return;
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const scheduleReload = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void load({ silent: true });
      }, REALTIME_DEBOUNCE_MS);
    };

    void load();

    const channelName = `approval-notifications-${profile?.id ?? 'session'}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'declarations_heures' },
        scheduleReload,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'periodes_travail' },
        scheduleReload,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chantiers' },
        scheduleReload,
      )
      .subscribe((status, err) => {
        if (__DEV__ && status === 'SUBSCRIBED') {
          console.debug('[approvalNotifications] realtime subscribed', channelName);
        }
        if (status === 'CHANNEL_ERROR' || err) {
          console.warn('[approvalNotifications] realtime issue', status, err?.message ?? err);
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
    <ApprovalNotificationsContext.Provider value={value}>
      {children}
    </ApprovalNotificationsContext.Provider>
  );
}

export function useApprovalNotifications() {
  const ctx = useContext(ApprovalNotificationsContext);
  if (!ctx) {
    throw new Error('useApprovalNotifications must be used within ApprovalNotificationsProvider');
  }
  return ctx;
}
