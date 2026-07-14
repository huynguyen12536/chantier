export const PAYROLL_RATES = {
  HOURLY_NORMAL: 15,
  HOURLY_SUPP: 22.5,
  MEAL_ALLOWANCE: 8.5,
  TRAVEL_ALLOWANCE: 12,
} as const;

export type PayrollDeclaration = {
  id: string;
  date: string;
  heures_normales: number;
  heures_supplementaires: number;
  nb_paniers: number;
  nb_deplacements: number;
  statut: string;
  chantiers: {
    nom: string;
    code: string;
  };
};

export type PayrollSummary = {
  totalHours: number;
  normalHours: number;
  suppHours: number;
  meals: number;
  travels: number;
  grossSalary: number;
  validatedSalary: number;
  entryCount: number;
};

export type PayrollPeriod = 'day' | 'week' | 'month' | 'year';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getPeriodRange(period: PayrollPeriod, reference = new Date()): { start: string; end: string; label: string } {
  const format = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (period === 'day') {
    const label = reference.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const value = format(reference);
    return { start: value, end: value, label };
  }

  if (period === 'week') {
    const monday = new Date(reference);
    const day = monday.getDay();
    monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return {
      start: format(monday),
      end: format(sunday),
      label: `${monday.toLocaleDateString('fr-FR')} – ${sunday.toLocaleDateString('fr-FR')}`,
    };
  }

  if (period === 'month') {
    const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
    const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
    return {
      start: format(start),
      end: format(end),
      label: start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    };
  }

  const start = new Date(reference.getFullYear(), 0, 1);
  const end = new Date(reference.getFullYear(), 11, 31);
  return {
    start: format(start),
    end: format(end),
    label: String(reference.getFullYear()),
  };
}

export function calculateDeclarationSalary(decl: Pick<
  PayrollDeclaration,
  'heures_normales' | 'heures_supplementaires' | 'nb_paniers' | 'nb_deplacements'
>): number {
  return (
    decl.heures_normales * PAYROLL_RATES.HOURLY_NORMAL +
    decl.heures_supplementaires * PAYROLL_RATES.HOURLY_SUPP +
    decl.nb_paniers * PAYROLL_RATES.MEAL_ALLOWANCE +
    decl.nb_deplacements * PAYROLL_RATES.TRAVEL_ALLOWANCE
  );
}

export function calculatePayrollSummary(declarations: PayrollDeclaration[]): PayrollSummary {
  return declarations.reduce<PayrollSummary>(
    (acc, decl) => {
      if (decl.statut === 'annulee') {
        return acc;
      }
      const hours = decl.heures_normales + decl.heures_supplementaires;
      const salary = calculateDeclarationSalary(decl);
      const isValidated = decl.statut === 'validee';

      acc.totalHours += hours;
      acc.normalHours += decl.heures_normales;
      acc.suppHours += decl.heures_supplementaires;
      acc.meals += decl.nb_paniers;
      acc.travels += decl.nb_deplacements;
      acc.grossSalary += salary;
      acc.validatedSalary += isValidated ? salary : 0;
      acc.entryCount += 1;
      return acc;
    },
    {
      totalHours: 0,
      normalHours: 0,
      suppHours: 0,
      meals: 0,
      travels: 0,
      grossSalary: 0,
      validatedSalary: 0,
      entryCount: 0,
    }
  );
}
