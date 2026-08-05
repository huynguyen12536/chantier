import React from 'react';
import { View } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import Logo from '@/assets/images/logo.svg';

const DEFAULT_LOGO_WIDTH = 220;
const LOGO_VIEWBOX_WIDTH = 607;
const LOGO_VIEWBOX_HEIGHT = 506;

function logoHeightForWidth(width: number) {
  return Math.round((width * LOGO_VIEWBOX_HEIGHT) / LOGO_VIEWBOX_WIDTH);
}

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

export function LoginLogo({ width = DEFAULT_LOGO_WIDTH }: { width?: number }) {
  const height = logoHeightForWidth(width);

  if (!LogoSvg) {
    return <View style={{ width, height }} />;
  }

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <LogoSvg width={width} height={height} accessibilityLabel="Logo" />
    </View>
  );
}
