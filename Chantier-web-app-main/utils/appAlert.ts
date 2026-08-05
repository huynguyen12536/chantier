import { Alert, Platform } from 'react-native';

export type AppAlertButton = {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AppAlertHandler = (title: string, message: string, buttons?: AppAlertButton[]) => void;

let handler: AppAlertHandler | null = null;

export function setAppAlertHandler(next: AppAlertHandler | null): void {
  handler = next;
}

/** Cross-platform alert — ConfirmModal on web via AppAlertProvider, Alert.alert on native. */
export function appAlert(title: string, message: string, buttons?: AppAlertButton[]): void {
  if (handler) {
    handler(title, message, buttons);
    return;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
    const dismiss = buttons?.find((b) => b.style !== 'cancel') ?? buttons?.[0];
    dismiss?.onPress?.();
    return;
  }

  Alert.alert(title, message, buttons);
}
