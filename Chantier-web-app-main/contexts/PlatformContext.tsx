import React, { createContext, useContext, useMemo, useState } from 'react';
import { Company } from '@/types';

type PlatformContextType = {
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  companies: Company[];
  setCompanies: (list: Company[]) => void;
};

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  const value = useMemo(
    () => ({ selectedCompanyId, setSelectedCompanyId, companies, setCompanies }),
    [selectedCompanyId, companies],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error('usePlatform requires PlatformProvider');
  return ctx;
}
