/**
 * Refund Policy PDF Template
 * White-label refund policy document for partner bookings
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #000',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
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
    marginTop: 10,
  },
  paragraph: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  listItem: {
    marginBottom: 5,
    paddingLeft: 10,
    flexDirection: 'row',
  },
  listBullet: {
    marginRight: 5,
  },
  listText: {
    flex: 1,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    paddingVertical: 5,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  tableCellTimeline: {
    width: 100,
    paddingHorizontal: 5,
  },
  tableCellPercentage: {
    width: 80,
    paddingHorizontal: 5,
    textAlign: 'right',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  highlight: {
    backgroundColor: '#fff3cd',
    padding: 5,
    marginTop: 10,
    marginBottom: 10,
  },
});

export type RefundPolicyData = {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  bookingCode: string;
  packageName: string;
  tripDate: string;
  totalAmount: number;
  language?: 'id' | 'en';
  customPolicy?: string; // Optional custom policy from whitelabel settings
};

export function RefundPolicyPDF({ data }: { data: RefundPolicyData }) {
  const lang = data.language || 'id';
  const texts = {
    id: {
      title: 'KEBIJAKAN REFUND & PEMBATALAN',
      section1: '1. TIMELINE PEMBATALAN & REFUND',
      section1Intro: 'Kebijakan refund berdasarkan waktu pembatalan sebelum tanggal keberangkatan:',
      section2: '2. PROSES REFUND',
      section2Content: [
        'Refund akan diproses dalam 5-7 hari kerja setelah pembatalan dikonfirmasi.',
        'Refund akan dikembalikan ke metode pembayaran yang digunakan saat booking.',
        'Untuk pembayaran via transfer bank, refund akan dikembalikan ke rekening yang sama.',
        'Waktu proses refund dapat bervariasi tergantung bank penerima (maksimal 14 hari kerja).',
      ],
      section3: '3. ITEM NON-REFUNDABLE',
      section3Content: [
        'Biaya administrasi dan processing fee tidak dapat direfund.',
        'Voucher atau promo yang sudah digunakan tidak dapat direfund.',
        'Biaya asuransi perjalanan (jika sudah aktif) tidak dapat direfund.',
        'Deposit atau down payment yang sudah dibayar akan mengikuti kebijakan refund sesuai timeline.',
      ],
      section4: '4. FORCE MAJEURE',
      section4Content: [
        'Jika trip dibatalkan karena force majeure (bencana alam, pandemi, perang, dll), kebijakan refund akan disesuaikan.',
        'Refund penuh atau penawaran alternatif trip akan diberikan dalam kasus force majeure.',
        'Keputusan final mengenai force majeure berada di tangan penyelenggara trip.',
      ],
      section5: '5. PERUBAHAN BOOKING',
      section5Content: [
        'Perubahan tanggal atau paket dapat dilakukan dengan biaya tambahan tergantung ketersediaan.',
        'Perubahan yang dilakukan kurang dari 7 hari sebelum trip dapat dikenakan biaya perubahan.',
        'Hubungi customer service untuk informasi lebih lanjut mengenai perubahan booking.',
      ],
      section6: '6. KONTAK',
      section6Content: [
        'Untuk pertanyaan atau bantuan mengenai refund, silakan hubungi customer service kami.',
        'Email: ' + (data.companyEmail || 'support@example.com'),
        'Phone: ' + (data.companyPhone || '-'),
      ],
      bookingInfo: 'Informasi Booking',
      bookingCode: 'Kode Booking',
      package: 'Paket',
      tripDate: 'Tanggal Trip',
      totalAmount: 'Total Pembayaran',
      customPolicy: 'Kebijakan Khusus',
      note: 'Catatan: Kebijakan ini dapat berubah sewaktu-waktu. Silakan cek versi terbaru sebelum melakukan pembatalan.',
    },
    en: {
      title: 'REFUND & CANCELLATION POLICY',
      section1: '1. CANCELLATION TIMELINE & REFUND',
      section1Intro: 'Refund policy based on cancellation time before departure date:',
      section2: '2. REFUND PROCESS',
      section2Content: [
        'Refund will be processed within 5-7 business days after cancellation is confirmed.',
        'Refund will be returned to the payment method used during booking.',
        'For bank transfer payments, refund will be returned to the same account.',
        'Refund processing time may vary depending on receiving bank (maximum 14 business days).',
      ],
      section3: '3. NON-REFUNDABLE ITEMS',
      section3Content: [
        'Administration fees and processing fees are non-refundable.',
        'Vouchers or promotions that have been used are non-refundable.',
        'Travel insurance fees (if already active) are non-refundable.',
        'Deposits or down payments already made will follow refund policy according to timeline.',
      ],
      section4: '4. FORCE MAJEURE',
      section4Content: [
        'If trip is cancelled due to force majeure (natural disasters, pandemic, war, etc.), refund policy will be adjusted.',
        'Full refund or alternative trip offer will be provided in case of force majeure.',
        'Final decision regarding force majeure is at the discretion of the trip organizer.',
      ],
      section5: '5. BOOKING CHANGES',
      section5Content: [
        'Date or package changes can be made with additional fees depending on availability.',
        'Changes made less than 7 days before trip may incur change fees.',
        'Contact customer service for more information regarding booking changes.',
      ],
      section6: '6. CONTACT',
      section6Content: [
        'For questions or assistance regarding refunds, please contact our customer service.',
        'Email: ' + (data.companyEmail || 'support@example.com'),
        'Phone: ' + (data.companyPhone || '-'),
      ],
      bookingInfo: 'Booking Information',
      bookingCode: 'Booking Code',
      package: 'Package',
      tripDate: 'Trip Date',
      totalAmount: 'Total Amount',
      customPolicy: 'Custom Policy',
      note: 'Note: This policy may change at any time. Please check the latest version before making a cancellation.',
    },
  };

  const t = texts[lang];

  // Standard refund timeline
  const refundTimeline = [
    { days: 'H-30+', percentage: 100, id: 'Lebih dari 30 hari', en: 'More than 30 days' },
    { days: 'H-14 to H-30', percentage: 80, id: '14-30 hari', en: '14-30 days' },
    { days: 'H-7 to H-13', percentage: 50, id: '7-13 hari', en: '7-13 days' },
    { days: 'H-3 to H-6', percentage: 30, id: '3-6 hari', en: '3-6 days' },
    { days: 'H-1 to H-2', percentage: 10, id: '1-2 hari', en: '1-2 days' },
    { days: 'H-0', percentage: 0, id: 'Hari H atau setelah', en: 'Day of trip or after' },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{data.companyName}</Text>
          {data.companyAddress && (
            <Text style={styles.companyAddress}>{data.companyAddress}</Text>
          )}
          {data.companyPhone && (
            <Text style={styles.companyAddress}>{data.companyPhone}</Text>
          )}
          {data.companyEmail && (
            <Text style={styles.companyAddress}>{data.companyEmail}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{t.title}</Text>

        {/* Booking Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.bookingInfo}</Text>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>•</Text>
            <Text style={styles.listText}>
              <Text style={styles.bold}>{t.bookingCode}:</Text> {data.bookingCode}
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>•</Text>
            <Text style={styles.listText}>
              <Text style={styles.bold}>{t.package}:</Text> {data.packageName}
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>•</Text>
            <Text style={styles.listText}>
              <Text style={styles.bold}>{t.tripDate}:</Text> {new Date(data.tripDate).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.listBullet}>•</Text>
            <Text style={styles.listText}>
              <Text style={styles.bold}>{t.totalAmount}:</Text> {new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(data.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Section 1: Cancellation Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.section1}</Text>
          <Text style={styles.paragraph}>{t.section1Intro}</Text>
          
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.tableCellTimeline]}>
                {lang === 'id' ? 'Timeline' : 'Timeline'}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellPercentage]}>
                {lang === 'id' ? 'Refund' : 'Refund'}
              </Text>
            </View>
            
            {/* Table Rows */}
            {refundTimeline.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.tableCellTimeline]}>
                  {lang === 'id' ? item.id : item.en}
                </Text>
                <Text style={[styles.tableCell, styles.tableCellPercentage]}>
                  {item.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Custom Policy (if provided) */}
        {data.customPolicy && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.customPolicy}</Text>
            <View style={styles.highlight}>
              <Text style={styles.paragraph}>{data.customPolicy}</Text>
            </View>
          </View>
        )}

        {/* Section 2: Refund Process */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.section2}</Text>
          {t.section2Content.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Section 3: Non-Refundable Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.section3}</Text>
          {t.section3Content.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Section 4: Force Majeure */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.section4}</Text>
          {t.section4Content.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Section 5: Booking Changes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.section5}</Text>
          {t.section5Content.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Section 6: Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.section6}</Text>
          {t.section6Content.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text>{t.note}</Text>
        </View>
      </Page>
    </Document>
  );
}

/**
 * Generate PDF buffer for download
 */
export async function generateRefundPolicyPDF(data: RefundPolicyData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const pdfDoc = <RefundPolicyPDF data={data} />;
  const buffer = await renderToBuffer(pdfDoc);
  return Buffer.from(buffer);
}

