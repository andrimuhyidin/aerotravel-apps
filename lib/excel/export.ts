/**
 * Excel Export Functions
 * Sesuai PRD - Excel Parser (Migrated to ExcelJS)
 * 
 * Export data to Excel format (.xlsx)
 */

import ExcelJS from 'exceljs';

/**
 * Export array of objects to Excel file
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  sheetName: string = 'Sheet1',
  fileName: string = 'export.xlsx'
): Promise<void> {
  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);
  
  if (data.length === 0) {
    throw new Error('No data to export');
  }
  
  // Get columns from first row
  const columns = Object.keys(data[0]!).map((key) => ({
    header: key,
    key: key,
    width: 15,
  }));
  
  worksheet.columns = columns;
  
  // Add rows
  data.forEach((row) => {
    worksheet.addRow(row);
  });
  
  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  // Generate Excel file and download
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, fileName);
}

/**
 * Download buffer as file
 */
function downloadBuffer(buffer: ExcelJS.Buffer, fileName: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export compliance report to Excel
 */
export async function exportComplianceReportToExcel(
  data: {
    reportType: 'certifications' | 'training';
    stats: {
      total: number;
      valid?: number;
      completed?: number;
      expiringSoon: number;
      expired: number;
      pending?: number;
      inProgress?: number;
    };
    items: Array<{
      guideName: string;
      guideEmail: string | null;
      certificationType?: string;
      trainingType?: string;
      certificationName?: string;
      trainingName?: string;
      expiryDate: string | null;
      complianceStatus: string;
      daysUntilExpiry: number | null;
    }>;
  }
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Compliance Report');

  // Add header
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = `${data.reportType === 'certifications' ? 'Certification' : 'Training'} Compliance Report`;
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };

  // Add stats
  worksheet.getCell('A3').value = 'Statistics';
  worksheet.getCell('A3').font = { bold: true };
  worksheet.getRow(3).font = { bold: true };

  const statsRow = [
    { header: 'Total', value: data.stats.total },
    { header: data.reportType === 'certifications' ? 'Valid' : 'Completed', value: data.stats.valid || data.stats.completed || 0 },
    { header: 'Expiring Soon (30 days)', value: data.stats.expiringSoon },
    { header: 'Expired', value: data.stats.expired },
  ];

  if (data.stats.pending) {
    statsRow.push({ header: 'Pending', value: data.stats.pending });
  }
  if (data.stats.inProgress) {
    statsRow.push({ header: 'In Progress', value: data.stats.inProgress });
  }

  statsRow.forEach((stat, index) => {
    worksheet.getCell(4, index * 2 + 1).value = stat.header;
    worksheet.getCell(4, index * 2 + 2).value = stat.value;
  });

  // Add data table
  const dataStartRow = 6;
  worksheet.getCell(dataStartRow, 1).value = 'Guide Name';
  worksheet.getCell(dataStartRow, 2).value = 'Email';
  if (data.reportType === 'certifications') {
    worksheet.getCell(dataStartRow, 3).value = 'Certification Type';
    worksheet.getCell(dataStartRow, 4).value = 'Certification Name';
  } else {
    worksheet.getCell(dataStartRow, 3).value = 'Training Type';
    worksheet.getCell(dataStartRow, 4).value = 'Training Name';
  }
  worksheet.getCell(dataStartRow, 5).value = 'Expiry Date';
  worksheet.getCell(dataStartRow, 6).value = 'Status';
  worksheet.getCell(dataStartRow, 7).value = 'Days Until Expiry';

  // Style header row
  worksheet.getRow(dataStartRow).font = { bold: true };
  worksheet.getRow(dataStartRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data rows
  data.items.forEach((item, index) => {
    const row = dataStartRow + 1 + index;
    worksheet.getCell(row, 1).value = item.guideName;
    worksheet.getCell(row, 2).value = item.guideEmail || '';
    worksheet.getCell(row, 3).value = item.certificationType || item.trainingType || '';
    worksheet.getCell(row, 4).value = item.certificationName || item.trainingName || '';
    worksheet.getCell(row, 5).value = item.expiryDate || '';
    worksheet.getCell(row, 6).value = item.complianceStatus;
    worksheet.getCell(row, 7).value = item.daysUntilExpiry ?? '';

    // Color code by status
    if (item.complianceStatus === 'expired') {
      worksheet.getRow(row).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE0E0' },
      };
    } else if (item.complianceStatus === 'expiring_soon') {
      worksheet.getRow(row).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF4E0' },
      };
    }
  });

  // Auto-size columns
  worksheet.columns.forEach((column) => {
    if (column.header) {
      column.width = 20;
    }
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `compliance-${data.reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
  downloadBuffer(buffer, fileName);
}

/**
 * Export manifest to Excel
 */
export async function exportManifestToExcel(data: {
  tripName: string;
  departureDate: string;
  participants: Array<{
    no: number;
    name: string;
    idNumber?: string;
    phone?: string;
    emergencyContact?: string;
  }>;
}): Promise<void> {
  const rows = data.participants.map((p) => ({
    No: p.no,
    Name: p.name,
    'ID Number': p.idNumber || '',
    Phone: p.phone || '',
    'Emergency Contact': p.emergencyContact || '',
  }));

  await exportToExcel(rows, 'Manifest', `manifest-${data.tripName}-${data.departureDate}.xlsx`);
}

/**
 * Export financial report to Excel
 */
export async function exportFinancialReportToExcel(data: {
  period: string;
  bookings: Array<{
    bookingId: string;
    customerName: string;
    tripName: string;
    bookingDate: string;
    totalAmount: number;
    status: string;
  }>;
  summary: {
    totalRevenue: number;
    totalBookings: number;
    averageBooking: number;
  };
}): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  
  // Bookings sheet
  const bookingsSheet = workbook.addWorksheet('Bookings');
  bookingsSheet.columns = [
    { header: 'Booking ID', key: 'bookingId', width: 20 },
    { header: 'Customer', key: 'customerName', width: 25 },
    { header: 'Trip', key: 'tripName', width: 30 },
    { header: 'Booking Date', key: 'bookingDate', width: 15 },
    { header: 'Amount', key: 'totalAmount', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
  ];
  
  data.bookings.forEach((booking) => {
    bookingsSheet.addRow({
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      tripName: booking.tripName,
      bookingDate: booking.bookingDate,
      totalAmount: booking.totalAmount,
      status: booking.status,
    });
  });
  
  // Style header
  bookingsSheet.getRow(1).font = { bold: true };
  bookingsSheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  // Summary sheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 20 },
    { header: 'Value', key: 'value', width: 20 },
  ];
  
  summarySheet.addRow({ metric: 'Total Revenue', value: data.summary.totalRevenue });
  summarySheet.addRow({ metric: 'Total Bookings', value: data.summary.totalBookings });
  summarySheet.addRow({ metric: 'Average Booking', value: data.summary.averageBooking });
  
  // Style header
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };
  
  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, `financial-report-${data.period}.xlsx`);
}

/**
 * Export package prices to Excel
 */
export async function exportPackagePricesToExcel(data: Array<{
  packageName: string;
  destination: string;
  pricePublish: number;
  priceNTA: number;
  margin: number;
  isPublished: boolean;
}>): Promise<void> {
  const rows = data.map((pkg) => ({
    'Package Name': pkg.packageName,
    Destination: pkg.destination,
    'Publish Price': pkg.pricePublish,
    'NTA Price': pkg.priceNTA,
    Margin: pkg.margin,
    'Is Published': pkg.isPublished ? 'Yes' : 'No',
  }));

  await exportToExcel(rows, 'Package Prices', 'package-prices.xlsx');
}
