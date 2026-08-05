import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const readIdsKey = (userId: string) => `collab_notifications_read_${userId}`;

export async function loadCollaboratorNotificationsReadIds(userId: string): Promise<Set<string>> {
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

export async function saveCollaboratorNotificationsReadIds(
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

export async function markCollaboratorNotificationRead(
  userId: string,
  notificationId: string,
  current: Set<string>,
): Promise<Set<string>> {
  const next = new Set(current);
  next.add(notificationId);
  await saveCollaboratorNotificationsReadIds(userId, next);
  return next;
}
