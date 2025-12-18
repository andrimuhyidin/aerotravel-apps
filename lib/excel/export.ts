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
