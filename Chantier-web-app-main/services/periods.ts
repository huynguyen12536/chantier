import { supabase } from './supabase';
import { PeriodeTravail } from '@/types';

export class PeriodsService {
  static async getTodayPeriods(userId: string, date: string): Promise<PeriodeTravail[]> {
    const { data, error } = await supabase
      .from('periodes_travail')
      .select('*, chantiers(nom, code, heure_debut, heure_fin)')
      .eq('user_id', userId)
      .eq('date', date)
      .order('heure_debut', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async startPeriod(params: {
    userId: string;
    chantierId: string;
    date: string;
    heureDebut: string;
    latitude: number;
    longitude: number;
  }): Promise<PeriodeTravail> {
    const { data, error } = await supabase
      .from('periodes_travail')
      .insert({
        user_id: params.userId,
        chantier_id: params.chantierId,
        date: params.date,
        heure_debut: params.heureDebut,
        latitude_debut: params.latitude,
        longitude_debut: params.longitude,
        statut: 'en_cours',
      })
      .select('*, chantiers(nom, code)')
      .single();

    if (error) throw error;
    return data;
  }

  static async endPeriod(params: {
    periodId: string;
    heureFin: string;
    latitude: number;
    longitude: number;
  }): Promise<PeriodeTravail> {
    const { data, error } = await supabase
      .from('periodes_travail')
      .update({
        heure_fin: params.heureFin,
        latitude_fin: params.latitude,
        longitude_fin: params.longitude,
        statut: 'terminee',
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.periodId)
      .select('*, chantiers(nom, code)')
      .single();

    if (error) throw error;
    return data;
  }

  static async validatePeriod(periodId: string, validatedBy: string): Promise<void> {
    const { error } = await supabase
      .from('periodes_travail')
      .update({
        statut: 'validee',
        validated_by: validatedBy,
        validated_at: new Date().toISOString(),
      })
      .eq('id', periodId);

    if (error) throw error;
  }

  static async rejectPeriod(periodId: string, validatedBy: string): Promise<void> {
    const { error } = await supabase
      .from('periodes_travail')
      .update({
        statut: 'rejetee',
        validated_by: validatedBy,
        validated_at: new Date().toISOString(),
      })
      .eq('id', periodId);

    if (error) throw error;
  }
}