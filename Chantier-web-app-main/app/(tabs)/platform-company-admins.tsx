import { Redirect } from 'expo-router';

export default function PlatformCompanyAdminsRedirect() {
  return <Redirect href={{ pathname: '/(tabs)/platform-dashboard', params: { segment: 'admins' } }} />;
}
