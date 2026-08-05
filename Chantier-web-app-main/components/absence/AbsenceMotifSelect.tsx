import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import type { AbsenceMotif } from '@/types';
import { getMotifLabel } from '@/utils/absenceFormat';

const MOTIFS: AbsenceMotif[] = ['personal', 'medical', 'vacation', 'other'];

type Props = {
  value: AbsenceMotif | null;
  onChange: (value: AbsenceMotif | null) => void;
};

export function AbsenceMotifSelect({ value, onChange }: Props) {
  const { t } = useLanguage();
  const a = t.absences;
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Text style={[styles.fieldText, !value && styles.placeholder]}>
          {value ? getMotifLabel(value, t) : a.selectMotif}
        </Text>
        <ChevronDown size={18} color={Colors.text.secondary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>{a.selectMotif}</Text>
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              <Text style={styles.optionText}>—</Text>
            </TouchableOpacity>
            {MOTIFS.map((motif) => (
              <TouchableOpacity
                key={motif}
                style={[styles.option, value === motif && styles.optionActive]}
                onPress={() => {
                  onChange(motif);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, value === motif && styles.optionTextActive]}>
                  {getMotifLabel(motif, t)}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F0E4DC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFF',
  },
  fieldText: {
    fontSize: 15,
    color: Colors.text.primary,
    flex: 1,
  },
  placeholder: {
    color: Colors.text.disabled,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0E4DC',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  optionActive: {
    backgroundColor: Colors.primary + '15',
  },
  optionText: {
    fontSize: 15,
    color: Colors.text.primary,
  },
  optionTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
