import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, Search, X } from 'lucide-react-native';
import { Colors } from '@/constants';
import { BottomSheetOverlay, DraggableBottomSheet } from './DraggableSheetHandle';

export interface WorksiteOption {
  id: string;
  nom: string;
  code: string;
}

export interface WorksiteZoneGroup {
  zoneId: string | null;
  zoneName: string;
  worksites: WorksiteOption[];
}

interface SelectWorksiteModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  selectedId?: string | null;
  onClose: () => void;
  onSelect: (worksite: WorksiteOption) => void;
  worksites?: WorksiteOption[];
  zoneGroups?: WorksiteZoneGroup[];
  emptyMessage?: string;
  searchPlaceholder?: string;
  noResultsMessage?: string;
  chantierDiversLabel?: string;
  onPressChantierDivers?: () => void;
}

function matchesWorksiteQuery(worksite: WorksiteOption, query: string): boolean {
  if (!query) return true;
  const haystack = `${worksite.nom} ${worksite.code}`.toLowerCase();
  return haystack.includes(query);
}

function WorksiteRow({
  worksite,
  isSelected,
  onSelect,
}: {
  worksite: WorksiteOption;
  isSelected: boolean;
  onSelect: (worksite: WorksiteOption) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.worksiteOption, isSelected && styles.worksiteOptionActive]}
      onPress={() => onSelect(worksite)}
      activeOpacity={0.8}
    >
      <View style={styles.worksiteOptionTextGroup}>
        <Text style={[styles.worksiteOptionText, isSelected && styles.worksiteOptionTextActive]}>
          {worksite.nom}
        </Text>
        <Text style={styles.worksiteOptionCode}>{worksite.code}</Text>
      </View>
      <View style={[styles.worksiteOptionCheck, isSelected && styles.worksiteOptionCheckActive]}>
        {isSelected && <Check size={16} color="#FFF" />}
      </View>
    </TouchableOpacity>
  );
}

export function SelectWorksiteModal({
  visible,
  title,
  subtitle,
  selectedId,
  onClose,
  onSelect,
  worksites,
  zoneGroups,
  emptyMessage = 'Aucun chantier disponible',
  searchPlaceholder = 'Rechercher un chantier...',
  noResultsMessage = 'Aucun chantier trouvé',
  chantierDiversLabel,
  onPressChantierDivers,
}: SelectWorksiteModalProps) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!visible) setSearch('');
  }, [visible]);

  const query = search.trim().toLowerCase();

  const filteredZoneGroups = useMemo(() => {
    if (!zoneGroups?.length) return [];
    if (!query) return zoneGroups;
    return zoneGroups
      .map((group) => ({
        ...group,
        worksites: group.worksites.filter((w) => matchesWorksiteQuery(w, query)),
      }))
      .filter((group) => group.worksites.length > 0);
  }, [zoneGroups, query]);

  const filteredWorksites = useMemo(() => {
    if (!worksites?.length) return [];
    if (!query) return worksites;
    return worksites.filter((w) => matchesWorksiteQuery(w, query));
  }, [worksites, query]);

  const hasZoneGroups = filteredZoneGroups.length > 0;
  const hasWorksites = filteredWorksites.length > 0;
  const sourceEmpty = !zoneGroups?.length && !worksites?.length;
  const filterEmpty = !sourceEmpty && !hasZoneGroups && !hasWorksites;
  const isEmpty = sourceEmpty || filterEmpty;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <BottomSheetOverlay style={styles.overlay} onDismiss={onClose}>
        <DraggableBottomSheet visible={visible} initial={0.8} onDismiss={onClose} style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {!sourceEmpty ? (
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Search size={16} color={Colors.text.secondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={Colors.text.disabled}
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="never"
                />
                {search.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={16} color={Colors.text.secondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ) : null}

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {isEmpty ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {filterEmpty ? noResultsMessage : emptyMessage}
                </Text>
              </View>
            ) : hasZoneGroups ? (
              filteredZoneGroups.map((group) => (
                <View key={group.zoneId ?? '__direct__'}>
                  <View style={styles.zoneGroupHeader}>
                    <Text style={styles.zoneGroupName}>{group.zoneName}</Text>
                    <Text style={styles.zoneGroupCount}>{group.worksites.length}</Text>
                  </View>
                  {group.worksites.map((worksite) => (
                    <WorksiteRow
                      key={worksite.id}
                      worksite={worksite}
                      isSelected={selectedId === worksite.id}
                      onSelect={onSelect}
                    />
                  ))}
                </View>
              ))
            ) : (
              filteredWorksites.map((worksite) => (
                <WorksiteRow
                  key={worksite.id}
                  worksite={worksite}
                  isSelected={selectedId === worksite.id}
                  onSelect={onSelect}
                />
              ))
            )}
          </ScrollView>
          {onPressChantierDivers && chantierDiversLabel ? (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.diversButton}
                onPress={onPressChantierDivers}
                activeOpacity={0.85}
              >
                <Text style={styles.diversButtonText}>{chantierDiversLabel}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </DraggableBottomSheet>
      </BottomSheetOverlay>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  sheet: {
    backgroundColor: '#FFF7F2',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.16)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0D2',
  },
  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#9A6A5B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#FFE8DD',
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFE0D2',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
    padding: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 28,
  },
  worksiteOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#FFE8DD',
    shadowColor: '#7A3B22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  worksiteOptionActive: {
    backgroundColor: '#FFF3EF',
    borderColor: Colors.primary,
  },
  worksiteOptionTextGroup: {
    flex: 1,
    gap: 4,
  },
  worksiteOptionText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  worksiteOptionTextActive: {
    color: Colors.primary,
  },
  worksiteOptionCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A6A5B',
  },
  worksiteOptionCheck: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFD1C0',
    backgroundColor: '#FFF7F2',
  },
  worksiteOptionCheckActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  zoneGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: '#FFF0EA',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 53, 0.15)',
  },
  zoneGroupName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  zoneGroupCount: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 107, 53, 0.6)',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.disabled,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#FFE0D2',
    alignItems: 'center',
  },
  diversButton: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 999,
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  diversButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.15,
  },
});
