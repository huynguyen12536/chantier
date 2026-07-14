import { supabase } from '@/services/supabase';
import type { Chantier } from '@/types';

type AffectationRow = { user_id: string; chef_equipe_id: string | null };

/** Responsables du chantier (chefs affectés qui supervisent ce chantier). */
export function inferChantierManagerIds(rows: AffectationRow[]): string[] {
  const assignedIds = new Set(rows.map((row) => row.user_id));
  const managers = new Set<string>();
  for (const row of rows) {
    const managerId = row.chef_equipe_id;
    if (managerId && assignedIds.has(managerId)) {
      managers.add(managerId);
    }
  }
  return [...managers];
}

/** Premier responsable (affichage carte, compatibilité). */
export function inferChantierManagerId(rows: AffectationRow[]): string | null {
  return inferChantierManagerIds(rows)[0] ?? null;
}

/** chef_equipe_id par membre : chaque chef = son propre responsable, ouvrier → 1er chef choisi. */
export function resolveAffectationChefEquipeId(
  userId: string,
  userIds: string[],
  profiles: { id: string; role: string }[],
): string | null {
  const profile = profiles.find((p) => p.id === userId);
  if (!profile) return null;
  if (profile.role === 'chef_equipe') return userId;
  const firstChefId = userIds.find(
    (id) => profiles.find((p) => p.id === id)?.role === 'chef_equipe',
  );
  return firstChefId ?? null;
}

/** IDs des chantiers supervisés : chantiers où le chef est directement affecté comme utilisateur. */
export async function getChefManagedChantierIds(chefId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('affectations_chantiers')
    .select('chantier_id')
    .eq('user_id', chefId)
    .is('date_fin', null);
  if (error) throw error;
  return [...new Set((data || []).map((row) => row.chantier_id))];
}

export async function getChefManagedChantiers(chefId: string): Promise<Chantier[]> {
  const ids = await getChefManagedChantierIds(chefId);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from('chantiers')
    .select('*')
    .in('id', ids)
    .order('nom', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** Ouvriers actifs sur les chantiers supervisés par ce chef. */
export async function getChefTeamUserIds(chefId: string): Promise<string[]> {
  const managedChantierIds = await getChefManagedChantierIds(chefId);

  const userIdSet = new Set<string>();

  if (managedChantierIds.length > 0) {
    const { data: chantierAff, error } = await supabase
      .from('affectations_chantiers')
      .select('user_id')
      .in('chantier_id', managedChantierIds)
      .is('date_fin', null);
    if (error) throw error;
    for (const row of chantierAff || []) {
      userIdSet.add(row.user_id);
    }
  }

  const { data: zonesData } = await supabase
    .from('zones_equipe')
    .select('zones_ouvriers(user_id, date_fin)')
    .eq('chef_equipe_id', chefId);
  for (const zone of zonesData || []) {
    for (const zo of (zone as { zones_ouvriers?: { user_id: string; date_fin: string | null }[] }).zones_ouvriers || []) {
      if (zo.date_fin === null) {
        userIdSet.add(zo.user_id);
      }
    }
  }

  return [...userIdSet];
}
