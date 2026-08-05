import { supabase } from './supabase';
import { AffectationChantier } from '@/types';

export class WorksitesService {
  static async getAssignedWorksites(userId: string): Promise<AffectationChantier[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('affectations_chantiers')
      .select('*, chantiers(*)')
      .eq('user_id', userId)
      .lte('date_debut', today)
      .or(`date_fin.is.null,date_fin.gte.${today}`)
      .order('date_debut', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async assignWorkerToWorksite(params: {
    userId: string;
    chantierId: string;
    chefEquipeId: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('affectations_chantiers')
      .insert({
        user_id: params.userId,
        chantier_id: params.chantierId,
        chef_equipe_id: params.chefEquipeId,
        date_debut: new Date().toISOString().split('T')[0],
      });

    if (error) throw error;
  }

  static async removeWorkerFromWorksite(params: {
    userId: string;
    chantierId: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('affectations_chantiers')
      .update({ date_fin: new Date().toISOString().split('T')[0] })
      .eq('user_id', params.userId)
      .eq('chantier_id', params.chantierId);

    if (error) throw error;
  }
}