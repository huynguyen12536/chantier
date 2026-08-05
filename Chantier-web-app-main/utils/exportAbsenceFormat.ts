import type { Absence, Language } from '@/types';
import type { Translations } from '@/i18n';
import { formatExportDateDisplay, formatCollaborateurName } from '@/utils/exportPayrollFormat';
import type { PayrollExportSheetRow } from '@/utils/exportPayrollFormat';
import { formatDateKey } from '@/utils/date';
import { getMotifLabel, getAbsenceReason, formatAbsenceDuration } from '@/utils/absenceFormat';

export type AbsenceExportColumnLabels = {
  collaborateur: string;
  dateDebut: string;
  dateFin: string;
  duration: string;
  motif: string;
  reason: string;
};

export type AbsenceExportTable = {
  periodLabel: string;
  headers: string[];
  rows: PayrollExportSheetRow[];
};

/** First and last day of the calendar month after `reference`. */
export function getNextMonthRange(reference = new Date()): { start: string; end: string } {
  const start = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 2, 0);
  return { start: formatDateKey(start), end: formatDateKey(end) };
}

export function formatAbsenceExportPeriodLabel(
  start: string,
  end: string,
  language: Language,
): string {
  const locale = language === 'en' ? 'en-GB' : 'fr-FR';
  const startDate = new Date(`${start}T00:00:00`);
  if (Number.isNaN(startDate.getTime())) return `${start} – ${end}`;
  const month = startDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  return month.charAt(0).toUpperCase() + month.slice(1);
}

export function buildAbsenceExportTable(
  absences: Absence[],
  range: { start: string; end: string },
  labels: AbsenceExportColumnLabels,
  t: Translations,
  language: Language,
): AbsenceExportTable {
  const locale = language === 'en' ? 'en-GB' : 'fr-FR';
  const headers = [
    labels.collaborateur,
    labels.dateDebut,
    labels.dateFin,
    labels.duration,
    labels.motif,
    labels.reason,
  ].map((label) => label.toLocaleUpperCase(locale));

  const sorted = [...absences].sort((a, b) => {
    const nameA = formatCollaborateurName(a.profiles?.prenom ?? '', a.profiles?.nom ?? '', language);
    const nameB = formatCollaborateurName(b.profiles?.prenom ?? '', b.profiles?.nom ?? '', language);
    const byName = nameA.localeCompare(nameB, locale);
    if (byName !== 0) return byName;
    return a.date_debut.localeCompare(b.date_debut);
  });

  const rows: PayrollExportSheetRow[] = sorted.map((row) => {
    return {
      cells: [
        formatCollaborateurName(row.profiles?.prenom ?? '', row.profiles?.nom ?? '', language),
        formatExportDateDisplay(row.date_debut),
        formatExportDateDisplay(row.date_fin),
        formatAbsenceDuration(row.date_debut, row.date_fin, t),
        getMotifLabel(row.motif, t),
        getAbsenceReason(row.commentaire),
      ],
      isSubtotal: false,
      isGrandTotal: false,
    };
  });

  return {
    periodLabel: formatAbsenceExportPeriodLabel(range.start, range.end, language),
    headers,
    rows,
  };
}
