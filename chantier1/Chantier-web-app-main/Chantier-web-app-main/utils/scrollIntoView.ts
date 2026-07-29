import { Platform, type ScrollView, type View } from 'react-native';

type ScrollRef = React.RefObject<ScrollView | null>;
type ViewRef = View | null;

/** Scroll a target view into the visible area (web + native). */
export function scrollViewIntoVisible(
  scrollRef: ScrollRef | undefined,
  target: ViewRef,
  options?: { offset?: number; delayMs?: number },
): void {
  if (!target) return;

  const run = () => {
    if (Platform.OS === 'web') {
      const el = target as unknown as HTMLElement;
      el.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!scrollRef?.current) return;
    const offset = options?.offset ?? 96;

    target.measureInWindow((_x, windowY, _w, _h) => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, windowY - offset),
        animated: true,
      });
    });
  };

  const delay = options?.delayMs ?? 0;
  if (delay > 0) {
    setTimeout(run, delay);
  } else {
    run();
  }
}
