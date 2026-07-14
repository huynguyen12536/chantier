import type { Router } from 'expo-router';
import { formatDateKey, formatWeekDayLabel, getWeekDateStringsFromDate, parseDateKey } from '@/utils/date';
import { declarationLookupKey, resolveLineStatut } from '@/utils/status';
import { calculateDuration, formatTime, timeRangesOverlap, toDbTimeString } from '@/utils/time';
import { supabase } from '@/services/supabase';

export interface DeclarationSuggestion {
  chantier_id: string;
  chantierNom: string;
  chantierCode: string;
  heure_debut: string;
  heure_fin: string;
  panier_repas: boolean;
  deplacement: boolean;
  pauseMinutes: number;
  sourceDate: string;
}

function resolveChantierJoin(chantiers: unknown): { nom: string; code: string } {
  if (!chantiers) return { nom: '', code: '' };
  if (Array.isArray(chantiers)) {
    const row = chantiers[0] as { nom?: string; code?: string } | undefined;
    return { nom: row?.nom ?? '', code: row?.code ?? '' };
  }
  const row = chantiers as { nom?: string; code?: string };
  return { nom: row.nom ?? '', code: row.code ?? '' };
}

function computePauseMinutes(heureDebut: string, heureFin: string): number {
  const totalHours = calculateDuration(heureDebut, heureFin);
  if (totalHours <= 7) return 0;
  return 45;
}

/** Most recent approved shift (habit template), excluding the target declaration date. */
export async function fetchLatestValidatedPeriod(
  userId: string,
  excludeDate?: string,
): Promise<DeclarationSuggestion | null> {
  const { data: periods, error } = await supabase
    .from('periodes_travail')
    .select(
      'id, date, chantier_id, heure_debut, heure_fin, panier_repas, deplacement, statut, chantiers(nom, code)',
    )
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('heure_debut', { ascending: false })
    .limit(60);

  if (error || !periods?.length) return null;

  const dates = [...new Set(periods.map((p) => p.date as string))];
  const { data: declRows } = await supabase
    .from('declarations_heures')
    .select('chantier_id, date, statut')
    .eq('user_id', userId)
    .in('date', dates);

  const declByKey = new Map<string, string>();
  for (const row of declRows || []) {
    declByKey.set(declarationLookupKey(row.chantier_id as string, row.date as string), row.statut as string);
  }

  for (const period of periods) {
    const date = period.date as string;
    if (excludeDate && date === excludeDate) continue;

    const statut = resolveLineStatut(
      period.statut as string,
      period.chantier_id as string,
      date,
      declByKey,
    );
    if (statut !== 'validee') continue;

    const chantier = resolveChantierJoin(period.chantiers);
    const heureDebut = formatTime(period.heure_debut as string);
    const heureFin = formatTime(period.heure_fin as string);

    return {
      chantier_id: period.chantier_id as string,
      chantierNom: chantier.nom,
      chantierCode: chantier.code,
      heure_debut: heureDebut,
      heure_fin: heureFin,
      panier_repas: Boolean(period.panier_repas),
      deplacement: Boolean(period.deplacement),
      pauseMinutes: computePauseMinutes(heureDebut, heureFin),
      sourceDate: date,
    };
  }

  return null;
}

type PeriodRow = {
  date: string;
  chantier_id: string;
  heure_debut: string | null;
  heure_fin: string | null;
  panier_repas: boolean | null;
  deplacement: boolean | null;
  statut: string;
  chantiers: { nom?: string; code?: string } | null;
};

function periodToSuggestion(period: PeriodRow, sourceDate: string): DeclarationSuggestion | null {
  if (!period.heure_debut || !period.heure_fin) return null;

  const heureDebut = formatTime(period.heure_debut);
  const heureFin = formatTime(period.heure_fin);

  const chantier = resolveChantierJoin(period.chantiers);

  return {
    chantier_id: period.chantier_id,
    chantierNom: chantier.nom,
    chantierCode: chantier.code,
    heure_debut: heureDebut,
    heure_fin: heureFin,
    panier_repas: Boolean(period.panier_repas),
    deplacement: Boolean(period.deplacement),
    pauseMinutes: computePauseMinutes(heureDebut, heureFin),
    sourceDate,
  };
}

