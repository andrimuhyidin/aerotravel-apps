/**
 * Excel/CSV Export Utilities
 * Generate downloadable reports from data
 */

import ExcelJS from 'exceljs';

export type ExportColumn = {
  header: string;
  key: string;
  width?: number;
  type?: 'string' | 'number' | 'currency' | 'date' | 'percent';
  format?: string;
};

export type ExportOptions = {
  filename: string;
  sheetName?: string;
  title?: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  includeSum?: string[];
  dateFormat?: string;
  currencySymbol?: string;
};

/**
 * Export data to Excel file
 */
export async function exportToExcel(options: ExportOptions): Promise<Buffer> {
  const {
    filename,
    sheetName = 'Data',
    title,
    subtitle,
    columns,
    data,
    includeSum = [],
    dateFormat = 'dd/mm/yyyy',
    currencySymbol = 'Rp ',
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MyAeroTravel';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName);

  let startRow = 1;

  // Add title
  if (title) {
    worksheet.mergeCells(startRow, 1, startRow, columns.length);
    const titleCell = worksheet.getCell(startRow, 1);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };
    startRow++;
  }

  // Add subtitle
  if (subtitle) {
    worksheet.mergeCells(startRow, 1, startRow, columns.length);
    const subtitleCell = worksheet.getCell(startRow, 1);
    subtitleCell.value = subtitle;
    subtitleCell.font = { size: 12, color: { argb: 'FF666666' } };
    subtitleCell.alignment = { horizontal: 'center' };
    startRow++;
  }

  // Add empty row after header
  if (title || subtitle) {
    startRow++;
  }

  // Configure columns
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
  }));

  // Add header row
  const headerRow = worksheet.getRow(startRow);
  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF3B82F6' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 30;
  startRow++;

  // Add data rows
  data.forEach((row, rowIndex) => {
    const dataRow = worksheet.getRow(startRow + rowIndex);
    columns.forEach((col, colIndex) => {
      const cell = dataRow.getCell(colIndex + 1);
      const value = row[col.key];

      // Format based on type
      switch (col.type) {
        case 'currency':
          cell.value = typeof value === 'number' ? value : 0;
          cell.numFmt = `"${currencySymbol}"#,##0`;
          break;
        case 'percent':
          cell.value = typeof value === 'number' ? value / 100 : 0;
          cell.numFmt = '0.00%';
          break;
        case 'date':
          if (value) {
            cell.value = new Date(value as string);
            cell.numFmt = dateFormat;
          }
          break;
        case 'number':
          cell.value = typeof value === 'number' ? value : 0;
          cell.numFmt = '#,##0';
          break;
        default:
          cell.value = value as string | number;
      }

      // Add borders
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };

      // Alternate row colors
      if (rowIndex % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' },
        };
      }
    });
  });

  // Add sum row if needed
  if (includeSum.length > 0 && data.length > 0) {
    const sumRowNum = startRow + data.length;
    const sumRow = worksheet.getRow(sumRowNum);

    sumRow.getCell(1).value = 'Total';
    sumRow.getCell(1).font = { bold: true };

    columns.forEach((col, colIndex) => {
      if (includeSum.includes(col.key)) {
        const startCell = `${String.fromCharCode(65 + colIndex)}${startRow}`;
        const endCell = `${String.fromCharCode(65 + colIndex)}${sumRowNum - 1}`;
        const cell = sumRow.getCell(colIndex + 1);
        cell.value = { formula: `SUM(${startCell}:${endCell})` };
        cell.font = { bold: true };
        if (col.type === 'currency') {
          cell.numFmt = `"${currencySymbol}"#,##0`;
        }
      }
    });

    sumRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' },
      };
    });
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Export data to CSV string
 */
export function exportToCSV(columns: ExportColumn[], data: Record<string, unknown>[]): string {
  // Header row
  const header = columns.map((col) => `"${col.header}"`).join(',');

  // Data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key];
        if (value === null || value === undefined) return '""';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === 'number') return value.toString();
        if (value instanceof Date) return `"${value.toISOString()}"`;
        return `"${String(value)}"`;
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Trigger download in browser
 */
export function downloadFile(content: Buffer | string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Export helper for common report types
 */
export const ReportExporter = {
  async bookings(data: Record<string, unknown>[], filename = 'bookings') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Bookings',
      title: 'Laporan Booking',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Kode', key: 'code', width: 15 },
        { header: 'Tanggal', key: 'trip_date', type: 'date', width: 12 },
        { header: 'Customer', key: 'customer_name', width: 25 },
        { header: 'Paket', key: 'package_name', width: 30 },
        { header: 'Pax', key: 'total_pax', type: 'number', width: 8 },
        { header: 'Total', key: 'total_amount', type: 'currency', width: 18 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      data,
      includeSum: ['total_amount'],
    });
  },

  async revenue(data: Record<string, unknown>[], filename = 'revenue') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Revenue',
      title: 'Laporan Pendapatan',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Periode', key: 'period', width: 15 },
        { header: 'Jumlah Booking', key: 'booking_count', type: 'number', width: 15 },
        { header: 'Revenue', key: 'revenue', type: 'currency', width: 18 },
        { header: 'Growth', key: 'growth', type: 'percent', width: 12 },
      ],
      data,
      includeSum: ['booking_count', 'revenue'],
    });
  },
};
