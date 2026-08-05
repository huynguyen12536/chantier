import { Platform, useWindowDimensions, View, StyleSheet } from 'react-native';
import { Slot, Tabs } from 'expo-router';
import {
  SquareCheck as CheckSquare,
  ChartBar as BarChart2,
  User,
  Settings2,
  LayoutDashboard,
  Calendar,
  CalendarClock,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ApprovalNotificationsProvider } from '@/contexts/ApprovalNotificationsContext';
import { CollaboratorNotificationsProvider } from '@/contexts/CollaboratorNotificationsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { useIsDesktopLayout } from '@/hooks/useIsDesktopLayout';
import { DesktopSidebar } from '@/components/layoutDesktop/DesktopSidebar';
import { DesktopBackground } from '@/components/layoutDesktop/DesktopBackground';
import { desktopTheme } from '@/components/layoutDesktop/glassStyles';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { UserRole } from '@/types';
import {
  canAccessManagement,
  canAccessOperationalTabs,
  canExport,
  canViewTeamAbsences,
  getHomeRouteForRole,
  getVisibleTabCount,
  isSystemAdmin,
  isWorker,
} from '@/utils/role';
import { PlatformProvider } from '@/contexts/PlatformContext';
import { LayoutDashboard as PlatformIcon } from 'lucide-react-native';

