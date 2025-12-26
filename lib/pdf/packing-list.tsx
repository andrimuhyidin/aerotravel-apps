/**
 * Packing List PDF Template
 * Generic packing list document for packages
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
  listItem: {
    marginBottom: 6,
    paddingLeft: 10,
    flexDirection: 'row',
  },
  listBullet: {
    marginRight: 8,
    fontSize: 12,
  },
  listText: {
    flex: 1,
  },
  subItem: {
    marginLeft: 20,
    marginBottom: 4,
    fontSize: 10,
    color: '#555',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #ddd',
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
  note: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fef3c7',
    fontSize: 10,
    fontStyle: 'italic',
  },
});

export type PackingListData = {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  packageName: string;
  destination: string;
  durationDays: number;
  durationNights: number;
  packageType?: string;
  footerText?: string;
  language?: 'id' | 'en';
  customItems?: string[]; // Optional custom items from package settings
};

export function PackingListPDF({ data }: { data: PackingListData }) {
  const lang = data.language || 'id';
  const texts = {
    id: {
      title: 'DAFTAR PACKING',
      packageInfo: 'Informasi Paket',
      section1: '1. PAKAIAN',
      section1Items: [
        'Pakaian sesuai durasi trip (disarankan bawa lebih untuk cadangan)',
        'Pakaian dalam (bawa lebih untuk cadangan)',
        'Kaos kaki (bawa lebih untuk cadangan)',
        'Jaket atau sweater (untuk cuaca dingin atau AC)',
        'Pakaian renang (jika ada aktivitas air)',
        'Pakaian formal (jika diperlukan untuk acara khusus)',
      ],
      section2: '2. ALAS KAKI',
      section2Items: [
        'Sepatu yang nyaman untuk berjalan (disarankan sepatu olahraga)',
        'Sandal atau flip-flop (untuk aktivitas santai)',
        'Sepatu air (jika ada aktivitas air)',
      ],
      section3: '3. DOKUMEN PENTING',
      section3Items: [
        'KTP atau identitas resmi lainnya',
        'Kartu vaksinasi (jika diperlukan)',
        'Tiket perjalanan (print atau digital)',
        'Voucher booking (print atau digital)',
        'Asuransi perjalanan (jika ada)',
        'Kartu kredit/debit (untuk keperluan darurat)',
        'Fotokopi dokumen penting (simpan terpisah dari asli)',
      ],
      section4: '4. ELEKTRONIK & GADGET',
      section4Items: [
        'Smartphone dan charger',
        'Power bank (disarankan kapasitas besar)',
        'Kamera (jika diperlukan)',
        'Adapter listrik (jika bepergian ke luar negeri)',
        'Headphone atau earphone',
      ],
      section5: '5. KESEHATAN & KEBERSIHAN',
      section5Items: [
        'Obat-obatan pribadi (bawa resep jika ada)',
        'Obat sakit kepala, demam, diare',
        'Plester dan perban',
        'Hand sanitizer',
        'Tisu basah dan kering',
        'Sunscreen (SPF minimal 30)',
        'Lip balm',
        'Obat anti nyamuk',
      ],
      section6: '6. BARANG LAINNYA',
      section6Items: [
        'Tas ransel atau tas kecil untuk aktivitas harian',
        'Botol minum (reusable)',
        'Payung atau jas hujan (jika musim hujan)',
        'Topi atau cap',
        'Kacamata hitam',
        'Snack ringan (untuk perjalanan)',
        'Buku atau e-reader (untuk hiburan)',
      ],
      section7: '7. BARANG YANG DILARANG',
      section7Items: [
        'Senjata tajam atau benda berbahaya',
        'Narkoba atau obat-obatan terlarang',
        'Minuman beralkohol (jika dilarang di destinasi)',
        'Barang yang mudah terbakar',
        'Hewan peliharaan (kecuali dengan izin khusus)',
      ],
      note: 'Catatan: Daftar ini adalah panduan umum. Sesuaikan dengan kebutuhan spesifik destinasi dan durasi trip Anda.',
      footer: 'Pastikan semua barang penting sudah dikemas sebelum keberangkatan.',
    },
    en: {
      title: 'PACKING LIST',
      packageInfo: 'Package Information',
      section1: '1. CLOTHING',
      section1Items: [
        'Clothes according to trip duration (recommended to bring extra for backup)',
        'Underwear (bring extra for backup)',
        'Socks (bring extra for backup)',
        'Jacket or sweater (for cold weather or AC)',
        'Swimwear (if there are water activities)',
        'Formal attire (if required for special events)',
      ],
      section2: '2. FOOTWEAR',
      section2Items: [
        'Comfortable walking shoes (athletic shoes recommended)',
        'Sandals or flip-flops (for casual activities)',
        'Water shoes (if there are water activities)',
      ],
      section3: '3. IMPORTANT DOCUMENTS',
      section3Items: [
        'ID card or other official identification',
        'Vaccination card (if required)',
        'Travel tickets (print or digital)',
        'Booking voucher (print or digital)',
        'Travel insurance (if any)',
        'Credit/debit card (for emergency purposes)',
        'Photocopies of important documents (keep separate from originals)',
      ],
      section4: '4. ELECTRONICS & GADGETS',
      section4Items: [
        'Smartphone and charger',
        'Power bank (large capacity recommended)',
        'Camera (if needed)',
        'Power adapter (if traveling abroad)',
        'Headphones or earphones',
      ],
      section5: '5. HEALTH & HYGIENE',
      section5Items: [
        'Personal medications (bring prescription if any)',
        'Headache, fever, diarrhea medicine',
        'Bandages and plasters',
        'Hand sanitizer',
        'Wet and dry tissues',
        'Sunscreen (SPF minimum 30)',
        'Lip balm',
        'Mosquito repellent',
      ],
      section6: '6. OTHER ITEMS',
      section6Items: [
        'Backpack or small bag for daily activities',
        'Water bottle (reusable)',
        'Umbrella or raincoat (if rainy season)',
        'Hat or cap',
        'Sunglasses',
        'Light snacks (for travel)',
        'Book or e-reader (for entertainment)',
      ],
      section7: '7. PROHIBITED ITEMS',
      section7Items: [
        'Sharp weapons or dangerous objects',
        'Drugs or illegal substances',
        'Alcoholic beverages (if prohibited at destination)',
        'Flammable items',
        'Pets (except with special permission)',
      ],
      note: 'Note: This list is a general guide. Adjust according to your specific destination and trip duration needs.',
      footer: 'Make sure all important items are packed before departure.',
    },
  };

  const t = texts[lang];

  const sections = [
    { title: t.section1, items: t.section1Items },
    { title: t.section2, items: t.section2Items },
    { title: t.section3, items: t.section3Items },
    { title: t.section4, items: t.section4Items },
    { title: t.section5, items: t.section5Items },
    { title: t.section6, items: t.section6Items },
    { title: t.section7, items: t.section7Items },
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
        React.createElement(Text, { style: styles.sectionTitle }, t.packageInfo),
        React.createElement(Text, { style: { marginBottom: 5 } },
          lang === 'id' ? `Paket: ${data.packageName}` : `Package: ${data.packageName}`
        ),
        React.createElement(Text, { style: { marginBottom: 5 } },
          lang === 'id' ? `Destinasi: ${data.destination}` : `Destination: ${data.destination}`
        ),
        React.createElement(Text, { style: { marginBottom: 5 } },
          lang === 'id'
            ? `Durasi: ${data.durationDays} Hari ${data.durationNights} Malam`
            : `Duration: ${data.durationDays} Days ${data.durationNights} Nights`
        ),
        data.packageType &&
          React.createElement(Text, { style: { marginBottom: 5 } },
            lang === 'id' ? `Tipe: ${data.packageType}` : `Type: ${data.packageType}`
          )
      ),
      // Custom Items (if provided)
      data.customItems && data.customItems.length > 0 && React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle },
          lang === 'id' ? 'ITEM KHUSUS' : 'SPECIAL ITEMS'
        ),
        data.customItems.map((item, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.listItem },
            React.createElement(Text, { style: styles.listBullet }, '•'),
            React.createElement(Text, { style: styles.listText }, item)
          )
        )
      ),
      // Sections
      sections.map((section, sectionIdx) =>
        React.createElement(
          View,
          { key: sectionIdx, style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, section.title),
          section.items.map((item, itemIdx) =>
            React.createElement(
              View,
              { key: itemIdx, style: styles.listItem },
              React.createElement(Text, { style: styles.listBullet }, '•'),
              React.createElement(Text, { style: styles.listText }, item)
            )
          )
        )
      ),
      // Note
      React.createElement(
        View,
        { style: styles.note },
        React.createElement(Text, null, t.note)
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
export async function generatePackingListPDF(data: PackingListData): Promise<Buffer> {
  const { renderToBuffer } = await import('@react-pdf/renderer');
  const pdfDoc = React.createElement(PackingListPDF, { data });
  const buffer = await renderToBuffer(pdfDoc);
  return Buffer.from(buffer);
}

