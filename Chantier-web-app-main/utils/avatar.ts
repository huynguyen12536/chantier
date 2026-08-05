import { supabase, supabaseUrl } from '@/services/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

const AVATAR_BUCKET = 'avatars';

export function getAvatarPublicUrl(
  avatarPath: string | null | undefined,
  avatarUpdatedAt?: string | null,
): string | null {
  if (!avatarPath?.trim() || !supabaseUrl) return null;
  const base = `${supabaseUrl}/api/storage/${AVATAR_BUCKET}/${avatarPath.replace(/^\//, '')}`;
  if (avatarUpdatedAt) {
    const t = new Date(avatarUpdatedAt).getTime();
    if (Number.isFinite(t)) {
      return `${base}?t=${t}`;
    }
  }
  return base;
}

export async function removeAvatarIfExists(avatarPath: string | null | undefined): Promise<void> {
  if (!avatarPath?.trim()) return;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath]);
  if (error && !/not found|404/i.test(error.message)) {
    console.warn('[avatar] remove failed', error.message);
  }
}

function extensionFromMime(mime: string | undefined): string {
  switch (mime) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

async function uriToArrayBuffer(uri: string): Promise<{ buffer: ArrayBuffer; mime: string }> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const mime = blob.type || 'image/jpeg';
  const buffer = await blob.arrayBuffer();
  return { buffer, mime };
}

export async function pickAvatarImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('PERMISSION_DENIED');
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }
  return result.assets[0];
}

export async function uploadUserAvatar(params: {
  userId: string;
  imageUri: string;
  mimeType?: string | null;
  previousAvatarPath?: string | null;
}): Promise<{ avatar_path: string; avatar_updated_at: string }> {
  const { userId, imageUri, mimeType, previousAvatarPath } = params;

  if (previousAvatarPath) {
    await removeAvatarIfExists(previousAvatarPath);
  }

  const { buffer, mime } = await uriToArrayBuffer(imageUri);
  const contentType = mimeType || mime || 'image/jpeg';
  const ext = extensionFromMime(contentType);
  const avatar_path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(avatar_path, buffer, {
      contentType,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    throw uploadError;
  }

  const avatar_updated_at = new Date().toISOString();
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_path, avatar_updated_at })
    .eq('id', userId);

  if (profileError) {
    throw profileError;
  }

  return { avatar_path, avatar_updated_at };
}
