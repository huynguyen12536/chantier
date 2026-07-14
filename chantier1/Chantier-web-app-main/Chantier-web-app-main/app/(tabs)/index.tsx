import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getHomeRouteForRole } from '@/utils/role';

/** Legacy tab entry — redirects each role to its home screen. */
export default function IndexScreen() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const role = profile?.role;

  useEffect(() => {
    if (!loading && role) {
      router.navigate(getHomeRouteForRole(role));
    }
  }, [loading, role, router]);

  return null;
}
