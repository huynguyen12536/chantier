import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const FOCUSED_SCALE = 1.13;
const ACTIVE_TRANSLATE_Y = -2;
const PRESS_SCALE = 0.9;
const RELEASE_BOUNCE_SCALE = 1.1;
const INACTIVE_OPACITY = 0.88;
const PRESS_DOWN_MS = 100;
const OPACITY_MS = 200;
const FOCUS_SPRING = { friction: 7, tension: 140, useNativeDriver: USE_NATIVE_DRIVER };
const BOUNCE_SPRING = { friction: 5, tension: 180, useNativeDriver: USE_NATIVE_DRIVER };

type TabIconProps = {
  Icon: LucideIcon;
  size: number;
  color: string;
  focused: boolean;
};

export function AnimatedTabIcon({ Icon, size, color, focused }: TabIconProps) {
  const scale = useRef(new Animated.Value(focused ? FOCUSED_SCALE : 1)).current;
  const translateY = useRef(new Animated.Value(focused ? ACTIVE_TRANSLATE_Y : 0)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : INACTIVE_OPACITY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        ...FOCUS_SPRING,
        toValue: focused ? FOCUSED_SCALE : 1,
      }),
      Animated.spring(translateY, {
        ...FOCUS_SPRING,
        toValue: focused ? ACTIVE_TRANSLATE_Y : 0,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : INACTIVE_OPACITY,
        duration: OPACITY_MS,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [focused, opacity, scale, translateY]);

  return (
    <Animated.View
      style={[
        styles.iconWrap,
        Platform.OS === 'web' && styles.iconWrapWeb,
        { transform: [{ translateY }, { scale }], opacity },
      ]}
    >
      <Icon size={size} color={color} />
    </Animated.View>
  );
}

export function tabBarIcon(Icon: LucideIcon) {
  return ({ size, color, focused }: { size: number; color: string; focused: boolean }) => (
    <AnimatedTabIcon Icon={Icon} size={size} color={color} focused={focused} />
  );
}

export function AnimatedTabBarButton(props: BottomTabBarButtonProps) {
  const { children, style, onPressIn, onPressOut, ...rest } = props;
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event: Parameters<NonNullable<typeof onPressIn>>[0]) => {
    Animated.timing(pressScale, {
      toValue: PRESS_SCALE,
      duration: PRESS_DOWN_MS,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
    onPressIn?.(event);
  };

  const handlePressOut = (event: Parameters<NonNullable<typeof onPressOut>>[0]) => {
    Animated.sequence([
      Animated.spring(pressScale, {
        ...BOUNCE_SPRING,
        toValue: RELEASE_BOUNCE_SCALE,
      }),
      Animated.spring(pressScale, {
        ...FOCUS_SPRING,
        toValue: 1,
      }),
    ]).start();
    onPressOut?.(event);
  };

  return (
    <PlatformPressable
      {...rest}
      style={style}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.buttonWrap,
          Platform.OS === 'web' && styles.buttonWrapWeb,
          { transform: [{ scale: pressScale }] },
        ]}
      >
        {children}
      </Animated.View>
    </PlatformPressable>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapWeb: {
    willChange: 'transform, opacity',
  },
  buttonWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapWeb: {
    willChange: 'transform',
  },
});
