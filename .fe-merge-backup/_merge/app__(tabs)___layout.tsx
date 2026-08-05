import { Platform, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { SquareCheck as CheckSquare, ChartBar as BarChart2, User, Settings2, LayoutDashboard, Calendar, CalendarClock } from 'lucide-react-native';
import { AnimatedTabBarButton, tabBarIcon } from '@/components/common/AnimatedTabBar';
import { useAuth } from '@/contexts/AuthContext';
import { ApprovalNotificationsProvider } from '@/contexts/ApprovalNotificationsContext';
import { CollaboratorNotificationsProvider } from '@/contexts/CollaboratorNotificationsContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
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

  const isPlatformAdmin = isSystemAdmin(profile?.role as UserRole | undefined);
  const isChef = profile?.role === 'chef_equipe';
  const isWorkerRole = isWorker(profile?.role as UserRole | undefined);
  const operational = canAccessOperationalTabs(profile?.role as UserRole | undefined);
  const showValidation = operational && (profile?.role === 'chef_equipe' || profile?.role === 'admin');
  const showExport = operational && profile?.role ? canExport(profile.role as UserRole) : false;
  const showManagement = operational && profile?.role ? canAccessManagement(profile.role as UserRole) : false;
  const showTeamAbsences = operational && profile?.role ? canViewTeamAbsences(profile.role as UserRole) : false;

  const visibleTabCount = getVisibleTabCount(profile?.role);
  const equalTabWidth = visibleTabCount > 0 ? windowWidth / visibleTabCount : windowWidth;

  if (loading) return null;

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
        tabBarButton: (props) => <AnimatedTabBarButton {...props} />,
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
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="chef-dashboard" options={{ href: null }} />
      <Tabs.Screen name="team-management" options={{ href: null }} />
      {/* 3. Validation - chef & admin */}
      <Tabs.Screen
        name="validation"
        options={{
          title: t.tabs.validation,
          tabBarIcon: tabBarIcon(CheckSquare),
          href: showValidation ? '/(tabs)/validation' : null,
        }}
      />
      {/* ouvrier: Dashboard */}
      <Tabs.Screen
        name="ouvrier-dashboard"
        options={{
          title: t.tabs.dashboard,
          tabBarIcon: tabBarIcon(LayoutDashboard),
          href: isWorkerRole ? '/(tabs)/ouvrier-dashboard' : null,
        }}
      />
      {/* ouvrier: Calendrier (same UI as Choisir un jour) */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: t.tabs.calendar,
          tabBarIcon: tabBarIcon(Calendar),
          href: isWorkerRole ? '/(tabs)/calendar' : null,
        }}
      />
      {/* Déclaration heures — hidden (ouvrier uses dashboard + declare-day) */}
      <Tabs.Screen name="timesheet" options={{ href: null }} />
      {/* administratif/admin: Statistiques */}
      <Tabs.Screen
        name="export"
        options={{
          title: t.tabs.export,
          tabBarIcon: tabBarIcon(BarChart2),
          href: showExport ? '/(tabs)/export' : null,
        }}
      />
      {/* admin & chef d'équipe: Gestion */}
      <Tabs.Screen
        name="management"
        options={{
          title: t.tabs.management,
          tabBarIcon: tabBarIcon(Settings2),
          href: showManagement ? '/(tabs)/management' : null,
        }}
      />
      {/* chef/admin/administratif: Team absences */}
      <Tabs.Screen
        name="team-absences"
        options={{
          title: t.tabs.absences,
          tabBarIcon: tabBarIcon(CalendarClock),
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
          tabBarIcon: tabBarIcon(PlatformIcon),
          href: isPlatformAdmin ? '/(tabs)/platform-dashboard' : null,
        }}
      />
      <Tabs.Screen name="platform-companies" options={{ href: null }} />
      <Tabs.Screen name="platform-company-admins" options={{ href: null }} />
      <Tabs.Screen
        name="platform-audit"
        options={{
          title: t.tabs.audit,
          tabBarIcon: tabBarIcon(CheckSquare),
          href: isPlatformAdmin ? '/(tabs)/platform-audit' : null,
        }}
      />
      <Tabs.Screen name="company-settings" options={{ href: null }} />
      {/* Profil - all (rightmost tab) */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: tabBarIcon(User),
        }}
      />
    </Tabs>
    </CollaboratorNotificationsProvider>
    </ApprovalNotificationsProvider>
    </PlatformProvider>
  );
}
