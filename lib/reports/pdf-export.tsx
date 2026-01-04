/**
 * PDF Export Service
 * Generate PDF reports using @react-pdf/renderer
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

// Register fonts if needed (optional)
// Font.register({
//   family: 'Roboto',
//   src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf'
// });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: '2 solid #3B82F6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  dateRange: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 5,
  },
  tableCell: {
    fontSize: 9,
    color: '#1F2937',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summary: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 10,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#9CA3AF',
    borderTop: '1 solid #E5E7EB',
    paddingTop: 10,
  },
});

type ReportData = {
  title: string;
  subtitle?: string;
  dateRange?: string;
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, string | number>>;
  summary?: Array<{ label: string; value: string | number }>;
};

type PDFReportProps = {
  data: ReportData;
  generatedAt: string;
};

function PDFReport({ data, generatedAt }: PDFReportProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.title}</Text>
          {data.subtitle && <Text style={styles.subtitle}>{data.subtitle}</Text>}
          {data.dateRange && <Text style={styles.dateRange}>{data.dateRange}</Text>}
        </View>

        {/* Table */}
        {data.rows.length > 0 && (
          <View style={styles.table}>
            {/* Header Row */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              {data.columns.map((col, index) => (
                <View key={col.key} style={styles.tableCol}>
                  <Text style={styles.tableHeaderCell}>{col.label}</Text>
                </View>
              ))}
            </View>

            {/* Data Rows */}
            {data.rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.tableRow}>
                {data.columns.map((col) => (
                  <View key={col.key} style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {row[col.key]?.toString() || '-'}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Summary */}
        {data.summary && data.summary.length > 0 && (
          <View style={styles.summary}>
            {data.summary.map((item, index) => (
              <View key={index} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{item.label}:</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Generated on {new Date(generatedAt).toLocaleString('id-ID')} | MyAeroTravel ID
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate PDF buffer from report data
 */
export async function generatePDFReport(data: ReportData): Promise<Buffer> {
  const generatedAt = new Date().toISOString();
  const doc = <PDFReport data={data} generatedAt={generatedAt} />;
  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate revenue report PDF
 */
export async function generateRevenueReportPDF(data: {
  startDate: string;
  endDate: string;
  revenue: number;
  bookings: number;
  trips: Array<{
    tripCode: string;
    packageName: string;
    revenue: number;
    pax: number;
  }>;
}): Promise<Buffer> {
  const reportData: ReportData = {
    title: 'Revenue Report',
    subtitle: 'MyAeroTravel ID',
    dateRange: `${data.startDate} - ${data.endDate}`,
    columns: [
      { key: 'tripCode', label: 'Trip Code' },
      { key: 'packageName', label: 'Package' },
      { key: 'pax', label: 'Pax' },
      { key: 'revenue', label: 'Revenue' },
    ],
    rows: data.trips.map((trip) => ({
      tripCode: trip.tripCode,
      packageName: trip.packageName,
      pax: trip.pax,
      revenue: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(trip.revenue),
    })),
    summary: [
      { label: 'Total Revenue', value: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(data.revenue) },
      { label: 'Total Bookings', value: data.bookings.toString() },
      { label: 'Total Trips', value: data.trips.length.toString() },
    ],
  };

  return generatePDFReport(reportData);
}

/**
 * Generate P&L report PDF
 */
export async function generatePnLReportPDF(data: {
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  trips: Array<{
    tripCode: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
  }>;
}): Promise<Buffer> {
  const reportData: ReportData = {
    title: 'Profit & Loss Report',
    subtitle: 'MyAeroTravel ID',
    dateRange: `${data.startDate} - ${data.endDate}`,
    columns: [
      { key: 'tripCode', label: 'Trip Code' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'cost', label: 'Cost' },
      { key: 'profit', label: 'Profit' },
      { key: 'margin', label: 'Margin %' },
    ],
    rows: data.trips.map((trip) => ({
      tripCode: trip.tripCode,
      revenue: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(trip.revenue),
      cost: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(trip.cost),
      profit: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(trip.profit),
      margin: `${trip.margin.toFixed(1)}%`,
    })),
    summary: [
      { label: 'Total Revenue', value: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(data.totalRevenue) },
      { label: 'Total Cost', value: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(data.totalCost) },
      { label: 'Total Profit', value: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(data.totalProfit) },
      { label: 'Average Margin', value: data.totalRevenue > 0
        ? `${((data.totalProfit / data.totalRevenue) * 100).toFixed(1)}%`
        : '0%' },
    ],
  };

  return generatePDFReport(reportData);
}

/**
 * Generate booking summary PDF
 */
export async function generateBookingReportPDF(data: {
  startDate: string;
  endDate: string;
  bookings: Array<{
    bookingCode: string;
    customerName: string;
    packageName: string;
    tripDate: string;
    pax: number;
    amount: number;
    status: string;
  }>;
  totalAmount: number;
  totalBookings: number;
}): Promise<Buffer> {
  const reportData: ReportData = {
    title: 'Booking Summary Report',
    subtitle: 'MyAeroTravel ID',
    dateRange: `${data.startDate} - ${data.endDate}`,
    columns: [
      { key: 'bookingCode', label: 'Booking Code' },
      { key: 'customerName', label: 'Customer' },
      { key: 'packageName', label: 'Package' },
      { key: 'tripDate', label: 'Trip Date' },
      { key: 'pax', label: 'Pax' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
    ],
    rows: data.bookings.map((booking) => ({
      bookingCode: booking.bookingCode,
      customerName: booking.customerName,
      packageName: booking.packageName,
      tripDate: new Date(booking.tripDate).toLocaleDateString('id-ID'),
      pax: booking.pax.toString(),
      amount: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(booking.amount),
      status: booking.status,
    })),
    summary: [
      { label: 'Total Bookings', value: data.totalBookings.toString() },
      { label: 'Total Amount', value: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(data.totalAmount) },
    ],
  };

  return generatePDFReport(reportData);
}

