import { useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChooseDayCalendar } from '@/components/ouvrier/ChooseDayCalendar';

export default function ChooseDayScreen() {
  const params = useLocalSearchParams<{ initialDate?: string }>();
  const { t } = useLanguage();

  return (
    <ChooseDayCalendar
      title={t.ouvrierDashboard?.chooseDayTitle ?? 'Choisir un jour'}
      showBackButton
      initialDate={params.initialDate}
    />
  );
}
