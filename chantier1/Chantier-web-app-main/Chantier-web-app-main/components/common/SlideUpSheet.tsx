import { useCallback, useRef, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

export function useSlideUpSheet(onHidden?: () => void) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  const open = useCallback(() => {
    slideAnim.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 9,
      tension: 80,
    }).start();
  }, [slideAnim]);

  const dismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onHidden?.();
    });
  }, [slideAnim, onHidden]);

  return { slideAnim, dismiss, open };
}

type SlideUpSheetProps = {
  slideAnim: Animated.Value;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function SlideUpSheet({ slideAnim, style, children }: SlideUpSheetProps) {
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [480, 0],
  });

  return (
    <Animated.View style={[style, { transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
