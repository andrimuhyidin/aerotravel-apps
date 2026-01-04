/**
 * Terms and Conditions PDF Template
 * White-label T&C document for partner bookings
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
});

export type TermsAndConditionsData = {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  bookingCode: string;
  packageName: string;
  destination: string;
  tripDate: string;
  totalAmount: number;
  footerText?: string;
  language?: 'id' | 'en';
  customTerms?: string; // Optional custom terms from whitelabel settings
};

export function TermsAndConditionsPDF({ data }: { data: TermsAndConditionsData }) {
  const lang = data.language || 'id';
  const texts = {
    id: {
      title: 'SYARAT DAN KETENTUAN',
      section1: '1. PEMBATALAN',
      section1Content: [
        'Pembatalan lebih dari 7 hari sebelum tanggal keberangkatan: Dikenakan biaya pembatalan 0% (refund penuh).',
        'Pembatalan 3-7 hari sebelum tanggal keberangkatan: Dikenakan biaya pembatalan 50% dari total pembayaran.',
        'Pembatalan kurang dari 3 hari sebelum tanggal keberangkatan: Tidak ada refund (biaya pembatalan 100%).',
        'Pembatalan oleh penyelenggara trip karena force majeure: Refund penuh atau penawaran alternatif trip.',
      ],
      section2: '2. KEBIJAKAN REFUND',
      section2Content: [
        'Refund akan diproses sesuai dengan kebijakan pembatalan di atas.',
        'Proses refund memakan waktu 5-14 hari kerja setelah persetujuan.',
        'Refund akan dikembalikan ke metode pembayaran asli atau ke wallet sesuai kebijakan.',
        'Biaya admin bank (jika ada) akan dikurangi dari jumlah refund.',
      ],
      section3: '3. TANGGUNG JAWAB',
      section3Content: [
        'Penyelenggara bertanggung jawab atas keselamatan peserta selama trip berlangsung.',
        'Peserta diwajibkan mengikuti instruksi guide dan mematuhi peraturan yang berlaku.',
        'Penyelenggara tidak bertanggung jawab atas kehilangan atau kerusakan barang pribadi peserta.',
        'Peserta wajib memiliki asuransi perjalanan yang mencakup aktivitas yang dilakukan.',
      ],
      section4: '4. PERUBAHAN ITINERARY',
      section4Content: [
        'Penyelenggara berhak mengubah itinerary karena kondisi cuaca, force majeure, atau alasan keselamatan.',
        'Perubahan akan dikomunikasikan kepada peserta sesegera mungkin.',
        'Tidak ada refund untuk perubahan minor pada itinerary.',
      ],
      section5: '5. ASURANSI',
      section5Content: [
        'Peserta diwajibkan memiliki asuransi perjalanan yang valid.',
        'Penyelenggara tidak menyediakan asuransi perjalanan kecuali dinyatakan lain.',
        'Peserta bertanggung jawab untuk memastikan asuransi mereka mencakup aktivitas yang dilakukan.',
      ],
      section6: '6. KETENTUAN UMUM',
      section6Content: [
        'Dengan melakukan booking, peserta dianggap telah membaca dan menyetujui syarat dan ketentuan ini.',
        'Penyelenggara berhak menolak peserta yang tidak mematuhi peraturan atau membahayakan keselamatan.',
        'Sengketa akan diselesaikan melalui musyawarah, jika tidak tercapai akan diselesaikan melalui pengadilan yang berwenang.',
        'Syarat dan ketentuan ini dapat berubah sewaktu-waktu dan akan diberitahukan kepada peserta.',
      ],
      footer: 'Dokumen ini adalah bagian yang tidak terpisahkan dari voucher perjalanan.',
    },
    en: {
      title: 'TERMS AND CONDITIONS',
      section1: '1. CANCELLATION',
      section1Content: [
        'Cancellation more than 7 days before departure date: 0% cancellation fee (full refund).',
        'Cancellation 3-7 days before departure date: 50% cancellation fee of total payment.',
        'Cancellation less than 3 days before departure date: No refund (100% cancellation fee).',
        'Cancellation by trip organizer due to force majeure: Full refund or alternative trip offer.',
      ],
      section2: '2. REFUND POLICY',
      section2Content: [
        'Refund will be processed according to the cancellation policy above.',
        'Refund processing takes 5-14 business days after approval.',
        'Refund will be returned to original payment method or wallet according to policy.',
        'Bank admin fees (if any) will be deducted from refund amount.',
      ],
      section3: '3. LIABILITY',
      section3Content: [
        'Organizer is responsible for participant safety during the trip.',
        'Participants must follow guide instructions and comply with applicable regulations.',
        'Organizer is not responsible for loss or damage to participants\' personal belongings.',
        'Participants must have travel insurance covering the activities performed.',
      ],
      section4: '4. ITINERARY CHANGES',
      section4Content: [
        'Organizer has the right to change itinerary due to weather conditions, force majeure, or safety reasons.',
        'Changes will be communicated to participants as soon as possible.',
        'No refund for minor changes to itinerary.',
      ],
      section5: '5. INSURANCE',
      section5Content: [
        'Participants must have valid travel insurance.',
        'Organizer does not provide travel insurance unless otherwise stated.',
        'Participants are responsible for ensuring their insurance covers the activities performed.',
      ],
      section6: '6. GENERAL TERMS',
      section6Content: [
        'By making a booking, participants are deemed to have read and agreed to these terms and conditions.',
        'Organizer has the right to refuse participants who do not comply with regulations or endanger safety.',
        'Disputes will be resolved through deliberation, if not achieved will be resolved through competent courts.',
        'These terms and conditions may change from time to time and will be notified to participants.',
      ],
      footer: 'This document is an integral part of the travel voucher.',
    },
  };

  const t = texts[lang];

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
        React.createElement(Text, { style: styles.companyName }, data.companyName),
        data.companyAddress &&
          React.createElement(Text, { style: styles.companyAddress }, data.companyAddress),
        data.companyPhone &&
          React.createElement(Text, { style: styles.companyAddress }, `Tel: ${data.companyPhone}`),
        data.companyEmail &&
          React.createElement(Text, { style: styles.companyAddress }, `Email: ${data.companyEmail}`)
      ),
      // Title
      React.createElement(Text, { style: styles.title }, t.title),
      // Booking Info
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.paragraph },
          lang === 'id'
            ? `Booking Code: ${data.bookingCode} | Paket: ${data.packageName} | Destinasi: ${data.destination} | Tanggal: ${data.tripDate}`
            : `Booking Code: ${data.bookingCode} | Package: ${data.packageName} | Destination: ${data.destination} | Date: ${data.tripDate}`
        )
      ),
      // Custom Terms (if provided)
      data.customTerms && React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle },
          lang === 'id' ? 'KETENTUAN KHUSUS' : 'SPECIAL TERMS'
        ),
        React.createElement(Text, { style: styles.paragraph }, data.customTerms)
      ),
      // Section 1: Cancellation
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, t.section1),
        t.section1Content.map((item, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.listItem },
            React.createElement(Text, { style: styles.listBullet }, '•'),
            React.createElement(Text, { style: styles.listText }, item)
          )
        )
      ),
      // Section 2: Refund Policy
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, t.section2),
        t.section2Content.map((item, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.listItem },
            React.createElement(Text, { style: styles.listBullet }, '•'),
            React.createElement(Text, { style: styles.listText }, item)
          )
        )
      ),
      // Section 3: Liability
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, t.section3),
        t.section3Content.map((item, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.listItem },
            React.createElement(Text, { style: styles.listBullet }, '•'),
            React.createElement(Text, { style: styles.listText }, item)
          )
        )
      ),
      // Section 4: Itinerary Changes
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, t.section4),
        t.section4Content.map((item, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.listItem },
            React.createElement(Text, { style: styles.listBullet }, '•'),
            React.createElement(Text, { style: styles.listText }, item)
          )
        )
      ),
      // Section 5: Insurance
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, t.section5),
        t.section5Content.map((item, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.listItem },
            React.createElement(Text, { style: styles.listBullet }, '•'),
            React.createElement(Text, { style: styles.listText }, item)
          )
        )
      ),
      // Section 6: General Terms
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, t.section6),
        t.section6Content.map((item, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.listItem },
            React.createElement(Text, { style: styles.listBullet }, '•'),
            React.createElement(Text, { style: styles.listText }, item)
          )
        )
      ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, t.footer),
        data.footerText && React.createElement(Text, null, data.footerText)
      )
    )
  );
}

/**
 * Generate PDF buffer for download
 */
export async function generateTermsAndConditionsPDF(
  data: TermsAndConditionsData
): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const pdfDoc = React.createElement(TermsAndConditionsPDF, { data });
  const buffer = await renderToBuffer(pdfDoc);
  return Buffer.from(buffer);
}

