/** Données agrégées par collaborateur × chantier pour l'export paie. */
export type PayrollExportSourceRow = {
  userId: string;
  prenom: string;
  nom: string;
  chantierNom: string;
  chantierAdresse: string;
  jours: string[];
  nbreDeplacements: number;
  paniersRepas: number;
};

export type PayrollExportSheetRow = {
  cells: string[];
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
  nbreDeplacements: string;
  listeJours: string;
  paniersRepas: string;
  subtotal: string;
  grandTotal: string;
};

/** Libellé période type "Jun-26" à partir de la date de fin d'export. */
export function formatExportPeriodLabel(endDateIso: string): string {
  const [year, month] = endDateIso.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, 1);
  const monthPart = date.toLocaleDateString('en-US', { month: 'short' });
  const yearPart = String(year).slice(-2);
  return `${monthPart}-${yearPart}`;
}

function capitalizeNamePart(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toLocaleUpperCase('fr') + trimmed.slice(1).toLocaleLowerCase('fr');
}

export function formatCollaborateurName(prenom: string, nom: string): string {
  const first = capitalizeNamePart(prenom);
  const last = capitalizeNamePart(nom);
  return last ? `${first} ${last}` : first;
}

export function formatChantierCell(nom: string, adresse: string): string {
  const name = nom.trim();
  const address = adresse.trim();
  if (name && address) return `${name}\n${address}`;
  return name || address;
}

export function formatListeJours(jours: string[]): string {
  const unique = [...new Set(jours.map((d) => d.padStart(2, '0')))];
  unique.sort((a, b) => Number(a) - Number(b));
  return unique.join(',');
}

export function dayOfMonthFromIso(dateIso: string): string {
  const parts = dateIso.split('-');
  return (parts[2] ?? '01').padStart(2, '0');
}

export function buildPayrollExportTable(
  data: PayrollExportSourceRow[],
  periodEnd: string,
  labels: PayrollExportColumnLabels,
): PayrollExportTable {
  const headers = [
    labels.id,
    labels.collaborateur,
    labels.chantier,
    labels.nbreDeplacements,
    labels.listeJours,
    labels.paniersRepas,
  ].map((label) => label.toLocaleUpperCase('fr'));

  const byUser = new Map<string, PayrollExportSourceRow[]>();
  for (const row of data) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }

  const sortedUsers = [...byUser.entries()].sort(([, a], [, b]) => {
    const nameA = formatCollaborateurName(a[0].prenom, a[0].nom);
    const nameB = formatCollaborateurName(b[0].prenom, b[0].nom);
    return nameA.localeCompare(nameB, 'fr');
  });

  const rows: PayrollExportSheetRow[] = [];
  let personIndex = 0;
  let grandTotalDeplacements = 0;
  let grandTotalPaniers = 0;

  for (const [, chantierRows] of sortedUsers) {
    personIndex += 1;
    const groupIndex = personIndex - 1;
    chantierRows.sort((a, b) => a.chantierNom.localeCompare(b.chantierNom, 'fr'));

    let totalDeplacements = 0;
    let totalPaniers = 0;

    chantierRows.forEach((row, index) => {
      totalDeplacements += row.nbreDeplacements;
      totalPaniers += row.paniersRepas;

      rows.push({
        isSubtotal: false,
        groupIndex,
        cells: [
          index === 0 ? String(personIndex) : '',
          index === 0 ? formatCollaborateurName(row.prenom, row.nom) : '',
          formatChantierCell(row.chantierNom, row.chantierAdresse),
          formatExportNumber(row.nbreDeplacements),
          formatListeJours(row.jours),
          String(row.paniersRepas),
        ],
      });
    });

    grandTotalDeplacements += totalDeplacements;
    grandTotalPaniers += totalPaniers;

    rows.push({
      isSubtotal: true,
      groupIndex,
      cells: [
        '',
        '',
        labels.subtotal,
        formatExportNumber(totalDeplacements),
        '',
        String(totalPaniers),
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
      formatExportNumber(grandTotalDeplacements),
      '',
      String(grandTotalPaniers),
    ],
  });

  return {
    periodLabel: formatExportPeriodLabel(periodEnd),
    headers,
    rows,
  };
}

function formatExportNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 10) / 10);
}

/** Aplatit le tableau pour CSV (sans distinction sous-total). */
export function flattenPayrollExportForCsv(table: PayrollExportTable): string[][] {
  return table.rows.map((row) => row.cells);
}
