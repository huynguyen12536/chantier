import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Building2, Clock, MapPin, MessageSquare, X } from 'lucide-react-native';
import { Colors } from '@/constants';
import { BottomSheetOverlay, DraggableBottomSheet, ConfirmModal, TimePickerModal } from '@/components/common';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/services/supabase';
import { getMinEndTime, isEndAfterStart, toDbTimeString } from '@/utils/time';
import type { ChantierDiversStatut, ChantierSource } from '@/types';

export type CreatedChantierDivers = {
  id: string;
  code: string;
  nom: string;
  adresse: string;
  heure_debut: string;
  heure_fin: string;
  source: ChantierSource;
  divers_statut: ChantierDiversStatut;
  actif: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated: (chantier: CreatedChantierDivers) => void;
};

const DEFAULT_START = '07:30';
const DEFAULT_END = '16:30';

export function ChantierDiversFormModal({ visible, onClose, onCreated }: Props) {
  const { t } = useLanguage();
  const cd = t.chantierDivers;
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [motif, setMotif] = useState('');
  const [heureDebut, setHeureDebut] = useState(DEFAULT_START);
  const [heureFin, setHeureFin] = useState(DEFAULT_END);
  const [timeField, setTimeField] = useState<'heure_debut' | 'heure_fin' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicatePopup, setDuplicatePopup] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setNom('');
    setAdresse('');
    setMotif('');
    setHeureDebut(DEFAULT_START);
    setHeureFin(DEFAULT_END);
    setError(null);
    setSubmitting(false);
    setDuplicatePopup(null);
  }, [visible]);

  const resolveCreateErrorMessage = (e: unknown): string => {
    const raw =
      typeof e === 'object' && e !== null && 'message' in e
        ? String((e as { message: string }).message)
        : e instanceof Error
          ? e.message
          : '';
    const isDuplicatePending =
      raw.includes('deja en attente') || raw.includes('déjà en attente');
    if (isDuplicatePending) return cd.duplicateNomAdressePending;
    if (raw.includes('motif de la demande est obligatoire')) return cd.reasonRequired;
    if (raw.includes('Motif trop long')) return cd.reasonTooLong;
    if (raw.includes('nom et cette adresse')) return cd.duplicateNomAdresse;
    return raw || cd.createFailed;
  };

  const isDuplicateCreateError = (message: string): boolean =>
    message === cd.duplicateNomAdressePending || message === cd.duplicateNomAdresse;

  const handleSubmit = async () => {
    const trimmedNom = nom.trim();
    const trimmedAdresse = adresse.trim();
    if (!trimmedNom || !trimmedAdresse) {
      setError(t.management.errors.allFieldsRequired);
      return;
    }
    const trimmedMotif = motif.trim();
    if (!trimmedMotif) {
      setError(cd.reasonRequired);
      return;
    }
    if (trimmedMotif.length > 500) {
      setError(cd.reasonTooLong);
      return;
    }
    if (!isEndAfterStart(heureDebut, heureFin)) {
      setError(cd.invalidHours);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('create_chantier_divers', {
        p_nom: trimmedNom,
        p_adresse: trimmedAdresse,
        p_heure_debut: toDbTimeString(heureDebut),
        p_heure_fin: toDbTimeString(heureFin),
        p_motif: trimmedMotif,
      });
      if (rpcError) throw rpcError;
      if (!data || typeof data !== 'object') {
        throw new Error(cd.createFailed);
      }
      const row = data as Record<string, unknown>;
      onCreated({
        id: String(row.id),
        code: String(row.code),
        nom: String(row.nom),
        adresse: String(row.adresse),
        heure_debut: String(row.heure_debut),
        heure_fin: String(row.heure_fin),
        source: 'divers',
        divers_statut: (row.divers_statut as ChantierDiversStatut) ?? 'en_attente',
        actif: Boolean(row.actif),
      });
      onClose();
    } catch (e: unknown) {
      const message = resolveCreateErrorMessage(e);
      if (isDuplicateCreateError(message)) {
        setDuplicatePopup(message);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <BottomSheetOverlay style={styles.overlay} onDismiss={onClose}>
          <DraggableBottomSheet visible={visible} initial={0.88} onDismiss={onClose} style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>{cd.modalTitle}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.label}>
                <Building2 size={14} color={Colors.primary} /> {cd.nameLabel}
              </Text>
              <TextInput
                style={styles.input}
                value={nom}
                onChangeText={setNom}
                placeholder={cd.nameLabel}
                placeholderTextColor={Colors.text.disabled}
              />

              <Text style={styles.label}>
                <MapPin size={14} color={Colors.primary} /> {cd.addressLabel}
              </Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={adresse}
                onChangeText={setAdresse}
                placeholder={cd.addressLabel}
                placeholderTextColor={Colors.text.disabled}
                multiline
              />

              <Text style={styles.label}>
                <MessageSquare size={14} color={Colors.primary} /> {cd.reasonLabel}
              </Text>
              <TextInput
                style={[styles.input, styles.inputMultiline, styles.motifInput]}
                value={motif}
                onChangeText={setMotif}
                placeholder={cd.reasonPlaceholder}
                placeholderTextColor={Colors.text.disabled}
                multiline
                maxLength={500}
              />

              <Text style={styles.label}>
                <Clock size={14} color={Colors.primary} /> {cd.hoursLabel}
              </Text>
              <View style={styles.timeRow}>
                <TouchableOpacity
                  style={styles.timeChip}
                  onPress={() => setTimeField('heure_debut')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.timeChipLabel}>{cd.startLabel}</Text>
                  <Text style={styles.timeChipValue}>{heureDebut}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.timeChip}
                  onPress={() => setTimeField('heure_fin')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.timeChipLabel}>{cd.endLabel}</Text>
                  <Text style={styles.timeChipValue}>{heureFin}</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={() => void handleSubmit()}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{cd.submit}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </DraggableBottomSheet>
        </BottomSheetOverlay>
      </Modal>

      {timeField ? (
        <TimePickerModal
          key={`${timeField}-${timeField === 'heure_debut' ? heureDebut : heureFin}`}
          visible={!!timeField}
          title={timeField === 'heure_fin' ? cd.endLabel : cd.startLabel}
          value={timeField === 'heure_fin' ? heureFin : heureDebut}
          minTime={
            timeField === 'heure_fin' ? getMinEndTime(heureDebut) : undefined
          }
          confirmLabel={t.common.validate}
          cancelLabel={t.common.cancel}
          onClose={() => setTimeField(null)}
          onConfirm={(time) => {
            if (timeField === 'heure_debut') {
              setHeureDebut(time);
              if (!isEndAfterStart(time, heureFin)) {
                setHeureFin(getMinEndTime(time));
              }
            } else {
              const nextEnd = isEndAfterStart(heureDebut, time)
                ? time
                : getMinEndTime(heureDebut);
              setHeureFin(nextEnd);
            }
            setTimeField(null);
          }}
        />
      ) : null}

      <ConfirmModal
        visible={duplicatePopup !== null}
        title={t.common.error}
        message={duplicatePopup ?? ''}
        cancelLabel={t.common.cancel}
        confirmLabel={t.common.ok}
        onCancel={() => setDuplicatePopup(null)}
        onConfirm={() => setDuplicatePopup(null)}
        singleButton
        iconVariant="warning"
        confirmVariant="primary"
      />
    </>
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
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: '#FFE8DD',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text.secondary,
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFE0D2',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  motifInput: {
    minHeight: 96,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeChip: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFE0D2',
    padding: 14,
  },
  timeChipLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9A6A5B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  timeChipValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  errorText: {
    marginTop: 12,
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
