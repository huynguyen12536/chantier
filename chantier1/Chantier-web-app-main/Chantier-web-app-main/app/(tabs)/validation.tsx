import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ImageBackground,
  AppState,
  TextInput,
  type AppStateStatus,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/services/supabase';
import { Check, Clock, ChevronDown, X, List, Building2, User, MapPin, Search, UtensilsCrossed } from 'lucide-react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { ConfirmModal } from '@/components/common';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { getChefManagedChantierIds } from '@/utils/team';
import { calculateDuration } from '@/utils/time';

type DeclarationPeriodSlot = {
  id: string;
  heure_debut: string;
  heure_fin: string | null;
  panier_repas: boolean;
  deplacement: boolean;
  statut: string;
};

type DeclarationWithDetails = {
  id: string;
  user_id: string;
  chantier_id: string;
  date: string;
  heures_normales: number;
  heures_supplementaires: number;
  nb_paniers: number;
  nb_deplacements: number;
  statut: string;
  /** Built from `periodes_travail` (summary row has no start/end). */
  timeRangeLabel?: string;
  /** One entry per work period — drives one card each when length > 0. */
  periods?: DeclarationPeriodSlot[];
  profiles: {
    nom: string;
    prenom: string;
    matricule: string;
  };
  chantiers: {
    nom: string;
    code: string;
  };
};

type UserWeeklySummary = {
  user_id: string;
  nom: string;
  prenom: string;
  totalHours: number;
  mainChantier: string;
  declarations: DeclarationWithDetails[];
  hasPending: boolean;
};

type UserByWorksiteSummary = {
  user_id: string;
  nom: string;
  prenom: string;
  declarations: DeclarationWithDetails[];
  hasPending: boolean;
  totalHours: number;
};

type WorksiteValidationSummary = {
  chantier_id: string;
  chantierNom: string;
  chantierCode: string;
  users: UserByWorksiteSummary[];
  pendingDeclarationCount: number;
};

type CancelPromptState =
  | null
  | { kind: 'bulk'; userId: string }
  | { kind: 'single'; declId: string };

type ValidateAllConfirmState = {
  workers: number;
  declarations: number;
} | null;

type FeedbackModalState = {
  title: string;
  message: string;
  iconVariant: 'success' | 'danger';
} | null;

const validationHeaderBackground = require('../../assets/images/bg (2).png');
const VISIBLE_DECL_COUNT = 3;
const DECL_ROW_HEIGHT = 102;
/** Soft refresh if Realtime misses events (web/network). */
const VALIDATION_POLL_MS = 35_000;
const REALTIME_RELOAD_DEBOUNCE_MS = 400;

