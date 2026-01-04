/**
 * Aggregated Invoice PDF Template
 * Invoice that aggregates multiple bookings for a period (weekly/monthly)
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 120,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  summaryBox: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    marginBottom: 20,
    borderRadius: 5,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e0e0e0',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #ddd',
    fontSize: 9,
  },
  tableCol: {
    flex: 1,
  },
  tableColSmall: {
    width: 80,
  },
  tableColMedium: {
    width: 120,
  },
  total: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
});

export type AggregatedInvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  period: 'weekly' | 'monthly';
  periodStart: string;
  periodEnd: string;
  // Company info (whitelabel support)
  companyName: string;
  companyAddress: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string;
  // Items (bookings)
  bookings: Array<{
    bookingCode: string;
    tripDate: string;
    customerName: string;
    packageName: string | null;
    packageDestination: string | null;
    totalAmount: number;
    status: string;
  }>;
  // Totals
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
  totalBookings: number;
  // Notes
  notes?: string;
  footerText?: string;
};

export function AggregatedInvoicePDF({ data }: { data: AggregatedInvoiceData }) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        data.companyLogo &&
          React.createElement(Text, { style: { marginBottom: 10 } },
            `[Logo: ${data.companyName}]`
          ),
        React.createElement(Text, { style: styles.companyName }, data.companyName),
        data.companyAddress &&
          React.createElement(Text, { style: styles.companyAddress }, data.companyAddress),
        data.companyPhone &&
          React.createElement(Text, { style: styles.companyAddress }, `Tel: ${data.companyPhone}`),
        data.companyEmail &&
          React.createElement(Text, { style: styles.companyAddress },
            `Email: ${data.companyEmail}`
          )
      ),
      // Title
      React.createElement(Text, { style: styles.title },
        `INVOICE AGREGAT ${data.period === 'weekly' ? 'MINGGUAN' : 'BULANAN'}`
      ),
      // Invoice Info
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Invoice No:'),
          React.createElement(Text, { style: styles.value }, data.invoiceNumber)
        ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Tanggal:'),
          React.createElement(Text, { style: styles.value }, data.invoiceDate)
        ),
        data.dueDate &&
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: styles.label }, 'Jatuh Tempo:'),
            React.createElement(Text, { style: styles.value }, data.dueDate)
          ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Periode:'),
          React.createElement(Text, { style: styles.value },
            `${data.periodStart} s/d ${data.periodEnd}`
          )
        )
      ),
      // Summary Box
      React.createElement(
        View,
        { style: styles.summaryBox },
        React.createElement(Text, { style: { fontWeight: 'bold', marginBottom: 5, fontSize: 12 } },
          'RINGKASAN'
        ),
        React.createElement(Text, { style: { marginBottom: 3 } },
          `Total Booking: ${data.totalBookings}`
        ),
        React.createElement(Text, { style: { marginBottom: 3 } },
          `Subtotal: Rp ${data.subtotal.toLocaleString('id-ID')}`
        ),
        data.tax &&
          React.createElement(Text, { style: { marginBottom: 3 } },
            `Pajak (${data.taxRate || 0}%): Rp ${data.tax.toLocaleString('id-ID')}`
          ),
        React.createElement(Text, { style: { fontWeight: 'bold', fontSize: 12 } },
          `Total: Rp ${data.total.toLocaleString('id-ID')}`
        )
      ),
      // Bookings Table
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: styles.tableColMedium }, 'Kode Booking'),
          React.createElement(Text, { style: styles.tableColMedium }, 'Tanggal Trip'),
          React.createElement(Text, { style: [styles.tableCol, { flex: 2 }] }, 'Customer'),
          React.createElement(Text, { style: [styles.tableCol, { flex: 2 }] }, 'Paket'),
          React.createElement(Text, { style: styles.tableColSmall }, 'Status'),
          React.createElement(Text, { style: styles.tableColSmall }, 'Jumlah')
        ),
        data.bookings.map((booking, index) =>
          React.createElement(
            View,
            { key: index, style: styles.tableRow },
            React.createElement(Text, { style: styles.tableColMedium }, booking.bookingCode),
            React.createElement(Text, { style: styles.tableColMedium }, booking.tripDate),
            React.createElement(Text, { style: [styles.tableCol, { flex: 2 }] },
              booking.customerName
            ),
            React.createElement(Text, { style: [styles.tableCol, { flex: 2 }] },
              booking.packageName || '-'
            ),
            React.createElement(Text, { style: styles.tableColSmall }, booking.status),
            React.createElement(Text, { style: styles.tableColSmall },
              `Rp ${booking.totalAmount.toLocaleString('id-ID')}`
            )
          )
        )
      ),
      // Totals
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, { style: [styles.label, { textAlign: 'right' }] },
            'Subtotal:'
          ),
          React.createElement(Text, { style: [styles.value, { textAlign: 'right' }] },
            `Rp ${data.subtotal.toLocaleString('id-ID')}`
          )
        ),
        data.tax &&
          React.createElement(
            View,
            { style: styles.row },
            React.createElement(Text, { style: [styles.label, { textAlign: 'right' }] },
              `Pajak (${data.taxRate || 0}%):`
            ),
            React.createElement(Text, { style: [styles.value, { textAlign: 'right' }] },
              `Rp ${data.tax.toLocaleString('id-ID')}`
            )
          ),
        React.createElement(
          View,
          { style: styles.row },
          React.createElement(Text, {
            style: [
              styles.label,
              { textAlign: 'right', fontSize: 14, fontWeight: 'bold' },
            ],
          }, 'Total:'),
          React.createElement(Text, {
            style: [
              styles.value,
              { textAlign: 'right', fontSize: 14, fontWeight: 'bold' },
            ],
          }, `Rp ${data.total.toLocaleString('id-ID')}`)
        )
      ),
      // Notes
      data.notes &&
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: { fontWeight: 'bold', marginBottom: 5 } },
            'Catatan:'
          ),
          React.createElement(Text, null, data.notes)
        ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, 'Terima kasih atas kepercayaan Anda!'),
        React.createElement(Text, null, 'Invoice ini dibuat secara otomatis oleh sistem.'),
        data.footerText && React.createElement(Text, null, data.footerText)
      )
    )
  );
}

/**
 * Generate PDF buffer for download
 */
export async function generateAggregatedInvoicePDF(
  data: AggregatedInvoiceData
): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const pdfDoc = React.createElement(AggregatedInvoicePDF, { data });
  const buffer = await renderToBuffer(pdfDoc);
  return Buffer.from(buffer);
}

