import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getHomeRouteForRole } from '@/utils/role';
import { UserRole } from '@/types';

/** Company settings editing is platform-only; operational admins are redirected home. */
export default function CompanySettingsScreen() {
  const { profile, loading } = useAuth();

  if (loading) return null;

  return <Redirect href={getHomeRouteForRole(profile?.role as UserRole | undefined)} />;
}
