/** Une ligne = un jour travaillé (collaborateur × chantier × date). */
export type PayrollExportSourceRow = {
  userId: string;
  prenom: string;
  nom: string;
  chantierNom: string;
  chantierAdresse: string;
  /** ISO date YYYY-MM-DD */
  dateIso: string;
  nbreDeplacements: number;
  paniersRepas: number;
  totalHeures: number;
};

export type ExportCellValue = string | number;

export type PayrollExportSheetRow = {
  cells: ExportCellValue[];
  isSubtotal: boolean;
  isGrandTotal?: boolean;
  /** 0-based index for alternating collaborator group colors. */
  groupIndex?: number;
};

export type PayrollExportTable = {
  periodLabel: string;
  headers: string[];
  rows: PayrollExportSheetRow[];
};

export type PayrollExportColumnLabels = {
  id: string;
  collaborateur: string;
  chantier: string;
  date: string;
  nbreDeplacements: string;
  paniersRepas: string;
  totalHeures: string;
  subtotal: string;
  grandTotal: string;
};

import type { Language } from '@/i18n';

/** Locale BCP 47 pour en-têtes / période Excel selon langue UI. */
function exportLocaleTag(language: Language): string {
  return language === 'en' ? 'en-GB' : 'fr-FR';
}

/** Libellé période type "Jun-26" / "juil.-26" à partir de la date de fin d'export. */
export function formatExportPeriodLabel(endDateIso: string, language: Language = 'fr'): string {
  const [year, month] = endDateIso.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, 1);
  const monthPart = date.toLocaleDateString(exportLocaleTag(language), { month: 'short' });
  const yearPart = String(year).slice(-2);
  return `${monthPart}-${yearPart}`;
}

function capitalizeNamePart(value: string, language: Language): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const locale = exportLocaleTag(language);
  return trimmed.charAt(0).toLocaleUpperCase(locale) + trimmed.slice(1).toLocaleLowerCase(locale);
}

export function formatCollaborateurName(prenom: string, nom: string, language: Language = 'fr'): string {
  const first = capitalizeNamePart(prenom, language);
  const last = capitalizeNamePart(nom, language);
  return last ? `${first} ${last}` : first;
}

export function formatChantierCell(nom: string, adresse: string): string {
  const name = nom.trim();
  const address = adresse.trim();
  if (name && address) return `${name}\n${address}`;
  return name || address;
}

/** Affichage FR dd/mm/yyyy depuis ISO YYYY-MM-DD. */
export function formatExportDateDisplay(dateIso: string): string {
  const parts = dateIso.split('-');
  if (parts.length !== 3) return dateIso;
  const [y, m, d] = parts;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}

export function dayOfMonthFromIso(dateIso: string): string {
  const parts = dateIso.split('-');
  return (parts[2] ?? '01').padStart(2, '0');
}

export function buildPayrollExportTable(
  data: PayrollExportSourceRow[],
  periodEnd: string,
  labels: PayrollExportColumnLabels,
  language: Language = 'fr',
): PayrollExportTable {
  const headerUpperLocale = exportLocaleTag(language);
  const headers = [
    labels.id,
    labels.collaborateur,
    labels.chantier,
    labels.date,
    labels.totalHeures,
    labels.nbreDeplacements,
    labels.paniersRepas,
  ].map((label) => label.toLocaleUpperCase(headerUpperLocale));

  const byUser = new Map<string, PayrollExportSourceRow[]>();
  for (const row of data) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }

  const sortedUsers = [...byUser.entries()].sort(([, a], [, b]) => {
    const nameA = formatCollaborateurName(a[0].prenom, a[0].nom, language);
    const nameB = formatCollaborateurName(b[0].prenom, b[0].nom, language);
    return nameA.localeCompare(nameB, headerUpperLocale);
  });

  const rows: PayrollExportSheetRow[] = [];
  let personIndex = 0;
  let grandTotalDeplacements = 0;
  let grandTotalPaniers = 0;
  let grandTotalHeures = 0;

  for (const [, dayRows] of sortedUsers) {
    personIndex += 1;
    const groupIndex = personIndex - 1;
    dayRows.sort((a, b) => {
      const byDate = a.dateIso.localeCompare(b.dateIso);
      if (byDate !== 0) return byDate;
      return a.chantierNom.localeCompare(b.chantierNom, headerUpperLocale);
    });

    let totalDeplacements = 0;
    let totalPaniers = 0;
    let totalHeures = 0;

    dayRows.forEach((row, index) => {
      totalDeplacements += row.nbreDeplacements;
      totalPaniers += row.paniersRepas;
      totalHeures += row.totalHeures;

      rows.push({
        isSubtotal: false,
        groupIndex,
        cells: [
          index === 0 ? String(personIndex) : '',
          index === 0 ? formatCollaborateurName(row.prenom, row.nom, language) : '',
          formatChantierCell(row.chantierNom, row.chantierAdresse),
          row.dateIso,
          roundExportNumber(row.totalHeures),
          roundExportNumber(row.nbreDeplacements),
          row.paniersRepas,
        ],
      });
    });

    grandTotalDeplacements += totalDeplacements;
    grandTotalPaniers += totalPaniers;
    grandTotalHeures += totalHeures;

    rows.push({
      isSubtotal: true,
      groupIndex,
      cells: [
        '',
        '',
        labels.subtotal,
        '',
        roundExportNumber(totalHeures),
        roundExportNumber(totalDeplacements),
        totalPaniers,
      ],
    });
  }

  rows.push({
    isSubtotal: false,
    isGrandTotal: true,
    cells: [
      '',
      labels.grandTotal,
      '',
      '',
      roundExportNumber(grandTotalHeures),
      roundExportNumber(grandTotalDeplacements),
      grandTotalPaniers,
    ],
  });

  return {
    periodLabel: formatExportPeriodLabel(periodEnd, language),
    headers,
    rows,
  };
}

export function roundExportNumber(value: number): number {
  if (Number.isInteger(value)) return value;
  return Math.round(value * 10) / 10;
}

/** Aplatit le tableau pour CSV (dates en dd/mm/yyyy). */
export function flattenPayrollExportForCsv(table: PayrollExportTable): string[][] {
  return table.rows.map((row) =>
    row.cells.map((cell, index) => {
      // Col Date = index 3
      if (index === 3 && typeof cell === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cell)) {
        return formatExportDateDisplay(cell);
      }
      return String(cell);
    }),
  );
}
