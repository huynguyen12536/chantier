import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  type ViewStyle,
} from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { desktopTheme } from './glassStyles';

export type DesktopSelectOption<T extends string> = {
  value: T;
  label: string;
  badge?: number;
  Icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
};

export type DesktopSelectProps<T extends string> = {
  value: T;
  options: DesktopSelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  style?: ViewStyle;
  minWidth?: number;
};

export function DesktopSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder = 'Select',
  style,
  minWidth = 220,
}: DesktopSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<View>(null);
  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const onDocMouseDown = (event: MouseEvent) => {
      const node = rootRef.current as unknown as { contains?: (n: Node) => boolean } | null;
      const target = event.target as Node | null;
      if (node?.contains && target && !node.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  return (
    <View ref={rootRef} style={[styles.root, { minWidth }, style]} collapsable={false}>
      <TouchableOpacity
        style={[styles.trigger, open && styles.triggerOpen]}
        onPress={() => setOpen((prev) => !prev)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <View style={styles.triggerLeft}>
          {selected?.Icon ? (
            <selected.Icon size={16} color="#9A3412" strokeWidth={2.3} />
          ) : null}
          <Text style={styles.triggerLabel} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
          {typeof selected?.badge === 'number' ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{selected.badge}</Text>
            </View>
          ) : null}
        </View>
        <ChevronDown
          size={16}
          color="#9A3412"
          strokeWidth={2.4}
          style={open ? styles.chevronOpen : undefined}
        />
      </TouchableOpacity>

      {open ? (
        <View style={styles.menu}>
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.option, isActive && styles.optionActive]}
                onPress={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <View style={styles.optionLeft}>
                  {opt.Icon ? (
                    <opt.Icon
                      size={16}
                      color={isActive ? '#9A3412' : desktopTheme.textSecondary}
                      strokeWidth={2.3}
                    />
                  ) : null}
                  <Text
                    style={[styles.optionLabel, isActive && styles.optionLabelActive]}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                  {typeof opt.badge === 'number' ? (
                    <View style={[styles.badge, !isActive && styles.badgeMuted]}>
                      <Text style={styles.badgeText}>{opt.badge}</Text>
                    </View>
                  ) : null}
                </View>
                {isActive ? <Check size={16} color={Colors.primary} strokeWidth={2.6} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    zIndex: 50,
    flexShrink: 0,
  },
  trigger: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFD5C4',
    backgroundColor: '#FFF0EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  triggerOpen: {
    borderColor: Colors.primary,
    zIndex: 51,
  },
  triggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  triggerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9A3412',
    flexShrink: 1,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  menu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: desktopTheme.cardBorder,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 24,
    zIndex: 100,
  },
  option: {
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionActive: {
    backgroundColor: '#FFF7F2',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: desktopTheme.ink,
    flexShrink: 1,
  },
  optionLabelActive: {
    color: '#9A3412',
    fontWeight: '700',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  badgeMuted: {
    backgroundColor: '#FDBA74',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
