import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { Profile, AffectationChantier } from '@/types';
import { getChefManagedChantierIds } from '@/utils/team';

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  assignedWorksites: AffectationChantier[];
  selectedWorksite: AffectationChantier | null;
  setSelectedWorksite: (worksite: AffectationChantier | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assignedWorksites, setAssignedWorksites] = useState<AffectationChantier[]>([]);
  const [selectedWorksite, setSelectedWorksite] = useState<AffectationChantier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        if (session) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);

      // Load assigned worksites for workers and team leaders
      if (data?.role === 'ouvrier' || data?.role === 'chef_equipe') {
        await loadAssignedWorksites(userId, data.role);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await loadProfile(session.user.id);
    }
  };

  const loadAssignedWorksites = async (userId: string, role?: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      if (role === 'chef_equipe') {
        const managedIds = await getChefManagedChantierIds(userId);
        if (managedIds.length === 0) {
          setAssignedWorksites([]);
          setSelectedWorksite(null);
          return;
        }

        const { data, error } = await supabase
          .from('affectations_chantiers')
          .select('*, chantiers(*)')
          .in('chantier_id', managedIds)
          .lte('date_debut', today)
          .or(`date_fin.is.null,date_fin.gte.${today}`)
          .order('date_debut', { ascending: false });

        if (error) throw error;

        const seen = new Set<string>();
        const worksites = (data || []).filter((a) => {
          if (seen.has(a.chantier_id)) return false;
          seen.add(a.chantier_id);
          return true;
        });

        setAssignedWorksites(worksites);
        if (worksites.length === 1) setSelectedWorksite(worksites[0]);
        else setSelectedWorksite(null);
      } else {
        // Ouvrier: merge chantiers from both direct assignments and zone assignments
        const seen = new Set<string>();
        const worksites: AffectationChantier[] = [];

        // 1. Direct assignments via affectations_chantiers
        const { data: affData } = await supabase
          .from('affectations_chantiers')
          .select('*, chantiers(*)')
          .eq('user_id', userId)
          .lte('date_debut', today)
          .or(`date_fin.is.null,date_fin.gte.${today}`);

        for (const aff of affData || []) {
          const chantier = aff.chantiers;
          if (!chantier || seen.has(chantier.id) || !chantier.actif) continue;
          if (chantier.date_debut && chantier.date_debut > today) continue;
          if (chantier.date_fin && chantier.date_fin < today) continue;
          seen.add(chantier.id);
          worksites.push(aff);
        }

        // 2. Zone-based assignments via zones_ouvriers → zones_chantiers → chantiers
        const { data: zoData } = await supabase
          .from('zones_ouvriers')
          .select('zone_id, zones_chantiers(chantier_id, chantiers(id, nom, code, adresse, actif, date_debut, date_fin, created_at))')
          .eq('user_id', userId)
          .is('date_fin', null);

        for (const zo of zoData || []) {
          for (const zc of (zo as any).zones_chantiers || []) {
            const chantier = zc.chantiers;
            if (!chantier || seen.has(chantier.id) || !chantier.actif) continue;
            if (chantier.date_debut && chantier.date_debut > today) continue;
            if (chantier.date_fin && chantier.date_fin < today) continue;
            seen.add(chantier.id);
            worksites.push({
              id: zc.chantier_id,
              user_id: userId,
              chantier_id: chantier.id,
              chef_equipe_id: null,
              date_debut: chantier.date_debut || today,
              date_fin: chantier.date_fin,
              created_at: chantier.created_at,
              chantiers: chantier,
            });
          }
        }

        setAssignedWorksites(worksites);
        if (worksites.length === 1) setSelectedWorksite(worksites[0]);
        else if (worksites.length === 0) setSelectedWorksite(null);
      }
    } catch (error) {
      console.error('Error loading assigned worksites:', error);
      setAssignedWorksites([]);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    setProfile(null);
    setAssignedWorksites([]);
    setSelectedWorksite(null);
    setSession(null);
    // scope: 'local' clears this client only (no revoke HTTP call). More reliable on web.
    await supabase.auth.signOut({ scope: 'local' });
  };

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      assignedWorksites,
      selectedWorksite,
      setSelectedWorksite,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
