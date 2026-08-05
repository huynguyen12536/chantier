import { supabase } from '@/services/supabase';
import type { Absence, AbsenceMotif, Profile } from '@/types';
import { formatDateKey, parseDateKey } from '@/utils/date';
import { getChefTeamUserIds } from '@/utils/team';

export type AbsenceInput = {
  date_debut: string;
  date_fin: string;
  motif?: AbsenceMotif | null;
  commentaire?: string | null;
};

export function expandDateRange(start: string, end: string): string[] {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);
  if (endDate < startDate) return [];

  const dates: string[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function countAbsenceDays(start: string, end: string): number {
  return expandDateRange(start, end).length;
}

export function isDateInAbsence(dateKey: string, absence: Pick<Absence, 'date_debut' | 'date_fin'>): boolean {
  return dateKey >= absence.date_debut && dateKey <= absence.date_fin;
}

export function isAbsenceUpcoming(absence: Pick<Absence, 'date_fin'>, todayKey = formatDateKey(new Date())): boolean {
  return absence.date_fin >= todayKey;
}

export function isAbsenceToday(absence: Pick<Absence, 'date_debut' | 'date_fin'>, todayKey = formatDateKey(new Date())): boolean {
  return todayKey >= absence.date_debut && todayKey <= absence.date_fin;
}

export function buildAbsenceDateMap(absences: Absence[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of absences) {
    for (const dateKey of expandDateRange(row.date_debut, row.date_fin)) {
      map[dateKey] = row.id;
    }
  }
  return map;
}

function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export async function fetchUserAbsences(userId: string): Promise<Absence[]> {
  const { data, error } = await supabase
    .from('absences')
    .select('*')
    .eq('user_id', userId)
    .order('date_debut', { ascending: false });
  if (error) throw error;
  return (data || []) as Absence[];
}

export async function fetchAbsenceById(absenceId: string): Promise<Absence | null> {
  const { data, error } = await supabase
    .from('absences')
    .select('*')
    .eq('id', absenceId)
    .maybeSingle();
  if (error) throw error;
  return (data as Absence | null) ?? null;
}

export async function fetchUserAbsencesForMonth(
  userId: string,
  year: number,
  month: number,
): Promise<Absence[]> {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const { data, error } = await supabase
    .from('absences')
    .select('*')
    .eq('user_id', userId)
    .lte('date_debut', endDate)
    .gte('date_fin', startDate)
    .order('date_debut', { ascending: true });
  if (error) throw error;
  return (data || []) as Absence[];
}

export async function findAbsenceForDate(userId: string, dateKey: string): Promise<Absence | null> {
  const { data, error } = await supabase
    .from('absences')
    .select('*')
    .eq('user_id', userId)
    .lte('date_debut', dateKey)
    .gte('date_fin', dateKey)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as Absence | null) ?? null;
}

export async function findFirstAbsenceOnDates(
  userId: string,
  dateKeys: string[],
): Promise<Absence | null> {
  for (const dateKey of dateKeys) {
    const row = await findAbsenceForDate(userId, dateKey);
    if (row) return row;
  }
  return null;
}

async function assertNoWorkDaysInRange(
  userId: string,
  start: string,
  end: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('periodes_travail')
    .select('date')
    .eq('user_id', userId)
    .gte('date', start)
    .lte('date', end)
    .neq('statut', 'annulee')
    .limit(1);
  if (error) throw error;
  if ((data?.length ?? 0) > 0) {
    throw new Error('absence_work_day_conflict');
  }
}

/** Dates with at least one non-cancelled work period (blocks absence registration). */
export async function fetchUserWorkDates(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('periodes_travail')
    .select('date')
    .eq('user_id', userId)
    .neq('statut', 'annulee');
  if (error) throw error;
  return new Set((data || []).map((row) => row.date as string));
}

export function rangeIncludesWorkDate(
  start: string,
  end: string,
  workDates: ReadonlySet<string>,
): boolean {
  for (const dateKey of expandDateRange(start, end)) {
    if (workDates.has(dateKey)) return true;
  }
  return false;
}

async function assertNoOverlap(
  userId: string,
  input: AbsenceInput,
  excludeId?: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('absences')
    .select('id, date_debut, date_fin')
    .eq('user_id', userId);
  if (error) throw error;

  for (const row of data || []) {
    if (excludeId && row.id === excludeId) continue;
    if (rangesOverlap(input.date_debut, input.date_fin, row.date_debut, row.date_fin)) {
      throw new Error('absence_overlap');
    }
  }
}

export async function createAbsence(userId: string, input: AbsenceInput): Promise<Absence> {
  if (input.date_fin < input.date_debut) {
    throw new Error('absence_invalid_range');
  }
  if (!input.commentaire?.trim()) {
    throw new Error('absence_reason_required');
  }
  await assertNoOverlap(userId, input);
  await assertNoWorkDaysInRange(userId, input.date_debut, input.date_fin);

  const { data, error } = await supabase
    .from('absences')
    .insert({
      user_id: userId,
      date_debut: input.date_debut,
      date_fin: input.date_fin,
      motif: input.motif ?? null,
      commentaire: input.commentaire.trim(),
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Absence;
}

export async function updateAbsence(
  absenceId: string,
  userId: string,
  input: AbsenceInput,
): Promise<Absence> {
  if (input.date_fin < input.date_debut) {
    throw new Error('absence_invalid_range');
  }
  if (!input.commentaire?.trim()) {
    throw new Error('absence_reason_required');
  }
  await assertNoOverlap(userId, input, absenceId);
  await assertNoWorkDaysInRange(userId, input.date_debut, input.date_fin);

  const { data, error } = await supabase
    .from('absences')
    .update({
      date_debut: input.date_debut,
      date_fin: input.date_fin,
      motif: input.motif ?? null,
      commentaire: input.commentaire.trim(),
    })
    .eq('id', absenceId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Absence;
}

export async function deleteAbsence(absenceId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('absences')
    .delete()
    .eq('id', absenceId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function fetchTeamAbsences(options: {
  viewerId: string;
  viewerRole: Profile['role'];
  startDate?: string;
  endDate?: string;
}): Promise<Absence[]> {
  let userIds: string[] | null = null;
  if (options.viewerRole === 'chef_equipe') {
    userIds = await getChefTeamUserIds(options.viewerId);
    if (userIds.length === 0) return [];
  }

  let query = supabase
    .from('absences')
    .select(`
      *,
      profiles!absences_user_id_fkey (id, nom, prenom, matricule, avatar_path, avatar_updated_at)
    `)
    .order('date_debut', { ascending: true });

  if (userIds) {
    query = query.in('user_id', userIds);
  }
  if (options.startDate) {
    query = query.gte('date_fin', options.startDate);
  }
  if (options.endDate) {
    query = query.lte('date_debut', options.endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Absence[];
}

export function getWeekBounds(today = new Date()): { start: string; end: string } {
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: formatDateKey(monday), end: formatDateKey(sunday) };
}
