import { useEffect, useRef, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const BORDER_WIDTH = 1;
const RADIUS = 14;

interface IncompleteLineBorderProps {
  active: boolean;
  rejected?: boolean;
  pending?: boolean;
  approved?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function IncompleteLineBorder({
  active,
  rejected,
  pending,
  approved,
  children,
  style,
}: IncompleteLineBorderProps) {
  const rotation = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active && !rejected) {
      rotation.setValue(0);
      loopRef.current = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 2800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      rotation.setValue(0);
    }

    return () => {
      loopRef.current?.stop();
    };
  }, [active, rejected, rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (rejected) {
    return <View style={[styles.rejectedCard, style]}>{children}</View>;
  }

  if (approved) {
    return <View style={[styles.approvedCard, style]}>{children}</View>;
  }

  if (pending) {
    return <View style={[styles.pendingCard, style]}>{children}</View>;
  }

  if (!active) {
    return <View style={[styles.staticCard, style]}>{children}</View>;
  }

  return (
    <View style={[styles.shell, style]}>
      <Animated.View
        style={[styles.spinner, { transform: [{ rotate: spin }] }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={['#FF6B35', '#FFB347', '#FFE8A3', '#FF8A50', '#FF6B35']}
          locations={[0, 0.28, 0.5, 0.72, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  staticCard: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: RADIUS,
    gap: 8,
  },
  rejectedCard: {
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: RADIUS,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#EF5350',
  },
  pendingCard: {
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: RADIUS,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FFB300',
  },
  approvedCard: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: RADIUS,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#43A047',
  },
  shell: {
    borderRadius: RADIUS,
    overflow: 'hidden',
    position: 'relative',
  },
  spinner: {
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
  },
  gradient: {
    flex: 1,
  },
  inner: {
    margin: BORDER_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS - BORDER_WIDTH,
    padding: 10,
    gap: 8,
  },
});
