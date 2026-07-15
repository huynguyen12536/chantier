import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, AuthSession } from '@/services/supabase';
import { Profile, AffectationChantier } from '@/types';
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

function toProfile(user: AuthSession['user']): Profile {
  return {
    id: user.id,
    email: user.email,
    nom: user.nom || '',
    prenom: user.prenom || '',
    matricule: user.matricule || '',
    phone: user.phone || '',
    role: user.role as Profile['role'],
    created_at: '',
    updated_at: '',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assignedWorksites, setAssignedWorksites] = useState<AffectationChantier[]>([]);
  const [selectedWorksite, setSelectedWorksite] = useState<AffectationChantier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const s = data?.session ?? null;
      setSession(s);
      if (s) {
        void loadProfile(s);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      void (async () => {
        setSession(next);
        if (next) {
          await loadProfile(next);
        } else {
          setProfile(null);
          setAssignedWorksites([]);
          setSelectedWorksite(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (active: AuthSession) => {
    try {
      // Prefer auth/v1 user; fallback to session.user; optional profiles self GET
      let base = toProfile(active.user);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', active.user.id)
          .maybeSingle();
        if (!error && data) {
          base = { ...base, ...(data as Profile) };
        }
      } catch {
        /* use auth user */
      }
      setProfile(base);

      if (base.role === 'ouvrier' || base.role === 'chef_equipe') {
        await loadAssignedWorksites(base.id, base.role);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    const { data } = await supabase.auth.getSession();
    if (data?.session) {
      await loadProfile(data.session);
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
        const worksites = ((data || []) as AffectationChantier[]).filter((a) => {
          if (seen.has(a.chantier_id)) return false;
          seen.add(a.chantier_id);
          return true;
        });

        setAssignedWorksites(worksites);
        if (worksites.length === 1) setSelectedWorksite(worksites[0]);
        else setSelectedWorksite(null);
      } else {
        const seen = new Set<string>();
        const worksites: AffectationChantier[] = [];

        const { data: affData } = await supabase
          .from('affectations_chantiers')
          .select('*, chantiers(*)')
          .eq('user_id', userId)
          .lte('date_debut', today)
          .or(`date_fin.is.null,date_fin.gte.${today}`);

        for (const aff of (affData || []) as AffectationChantier[]) {
          const chantier = aff.chantiers;
          if (!chantier || seen.has(chantier.id) || !chantier.actif) continue;
          if (chantier.date_debut && chantier.date_debut > today) continue;
          if (chantier.date_fin && chantier.date_fin < today) continue;
          seen.add(chantier.id);
          worksites.push(aff);
        }

        const { data: zoData } = await supabase
          .from('zones_ouvriers')
          .select('zone_id, zones_chantiers(chantier_id, chantiers(id, nom, code, adresse, actif, date_debut, date_fin, created_at))')
          .eq('user_id', userId)
          .is('date_fin', null);

        for (const zo of (zoData || []) as any[]) {
          for (const zc of zo.zones_chantiers || []) {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    setProfile(null);
    setAssignedWorksites([]);
    setSelectedWorksite(null);
    setSession(null);
    await supabase.auth.signOut({ scope: 'local' });
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        assignedWorksites,
        selectedWorksite,
        setSelectedWorksite,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
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
