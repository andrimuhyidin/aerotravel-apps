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
    filename: _filename,
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

  async customers(data: Record<string, unknown>[], filename = 'customers') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Customers',
      title: 'Customer List',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Name', key: 'full_name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Total Bookings', key: 'total_bookings', type: 'number', width: 15 },
        { header: 'Total Spent', key: 'total_spent', type: 'currency', width: 18 },
        { header: 'Last Booking', key: 'last_booking_date', type: 'date', width: 12 },
        { header: 'Segment', key: 'segment', width: 12 },
      ],
      data,
      includeSum: ['total_spent'],
    });
  },

  async guidePerformance(data: Record<string, unknown>[], filename = 'guide-performance') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Guide Performance',
      title: 'Guide Performance Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Guide Name', key: 'guide_name', width: 25 },
        { header: 'Total Trips', key: 'total_trips', type: 'number', width: 12 },
        { header: 'Total Pax', key: 'total_pax', type: 'number', width: 12 },
        { header: 'Average Rating', key: 'avg_rating', type: 'number', width: 15 },
        { header: 'Total Revenue', key: 'total_revenue', type: 'currency', width: 18 },
        { header: 'Last Trip', key: 'last_trip_date', type: 'date', width: 12 },
      ],
      data,
      includeSum: ['total_trips', 'total_pax', 'total_revenue'],
    });
  },

  async pnl(data: Record<string, unknown>[], filename = 'pnl') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'P&L',
      title: 'Profit & Loss Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Trip Code', key: 'trip_code', width: 15 },
        { header: 'Package', key: 'package_name', width: 30 },
        { header: 'Revenue', key: 'revenue', type: 'currency', width: 18 },
        { header: 'Cost', key: 'cost', type: 'currency', width: 18 },
        { header: 'Profit', key: 'profit', type: 'currency', width: 18 },
        { header: 'Margin %', key: 'margin', type: 'percent', width: 12 },
      ],
      data,
      includeSum: ['revenue', 'cost', 'profit'],
    });
  },

  async users(data: Record<string, unknown>[], filename = 'users') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Users',
      title: 'User List',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Name', key: 'full_name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Role', key: 'role', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Created At', key: 'created_at', type: 'date', width: 12 },
      ],
      data,
    });
  },

  async partners(data: Record<string, unknown>[], filename = 'partners') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Partners',
      title: 'Partner List',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Partner Name', key: 'name', width: 30 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'Contact Person', key: 'contact_person', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'Tier', key: 'tier', width: 12 },
        { header: 'Total Revenue', key: 'total_revenue', type: 'currency', width: 18 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      data,
      includeSum: ['total_revenue'],
    });
  },

  async products(data: Record<string, unknown>[], filename = 'products') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Products',
      title: 'Product/Package List',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Name', key: 'name', width: 35 },
        { header: 'Destination', key: 'destination', width: 20 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Duration', key: 'duration', width: 12 },
        { header: 'Base Price', key: 'base_price', type: 'currency', width: 18 },
        { header: 'Total Bookings', key: 'total_bookings', type: 'number', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      data,
    });
  },

  async auditLogs(data: Record<string, unknown>[], filename = 'audit-logs') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Audit Logs',
      title: 'Audit Log Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Timestamp', key: 'created_at', type: 'date', width: 18 },
        { header: 'Action', key: 'action', width: 20 },
        { header: 'Resource', key: 'resource_type', width: 15 },
        { header: 'Resource ID', key: 'resource_id', width: 25 },
        { header: 'User', key: 'user_name', width: 25 },
        { header: 'IP Address', key: 'ip_address', width: 15 },
        { header: 'Details', key: 'details', width: 40 },
      ],
      data,
    });
  },

  async guides(data: Record<string, unknown>[], filename = 'guides') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Guides',
      title: 'Guide List',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Name', key: 'full_name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Phone', key: 'phone', width: 15 },
        { header: 'License No', key: 'license_number', width: 20 },
        { header: 'License Expiry', key: 'license_expiry', type: 'date', width: 12 },
        { header: 'Total Trips', key: 'total_trips', type: 'number', width: 12 },
        { header: 'Avg Rating', key: 'avg_rating', type: 'number', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      data,
    });
  },

  async inventory(data: Record<string, unknown>[], filename = 'inventory') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Inventory',
      title: 'Inventory Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Item Name', key: 'name', width: 30 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Quantity', key: 'quantity', type: 'number', width: 12 },
        { header: 'Unit', key: 'unit', width: 10 },
        { header: 'Unit Price', key: 'unit_price', type: 'currency', width: 15 },
        { header: 'Total Value', key: 'total_value', type: 'currency', width: 18 },
        { header: 'Reorder Level', key: 'reorder_level', type: 'number', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      data,
      includeSum: ['total_value'],
    });
  },

  async refunds(data: Record<string, unknown>[], filename = 'refunds') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Refunds',
      title: 'Refund Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Booking Code', key: 'booking_code', width: 15 },
        { header: 'Customer', key: 'customer_name', width: 25 },
        { header: 'Original Amount', key: 'original_amount', type: 'currency', width: 18 },
        { header: 'Refund Amount', key: 'refund_amount', type: 'currency', width: 18 },
        { header: 'Refund %', key: 'refund_percentage', type: 'percent', width: 12 },
        { header: 'Policy', key: 'cancellation_policy', width: 20 },
        { header: 'Method', key: 'refund_method', width: 15 },
        { header: 'Status', key: 'refund_status', width: 12 },
        { header: 'Created', key: 'created_at', type: 'date', width: 12 },
      ],
      data,
      includeSum: ['refund_amount'],
    });
  },

  async payments(data: Record<string, unknown>[], filename = 'payments') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Payments',
      title: 'Payment Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Booking Code', key: 'booking_code', width: 15 },
        { header: 'Customer', key: 'customer_name', width: 25 },
        { header: 'Amount', key: 'amount', type: 'currency', width: 18 },
        { header: 'Method', key: 'payment_method', width: 15 },
        { header: 'Channel', key: 'payment_channel', width: 15 },
        { header: 'Payment Status', key: 'status', width: 15 },
        { header: 'Verification', key: 'verification_status', width: 15 },
        { header: 'Created', key: 'created_at', type: 'date', width: 12 },
      ],
      data,
      includeSum: ['amount'],
    });
  },

  async complianceLicenses(data: Record<string, unknown>[], filename = 'licenses') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Licenses',
      title: 'License & Permit Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'License Name', key: 'name', width: 30 },
        { header: 'Type', key: 'type', width: 15 },
        { header: 'License Number', key: 'license_number', width: 20 },
        { header: 'Issued By', key: 'issued_by', width: 20 },
        { header: 'Issue Date', key: 'issue_date', type: 'date', width: 12 },
        { header: 'Expiry Date', key: 'expiry_date', type: 'date', width: 12 },
        { header: 'Days Until Expiry', key: 'days_until_expiry', type: 'number', width: 18 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      data,
    });
  },

  async attendance(data: Record<string, unknown>[], filename = 'attendance') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Attendance',
      title: 'Attendance Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Employee', key: 'employee_name', width: 25 },
        { header: 'Date', key: 'date', type: 'date', width: 12 },
        { header: 'Clock In', key: 'clock_in', width: 12 },
        { header: 'Clock Out', key: 'clock_out', width: 12 },
        { header: 'Duration (hrs)', key: 'duration', type: 'number', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Notes', key: 'notes', width: 30 },
      ],
      data,
    });
  },

  async leaveRequests(data: Record<string, unknown>[], filename = 'leave-requests') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Leave Requests',
      title: 'Leave Request Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Employee', key: 'employee_name', width: 25 },
        { header: 'Leave Type', key: 'leave_type', width: 15 },
        { header: 'Start Date', key: 'start_date', type: 'date', width: 12 },
        { header: 'End Date', key: 'end_date', type: 'date', width: 12 },
        { header: 'Days', key: 'days', type: 'number', width: 8 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Reason', key: 'reason', width: 30 },
      ],
      data,
      includeSum: ['days'],
    });
  },

  async performanceReviews(data: Record<string, unknown>[], filename = 'performance-reviews') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Performance Reviews',
      title: 'Performance Review Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Employee', key: 'employee_name', width: 25 },
        { header: 'Review Period', key: 'review_period', width: 15 },
        { header: 'Reviewer', key: 'reviewer_name', width: 25 },
        { header: 'Score', key: 'score', type: 'number', width: 10 },
        { header: 'Rating', key: 'rating', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
      ],
      data,
    });
  },

  async customerCommunications(data: Record<string, unknown>[], filename = 'customer-communications') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Communications',
      title: 'Customer Communications Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Customer', key: 'customer_name', width: 25 },
        { header: 'Type', key: 'type', width: 12 },
        { header: 'Subject', key: 'subject', width: 30 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Sent At', key: 'sent_at', type: 'date', width: 15 },
        { header: 'Response', key: 'response', width: 30 },
      ],
      data,
    });
  },

  async loyaltyAdjustments(data: Record<string, unknown>[], filename = 'loyalty-adjustments') {
    return exportToExcel({
      filename: `${filename}-${new Date().toISOString().split('T')[0]}`,
      sheetName: 'Loyalty Adjustments',
      title: 'Loyalty Points Adjustment Report',
      subtitle: `Generated: ${new Date().toLocaleDateString('id-ID')}`,
      columns: [
        { header: 'Customer', key: 'customer_name', width: 25 },
        { header: 'Type', key: 'type', width: 12 },
        { header: 'Points', key: 'points', type: 'number', width: 12 },
        { header: 'Reason', key: 'reason', width: 30 },
        { header: 'Created By', key: 'created_by', width: 20 },
        { header: 'Created At', key: 'created_at', type: 'date', width: 15 },
      ],
      data,
      includeSum: ['points'],
    });
  },
};
