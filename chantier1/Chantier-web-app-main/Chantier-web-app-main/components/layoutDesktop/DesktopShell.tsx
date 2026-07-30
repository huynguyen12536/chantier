import React from 'react';
import { View, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { DesktopSidebar } from './DesktopSidebar';
import { desktopPageStyles } from './glassStyles';

type DesktopShellProps = {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
};

export function DesktopShell({ children, contentContainerStyle, scroll = true }: DesktopShellProps) {
  return (
    <View style={desktopPageStyles.page}>
      <View style={desktopPageStyles.row}>
        <DesktopSidebar />
        <View style={desktopPageStyles.main}>
          {scroll ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[desktopPageStyles.mainScroll, contentContainerStyle]}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={[desktopPageStyles.mainScroll, styles.fill, contentContainerStyle]}>
              {children}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
});
