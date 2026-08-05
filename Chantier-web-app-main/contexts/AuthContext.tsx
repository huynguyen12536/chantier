import React, { createContext, useContext, useEffect, useState } from 'react';
import { bindRealtimeAuth, supabase, type AuthSession } from '@/services/supabase';
import { Profile, AffectationChantier } from '@/types';
import { AccountNotFoundError } from '@/utils/authErrors';
import { isCompanyDisabledCode } from '@/utils/companyDisabled';
import { getChefManagedChantierIds } from '@/utils/team';

type AuthContextType = {
  session: AuthSession | null;
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
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assignedWorksites, setAssignedWorksites] = useState<AffectationChantier[]>([]);
  const [selectedWorksite, setSelectedWorksite] = useState<AffectationChantier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      bindRealtimeAuth(session?.access_token);
      if (session) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        bindRealtimeAuth(session?.access_token);
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

  const clearLocalSession = async () => {
    setProfile(null);
    setAssignedWorksites([]);
    setSelectedWorksite(null);
    setSession(null);
    await supabase.auth.signOut({ scope: 'local' });
  };

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        console.warn('[Auth] Profile missing for authenticated user, signing out');
        await clearLocalSession();
        setLoading(false);
        return;
      }

      setProfile(data);

      // Load assigned worksites for workers and team leaders
      if (data.role === 'ouvrier' || data.role === 'chef_equipe') {
        await loadAssignedWorksites(userId, data.role);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        isCompanyDisabledCode((error as { code?: string }).code)
      ) {
        setLoading(false);
        return;
      }
      await clearLocalSession();
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

        // 2. Zone-based assignments via zones_ouvriers → zones_equipe → zones_chantiers → chantiers
        // (no direct FK between zones_ouvriers and zones_chantiers — both point to zones_equipe)
        const { data: zoData, error: zoError } = await supabase
          .from('zones_ouvriers')
          .select('zone_id, zones_equipe(zones_chantiers(chantier_id, chantiers(id, nom, code, adresse, actif, date_debut, date_fin, created_at)))')
          .eq('user_id', userId)
          .is('date_fin', null);

        if (zoError) throw zoError;

        for (const zo of zoData || []) {
          const zoneChantiers = (zo as any).zones_equipe?.zones_chantiers || [];
          for (const zc of zoneChantiers) {
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });
    if (error) throw error;

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profileData) {
      await clearLocalSession();
      throw new AccountNotFoundError();
    }
  };

  const signOut = async () => {
    await clearLocalSession();
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
