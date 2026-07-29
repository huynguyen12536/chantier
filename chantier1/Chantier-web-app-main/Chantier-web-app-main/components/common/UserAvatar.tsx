import React, { useMemo } from 'react';
import { Image, ImageStyle, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { User } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { UserRole } from '@/types';
import { getAvatarPublicUrl } from '@/utils/avatar';

type UserAvatarVariant = 'profile' | 'initials';

type Props = {
  avatarPath?: string | null;
  avatarUpdatedAt?: string | null;
  prenom?: string | null;
  nom?: string | null;
  role?: UserRole | string | null;
  size?: number;
  variant?: UserAvatarVariant;
  style?: ImageStyle;
};

function roleColor(role: string | null | undefined): string {
  switch (role) {
    case 'admin':
      return Colors.primary;
    case 'chef_equipe':
      return Colors.warning;
    case 'administratif':
      return Colors.secondary;
    case 'ouvrier':
    default:
      return Colors.info;
  }
}

export function UserAvatar({
  avatarPath,
  avatarUpdatedAt,
  prenom,
  nom,
  role,
  size = 40,
  variant = 'initials',
  style,
}: Props) {
  const uri = useMemo(
    () => getAvatarPublicUrl(avatarPath, avatarUpdatedAt),
    [avatarPath, avatarUpdatedAt],
  );

  const radius = size / 2;
  const initials = `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase() || '?';
  const tint = roleColor(role ?? undefined);

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: '#FFE8DD',
          },
          style,
        ]}
        accessibilityRole="image"
      />
    );
  }

  if (variant === 'profile') {
    return (
      <View
        style={[
          styles.profileFallback,
          { width: size, height: size, borderRadius: radius },
          style,
        ]}
      >
        <User size={Math.round(size * 0.5)} color="#FFF" strokeWidth={2} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.initialsWrap,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: tint + '20',
        },
        style,
      ]}
    >
      <Text style={[styles.initialsText, { color: tint, fontSize: Math.max(12, size * 0.34) }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileFallback: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontWeight: '700',
  },
});
