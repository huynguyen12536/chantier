import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { ComponentType, Dispatch, ReactNode, SetStateAction } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Image,
  ImageBackground,
  Platform,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Users,
  Building2,
  Search,
  X,
  Pencil as Edit2,
  UserPlus,
  Trash2,
  Plus,
  Check,
  ChevronDown,
  User,
  Mail,
  Lock,
  Hash,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  HardHat,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Translations } from '@/i18n';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/services/supabase';
import { Profile, Chantier, UserRole } from '@/types';
import { Colors } from '@/constants/colors';
import { isChantierAssignableRole } from '@/constants';
import {
  canAccessManagement,
  canDeleteInManagement,
  canManageUsers,
  isAdmin,
  isAdminUserRoleLocked,
} from '@/utils/role';
import { getChefManagedChantierIds, resolveAffectationChefEquipeId } from '@/utils/team';
import { generateWorksiteCode } from '@/utils/worksiteCode';
import { getMinEndTime, isEndAfterStart } from '@/utils/time';
import { isEmailValid } from '@/utils/email';
import {
  isPhoneValid,
  normalizePhone,
} from '@/utils/phone';
import { PhoneField } from '@/components/common/PhoneField';
import { RoleSelectField } from '@/components/common/RoleSelectField';
import { BottomSheetOverlay, DraggableBottomSheet, TimePickerModal } from '@/components/common';

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'users' | 'worksites';

type EditUserForm = {
  nom: string;
  prenom: string;
  email: string;
  matricule: string;
  phone: string;
  role: UserRole;
};

type WorksiteForm = {
  nom: string;
  adresse: string;
  actif: boolean;
  date_debut: string;
  date_fin: string;
  heure_debut: string;
  heure_fin: string;
};

type WorksiteUsersById = Record<string, Profile[]>;
type ZoneOption = {
  id: string;
  nom: string;
  chef_nom: string;
};

type ZonesByChantier = Record<string, ZoneOption[]>;

// ─── Constants ───────────────────────────────────────────────────────────────

function getRoleLabel(role: UserRole, t: Translations): string {
  const labels: Record<UserRole, string> = {
    ouvrier: t.roles.ouvrier,
    chef_equipe: t.roles.chef_equipe,
    administratif: t.roles.administratif,
    admin: t.roles.admin,
  };
  return labels[role] ?? role;
}

function getUserFormRoles(t: Translations): { value: UserRole; label: string }[] {
  return [
    { value: 'ouvrier', label: t.roles.ouvrier },
    { value: 'chef_equipe', label: t.roles.chef_equipe },
    { value: 'admin', label: t.roles.admin },
  ];
}

const adminHeaderBackground = require('../../assets/images/bg (2).png');
const worksiteCardBackground = require('../../assets/images/bgcard-chantier.png');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roleColor(role: UserRole): string {
  switch (role) {
    case 'admin': return Colors.error;
    case 'chef_equipe': return Colors.primary;
    case 'administratif': return Colors.info;
    default: return Colors.secondary;
  }
}

const DEFAULT_HEURE_DEBUT = '07:30';
const DEFAULT_HEURE_FIN = '16:30';

function formatDateInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInput(value?: string): Date {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, (month || 1) - 1, day || 1);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatDisplayDate(value: string | null | undefined, locale: string, undefinedLabel: string): string {
  if (!value) return undefinedLabel;
  const parsed = parseDateInput(value);
  return parsed.toLocaleDateString(locale);
}

function formatCount(count: number, one: string, many: string): string {
  return (count === 1 ? one : many).replace('{{count}}', String(count));
}

function normalizeDateRange(start?: string, end?: string): { start: string; end: string } | null {
  const rangeStart = start?.trim();
  if (!rangeStart) return null;
  const rangeEnd = end?.trim();
  if (!rangeEnd) return { start: rangeStart, end: rangeStart };
  return rangeStart <= rangeEnd
    ? { start: rangeStart, end: rangeEnd }
    : { start: rangeEnd, end: rangeStart };
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return '';
}

function phoneRequiredMsg(t: Translations): string {
  return t.management.errors.phoneRequired;
}

function normalizeUserForm(form: EditUserForm): EditUserForm {
  return {
    ...form,
    nom: form.nom.trim(),
    prenom: form.prenom.trim(),
    email: form.email.trim(),
    matricule: form.matricule.trim(),
    phone: form.phone?.trim() ?? '',
  };
}

async function promoteChefsToChefEquipe(chefIds: string[], profiles: Profile[]) {
  for (const chefId of chefIds) {
    const person = profiles.find((p) => p.id === chefId);
    if (!person || person.role !== 'ouvrier') continue;
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'chef_equipe' })
      .eq('id', chefId)
      .eq('role', 'ouvrier');
    if (error) throw error;
  }
}

async function syncChantierAffectationManagers(
  chantierId: string,
  userIds: string[],
  profiles: Profile[],
) {
  if (userIds.length === 0) return;
  for (const userId of userIds) {
    const chefEquipeId = resolveAffectationChefEquipeId(userId, userIds, profiles);
    const { error } = await supabase
      .from('affectations_chantiers')
      .update({ chef_equipe_id: chefEquipeId })
      .eq('chantier_id', chantierId)
      .eq('user_id', userId)
      .is('date_fin', null);
    if (error) throw error;
  }
}

function getSelectedChefIds(userIds: string[], profiles: Profile[]): string[] {
  return userIds.filter((id) => profiles.find((p) => p.id === id)?.role === 'chef_equipe');
}

