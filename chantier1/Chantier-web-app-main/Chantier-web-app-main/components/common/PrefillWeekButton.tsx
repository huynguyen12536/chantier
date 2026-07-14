import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CalendarRange } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface PrefillWeekButtonProps {
  onPress: () => void;
  label: string;
  accessibilityLabel?: string;
}

export function PrefillWeekButton({
  onPress,
  label,
  accessibilityLabel,
}: PrefillWeekButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={styles.touchTarget}
    >
      <View style={styles.inner}>
        <CalendarRange size={15} color={Colors.primary} strokeWidth={2.2} />
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    flexShrink: 0,
    alignSelf: 'flex-end',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    paddingRight: 12,
    borderRadius: 18,
    backgroundColor: '#FFF7F2',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 17,
  },
});
