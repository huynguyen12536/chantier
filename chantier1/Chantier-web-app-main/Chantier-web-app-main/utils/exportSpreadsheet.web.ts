import ExcelJS from 'exceljs';
import type { PayrollExportSheetRow } from './exportPayrollFormat';
import { formatExportDateDisplay } from './exportPayrollFormat';
import { computeColumnWidthsExcel } from './exportSpreadsheet.shared';

export * from './exportSpreadsheet.shared';

const COLORS = {
  darkBlue: 'FF6E8EB5',
  lightBlue: 'FFF0F5FA',
  blueText: 'FF6B8499',
  headerText: 'FF1F2937',
  chantierName: 'FF2E5078',
  chantierAddress: 'FF000000',
  white: 'FFFFFFFF',
  bodyText: 'FF404040',
  mutedText: 'FF909090',
  border: 'FFE8EDF2',
  groupFills: ['FFF4F9F5', 'FFFFFBF4', 'FFF5F9FC', 'FFF8F6FA'],
} as const;

const COL_ID = 1;
const COL_COLLAB = 2;
const COL_CHANTIER = 3;
const COL_DATE = 4;
const COL_TOTAL_HEURES = 5;
const COL_DEPLACEMENTS = 6;
const COL_PANIERS = 7;

function applyCellBorder(cell: ExcelJS.Cell): void {
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  };
}

