import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Building2, Clock } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useApprovalNotifications, type ApprovalNotification } from '@/contexts/ApprovalNotificationsContext';
import { useLanguage } from '@/contexts/LanguageContext';

type Props = {
  /** light: white bell on translucent (orange header); dark: dark bell on white; accent: white bell on solid orange */
  variant?: 'light' | 'dark' | 'accent';
};

export function ValidationNotificationBell({ variant = 'light' }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const n = t.approvalNotifications;
  const { items, count, loading, enabled, countIncreased, clearCountIncreased, isItemUnread, markAsRead } =
    useApprovalNotifications();
  const [open, setOpen] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!countIncreased || count === 0) return;

    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 1, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start(() => {
      clearCountIncreased();
    });

    pulseAnim.setValue(1);
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.18, duration: 140, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [clearCountIncreased, count, countIncreased, pulseAnim, shakeAnim]);

  if (!enabled) return null;

  const iconColor = variant === 'dark' ? Colors.text.primary : '#FFF';
  const bellBg =
    variant === 'accent' ? Colors.primary : variant === 'light' ? 'rgba(255,255,255,0.18)' : '#FFF';
  const bellBorder =
    variant === 'accent' ? Colors.primary : variant === 'light' ? 'rgba(255,255,255,0.55)' : '#F0E4DC';

  const rotate = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-14deg', '14deg'],
  });

  const handleOpen = () => {
    setOpen(true);
    clearCountIncreased();
  };

  const handlePressItem = (item: ApprovalNotification) => {
    void markAsRead(item.id);
    setOpen(false);
    router.push({
      pathname: item.pathname,
      params: {
        ...item.params,
        _focus: String(Date.now()),
      },
    });
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.bellBtn, { backgroundColor: bellBg, borderColor: bellBorder }]}
        onPress={handleOpen}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={n.title}
      >
        <Animated.View style={{ transform: [{ rotate }, { scale: pulseAnim }] }}>
          <Bell size={20} color={iconColor} strokeWidth={2.2} />
        </Animated.View>
        {count > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.panel} onPress={(e) => e.stopPropagation()}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>{n.title}</Text>
              {count > 0 ? (
                <View style={styles.panelCount}>
                  <Text style={styles.panelCountText}>{count}</Text>
                </View>
              ) : null}
            </View>

            {loading && items.length === 0 ? (
              <ActivityIndicator color={Colors.primary} style={styles.loader} />
            ) : items.length === 0 ? (
              <Text style={styles.empty}>{n.empty}</Text>
            ) : (
              <ScrollView
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={Platform.OS === 'web'}
              >
                {items.map((item) => {
                  const unread = isItemUnread(item.id);
                  return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.row, unread && styles.rowUnread]}
                    onPress={() => handlePressItem(item)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.rowIcon,
                        item.kind === 'timesheet' ? styles.rowIconTimesheet : styles.rowIconWorksite,
                      ]}
                    >
                      {item.kind === 'timesheet' ? (
                        <Clock size={16} color={Colors.primary} strokeWidth={2.2} />
                      ) : (
                        <Building2 size={16} color="#2563EB" strokeWidth={2.2} />
                      )}
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={[styles.rowTitle, unread && styles.rowTitleUnread]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.rowSubtitle, unread && styles.rowSubtitleUnread]} numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                    </View>
                    {unread ? <View style={styles.unreadDot} /> : null}
                  </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'web' ? 72 : 56,
    paddingRight: 16,
    paddingLeft: 16,
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    maxHeight: 420,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E4DC',
    ...Platform.select({
      web: { boxShadow: '0 12px 40px rgba(0,0,0,0.15)' } as object,
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      },
    }),
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EDE8',
  },
  panelTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text.primary,
  },
  panelCount: {
    backgroundColor: Colors.primary + '20',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  panelCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  loader: {
    marginVertical: 24,
  },
  empty: {
    padding: 20,
    textAlign: 'center',
    color: Colors.text.secondary,
    fontSize: 14,
  },
  list: {
    maxHeight: 340,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF5F2',
  },
  rowUnread: {
    backgroundColor: '#FFF4ED',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconTimesheet: {
    backgroundColor: Colors.primary + '15',
  },
  rowIconWorksite: {
    backgroundColor: '#EFF6FF',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  rowTitleUnread: {
    fontWeight: '800',
    color: '#1A120E',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 17,
  },
  rowSubtitleUnread: {
    color: '#4A382F',
    fontWeight: '600',
  },
});
