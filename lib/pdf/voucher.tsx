/**
 * Voucher PDF Template
 * White-label voucher for partner bookings (different from invoice)
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
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
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
});

export type VoucherData = {
  voucherNumber: string;
  bookingCode: string;
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  packageName: string;
  destination: string;
  tripDate: string;
  adultPax: number;
  childPax: number;
  infantPax: number;
  totalAmount: number;
  specialInstructions?: string;
  footerText?: string;
  language?: 'id' | 'en';
};

export function VoucherPDF({ data }: { data: VoucherData }) {
  const lang = data.language || 'id';
  const texts = {
    id: {
      title: 'VOUCHER PERJALANAN',
      voucherNumber: 'Nomor Voucher',
      bookingCode: 'Kode Booking',
      customer: 'Customer',
      package: 'Paket',
      destination: 'Destinasi',
      tripDate: 'Tanggal Trip',
      pax: 'Jumlah Peserta',
      adult: 'Dewasa',
      child: 'Anak',
      infant: 'Bayi',
      totalAmount: 'Total Pembayaran',
      specialInstructions: 'Instruksi Khusus',
      footer: 'Voucher ini berlaku untuk perjalanan sesuai tanggal yang tertera di atas.',
    },
    en: {
      title: 'TRAVEL VOUCHER',
      voucherNumber: 'Voucher Number',
      bookingCode: 'Booking Code',
      customer: 'Customer',
      package: 'Package',
      destination: 'Destination',
      tripDate: 'Trip Date',
      pax: 'Passengers',
      adult: 'Adult',
      child: 'Child',
      infant: 'Infant',
      totalAmount: 'Total Amount',
      specialInstructions: 'Special Instructions',
      footer: 'This voucher is valid for travel on the date specified above.',
    },
  };

  const t = texts[lang];

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
            <Text style={styles.companyAddress}>Email: {data.companyEmail}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{t.title}</Text>

        {/* Voucher Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>{t.voucherNumber}:</Text>
            <Text style={styles.value}>{data.voucherNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t.bookingCode}:</Text>
            <Text style={styles.value}>{data.bookingCode}</Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.customer}</Text>
          <Text>{data.customerName}</Text>
          {data.customerPhone && <Text>Tel: {data.customerPhone}</Text>}
          {data.customerEmail && <Text>Email: {data.customerEmail}</Text>}
        </View>

        {/* Package Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.package}</Text>
          <Text>{data.packageName}</Text>
          <Text>{t.destination}: {data.destination}</Text>
          <Text>{t.tripDate}: {data.tripDate}</Text>
        </View>

        {/* Pax Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.pax}</Text>
          <Text>{t.adult}: {data.adultPax}</Text>
          {data.childPax > 0 && <Text>{t.child}: {data.childPax}</Text>}
          {data.infantPax > 0 && <Text>{t.infant}: {data.infantPax}</Text>}
        </View>

        {/* Amount */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>{t.totalAmount}:</Text>
            <Text style={styles.value}>
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
              }).format(data.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Special Instructions */}
        {data.specialInstructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.specialInstructions}</Text>
            <Text>{data.specialInstructions}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{data.footerText || t.footer}</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate PDF buffer for download
 */
export async function generateVoucherPDF(data: VoucherData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const pdfDoc = <VoucherPDF data={data} />;
  const buffer = await renderToBuffer(pdfDoc);
  return Buffer.from(buffer);
}