function applySolidFill(cell: ExcelJS.Cell, argb: string): void {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function numericCellValue(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function applyNumericCellFormat(cell: ExcelJS.Cell, colNumber: number, raw: unknown): void {
  const value = numericCellValue(raw);
  if (value == null) return;

  cell.value = value;
  if (colNumber === COL_TOTAL_HEURES) {
    cell.numFmt = Number.isInteger(value) ? '0' : '0.0';
  } else {
    cell.numFmt = '0';
  }
}

function setChantierRichText(cell: ExcelJS.Cell, text: string): void {
  const newlineIndex = text.indexOf('\n');
  if (newlineIndex <= 0) {
    cell.font = {
      bold: true,
      size: 11,
      name: 'Calibri',
      color: { argb: COLORS.chantierName },
    };
    return;
  }

  cell.value = {
    richText: [
      {
        text: text.slice(0, newlineIndex),
        font: { bold: true, size: 11, name: 'Calibri', color: { argb: COLORS.chantierName } },
      },
      {
        text: `\n${text.slice(newlineIndex + 1)}`,
        font: { size: 9, name: 'Calibri', color: { argb: COLORS.chantierAddress } },
      },
    ],
  };
}

export async function buildExportWorkbookBuffer(
  periodLabel: string,
  headers: string[],
  rows: PayrollExportSheetRow[],
  sheetName = 'Export',
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Chantier App';
  workbook.created = new Date();

  const flatRows = rows.map((row) => row.cells);
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 2, activeCell: 'A3' }],
  });

  sheet.getColumn(COL_TOTAL_HEURES).numFmt = '0.0';
  sheet.getColumn(COL_DEPLACEMENTS).numFmt = '0';
  sheet.getColumn(COL_PANIERS).numFmt = '0';

  const colWidths = computeColumnWidthsExcel(headers, flatRows);
  colWidths.forEach((width, index) => {
    const column = sheet.getColumn(index + 1);
    if (index === COL_CHANTIER - 1) {
      column.width = Math.max(width, 36);
    } else if (index === COL_DATE - 1) {
      column.width = Math.max(width, 14);
    } else {
      column.width = width;
    }
  });

  const periodRow = sheet.addRow([periodLabel]);
  periodRow.height = 24;
  sheet.mergeCells(1, 1, 1, headers.length);
  const periodCell = periodRow.getCell(1);
  periodCell.font = { bold: true, size: 12, name: 'Calibri', color: { argb: COLORS.white } };
  periodCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  applySolidFill(periodCell, COLORS.darkBlue);
  applyCellBorder(periodCell);

  const headerRow = sheet.addRow(headers);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.headerText }, size: 11, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    applySolidFill(cell, COLORS.lightBlue);
    applyCellBorder(cell);
  });

  let groupStartRow: number | null = null;
  let dateMergeStartRow: number | null = null;
  let dateMergeIso: string | null = null;
  let lastDataRowNumber: number | null = null;

  const flushDateMerge = () => {
    if (
      dateMergeStartRow != null
      && lastDataRowNumber != null
      && lastDataRowNumber > dateMergeStartRow
    ) {
      sheet.mergeCells(dateMergeStartRow, COL_DATE, lastDataRowNumber, COL_DATE);
      const dateCell = sheet.getCell(dateMergeStartRow, COL_DATE);
      dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
    dateMergeStartRow = null;
    dateMergeIso = null;
    lastDataRowNumber = null;
  };

  rows.forEach((row) => {
    const dataRow = sheet.addRow(row.cells);
    const rowNumber = dataRow.number;
    const isGrandTotal = Boolean(row.isGrandTotal);
    const isSubtotal = row.isSubtotal;
    const groupFill = COLORS.groupFills[(row.groupIndex ?? 0) % COLORS.groupFills.length];

    if (!isSubtotal && !isGrandTotal) {
      if (groupStartRow === null) {
        groupStartRow = rowNumber;
      }

      const dateIso = String(row.cells[COL_DATE - 1] ?? '');
      if (dateMergeStartRow == null) {
        dateMergeStartRow = rowNumber;
        dateMergeIso = dateIso;
      } else if (dateIso !== dateMergeIso) {
        flushDateMerge();
        dateMergeStartRow = rowNumber;
        dateMergeIso = dateIso;
      }
      lastDataRowNumber = rowNumber;
    } else {
      flushDateMerge();
    }

    dataRow.height = isGrandTotal ? 24 : isSubtotal ? 22 : 36;

    dataRow.eachCell((cell, colNumber) => {
      const isChantierCol = colNumber === COL_CHANTIER;
      const isDateCol = colNumber === COL_DATE;
      const isNumericCol =
        colNumber === COL_DEPLACEMENTS
        || colNumber === COL_PANIERS
        || colNumber === COL_TOTAL_HEURES;
      const isIdOrCollabCol = colNumber === COL_ID || colNumber === COL_COLLAB;

      if (isGrandTotal) {
        cell.font = {
          size: 11,
          name: 'Calibri',
          bold: true,
          color: { argb: COLORS.white },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === COL_COLLAB ? 'left' : isNumericCol ? 'center' : 'left',
          indent: colNumber === COL_COLLAB ? 1 : 0,
        };
        applySolidFill(cell, COLORS.darkBlue);
      } else if (isSubtotal) {
        cell.font = {
          size: 11,
          name: 'Calibri',
          bold: true,
          color: { argb: COLORS.chantierAddress },
        };
        cell.alignment = {
          vertical: 'middle',
          horizontal: isChantierCol || colNumber === COL_COLLAB ? 'left' : isNumericCol || isDateCol ? 'center' : 'left',
          indent: isChantierCol ? 1 : 0,
        };
        applySolidFill(cell, COLORS.lightBlue);
      } else {
        cell.font = {
          size: 11,
          name: 'Calibri',
          bold: isNumericCol,
          color: { argb: isNumericCol ? COLORS.headerText : COLORS.bodyText },
        };
        cell.alignment = {
          vertical: isChantierCol ? 'top' : 'middle',
          horizontal: isChantierCol || isIdOrCollabCol ? 'left' : 'center',
          wrapText: isChantierCol,
          indent: isChantierCol || isIdOrCollabCol ? 1 : 0,
        };

        if (isIdOrCollabCol) {
          applySolidFill(cell, groupFill);
        }

        if (isChantierCol) {
          setChantierRichText(cell, String(cell.value ?? ''));
        }

        if (isDateCol) {
          const iso = String(cell.value ?? '');
          const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
          if (match) {
            const year = Number(match[1]);
            const month = Number(match[2]);
            const day = Number(match[3]);
            cell.value = new Date(year, month - 1, day);
            cell.numFmt = 'dd/mm/yyyy';
          }
        }
      }

      if (isNumericCol) {
        applyNumericCellFormat(cell, colNumber, row.cells[colNumber - 1]);
      }

      applyCellBorder(cell);
    });

    if (isSubtotal && groupStartRow !== null) {
      const groupEndRow = rowNumber - 1;
      if (groupEndRow >= groupStartRow) {
        sheet.mergeCells(groupStartRow, COL_ID, groupEndRow, COL_ID);
        sheet.mergeCells(groupStartRow, COL_COLLAB, groupEndRow, COL_COLLAB);

        const idCell = sheet.getCell(groupStartRow, COL_ID);
        idCell.alignment = { vertical: 'middle', horizontal: 'center' };

        const collabCell = sheet.getCell(groupStartRow, COL_COLLAB);
        collabCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      }
      groupStartRow = null;
    }
  });

  flushDateMerge();

  const lastRow = sheet.rowCount;
  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: lastRow, column: headers.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}

export function downloadExcelBuffer(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerBlobDownload(blob, filename);
}

export function downloadCsvFallback(
  periodLabel: string,
  headers: string[],
  rows: PayrollExportSheetRow[],
  filename: string,
): void {
  const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
  const flatRows = rows.map((r) =>
    r.cells.map((cell, index) => {
      if (index === COL_DATE - 1 && /^\d{4}-\d{2}-\d{2}$/.test(String(cell ?? ''))) {
        return formatExportDateDisplay(String(cell));
      }
      return String(cell ?? '');
    }),
  );
  const lines = [
    escape(periodLabel),
    headers.map(escape).join(';'),
    ...flatRows.map((row) => row.map((cell) => escape(cell)).join(';')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, filename);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    if (document.body.contains(link)) {
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  }, 3000);
}