export default function TabsLayout() {
  const { profile, loading } = useAuth();
  const { t } = useLanguage();
  const { tabBarPaddingBottom } = useTabBarInset();
  const { width: windowWidth } = useWindowDimensions();
  const isDesktopLayout = useIsDesktopLayout();

  const isPlatformAdmin = isSystemAdmin(profile?.role as UserRole | undefined);
  const isWorkerRole = isWorker(profile?.role as UserRole | undefined);
  const operational = canAccessOperationalTabs(profile?.role as UserRole | undefined);
  const showValidation = operational && (profile?.role === 'chef_equipe' || profile?.role === 'admin');
  const showExport = operational && profile?.role ? canExport(profile.role as UserRole) : false;
  const showManagement = operational && profile?.role ? canAccessManagement(profile.role as UserRole) : false;
  const showTeamAbsences = operational && profile?.role ? canViewTeamAbsences(profile.role as UserRole) : false;

  const visibleTabCount = getVisibleTabCount(profile?.role);
  const equalTabWidth = visibleTabCount > 0 ? windowWidth / visibleTabCount : windowWidth;

  if (loading) return null;

  // Desktop ≥1200: page-based (Slot mounts only the active route) + sidebar.
  // Mobile: classic bottom Tabs.
  if (isDesktopLayout) {
    return (
      <PlatformProvider>
      <ApprovalNotificationsProvider>
        <CollaboratorNotificationsProvider>
        <DesktopBackground style={styles.desktopRoot}>
          <View style={styles.desktopFrame}>
            <DesktopSidebar />
            <View style={styles.desktopMain}>
              <Slot />
            </View>
          </View>
        </DesktopBackground>
        </CollaboratorNotificationsProvider>
      </ApprovalNotificationsProvider>
      </PlatformProvider>
    );
  }

  return (
    <PlatformProvider>
    <ApprovalNotificationsProvider>
    <CollaboratorNotificationsProvider>
        <Tabs
          initialRouteName={(() => {
            if (!profile?.role) return 'index';
            const route = getHomeRouteForRole(profile.role).replace('/(tabs)/', '');
            return route || 'index';
          })()}
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#FF6B35',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
              height: TAB_BAR_HEIGHT + tabBarPaddingBottom,
              paddingBottom: tabBarPaddingBottom,
              paddingTop: 10,
              paddingHorizontal: 0,
              borderTopWidth: 1,
              borderTopColor: '#E5E5E5',
            },
            tabBarLabelStyle: {
              fontSize: Platform.OS === 'web' ? 12 : 11,
              fontWeight: '600',
              marginTop: 2,
            },
            tabBarIconStyle: {
              marginTop: 0,
            },
            tabBarItemStyle: Platform.select({
              web: {
                flex: 1,
                maxWidth: '100%',
                paddingHorizontal: 4,
              },
              default: {
                width: equalTabWidth,
                maxWidth: equalTabWidth,
                minWidth: equalTabWidth,
                paddingHorizontal: 0,
                justifyContent: 'center',
                alignItems: 'center',
              },
            }),
            freezeOnBlur: true,
            sceneContainerStyle: {
              backgroundColor: desktopTheme.pageBg,
              flex: 1,
            },
          }}
        >
          <Tabs.Screen name="index" options={{ href: null }} />
          <Tabs.Screen name="chef-dashboard" options={{ href: null }} />
          <Tabs.Screen name="team-management" options={{ href: null }} />
          <Tabs.Screen
            name="validation"
            options={{
              title: t.tabs.validation,
              tabBarIcon: ({ size, color }) => <CheckSquare size={size} color={color} />,
              href: showValidation ? '/(tabs)/validation' : null,
            }}
          />
          <Tabs.Screen
            name="ouvrier-dashboard"
            options={{
              title: t.tabs.dashboard,
              tabBarIcon: ({ size, color }) => <LayoutDashboard size={size} color={color} />,
              href: isWorkerRole ? '/(tabs)/ouvrier-dashboard' : null,
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: t.tabs.calendar,
              tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
              href: isWorkerRole ? '/(tabs)/calendar' : null,
            }}
          />
          <Tabs.Screen name="timesheet" options={{ href: null }} />
          <Tabs.Screen
            name="export"
            options={{
              title: t.tabs.export,
              tabBarIcon: ({ size, color }) => <BarChart2 size={size} color={color} />,
              href: showExport ? '/(tabs)/export' : null,
            }}
          />
          <Tabs.Screen
            name="management"
            options={{
              title: t.tabs.management,
              tabBarIcon: ({ size, color }) => <Settings2 size={size} color={color} />,
              href: showManagement ? '/(tabs)/management' : null,
            }}
          />
          <Tabs.Screen
            name="team-absences"
            options={{
              title: t.tabs.absences,
              tabBarIcon: ({ size, color }) => <CalendarClock size={size} color={color} />,
              href: showTeamAbsences ? '/(tabs)/team-absences' : null,
            }}
          />
          <Tabs.Screen name="admin-users" options={{ href: null }} />
          <Tabs.Screen name="admin-worksites" options={{ href: null }} />
          <Tabs.Screen name="worksite-detail" options={{ href: null }} />
          <Tabs.Screen name="select-worksite" options={{ href: null }} />
          <Tabs.Screen name="user-payroll" options={{ href: null }} />
          <Tabs.Screen
            name="platform-dashboard"
            options={{
              title: t.tabs.platform,
              tabBarIcon: ({ size, color }) => <PlatformIcon size={size} color={color} />,
              href: isPlatformAdmin ? '/(tabs)/platform-dashboard' : null,
            }}
          />
          <Tabs.Screen name="platform-companies" options={{ href: null }} />
          <Tabs.Screen name="platform-company-admins" options={{ href: null }} />
          <Tabs.Screen
            name="platform-audit"
            options={{
              title: t.tabs.audit,
              tabBarIcon: ({ size, color }) => <CheckSquare size={size} color={color} />,
              href: isPlatformAdmin ? '/(tabs)/platform-audit' : null,
            }}
          />
          <Tabs.Screen name="company-settings" options={{ href: null }} />
          <Tabs.Screen
            name="profile"
            options={{
              title: t.tabs.profile,
              tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
            }}
          />
        </Tabs>
      </CollaboratorNotificationsProvider>
    </ApprovalNotificationsProvider>
    </PlatformProvider>
  );
}

const styles = StyleSheet.create({
  desktopRoot: {
    flex: 1,
  },
  desktopFrame: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    padding: 8,
  },
  desktopMain: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
