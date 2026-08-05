import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const readIdsKey = (userId: string) => `approval_notifications_read_${userId}`;

export async function loadApprovalNotificationsReadIds(userId: string): Promise<Set<string>> {
  try {
    const raw =
      Platform.OS === 'web'
        ? localStorage.getItem(readIdsKey(userId))
        : await AsyncStorage.getItem(readIdsKey(userId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export async function saveApprovalNotificationsReadIds(
  userId: string,
  ids: Set<string>,
): Promise<void> {
  try {
    const payload = JSON.stringify([...ids]);
    if (Platform.OS === 'web') {
      localStorage.setItem(readIdsKey(userId), payload);
      return;
    }
    await AsyncStorage.setItem(readIdsKey(userId), payload);
  } catch {
    // ignore persistence errors
  }
}

export async function markApprovalNotificationRead(
  userId: string,
  notificationId: string,
  current: Set<string>,
): Promise<Set<string>> {
  const next = new Set(current);
  next.add(notificationId);
  await saveApprovalNotificationsReadIds(userId, next);
  return next;
}
