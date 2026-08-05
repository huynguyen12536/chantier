import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ConfirmModal } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { resetCompanyDisabled, setCompanyDisabledHandler } from '@/utils/companyDisabled';

export function CompanyDisabledProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const { signOut } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    setCompanyDisabledHandler(() => setVisible(true));
    return () => setCompanyDisabledHandler(null);
  }, []);

  const handleOk = async () => {
    setVisible(false);
    resetCompanyDisabled();
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <>
      {children}
      <ConfirmModal
        visible={visible}
        title={t.companyDisabled.title}
        message={t.companyDisabled.message}
        cancelLabel={t.common.cancel}
        confirmLabel={t.common.ok}
        onCancel={handleOk}
        onConfirm={handleOk}
        singleButton
        iconVariant="warning"
        confirmVariant="primary"
      />
    </>
  );
}
