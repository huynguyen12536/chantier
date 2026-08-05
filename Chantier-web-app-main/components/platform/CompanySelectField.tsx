import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  Platform,
  ScrollView,
} from 'react-native';
import { Building2, Check, ChevronDown, X } from 'lucide-react-native';
import { Company } from '@/types';
import { Colors } from '@/constants/colors';
import { BottomSheetOverlay, DraggableBottomSheet } from '@/components/common/DraggableSheetHandle';

type CompanySelectFieldProps = {
  value: string;
  onChange: (companyId: string) => void;
  companies: Company[];
  placeholder: string;
  sheetTitle: string;
};

type CompanyOptionRowProps = {
  company: Company;
  selected: boolean;
  onPress: () => void;
  variant?: 'menu' | 'sheet';
};

const ORANGE_BORDER = 'rgba(255, 107, 53, 0.35)';
const ORANGE_DIVIDER = 'rgba(255, 107, 53, 0.12)';
const ORANGE_HOVER = 'rgba(255, 107, 53, 0.05)';
const ORANGE_SELECTED = 'rgba(255, 107, 53, 0.08)';

const webNoOutline = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as const) : {};

function CompanyTriggerContent({
  company,
  placeholder,
}: {
  company?: Company;
  placeholder: string;
}) {
  if (!company) {
    return (
      <Text style={styles.triggerPlaceholder} numberOfLines={1}>
        {placeholder}
      </Text>
    );
  }

  return (
    <View style={styles.triggerContent}>
      <View style={styles.triggerIconWrap}>
        <Building2 size={16} color={Colors.primary} strokeWidth={2.2} />
      </View>
      <View style={styles.triggerTextGroup}>
        <Text style={styles.triggerName} numberOfLines={1}>
          {company.name}
        </Text>
        {company.slug ? (
          <Text style={styles.triggerSlug} numberOfLines={1}>
            {company.slug}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function CompanyOptionRow({ company, selected, onPress, variant = 'menu' }: CompanyOptionRowProps) {
  const isSheet = variant === 'sheet';

  return (
    <Pressable
      style={({ hovered, pressed }) => [
        isSheet ? styles.sheetOptionRow : styles.optionRow,
        !isSheet && hovered && styles.optionRowHovered,
        selected && (isSheet ? styles.sheetOptionRowSelected : styles.optionRowSelected),
        pressed && styles.optionRowPressed,
        webNoOutline,
      ]}
      onPress={onPress}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.optionIconWrap, selected && styles.optionIconWrapSelected]}>
          <Building2
            size={15}
            color={selected ? Colors.primary : Colors.text.secondary}
            strokeWidth={2.2}
          />
        </View>
        <View style={styles.optionTextGroup}>
          <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]} numberOfLines={1}>
            {company.name}
          </Text>
          {company.slug ? (
            <Text style={styles.optionSlug} numberOfLines={1}>
              {company.slug}
            </Text>
          ) : null}
        </View>
      </View>
      {selected ? <Check size={16} color={Colors.primary} strokeWidth={2.8} /> : null}
    </Pressable>
  );
}

export function CompanySelectField({
  value,
  onChange,
  companies,
  placeholder,
  sheetTitle,
}: CompanySelectFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<View>(null);
  const selected = companies.find((c) => c.id === value);

  const close = useCallback(() => setOpen(false), []);

  const select = useCallback(
    (companyId: string) => {
      onChange(companyId);
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
      <Pressable
        style={({ hovered, pressed }) => [
          styles.trigger,
          open && styles.triggerOpen,
          hovered && !open && styles.triggerHovered,
          pressed && styles.triggerPressed,
          webNoOutline,
        ]}
        onPress={() => {
          if (isWeb) {
            setOpen((prev) => !prev);
          } else {
            setOpen(true);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={selected ? selected.name : placeholder}
      >
        <View style={styles.triggerInner}>
          <CompanyTriggerContent company={selected} placeholder={placeholder} />
        </View>
        <ChevronDown
          size={18}
          color={open ? Colors.primary : Colors.text.secondary}
          strokeWidth={2.4}
          style={open ? styles.chevronOpen : undefined}
        />
      </Pressable>

      {open && isWeb ? (
        <View style={styles.menu}>
          <ScrollView
            style={styles.menuScroll}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
          >
            {companies.map((company, index) => (
              <View key={company.id}>
                {index > 0 ? <View style={styles.menuDivider} /> : null}
                <CompanyOptionRow
                  company={company}
                  selected={value === company.id}
                  onPress={() => select(company.id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {!isWeb ? (
        <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
          <BottomSheetOverlay style={styles.sheetOverlay} onDismiss={close}>
            <DraggableBottomSheet visible={open} initial={0.5} onDismiss={close} style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{sheetTitle}</Text>
                <TouchableOpacity style={styles.sheetCloseBtn} onPress={close}>
                  <X size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.sheetScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.sheetOptions}>
                  {companies.map((company) => (
                    <CompanyOptionRow
                      key={company.id}
                      company={company}
                      selected={value === company.id}
                      onPress={() => select(company.id)}
                      variant="sheet"
                    />
                  ))}
                </View>
              </ScrollView>
            </DraggableBottomSheet>
          </BottomSheetOverlay>
        </Modal>
      ) : null}
    </View>
  );
}

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
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  triggerOpen: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF3EC',
  },
  triggerHovered: {
    borderColor: 'rgba(255, 107, 53, 0.55)',
    backgroundColor: '#FFF3EC',
  },
  triggerPressed: {
    opacity: 0.92,
  },
  triggerInner: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  triggerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  triggerTextGroup: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  triggerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  triggerSlug: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  triggerPlaceholder: {
    fontSize: 15,
    color: Colors.text.disabled,
    fontWeight: '500',
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.18)',
    overflow: 'hidden',
    zIndex: 10,
    maxHeight: 240,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(255, 107, 53, 0.08)',
        }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 8,
        }),
  },
  menuScroll: {
    maxHeight: 240,
    ...(Platform.OS === 'web' ? { overflowY: 'auto' as const } : {}),
  },
  menuDivider: {
    height: 1,
    backgroundColor: ORANGE_DIVIDER,
    marginHorizontal: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
  },
  optionRowHovered: {
    backgroundColor: ORANGE_HOVER,
  },
  optionRowSelected: {
    backgroundColor: ORANGE_SELECTED,
  },
  optionRowPressed: {
    opacity: 0.88,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
    minWidth: 0,
  },
  optionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  optionIconWrapSelected: {
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
  },
  optionTextGroup: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
  optionSlug: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
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
    maxHeight: '72%',
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
  sheetScroll: {
    flexGrow: 0,
  },
  sheetOptions: {
    gap: 8,
    paddingTop: 4,
    paddingBottom: 8,
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
    backgroundColor: ORANGE_SELECTED,
  },
});
