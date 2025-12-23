/**
 * Invoice PDF Template
 * Sesuai PRD 4.3.B - Whitelabel Invoice
 *
 * Generate PDF invoice with whitelabel support (Mitra branding)
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Register fonts (if custom fonts needed)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf',
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
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
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1 solid #ddd',
  },
  tableCol: {
    flex: 1,
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
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});

export type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  // Company info (whitelabel support)
  companyName: string;
  companyAddress: string;
  companyPhone?: string;
  companyEmail?: string;
  companyLogo?: string; // Base64 or URL
  // Customer info
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  // Items
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  // Totals
  subtotal: number;
  tax?: number;
  taxRate?: number;
  total: number;
  // Payment info
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'overdue';
  // Notes
  notes?: string;
};

export function InvoicePDF({ data }: { data: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.companyLogo && (
            <Text style={{ marginBottom: 10 }}>[Logo: {data.companyName}]</Text>
          )}
          <Text style={styles.companyName}>{data.companyName}</Text>
          {data.companyAddress && (
            <Text style={styles.companyAddress}>{data.companyAddress}</Text>
          )}
          {data.companyPhone && (
            <Text style={styles.companyAddress}>Tel: {data.companyPhone}</Text>
          )}
          {data.companyEmail && (
            <Text style={styles.companyAddress}>
              Email: {data.companyEmail}
            </Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>INVOICE</Text>

        {/* Invoice Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice No:</Text>
            <Text style={styles.value}>{data.invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{data.invoiceDate}</Text>
          </View>
          {data.dueDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Due Date:</Text>
              <Text style={styles.value}>{data.dueDate}</Text>
            </View>
          )}
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Bill To:</Text>
          <Text>{data.customerName}</Text>
          {data.customerAddress && <Text>{data.customerAddress}</Text>}
          {data.customerPhone && <Text>Tel: {data.customerPhone}</Text>}
          {data.customerEmail && <Text>Email: {data.customerEmail}</Text>}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol, { flex: 2 }]}>Description</Text>
            <Text style={styles.tableCol}>Qty</Text>
            <Text style={styles.tableCol}>Price</Text>
            <Text style={styles.tableCol}>Total</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCol, { flex: 2 }]}>
                {item.description}
              </Text>
              <Text style={styles.tableCol}>{item.quantity}</Text>
              <Text style={styles.tableCol}>
                Rp {item.unitPrice.toLocaleString('id-ID')}
              </Text>
              <Text style={styles.tableCol}>
                Rp {item.total.toLocaleString('id-ID')}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={[styles.label, { textAlign: 'right' }]}>
              Subtotal:
            </Text>
            <Text style={[styles.value, { textAlign: 'right' }]}>
              Rp {data.subtotal.toLocaleString('id-ID')}
            </Text>
          </View>
          {data.tax && (
            <View style={styles.row}>
              <Text style={[styles.label, { textAlign: 'right' }]}>
                Tax ({data.taxRate || 0}%):
              </Text>
              <Text style={[styles.value, { textAlign: 'right' }]}>
                Rp {data.tax.toLocaleString('id-ID')}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text
              style={[
                styles.label,
                { textAlign: 'right', fontSize: 14, fontWeight: 'bold' },
              ]}
            >
              Total:
            </Text>
            <Text
              style={[
                styles.value,
                { textAlign: 'right', fontSize: 14, fontWeight: 'bold' },
              ]}
            >
              Rp {data.total.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>

        {/* Payment Status */}
        {data.paymentStatus && (
          <View style={styles.section}>
            <Text style={{ fontWeight: 'bold' }}>
              Status: {data.paymentStatus.toUpperCase()}
            </Text>
            {data.paymentMethod && (
              <Text>Payment Method: {data.paymentMethod}</Text>
            )}
          </View>
        )}

        {/* Notes */}
        {data.notes && (
          <View style={styles.section}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Notes:</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>This is a computer-generated invoice.</Text>
        </View>
      </Page>
    </Document>
  );
}
