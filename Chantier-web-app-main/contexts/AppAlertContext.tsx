import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ConfirmModal } from '@/components/common';
import { useLanguage } from '@/contexts/LanguageContext';
import { setAppAlertHandler, type AppAlertButton } from '@/utils/appAlert';

type AlertState = {
  title: string;
  message: string;
  onDismiss?: () => void;
};

function pickDismissButton(buttons?: AppAlertButton[]): (() => void) | undefined {
  if (!buttons?.length) return undefined;
  const primary = buttons.find((b) => b.style !== 'cancel');
  return (primary ?? buttons[buttons.length - 1]).onPress;
}

export function AppAlertProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [alert, setAlert] = useState<AlertState | null>(null);

  const showAlert = useCallback((title: string, message: string, buttons?: AppAlertButton[]) => {
    setAlert({
      title,
      message,
      onDismiss: pickDismissButton(buttons),
    });
  }, []);

  useEffect(() => {
    setAppAlertHandler(showAlert);
    return () => setAppAlertHandler(null);
  }, [showAlert]);

  const dismiss = () => {
    const callback = alert?.onDismiss;
    setAlert(null);
    callback?.();
  };

  return (
    <>
      {children}
      <ConfirmModal
        visible={!!alert}
        title={alert?.title ?? ''}
        message={alert?.message ?? ''}
        cancelLabel=""
        confirmLabel={t.common.ok}
        onCancel={dismiss}
        onConfirm={dismiss}
        singleButton
        iconVariant="warning"
        confirmVariant="primary"
      />
    </>
  );
}
