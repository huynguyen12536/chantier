import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { supabase } from '@/services/supabase';
import { Profile, Chantier } from '@/types';
import {
  Plus,
  Search,
  MapPin,
  Users,
  ChevronRight,
  Trash2,
  CircleCheck as CheckCircle2,
  Circle,
  ArrowLeft,
  UserPlus,
  X,
} from 'lucide-react-native';

type Zone = {
  id: string;
  nom: string;
  description: string | null;
  chantiers: ZoneChantier[];
  ouvriers: ZoneOuvrier[];
};

type ZoneChantier = {
  id: string;
  chantier_id: string;
  chantiers: Chantier;
};

type ZoneOuvrier = {
  id: string;
  user_id: string;
  date_debut: string;
  date_fin: string | null;
  profiles: Profile;
};

type Screen = 'list' | 'zone-detail' | 'add-chantiers';

type ConfirmDialog = {
  title: string;
  message: string;
  onConfirm: () => void;
};

export default function TeamManagementScreen() {
  const { profile, assignedWorksites } = useAuth();
  const { t } = useLanguage();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();

  const [screen, setScreen] = useState<Screen>('list');
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create zone modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneDesc, setNewZoneDesc] = useState('');
  const [newZoneChantierIds, setNewZoneChantierIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

  // Edit chantiers screen
  const [selectedChantierIds, setSelectedChantierIds] = useState<Set<string>>(new Set());
  const [savingChantiers, setSavingChantiers] = useState(false);

  // Add workers modal
  const [addWorkerModalVisible, setAddWorkerModalVisible] = useState(false);
  const [allOuvriers, setAllOuvriers] = useState<Profile[]>([]);
  const [workerSearch, setWorkerSearch] = useState('');
  const [addingWorker, setAddingWorker] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (profile?.id) loadZones(profile.id);
    }, [profile?.id])
  );

  const loadZones = async (chefId?: string) => {
    const id = chefId ?? profile?.id;
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('zones_equipe')
        .select(`
          id, nom, description,
          zones_chantiers(id, chantier_id, chantiers(id, nom, code, adresse, actif, date_debut, date_fin, created_at)),
          zones_ouvriers(id, user_id, date_debut, date_fin, profiles!zones_ouvriers_user_id_fkey(id, nom, prenom, matricule, email, role, created_at, updated_at))
        `)
        .eq('chef_equipe_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const parsed: Zone[] = (data || []).map((z: any) => ({
        id: z.id,
        nom: z.nom,
        description: z.description,
        chantiers: z.zones_chantiers || [],
        ouvriers: (z.zones_ouvriers || []).filter((o: ZoneOuvrier) => o.date_fin === null),
      }));
      setZones(parsed);
    } catch (err) {
      console.error('loadZones error', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedZone = async (zoneId: string) => {
    const { data, error } = await supabase
      .from('zones_equipe')
      .select(`
        id, nom, description,
        zones_chantiers(id, chantier_id, chantiers(id, nom, code, adresse, actif, date_debut, date_fin, created_at)),
        zones_ouvriers(id, user_id, date_debut, date_fin, profiles!zones_ouvriers_user_id_fkey(id, nom, prenom, matricule, email, role, created_at, updated_at))
      `)
      .eq('id', zoneId)
      .maybeSingle();

    if (!error && data) {
      const zone: Zone = {
        id: data.id,
        nom: data.nom,
        description: data.description,
        chantiers: (data as any).zones_chantiers || [],
        ouvriers: ((data as any).zones_ouvriers || []).filter((o: ZoneOuvrier) => o.date_fin === null),
      };
      setSelectedZone(zone);
      setZones((prev) => prev.map((z) => (z.id === zoneId ? zone : z)));
    }
  };

  // ---- Create zone modal ----
  const openCreateModal = () => {
    setNewZoneName('');
    setNewZoneDesc('');
    setNewZoneChantierIds(new Set());
    setCreateModalVisible(true);
  };

  const toggleNewChantier = (id: string) => {
    setNewZoneChantierIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateZone = async () => {
    if (!newZoneName.trim() || !profile?.id) return;
    const chefId = profile.id;
    try {
      setCreating(true);

      const { data: zoneData, error: zoneError } = await supabase
        .from('zones_equipe')
        .insert({
          chef_equipe_id: chefId,
          nom: newZoneName.trim(),
          description: newZoneDesc.trim() || null,
        })
        .select('id')
        .single();

      if (zoneError) throw zoneError;
      if (!zoneData) throw new Error('Zone non créée');

      if (newZoneChantierIds.size > 0) {
        const { error: chError } = await supabase.from('zones_chantiers').insert(
          [...newZoneChantierIds].map((cid) => ({ zone_id: zoneData.id, chantier_id: cid }))
        );
        if (chError) throw chError;
      }

      setCreateModalVisible(false);
      await loadZones(chefId);
    } catch (err: any) {
      setErrorMessage(err.message ?? 'Erreur inconnue');
    } finally {
      setCreating(false);
    }
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ title, message, onConfirm });
  };

  const handleDeleteZone = (zone: Zone) => {
    showConfirm(
      t.team.zones.deleteZone,
      t.team.zones.confirmDelete,
      async () => {
        const { error } = await supabase.from('zones_equipe').delete().eq('id', zone.id);
        if (error) {
          setErrorMessage(error.message);
        } else {
          await loadZones(profile?.id);
          if (selectedZone?.id === zone.id) setScreen('list');
        }
      }
    );
  };

  // ---- Remove single chantier from zone ----
  const handleRemoveChantier = (zcId: string) => {
    showConfirm(
      t.team.zones.removeChantier ?? 'Retirer le chantier',
      t.team.zones.confirmRemoveChantier ?? 'Retirer ce chantier de la zone ?',
      async () => {
        const { error } = await supabase
          .from('zones_chantiers')
          .delete()
          .eq('id', zcId);
        if (error) {
          setErrorMessage(error.message);
        } else if (selectedZone) {
          await refreshSelectedZone(selectedZone.id);
        }
      }
    );
  };

  // ---- Remove single ouvrier from zone ----
  const handleRemoveOuvrier = (zoId: string) => {
    showConfirm(
      t.team.zones.removeOuvrier ?? 'Retirer le collaborateur',
      t.team.zones.confirmRemoveOuvrier ?? 'Retirer ce collaborateur de la zone ?',
      async () => {
        const today = new Date().toISOString().split('T')[0];
        const { error } = await supabase
          .from('zones_ouvriers')
          .update({ date_fin: today })
          .eq('id', zoId)
          .is('date_fin', null);
        if (error) {
          setErrorMessage(error.message);
        } else if (selectedZone) {
          await refreshSelectedZone(selectedZone.id);
        }
      }
    );
  };

  // ---- Edit chantiers ----
  const openAddChantiers = (zone: Zone) => {
    const existing = new Set(zone.chantiers.map((c) => c.chantier_id));
    setSelectedChantierIds(existing);
    setScreen('add-chantiers');
  };

  const toggleChantier = (id: string) => {
    setSelectedChantierIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveChantiers = async () => {
    if (!selectedZone) return;
    try {
      setSavingChantiers(true);
      const existing = new Set(selectedZone.chantiers.map((c) => c.chantier_id));

      const toAdd = [...selectedChantierIds].filter((id) => !existing.has(id));
      const toRemove = [...existing].filter((id) => !selectedChantierIds.has(id));

      if (toAdd.length > 0) {
        const { error } = await supabase.from('zones_chantiers').insert(
          toAdd.map((cid) => ({ zone_id: selectedZone.id, chantier_id: cid }))
        );
        if (error) throw error;
      }

      if (toRemove.length > 0) {
        const { error } = await supabase
          .from('zones_chantiers')
          .delete()
          .eq('zone_id', selectedZone.id)
          .in('chantier_id', toRemove);
        if (error) throw error;
      }

      await refreshSelectedZone(selectedZone.id);
      setScreen('zone-detail');
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSavingChantiers(false);
    }
  };

  // ---- Add workers modal ----
  const loadOuvriers = useCallback(async (search: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'ouvrier')
      .or(`nom.ilike.%${search}%,prenom.ilike.%${search}%`);
    if (!error) setAllOuvriers(data || []);
  }, []);

  const openAddWorkerModal = async () => {
    setWorkerSearch('');
    setSelectedWorkerId(null);
    await loadOuvriers('');
    setAddWorkerModalVisible(true);
  };

  const handleConfirmAddWorker = async () => {
    if (!selectedZone || !selectedWorkerId) return;
    try {
      setAddingWorker(true);
      const { error } = await supabase
        .from('zones_ouvriers')
        .insert({ zone_id: selectedZone.id, user_id: selectedWorkerId });
      if (error) throw error;
      await refreshSelectedZone(selectedZone.id);
      setAddWorkerModalVisible(false);
      setSelectedWorkerId(null);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setAddingWorker(false);
    }
  };

  const renderConfirmModal = () => (
    <>
      <Modal
        visible={confirmDialog !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setConfirmDialog(null)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>{confirmDialog?.title}</Text>
            <Text style={styles.confirmMessage}>{confirmDialog?.message}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmDialog(null)}>
                <Text style={styles.confirmCancelText}>{t.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={() => {
                  const fn = confirmDialog?.onConfirm;
                  setConfirmDialog(null);
                  fn?.();
                }}>
                <Text style={styles.confirmDeleteText}>{t.team.zones.delete ?? 'Supprimer'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={errorMessage !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setErrorMessage(null)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>{t.common.error}</Text>
            <Text style={styles.confirmMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.confirmDeleteBtn, { flex: 0, alignSelf: 'flex-end' }]}
              onPress={() => setErrorMessage(null)}>
              <Text style={styles.confirmDeleteText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // ---- Zone list ----
  if (screen === 'list') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <Text style={styles.headerTitle}>{t.team.zones.title}</Text>
          <Text style={styles.headerSub}>
            {zones.length} {zones.length > 1 ? t.team.zones.zonesPlural : t.team.zones.zone}
          </Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentPad, { paddingBottom: scrollBottomPadding }]}
        >
          <TouchableOpacity style={styles.createBtn} onPress={openCreateModal}>
            <Plus size={22} color="#FFF" />
            <Text style={styles.createBtnText}>{t.team.zones.createZone}</Text>
          </TouchableOpacity>

          {zones.length === 0 ? (
            <View style={styles.emptyState}>
              <MapPin size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>{t.team.zones.noZones}</Text>
              <Text style={styles.emptySub}>{t.team.zones.noZonesHelp}</Text>
            </View>
          ) : (
            zones.map((zone) => (
              <TouchableOpacity
                key={zone.id}
                style={styles.zoneCard}
                onPress={() => {
                  setSelectedZone(zone);
                  setScreen('zone-detail');
                }}>
                <View style={styles.zoneCardLeft}>
                  <View style={styles.zoneIcon}>
                    <MapPin size={20} color="#FF6B35" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.zoneName}>{zone.nom}</Text>
                    {zone.description ? (
                      <Text style={styles.zoneDesc} numberOfLines={1}>
                        {zone.description}
                      </Text>
                    ) : null}
                    <View style={styles.zoneMeta}>
                      <View style={styles.zoneMetaItem}>
                        <MapPin size={12} color="#94A3B8" />
                        <Text style={styles.zoneMetaText}>
                          {zone.chantiers.length} {t.team.zones.worksites}
                        </Text>
                      </View>
                      <View style={styles.zoneMetaItem}>
                        <Users size={12} color="#94A3B8" />
                        <Text style={styles.zoneMetaText}>
                          {zone.ouvriers.length} {t.team.zones.workers}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color="#CBD5E1" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {renderConfirmModal()}

        {/* Create Zone Modal */}
        <Modal
          visible={createModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setCreateModalVisible(false)}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t.team.zones.createZone}</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setCreateModalVisible(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Name */}
                <Text style={styles.fieldLabel}>{t.team.zones.zoneName}</Text>
                <TextInput
                  style={styles.textInput}
                  value={newZoneName}
                  onChangeText={setNewZoneName}
                  placeholder={t.team.zones.zoneNamePlaceholder}
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />

                {/* Description */}
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>{t.team.zones.zoneDesc}</Text>
                <TextInput
                  style={[styles.textInput, { height: 72, textAlignVertical: 'top' }]}
                  value={newZoneDesc}
                  onChangeText={setNewZoneDesc}
                  placeholder={t.team.zones.zoneDescPlaceholder}
                  placeholderTextColor="#94A3B8"
                  multiline
                />

                {/* Worksite selection */}
                <View style={styles.modalSectionHeader}>
                  <MapPin size={16} color="#FF6B35" />
                  <Text style={styles.modalSectionTitle}>{t.team.zones.worksitesSection}</Text>
                  {newZoneChantierIds.size > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{newZoneChantierIds.size}</Text>
                    </View>
                  )}
                </View>

                {assignedWorksites.length === 0 ? (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptySectionText}>{t.team.zones.noAvailableWorksites}</Text>
                  </View>
                ) : (
                  assignedWorksites.map((aff) => {
                    const cid = aff.chantier_id;
                    const sel = newZoneChantierIds.has(cid);
                    return (
                      <TouchableOpacity
                        key={cid}
                        style={[styles.selectableItem, sel && styles.selectableItemActive]}
                        onPress={() => toggleNewChantier(cid)}>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.selectableItemName,
                              sel && styles.selectableItemNameActive,
                            ]}>
                            {aff.chantiers?.nom}
                          </Text>
                          <Text style={styles.selectableItemSub}>{aff.chantiers?.code}</Text>
                        </View>
                        {sel ? (
                          <CheckCircle2 size={22} color="#FF6B35" />
                        ) : (
                          <Circle size={22} color="#CBD5E1" />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    (!newZoneName.trim() || creating) && styles.saveBtnDisabled,
                  ]}
                  onPress={handleCreateZone}
                  disabled={!newZoneName.trim() || creating}>
                  {creating ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>{t.team.zones.saveZone}</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  // ---- Zone detail ----
  if (screen === 'zone-detail' && selectedZone) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('list')}>
            <ArrowLeft size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{selectedZone.nom}</Text>
            {selectedZone.description ? (
              <Text style={styles.headerSub} numberOfLines={1}>
                {selectedZone.description}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.deleteZoneBtn}
            onPress={() => handleDeleteZone(selectedZone)}>
            <Trash2 size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentPad, { paddingBottom: scrollBottomPadding }]}
        >
          {/* Worksites section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MapPin size={18} color="#FF6B35" />
              <Text style={styles.sectionTitle}>{t.team.zones.worksitesSection}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{selectedZone.chantiers.length}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.sectionAddBtn}
              onPress={() => openAddChantiers(selectedZone)}>
              <Plus size={16} color="#FF6B35" />
              <Text style={styles.sectionAddText}>{t.team.zones.editWorksites}</Text>
            </TouchableOpacity>
          </View>

          {selectedZone.chantiers.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>{t.team.zones.noWorksitesInZone}</Text>
            </View>
          ) : (
            selectedZone.chantiers.map((zc) => (
              <View key={zc.id} style={styles.itemCard}>
                <View style={styles.itemDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{zc.chantiers.nom}</Text>
                  <Text style={styles.itemSub}>{zc.chantiers.code}</Text>
                </View>
                <TouchableOpacity
                  style={styles.itemDeleteBtn}
                  onPress={() => handleRemoveChantier(zc.id)}>
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Workers section */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <View style={styles.sectionTitleRow}>
              <Users size={18} color="#0EA5E9" />
              <Text style={styles.sectionTitle}>{t.team.zones.workersSection}</Text>
              <View style={[styles.badge, { backgroundColor: '#E0F2FE' }]}>
                <Text style={[styles.badgeText, { color: '#0284C7' }]}>
                  {selectedZone.ouvriers.length}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.sectionAddBtn}
              onPress={openAddWorkerModal}>
              <UserPlus size={16} color="#0EA5E9" />
              <Text style={[styles.sectionAddText, { color: '#0EA5E9' }]}>
                {t.team.zones.addWorker}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedZone.ouvriers.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>{t.team.zones.noWorkersInZone}</Text>
            </View>
          ) : (
            selectedZone.ouvriers.map((zo) => (
              <View key={zo.id} style={styles.itemCard}>
                <View style={[styles.itemDot, { backgroundColor: '#0EA5E9' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>
                    {zo.profiles.prenom} {zo.profiles.nom}
                  </Text>
                  <Text style={styles.itemSub}>#{zo.profiles.matricule}</Text>
                </View>
                <TouchableOpacity
                  style={styles.itemDeleteBtn}
                  onPress={() => handleRemoveOuvrier(zo.id)}>
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {renderConfirmModal()}

        {/* Add Worker Modal */}
        <Modal
          visible={addWorkerModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setAddWorkerModalVisible(false)}>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t.team.zones.addWorkerModal}</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setAddWorkerModalVisible(false)}>
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalSearchBar}>
                <Search size={18} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  value={workerSearch}
                  onChangeText={(v) => {
                    setWorkerSearch(v);
                    loadOuvriers(v);
                  }}
                  placeholder={t.team.zones.searchWorkers}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <FlatList
                data={allOuvriers.filter((w) => {
                  const alreadyIn = selectedZone?.ouvriers.some((o) => o.user_id === w.id);
                  return !alreadyIn;
                })}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 340 }}
                contentContainerStyle={{ paddingBottom: 4 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.emptySection}>
                    <Text style={styles.emptySectionText}>{t.team.zones.noWorkersFound}</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isSelected = selectedWorkerId === item.id;
                  return (
                    <TouchableOpacity
                      style={[styles.workerPickerItem, isSelected && styles.workerPickerItemSelected]}
                      onPress={() => setSelectedWorkerId(isSelected ? null : item.id)}>
                      <View style={[styles.workerPickerAvatar, isSelected && styles.workerPickerAvatarSelected]}>
                        <Text style={[styles.workerPickerInitials, isSelected && styles.workerPickerInitialsSelected]}>
                          {item.prenom?.[0]?.toUpperCase()}{item.nom?.[0]?.toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.workerPickerName, isSelected && styles.workerPickerNameSelected]}>
                          {item.prenom} {item.nom}
                        </Text>
                        <Text style={styles.workerPickerSub}>#{item.matricule}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />

              <TouchableOpacity
                style={[styles.saveBtn, (!selectedWorkerId || addingWorker) && styles.saveBtnDisabled]}
                onPress={handleConfirmAddWorker}
                disabled={!selectedWorkerId || addingWorker}>
                {addingWorker ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{t.team.zones.addWorker ?? 'Ajouter'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  // ---- Edit chantiers ----
  if (screen === 'add-chantiers' && selectedZone) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setScreen('zone-detail')}>
            <ArrowLeft size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.team.zones.selectWorksites}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentPad, { paddingBottom: scrollBottomPadding }]}
        >
          {assignedWorksites.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t.team.zones.noAvailableWorksites}</Text>
            </View>
          ) : (
            assignedWorksites.map((aff) => {
              const cid = aff.chantier_id;
              const selected = selectedChantierIds.has(cid);
              return (
                <TouchableOpacity
                  key={cid}
                  style={[styles.selectableItem, selected && styles.selectableItemActive]}
                  onPress={() => toggleChantier(cid)}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.selectableItemName,
                        selected && styles.selectableItemNameActive,
                      ]}>
                      {aff.chantiers?.nom}
                    </Text>
                    <Text style={styles.selectableItemSub}>{aff.chantiers?.code}</Text>
                  </View>
                  {selected ? (
                    <CheckCircle2 size={22} color="#FF6B35" />
                  ) : (
                    <Circle size={22} color="#CBD5E1" />
                  )}
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            style={[styles.saveBtn, savingChantiers && styles.saveBtnDisabled]}
            onPress={saveChantiers}
            disabled={savingChantiers}>
            {savingChantiers ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{t.team.zones.saveSelection}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        {renderConfirmModal()}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#FF6B35',
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#FFF', flex: 1 },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteZoneBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  contentPad: { padding: 16, paddingBottom: 40 },

  createBtn: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
  },
  createBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingTop: 64, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748B', textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#94A3B8', textAlign: 'center', maxWidth: 260 },

  zoneCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  zoneCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  zoneIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneName: { fontSize: 17, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  zoneDesc: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  zoneMeta: { flexDirection: 'row', gap: 12 },
  zoneMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  zoneMetaText: { fontSize: 12, color: '#94A3B8' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    maxHeight: '88%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 10,
  },
  modalSectionTitle: { fontSize: 15, fontWeight: '700', color: '#1E293B', flex: 1 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  textInput: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  saveBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  badge: {
    backgroundColor: '#FFF3EF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#FF6B35' },
  sectionAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionAddText: { fontSize: 14, fontWeight: '600', color: '#FF6B35' },

  emptySection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptySectionText: { fontSize: 14, color: '#94A3B8' },

  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  itemDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF6B35' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  itemSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  itemDeleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 16, color: '#1E293B' },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalLoadingRow: { paddingVertical: 32, alignItems: 'center' },
  workerPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  workerPickerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerPickerInitials: { fontSize: 15, fontWeight: '700', color: '#0284C7' },
  workerPickerItemSelected: {
    backgroundColor: '#EFF6FF',
    borderBottomColor: '#DBEAFE',
  },
  workerPickerAvatarSelected: { backgroundColor: '#0EA5E9' },
  workerPickerInitialsSelected: { color: '#FFF' },
  workerPickerName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  workerPickerNameSelected: { color: '#0284C7' },
  workerPickerSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: { borderColor: '#0EA5E9', backgroundColor: '#EFF6FF' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0EA5E9' },

  selectableItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  selectableItemActive: { borderColor: '#FF6B35', backgroundColor: '#FFF8F5' },
  selectableItemName: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  selectableItemNameActive: { color: '#FF6B35' },
  selectableItemSub: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  confirmMessage: { fontSize: 15, color: '#64748B', lineHeight: 22, marginBottom: 24 },
  confirmActions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  confirmCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  confirmCancelText: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  confirmDeleteBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
  confirmDeleteText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
