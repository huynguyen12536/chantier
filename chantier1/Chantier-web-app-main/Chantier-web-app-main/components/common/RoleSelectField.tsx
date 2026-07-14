import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { UserRole } from '@/types';
import { Colors } from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { BottomSheetOverlay, DraggableBottomSheet } from './DraggableSheetHandle';

export type RoleOption = { value: UserRole; label: string };

type RoleSelectFieldProps = {
  value: UserRole;
  onChange: (role: UserRole) => void;
  options: RoleOption[];
};

export function roleColor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return Colors.error;
    case 'chef_equipe':
      return Colors.primary;
    case 'administratif':
      return Colors.info;
    default:
      return Colors.secondary;
  }
}

function RoleBadge({ label, role }: { label: string; role: UserRole }) {
  const color = roleColor(role);
  return (
    <View style={[styles.badge, { backgroundColor: `${color}26` }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

type RoleOptionRowProps = {
  option: RoleOption;
  selected: boolean;
  onPress: () => void;
  variant?: 'menu' | 'sheet';
};

function RoleOptionRow({ option, selected, onPress, variant = 'menu' }: RoleOptionRowProps) {
  const color = roleColor(option.value);
  return (
    <TouchableOpacity
      style={[
        variant === 'sheet' ? styles.sheetOptionRow : styles.optionRow,
        selected && (variant === 'sheet' ? styles.sheetOptionRowSelected : styles.optionRowSelected),
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.optionDot, { backgroundColor: color }]} />
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text>
      </View>
      {selected ? <Check size={16} color={Colors.primary} strokeWidth={2.8} /> : null}
    </TouchableOpacity>
  );
}

export function RoleSelectField({ value, onChange, options }: RoleSelectFieldProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<View>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  const close = useCallback(() => setOpen(false), []);

  const select = useCallback(
    (role: UserRole) => {
      onChange(role);
      close();
    },
    [onChange, close],
  );

  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const handlePointerDown = (event: MouseEvent) => {
      const node = containerRef.current as unknown as HTMLElement | null;
      if (node && !node.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, close]);

  const isWeb = Platform.OS === 'web';

  return (
    <View ref={containerRef} style={[styles.wrapper, open && isWeb && styles.wrapperOpen]}>
      <TouchableOpacity
        style={[styles.trigger, open && styles.triggerOpen]}
        onPress={() => {
          if (isWeb) {
            setOpen((prev) => !prev);
          } else {
            setOpen(true);
          }
        }}
        activeOpacity={0.85}
      >
        {selected ? <RoleBadge label={selected.label} role={selected.value} /> : null}
        <ChevronDown
          size={18}
          color={Colors.text.secondary}
          strokeWidth={2.4}
          style={open ? styles.chevronOpen : undefined}
        />
      </TouchableOpacity>

      {open && isWeb ? (
        <View style={styles.menu}>
          {options.map((option) => (
            <RoleOptionRow
              key={option.value}
              option={option}
              selected={value === option.value}
              onPress={() => select(option.value)}
            />
          ))}
        </View>
      ) : null}

      {!isWeb ? (
        <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
          <BottomSheetOverlay style={styles.sheetOverlay} onDismiss={close}>
            <DraggableBottomSheet visible={open} initial={0.42} onDismiss={close} style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{t.management.modals.fields.role}</Text>
                <TouchableOpacity style={styles.sheetCloseBtn} onPress={close}>
                  <X size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.sheetOptions}>
                {options.map((option) => (
                  <RoleOptionRow
                    key={option.value}
                    option={option}
                    selected={value === option.value}
                    onPress={() => select(option.value)}
                    variant="sheet"
                  />
                ))}
              </View>
            </DraggableBottomSheet>
          </BottomSheetOverlay>
        </Modal>
      ) : null}
    </View>
  );
}

const ORANGE_BORDER = 'rgba(255, 107, 53, 0.35)';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  wrapperOpen: {
    zIndex: 50,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ORANGE_BORDER,
    paddingHorizontal: 14,
    paddingVertical: 11,
    minHeight: 48,
  },
  triggerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    borderColor: Colors.primary,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFF7F2',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.primary,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    overflow: 'hidden',
    zIndex: 10,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 20px rgba(255, 107, 53, 0.14)' }
      : {
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.14,
          shadowRadius: 12,
          elevation: 6,
        }),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 107, 53, 0.12)',
  },
  optionRowSelected: {
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  optionLabelSelected: {
    fontWeight: '800',
    color: Colors.primary,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(80, 35, 10, 0.42)',
  },
  sheet: {
    backgroundColor: '#FFF7F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.16)',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8DD',
  },
  sheetOptions: {
    gap: 8,
    paddingTop: 4,
  },
  sheetOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 53, 0.18)',
  },
  sheetOptionRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 107, 53, 0.06)',
  },
});
