// Builds the monthly / yearly office report as a real Excel file (.xlsx).
// ExcelJS is loaded only when the user clicks "Export", so it does not slow down page loads.

export interface SummaryRow {
  name: string;
  extraShiftsTotal: number;
  extraShiftsApproved: number;
  extraShiftsRejected: number;
  vacationDays: number;
  sickDays: number;
  reserveDays: number;
  pettyCashTotal: number;
  pettyCashUnpaid: number;
  missingDocuments: number;
}

export interface DetailRow {
  employee: string;
  type: string;
  status: string;
  from: Date;
  to: Date | null;
  days: number | null;
  details: string;
  amount: number | null;
  files: number | null;
  missingDocument: boolean;
}

export interface ReportLabels {
  title: string;
  summarySheet: string;
  detailsSheet: string;
  summaryHeaders: string[]; // 10 columns, in SummaryRow order
  detailHeaders: string[]; // 10 columns, in DetailRow order
  total: string;
  yes: string;
  rtl: boolean;
}

const HEADER_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1E3A8A' } };
const TOTAL_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFE5E7EB' } };
const MISSING_FILL = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFEF3C7' } };
const MONEY = '#,##0.00 ₪';
const DATE = 'dd/mm/yyyy';

// Excel stores dates without time zone; shift so the local calendar date is kept.
const excelDate = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

export async function buildReportWorkbook(summary: SummaryRow[], details: DetailRow[], labels: ReportLabels) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WorkLog';
  workbook.created = new Date();

  // ---------- Summary sheet ----------
  const s = workbook.addWorksheet(labels.summarySheet, {
    views: [{ rightToLeft: labels.rtl, state: 'frozen', ySplit: 3 }],
  });
  s.columns = [
    { width: 24 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 12 },
    { width: 12 }, { width: 12 }, { width: 16 }, { width: 18 }, { width: 14 },
  ];
  s.mergeCells(1, 1, 1, 10);
  s.getCell(1, 1).value = labels.title;
  s.getCell(1, 1).font = { bold: true, size: 14 };

  const header = s.getRow(3);
  header.values = labels.summaryHeaders;
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  header.height = 34;
  header.eachCell((cell) => { cell.fill = HEADER_FILL; });

  summary.forEach((r) => {
    s.addRow([
      r.name, r.extraShiftsTotal, r.extraShiftsApproved, r.extraShiftsRejected, r.vacationDays,
      r.sickDays, r.reserveDays, r.pettyCashTotal, r.pettyCashUnpaid, r.missingDocuments,
    ]);
  });

  const firstData = 4;
  const lastData = 3 + summary.length;
  if (summary.length > 0) {
    const totalRow = s.addRow([labels.total]);
    for (let col = 2; col <= 10; col++) {
      const letter = s.getColumn(col).letter;
      totalRow.getCell(col).value = { formula: `SUM(${letter}${firstData}:${letter}${lastData})` };
    }
    totalRow.font = { bold: true };
    totalRow.eachCell({ includeEmpty: true }, (cell) => { cell.fill = TOTAL_FILL; });
    s.autoFilter = { from: { row: 3, column: 1 }, to: { row: lastData, column: 10 } };
  }
  s.getColumn(8).numFmt = MONEY;
  s.getColumn(9).numFmt = MONEY;
  for (let col = 2; col <= 10; col++) s.getColumn(col).alignment = { horizontal: 'center' };

  // ---------- Details sheet ----------
  const d = workbook.addWorksheet(labels.detailsSheet, {
    views: [{ rightToLeft: labels.rtl, state: 'frozen', ySplit: 1 }],
  });
  d.columns = [
    { width: 22 }, { width: 16 }, { width: 14 }, { width: 13 }, { width: 13 },
    { width: 9 }, { width: 34 }, { width: 14 }, { width: 9 }, { width: 12 },
  ];
  const dHeader = d.getRow(1);
  dHeader.values = labels.detailHeaders;
  dHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  dHeader.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  dHeader.height = 30;
  dHeader.eachCell((cell) => { cell.fill = HEADER_FILL; });

  details.forEach((r) => {
    const row = d.addRow([
      r.employee, r.type, r.status, excelDate(r.from), r.to ? excelDate(r.to) : null,
      r.days, r.details, r.amount, r.files, r.missingDocument ? labels.yes : '',
    ]);
    if (r.missingDocument) row.eachCell({ includeEmpty: true }, (cell) => { cell.fill = MISSING_FILL; });
  });
  d.getColumn(4).numFmt = DATE;
  d.getColumn(5).numFmt = DATE;
  d.getColumn(8).numFmt = MONEY;
  [3, 4, 5, 6, 9, 10].forEach((col) => { d.getColumn(col).alignment = { horizontal: 'center' }; });
  if (details.length > 0) {
    d.autoFilter = { from: { row: 1, column: 1 }, to: { row: details.length + 1, column: 10 } };
  }

  return workbook;
}

/** Builds the workbook and starts the download in the browser. */
export async function downloadReport(
  fileName: string,
  summary: SummaryRow[],
  details: DetailRow[],
  labels: ReportLabels
) {
  const workbook = await buildReportWorkbook(summary, details, labels);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
