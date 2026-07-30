import React from 'react';
import { ImageBackground, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { desktopBackgroundImage, desktopTheme } from './glassStyles';

type DesktopBackgroundProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Nền ảnh chung cho shell / các trang desktop. */
export function DesktopBackground({ children, style }: DesktopBackgroundProps) {
  return (
    <ImageBackground
      source={desktopBackgroundImage}
      style={[styles.root, style]}
      imageStyle={styles.image}
      resizeMode="cover"
    >
      <View style={styles.overlay}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: desktopTheme.pageBg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
