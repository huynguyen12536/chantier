import { useWindowDimensions } from 'react-native';

export const DESKTOP_LAYOUT_MIN_WIDTH = 1200;

export function useIsDesktopLayout() {
  const { width } = useWindowDimensions();
  return width >= DESKTOP_LAYOUT_MIN_WIDTH;
}
