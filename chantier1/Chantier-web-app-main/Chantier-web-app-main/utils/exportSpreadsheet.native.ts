import { Share } from 'react-native';
import { buildCsvContent } from './exportSpreadsheet.shared';

export * from './exportSpreadsheet.shared';

/** Non utilisé sur mobile — export via CSV + partage système. */
export async function buildExportWorkbookBuffer(): Promise<ArrayBuffer> {
  throw new Error('buildExportWorkbookBuffer is only available on web');
}

export function downloadExcelBuffer(): void {
  throw new Error('downloadExcelBuffer is only available on web');
}

export async function shareExportCsv(
  headers: string[],
  rows: string[][],
  filename: string,
): Promise<void> {
  const csv = buildCsvContent(headers, rows);
  await Share.share({
    title: filename,
    message: csv,
  });
}
