import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter, useGlobalSearchParams } from 'expo-router';
import {
  LayoutDashboard,
  SquareCheck,
  BarChart2,
  CalendarClock,
  User,
  Users,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Colors } from '@/constants/colors';
import { appAlert } from '@/utils/appAlert';
import {
  canAccessManagement,
  canExport,
  canManageUsers,
  canValidate,
  canViewTeamAbsences,
} from '@/utils/role';
import type { UserRole } from '@/types';
import { LoginLogo } from '@/components/brand/LoginLogo';

type NavItem = {
  key: string;
  href: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  match: (path: string, tab?: string) => boolean;
};

const SIDEBAR_EXPANDED_WIDTH = 236;
const SIDEBAR_COLLAPSED_WIDTH = 76;
const TOGGLE_SIZE = 28;

export function DesktopSidebar() {
  const { profile, signOut } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useGlobalSearchParams<{ tab?: string }>();
  const role = profile?.role as UserRole | undefined;
  const [collapsed, setCollapsed] = useState(false);
  const activeTab = typeof searchParams.tab === 'string' ? searchParams.tab : undefined;

  const items = useMemo<NavItem[]>(() => {
    const list: NavItem[] = [];

    if (role === 'ouvrier') {
      list.push({
        key: 'dashboard',
        href: '/(tabs)/ouvrier-dashboard',
        label: t.tabs.dashboard,
        Icon: LayoutDashboard,
        match: (p) => p.includes('ouvrier-dashboard'),
      });
      list.push({
        key: 'calendar',
        href: '/(tabs)/calendar',
        label: t.tabs.calendar,
        Icon: Calendar,
        match: (p) => p.includes('calendar'),
      });
    }

    if (role && canValidate(role)) {
      list.push({
        key: 'validation',
        href: '/(tabs)/validation',
        label: t.tabs.validation,
        Icon: SquareCheck,
        match: (p) => p.includes('validation'),
      });
    }

    if (role && canExport(role)) {
      list.push({
        key: 'export',
        href: '/(tabs)/export',
        label: t.tabs.export,
        Icon: BarChart2,
        match: (p) => p.includes('export'),
      });
    }

    if (role && canManageUsers(role)) {
      list.push({
        key: 'users',
        href: '/(tabs)/management?tab=users',
        label: t.tabs.users,
        Icon: Users,
        match: (p, tab) =>
          (p.includes('management') && tab === 'users') || p.includes('admin-users'),
      });
    }

    if (role && canAccessManagement(role)) {
      list.push({
        key: 'worksites',
        href: '/(tabs)/management?tab=worksites',
        label: t.tabs.worksites,
        Icon: Building2,
        match: (p, tab) =>
          (p.includes('management') && tab === 'worksites') ||
          p.includes('admin-worksites') ||
          p.includes('team-management'),
      });
    }

    if (role && canViewTeamAbsences(role)) {
      list.push({
        key: 'absences',
        href: '/(tabs)/team-absences',
        label: t.tabs.absences,
        Icon: CalendarClock,
        match: (p) => p.includes('team-absences') || p.includes('absence'),
      });
    }

    list.push({
      key: 'profile',
      href: '/(tabs)/profile',
      label: t.tabs.profile,
      Icon: User,
      match: (p) => p.includes('profile'),
    });

    return list;
  }, [role, t.tabs]);

  const handleLogout = () => {
    appAlert(t.profile.logoutTitle, t.profile.logoutMessage, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.profile.logoutTitle,
        style: 'destructive',
        onPress: () => {
          void signOut();
        },
      },
    ]);
  };

  const ToggleIcon = collapsed ? ChevronRight : ChevronLeft;

  return (
    <View style={[styles.shell, { width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }]}>
      <BlurView intensity={55} tint="light" style={[styles.sidebar, collapsed && styles.sidebarCollapsed]}>
        <View style={[styles.brand, collapsed && styles.brandCollapsed]}>
          <LoginLogo width={collapsed ? 40 : 118} />
        </View>

        <View style={styles.nav}>
          {items.map((item) => {
            const active = item.match(pathname, activeTab);
            const color = active ? '#FFFFFF' : Colors.primary;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.navItem,
                  collapsed && styles.navItemCollapsed,
                  active && styles.navItemActive,
                ]}
                onPress={() => router.push(item.href as any)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                activeOpacity={0.85}
              >
                <item.Icon size={18} color={color} strokeWidth={2.2} />
                {!collapsed ? (
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.navFooter}>
          <TouchableOpacity
            style={[styles.navItem, styles.logoutItem, collapsed && styles.navItemCollapsed]}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel={t.profile.logout}
            activeOpacity={0.85}
          >
            <LogOut size={18} color="#FFFFFF" strokeWidth={2.2} />
            {!collapsed ? <Text style={styles.logoutLabel}>{t.profile.logout}</Text> : null}
          </TouchableOpacity>
        </View>
      </BlurView>

      <TouchableOpacity
        style={styles.edgeToggle}
        onPress={() => setCollapsed((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
        accessibilityState={{ expanded: !collapsed }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ToggleIcon size={16} color="#FFFFFF" strokeWidth={2.4} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'stretch',
    position: 'relative',
    zIndex: 2,
  },
  sidebar: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 10,
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 10,
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
        } as object)
      : null),
  },
  sidebarCollapsed: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  brandCollapsed: {
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  edgeToggle: {
    position: 'absolute',
    top: 28,
    right: -(TOGGLE_SIZE / 2),
    width: TOGGLE_SIZE,
    height: TOGGLE_SIZE,
    borderRadius: TOGGLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 5,
  },
  nav: {
    gap: 6,
    width: '100%',
    flex: 1,
  },
  navFooter: {
    marginTop: 'auto',
    paddingTop: 8,
    width: '100%',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  navItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    width: 44,
    height: 44,
    alignSelf: 'center',
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logoutItem: {
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  logoutLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
