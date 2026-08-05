import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const SHAKE_STEPS: Array<{ toValue: number; duration: number }> = [
  { toValue: 1, duration: 60 },
  { toValue: -1, duration: 60 },
  { toValue: 0.65, duration: 50 },
  { toValue: -0.65, duration: 50 },
  { toValue: 0, duration: 50 },
];

const SHAKE_CYCLES = 2;

function buildShakeSequence(shakeAnim: Animated.Value) {
  const oneCycle = Animated.sequence(
    SHAKE_STEPS.map(({ toValue, duration }) =>
      Animated.timing(shakeAnim, { toValue, duration, useNativeDriver: USE_NATIVE_DRIVER }),
    ),
  );
  return Animated.sequence(Array.from({ length: SHAKE_CYCLES }, () => oneCycle));
}

export function useBellShakeAnimation(
  countIncreased: boolean,
  count: number,
  clearCountIncreased: () => void,
) {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!countIncreased || count === 0) return;

    shakeAnim.setValue(0);
    buildShakeSequence(shakeAnim).start(() => {
      clearCountIncreased();
    });

    pulseAnim.setValue(1);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.18, duration: 140, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 140, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
  }, [clearCountIncreased, count, countIncreased, pulseAnim, shakeAnim]);

  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg'],
  });

  return { rotate, pulseAnim };
}
