import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

export type DraggableSheetHeightOptions = {
  initial?: number;
  min?: number;
  max?: number;
  visible?: boolean;
  onDismiss?: () => void;
  dismissThreshold?: number;
};

export function useDraggableSheetHeight({
  initial = 0.8,
  min = 0.1,
  max = 0.92,
  visible = true,
  onDismiss,
  dismissThreshold = 0.28,
}: DraggableSheetHeightOptions = {}) {
  const [heightRatio, setHeightRatio] = useState(initial);
  const heightRatioRef = useRef(initial);
  const dragStartRef = useRef(initial);

  const reset = useCallback(() => {
    setHeightRatio(initial);
    heightRatioRef.current = initial;
    dragStartRef.current = initial;
  }, [initial]);

  useEffect(() => {
    if (visible) reset();
  }, [visible, reset]);

  heightRatioRef.current = heightRatio;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          dragStartRef.current = heightRatioRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          const screenHeight = Dimensions.get('window').height;
          const next = dragStartRef.current - gesture.dy / screenHeight;
          const clamped = Math.min(max, Math.max(min, next));
          heightRatioRef.current = clamped;
          setHeightRatio(clamped);
        },
        onPanResponderRelease: (_, gesture) => {
          const screenHeight = Dimensions.get('window').height;
          const finalRatio = dragStartRef.current - gesture.dy / screenHeight;
          if (onDismiss && finalRatio < dismissThreshold && gesture.vy > 0.35) {
            onDismiss();
            return;
          }
          const clamped = Math.min(max, Math.max(min, finalRatio));
          setHeightRatio(clamped);
          heightRatioRef.current = clamped;
        },
      }),
    [min, max, onDismiss, dismissThreshold],
  );

  const sheetStyle = useMemo(
    () => ({ height: `${Math.round(heightRatio * 100)}%` } as ViewStyle),
    [heightRatio],
  );

  return {
    heightRatio,
    sheetStyle,
    panHandlers: panResponder.panHandlers,
    reset,
    setHeightRatio,
  };
}

type DraggableSheetHandleProps = ViewProps & {
  panHandlers?: ViewProps;
};

export function DraggableSheetHandle({ panHandlers, style, ...rest }: DraggableSheetHandleProps) {
  return (
    <View style={[styles.handleZone, style]} {...panHandlers} {...rest} accessibilityRole="adjustable">
      <View style={styles.handle} />
    </View>
  );
}

type BottomSheetOverlayProps = {
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function BottomSheetOverlay({ onDismiss, style, children }: BottomSheetOverlayProps) {
  return (
    <View style={[styles.overlay, style]}>
      {onDismiss ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
        />
      ) : null}
      {children}
    </View>
  );
}

type DraggableBottomSheetProps = {
  visible?: boolean;
  initial?: number;
  min?: number;
  max?: number;
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function DraggableBottomSheet({
  visible = true,
  initial = 0.8,
  min = 0.1,
  max = 0.92,
  onDismiss,
  style,
  children,
}: DraggableBottomSheetProps) {
  const { sheetStyle, panHandlers } = useDraggableSheetHeight({
    visible,
    initial,
    min,
    max,
    onDismiss,
  });

  return (
    <View style={[style, sheetStyle]}>
      <DraggableSheetHandle panHandlers={panHandlers} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  handleZone: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    zIndex: 2,
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 107, 53, 0.42)',
  },
});
