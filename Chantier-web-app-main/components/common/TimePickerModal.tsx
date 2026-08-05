import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Colors } from '@/constants';
import { clampTimeToRange, composeTime, parseTimeValue, timeToMinutes } from '@/utils/time';

const ALL_HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
/** Shift declaration uses 15-minute steps only (no odd minutes). */
const MINUTE_STEP = 15;
const ALL_MINUTES = Array.from({ length: 60 / MINUTE_STEP }, (_, index) =>
  String(index * MINUTE_STEP).padStart(2, '0'),
);
const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 3;
/** One wheel notch = one step; debounce avoids multi-step jumps on web. */
const WHEEL_STEP_COOLDOWN_MS = 160;

function indexFromOffset(offsetY: number): number {
  return Math.round(offsetY / ITEM_HEIGHT);
}

function clampIndex(index: number, length: number): number {
  return Math.min(length - 1, Math.max(0, index));
}

interface PickerColumnProps {
  items: string[];
  selected: string;
  scrollRef: RefObject<ScrollView | null>;
  onValueChange: (value: string) => void;
}

function PickerColumn({ items, selected, scrollRef, onValueChange }: PickerColumnProps) {
  const columnRef = useRef<View>(null);
  const selectedRef = useRef(selected);
  const itemsRef = useRef(items);
  const scrollOffsetRef = useRef(0);
  const wheelCooldownRef = useRef(false);
  const dragRef = useRef({ active: false, startY: 0, startOffset: 0, pointerId: -1 });

  selectedRef.current = selected;
  itemsRef.current = items;

  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      const clamped = clampIndex(index, itemsRef.current.length);
      scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated });
      scrollOffsetRef.current = clamped * ITEM_HEIGHT;
    },
    [scrollRef],
  );

  const commitIndex = useCallback(
    (index: number, animated = true) => {
      const clamped = clampIndex(index, itemsRef.current.length);
      const item = itemsRef.current[clamped];
      scrollToIndex(clamped, animated);
      if (item && item !== selectedRef.current) {
        onValueChange(item);
      }
    },
    [onValueChange, scrollToIndex],
  );

  const snapFromOffset = useCallback(
    (offsetY: number) => {
      commitIndex(indexFromOffset(offsetY));
    },
    [commitIndex],
  );

  const stepBy = useCallback(
    (delta: number) => {
      const currentIndex = itemsRef.current.indexOf(selectedRef.current);
      const baseIndex = currentIndex >= 0 ? currentIndex : indexFromOffset(scrollOffsetRef.current);
      commitIndex(baseIndex + delta);
    },
    [commitIndex],
  );

  const handleScrollOffset = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      snapFromOffset(event.nativeEvent.contentOffset.y);
    },
    [snapFromOffset],
  );

  // Web: one wheel tick = one item step (prevents 00 → 45 jumps).
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const columnEl = columnRef.current as unknown as HTMLElement | null;
    if (!columnEl) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (wheelCooldownRef.current) return;

      wheelCooldownRef.current = true;
      window.setTimeout(() => {
        wheelCooldownRef.current = false;
      }, WHEEL_STEP_COOLDOWN_MS);

      stepBy(event.deltaY > 0 ? 1 : -1);
    };

    columnEl.addEventListener('wheel', onWheel, { passive: false });
    return () => columnEl.removeEventListener('wheel', onWheel);
  }, [stepBy]);

  const handlePointerDown = useCallback((event: any) => {
    if (Platform.OS !== 'web') return;
    const native = event.nativeEvent;
    dragRef.current = {
      active: true,
      startY: native.pageY ?? native.clientY ?? 0,
      startOffset: scrollOffsetRef.current,
      pointerId: native.pointerId ?? -1,
    };
    const target = event.currentTarget as unknown as HTMLElement | undefined;
    target?.setPointerCapture?.(native.pointerId);
  }, []);

  const handlePointerMove = useCallback((event: any) => {
    if (Platform.OS !== 'web' || !dragRef.current.active) return;
    const native = event.nativeEvent;
    const y = native.pageY ?? native.clientY ?? 0;
    const nextOffset = Math.max(
      0,
      Math.min(
        (itemsRef.current.length - 1) * ITEM_HEIGHT,
        dragRef.current.startOffset + (dragRef.current.startY - y),
      ),
    );
    scrollRef.current?.scrollTo({ y: nextOffset, animated: false });
    scrollOffsetRef.current = nextOffset;
  }, [scrollRef]);

  const finishPointer = useCallback(
    (event: any) => {
      if (Platform.OS !== 'web' || !dragRef.current.active) return;
      dragRef.current.active = false;
      const native = event.nativeEvent;
      const target = event.currentTarget as unknown as HTMLElement | undefined;
      if (native.pointerId != null) {
        target?.releasePointerCapture?.(native.pointerId);
      }
      snapFromOffset(scrollOffsetRef.current);
    },
    [snapFromOffset],
  );

  return (
    <View
      ref={columnRef}
      style={[styles.columnWrap, Platform.OS === 'web' && styles.columnWrapWeb]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
    >
      <View style={styles.columnHighlight} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="normal"
        scrollEventThrottle={16}
        contentContainerStyle={styles.columnContent}
        onScroll={handleScrollOffset}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
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
}

function snapTimeToMinuteStep(time: string): string {
  const total = timeToMinutes(time);
  const max = 23 * 60 + (60 - MINUTE_STEP);
  const snapped = Math.min(max, Math.max(0, Math.round(total / MINUTE_STEP) * MINUTE_STEP));
  const hour = Math.floor(snapped / 60);
  const minute = snapped % 60;
  return composeTime(String(hour).padStart(2, '0'), String(minute).padStart(2, '0'));
}

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

    const snapped = snapTimeToMinuteStep(value);
    const parsed = parseTimeValue(snapped);
    const parts = hasMinBound
      ? clampParts(parsed.hour, parsed.minute)
      : parsed;
    setHour(parts.hour);
    setMinute(parts.minute);
    scrollToItem(hourScrollRef, hourItems, parts.hour, false);
    const minutes = hasMinBound ? buildValidMinutes(parts.hour, minTime) : ALL_MINUTES;
    scrollToItem(minuteScrollRef, minutes, parts.minute, false);
  }, [visible, value, minTime, hasMinBound, hourItems, scrollToItem, clampParts]);

  const handleHourChange = useCallback(
    (nextHour: string) => {
      applyParts(nextHour, minuteRef.current, false, hasMinBound);
    },
    [applyParts, hasMinBound],
  );

  const handleMinuteChange = useCallback(
    (nextMinute: string) => {
      applyParts(hourRef.current, nextMinute);
    },
    [applyParts],
  );

  const handleConfirm = () => {
    const composed = snapTimeToMinuteStep(composeTime(hourRef.current, minuteRef.current));
    if (!hasMinBound) {
      onConfirm(composed);
      onClose();
      return;
    }
    const parsed = parseTimeValue(composed);
    const parts = clampParts(parsed.hour, parsed.minute);
    onConfirm(composeTime(parts.hour, parts.minute));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.pickerColumns}>
            <PickerColumn
              items={hourItems}
              selected={hour}
              scrollRef={hourScrollRef}
              onValueChange={handleHourChange}
            />
            <Text style={styles.separator}>:</Text>
            <PickerColumn
              items={minuteItems}
              selected={minute}
              scrollRef={minuteScrollRef}
              onValueChange={handleMinuteChange}
            />
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
  columnWrapWeb: {
    cursor: 'grab',
    touchAction: 'none',
    userSelect: 'none',
  } as const,
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
