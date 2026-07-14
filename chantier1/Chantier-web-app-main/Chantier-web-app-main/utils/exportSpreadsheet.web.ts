import ExcelJS from 'exceljs';
import type { PayrollExportSheetRow } from './exportPayrollFormat';
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
const COL_DEPLACEMENTS = 4;
const COL_JOURS = 5;
const COL_PANIERS = 6;

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

  const colWidths = computeColumnWidthsExcel(headers, flatRows);
  colWidths.forEach((width, index) => {
    const column = sheet.getColumn(index + 1);
    column.width = index === COL_CHANTIER - 1 ? Math.max(width, 36) : width;
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
    }

    dataRow.height = isGrandTotal ? 24 : isSubtotal ? 22 : 48;

    dataRow.eachCell((cell, colNumber) => {
      const isChantierCol = colNumber === COL_CHANTIER;
      const isNumericCol = colNumber === COL_DEPLACEMENTS || colNumber === COL_PANIERS;
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
          horizontal: isChantierCol || colNumber === COL_COLLAB ? 'left' : isNumericCol ? 'center' : 'left',
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
  const flatRows = rows.map((r) => r.cells);
  const lines = [
    escape(periodLabel),
    headers.map(escape).join(';'),
    ...flatRows.map((row) => row.map((cell) => escape(String(cell ?? ''))).join(';')),
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
