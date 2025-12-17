/**
 * Excel Export Functions
 * Sesuai PRD - Excel Parser (SheetJS)
 * 
 * Export data to Excel format (.xlsx)
 */

import * as XLSX from 'xlsx';

/**
 * Export array of objects to Excel file
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  sheetName: string = 'Sheet1',
  fileName: string = 'export.xlsx'
): void {
  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate Excel file and download
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export manifest to Excel
 */
export function exportManifestToExcel(data: {
  tripName: string;
  departureDate: string;
  participants: Array<{
    no: number;
    name: string;
    idNumber?: string;
    phone?: string;
    emergencyContact?: string;
  }>;
}): void {
  const rows = data.participants.map((p) => ({
    No: p.no,
    Name: p.name,
    'ID Number': p.idNumber || '',
    Phone: p.phone || '',
    'Emergency Contact': p.emergencyContact || '',
  }));

  exportToExcel(rows, 'Manifest', `manifest-${data.tripName}-${data.departureDate}.xlsx`);
}

/**
 * Export financial report to Excel
 */
export function exportFinancialReportToExcel(data: {
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
}): void {
  const workbook = XLSX.utils.book_new();
  
  // Bookings sheet
  const bookingsSheet = XLSX.utils.json_to_sheet(
    data.bookings.map((b) => ({
      'Booking ID': b.bookingId,
      'Customer': b.customerName,
      'Trip': b.tripName,
      'Booking Date': b.bookingDate,
      'Amount': b.totalAmount,
      'Status': b.status,
    }))
  );
  XLSX.utils.book_append_sheet(workbook, bookingsSheet, 'Bookings');
  
  // Summary sheet
  const summarySheet = XLSX.utils.json_to_sheet([
    { Metric: 'Total Revenue', Value: data.summary.totalRevenue },
    { Metric: 'Total Bookings', Value: data.summary.totalBookings },
    { Metric: 'Average Booking', Value: data.summary.averageBooking },
  ]);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Generate file
  XLSX.writeFile(workbook, `financial-report-${data.period}.xlsx`);
}

/**
 * Export package prices to Excel
 */
export function exportPackagePricesToExcel(data: Array<{
  packageName: string;
  destination: string;
  pricePublish: number;
  priceNTA: number;
  margin: number;
  isPublished: boolean;
}>): void {
  const rows = data.map((pkg) => ({
    'Package Name': pkg.packageName,
    Destination: pkg.destination,
    'Publish Price': pkg.pricePublish,
    'NTA Price': pkg.priceNTA,
    Margin: pkg.margin,
    'Is Published': pkg.isPublished ? 'Yes' : 'No',
  }));

  exportToExcel(rows, 'Package Prices', 'package-prices.xlsx');
}

