import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_CONTENT_PADDING, TAB_BAR_HEIGHT } from '@/constants/layout';

/** Safe-area insets for full-bleed headers and tab-bar scroll padding. */
export function useTabBarInset() {
  const { bottom, top } = useSafeAreaInsets();

  return {
    top,
    /** Apply on header inner content so the bar extends under the notch. */
    headerPaddingTop: top + HEADER_CONTENT_PADDING,
    tabBarPaddingBottom: Math.max(bottom, 8),
    tabBarTotalHeight: TAB_BAR_HEIGHT + Math.max(bottom, 8),
    /** Tab bar already sits below the screen; only a small scroll tail gap is needed. */
    scrollBottomPadding: 16,
  };
}
