import { useLanguage } from '@/contexts/LanguageContext';
import { useTabBarInset } from '@/hooks/useTabBarInset';
import { ChooseDayCalendar } from '@/components/ouvrier/ChooseDayCalendar';

export default function CalendarTabScreen() {
  const { t } = useLanguage();
  const { scrollBottomPadding, headerPaddingTop } = useTabBarInset();

  return (
    <ChooseDayCalendar
      title={t.tabs.calendar}
      headerPaddingTop={headerPaddingTop}
      scrollBottomPadding={scrollBottomPadding}
    />
  );
}
