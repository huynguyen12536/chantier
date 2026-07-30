import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChooseDayCalendar } from '@/components/ouvrier/ChooseDayCalendar';

export default function ChooseDayScreen() {
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ initialDate?: string }>();
  const { t } = useLanguage();

  if (!profile || profile.role !== 'ouvrier') return null;

  return (
    <ChooseDayCalendar
      title={t.ouvrierDashboard?.chooseDayTitle ?? 'Choisir un jour'}
      showBackButton
      initialDate={params.initialDate}
    />
  );
}
