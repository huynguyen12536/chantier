export type UserRole = 'ouvrier' | 'chef_equipe' | 'administratif' | 'admin';

export type Profile = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  matricule: string;
  phone: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Chantier = {
  id: string;
  nom: string;
  code: string;
  adresse: string;
  actif: boolean;
  date_debut: string;
  date_fin: string | null;
  heure_debut: string | null;
  heure_fin: string | null;
  created_at: string;
};

export type DeclarationHeures = {
  id: string;
  user_id: string;
  chantier_id: string;
  date: string;
  heures_normales: number;
  heures_supplementaires: number;
  nb_paniers: number;
  statut: 'brouillon' | 'soumise' | 'validee' | 'rejetee';
  commentaire: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  nb_deplacements: number;
};

export type AffectationChantier = {
  id: string;
  user_id: string;
  chantier_id: string;
  chef_equipe_id: string | null;
  date_debut: string;
  date_fin: string | null;
  created_at: string;
  chantiers?: Chantier;
};

export type PeriodeTravail = {
  id: string;
  user_id: string;
  chantier_id: string;
  date: string;
  heure_debut: string;
  heure_fin: string | null;
  latitude_debut: number;
  longitude_debut: number;
  latitude_fin: number | null;
  longitude_fin: number | null;
  statut: 'en_cours' | 'terminee' | 'validee' | 'rejetee';
  commentaire: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  panier_repas: boolean;
  deplacement: boolean;
  chantiers?: Chantier;
};

export type Language = 'fr' | 'en';

export type AuthContextType = {
  session: any;
  profile: Profile | null;
  loading: boolean;
  assignedWorksites: AffectationChantier[];
  selectedWorksite: AffectationChantier | null;
  setSelectedWorksite: (worksite: AffectationChantier | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};