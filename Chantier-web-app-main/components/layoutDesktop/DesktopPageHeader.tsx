import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { desktopHeaderStyles } from './glassStyles';

export type DesktopPageHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  right?: React.ReactNode;
  titleLeading?: React.ReactNode;
  titleTrailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Header trang desktop — cùng pattern Utilisateurs (title ink + subtitle cam). */
export function DesktopPageHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  right,
  titleLeading,
  titleTrailing,
  style,
}: DesktopPageHeaderProps) {
  return (
    <View style={[desktopHeaderStyles.headerRow, styles.row, style]}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={backLabel ?? 'Back'}
          activeOpacity={0.85}
        >
          <ArrowLeft size={20} color={Colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
      ) : null}

      <View style={desktopHeaderStyles.headerCopy}>
        <View style={styles.titleRow}>
          {titleLeading}
          <Text style={[desktopHeaderStyles.title, styles.titleFlex]} numberOfLines={2}>
            {title}
          </Text>
          {titleTrailing}
        </View>
        {subtitle ? (
          <Text style={desktopHeaderStyles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View style={desktopHeaderStyles.headerActions}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD5C4',
    flexShrink: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  titleFlex: {
    flexShrink: 1,
    minWidth: 0,
  },
});
