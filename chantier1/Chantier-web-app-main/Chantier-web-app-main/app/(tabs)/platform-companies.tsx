import { Redirect } from 'expo-router';

export default function PlatformCompaniesRedirect() {
  return <Redirect href={{ pathname: '/(tabs)/platform-dashboard', params: { segment: 'companies' } }} />;
}
