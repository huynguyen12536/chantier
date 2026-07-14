import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants';
import { clampTimeToRange, composeTime, parseTimeValue, timeToMinutes } from '@/utils/time';

const ALL_HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const ALL_MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 3;

interface TimePickerModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  value: string;
  /** Only for end time: cannot pick before this (inclusive). */
  minTime?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}

function isTimeInRange(time: string, minTime?: string): boolean {
  if (!minTime) return true;
  return timeToMinutes(time) >= timeToMinutes(minTime);
}

function buildValidHours(minTime?: string): string[] {
  if (!minTime) return ALL_HOURS;
  return ALL_HOURS.filter((hour) =>
    ALL_MINUTES.some((minute) => isTimeInRange(composeTime(hour, minute), minTime)),
  );
}

function buildValidMinutes(hour: string, minTime?: string): string[] {
  if (!minTime) return ALL_MINUTES;
  return ALL_MINUTES.filter((minute) => isTimeInRange(composeTime(hour, minute), minTime));
}

export function TimePickerModal({
  visible,
  title,
  value,
  minTime,
  confirmLabel = 'Valider',
  cancelLabel = 'Annuler',
  onClose,
  onConfirm,
}: TimePickerModalProps) {
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const hourRef = useRef('07');
  const minuteRef = useRef('30');
  const wasVisibleRef = useRef(false);
  const [hour, setHour] = useState('07');
  const [minute, setMinute] = useState('30');

  const hasMinBound = Boolean(minTime);
  const validHours = useMemo(() => buildValidHours(minTime), [minTime]);
  const validMinutes = useMemo(
    () => buildValidMinutes(hour, minTime),
    [hour, minTime],
  );

  hourRef.current = hour;
  minuteRef.current = minute;

  const hourItems = hasMinBound ? validHours : ALL_HOURS;
  const minuteItems = hasMinBound ? validMinutes : ALL_MINUTES;

  const scrollToItem = useCallback(
    (scrollRef: RefObject<ScrollView | null>, items: string[], item: string, animated = false) => {
      const index = items.indexOf(item);
      if (index < 0) return;
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated });
      });
    },
    [],
  );

  const clampParts = useCallback(
    (nextHour: string, nextMinute: string) => {
      if (!hasMinBound) {
        return { hour: nextHour, minute: nextMinute };
      }
      const hours = buildValidHours(minTime);
      let resolvedHour = hours.includes(nextHour) ? nextHour : (hours[0] ?? nextHour);
      const minutes = buildValidMinutes(resolvedHour, minTime);
      let resolvedMinute = minutes.includes(nextMinute) ? nextMinute : (minutes[0] ?? nextMinute);
      const clamped = clampTimeToRange(composeTime(resolvedHour, resolvedMinute), { minTime });
      const parsed = parseTimeValue(clamped);
      resolvedHour = hours.includes(parsed.hour) ? parsed.hour : (hours[0] ?? parsed.hour);
      const finalMinutes = buildValidMinutes(resolvedHour, minTime);
      resolvedMinute = finalMinutes.includes(parsed.minute) ? parsed.minute : (finalMinutes[0] ?? parsed.minute);
      return { hour: resolvedHour, minute: resolvedMinute };
    },
    [hasMinBound, minTime],
  );

  const applyParts = useCallback(
    (nextHour: string, nextMinute: string, scrollHour = false, scrollMinute = false) => {
      const resolved = clampParts(nextHour, nextMinute);
      setHour(resolved.hour);
      setMinute(resolved.minute);
      if (scrollHour) scrollToItem(hourScrollRef, hourItems, resolved.hour);
      if (scrollMinute) {
        const minutes = hasMinBound ? buildValidMinutes(resolved.hour, minTime) : ALL_MINUTES;
        scrollToItem(minuteScrollRef, minutes, resolved.minute);
      }
    },
    [clampParts, hasMinBound, hourItems, minTime, scrollToItem],
  );

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false;
      return;
    }
    if (wasVisibleRef.current) return;
    wasVisibleRef.current = true;

    const initial = hasMinBound ? clampTimeToRange(value, { minTime }) : value;
    const parsed = parseTimeValue(initial);
    setHour(parsed.hour);
    setMinute(parsed.minute);
    scrollToItem(hourScrollRef, hourItems, parsed.hour, false);
    const minutes = hasMinBound ? buildValidMinutes(parsed.hour, minTime) : ALL_MINUTES;
    scrollToItem(minuteScrollRef, minutes, parsed.minute, false);
  }, [visible, value, minTime, hasMinBound, hourItems, scrollToItem]);

  const selectFromOffset = (
    offsetY: number,
    items: string[],
    siblingField: 'hour' | 'minute',
  ) => {
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const item = items[Math.min(items.length - 1, Math.max(0, index))];
    if (siblingField === 'hour') {
      applyParts(item, minuteRef.current, false, hasMinBound);
      return;
    }
    applyParts(hourRef.current, item);
  };

  const renderColumn = (
    items: string[],
    selected: string,
    siblingField: 'hour' | 'minute',
    scrollRef: RefObject<ScrollView | null>,
  ) => (
    <View style={styles.columnWrap}>
      <View style={styles.columnHighlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={styles.columnContent}
        onScroll={(event) => selectFromOffset(event.nativeEvent.contentOffset.y, items, siblingField)}
        onScrollEndDrag={(event) => selectFromOffset(event.nativeEvent.contentOffset.y, items, siblingField)}
        onMomentumScrollEnd={(event) => selectFromOffset(event.nativeEvent.contentOffset.y, items, siblingField)}
      >
        {items.map((item) => {
          const active = item === selected;
          return (
            <View key={item} style={styles.columnItem}>
              <Text style={[styles.columnItemText, active && styles.columnItemTextActive]}>
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  const handleConfirm = () => {
    const composed = composeTime(hourRef.current, minuteRef.current);
    const result = hasMinBound ? clampTimeToRange(composed, { minTime }) : composed;
    onConfirm(result);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.pickerColumns}>
            {renderColumn(hourItems, hour, 'hour', hourScrollRef)}
            <Text style={styles.separator}>:</Text>
            {renderColumn(minuteItems, minute, 'minute', minuteScrollRef)}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelButtonText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 20, 8, 0.4)',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: '#7A3B22',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  pickerColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  columnWrap: {
    width: 72,
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    position: 'relative',
    overflow: 'hidden',
  },
  columnHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.22)',
    zIndex: 1,
  },
  columnContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  columnItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnItemText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.disabled,
  },
  columnItemTextActive: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  separator: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginHorizontal: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
});