/** Habit template: validated shift first, then any recent declared shift, then default worksite. */
export async function fetchDeclarationHabit(
  userId: string,
  excludeDate?: string,
): Promise<DeclarationSuggestion | null> {
  const validated = await fetchLatestValidatedPeriod(userId, excludeDate);
  if (validated) return validated;

  const { data: periods, error } = await supabase
    .from('periodes_travail')
    .select(
      'id, date, chantier_id, heure_debut, heure_fin, panier_repas, deplacement, statut, chantiers(nom, code)',
    )
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('heure_debut', { ascending: false })
    .limit(60);

  if (!error && periods?.length) {
    const dates = [...new Set(periods.map((p) => p.date as string))];
    const { data: declRows } = await supabase
      .from('declarations_heures')
      .select('chantier_id, date, statut')
      .eq('user_id', userId)
      .in('date', dates);

    const declByKey = new Map<string, string>();
    for (const row of declRows || []) {
      declByKey.set(
        declarationLookupKey(row.chantier_id as string, row.date as string),
        row.statut as string,
      );
    }

    for (const raw of periods) {
      const period = raw as PeriodRow;
      const date = period.date;
      if (excludeDate && date === excludeDate) continue;

      const statut = resolveLineStatut(period.statut, period.chantier_id, date, declByKey);
      if (statut === 'annulee' || statut === 'rejetee') continue;

      const suggestion = periodToSuggestion(period, date);
      if (suggestion) return suggestion;
    }
  }

  const { data: chantiers } = await supabase
    .from('chantiers')
    .select('id, nom, code, heure_debut, heure_fin')
    .eq('actif', true)
    .order('nom', { ascending: true })
    .limit(1);

  const chantier = chantiers?.[0];
  if (!chantier) return null;

  const heureDebut = chantier.heure_debut ? formatTime(chantier.heure_debut as string) : '07:30';
  const heureFin = chantier.heure_fin ? formatTime(chantier.heure_fin as string) : '16:45';

  return {
    chantier_id: chantier.id as string,
    chantierNom: (chantier.nom as string) ?? '',
    chantierCode: (chantier.code as string) ?? '',
    heure_debut: heureDebut,
    heure_fin: heureFin,
    panier_repas: true,
    deplacement: true,
    pauseMinutes: computePauseMinutes(heureDebut, heureFin),
    sourceDate: '',
  };
}

export type WeekDayReplicationPlan = {
  targetDate: string;
  sourceDate: string;
  chantier_id: string;
  chantierNom: string;
  heure_debut: string;
  heure_fin: string;
  heure_debutDisplay: string;
  heure_finDisplay: string;
  panier_repas: boolean;
  deplacement: boolean;
};

export interface PreviousWeekHint {
  hasPreviousWeekData: boolean;
  workDayCount: number;
  prevWeekLabel: string;
  suggestion: DeclarationSuggestion | null;
  dayPlans: WeekDayReplicationPlan[];
}

export type ReplicatePreviousWeekResult = {
  ok: boolean;
  overlap: boolean;
  insertedCount: number;
  /** Declarations auto-approved after week-suggestion Valider (source week match). */
  approvedCount: number;
};

// Ancien flux auto-approbation (terminee → soumise → RPC validee) — désactivé :
// les ca répliquées sont insérées directement en statut validee.
//
// function weekSuggestionReplicationPlansPayload(plans: WeekDayReplicationPlan[]) {
//   return plans.map((plan) => ({
//     target_date: plan.targetDate,
//     source_date: plan.sourceDate,
//     chantier_id: plan.chantier_id,
//     heure_debut: plan.heure_debut,
//     heure_fin: plan.heure_fin,
//     panier_repas: plan.panier_repas,
//     deplacement: plan.deplacement,
//   }));
// }
//
// async function autoApproveWeekSuggestionReplication(
//   plans: WeekDayReplicationPlan[],
// ): Promise<number> {
//   if (plans.length === 0) return 0;
//
//   const { data, error } = await supabase.rpc('auto_approve_week_suggestion_replication', {
//     p_plans: weekSuggestionReplicationPlansPayload(plans),
//   });
//
//   if (error) throw error;
//   return typeof data === 'number' ? data : 0;
// }