function normalizeTeamSelection(
  userIds: string[],
  profiles: Profile[],
  lockedUserId?: string | null,
): string[] {
  const locked =
    lockedUserId && userIds.includes(lockedUserId) ? [lockedUserId] : lockedUserId ? [lockedUserId] : [];

  const chefEquipeIds = userIds.filter((id) => {
    if (lockedUserId && id === lockedUserId) return false;
    return profiles.find((p) => p.id === id)?.role === 'chef_equipe';
  });

  const workerIds = userIds.filter((id) => {
    if (lockedUserId && id === lockedUserId) return false;
    return profiles.find((p) => p.id === id)?.role !== 'chef_equipe';
  });

  return [...new Set([...locked, ...chefEquipeIds, ...workerIds])];
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ManagementScreen() {
  const { profile, refreshProfile } = useAuth();
  const { t, language } = useLanguage();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();
  const userFormRoles = useMemo(() => getUserFormRoles(t), [t]);
  const mgmt = t.management;
  const m = mgmt.modals;
  const dateLocale = language === 'en' ? 'en-GB' : 'fr-FR';
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [search, setSearch] = useState('');

  // Users state
  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersRefreshing, setUsersRefreshing] = useState(false);
  const [editUserModal, setEditUserModal] = useState(false);
  const [addUserModal, setAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [userForm, setUserForm] = useState<EditUserForm>({ nom: '', prenom: '', email: '', matricule: '', phone: '', role: 'ouvrier' });
  const [addUserPassword, setAddUserPassword] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Worksites state
  const [worksites, setWorksites] = useState<Chantier[]>([]);
  const [worksiteUsersById, setWorksiteUsersById] = useState<WorksiteUsersById>({});
  const [wsLoading, setWsLoading] = useState(true);
  const [wsRefreshing, setWsRefreshing] = useState(false);
  const [editWsModal, setEditWsModal] = useState(false);
  const [addWsModal, setAddWsModal] = useState(false);
  const [editingWs, setEditingWs] = useState<Chantier | null>(null);
  const [wsForm, setWsForm] = useState<WorksiteForm>({ nom: '', adresse: '', actif: true, date_debut: '', date_fin: '', heure_debut: '', heure_fin: '' });
  const [addWsUserIds, setAddWsUserIds] = useState<string[]>([]);
  const [editWsUserIds, setEditWsUserIds] = useState<string[]>([]);
  const wsUserLoadGenRef = useRef(0);
  const [savingWs, setSavingWs] = useState(false);
  const [deleteWsConfirm, setDeleteWsConfirm] = useState<Chantier | null>(null);
  const [deletingWs, setDeletingWs] = useState(false);

  // Zones state (display on cards only)
  const [zonesByChantier, setZonesByChantier] = useState<ZonesByChantier>({});

  const [error, setError] = useState<string | null>(null);
  const [userModalError, setUserModalError] = useState<string | null>(null);

  const loadUsers = useCallback(async (refreshing = false) => {
    if (refreshing) setUsersRefreshing(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('nom', { ascending: true });
      if (error) throw error;
      setUsers(data || []);
    } catch {
      setError(t.management.errors.loadUsersFailed);
    } finally {
      setUsersLoading(false);
      setUsersRefreshing(false);
    }
  }, [t]);

  const loadZones = useCallback(async () => {
    try {
      const { data: zcData } = await supabase
        .from('zones_chantiers')
        .select('chantier_id, zone_id, zones_equipe(id, nom, profiles!zones_equipe_chef_equipe_id_fkey(nom, prenom))');
      const map: ZonesByChantier = {};
      for (const row of zcData || []) {
        const ze = (row as any).zones_equipe;
        if (!ze) continue;
        const zone: ZoneOption = {
          id: ze.id,
          nom: ze.nom,
          chef_nom: ze.profiles ? `${ze.profiles.prenom} ${ze.profiles.nom}` : '',
        };
        if (!map[row.chantier_id]) map[row.chantier_id] = [];
        if (!map[row.chantier_id].some(z => z.id === zone.id)) map[row.chantier_id].push(zone);
      }
      setZonesByChantier(map);
    } catch {
      // zones not critical — don't block
    }
  }, []);

  const loadWorksites = useCallback(async (refreshing = false) => {
    if (refreshing) setWsRefreshing(true);
    try {
      const isChef = profile?.role === 'chef_equipe';
      const chefId = profile?.id;
      const managedIds = isChef && chefId ? await getChefManagedChantierIds(chefId) : null;

      if (isChef && managedIds && managedIds.length === 0) {
        setWorksites([]);
        setWorksiteUsersById({});
        return;
      }

      let chantiersQuery = supabase.from('chantiers').select('*').order('nom', { ascending: true });
      if (managedIds?.length) {
        chantiersQuery = chantiersQuery.in('id', managedIds);
      }
      const { data, error } = await chantiersQuery;
      if (error) throw error;
      setWorksites(data || []);

      let affectationsQuery = supabase
        .from('affectations_chantiers')
        .select('chantier_id, user_id, chef_equipe_id')
        .is('date_fin', null);
      if (managedIds?.length) {
        affectationsQuery = affectationsQuery.in('chantier_id', managedIds);
      }
      const { data: affectations, error: affectationsError } = await affectationsQuery;
      if (affectationsError) throw affectationsError;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      if (profilesError) throw profilesError;

      const affectationRows = (affectations || []) as {
        chantier_id: string;
        user_id: string;
        chef_equipe_id: string | null;
      }[];

      const usersByWorksite = affectationRows.reduce<WorksiteUsersById>((acc, row) => {
        const profileData = (profiles || []).find((user) => user.id === row.user_id);
        if (!row.chantier_id || !profileData) return acc;
        acc[row.chantier_id] = [...(acc[row.chantier_id] || []), profileData];
        return acc;
      }, {});

      setWorksiteUsersById(usersByWorksite);
    } catch {
      setError(t.management.errors.loadWorksitesFailed);
    } finally {
      setWsLoading(false);
      setWsRefreshing(false);
    }
  }, [profile?.id, profile?.role, t]);

  const showUsersTab = profile?.role ? canManageUsers(profile.role) : false;
  const showTabBar = profile?.role ? isAdmin(profile.role) : false;
  const canDelete = profile?.role ? canDeleteInManagement(profile.role) : false;
  const isChefEquipe = profile?.role === 'chef_equipe';

  useEffect(() => { loadUsers(); loadWorksites(); loadZones(); }, [loadUsers, loadWorksites, loadZones]);

  useEffect(() => {
    if (profile?.role === 'chef_equipe') {
      setActiveTab('worksites');
    }
  }, [profile?.role]);

  const chantierAssignableUsers = useMemo(
    () => users.filter((u) => isChantierAssignableRole(u.role)),
    [users],
  );

  if (!profile?.role || !canAccessManagement(profile.role)) return null;

  // Clear search when switching tabs
  const switchTab = (tab: Tab) => {
    if (tab === 'users' && !showUsersTab) return;
    setActiveTab(tab);
    setSearch('');
    setError(null);
  };

  // ─── Users actions ──────────────────────────────────────────────────────────

  const filteredUsers = users.filter(u =>
    `${u.prenom} ${u.nom} ${u.email} ${u.matricule}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAddUser = () => {
    setUserModalError(null);
    setUserForm({ nom: '', prenom: '', email: '', matricule: '', phone: '', role: 'ouvrier' });
    setAddUserPassword('');
    setAddUserModal(true);
  };

  const saveAddUser = async () => {
    const normalizedForm = normalizeUserForm(userForm);
    const password = addUserPassword;

    if (!normalizedForm.nom || !normalizedForm.prenom || !normalizedForm.email || !password.trim()) {
      setUserModalError(t.management.errors.createUserRequired);
      return;
    }
    if (!isEmailValid(normalizedForm.email)) {
      setUserModalError(t.management.errors.emailComRequired);
      return;
    }
    if (!isPhoneValid(normalizedForm.phone)) {
      setUserModalError(phoneRequiredMsg(t));
      return;
    }
    setUserModalError(null);
    setSavingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error(t.management.errors.sessionExpired);
      const res = await fetch(
        `${supabaseUrl}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            email: normalizedForm.email,
            password,
            nom: normalizedForm.nom,
            prenom: normalizedForm.prenom,
            phone: normalizePhone(normalizedForm.phone),
            role: normalizedForm.role,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.management.errors.createError);
      setUserModalError(null);
      setAddUserModal(false);
      await loadUsers();
    } catch (e: any) {
      setUserModalError(e.message || t.management.errors.createUserFailed);
    } finally {
      setSavingUser(false);
    }
  };

  const openEditUser = (user: Profile) => {
    setUserModalError(null);
    setEditingUser(user);
    setUserForm({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email ?? '',
      matricule: user.matricule,
      phone: user.phone ?? '',
      role: user.role,
    });
    setEditUserModal(true);
  };

  const saveUser = async () => {
    if (!editingUser) return;
    const normalizedForm = normalizeUserForm(userForm);

    if (!normalizedForm.nom || !normalizedForm.prenom || !normalizedForm.email) {
      setUserModalError(t.management.errors.allFieldsRequired);
      return;
    }
    if (!isEmailValid(normalizedForm.email)) {
      setUserModalError(t.management.errors.emailComRequired);
      return;
    }
    if (!isPhoneValid(normalizedForm.phone)) {
      setUserModalError(phoneRequiredMsg(t));
      return;
    }

    setUserModalError(null);
    setSavingUser(true);
    try {
      if (editingUser.role === 'chef_equipe' && normalizedForm.role !== 'chef_equipe') {
        const { data: affRows, error: affErr } = await supabase
          .from('affectations_chantiers')
          .select('id')
          .eq('chef_equipe_id', editingUser.id)
          .is('date_fin', null)
          .limit(1);
        if (affErr) throw affErr;
        if (affRows && affRows.length > 0) {
          setUserModalError(t.management.errors.chefStillWorksiteManager);
          return;
        }
        const { data: zoneRows, error: zoneErr } = await supabase
          .from('zones_equipe')
          .select('id')
          .eq('chef_equipe_id', editingUser.id)
          .limit(1);
        if (zoneErr) throw zoneErr;
        if (zoneRows && zoneRows.length > 0) {
          setUserModalError(t.management.errors.chefStillZoneLead);
          return;
        }
      }

      const roleToSave =
        editingUser.id === profile?.id || isAdminUserRoleLocked(editingUser.role)
          ? editingUser.role
          : normalizedForm.role;

      const { error } = await supabase
        .from('profiles')
        .update({
          nom: normalizedForm.nom,
          prenom: normalizedForm.prenom,
          email: normalizedForm.email,
          matricule: editingUser.matricule,
          phone: normalizePhone(normalizedForm.phone),
          role: roleToSave,
        })
        .eq('id', editingUser.id);
      if (error) throw error;
      setUserModalError(null);
      setEditUserModal(false);
      await loadUsers();
      if (editingUser.id === profile?.id) {
        await refreshProfile();
      }
    } catch (e) {
      setUserModalError(getErrorMessage(e) || t.management.errors.saveFailed);
    } finally {
      setSavingUser(false);
    }
  };

  const deleteUser = async () => {
    if (!deleteUserConfirm) return;
    setDeletingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${supabaseUrl}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ user_id: deleteUserConfirm.id }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.management.errors.deleteError);
      setError(null);
      setDeleteUserConfirm(null);
      await loadUsers();
    } catch (e: any) {
      setError(e.message || t.management.errors.deleteUserFailed);
    } finally {
      setDeletingUser(false);
    }
  };

  // ─── Worksites actions ──────────────────────────────────────────────────────

  const filteredWs = worksites.filter((w) =>
    `${w.nom} ${w.code} ${w.adresse}`.toLowerCase().includes(search.toLowerCase()),
  );

  const loadWorksiteAssignments = async (chantierId: string) => {
    const { data, error } = await supabase
      .from('affectations_chantiers')
      .select('user_id, chef_equipe_id')
      .eq('chantier_id', chantierId)
      .is('date_fin', null);
    if (error) throw error;
    const rows = data || [];
    const userIds = rows.map((row) => row.user_id as string);
    return { userIds };
  };

  const openEditWs = async (ws: Chantier) => {
    setAddWsModal(false);
    setEditingWs(ws);
    setWsForm({ nom: ws.nom, adresse: ws.adresse || '', actif: ws.actif, date_debut: ws.date_debut || '', date_fin: ws.date_fin || '', heure_debut: ws.heure_debut || '', heure_fin: ws.heure_fin || '' });
    setEditWsUserIds([]);
    const loadGen = ++wsUserLoadGenRef.current;
    setEditWsModal(true);
    try {
      const { userIds } = await loadWorksiteAssignments(ws.id);
      if (loadGen !== wsUserLoadGenRef.current) return;
      const idsWithSelf =
        isChefEquipe && profile?.id ? [...new Set([...userIds, profile.id])] : userIds;
      setEditWsUserIds(normalizeTeamSelection(idsWithSelf, users, isChefEquipe ? profile?.id : null));
    } catch {
      if (loadGen !== wsUserLoadGenRef.current) return;
      setEditWsUserIds([]);
      setError(t.management.errors.loadWorksiteDataFailed);
    }
  };

  const openAddWs = () => {
    wsUserLoadGenRef.current += 1;
    setEditWsModal(false);
    setEditingWs(null);
    setWsForm({
      nom: '',
      adresse: '',
      actif: true,
      date_debut: formatDateInput(),
      date_fin: '',
      heure_debut: DEFAULT_HEURE_DEBUT,
      heure_fin: DEFAULT_HEURE_FIN,
    });
    setAddWsUserIds([]);
    setAddWsModal(true);
  };

  const toggleTeamMemberSelection = (
    userId: string,
    lockedUserId: string | null | undefined,
    setUserIds: Dispatch<SetStateAction<string[]>>,
  ) => {
    if (lockedUserId && userId === lockedUserId) return;
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const ensureLocked = (ids: string[]) =>
      lockedUserId && !ids.includes(lockedUserId) ? [lockedUserId, ...ids] : ids;

    setUserIds((current) => {
      if (current.includes(userId)) {
        return ensureLocked(current.filter((id) => id !== userId));
      }

      if (user.role === 'chef_equipe') {
        const lockedIsChef =
          !!lockedUserId && users.find((u) => u.id === lockedUserId)?.role === 'chef_equipe';
        if (lockedIsChef) return ensureLocked(current);
        return ensureLocked([...current, userId]);
      }

      return ensureLocked([...current, userId]);
    });
  };

  const toggleAddWsUser = (userId: string) => {
    toggleTeamMemberSelection(userId, null, setAddWsUserIds);
  };

  const toggleEditWsUser = (userId: string) => {
    toggleTeamMemberSelection(userId, isChefEquipe ? profile?.id : null, setEditWsUserIds);
  };

  const saveEditWs = async () => {
    if (!editingWs) return;
    setSavingWs(true);
    try {
      if (!isChefEquipe) {
        const { error } = await supabase
          .from('chantiers')
          .update({ nom: wsForm.nom, adresse: wsForm.adresse, actif: wsForm.actif, date_debut: wsForm.date_debut || null, date_fin: wsForm.date_fin || null, heure_debut: wsForm.heure_debut || null, heure_fin: wsForm.heure_fin || null })
          .eq('id', editingWs.id);
        if (error) throw error;
      }

      const assignmentStartDate = isChefEquipe
        ? (editingWs.date_debut || formatDateInput())
        : (wsForm.date_debut || formatDateInput());

      const { userIds: currentUserIds } = await loadWorksiteAssignments(editingWs.id);
      const toAdd = editWsUserIds.filter((id) => !currentUserIds.includes(id));
      const toRemove = currentUserIds.filter(
        (id) => !editWsUserIds.includes(id) && !(isChefEquipe && id === profile?.id),
      );

      if (toAdd.length > 0) {
        const affectations = toAdd.map((userId) => ({
          user_id: userId,
          chantier_id: editingWs.id,
          chef_equipe_id: resolveAffectationChefEquipeId(userId, editWsUserIds, users),
          date_debut: assignmentStartDate,
          date_fin: null,
        }));
        const { error: addError } = await supabase
          .from('affectations_chantiers')
          .upsert(affectations, { onConflict: 'user_id,chantier_id' });
        if (addError) throw addError;
      }

      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('affectations_chantiers')
          .update({ date_fin: formatDateInput() })
          .eq('chantier_id', editingWs.id)
          .is('date_fin', null)
          .in('user_id', toRemove);
        if (removeError) throw removeError;
      }

      const chefIds = getSelectedChefIds(editWsUserIds, users);
      await promoteChefsToChefEquipe(chefIds, users);
      await syncChantierAffectationManagers(editingWs.id, editWsUserIds, users);

      setEditWsUserIds([]);
      setEditWsModal(false);
      loadUsers();
      loadWorksites();
      loadZones();
    } catch {
      setError(t.management.errors.saveFailed);
    } finally {
      setSavingWs(false);
    }
  };

  const saveAddWs = async () => {
    const userIdsToAssign = [...addWsUserIds];
    setSavingWs(true);
    try {
      const { data, error } = await supabase
        .from('chantiers')
        .insert({
          nom: wsForm.nom,
          code: await generateWorksiteCode(),
          adresse: wsForm.adresse,
          actif: wsForm.actif,
          date_debut: wsForm.date_debut || null,
          date_fin: wsForm.date_fin || null,
          heure_debut: wsForm.heure_debut || null,
          heure_fin: wsForm.heure_fin || null,
        })
        .select('id')
        .single();
      if (error) throw error;

      if (data && userIdsToAssign.length > 0) {
        const affectations = userIdsToAssign.map((userId) => ({
          user_id: userId,
          chantier_id: data.id,
          chef_equipe_id: resolveAffectationChefEquipeId(userId, userIdsToAssign, users),
          date_debut: wsForm.date_debut || formatDateInput(),
          date_fin: null,
        }));
        const { error: affectationError } = await supabase
          .from('affectations_chantiers')
          .insert(affectations);
        if (affectationError) throw affectationError;
      }

      const chefIds = getSelectedChefIds(userIdsToAssign, users);
      await promoteChefsToChefEquipe(chefIds, users);
      if (data && userIdsToAssign.length > 0) {
        await syncChantierAffectationManagers(data.id, userIdsToAssign, users);
      }

      setAddWsUserIds([]);
      setAddWsModal(false);
      loadUsers();
      loadWorksites();
      loadZones();
    } catch {
      setError(t.management.errors.createWorksiteFailed);
    } finally {
      setSavingWs(false);
    }
  };

  const deleteWs = async () => {
    if (!deleteWsConfirm) return;
    setDeletingWs(true);
    try {
      const { error } = await supabase.rpc('delete_chantier_cascade', {
        p_chantier_id: deleteWsConfirm.id,
      });
      if (error) throw error;
      setDeleteWsConfirm(null);
      loadWorksites();
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('Delete chantier failed', error);
      setError(
        message
          ? t.management.errors.deleteWorksiteFailedWithReason.replace('{{reason}}', message)
          : t.management.errors.deleteWorksiteFailed,
      );
    } finally {
      setDeletingWs(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* Header */}
      <ImageBackground
        source={adminHeaderBackground}
        resizeMode="cover"
        style={styles.header}
        imageStyle={styles.headerImage}
      >
        <View style={[styles.headerOverlay, { paddingTop: headerPaddingTop }]}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{mgmt.title}</Text>
            <Text style={styles.headerSubtitle}>{mgmt.subtitle}</Text>
            </View>
            {showTabBar && (
              <TouchableOpacity
                style={styles.headerAddBtn}
                onPress={showUsersTab && activeTab === 'users' ? openAddUser : openAddWs}
                activeOpacity={0.8}
              >
                <Plus size={20} color="#FFF" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {showTabBar && (
            <View style={styles.tabBar}>
              {showUsersTab && (
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'users' && styles.tabActive]}
                  onPress={() => switchTab('users')}
                  activeOpacity={0.8}
                >
                  <Users size={16} color={activeTab === 'users' ? Colors.primary : 'rgba(255,255,255,0.85)'} />
                  <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>
                   {mgmt.tabs.users}
                  </Text>
                  {activeTab === 'users' && (
                    <View style={styles.tabCount}>
                      <Text style={styles.tabCountText}>{users.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.tab, activeTab === 'worksites' && styles.tabActive]}
                onPress={() => switchTab('worksites')}
                activeOpacity={0.8}
              >
                <Building2 size={16} color={activeTab === 'worksites' ? Colors.primary : 'rgba(255,255,255,0.85)'} />
                <Text style={[styles.tabText, activeTab === 'worksites' && styles.tabTextActive]}>
                  {mgmt.tabs.worksites}
                </Text>
                {activeTab === 'worksites' && (
                  <View style={styles.tabCount}>
                    <Text style={styles.tabCountText}>{worksites.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ImageBackground>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={showUsersTab && activeTab === 'users' ? m.searchUser : m.searchWorksite}
            placeholderTextColor={Colors.text.disabled}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <X size={14} color={Colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {showUsersTab && activeTab === 'users' ? (
        usersLoading ? (
          <ActivityIndicator style={styles.centered} color={Colors.primary} />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={usersRefreshing} onRefresh={() => loadUsers(true)} tintColor={Colors.primary} />
            }
          >
            <Text style={styles.countLabel}>
            {formatCount(filteredUsers.length, mgmt.userCount, mgmt.userCountPlural)}
            </Text>
            {filteredUsers.map(user => (
              <View key={user.id} style={styles.userCard}>
                <View style={[styles.avatar, { backgroundColor: roleColor(user.role) + '20' }]}>
                  <Text style={[styles.avatarText, { color: roleColor(user.role) }]}>
                    {user.prenom?.[0]}{user.nom?.[0]}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.cardName}>{user.prenom} {user.nom}</Text>
                  <Text style={styles.cardEmail}>{user.email}</Text>
                  <View style={styles.cardMeta}>
                    <View style={[styles.roleBadge, { backgroundColor: roleColor(user.role) + '15' }]}>
                      <Text style={[styles.roleText, { color: roleColor(user.role) }]}>
                        {getRoleLabel(user.role, t)}
                      </Text>
                    </View>
                    {user.matricule ? <Text style={styles.matricule}>#{user.matricule}</Text> : null}
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditUser(user)}>
                    <Edit2 size={15} color={Colors.primary} />
                  </TouchableOpacity>
                  {canDelete && user.id !== profile?.id && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteUserConfirm(user)}>
                      <Trash2 size={15} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        )
      ) : (
        wsLoading ? (
          <ActivityIndicator style={styles.centered} color={Colors.primary} />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={wsRefreshing} onRefresh={() => loadWorksites(true)} tintColor={Colors.primary} />
            }
          >
            <Text style={styles.countLabel}>
            {formatCount(filteredWs.length, mgmt.worksiteCount, mgmt.worksiteCountPlural)}
            </Text>
            {filteredWs.map((ws) => {
              const assignedUsers = worksiteUsersById[ws.id] || [];
              const sortedUsers = [...assignedUsers].sort((a, b) => {
                const aChef = a.role === 'chef_equipe';
                const bChef = b.role === 'chef_equipe';
                if (aChef && !bChef) return -1;
                if (!aChef && bChef) return 1;
                return 0;
              });
              const visibleUsers = sortedUsers.slice(0, 3);
              const remainingUsers = Math.max(sortedUsers.length - visibleUsers.length, 0);

              return (
                <View key={ws.id} style={styles.wsCard}>
                  <View style={styles.wsCardBgWrap}>
                    <Image
                      source={worksiteCardBackground}
                      style={styles.wsCardBg}
                      resizeMode="cover"
                    />
                    {Platform.OS === 'web' ? (
                      <View style={styles.wsCardOverlay} />
                    ) : (
                      <BlurView intensity={8} tint="light" style={styles.wsCardOverlayBlur}>
                        <View style={styles.wsCardOverlayTint} />
                      </BlurView>
                    )}
                  </View>
                  <View style={styles.wsCardInner}>
                    <View style={styles.wsIcon}>
                      <Building2 size={20} color={Colors.primary} strokeWidth={2.2} />
                    </View>
                    <View style={styles.wsCardBody}>
                        <View style={styles.wsTitleRow}>
                          <Text style={styles.wsTitle} numberOfLines={1}>{ws.nom}</Text>
                          <View style={styles.wsCardActions}>
                            <TouchableOpacity style={styles.wsActionBtn} onPress={() => openEditWs(ws)}>
                              {isChefEquipe ? (
                                <UserPlus size={15} color={Colors.primary} />
                              ) : (
                                <Edit2 size={15} color={Colors.primary} />
                              )}
                            </TouchableOpacity>
                            {canDelete && (
                              <TouchableOpacity style={styles.wsActionBtn} onPress={() => setDeleteWsConfirm(ws)}>
                                <Trash2 size={15} color={Colors.error} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                        {!!ws.adresse && (
                          <View style={styles.wsAddressRow}>
                            <MapPin size={13} color={Colors.primary} strokeWidth={2.3} />
                            <Text style={styles.wsAddress} numberOfLines={1}>
                              {ws.adresse}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.wsMetaLine} numberOfLines={1}>
                          <Text style={styles.wsMetaLabel}>{mgmt.startLabel} </Text>
                          {formatDisplayDate(ws.date_debut, dateLocale, mgmt.dateUndefined)}
                          <Text style={styles.wsMetaDot}> · </Text>
                          <Text style={styles.wsMetaLabel}>{mgmt.endLabel} </Text>
                          {formatDisplayDate(ws.date_fin, dateLocale, mgmt.dateUndefined)}
                        </Text>
                        <View style={styles.wsUsersLine}>
                          <Users size={13} color={Colors.primary} strokeWidth={2.3} />
                          <Text style={styles.wsUserNames} numberOfLines={1}>
                            {assignedUsers.length === 0 ? (
                                mgmt.noUsersAssigned
                            ) : (
                              <>
                                {visibleUsers.map((user, index) => (
                                  <Text key={user.id}>
                                    {index > 0 ? ', ' : ''}
                                    <Text style={user.role === 'chef_equipe' ? styles.wsUserNameLeader : undefined}>
                                      {user.prenom} {user.nom}
                                    </Text>
                                  </Text>
                                ))}
                                {remainingUsers > 0 ? ` +${remainingUsers}` : ''}
                              </>
                            )}
                          </Text>
                        </View>
                        {(zonesByChantier[ws.id] || []).length > 0 && (
                          <View style={styles.wsZoneBadges}>
                            {(zonesByChantier[ws.id] || []).map((zone) => (
                              <View key={zone.id} style={styles.wsZoneBadge}>
                                <Text style={styles.wsZoneBadgeText} numberOfLines={1}>{zone.nom}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                </View>
              );
            })}
          </ScrollView>
        )
      )}

      {/* ── Modals ── */}

      {/* Delete user confirm */}
      <Modal visible={!!deleteUserConfirm} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <View style={styles.confirmIconWrap}>
              <Trash2 size={26} color={Colors.error} />
            </View>
            <Text style={styles.confirmTitle}>{m.deleteUser.title}</Text>
            <Text style={styles.confirmMsg}>
              {m.deleteUser.messageBefore}<Text style={{ fontWeight: '700' }}>{deleteUserConfirm?.prenom} {deleteUserConfirm?.nom}</Text>{m.deleteUser.messageAfter}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setDeleteUserConfirm(null)}>
                <Text style={styles.confirmCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDelete} onPress={deleteUser} disabled={deletingUser}>
                {deletingUser ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmDeleteText}>{m.delete}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete worksite confirm */}
      <Modal visible={!!deleteWsConfirm} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <View style={styles.confirmIconWrap}>
              <Trash2 size={26} color={Colors.error} />
            </View>
            <Text style={styles.confirmTitle}>{m.deleteWorksite.title}</Text>
            <Text style={styles.confirmMsg}>
              {m.deleteWorksite.messageBefore}<Text style={{ fontWeight: '700' }}>{deleteWsConfirm?.nom}</Text>{m.deleteWorksite.messageAfter}
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setDeleteWsConfirm(null)}>
                <Text style={styles.confirmCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDelete} onPress={deleteWs} disabled={deletingWs}>
                {deletingWs ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmDeleteText}>{m.delete}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit user modal */}
      <Modal visible={editUserModal} animationType="slide" transparent>
        <BottomSheetOverlay
          style={styles.modalOverlay}
          onDismiss={() => { setUserModalError(null); setEditUserModal(false); }}
        >
          <DraggableBottomSheet
            visible={editUserModal}
            initial={0.85}
            onDismiss={() => { setUserModalError(null); setEditUserModal(false); }}
            style={styles.modalSheet}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{m.editUser.title}</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => { setUserModalError(null); setEditUserModal(false); }}>
                <X size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {userModalError ? <Text style={styles.modalError}>{userModalError}</Text> : null}
              <FieldLabel icon={User}>{m.fields.firstName}</FieldLabel>
              <TextInput style={styles.fieldInput} value={userForm.prenom} onChangeText={v => setUserForm(f => ({ ...f, prenom: v }))} placeholder={m.fields.firstName} placeholderTextColor={Colors.text.disabled} />
              <FieldLabel icon={User}>{m.fields.lastName}</FieldLabel>
              <TextInput style={styles.fieldInput} value={userForm.nom} onChangeText={v => setUserForm(f => ({ ...f, nom: v }))} placeholder={m.fields.lastName} placeholderTextColor={Colors.text.disabled} />
              <EmailField
                email={userForm.email}
                onChangeEmail={v => { setUserModalError(null); setUserForm(f => ({ ...f, email: v })); }}
              />
              <FieldLabel icon={Hash}>{m.fields.matricule}</FieldLabel>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputDisabled]}
                value={userForm.matricule}
                editable={false}
                placeholder={m.fields.matricule}
                placeholderTextColor={Colors.text.disabled}
              />
              <PhoneField phone={userForm.phone} onChangePhone={phone => { setUserModalError(null); setUserForm(f => ({ ...f, phone })); }} fieldKey={editingUser?.id} />
              {editingUser && editingUser.id !== profile?.id && (
                <>
                  <FieldLabel icon={ShieldCheck}>{m.fields.role}</FieldLabel>
                  {isAdminUserRoleLocked(editingUser.role) ? (
                    <View style={styles.roleLockedBox}>
                      <Text style={styles.roleLockedText}>{getRoleLabel(editingUser.role, t)}</Text>
                    </View>
                  ) : (
                    <RoleSelectField
                    value={userForm.role}
                    onChange={(role) => setUserForm((f) => ({ ...f, role }))}
                    options={userFormRoles}
                  />  
                  )}
                </>
              )}
              <View style={{ height: 16 }} />
              <TouchableOpacity style={styles.saveBtn} onPress={saveUser} disabled={savingUser}>
                {savingUser ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{m.save}</Text>}
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </ScrollView>
          </DraggableBottomSheet>
        </BottomSheetOverlay>
      </Modal>

      {/* Add user modal */}
      <Modal visible={addUserModal} animationType="slide" transparent>
        <BottomSheetOverlay
          style={styles.worksiteModalOverlay}
          onDismiss={() => { setUserModalError(null); setAddUserModal(false); }}
        >
          <DraggableBottomSheet
            visible={addUserModal}
            initial={0.88}
            onDismiss={() => { setUserModalError(null); setAddUserModal(false); }}
            style={styles.modalSheet}
          >
            <View style={styles.modalHeroHeader}>
              <View style={styles.modalHeroCopy}>
                <Text style={styles.modalHeroSubtitle}>{m.addUser.heroSubtitle}</Text>
              </View>
              <TouchableOpacity style={styles.modalHeroCloseBtn} onPress={() => { setUserModalError(null); setAddUserModal(false); }}>
                <ChevronDown size={24} color={Colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {userModalError ? <Text style={styles.modalError}>{userModalError}</Text> : null}
              <FieldLabel icon={User}>{m.fields.firstName}</FieldLabel>
              <TextInput style={styles.fieldInput} value={userForm.prenom} onChangeText={v => setUserForm(f => ({ ...f, prenom: v }))} placeholder={m.fields.firstName} placeholderTextColor={Colors.text.disabled} />
              <FieldLabel icon={User}>{m.fields.lastName}</FieldLabel>
              <TextInput style={styles.fieldInput} value={userForm.nom} onChangeText={v => setUserForm(f => ({ ...f, nom: v }))} placeholder={m.fields.lastName} placeholderTextColor={Colors.text.disabled} />
              <EmailField
                email={userForm.email}
                onChangeEmail={v => { setUserModalError(null); setUserForm(f => ({ ...f, email: v })); }}
              />
              <PasswordField value={addUserPassword} onChangeText={setAddUserPassword} />
              <PhoneField phone={userForm.phone} onChangePhone={phone => { setUserModalError(null); setUserForm(f => ({ ...f, phone })); }} fieldKey="add-user" />
              <FieldLabel icon={ShieldCheck}>{m.fields.role}</FieldLabel>
              <RoleSelectField
                value={userForm.role}
                onChange={(role) => setUserForm((f) => ({ ...f, role }))}
                options={userFormRoles}
              />
              <View style={{ height: 16 }} />
              <TouchableOpacity style={styles.saveBtn} onPress={saveAddUser} disabled={savingUser}>
                {savingUser ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{m.addUser.createButton}</Text>}
              </TouchableOpacity>
              <View style={{ height: 32 }} />
            </ScrollView>
          </DraggableBottomSheet>
        </BottomSheetOverlay>
      </Modal>

      {/* Add / Edit worksite modal */}
      <WorksiteFormModal
        visible={editWsModal}
        title=""
        heroTitle={isChefEquipe ? m.editWorksite.heroTitleChef : m.editWorksite.heroTitle}
        hideChantierDetails={isChefEquipe}
        hideManagerSelection={isChefEquipe}
        form={wsForm}
        setForm={setWsForm}
        onClose={() => {
          wsUserLoadGenRef.current += 1;
          setEditWsUserIds([]);
          setEditWsModal(false);
        }}
        onSave={saveEditWs}
        saving={savingWs}
        users={chantierAssignableUsers}
        selectedUserIds={editWsUserIds}
        onToggleUser={toggleEditWsUser}
        lockedUserId={isChefEquipe ? profile?.id : null}
      />
      <WorksiteFormModal
        visible={addWsModal}
        title={m.addWorksite.title}
        heroTitle={m.addWorksite.heroTitle}
        form={wsForm}
        setForm={setWsForm}
        onClose={() => {
          setAddWsUserIds([]);
          setAddWsModal(false);
        }}
        onSave={saveAddWs}
        saving={savingWs}
        users={chantierAssignableUsers}
        selectedUserIds={addWsUserIds}
        onToggleUser={toggleAddWsUser}
      />
    </View>
  );
}

// ─── Worksite Form Modal ──────────────────────────────────────────────────────

type FieldLabelProps = {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  children: ReactNode;
};

function FieldLabel({ icon: Icon, children }: FieldLabelProps) {
  return (
    <View style={styles.fieldLabelRow}>
      <Icon size={14} color={Colors.primary} strokeWidth={2.4} />
      <Text style={styles.fieldLabel}>{children}</Text>
    </View>
  );
}

type EmailFieldProps  = {
  email: string;
  onChangeEmail: (email: string) => void;
};

function EmailField({ email, onChangeEmail }: EmailFieldProps) {
  const { t } = useLanguage();
  const m = t.management.modals;
  const invalid = email.length > 0 && !isEmailValid(email);

  return (
    <>
      <FieldLabel icon={Mail}>{m.fields.email}</FieldLabel>
      <TextInput
        style={[styles.fieldInput, invalid && styles.fieldInputInvalid]}
        value={email}
        onChangeText={onChangeEmail}
        placeholder={m.fields.emailPlaceholder}
        placeholderTextColor={Colors.text.disabled}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="off"
        textContentType="none"
        importantForAutofill="no"
      />
    </>
  );
}

type PasswordFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
};

function PasswordField({ value, onChangeText }: PasswordFieldProps) {
  const { t } = useLanguage();
  const m = t.management.modals;
  const [show, setShow] = useState(false);

  return (
    <>
      <FieldLabel icon={Lock}>{m.fields.password}</FieldLabel>
      <View style={styles.passwordFieldWrap}>
        <TextInput
          style={styles.passwordFieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={m.fields.password}
          placeholderTextColor={Colors.text.disabled}
          secureTextEntry={!show}
          autoComplete="new-password"
          textContentType="newPassword"
          importantForAutofill="no"
        />
        <TouchableOpacity
          onPress={() => setShow((s) => !s)}
          style={styles.passwordEyeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {show ? (
            <EyeOff size={20} color={Colors.text.secondary} />
          ) : (
            <Eye size={20} color={Colors.text.secondary} />
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

type DateInputFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onOpenCalendar: () => void;
  datePlaceholder?: string;
};

function DateInputField({ label, value, onChangeText, onOpenCalendar, datePlaceholder = 'YYYY-MM-DD' }: DateInputFieldProps) {
  return (
    <View style={styles.dateField}>
      <Text style={styles.dateFieldLabel}>{label}</Text>
      <View style={styles.dateInputBox}>
        <TextInput
          style={styles.dateInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={datePlaceholder}
          placeholderTextColor={Colors.text.disabled}
        />
        <TouchableOpacity style={styles.dateCalendarBtn} onPress={onOpenCalendar}>
          <Calendar size={18} color={Colors.primary} strokeWidth={2.3} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

type TimeInputFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onOpenPicker: () => void;
  timePlaceholder?: string;
};

function TimeInputField({ label, value, onChangeText, onOpenPicker, timePlaceholder = 'HH:MM' }: TimeInputFieldProps) {
  return (
    <View style={styles.dateField}>
      <FieldLabel icon={Clock}>{label}</FieldLabel>
      <View style={styles.dateInputBox}>
        <TextInput
          style={styles.dateInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={timePlaceholder}
          placeholderTextColor={Colors.text.disabled}
          keyboardType="numeric"
          maxLength={5}
        />
        <TouchableOpacity style={styles.dateCalendarBtn} onPress={onOpenPicker} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Clock size={18} color={Colors.primary} strokeWidth={2.3} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

type DatePickerModalProps = {
  visible: boolean;
  value: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  rangeStart?: string;
  rangeEnd?: string;
};

function DatePickerModal({ visible, value, onSelect, onClose, rangeStart, rangeEnd }: DatePickerModalProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'en' ? 'en-US' : 'fr-FR';
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const parsed = parseDateInput(value);
    return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
  });

  useEffect(() => {
    if (visible) {
      const parsed = parseDateInput(value);
      setVisibleMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
    }
  }, [visible, value]);

  const selectedDate = parseDateInput(value);
  const selectedValue = formatDateInput(selectedDate);
  const dateRange = normalizeDateRange(rangeStart, rangeEnd);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const firstWeekOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [
    ...Array.from({ length: firstWeekOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const changeMonth = (direction: number) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.calendarOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" />
        <View style={styles.calendarSheet}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity style={styles.calendarNavBtn} onPress={() => changeMonth(-1)}>
              <Text style={styles.calendarNavText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>
              {visibleMonth.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity style={styles.calendarNavBtn} onPress={() => changeMonth(1)}>
              <Text style={styles.calendarNavText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarWeekRow}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.calendarWeekText}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {days.map((day, index) => {
              if (!day) return <View key={`empty-${index}`} style={styles.calendarDayCell} />;
              const dayValue = formatDateInput(new Date(year, month, day));
              const active = dayValue === selectedValue;
              const inRange = !!dateRange && dayValue >= dateRange.start && dayValue <= dateRange.end;
              const isRangeStart = !!dateRange && dayValue === dateRange.start;
              const isRangeEnd = !!dateRange && dayValue === dateRange.end;
              const endpoint = isRangeStart || isRangeEnd || active;

              return (
                <View key={dayValue} style={styles.calendarDayCell}>
                  <TouchableOpacity
                    style={[
                      styles.calendarDay,
                      inRange && !endpoint && styles.calendarDayInRange,
                      endpoint && styles.calendarDayActive,
                    ]}
                    onPress={() => onSelect(dayValue)}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        endpoint && styles.calendarDayTextActive,
                        inRange && !endpoint && styles.calendarDayTextInRange,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.calendarCloseBtn} onPress={onClose}>
            <Text style={styles.calendarCloseText}>{t.management.modals.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

type TeamPickerSheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  mode: 'single' | 'multiple';
  users: Profile[];
  selectedIds: string[];
  showManagerBadge?: boolean;
  autoManagerBadge?: boolean;
  lockedUserId?: string | null;
  onClose: () => void;
  onToggle: (userId: string) => void;
};

function TeamPickerSheet({
  visible,
  title,
  subtitle,
  mode,
  users,
  selectedIds,
  showManagerBadge = false,
  autoManagerBadge = false,
  lockedUserId = null,
  onClose,
  onToggle,
}: TeamPickerSheetProps) {
  const { t, language } = useLanguage();
  const tp = t.management.modals.teamPicker;
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!visible) setSearch('');
  }, [visible]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users;
    if (q) {
      list = list.filter((user) =>
        `${user.nom} ${user.prenom} ${user.matricule ?? ''}`.toLowerCase().includes(q),
      );
    }
    const sortLocale = language === 'en' ? 'en' : 'fr';
    return [...list].sort((a, b) =>
      `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, sortLocale),
    );
  }, [users, search, language]);

  const handleToggle = (userId: string) => {
    onToggle(userId);
    if (mode === 'single') onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <BottomSheetOverlay style={styles.teamSheetOverlay} onDismiss={onClose}>
        <DraggableBottomSheet visible={visible} initial={0.8} min={0.1} max={0.92} onDismiss={onClose} style={styles.teamSheet}>
          <View style={styles.teamSheetHeader}>
            <View style={styles.teamSheetHeaderCopy}>
              <Text style={styles.teamSheetTitle}>{title}</Text>
              {subtitle ? <Text style={styles.teamSheetSubtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
              <X size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.assignmentSearchBox}>
            <Search size={15} color={Colors.text.secondary} />
            <TextInput
              style={styles.assignmentSearchInput}
              placeholder={t.management.modals.search}
              placeholderTextColor={Colors.text.disabled}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <X size={15} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.teamSheetList}
            contentContainerStyle={styles.teamSheetListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filteredUsers.length === 0 ? (
              <Text style={styles.assignmentEmptyText}>
                {search.trim() ? tp.noUsersFound : tp.noUsersAvailable}
              </Text>
            ) : (
              filteredUsers.map((user) => {
                const active = selectedIds.includes(user.id);
                const isManager = showManagerBadge && (autoManagerBadge ? active : false);
                const isSingle = mode === 'single';
                return (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.assignmentOption,
                      active && styles.assignmentOptionSelected,
                      isManager && styles.assignmentOptionLeader,
                    ]}
                    onPress={() => handleToggle(user.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.assignmentCheckHit}>
                      {isSingle ? (
                        <View style={[styles.assignmentRadio, active && styles.assignmentRadioActive]}>
                          {active && <View style={styles.assignmentRadioDot} />}
                        </View>
                      ) : (
                        <View style={[styles.assignmentCheckbox, active && styles.assignmentCheckboxActive]}>
                          {active && <Check size={12} color="#FFF" strokeWidth={3} />}
                        </View>
                      )}
                    </View>
                    <View style={styles.assignmentUserInfo}>
                      <Text
                        style={[styles.assignmentUserName, isManager && styles.assignmentUserNameLeader]}
                        numberOfLines={1}
                      >
                        {user.prenom} {user.nom}
                      </Text>
                      <Text style={styles.assignmentUserMeta} numberOfLines={1}>
                        {getRoleLabel(user.role, t)}{user.matricule ? ` · #${user.matricule}` : ''}
                      </Text>
                    </View>
                    {active && isManager && (
                      <View style={[styles.leaderBtn, styles.leaderBtnActive]}>
                        <ShieldCheck size={14} color={Colors.text.inverse} strokeWidth={2.4} />
                        <Text style={[styles.leaderBtnText, styles.leaderBtnTextActive]}>
                          {isSingle ? tp.designatedChef : tp.manager}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {mode === 'multiple' && (
            <TouchableOpacity style={styles.teamSheetConfirmBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.teamSheetConfirmText}>
                {tp.validate}{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </DraggableBottomSheet>
      </BottomSheetOverlay>
    </Modal>
  );
}

function WorksiteFormModal({
  visible,
  title,
  heroTitle,
  hideChantierDetails = false,
  hideManagerSelection = false,
  lockedUserId = null,
  form,
  setForm,
  onClose,
  onSave,
  saving,
  users = [],
  selectedUserIds = [],
  onToggleUser,
}: {
  visible: boolean;
  title: string;
  heroTitle?: string;
  hideChantierDetails?: boolean;
  hideManagerSelection?: boolean;
  lockedUserId?: string | null;
  form: WorksiteForm;
  setForm: (fn: (f: WorksiteForm) => WorksiteForm) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  users?: Profile[];
  selectedUserIds?: string[];
  onToggleUser?: (userId: string) => void;
}) {
  const { t } = useLanguage();
  const m = t.management.modals;
  const tp = m.teamPicker;
  const showUserSelection = !!onToggleUser;
  const [chefPickerVisible, setChefPickerVisible] = useState(false);
  const [ouvrierPickerVisible, setOuvrierPickerVisible] = useState(false);
  const [activeCalendarField, setActiveCalendarField] = useState<'date_debut' | 'date_fin' | null>(null);
  const [activeTimeField, setActiveTimeField] = useState<'heure_debut' | 'heure_fin' | null>(null);
  const formScrollRef = useRef<ScrollView>(null);

  const lockedProfile = useMemo(
    () => (lockedUserId ? users.find((u) => u.id === lockedUserId) : undefined),
    [users, lockedUserId],
  );
  const lockedIsChef = lockedProfile?.role === 'chef_equipe';
  const showChefPicker = showUserSelection && !hideManagerSelection && !lockedIsChef;

  const chefUsers = useMemo(
    () => users.filter((u) => u.role === 'chef_equipe' && u.id !== lockedUserId),
    [users, lockedUserId],
  );
  const ouvrierUsers = useMemo(
    () => users.filter((u) => u.role !== 'chef_equipe' && u.id !== lockedUserId),
    [users, lockedUserId],
  );

  const selectedChefs = useMemo(
    () =>
      selectedUserIds
        .map((id) => users.find((u) => u.id === id))
        .filter((u): u is Profile => !!u && u.role === 'chef_equipe'),
    [selectedUserIds, users],
  );

  const selectedOuvriers = useMemo(
    () =>
      selectedUserIds
        .map((id) => users.find((u) => u.id === id))
        .filter((u): u is Profile => !!u && u.role !== 'chef_equipe'),
    [selectedUserIds, users],
  );

  const chefPickerSelectedIds = selectedChefs.map((u) => u.id);

  useEffect(() => {
    if (!visible) {
      setChefPickerVisible(false);
      setOuvrierPickerVisible(false);
      setActiveCalendarField(null);
      setActiveTimeField(null);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BottomSheetOverlay style={styles.worksiteModalOverlay} onDismiss={onClose}>
        <DraggableBottomSheet
          visible={visible}
          initial={0.92}
          min={0.1}
          max={0.95}
          onDismiss={onClose}
          style={[styles.modalSheet, styles.worksiteModalSheet]}
        >
          {heroTitle ? (
            <View style={styles.modalHeroHeader}>
              <View style={styles.modalHeroCopy}>
                <Text style={styles.modalHeroSubtitle}>{heroTitle}</Text>
              </View>
              <TouchableOpacity style={styles.modalHeroCloseBtn} onPress={onClose}>
                <ChevronDown size={24} color={Colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
                <X size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          )}
          <ScrollView
            ref={formScrollRef}
            style={styles.worksiteModalScroll}
            contentContainerStyle={styles.worksiteModalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!hideChantierDetails && (
              <>
                <FieldLabel icon={Building2}>{m.fields.name}</FieldLabel>
                <TextInput style={styles.fieldInput} value={form.nom} onChangeText={v => setForm(f => ({ ...f, nom: v }))} placeholder={m.fields.worksiteName} placeholderTextColor={Colors.text.disabled} />
                <FieldLabel icon={MapPin}>{m.fields.address}</FieldLabel>
                <TextInput style={styles.fieldInput} value={form.adresse} onChangeText={v => setForm(f => ({ ...f, adresse: v }))} placeholder={m.fields.address} placeholderTextColor={Colors.text.disabled} />
                <View style={styles.dateFieldsRow}>
                  <DateInputField
                    label={m.fields.startDate}
                    value={form.date_debut}
                    onChangeText={v => setForm(f => ({ ...f, date_debut: v }))}
                    onOpenCalendar={() => setActiveCalendarField('date_debut')}
                    datePlaceholder={m.placeholders.date}
                  />
                  <DateInputField
                    label={m.fields.endDate}
                    value={form.date_fin}
                    onChangeText={v => setForm(f => ({ ...f, date_fin: v }))}
                    onOpenCalendar={() => setActiveCalendarField('date_fin')}
                    datePlaceholder={m.placeholders.date}
                  />
                </View>
                <View style={styles.dateFieldsRow}>
                  <TimeInputField
                    label={m.fields.startTime}
                    value={form.heure_debut}
                    onChangeText={v => setForm(f => ({ ...f, heure_debut: v }))}
                    onOpenPicker={() => setActiveTimeField('heure_debut')}
                    timePlaceholder={m.placeholders.time}
                  />
                  <TimeInputField
                    label={m.fields.endTime}
                    value={form.heure_fin}
                    onChangeText={v => setForm(f => ({ ...f, heure_fin: v }))}
                    onOpenPicker={() => setActiveTimeField('heure_fin')}
                    timePlaceholder={m.placeholders.time}
                  />
                </View>
              </>
            )}
            {showUserSelection && (
              <View style={styles.teamPickerSection}>
                <View style={styles.assignmentHeader}>
                  <View style={styles.assignmentHeaderCopy}>
                    <View style={styles.assignmentTitleRow}>
                      <Users size={14} color={Colors.primary} strokeWidth={2.4} />
                      <Text style={styles.assignmentTitle}>{tp.teamTitle}</Text>
                    </View>
                    <Text style={styles.assignmentHint} numberOfLines={3}>
                      {hideManagerSelection ? tp.hintChefOnly : tp.hintWithChefs}
                    </Text>
                  </View>
                </View>

                {lockedIsChef && lockedProfile && (
                  <View style={[styles.teamPickerField, styles.teamPickerFieldLocked]}>
                    <FieldLabel icon={ShieldCheck}>{tp.chefTitle}</FieldLabel>
                    <View style={styles.teamPickerInput}>
                      <Text style={styles.teamPickerValue} numberOfLines={1}>
                        {lockedProfile.prenom} {lockedProfile.nom}
                      </Text>
                      <View style={[styles.teamPickerActionBtn, styles.teamPickerActionBtnActive]}>
                        <ShieldCheck size={18} color="#FFF" strokeWidth={2.3} />
                      </View>
                    </View>
                    <Text style={styles.teamPickerNote}>{tp.youAreChef}</Text>
                  </View>
                )}

                {showChefPicker && (
                  <View style={styles.teamPickerField}>
                    <FieldLabel icon={ShieldCheck}>{tp.chefTitle}</FieldLabel>
                    <TouchableOpacity
                      style={[
                        styles.teamPickerInput,
                        selectedChefs.length > 0 && styles.teamPickerInputSelected,
                      ]}
                      onPress={() => setChefPickerVisible(true)}
                      activeOpacity={0.85}
                    >
                      {selectedChefs.length === 0 ? (
                        <Text style={styles.teamPickerPlaceholder} numberOfLines={2}>
                          {tp.chooseChefs}
                        </Text>
                      ) : selectedChefs.length === 1 ? (
                        <>
                          <Text style={styles.teamPickerValue} numberOfLines={1}>
                            {selectedChefs[0].prenom} {selectedChefs[0].nom}
                          </Text>
                          <View style={[styles.leaderBtn, styles.leaderBtnActive, styles.teamPickerLeaderChip]}>
                            <ShieldCheck size={14} color={Colors.text.inverse} strokeWidth={2.4} />
                            <Text style={[styles.leaderBtnText, styles.leaderBtnTextActive]}>{tp.manager}</Text>
                          </View>
                        </>
                      ) : (
                        <View style={styles.teamPickerChipRow}>
                          {selectedChefs.map((chef) => (
                            <View key={chef.id} style={[styles.teamPickerChip, styles.teamPickerChipLeader]}>
                              <Text style={[styles.teamPickerChipText, styles.teamPickerChipTextLeader]} numberOfLines={1}>
                                {chef.prenom} {chef.nom}
                              </Text>
                              <View style={[styles.leaderBtn, styles.leaderBtnActive, styles.teamPickerLeaderChipSmall]}>
                                <ShieldCheck size={12} color={Colors.text.inverse} strokeWidth={2.4} />
                                <Text style={[styles.leaderBtnText, styles.leaderBtnTextActive]}>{tp.manager}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                      <View
                        style={[
                          styles.teamPickerActionBtn,
                          selectedChefs.length > 0 && styles.teamPickerActionBtnActive,
                        ]}
                      >
                        <ShieldCheck size={18} color={selectedChefs.length > 0 ? '#FFF' : Colors.primary} strokeWidth={2.3} />
                      </View>
                    </TouchableOpacity>
                    {selectedChefs.length > 1 && (
                      <Text style={styles.teamPickerNote} numberOfLines={2}>
                        {tp.managersCount.replace('{{count}}', String(selectedChefs.length))}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.teamPickerField}>
                  <FieldLabel icon={HardHat}>{tp.workersTitle}</FieldLabel>
                  <TouchableOpacity
                    style={styles.teamPickerInput}
                    onPress={() => setOuvrierPickerVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={selectedOuvriers.length > 0 ? styles.teamPickerValue : styles.teamPickerPlaceholder}
                      numberOfLines={2}
                    >
                      {selectedOuvriers.length === 0
                        ? tp.chooseWorkers
                        : selectedOuvriers.length === 1
                          ? `${selectedOuvriers[0].prenom} ${selectedOuvriers[0].nom}`
                          : tp.workersSelected.replace('{{count}}', String(selectedOuvriers.length))}
                    </Text>
                    <View
                      style={[
                        styles.teamPickerActionBtn,
                        styles.teamPickerActionBtnOuvrier,
                        selectedOuvriers.length > 0 && styles.teamPickerActionBtnActive,
                      ]}
                    >
                      <HardHat size={18} color={selectedOuvriers.length > 0 ? '#FFF' : Colors.primary} strokeWidth={2.3} />
                    </View>
                  </TouchableOpacity>
                  {selectedOuvriers.length > 1 && (
                    <Text style={styles.teamPickerNote} numberOfLines={2}>
                      {selectedOuvriers.map((u) => `${u.prenom} ${u.nom}`).join(' · ')}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View style={{ height: 16 }} />
            <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>{m.save}</Text>}
            </TouchableOpacity>
            <View style={{ height: 32 }} />
          </ScrollView>
          {!hideChantierDetails && (
            <>
              <DatePickerModal
                visible={activeCalendarField !== null}
                value={activeCalendarField ? form[activeCalendarField] : form.date_debut}
                rangeStart={form.date_debut}
                rangeEnd={form.date_fin}
                onSelect={(date) => {
                  if (!activeCalendarField) return;
                  setForm((current) => ({ ...current, [activeCalendarField]: date }));
                }}
                onClose={() => setActiveCalendarField(null)}
              />
              <TimePickerModal
                visible={activeTimeField !== null}
                title={activeTimeField === 'heure_fin' ? m.fields.endTime : m.fields.startTime}
                value={
                  activeTimeField === 'heure_fin'
                    ? form.heure_fin || '16:30'
                    : form.heure_debut || '07:30'
                }
                minTime={
                  activeTimeField === 'heure_fin' && form.heure_debut
                    ? getMinEndTime(form.heure_debut)
                    : undefined
                }
                onClose={() => setActiveTimeField(null)}
                onConfirm={(time) => {
                  if (!activeTimeField) return;
                  setForm((current) => {
                    if (activeTimeField === 'heure_fin') {
                      const heure_fin = isEndAfterStart(current.heure_debut || '07:30', time)
                        ? time
                        : getMinEndTime(current.heure_debut || '07:30');
                      return { ...current, heure_fin };
                    }
                    return { ...current, [activeTimeField]: time };
                  });
                }}
              />
            </>
          )}
          {showUserSelection && (
            <>
              <TeamPickerSheet
                visible={chefPickerVisible}
                title={tp.chefTitle}
                subtitle={tp.chefSubtitle}
                mode="multiple"
                users={chefUsers}
                selectedIds={chefPickerSelectedIds}
                showManagerBadge
                autoManagerBadge
                onClose={() => setChefPickerVisible(false)}
                onToggle={(userId) => onToggleUser?.(userId)}
              />
              <TeamPickerSheet
                visible={ouvrierPickerVisible}
                title={tp.workersTitle}
                subtitle={tp.workersSubtitle}
                mode="multiple"
                users={ouvrierUsers}
                selectedIds={selectedOuvriers.map((u) => u.id)}
                lockedUserId={lockedUserId}
                onClose={() => setOuvrierPickerVisible(false)}
                onToggle={(userId) => onToggleUser?.(userId)}
              />
            </>
          )}
        </DraggableBottomSheet>
      </BottomSheetOverlay>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF7F2' },
  scrollView: { flex: 1 },

  // Header
  header: {
    overflow: 'hidden',
  },
  headerImage: {
    opacity: 0.95,
  },
  headerOverlay: {
    paddingBottom: 0,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 107, 53, 0.58)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 3, fontWeight: '500' },
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,107,53,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.65)',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 0,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabActive: {
    backgroundColor: '#FFF7F2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  tabTextActive: {
    color: Colors.text.primary,
  },
  tabCount: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF7F2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 53, 0.14)',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text.primary },

  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.error + '10',
    borderBottomWidth: 1,
    borderBottomColor: Colors.error + '30',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: { fontSize: 13, color: Colors.error, flex: 1 },

  centered: { flex: 1, alignSelf: 'center', marginTop: 60 },
  countLabel: {
    fontSize: 11,
    color: Colors.text.secondary,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // User card
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.12)',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700' },
  userInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  cardEmail: { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleText: { fontSize: 11, fontWeight: '600' },
  matricule: { fontSize: 11, color: Colors.text.disabled, fontWeight: '500' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editBtn: { padding: 8, borderRadius: 8, backgroundColor: Colors.primary + '10' },
  deleteBtn: { padding: 8, borderRadius: 8, backgroundColor: Colors.error + '10' },

  // Worksite card
  wsCard: {
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 4,
  },
  wsCardBgWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  wsCardBg: {
    position: 'absolute',
    top: '-12%',
    left: '-8%',
    width: '116%',
    height: '124%',
    opacity: 0.88,
  },
  wsCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(1.5px)',
          WebkitBackdropFilter: 'blur(1.5px)',
        } as object)
      : null),
  },
  wsCardOverlayBlur: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  wsCardOverlayTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  wsCardInner: {
    position: 'relative',
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  wsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  wsActionBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  wsCardBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  wsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wsTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.cardWarm.title,
    textShadowColor: 'rgba(255, 255, 255, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  wsCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wsAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  wsAddress: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.cardWarm.body,
    lineHeight: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  wsMetaLine: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.cardWarm.meta,
    lineHeight: 16,
    textShadowColor: 'rgba(255, 255, 255, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  wsMetaLabel: {
    fontWeight: '700',
    color: Colors.cardWarm.label,
  },
  wsMetaDot: {
    color: Colors.cardWarm.muted,
  },
  wsUsersLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  wsUserNames: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.cardWarm.body,
    textShadowColor: 'rgba(255, 255, 255, 0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  wsUserNameLeader: {
    fontWeight: '800',
    color: Colors.primary,
  },
  wsZoneBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  wsZoneBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
  },
  wsZoneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Confirm modal
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(80,35,10,0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmSheet: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.16)',
  },
  confirmIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary, marginBottom: 8 },
  confirmMsg: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', lineHeight: 20, marginBottom: 22 },
  confirmBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFF7F2',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
  },
  confirmCancelText: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  confirmDelete: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.error },
  confirmDeleteText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // Bottom sheet modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(80,35,10,0.42)', justifyContent: 'flex-end' },
  worksiteModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  worksiteModalSheet: {
    paddingTop: 4,
  },
  worksiteModalScroll: {
    flex: 1,
  },
  worksiteModalScrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  modalSheet: {
    backgroundColor: '#FFF7F2',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.16)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
  },
  modalHandle: {
    width: 46,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 107, 53, 0.42)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.14)',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -20,
    marginTop: -12,
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  modalHeroCopy: {
    flex: 1,
  },
  modalHeroSubtitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  modalHeroCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabelRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabelRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabelHint: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.disabled,
  },
  fieldLabelHintInvalid: {
    color: Colors.error,
  },
  fieldLabelHintValid: {
    color: Colors.success,
  },
  fieldLabelRequired: {
    color: Colors.error,
  },
  fieldInputInvalid: {
    borderColor: Colors.error + '55',
  },
  modalError: {
    color: Colors.error,
    fontSize: 13,
    marginBottom: 12,
    backgroundColor: Colors.error + '10',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
    marginBottom: 16,
  },
  fieldInputDisabled: {
    opacity: 0.7,
    color: Colors.text.secondary,
  },
  passwordFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
    marginBottom: 16,
  },
  passwordFieldInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text.primary,
  },
  passwordEyeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  dateFieldsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
  },
  dateFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
    paddingLeft: 12,
    paddingRight: 6,
    overflow: 'hidden',
  },
  dateInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 12,
    color: Colors.text.primary,
    minWidth: 0,
  },
  dateCalendarBtn: {
    width: 30,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(80,35,10,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
  },
  calendarSheet: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF7F2',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.16)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calendarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  calendarNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  calendarNavText: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '700',
    color: Colors.primary,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calendarWeekText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDay: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  calendarDayInRange: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
  },
  calendarDayActive: {
    backgroundColor: Colors.primary,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  calendarDayTextInRange: {
    color: Colors.primary,
    fontWeight: '800',
  },
  calendarDayTextActive: {
    color: '#FFF',
  },
  calendarCloseBtn: {
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
  },
  calendarCloseText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  roleLockedBox: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.light,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    opacity: 0.7,
  },
  roleLockedText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.secondary,
  },

  teamPickerSection: {
    marginBottom: 16,
  },
  teamPickerField: {
    marginBottom: 14,
  },
  teamPickerFieldLocked: {
    opacity: 0.95,
  },
  teamPickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 10,
    gap: 10,
    minHeight: 48,
  },
  teamPickerInputSelected: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  teamPickerChipRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  teamPickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
    maxWidth: '100%',
  },
  teamPickerChipLeader: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
  },
  teamPickerChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text.primary,
    flexShrink: 1,
  },
  teamPickerChipTextLeader: {
    color: Colors.primaryDark,
  },
  teamPickerLeaderChip: {
    flexShrink: 0,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  teamPickerLeaderChipSmall: {
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    maxWidth: undefined,
  },
  teamPickerValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  teamPickerPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.disabled,
  },
  teamPickerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.22)',
  },
  teamPickerActionBtnOuvrier: {
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
  },
  teamPickerActionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  teamPickerNote: {
    marginTop: 6,
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 15,
  },
  teamSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(80, 35, 10, 0.42)',
  },
  teamSheet: {
    backgroundColor: '#FFF7F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 4,
  },
  teamSheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  teamSheetHeaderCopy: {
    flex: 1,
    paddingRight: 12,
  },
  teamSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  teamSheetSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
    lineHeight: 17,
  },
  teamSheetList: {
    flex: 1,
    marginBottom: 12,
  },
  teamSheetListContent: {
    paddingBottom: 8,
  },
  teamSheetConfirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  teamSheetConfirmText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  assignmentHeaderCopy: {
    flex: 1,
  },
  assignmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  assignmentTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assignmentHint: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
  },
  assignmentSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
    marginBottom: 10,
  },
  assignmentSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
    padding: 0,
  },
  assignmentList: {
    flexGrow: 1,
    minHeight: 200,
    maxHeight: 340,
    marginBottom: 16,
  },
  assignmentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.14)',
  },
  assignmentOptionSelected: {
    borderColor: 'rgba(255, 107, 53, 0.32)',
  },
  assignmentOptionLeader: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  assignmentOptionLocked: {
    borderColor: 'rgba(255, 107, 53, 0.22)',
  },
  assignmentCheckHit: {
    padding: 6,
    marginLeft: -4,
  },
  leaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    maxWidth: 130,
  },
  leaderBtnActive: {
    backgroundColor: Colors.primaryDark,
  },
  leaderBtnText: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  leaderBtnTextActive: {
    color: Colors.text.inverse,
  },
  assignmentRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.35)',
    backgroundColor: '#FFF',
  },
  assignmentRadioActive: {
    borderColor: Colors.primary,
  },
  assignmentRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  assignmentRadioLocked: {
    opacity: 0.85,
  },
  assignmentCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.35)',
  },
  assignmentCheckboxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  assignmentCheckboxLocked: {
    opacity: 0.85,
  },
  assignmentUserInfo: {
    flex: 1,
  },
  assignmentUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  assignmentUserNameLeader: {
    color: Colors.primary,
    fontWeight: '800',
  },
  assignmentUserMeta: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  assignmentEmptyText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
