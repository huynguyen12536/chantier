import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { supabase } from '@/services/supabase';
import { PeriodeTravail, Profile, Chantier } from '@/types';
import { CircleCheck as CheckCircle, Building2 } from 'lucide-react-native';
type TeamMember = Profile & {
  periodes_count?: number;
  total_hours?: number;
};

type PeriodeWithUser = PeriodeTravail & {
  profiles?: Profile;
};

export default function ChefDashboardScreen() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingPeriods, setPendingPeriods] = useState<PeriodeWithUser[]>([]);
  const [myChantiers, setMyChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);
  const teamMemberIdsRef = useRef<string[]>([]);

  const today = new Date().toISOString().split('T')[0];

  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return;

      void loadDashboardData(profile.id);

      const channel = supabase
        .channel(`chef_dashboard_${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'periodes_travail',
          },
          (payload) => {
            const userId = (payload.new as any)?.user_id ?? (payload.old as any)?.user_id;
            if (!userId || !teamMemberIdsRef.current.includes(userId)) return;
            void loadDashboardData(profile.id);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [profile?.id])
  );

  const loadDashboardData = async (chefId: string) => {
    try {
      setLoading(true);
      await Promise.all([
        loadTeamMembers(chefId),
        loadMyChantiers(chefId),
        loadPendingPeriods(chefId),
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyChantiers = async (chefId: string) => {
    try {
      const seen = new Set<string>();
      const unique: Chantier[] = [];

      const addChantier = (c: Chantier) => {
        if (!c || seen.has(c.id)) return;
        if (!c.actif) return;
        if (c.date_debut && c.date_debut > today) return;
        if (c.date_fin && c.date_fin < today) return;
        seen.add(c.id);
        unique.push(c);
      };

      // Source 1: chantiers via zones managed by this chef
      const { data: zonesData, error: zonesError } = await supabase
        .from('zones_equipe')
        .select('zones_chantiers(chantier_id, chantiers(id, nom, code, adresse, actif, date_debut, date_fin, created_at))')
        .eq('chef_equipe_id', chefId);
      if (zonesError) throw zonesError;

      for (const zone of zonesData || []) {
        for (const zc of (zone as any).zones_chantiers || []) {
          addChantier(zc.chantiers as Chantier);
        }
      }

      // Source 2: chantiers where this chef is directly assigned (as a user)
      const { data: affData, error: affError } = await supabase
        .from('affectations_chantiers')
        .select('chantiers(id, nom, code, adresse, actif, date_debut, date_fin, created_at)')
        .eq('user_id', chefId)
        .is('date_fin', null);
      if (affError) throw affError;

      for (const row of affData || []) {
        addChantier((row as any).chantiers as Chantier);
      }

      setMyChantiers(unique);
    } catch (error) {
      console.error('Error loading chantiers:', error);
    }
  };

  const loadTeamMembers = async (chefId: string) => {
    try {
      const seen = new Set<string>();
      const members: TeamMember[] = [];

      const addMember = (p: Profile) => {
        if (!p || seen.has(p.id)) return;
        seen.add(p.id);
        members.push({ ...p });
      };

      // Source 1: workers from zones managed by this chef
      const { data, error } = await supabase
        .from('zones_equipe')
        .select('zones_ouvriers(user_id, date_fin, profiles!zones_ouvriers_user_id_fkey(id, nom, prenom, matricule, role))')
        .eq('chef_equipe_id', chefId);

      if (error) throw error;

      for (const zone of data || []) {
        for (const zo of (zone as any).zones_ouvriers || []) {
          if (zo.date_fin !== null) continue;
          addMember(zo.profiles as Profile);
        }
      }

      // Source 2: all workers in chantiers where this chef has an affectation
      // First get chantier IDs where chef has their own affectation
      const { data: chefAffData, error: chefAffError } = await supabase
        .from('affectations_chantiers')
        .select('chantier_id')
        .eq('user_id', chefId)
        .is('date_fin', null);
      if (chefAffError) throw chefAffError;

      const chantierIds = [...new Set((chefAffData || []).map((r: any) => r.chantier_id))];

      if (chantierIds.length > 0) {
        const { data: affData, error: affError } = await supabase
          .from('affectations_chantiers')
          .select('profiles!affectations_chantiers_user_id_fkey(id, nom, prenom, matricule, role)')
          .in('chantier_id', chantierIds)
          .is('date_fin', null);
        if (affError) throw affError;

        for (const row of affData || []) {
          addMember((row as any).profiles as Profile);
        }
      }

      // Enrich with today's hours
      for (const member of members) {
        const { data: periodesData } = await supabase
          .from('periodes_travail')
          .select('heure_debut, heure_fin')
          .eq('user_id', member.id)
          .eq('date', today);

        let totalMinutes = 0;
        periodesData?.forEach((p) => {
          if (p.heure_fin) {
            const [hDebut, mDebut] = p.heure_debut.split(':').map(Number);
            const [hFin, mFin] = p.heure_fin.split(':').map(Number);
            totalMinutes += (hFin * 60 + mFin) - (hDebut * 60 + mDebut);
          }
        });
        member.periodes_count = periodesData?.length || 0;
        member.total_hours = totalMinutes / 60;
      }

      setTeamMembers(members);
      teamMemberIdsRef.current = members.map((m) => m.id);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const loadPendingPeriods = async (chefId: string) => {
    try {
      const seen = new Set<string>();

      // Source 1: workers from zones
      const { data: zones } = await supabase
        .from('zones_equipe')
        .select('zones_ouvriers(user_id, date_fin)')
        .eq('chef_equipe_id', chefId);

      for (const zone of zones || []) {
        for (const zo of (zone as any).zones_ouvriers || []) {
          if (zo.date_fin === null) seen.add(zo.user_id);
        }
      }

      // Source 2: all workers in chantiers where this chef has an affectation
      const { data: chefChantiers } = await supabase
        .from('affectations_chantiers')
        .select('chantier_id')
        .eq('user_id', chefId)
        .is('date_fin', null);

      const chantierIds = [...new Set((chefChantiers || []).map((r: any) => r.chantier_id))];

      if (chantierIds.length > 0) {
        const { data: affData } = await supabase
          .from('affectations_chantiers')
          .select('user_id')
          .in('chantier_id', chantierIds)
          .is('date_fin', null);

        for (const row of affData || []) {
          seen.add(row.user_id);
        }
      }

      const userIds = [...seen];

      if (userIds.length === 0) {
        setPendingPeriods([]);
        return;
      }

      const { data, error } = await supabase
        .from('periodes_travail')
        .select('*, chantiers(nom, code), profiles!periodes_travail_user_id_fkey(nom, prenom)')
        .in('user_id', userIds)
        .eq('statut', 'terminee')
        .eq('date', today)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setPendingPeriods(data || []);
    } catch (error) {
      console.error('Error loading pending periods:', error);
    }
  };

  const handleValidatePeriod = async (periodeId: string) => {
    try {
      const { error } = await supabase
        .from('periodes_travail')
        .update({
          statut: 'validee',
          validated_by: profile?.id,
          validated_at: new Date().toISOString(),
        })
        .eq('id', periodeId);

      if (error) throw error;
      Alert.alert(t.chefDashboard.validated, t.chefDashboard.periodValidated);
      if (profile?.id) loadDashboardData(profile.id);
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || t.chefDashboard.errorValidate);
    }
  };

  const handleRejectPeriod = async (periodeId: string) => {
    Alert.alert(
      t.chefDashboard.rejectConfirm,
      t.chefDashboard.rejectConfirmMessage,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.chefDashboard.reject,
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('periodes_travail')
                .update({
                  statut: 'rejetee',
                  validated_by: profile?.id,
                  validated_at: new Date().toISOString(),
                })
                .eq('id', periodeId);

              if (error) throw error;
              Alert.alert(t.chefDashboard.rejected, t.chefDashboard.periodRejected);
              if (profile?.id) loadDashboardData(profile.id);
            } catch (error: any) {
              Alert.alert(t.common.error, error.message || t.chefDashboard.errorReject);
            }
          },
        },
      ]
    );
  };

  const calculerDuree = (debut: string, fin: string): string => {
    if (!fin) return '0h00';
    const [hDebut, mDebut] = debut.split(':').map(Number);
    const [hFin, mFin] = fin.split(':').map(Number);
    const totalMinutes = (hFin * 60 + mFin) - (hDebut * 60 + mDebut);
    const heures = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${heures}h${String(minutes).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <Text style={styles.greeting}>{t.chefDashboard.title}</Text>
        <Text style={styles.role}>
          {t.roles.chef_equipe} - {profile?.prenom} {profile?.nom}
        </Text>
      </View>

      {pendingPeriods.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.chefDashboard.periodsToValidate}</Text>
          {pendingPeriods.map((periode) => (
            <View key={periode.id} style={styles.periodCard}>
              <View style={styles.periodHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.periodWorker}>
                    {periode.profiles?.prenom} {periode.profiles?.nom}
                  </Text>
                  <Text style={styles.periodChantier}>{periode.chantiers?.nom}</Text>
                </View>
                <Text style={styles.periodDuration}>
                  {calculerDuree(periode.heure_debut, periode.heure_fin || '')}
                </Text>
              </View>
              <View style={styles.periodTime}>
                <Text style={styles.periodTimeText}>
                  {periode.heure_debut.substring(0, 5)} → {periode.heure_fin?.substring(0, 5)}
                </Text>
              </View>
              <View style={styles.periodActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleRejectPeriod(periode.id)}>
                  <Text style={styles.actionButtonText}>{t.chefDashboard.reject}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.validateButton]}
                  onPress={() => handleValidatePeriod(periode.id)}>
                  <CheckCircle size={20} color="#FFF" />
                  <Text style={styles.actionButtonText}>{t.chefDashboard.validate}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {t.chefDashboard.myTeam} ({teamMembers.length})
          </Text>
        </View>
        {teamMembers.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>
                {member.prenom} {member.nom}
              </Text>
              <Text style={styles.memberMatricule}>#{member.matricule}</Text>
            </View>
            <View style={styles.memberStats}>
              <Text style={styles.memberHours}>
                {member.total_hours?.toFixed(1) || '0.0'}h
              </Text>
              <Text style={styles.memberPeriods}>
                {member.periodes_count || 0} {(member.periodes_count || 0) > 1 ? t.chefDashboard.periods : t.chefDashboard.period}
              </Text>
            </View>
          </View>
        ))}
        {teamMembers.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t.chefDashboard.noWorkers}</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {t.chefDashboard.myWorksites} ({myChantiers.length})
        </Text>
        {myChantiers.map((chantier) => (
          <View key={chantier.id} style={styles.worksiteCard}>
            <Building2 size={24} color="#FF6B35" />
            <View style={{ flex: 1 }}>
              <Text style={styles.worksiteName}>{chantier.nom}</Text>
              <Text style={styles.worksiteCode}>{chantier.code}</Text>
            </View>
          </View>
        ))}
        {myChantiers.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t.chefDashboard.noWorksites}</Text>
          </View>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  role: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFF',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  periodCard: {
    backgroundColor: '#FFF3EF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF6B35',
    gap: 12,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  periodWorker: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  periodChantier: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  periodDuration: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
  },
  periodTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodTimeText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  periodActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  validateButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  memberCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  memberMatricule: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  memberStats: {
    alignItems: 'flex-end',
  },
  memberHours: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
  },
  memberPeriods: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  worksiteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  worksiteName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  worksiteCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