function formatWeekRangeLabel(startKey: string, endKey: string): string {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('fr-FR', opts)} - ${end.toLocaleDateString('fr-FR', opts)}`;
}

const previousWeekHintCache = new Map<string, PreviousWeekHint>();

/** How many past weeks to scan for the nearest week with validated shifts. */
const MAX_WEEKS_LOOKBACK = 12;

export function clearPreviousWeekHintCache(userId?: string) {
  if (!userId) {
    previousWeekHintCache.clear();
    return;
  }
  for (const key of previousWeekHintCache.keys()) {
    if (key.startsWith(`${userId}:`)) {
      previousWeekHintCache.delete(key);
    }
  }
}

function planToSuggestion(plan: WeekDayReplicationPlan): DeclarationSuggestion {
  return {
    chantier_id: plan.chantier_id,
    chantierNom: plan.chantierNom,
    chantierCode: '',
    heure_debut: plan.heure_debutDisplay,
    heure_fin: plan.heure_finDisplay,
    panier_repas: plan.panier_repas,
    deplacement: plan.deplacement,
    pauseMinutes: computePauseMinutes(plan.heure_debutDisplay, plan.heure_finDisplay),
    sourceDate: plan.sourceDate,
  };
}

function replicationPayload(userId: string, plan: WeekDayReplicationPlan) {
  return {
    user_id: userId,
    chantier_id: plan.chantier_id,
    date: plan.targetDate,
    heure_debut: plan.heure_debut,
    heure_fin: plan.heure_fin,
    panier_repas: plan.panier_repas,
    deplacement: plan.deplacement,
    statut: 'validee',
    latitude_debut: 0,
    longitude_debut: 0,
    latitude_fin: 0,
    longitude_fin: 0,
  };
}

function buildReplicationPlansForSourceWeek(
  sourceDates: string[],
  currentDates: string[],
  periods: PeriodRow[],
  declByKey: Map<string, string>,
): WeekDayReplicationPlan[] {
  const weekdaySourceDates = new Set(sourceDates.slice(0, 5));
  const validatedBySourceDate = new Map<string, PeriodRow[]>();

  for (const period of periods) {
    if (!weekdaySourceDates.has(period.date)) continue;

    const statut = resolveLineStatut(
      period.statut,
      period.chantier_id,
      period.date,
      declByKey,
    );
    if (statut !== 'validee' || !period.heure_debut || !period.heure_fin) continue;

    const existing = validatedBySourceDate.get(period.date) ?? [];
    existing.push(period);
    validatedBySourceDate.set(period.date, existing);
  }

  const dayPlans: WeekDayReplicationPlan[] = [];

  for (let i = 0; i < 5; i += 1) {
    const sourceDate = sourceDates[i];
    const targetDate = currentDates[i];
    const sourcePeriods = validatedBySourceDate.get(sourceDate) ?? [];

    for (const period of sourcePeriods) {
      const chantier = resolveChantierJoin(period.chantiers);
      const heureDebutDisplay = formatTime(period.heure_debut!);
      const heureFinDisplay = formatTime(period.heure_fin!);

      dayPlans.push({
        targetDate,
        sourceDate,
        chantier_id: period.chantier_id,
        chantierNom: chantier.nom,
        heure_debut: toDbTimeString(heureDebutDisplay),
        heure_fin: toDbTimeString(heureFinDisplay),
        heure_debutDisplay: heureDebutDisplay,
        heure_finDisplay: heureFinDisplay,
        panier_repas: Boolean(period.panier_repas),
        deplacement: Boolean(period.deplacement),
      });
    }
  }

  return dayPlans;
}

/** Ca validées de la semaine passée la plus récente → jours correspondants (lun–ven) de la semaine courante. */
async function loadPreviousWeekValidatedPlans(
  userId: string,
  currentWeekMondayKey: string,
): Promise<{ prevWeekLabel: string; dayPlans: WeekDayReplicationPlan[] }> {
  const currentMonday = parseDateKey(currentWeekMondayKey);
  const currentDates = getWeekDateStringsFromDate(currentWeekMondayKey);

  const immediatePrevMonday = new Date(currentMonday);
  immediatePrevMonday.setDate(immediatePrevMonday.getDate() - 7);
  const immediatePrevDates = getWeekDateStringsFromDate(formatDateKey(immediatePrevMonday));
  const fallbackWeekLabel = formatWeekRangeLabel(immediatePrevDates[0], immediatePrevDates[6]);

  const rangeEnd = new Date(currentMonday);
  rangeEnd.setDate(rangeEnd.getDate() - 1);
  const rangeStart = new Date(currentMonday);
  rangeStart.setDate(rangeStart.getDate() - 7 * MAX_WEEKS_LOOKBACK);

  const [periodsRes, declRes] = await Promise.all([
    supabase
      .from('periodes_travail')
      .select(
        'id, date, chantier_id, heure_debut, heure_fin, panier_repas, deplacement, statut, chantiers(nom, code)',
      )
      .eq('user_id', userId)
      .gte('date', formatDateKey(rangeStart))
      .lte('date', formatDateKey(rangeEnd))
      .order('date', { ascending: true })
      .order('heure_debut', { ascending: true }),
    supabase
      .from('declarations_heures')
      .select('chantier_id, date, statut')
      .eq('user_id', userId)
      .gte('date', formatDateKey(rangeStart))
      .lte('date', formatDateKey(rangeEnd)),
  ]);

  if (periodsRes.error || declRes.error || !periodsRes.data?.length) {
    return { prevWeekLabel: fallbackWeekLabel, dayPlans: [] };
  }

  const declByKey = new Map<string, string>();
  for (const row of declRes.data || []) {
    declByKey.set(
      declarationLookupKey(row.chantier_id as string, row.date as string),
      row.statut as string,
    );
  }

  const allPeriods = periodsRes.data as PeriodRow[];

  for (let weekOffset = 1; weekOffset <= MAX_WEEKS_LOOKBACK; weekOffset += 1) {
    const sourceMonday = new Date(currentMonday);
    sourceMonday.setDate(sourceMonday.getDate() - 7 * weekOffset);
    const sourceDates = getWeekDateStringsFromDate(formatDateKey(sourceMonday));
    const prevWeekLabel = formatWeekRangeLabel(sourceDates[0], sourceDates[6]);
    const dayPlans = buildReplicationPlansForSourceWeek(
      sourceDates,
      currentDates,
      allPeriods,
      declByKey,
    );

    if (dayPlans.length > 0) {
      return { prevWeekLabel, dayPlans };
    }
  }

  return { prevWeekLabel: fallbackWeekLabel, dayPlans: [] };
}

/** Dernière semaine avec ca validées → jours correspondants (lun–ven) de la semaine courante. */
export async function fetchPreviousWeekHint(
  userId: string,
  currentWeekMondayKey: string,
): Promise<PreviousWeekHint> {
  const cacheKey = `${userId}:${currentWeekMondayKey}`;
  const cached = previousWeekHintCache.get(cacheKey);
  if (cached) return cached;

  const { prevWeekLabel, dayPlans } = await loadPreviousWeekValidatedPlans(userId, currentWeekMondayKey);

  const empty: PreviousWeekHint = {
    hasPreviousWeekData: false,
    workDayCount: 0,
    prevWeekLabel,
    suggestion: null,
    dayPlans: [],
  };

  if (dayPlans.length === 0) {
    previousWeekHintCache.set(cacheKey, empty);
    return empty;
  }

  const result: PreviousWeekHint = {
    hasPreviousWeekData: true,
    workDayCount: new Set(dayPlans.map((plan) => plan.targetDate)).size,
    prevWeekLabel,
    suggestion: planToSuggestion(dayPlans[0]),
    dayPlans,
  };
  previousWeekHintCache.set(cacheKey, result);
  return result;
}

export async function computeReplicationOverlapMap(
  userId: string,
  weekDateKeys: string[],
  plans: WeekDayReplicationPlan[],
): Promise<Record<string, boolean>> {
  if (!plans.length || !weekDateKeys.length) return {};

  const [periodsRes, declRes] = await Promise.all([
    supabase
      .from('periodes_travail')
      .select('chantier_id, date, heure_debut, heure_fin, statut')
      .eq('user_id', userId)
      .gte('date', weekDateKeys[0])
      .lte('date', weekDateKeys[weekDateKeys.length - 1]),
    supabase
      .from('declarations_heures')
      .select('chantier_id, date, statut')
      .eq('user_id', userId)
      .gte('date', weekDateKeys[0])
      .lte('date', weekDateKeys[weekDateKeys.length - 1]),
  ]);

  if (periodsRes.error) throw periodsRes.error;
  if (declRes.error) throw declRes.error;

  const declByKey = new Map<string, string>();
  for (const row of declRes.data || []) {
    declByKey.set(
      declarationLookupKey(row.chantier_id as string, row.date as string),
      row.statut as string,
    );
  }

  const overlapByDate: Record<string, boolean> = {};

  for (const plan of plans) {
    const dayPeriods = (periodsRes.data || []).filter(
      (p: { date: string }) => p.date === plan.targetDate,
    ) as ActivePeriod[];
    const activePeriods = filterActivePeriodsForOverlap(dayPeriods, plan.targetDate, declByKey);
    overlapByDate[plan.targetDate] = hasOverlapWithPeriods(
      plan.heure_debut,
      plan.heure_fin,
      activePeriods,
    );
  }

  return overlapByDate;
}

type ActivePeriod = {
  chantier_id: string;
  heure_debut: string | null;
  heure_fin: string | null;
  statut: string;
};

function filterActivePeriodsForOverlap(
  periods: ActivePeriod[],
  dateStr: string,
  declByKey: Map<string, string>,
): ActivePeriod[] {
  return periods.filter((period) => {
    const declStatut = declByKey.get(declarationLookupKey(period.chantier_id, dateStr));
    if (declStatut === 'annulee') return false;
    if (period.statut === 'annulee') return false;
    return true;
  });
}

function hasOverlapWithPeriods(
  dbDebut: string,
  dbFin: string,
  periods: ActivePeriod[],
): boolean {
  return periods.some((existing) => {
    if (!existing.heure_debut || !existing.heure_fin) return false;
    return timeRangesOverlap(dbDebut, dbFin, existing.heure_debut, existing.heure_fin);
  });
}

/** Insère les ca validées de la semaine précédente sur les jours équivalents. */
export async function replicatePreviousValidatedWeek(
  userId: string,
  currentWeekMondayKey: string,
): Promise<ReplicatePreviousWeekResult> {
  const hint = await fetchPreviousWeekHint(userId, currentWeekMondayKey);
  const plans = hint.dayPlans;
  if (plans.length === 0) {
    return { ok: false, overlap: false, insertedCount: 0, approvedCount: 0 };
  }

  const weekDates = getWeekDateStringsFromDate(currentWeekMondayKey);
  const overlapByDate = await computeReplicationOverlapMap(userId, weekDates, plans);

  const insertable = plans.filter((plan) => !overlapByDate[plan.targetDate]);
  if (insertable.length === 0) {
    return { ok: false, overlap: true, insertedCount: 0, approvedCount: 0 };
  }

  const payloads = insertable.map((plan) => replicationPayload(userId, plan));
  const { error } = await supabase.from('periodes_travail').insert(payloads);
  if (error) throw error;

  // const approvedCount = await autoApproveWeekSuggestionReplication(insertable);
  const approvedCount = insertable.length;

  clearPreviousWeekHintCache(userId);

  return { ok: true, overlap: false, insertedCount: insertable.length, approvedCount };
}

export function suggestionRouteParams(
  date: string,
  dayLabel: string,
  suggestion: DeclarationSuggestion,
) {
  return {
    date,
    dayLabel,
    chantierId: suggestion.chantier_id,
    chantierNom: suggestion.chantierNom,
    chantierCode: suggestion.chantierCode,
    heureDebut: suggestion.heure_debut,
    heureFin: suggestion.heure_fin,
    panierRepas: suggestion.panier_repas ? '1' : '0',
    deplacement: suggestion.deplacement ? '1' : '0',
    pauseMinutes: String(suggestion.pauseMinutes),
  };
}

/**
 * Jours de la semaine : suggestion uniquement si l'ouvrier a déjà une période validée.
 * Sinon → formulaire Déclarer ma journée directement.
 */
/** Dashboard → formulaire Déclarer ma journée avec toute la semaine ouvrable présélectionnée. */
export async function navigateToPrefillCurrentWeek(
  router: Router,
  userId: string,
  weekAnchorDate: string,
  habitOverride?: DeclarationSuggestion | null,
) {
  const weekDates = getWeekDateStringsFromDate(weekAnchorDate);
  const today = formatDateKey(new Date());
  const todayInWeek = weekDates.includes(today);
  const targetDate = todayInWeek ? today : weekDates[0];
  const dayLabel = todayInWeek
    ? formatWeekDayLabel(targetDate)
    : formatWeekRangeLabel(weekDates[0], weekDates[6]);
  const habit = habitOverride ?? await fetchLatestValidatedPeriod(userId, targetDate);

  const params = habit
    ? { ...suggestionRouteParams(targetDate, dayLabel, habit), prefillWeek: '1' }
    : { date: targetDate, dayLabel, prefillWeek: '1' };

  router.push({ pathname: '/declare-day', params });
}

export async function navigateToDaySuggestion(
  router: Router,
  userId: string,
  date: string,
  dayLabel: string,
) {
  const validated = await fetchLatestValidatedPeriod(userId, date);

  if (validated) {
    router.push({
      pathname: '/declare-day-suggestion',
      params: suggestionRouteParams(date, dayLabel, validated),
    });
    return;
  }

  router.push({
    pathname: '/declare-day',
    params: { date, dayLabel },
  });
}

/** Jour avec au moins une période (validée, en attente ou rejetée) → écran consultation. */
export function dayHasViewableDeclaration(lines: { statut: string }[]): boolean {
  return lines.length > 0;
}

/** Choisir un jour → écran détail du jour (liste des ca ou état vide). */
export function navigateFromChooseDay(
  router: Router,
  _userId: string,
  date: string,
  dayLabel: string,
) {
  router.push({
    pathname: '/declare-day-empty',
    params: { date, dayLabel },
  });
}

/**
 * Jours de la semaine : avec période (validée ou rejetée) → consultation (declare-day-empty) ;
 * sans période → suggestion ou formulaire Déclarer ma journée.
 */
export async function navigateOuvrierWeekDay(
  router: Router,
  userId: string,
  date: string,
  dayLabel: string,
  lines: { statut: string }[],
) {
  if (dayHasViewableDeclaration(lines)) {
    navigateFromChooseDay(router, userId, date, dayLabel);
    return;
  }

  await navigateToDaySuggestion(router, userId, date, dayLabel);
}

/** @deprecated Utiliser navigateToDaySuggestion */
export function navigateToDeclareDay(
  router: Router,
  userId: string,
  date: string,
  dayLabel: string,
) {
  void navigateToDaySuggestion(router, userId, date, dayLabel);
}
