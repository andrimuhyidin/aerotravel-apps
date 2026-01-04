/**
 * Confirmation Letter PDF Template
 * Booking confirmation letter for partners
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  date: {
    textAlign: 'right',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  body: {
    marginBottom: 20,
  },
  paragraph: {
    marginBottom: 10,
  },
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
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
  signature: {
    marginTop: 40,
    textAlign: 'right',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 10,
    color: '#666',
  },
});

export type ConfirmationLetterData = {
  companyName: string;
  companyAddress?: string;
  customerName: string;
  customerAddress?: string;
  bookingCode: string;
  packageName: string;
  destination: string;
  tripDate: string;
  adultPax: number;
  childPax: number;
  infantPax: number;
  totalAmount: number;
  confirmationDate: string;
  language?: 'id' | 'en';
};

export function ConfirmationLetterPDF({ data }: { data: ConfirmationLetterData }) {
  const lang = data.language || 'id';
  const texts = {
    id: {
      title: 'SURAT KONFIRMASI BOOKING',
      greeting: 'Yth. Bapak/Ibu',
      body1: 'Dengan hormat,',
      body2: 'Kami mengkonfirmasi bahwa booking Anda telah diterima dengan detail sebagai berikut:',
      bookingCode: 'Kode Booking',
      package: 'Paket',
      destination: 'Destinasi',
      tripDate: 'Tanggal Trip',
      pax: 'Jumlah Peserta',
      totalAmount: 'Total Pembayaran',
      closing: 'Terima kasih atas kepercayaan Anda. Kami berharap dapat memberikan pelayanan terbaik untuk perjalanan Anda.',
      signature: 'Hormat kami,',
      company: data.companyName,
    },
    en: {
      title: 'BOOKING CONFIRMATION LETTER',
      greeting: 'Dear',
      body1: 'Respected Sir/Madam,',
      body2: 'We confirm that your booking has been received with the following details:',
      bookingCode: 'Booking Code',
      package: 'Package',
      destination: 'Destination',
      tripDate: 'Trip Date',
      pax: 'Passengers',
      totalAmount: 'Total Amount',
      closing: 'Thank you for your trust. We hope to provide the best service for your trip.',
      signature: 'Sincerely,',
      company: data.companyName,
    },
  };

  const t = texts[lang];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{data.companyName}</Text>
          {data.companyAddress && <Text>{data.companyAddress}</Text>}
        </View>

        <View style={styles.date}>
          <Text>{data.confirmationDate}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{t.title}</Text>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.paragraph}>{t.greeting} {data.customerName},</Text>
          {data.customerAddress && <Text style={styles.paragraph}>{data.customerAddress}</Text>}
          
          <Text style={styles.paragraph}>{t.body1}</Text>
          <Text style={styles.paragraph}>{t.body2}</Text>

          {/* Booking Details */}
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.label}>{t.bookingCode}:</Text>
              <Text style={styles.value}>{data.bookingCode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t.package}:</Text>
              <Text style={styles.value}>{data.packageName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t.destination}:</Text>
              <Text style={styles.value}>{data.destination}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t.tripDate}:</Text>
              <Text style={styles.value}>{data.tripDate}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>{t.pax}:</Text>
              <Text style={styles.value}>
                {data.adultPax} Adult{data.childPax > 0 ? `, ${data.childPax} Child` : ''}{data.infantPax > 0 ? `, ${data.infantPax} Infant` : ''}
              </Text>
            </View>
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

          <Text style={styles.paragraph}>{t.closing}</Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <Text>{t.signature}</Text>
          <Text style={{ marginTop: 40 }}>{t.company}</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate PDF buffer for download
 */
export async function generateConfirmationLetterPDF(data: ConfirmationLetterData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const pdfDoc = <ConfirmationLetterPDF data={data} />;
  const buffer = await renderToBuffer(pdfDoc);
  return Buffer.from(buffer);
}

