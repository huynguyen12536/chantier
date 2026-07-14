import { Platform, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { SquareCheck as CheckSquare, ChartBar as BarChart2, User, Settings2, LayoutDashboard, Calendar } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { TAB_BAR_HEIGHT } from '@/constants/layout';
import { UserRole } from '@/types';
import { canAccessManagement, canExport, getHomeRouteForRole, getVisibleTabCount } from '@/utils/role';

export default function TabsLayout() {
  const { profile, loading } = useAuth();
  const { t } = useLanguage();
  const { tabBarPaddingBottom } = useTabBarInset();
  const { width: windowWidth } = useWindowDimensions();

  const isChef = profile?.role === 'chef_equipe';
  const isWorker = profile?.role === 'ouvrier';
  const showValidation = profile?.role === 'chef_equipe' || profile?.role === 'admin';
  const showExport = profile?.role ? canExport(profile.role as UserRole) : false;
  const showManagement = profile?.role ? canAccessManagement(profile.role as UserRole) : false;

  const visibleTabCount = getVisibleTabCount(profile?.role);
  const equalTabWidth = visibleTabCount > 0 ? windowWidth / visibleTabCount : windowWidth;

  if (loading) return null;

  return (
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
          tabBarIcon: ({ size, color }) => <CheckSquare size={size} color={color} />,
          href: showValidation ? '/(tabs)/validation' : null,
        }}
      />
      {/* ouvrier: Dashboard */}
      <Tabs.Screen
        name="ouvrier-dashboard"
        options={{
          title: t.tabs.dashboard,
          tabBarIcon: ({ size, color }) => <LayoutDashboard size={size} color={color} />,
          href: isWorker ? '/(tabs)/ouvrier-dashboard' : null,
        }}
      />
      {/* ouvrier: Calendrier (same UI as Choisir un jour) */}
      <Tabs.Screen
        name="calendar"
        options={{
          title: t.tabs.calendar,
          tabBarIcon: ({ size, color }) => <Calendar size={size} color={color} />,
          href: isWorker ? '/(tabs)/calendar' : null,
        }}
      />
      {/* Déclaration heures — hidden (ouvrier uses dashboard + declare-day) */}
      <Tabs.Screen name="timesheet" options={{ href: null }} />
      {/* administratif/admin: Statistiques */}
      <Tabs.Screen
        name="export"
        options={{
          title: t.tabs.export,
          tabBarIcon: ({ size, color }) => <BarChart2 size={size} color={color} />,
          href: showExport ? '/(tabs)/export' : null,
        }}
      />
      {/* admin & chef d'équipe: Gestion */}
      <Tabs.Screen
        name="management"
        options={{
          title: t.tabs.management,
          tabBarIcon: ({ size, color }) => <Settings2 size={size} color={color} />,
          href: showManagement ? '/(tabs)/management' : null,
        }}
      />
      {/* 4. Profil - all */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="admin-users" options={{ href: null }} />
      <Tabs.Screen name="admin-worksites" options={{ href: null }} />
      <Tabs.Screen name="worksite-detail" options={{ href: null }} />
      <Tabs.Screen name="select-worksite" options={{ href: null }} />
      <Tabs.Screen name="user-payroll" options={{ href: null }} />
    </Tabs>
  );
}
