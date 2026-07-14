import { Colors } from '@/constants/colors';

export const EXPORT_TABLE_HEADER_BG = Colors.primary;
export const EXPORT_TABLE_HEADER_TEXT = '#FFFFFF';

/** Index 0-based — colonnes avec texte orange gras dans le corps du tableau. */
export const EXPORT_COL_MATRICULE = 0;
export const EXPORT_COL_WORKSITE_CODE = 3;

export const EXPORT_ACCENT_COLUMNS = [EXPORT_COL_MATRICULE, EXPORT_COL_WORKSITE_CODE] as const;

export function isExportAccentColumn(colIndex: number): boolean {
  return (EXPORT_ACCENT_COLUMNS as readonly number[]).includes(colIndex);
}

/** Largeur colonne Excel (unité caractères) avec marge pour la lisibilité. */
export function computeColumnWidthsExcel(headers: string[], rows: string[][]): number[] {
  const colCount = headers.length;
  return Array.from({ length: colCount }, (_, col) => {
    const texts = [headers[col], ...rows.map((row) => String(row[col] ?? ''))];
    const maxChars = Math.max(...texts.map((t) => t.length), 4);
    return Math.min(48, Math.max(12, maxChars + 6));
  });
}

/** @deprecated alias pour l'aperçu UI */
export function computeColumnWidthsPt(headers: string[], rows: string[][]): number[] {
  return computeColumnWidthsExcel(headers, rows);
}

export function buildCsvContent(headers: string[], rows: string[][]): string {
  const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(';'),
    ...rows.map((row) => row.map((cell) => escape(String(cell ?? ''))).join(';')),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}