export default function ValidationScreen() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();
  const routeParams = useLocalSearchParams<{ filter?: string; expandedUserId?: string }>();
  const [weeklyData, setWeeklyData] = useState<UserWeeklySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [allStatusFilter, setAllStatusFilter] = useState<'validee' | 'annulee'>('validee');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [selectedWorksiteId, setSelectedWorksiteId] = useState<string | null>(null);
  const [validatingAll, setValidatingAll] = useState(false);
  const [processingDeclIds, setProcessingDeclIds] = useState<Record<string, boolean>>({});
  const [cancellingUserId, setCancellingUserId] = useState<string | null>(null);
  const [cancelPrompt, setCancelPrompt] = useState<CancelPromptState>(null);
  const [validateAllConfirm, setValidateAllConfirm] = useState<ValidateAllConfirmState>(null);
  const [feedbackModal, setFeedbackModal] = useState<FeedbackModalState>(null);
  const [search, setSearch] = useState('');

  // Le modal fait un fondu de sortie : pendant l'animation, `feedbackModal` est
  // déjà null. On garde le dernier contenu affiché pour éviter un flash "danger"
  // vide (icône rouge + texte vide) lors de la fermeture du popup de succès.
  const lastFeedbackRef = React.useRef<FeedbackModalState>(null);
  if (feedbackModal) {
    lastFeedbackRef.current = feedbackModal;
  }
  const feedbackContent = feedbackModal ?? lastFeedbackRef.current;

  useFocusEffect(
    useCallback(() => {
      if (routeParams.filter === 'pending' || routeParams.filter === 'all') {
        setFilter(routeParams.filter);
      }
      if (routeParams.expandedUserId) {
        setExpandedUserId(routeParams.expandedUserId);
      }
    }, [routeParams.filter, routeParams.expandedUserId])
  );

  /** Always loads every statut for the team; tab “En attente” vs “Toutes” only changes what we display (see displayedWeeklyUsers). Realtime/polling then stay correct on both tabs. */
  const loadDeclarations = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) {
      setLoading(true);
    }
    try {
      let query = supabase
        .from('declarations_heures')
        .select(`
          *,
          profiles!declarations_heures_user_id_fkey (nom, prenom, matricule),
          chantiers (nom, code)
        `)
        .order('date', { ascending: false });

      if (profile?.role === 'chef_equipe') {
        const chantierIds = await getChefManagedChantierIds(profile.id);
        if (chantierIds.length > 0) {
          query = query.in('chantier_id', chantierIds);
        } else {
          setWeeklyData([]);
          if (!silent) {
            setLoading(false);
          }
          return;
        }
      }

      const { data: declarations, error } = await query;
      if (error) throw error;

      const periodsByDeclKey = new Map<string, DeclarationPeriodSlot[]>();

      if (declarations?.length) {
        const userIds = [...new Set(declarations.map((d) => d.user_id as string))];
        const dates = declarations.map((d) => d.date as string);
        const minDate = dates.reduce((a, b) => (a < b ? a : b));
        const maxDate = dates.reduce((a, b) => (a > b ? a : b));
        const declKeys = new Set(
          declarations.map((d) =>
            declarationPeriodLookupKey(d.user_id as string, d.chantier_id as string, d.date as string)
          )
        );

        const { data: periodes, error: periodesError } = await supabase
          .from('periodes_travail')
          .select('id, user_id, chantier_id, date, heure_debut, heure_fin, panier_repas, deplacement, statut')
          .in('user_id', userIds)
          .gte('date', minDate)
          .lte('date', maxDate)
          .neq('statut', 'rejetee');

        if (periodesError) {
          console.warn('Error loading periodes for validation cards:', periodesError);
        } else {
          for (const p of periodes || []) {
            if (p.statut === 'annulee') continue;
            const k = declarationPeriodLookupKey(
              p.user_id as string,
              p.chantier_id as string,
              p.date as string
            );
            if (!declKeys.has(k)) continue;
            const slot: DeclarationPeriodSlot = {
              id: String(p.id),
              heure_debut: String(p.heure_debut),
              heure_fin: p.heure_fin != null ? String(p.heure_fin) : null,
              panier_repas: readPeriodBoolean(p.panier_repas),
              deplacement: readPeriodBoolean(p.deplacement),
              statut: String(p.statut ?? ''),
            };
            const list = periodsByDeclKey.get(k) ?? [];
            list.push(slot);
            periodsByDeclKey.set(k, list);
          }
        }
      }

      const summaryMap = new Map<string, UserWeeklySummary>();

      (declarations || []).forEach((rawDecl) => {
        const key = declarationPeriodLookupKey(
          rawDecl.user_id as string,
          rawDecl.chantier_id as string,
          rawDecl.date as string
        );
        const periods = dedupePeriodsById(periodsByDeclKey.get(key) ?? []).sort((a, b) =>
          a.heure_debut.localeCompare(b.heure_debut)
        );
        const timeRangeLabel = formatPeriodSlotsLabel(periods);
        const decl: DeclarationWithDetails = {
          ...(rawDecl as DeclarationWithDetails),
          periods,
          timeRangeLabel,
        };

        if (!summaryMap.has(decl.user_id)) {
          summaryMap.set(decl.user_id, {
            user_id: decl.user_id,
            nom: decl.profiles.nom,
            prenom: decl.profiles.prenom,
            totalHours: 0,
            mainChantier: decl.chantiers.nom,
            declarations: [],
            hasPending: false,
          });
        }

        const summary = summaryMap.get(decl.user_id)!;
        summary.declarations.push(decl);
        if (decl.statut !== 'annulee') {
          summary.totalHours += decl.heures_normales + decl.heures_supplementaires;
        }
        if (decl.statut === 'soumise') {
          summary.hasPending = true;
        }
      });

      setWeeklyData(Array.from(summaryMap.values()));
    } catch (error) {
      console.error('Error loading declarations:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [profile?.id, profile?.role]);

  useFocusEffect(
    useCallback(() => {
      let debounceTimer: ReturnType<typeof setTimeout> | null = null;
      let pollTimer: ReturnType<typeof setInterval> | null = null;

      const scheduleReloadFromRealtime = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          void loadDeclarations({ silent: true });
        }, REALTIME_RELOAD_DEBOUNCE_MS);
      };

      void loadDeclarations();

      const channelName = `validation-hebdo-${profile?.id ?? 'session'}`;
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'declarations_heures' },
          scheduleReloadFromRealtime
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'periodes_travail' },
          scheduleReloadFromRealtime
        )
        .subscribe((status, err) => {
          if (__DEV__ && status === 'SUBSCRIBED') {
            console.debug('[validation] realtime subscribed', channelName);
          }
          if (status === 'CHANNEL_ERROR' || err) {
            console.warn('[validation] realtime channel issue', status, err?.message ?? err);
          }
        });

      pollTimer = setInterval(() => {
        void loadDeclarations({ silent: true });
      }, VALIDATION_POLL_MS);

      const onAppState = (next: AppStateStatus) => {
        if (next === 'active') {
          void loadDeclarations({ silent: true });
        }
      };
      const appSub = AppState.addEventListener('change', onAppState);

      return () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (pollTimer) clearInterval(pollTimer);
        appSub.remove();
        supabase.removeChannel(channel);
      };
    }, [loadDeclarations, profile?.id])
  );

  const worksiteData = useMemo<WorksiteValidationSummary[]>(() => {
    const chantierMap = new Map<
      string,
      {
        chantier_id: string;
        chantierNom: string;
        chantierCode: string;
        usersMap: Map<string, UserByWorksiteSummary>;
      }
    >();

    weeklyData.forEach((user) => {
      user.declarations.forEach((decl) => {
        const chantierId = decl.chantier_id;
        if (!chantierMap.has(chantierId)) {
          chantierMap.set(chantierId, {
            chantier_id: chantierId,
            chantierNom: decl.chantiers.nom,
            chantierCode: decl.chantiers.code,
            usersMap: new Map<string, UserByWorksiteSummary>(),
          });
        }
        const chantier = chantierMap.get(chantierId)!;
        if (!chantier.usersMap.has(user.user_id)) {
          chantier.usersMap.set(user.user_id, {
            user_id: user.user_id,
            nom: user.nom,
            prenom: user.prenom,
            declarations: [],
            hasPending: false,
            totalHours: 0,
          });
        }
        const userBucket = chantier.usersMap.get(user.user_id)!;
        userBucket.declarations.push(decl);
      });
    });

    return Array.from(chantierMap.values())
      .map((chantier) => {
        const users = Array.from(chantier.usersMap.values()).map((u) => {
          const hasPending = u.declarations.some((d) => d.statut === 'soumise');
          const totalHours = u.declarations.reduce(
            (sum, d) =>
              d.statut === 'annulee'
                ? sum
                : sum + d.heures_normales + d.heures_supplementaires,
            0,
          );
          return {
            ...u,
            hasPending,
            totalHours,
            declarations: [...u.declarations].sort((a, b) => b.date.localeCompare(a.date)),
          };
        });
        const pendingDeclarationCount = users.reduce(
          (sum, u) => sum + u.declarations.filter((d) => d.statut === 'soumise').length,
          0,
        );
        return {
          chantier_id: chantier.chantier_id,
          chantierNom: chantier.chantierNom,
          chantierCode: chantier.chantierCode,
          users: users.sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`, 'fr')),
          pendingDeclarationCount,
        };
      })
      .sort((a, b) => a.chantierNom.localeCompare(b.chantierNom, 'fr'));
  }, [weeklyData]);

  const validatedWorksiteCount = useMemo(
    () =>
      worksiteData.filter((worksite) =>
        worksite.users.some((user) => user.declarations.some((d) => d.statut === 'validee')),
      ).length,
    [worksiteData],
  );

  const allTabFilteredWorksites = useMemo<WorksiteValidationSummary[]>(() => {
    return worksiteData
      .map((worksite) => {
        const users = worksite.users
          .map((user) => {
            const declarations = user.declarations.filter((d) => d.statut === allStatusFilter);
            if (declarations.length === 0) return null;
            const totalHours = declarations.reduce(
              (sum, d) => sum + d.heures_normales + d.heures_supplementaires,
              0,
            );
            return {
              ...user,
              declarations,
              totalHours,
              hasPending: false,
            };
          })
          .filter((u): u is UserByWorksiteSummary => Boolean(u));

        return {
          ...worksite,
          users,
        };
      })
      .filter((worksite) => worksite.users.length > 0);
  }, [allStatusFilter, worksiteData]);

  const visibleWorksites = useMemo(
    () =>
      filter === 'pending'
        ? worksiteData.filter((w) => w.pendingDeclarationCount > 0)
        : allTabFilteredWorksites,
    [allTabFilteredWorksites, filter, worksiteData],
  );

  const searchFilteredWorksites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleWorksites;

    return visibleWorksites
      .map((worksite) => {
        const worksiteHaystack = `${worksite.chantierNom} ${worksite.chantierCode}`.toLowerCase();
        if (worksiteHaystack.includes(q)) return worksite;

        const users = worksite.users.filter((user) => {
          const userHaystack = `${user.prenom} ${user.nom}`.toLowerCase();
          return userHaystack.includes(q);
        });
        return { ...worksite, users };
      })
      .filter((worksite) => worksite.users.length > 0);
  }, [visibleWorksites, search]);

  useEffect(() => {
    if (
      selectedWorksiteId &&
      !searchFilteredWorksites.some((w) => w.chantier_id === selectedWorksiteId)
    ) {
      setSelectedWorksiteId(null);
      setExpandedUserId(null);
    }
  }, [searchFilteredWorksites, selectedWorksiteId]);

  const selectedWorksite = useMemo(
    () => searchFilteredWorksites.find((w) => w.chantier_id === selectedWorksiteId) ?? null,
    [selectedWorksiteId, searchFilteredWorksites],
  );

  const hasActiveSearch = search.trim().length > 0;

  const syncPeriodsForDeclaration = async (
    decl: Pick<DeclarationWithDetails, 'user_id' | 'chantier_id' | 'date'>,
    statut: 'validee' | 'rejetee'
  ) => {
    const { error } = await supabase
      .from('periodes_travail')
      .update({
        statut,
        validated_by: profile?.id,
        validated_at: new Date().toISOString(),
      })
      .eq('user_id', decl.user_id)
      .eq('chantier_id', decl.chantier_id)
      .eq('date', decl.date)
      .in('statut', ['terminee', 'en_cours']);

    if (error) throw error;
  };

  const updateDeclarationRecord = async (
    decl: DeclarationWithDetails,
    statut: 'validee' | 'rejetee'
  ) => {
    const { data, error } = await supabase
      .from('declarations_heures')
      .update({
        statut,
        validated_by: profile?.id,
        validated_at: new Date().toISOString(),
      })
      .eq('id', decl.id)
      .select('id, statut')
      .maybeSingle();

    if (error) throw error;
    if (!data || data.statut !== statut) {
      throw new Error(t.chefDashboard.errorValidate);
    }
  };

  const validateDeclaration = async (
    decl: DeclarationWithDetails,
    statut: 'validee' | 'rejetee'
  ) => {
    await updateDeclarationRecord(decl, statut);

    try {
      await syncPeriodsForDeclaration(decl, statut);
    } catch (syncError) {
      console.warn('Could not sync periodes_travail after validation:', syncError);
    }
  };

  const findDeclarationById = (declId: string): DeclarationWithDetails | undefined => {
    for (const user of weeklyData) {
      const decl = user.declarations.find((d) => d.id === declId);
      if (decl) return decl;
    }
    return undefined;
  };

  /** If DB trigger did not set annulee (migration pending), finish cancel from the client. */
  const ensureDeclarationAnnuleeAfterPeriodsRemoved = async (decl: DeclarationWithDetails) => {
    const { data: row, error: selErr } = await supabase
      .from('declarations_heures')
      .select('id, statut')
      .eq('id', decl.id)
      .maybeSingle();

    if (selErr) throw selErr;
    console.log('[validation cancel] ensureAnnulee before update', {
      declId: decl.id,
      selectRow: row ?? null,
      clientStatut: decl.statut,
    });

    // Avoid chaining `.select()` on PATCH — some stacks stall or mishandle Prefer:
    // return=representation with RLS; verify row status with a separate SELECT.
    const { error: updErr } = await supabase
      .from('declarations_heures')
      .update({
        statut: 'annulee',
        validated_by: profile?.id ?? null,
        validated_at: new Date().toISOString(),
      })
      .eq('id', decl.id)
      .eq('statut', 'soumise');

    const updErrPayload = updErr
      ? {
          message: updErr.message,
          code: updErr.code,
          details: (updErr as { details?: string }).details,
          hint: (updErr as { hint?: string }).hint,
        }
      : null;

    console.log(
      '[validation cancel] ensureAnnulee update finished',
      decl.id,
      updErrPayload ? JSON.stringify(updErrPayload) : 'OK'
    );
    if (updErr) {
      console.error(
        '[validation cancel] UPDATE declarations_heures failed —',
        updErr.code ?? '?',
        updErr.message ?? ''
      );
    }

    if (updErr) throw updErr;

    const { data: check, error: checkErr } = await supabase
      .from('declarations_heures')
      .select('statut')
      .eq('id', decl.id)
      .maybeSingle();

    if (checkErr) throw checkErr;

    console.log('[validation cancel] ensureAnnulee verify', {
      declId: decl.id,
      statutAfter: check?.statut ?? null,
    });

    if (check?.statut === 'annulee') return;
    if (check?.statut === 'soumise') {
      throw new Error(t.validation.errorCancelDb);
    }
  };

  const applyLocalDeclarationAnnulee = (userId: string, declId: string) => {
    setWeeklyData((prev) =>
      prev.map((u) => {
        if (u.user_id !== userId) return u;
        const declarations = u.declarations.map((d) =>
          d.id === declId ? { ...d, statut: 'annulee' } : d
        );
        const hasPending = declarations.some((d) => d.statut === 'soumise');
        return { ...u, declarations, hasPending };
      })
    );
  };

  const updateDeclaration = async (decl: DeclarationWithDetails, statut: 'validee' | 'rejetee') => {
    setProcessingDeclIds((prev) => ({ ...prev, [decl.id]: true }));
    try {
      await validateDeclaration(decl, statut);
      await loadDeclarations({ silent: true });
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || (statut === 'rejetee' ? t.validation.errorReject : undefined));
    } finally {
      setProcessingDeclIds((prev) => {
        const next = { ...prev };
        delete next[decl.id];
        return next;
      });
    }
  };

  const handleValidateDeclaration = (declId: string) => {
    const decl = findDeclarationById(declId);
    if (!decl) return;
    void updateDeclaration(decl, 'validee');
  };

  const cancelSingleDeclaration = async (decl: DeclarationWithDetails) => {
    setProcessingDeclIds((prev) => ({ ...prev, [decl.id]: true }));
    try {
      await ensureDeclarationAnnuleeAfterPeriodsRemoved(decl);
      applyLocalDeclarationAnnulee(decl.user_id, decl.id);
      await loadDeclarations({ silent: true });
      Alert.alert(t.common.success, t.validation.declarationCanceled);
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || t.validation.errorCancel);
    } finally {
      setProcessingDeclIds((prev) => {
        const next = { ...prev };
        delete next[decl.id];
        return next;
      });
    }
  };

  const handleCancelDeclaration = (declId: string) => {
    const decl = findDeclarationById(declId);
    if (!decl || decl.statut !== 'soumise') return;
    setCancelPrompt({ kind: 'single', declId });
  };

  const executeCancelUserBulk = async (userId: string, chantierId?: string) => {
    const user = weeklyData.find((u) => u.user_id === userId);
    if (!user) return;

    const pendingDeclarations = user.declarations.filter(
      (d) => d.statut === 'soumise' && (!chantierId || d.chantier_id === chantierId)
    );
    if (pendingDeclarations.length === 0) return;

    console.log('[validation cancel] doCancel start', {
      userId,
      count: pendingDeclarations.length,
      declIds: pendingDeclarations.map((d) => d.id),
    });
    setCancellingUserId(userId);
    try {
      for (const decl of pendingDeclarations) {
        await ensureDeclarationAnnuleeAfterPeriodsRemoved(decl);
        applyLocalDeclarationAnnulee(decl.user_id, decl.id);
      }

      setFilter('all');
      await loadDeclarations({ silent: true });
      setExpandedUserId(userId);
      console.log('[validation cancel] doCancel done — reload OK');
      Alert.alert(t.common.success, `${pendingDeclarations.length} ${t.validation.declarationsCanceled}`);
    } catch (error: any) {
      console.error('[validation cancel] doCancel error', error, {
        message: error?.message,
        code: error?.code,
        details: error?.details,
      });
      Alert.alert(t.common.error, error.message || t.validation.errorCancelAll);
    } finally {
      setCancellingUserId(null);
      console.log('[validation cancel] doCancel finally');
    }
  };

  const handleConfirmCancelPrompt = async () => {
    if (!cancelPrompt) return;
    try {
      if (cancelPrompt.kind === 'bulk') {
        await executeCancelUserBulk(cancelPrompt.userId, selectedWorksiteId ?? undefined);
      } else {
        const decl = findDeclarationById(cancelPrompt.declId);
        if (decl?.statut === 'soumise') {
          await cancelSingleDeclaration(decl);
        }
      }
    } finally {
      setCancelPrompt(null);
    }
  };

  /** Chef cancel: delete periods; trigger may set annulee (migration). Client ensures soumise → annulee if still pending. */
  const removePendingShiftDeclaration = async (decl: DeclarationWithDetails) => {
    const { error: periodesError } = await supabase
      .from('periodes_travail')
      .delete()
      .eq('user_id', decl.user_id)
      .eq('chantier_id', decl.chantier_id)
      .eq('date', decl.date)
      .in('statut', ['en_cours', 'terminee', 'validee', 'rejetee']);

    if (periodesError) throw periodesError;

    await ensureDeclarationAnnuleeAfterPeriodsRemoved(decl);
  };

  const handleCancelUser = (userId: string, chantierId?: string) => {
    const user = weeklyData.find((u) => u.user_id === userId);
    if (!user) return;

    const pendingDeclarations = user.declarations.filter(
      (d) => d.statut === 'soumise' && (!chantierId || d.chantier_id === chantierId)
    );

    if (pendingDeclarations.length === 0) {
      Alert.alert('Info', t.validation.noPending);
      return;
    }

    setCancelPrompt({ kind: 'bulk', userId });
  };

  const handleRejectUser = async (userId: string, chantierId?: string) => {
    const user = weeklyData.find((u) => u.user_id === userId);
    if (!user) return;

    const pendingDeclarations = user.declarations.filter(
      (d) => d.statut === 'soumise' && (!chantierId || d.chantier_id === chantierId)
    );

    if (pendingDeclarations.length === 0) {
      Alert.alert('Info', t.validation.noPending);
      return;
    }

    Alert.alert(
      t.validation.rejectConfirm,
      t.validation.rejectConfirmMessage,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.validation.reject,
          style: 'destructive',
          onPress: async () => {
            try {
              for (const decl of pendingDeclarations) {
                await validateDeclaration(decl, 'rejetee');
              }

              await loadDeclarations({ silent: true });
              Alert.alert(t.common.success, `${pendingDeclarations.length} ${t.validation.declarationsRejected}`);
            } catch (error: any) {
              Alert.alert(t.common.error, error.message || t.validation.errorReject);
            }
          },
        },
      ]
    );
  };

  const handleValidateUser = async (userId: string, chantierId?: string) => {
    try {
      const user = weeklyData.find((u) => u.user_id === userId);
      if (!user) return;

      const pendingDeclarations = user.declarations.filter(
        (d) => d.statut === 'soumise' && (!chantierId || d.chantier_id === chantierId)
      );

      if (pendingDeclarations.length === 0) {
        Alert.alert('Info', t.validation.noPending);
        return;
      }

      for (const decl of pendingDeclarations) {
        await validateDeclaration(decl, 'validee');
      }

      await loadDeclarations({ silent: true });
      Alert.alert(t.common.success, `${pendingDeclarations.length} ${t.validation.declarationsValidated}`);
    } catch (error: any) {
      Alert.alert(t.common.error, error.message);
    }
  };

  const handleValidateAll = () => {
    const usersWithPending = weeklyData.filter((u) => u.hasPending);

    if (usersWithPending.length === 0) {
      setFeedbackModal({ title: 'Info', message: t.validation.noPending, iconVariant: 'danger' });
      return;
    }

    const totalDeclarations = usersWithPending.reduce(
      (sum, u) => sum + u.declarations.filter((d) => d.statut === 'soumise').length,
      0
    );

    // Alert.alert is a no-op on web (react-native-web) — use ConfirmModal instead.
    setValidateAllConfirm({
      workers: usersWithPending.length,
      declarations: totalDeclarations,
    });
  };

  const executeValidateAll = async () => {
    if (!validateAllConfirm) return;

    const { declarations: totalDeclarations } = validateAllConfirm;
    setValidatingAll(true);
    try {
      const usersWithPending = weeklyData.filter((u) => u.hasPending);
      const pendingDeclarations = usersWithPending.flatMap((user) =>
        user.declarations.filter((d) => d.statut === 'soumise')
      );

      for (const decl of pendingDeclarations) {
        await validateDeclaration(decl, 'validee');
      }

      await loadDeclarations({ silent: true });
      setValidateAllConfirm(null);
      setFeedbackModal({
        title: t.common.success,
        message: `${t.validation.teamValidated} (${totalDeclarations} ${t.validation.confirmDeclarations})`,
        iconVariant: 'success',
      });
    } catch (error: any) {
      setFeedbackModal({
        title: t.common.error,
        message: error.message || t.chefDashboard.errorValidate,
        iconVariant: 'danger',
      });
    } finally {
      setValidatingAll(false);
    }
  };

  const getStatusLabel = (statut: string): string => {
    const labels: Record<string, string> = {
      brouillon: t.validation.statusDraft,
      soumise: t.validation.statusPending,
      validee: t.validation.statusApproved,
      rejetee: t.validation.statusRejected,
      annulee: t.validation.statusCancelled,
    };
    return labels[statut] || statut;
  };

  const sortDeclarations = (declarations: DeclarationWithDetails[]) =>
    [...declarations].sort((a, b) => b.date.localeCompare(a.date));

  const sumDeclarationHours = (declarations: DeclarationWithDetails[]) =>
    declarations.reduce((sum, d) => sum + d.heures_normales + d.heures_supplementaires, 0);

  const formatHours = (hours: number) => {
    const rounded = Math.round(hours * 100) / 100;
    return Number.isInteger(rounded)
      ? String(rounded)
      : rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  };

  const renderDeclarationCard = (
    decl: DeclarationWithDetails,
    userId: string,
    period?: DeclarationPeriodSlot,
    cardKey?: string
  ) => {
    const isProcessing =
      Boolean(processingDeclIds[decl.id]) || cancellingUserId === userId;
    const isPending = decl.statut === 'soumise';
    const timeRangeLabel = period
      ? formatSinglePeriodLabel(period)
      : decl.timeRangeLabel;
    const totalHours =
      period?.heure_fin != null && period.heure_fin !== ''
        ? calculateDuration(period.heure_debut, period.heure_fin)
        : sumDeclarationHours([decl]);
    const hasMealAllowance = period?.panier_repas === true;
    const hasTravelAllowance = period?.deplacement === true;
    const showAllowanceIcons =
      Boolean(period) && (hasMealAllowance || hasTravelAllowance);

    return (
      <View key={cardKey ?? decl.id} style={styles.declCard}>
        <View style={styles.declCardLeft}>
          <View style={styles.declDateRow}>
            <Text style={styles.declDate}>{formatDateShort(decl.date)}</Text>
            <Text style={styles.declDateTotalHours}>{formatHours(totalHours)}h</Text>
            {showAllowanceIcons ? (
              <View style={styles.declAllowanceIcons}>
                {hasMealAllowance ? (
                  <View
                    style={[styles.declAllowanceIcon, styles.declAllowanceIconMeal]}
                    accessibilityLabel={t.timesheet.meal}
                    accessible
                  >
                    <UtensilsCrossed size={14} color="#1565C0" strokeWidth={2.2} />
                  </View>
                ) : null}
                {hasTravelAllowance ? (
                  <View
                    style={[styles.declAllowanceIcon, styles.declAllowanceIconTravel]}
                    accessibilityLabel={t.timesheet.displacement}
                    accessible
                  >
                    <MapPin size={14} color="#6A1B9A" strokeWidth={2.2} />
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
          {timeRangeLabel ? (
            <Text style={styles.declTimeRange} numberOfLines={1}>
              {timeRangeLabel}
            </Text>
          ) : null}
        </View>

        <View style={styles.declCardRight}>
          {isPending ? (
            isProcessing ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <View style={styles.declIconActions}>
                <TouchableOpacity
                  style={styles.declIconBtnReject}
                  onPress={() => handleCancelDeclaration(decl.id)}
                  activeOpacity={0.75}
                >
                  <X size={16} color="#DC2626" strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declIconBtnApprovePending}
                  onPress={() => handleValidateDeclaration(decl.id)}
                  activeOpacity={0.75}
                >
                  <Check size={16} color={Colors.primary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )
          ) : (
            <View style={[styles.statusBadgeSmall, getStatusStyle(decl.statut)]}>
              <Text style={styles.statusTextSmall}>{getStatusLabel(decl.statut)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderDeclarationSection = (
    _title: string,
    declarations: DeclarationWithDetails[],
    userId: string,
    scrollable = false
  ) => {
    if (declarations.length === 0) return null;

    const cardItems = sortDeclarations(declarations).flatMap((d) =>
      expandDeclarationToCardItems(d)
    );
    const cards = cardItems.map((item) =>
      renderDeclarationCard(item.decl, userId, item.period, item.key)
    );

    return (
      <View style={styles.declSection}>
        {scrollable && cardItems.length > VISIBLE_DECL_COUNT ? (
          <ScrollView
            style={styles.declScrollList}
            contentContainerStyle={styles.declScrollContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {cards}
          </ScrollView>
        ) : (
          <View style={styles.declList}>{cards}</View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: headerPaddingTop }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const usersWithPending = weeklyData.filter((u) => u.hasPending);
  const pendingDeclarationCount = usersWithPending.reduce(
    (sum, u) => sum + u.declarations.filter((d) => d.statut === 'soumise').length,
    0
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={validationHeaderBackground}
        resizeMode="cover"
        style={styles.header}
        imageStyle={styles.headerImage}
      >
        <View style={[styles.headerOverlay, { paddingTop: headerPaddingTop }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>{t.validation.title}</Text>
              <Text style={styles.headerSubtitle}>{t.validation.subtitle}</Text>
            </View>
          </View>

          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, filter === 'pending' && styles.tabActive]}
              onPress={() => {
                setFilter('pending');
                setSelectedWorksiteId(null);
                setExpandedUserId(null);
              }}
              activeOpacity={0.8}
            >
              <Clock size={16} color={filter === 'pending' ? Colors.primary : 'rgba(255,255,255,0.85)'} />
              <Text style={[styles.tabText, filter === 'pending' && styles.tabTextActive]}>
                {t.validation.pending}
              </Text>
              {pendingDeclarationCount > 0 && (
                <View style={styles.tabCount}>
                  <Text style={styles.tabCountText}>{pendingDeclarationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, filter === 'all' && styles.tabActive]}
              onPress={() => {
                setFilter('all');
                setSelectedWorksiteId(null);
                setExpandedUserId(null);
              }}
              activeOpacity={0.8}
            >
              <List size={16} color={filter === 'all' ? Colors.primary : 'rgba(255,255,255,0.85)'} />
              <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>
                {t.validation.all}
              </Text>
              {validatedWorksiteCount > 0 && (
                <View style={styles.tabCount}>
                  <Text style={styles.tabCountText}>{validatedWorksiteCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.validation.searchPlaceholder}
            placeholderTextColor={Colors.text.disabled}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <X size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollBottomPadding },
          filter === 'pending' && usersWithPending.length > 0 && styles.scrollContentWithFooter,
        ]}
      >
        {filter === 'all' && (
          <View style={styles.allStatusTabs}>
            <TouchableOpacity
              style={[styles.allStatusTab, allStatusFilter === 'validee' && styles.allStatusTabActive]}
              onPress={() => {
                setAllStatusFilter('validee');
                setSelectedWorksiteId(null);
                setExpandedUserId(null);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.allStatusTabText,
                  allStatusFilter === 'validee' && styles.allStatusTabTextActive,
                ]}
              >
                {t.validation.statusApproved}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.allStatusTab, allStatusFilter === 'annulee' && styles.allStatusTabActive]}
              onPress={() => {
                setAllStatusFilter('annulee');
                setSelectedWorksiteId(null);
                setExpandedUserId(null);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.allStatusTabText,
                  allStatusFilter === 'annulee' && styles.allStatusTabTextActive,
                ]}
              >
                {t.validation.statusCancelled}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {searchFilteredWorksites.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {hasActiveSearch
                ? t.validation.noSearchResults
                : filter === 'pending'
                  ? t.validation.noDeclarationsPending
                  : t.validation.noDeclarationsAll}
            </Text>
          </View>
        ) : (
          searchFilteredWorksites.map((worksite) => {
            const isWorksiteExpanded = selectedWorksiteId === worksite.chantier_id;
            const worksiteUsers =
              filter === 'pending'
                ? worksite.users.filter((u) => u.hasPending)
                : worksite.users;

            return (
              <View key={worksite.chantier_id} style={styles.userCard}>
                <TouchableOpacity
                  style={styles.userCardHeader}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedWorksiteId(isWorksiteExpanded ? null : worksite.chantier_id);
                    setExpandedUserId(null);
                  }}
                >
                  <View style={styles.worksiteHeaderLeft}>
                    <View style={styles.worksiteIconWrap}>
                      <Building2 size={18} color={Colors.primary} strokeWidth={2.3} />
                    </View>
                    <View style={styles.userMainInfo}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {worksite.chantierNom}
                      </Text>
                      <View style={styles.worksiteMetaRow}>
                        <MapPin size={13} color="#9CA3AF" strokeWidth={2.2} />
                        <Text style={styles.worksiteMetaText} numberOfLines={1}>
                          {worksite.chantierCode}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.userHeaderRight}>
                    {filter === 'pending' && worksite.pendingDeclarationCount > 0 && (
                      <View style={styles.tabCount}>
                        <Text style={styles.tabCountText}>{worksite.pendingDeclarationCount}</Text>
                      </View>
                    )}
                    <View style={[styles.chevronWrap, isWorksiteExpanded && styles.chevronWrapExpanded]}>
                      <ChevronDown size={16} color="#FFF" strokeWidth={2.4} />
                    </View>
                  </View>
                </TouchableOpacity>

                {isWorksiteExpanded && (
                  <View style={styles.userDetailsExpanded}>
                    {worksiteUsers.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                          {filter === 'pending' ? t.validation.noDeclarationsPending : t.validation.noDeclarationsAll}
                        </Text>
                      </View>
                    ) : (
                      worksiteUsers.map((user) => {
                        const displayedDeclarations =
                          filter === 'pending'
                            ? user.declarations.filter((d) => d.statut === 'soumise')
                            : user.declarations;
                        const pendingCount = displayedDeclarations.filter(
                          (d) => d.statut === 'soumise'
                        ).length;
                        const displayedTotalHours = sumDeclarationHours(displayedDeclarations);
                        const isExpanded = expandedUserId === user.user_id;

                        return (
                          <View key={user.user_id} style={styles.userCardNested}>
                            <View style={styles.userCardHeader}>
                              <View style={styles.nestedUserHeaderLeft}>
                                <View style={styles.userRowIconWrap}>
                                  <User size={17} color={Colors.primary} strokeWidth={2.3} />
                                </View>
                                <View style={styles.userMainInfo}>
                                  <View style={styles.userNameRow}>
                                    <Text style={styles.userName} numberOfLines={1}>
                                      {user.prenom} {user.nom}
                                    </Text>
                                    <Text style={styles.userNameHours}>
                                      {formatHours(displayedTotalHours)}h
                                    </Text>
                                    {pendingCount > 0 && (
                                      <View style={styles.pendingDot}>
                                        <Clock size={11} color="#F59E0B" />
                                      </View>
                                    )}
                                  </View>
                                </View>
                              </View>
                              <View style={styles.userHeaderRight}>
                                {pendingCount > 0 && (
                                  <View style={styles.tabCount}>
                                    <Text style={styles.tabCountText}>{pendingCount}</Text>
                                  </View>
                                )}
                                <TouchableOpacity
                                  style={[styles.chevronWrap, isExpanded && styles.chevronWrapExpanded]}
                                  onPress={() => setExpandedUserId(isExpanded ? null : user.user_id)}
                                  activeOpacity={0.75}
                                >
                                  <ChevronDown size={16} color="#FFF" strokeWidth={2.4} />
                                </TouchableOpacity>
                              </View>
                            </View>
                            {isExpanded && (
                              <View style={styles.userDetailsExpanded}>
                                {filter === 'pending' &&
                                  renderDeclarationSection(
                                    t.validation.pendingSection,
                                    displayedDeclarations,
                                    user.user_id,
                                  )}
                                {filter === 'all' &&
                                  renderDeclarationSection(
                                    allStatusFilter === 'validee'
                                      ? t.validation.approvedSection
                                      : t.validation.cancelledSection,
                                    user.declarations,
                                    user.user_id,
                                    true,
                                  )}
                              </View>
                            )}
                            {filter === 'pending' && user.hasPending && (
                              <View style={styles.userActions}>
                                <TouchableOpacity
                                  style={[styles.userActionButton, styles.cancelUserButton]}
                                  onPress={() => handleCancelUser(user.user_id, selectedWorksiteId ?? undefined)}
                                  disabled={cancellingUserId === user.user_id}
                                >
                                  {cancellingUserId === user.user_id ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                  ) : (
                                    <X size={15} color="#FFF" strokeWidth={2.5} />
                                  )}
                                  <Text style={styles.userActionButtonText}>{t.validation.cancelAllShifts}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[styles.userActionButton, styles.validateUserButton]}
                                  onPress={() => handleValidateUser(user.user_id, selectedWorksiteId ?? undefined)}
                                  disabled={cancellingUserId === user.user_id}
                                >
                                  <Check size={15} color="#FFF" strokeWidth={2.5} />
                                  <Text style={styles.userActionButtonText}>{t.common.validate}</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {filter === 'pending' && usersWithPending.length > 0 && (
        <View style={styles.validateAllFooter}>
          <TouchableOpacity
            style={styles.validateAllButton}
            onPress={handleValidateAll}
            disabled={validatingAll}
          >
            {validatingAll ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Check size={18} color="#FFF" />
                <Text style={styles.validateAllButtonText}>
                  {t.validation.validateTeam} ({pendingDeclarationCount})
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={cancelPrompt !== null}
        title={
          cancelPrompt?.kind === 'single'
            ? t.validation.cancelConfirm
            : t.validation.cancelAllConfirm
        }
        message={
          cancelPrompt?.kind === 'single'
            ? t.validation.cancelConfirmMessage
            : t.validation.cancelAllConfirmMessage
        }
        cancelLabel={t.validation.cancelModalDismiss}
        confirmLabel={
          cancelPrompt?.kind === 'single'
            ? t.validation.cancelModalConfirmSingle
            : t.validation.cancelAllShifts
        }
        onCancel={() => setCancelPrompt(null)}
        onConfirm={() => void handleConfirmCancelPrompt()}
        loading={
          cancelPrompt?.kind === 'bulk'
            ? cancellingUserId === cancelPrompt.userId
            : cancelPrompt?.kind === 'single'
              ? Boolean(processingDeclIds[cancelPrompt.declId])
              : false
        }
        confirmVariant="danger"
      />

      <ConfirmModal
        visible={validateAllConfirm !== null}
        title={t.validation.confirmValidateAll}
        message={`${t.validation.confirmMessage} ${validateAllConfirm?.workers ?? 0} ${t.validation.confirmWorkers} (${validateAllConfirm?.declarations ?? 0} ${t.validation.confirmDeclarations}) ?`}
        cancelLabel={t.common.cancel}
        confirmLabel={t.common.validate}
        onCancel={() => {
          if (!validatingAll) setValidateAllConfirm(null);
        }}
        onConfirm={() => void executeValidateAll()}
        loading={validatingAll}
        iconVariant="warning"
        confirmVariant="primary"
      />

      <ConfirmModal
        visible={feedbackModal !== null}
        title={feedbackContent?.title ?? ''}
        message={feedbackContent?.message ?? ''}
        cancelLabel=""
        confirmLabel={t.common.ok}
        onCancel={() => setFeedbackModal(null)}
        onConfirm={() => setFeedbackModal(null)}
        iconVariant={feedbackContent?.iconVariant ?? 'danger'}
        singleButton
      />
    </View>
  );
}

function declarationPeriodLookupKey(userId: string, chantierId: string, date: string): string {
  return `${userId}__${chantierId}__${date}`;
}

function formatTimeHm(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  const s = String(value).trim();
  const parts = s.split(':');
  if (parts.length >= 2) {
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isNaN(h) && !Number.isNaN(m)) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  return s;
}

function formatSinglePeriodLabel(period: DeclarationPeriodSlot): string {
  return `${formatTimeHm(period.heure_debut)} – ${formatTimeHm(period.heure_fin)}`;
}

/** One or several slots the same day / chantier, e.g. "07:30 – 16:30" or "07:30 – 12:00 · 13:00 – 17:00". */
function formatPeriodSlotsLabel(slots: DeclarationPeriodSlot[]): string {
  if (!slots.length) return '';
  const sorted = [...slots].sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
  return sorted.map((slot) => formatSinglePeriodLabel(slot)).join(' · ');
}

function dedupePeriodsById(periods: DeclarationPeriodSlot[]): DeclarationPeriodSlot[] {
  const seen = new Set<string>();
  return periods.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

function readPeriodBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value == null) return false;
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase();
    return s === 'true' || s === 't' || s === '1';
  }
  return false;
}

function expandDeclarationToCardItems(decl: DeclarationWithDetails): {
  key: string;
  decl: DeclarationWithDetails;
  period?: DeclarationPeriodSlot;
}[] {
  const periods = decl.periods ?? [];
  if (periods.length === 0) {
    return [{ key: decl.id, decl }];
  }
  return periods.map((period, index) => ({
    key: `${decl.id}__${period.id || index}`,
    decl,
    period,
  }));
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getStatusStyle(statut: string) {
  const styles: Record<string, any> = {
    brouillon: { backgroundColor: '#E5E5E5' },
    soumise: { backgroundColor: '#FFA726' },
    validee: { backgroundColor: '#66BB6A' },
    rejetee: { backgroundColor: '#EF5350' },
    annulee: { backgroundColor: '#94A3B8' },
  };
  return styles[statut] || {};
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7F2',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF7F2',
  },
  header: {
    overflow: 'hidden',
  },
  headerImage: {
    opacity: 0.95,
  },
  headerOverlay: {
    paddingBottom: 0,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.58)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 20,
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 3,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabActive: {
    backgroundColor: '#FFF7F2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  tabTextActive: {
    color: Colors.text.primary,
  },
  tabCount: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  validateAllFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#FFF7F2',
    borderTopWidth: 1,
    borderTopColor: '#F0E4DC',
  },
  validateAllButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 8,
  },
  validateAllButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  allStatusTabs: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  allStatusTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0E4DC',
    backgroundColor: '#FFF',
  },
  allStatusTabActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF3E8',
  },
  allStatusTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A8A8A',
  },
  allStatusTabTextActive: {
    color: Colors.primary,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF7F2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 53, 0.14)',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },
  scrollContentWithFooter: {
    paddingBottom: 4,
  },
  levelBackBtn: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  levelBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  userCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  userCardNested: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginBottom: 8,
  },
  userCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  worksiteHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  worksiteIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nestedUserHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  userRowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userMainInfo: {
    flex: 1,
    gap: 2,
  },
  worksiteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
    flexWrap: 'nowrap',
  },
  worksiteMetaText: {
    flexShrink: 1,
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  userNameHours: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    flexShrink: 0,
  },
  pendingDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userTotalHours: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF6B35',
  },
  chevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWrapExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  userDetailsExpanded: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  declSection: {
    gap: 6,
  },
  declSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  declList: {
    gap: 8,
  },
  declScrollList: {
    maxHeight: DECL_ROW_HEIGHT * VISIBLE_DECL_COUNT,
  },
  declScrollContent: {
    gap: 8,
    paddingBottom: 2,
  },
  declCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD8C7',
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 0,
  },
  declCardLeft: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  declDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  declDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  declDateTotalHours: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  declTimeRange: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: -0.2,
  },
  declAllowanceIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
    flexShrink: 0,
  },
  declAllowanceIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declAllowanceIconMeal: {
    backgroundColor: '#E3F2FD',
  },
  declAllowanceIconTravel: {
    backgroundColor: '#F3E5F5',
  },
  declCardRight: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 112,
    alignSelf: 'stretch',
  },
  declIconActions: {
    flexDirection: 'row',
    gap: 8,
  },
  declIconBtnReject: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declIconBtnApprovePending: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF3E8',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusTextSmall: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  userActions: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 2,
    gap: 8,
  },
  userActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 5,
  },
  validateUserButton: {
    backgroundColor: '#10B981',
  },
  rejectUserButton: {
    backgroundColor: '#EF4444',
  },
  cancelUserButton: {
    backgroundColor: '#DC2626',
  },
  userActionButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
