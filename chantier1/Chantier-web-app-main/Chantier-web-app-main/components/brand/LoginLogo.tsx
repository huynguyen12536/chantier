import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import Logo from '@/assets/images/logo.svg';

const LOGO_WIDTH = 220;
const LOGO_VIEWBOX_WIDTH = 607;
const LOGO_VIEWBOX_HEIGHT = 506;
const LOGO_HEIGHT = Math.round((LOGO_WIDTH * LOGO_VIEWBOX_HEIGHT) / LOGO_VIEWBOX_WIDTH);

function resolveSvgComponent(module: unknown): React.FC<SvgProps> | null {
  if (typeof module === 'function') {
    return module as React.FC<SvgProps>;
  }

  if (module && typeof module === 'object' && 'default' in module) {
    const def = (module as { default: unknown }).default;
    if (typeof def === 'function') {
      return def as React.FC<SvgProps>;
    }
  }

  return null;
}

const LogoSvg = resolveSvgComponent(Logo);

export function LoginLogo() {
  if (!LogoSvg) {
    return <View style={styles.placeholder} />;
  }

  return (
    <View style={styles.wrap}>
      <LogoSvg width={LOGO_WIDTH} height={LOGO_HEIGHT} accessibilityLabel="Logo" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
});
