/**
 * FAQ PDF Template
 * Frequently Asked Questions document for packages
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
    backgroundColor: '#f0f0f0',
    padding: 8,
  },
  qaItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  question: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e40af',
  },
  answer: {
    fontSize: 11,
    color: '#333',
    textAlign: 'justify',
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

export type FAQData = {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  packageName: string;
  destination: string;
  footerText?: string;
  language?: 'id' | 'en';
  customFAQs?: Array<{ question: string; answer: string }>; // Optional custom FAQs from package settings
};

export function FAQPDF({ data }: { data: FAQData }) {
  const lang = data.language || 'id';
  const texts = {
    id: {
      title: 'PERTANYAAN YANG SERING DIAJUKAN (FAQ)',
      section1: 'PERTANYAAN UMUM TENTANG BOOKING',
      section1QAs: [
        {
          q: 'Bagaimana cara melakukan booking?',
          a: 'Anda dapat melakukan booking melalui website kami atau menghubungi customer service. Setelah booking dikonfirmasi, Anda akan menerima voucher dan invoice melalui email.',
        },
        {
          q: 'Kapan saya harus melakukan pembayaran?',
          a: 'Pembayaran harus dilakukan sesuai dengan ketentuan yang tertera di invoice. Umumnya pembayaran dilakukan sebelum tanggal keberangkatan atau sesuai dengan payment terms yang disepakati.',
        },
        {
          q: 'Apakah saya bisa mengubah tanggal trip setelah booking?',
          a: 'Perubahan tanggal trip dapat dilakukan dengan syarat dan ketentuan tertentu. Silakan hubungi customer service untuk informasi lebih lanjut. Biaya perubahan mungkin dikenakan.',
        },
        {
          q: 'Bagaimana jika saya ingin membatalkan booking?',
          a: 'Pembatalan booking dapat dilakukan dengan mengikuti kebijakan pembatalan yang tertera di syarat dan ketentuan. Refund akan diproses sesuai dengan kebijakan yang berlaku.',
        },
      ],
      section2: 'PERTANYAAN TENTANG PERJALANAN',
      section2QAs: [
        {
          q: 'Apa saja yang termasuk dalam paket?',
          a: 'Detail lengkap mengenai apa yang termasuk dan tidak termasuk dalam paket dapat dilihat di voucher atau dokumen itinerary. Umumnya termasuk transportasi, akomodasi, dan beberapa aktivitas sesuai paket yang dipilih.',
        },
        {
          q: 'Bagaimana dengan makanan selama trip?',
          a: 'Informasi mengenai makanan (termasuk atau tidak) akan tertera di detail paket. Beberapa paket termasuk makan, beberapa tidak. Silakan cek detail paket untuk informasi lengkap.',
        },
        {
          q: 'Apakah ada asuransi perjalanan?',
          a: 'Asuransi perjalanan umumnya tidak termasuk dalam paket. Peserta disarankan untuk memiliki asuransi perjalanan sendiri yang mencakup aktivitas yang akan dilakukan.',
        },
        {
          q: 'Bagaimana jika terjadi force majeure?',
          a: 'Jika terjadi force majeure (bencana alam, perang, dll) yang menyebabkan trip dibatalkan, kami akan memberikan refund penuh atau menawarkan alternatif trip. Detail lengkap ada di syarat dan ketentuan.',
        },
      ],
      section3: 'PERTANYAAN TENTANG PEMBAYARAN & REFUND',
      section3QAs: [
        {
          q: 'Metode pembayaran apa saja yang diterima?',
          a: 'Kami menerima pembayaran melalui transfer bank, e-wallet, atau kartu kredit/debit sesuai dengan opsi yang tersedia di sistem booking.',
        },
        {
          q: 'Berapa lama proses refund?',
          a: 'Proses refund memakan waktu 5-14 hari kerja setelah persetujuan, tergantung pada metode pembayaran dan bank yang digunakan.',
        },
        {
          q: 'Apakah ada biaya admin untuk refund?',
          a: 'Biaya admin bank (jika ada) akan dikurangi dari jumlah refund. Detail lengkap mengenai biaya admin dapat dilihat di syarat dan ketentuan.',
        },
        {
          q: 'Kemana refund akan dikembalikan?',
          a: 'Refund akan dikembalikan ke metode pembayaran asli atau ke wallet sesuai dengan kebijakan yang berlaku. Detail akan dikomunikasikan saat proses refund.',
        },
      ],
      section4: 'PERTANYAAN LAINNYA',
      section4QAs: [
        {
          q: 'Bagaimana cara menghubungi customer service?',
          a: 'Anda dapat menghubungi customer service melalui email, telepon, atau melalui support ticket di website. Jam operasional dan kontak dapat dilihat di website kami.',
        },
        {
          q: 'Apakah ada diskon untuk booking grup?',
          a: 'Diskon untuk booking grup tersedia untuk beberapa paket. Silakan hubungi customer service untuk informasi lebih lanjut mengenai paket dan syarat yang berlaku.',
        },
        {
          q: 'Bagaimana jika saya memiliki kebutuhan khusus?',
          a: 'Jika Anda memiliki kebutuhan khusus (aksesibilitas, makanan khusus, dll), silakan informasikan saat booking atau hubungi customer service. Kami akan berusaha mengakomodasi sesuai kemampuan.',
        },
      ],
      footer: 'Jika pertanyaan Anda tidak terjawab di FAQ ini, silakan hubungi customer service kami.',
    },
    en: {
      title: 'FREQUENTLY ASKED QUESTIONS (FAQ)',
      section1: 'GENERAL BOOKING QUESTIONS',
      section1QAs: [
        {
          q: 'How do I make a booking?',
          a: 'You can make a booking through our website or by contacting customer service. After the booking is confirmed, you will receive a voucher and invoice via email.',
        },
        {
          q: 'When should I make payment?',
          a: 'Payment must be made according to the terms stated in the invoice. Generally, payment is made before the departure date or according to the agreed payment terms.',
        },
        {
          q: 'Can I change the trip date after booking?',
          a: 'Trip date changes can be made with certain terms and conditions. Please contact customer service for more information. Change fees may apply.',
        },
        {
          q: 'What if I want to cancel my booking?',
          a: 'Booking cancellation can be done by following the cancellation policy stated in the terms and conditions. Refund will be processed according to applicable policy.',
        },
      ],
      section2: 'TRAVEL QUESTIONS',
      section2QAs: [
        {
          q: 'What is included in the package?',
          a: 'Complete details about what is included and not included in the package can be seen in the voucher or itinerary document. Generally includes transportation, accommodation, and some activities according to the selected package.',
        },
        {
          q: 'What about meals during the trip?',
          a: 'Information about meals (included or not) will be stated in the package details. Some packages include meals, some do not. Please check the package details for complete information.',
        },
        {
          q: 'Is travel insurance included?',
          a: 'Travel insurance is generally not included in the package. Participants are advised to have their own travel insurance that covers the activities to be performed.',
        },
        {
          q: 'What if force majeure occurs?',
          a: 'If force majeure (natural disasters, war, etc.) occurs that causes the trip to be cancelled, we will provide a full refund or offer an alternative trip. Complete details are in the terms and conditions.',
        },
      ],
      section3: 'PAYMENT & REFUND QUESTIONS',
      section3QAs: [
        {
          q: 'What payment methods are accepted?',
          a: 'We accept payments via bank transfer, e-wallet, or credit/debit card according to the options available in the booking system.',
        },
        {
          q: 'How long does the refund process take?',
          a: 'The refund process takes 5-14 business days after approval, depending on the payment method and bank used.',
        },
        {
          q: 'Is there an admin fee for refund?',
          a: 'Bank admin fees (if any) will be deducted from the refund amount. Complete details about admin fees can be seen in the terms and conditions.',
        },
        {
          q: 'Where will the refund be returned?',
          a: 'Refund will be returned to the original payment method or to wallet according to applicable policy. Details will be communicated during the refund process.',
        },
      ],
      section4: 'OTHER QUESTIONS',
      section4QAs: [
        {
          q: 'How do I contact customer service?',
          a: 'You can contact customer service via email, phone, or through support ticket on the website. Operating hours and contacts can be seen on our website.',
        },
        {
          q: 'Are there discounts for group bookings?',
          a: 'Discounts for group bookings are available for some packages. Please contact customer service for more information about packages and applicable terms.',
        },
        {
          q: 'What if I have special needs?',
          a: 'If you have special needs (accessibility, special meals, etc.), please inform us when booking or contact customer service. We will try to accommodate according to our capabilities.',
        },
      ],
      footer: 'If your question is not answered in this FAQ, please contact our customer service.',
    },
  };

  const t = texts[lang];

  const sections = [
    { title: t.section1, qas: t.section1QAs },
    { title: t.section2, qas: t.section2QAs },
    { title: t.section3, qas: t.section3QAs },
    { title: t.section4, qas: t.section4QAs },
  ];

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
      // Package Info
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: { marginBottom: 5, fontWeight: 'bold' } },
          lang === 'id' ? `Paket: ${data.packageName}` : `Package: ${data.packageName}`
        ),
        React.createElement(Text, { style: { marginBottom: 10 } },
          lang === 'id' ? `Destinasi: ${data.destination}` : `Destination: ${data.destination}`
        )
      ),
      // Custom FAQs (if provided)
      data.customFAQs && data.customFAQs.length > 0 && React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle },
          lang === 'id' ? 'PERTANYAAN KHUSUS' : 'SPECIAL QUESTIONS'
        ),
        data.customFAQs.map((faq, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.qaItem },
            React.createElement(Text, { style: styles.question }, `Q: ${faq.question}`),
            React.createElement(Text, { style: styles.answer }, `A: ${faq.answer}`)
          )
        )
      ),
      // Sections
      sections.map((section, sectionIdx) =>
        React.createElement(
          View,
          { key: sectionIdx, style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, section.title),
          section.qas.map((qa, qaIdx) =>
            React.createElement(
              View,
              { key: qaIdx, style: styles.qaItem },
              React.createElement(Text, { style: styles.question }, `Q: ${qa.q}`),
              React.createElement(Text, { style: styles.answer }, `A: ${qa.a}`)
            )
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
export async function generateFAQPDF(data: FAQData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const pdfDoc = React.createElement(FAQPDF, { data });
  const buffer = await renderToBuffer(pdfDoc);
  return Buffer.from(buffer);
}

