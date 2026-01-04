/**
 * Document Translations
 * Translation strings untuk multi-language documents (Invoice, Voucher, etc.)
 */

export type DocumentLanguage = 'id' | 'en';

export type DocumentTranslations = {
  invoice: {
    title: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    from: string;
    to: string;
    item: string;
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
    subtotal: string;
    discount: string;
    tax: string;
    totalAmount: string;
    paidAmount: string;
    remainingAmount: string;
    paymentStatus: string;
    paid: string;
    pending: string;
    partial: string;
    notes: string;
    termsAndConditions: string;
    thankYou: string;
  };
  voucher: {
    title: string;
    voucherNumber: string;
    bookingCode: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    packageName: string;
    destination: string;
    tripDate: string;
    adultPax: string;
    childPax: string;
    infantPax: string;
    totalAmount: string;
    specialInstructions: string;
    footer: string;
  };
  common: {
    date: string;
    phone: string;
    email: string;
    address: string;
    company: string;
    contact: string;
  };
};

const translations: Record<DocumentLanguage, DocumentTranslations> = {
  id: {
    invoice: {
      title: 'Faktur',
      invoiceNumber: 'Nomor Faktur',
      invoiceDate: 'Tanggal Faktur',
      dueDate: 'Jatuh Tempo',
      from: 'Dari',
      to: 'Kepada',
      item: 'Item',
      description: 'Deskripsi',
      quantity: 'Jumlah',
      unitPrice: 'Harga Satuan',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Diskon',
      tax: 'Pajak (PPN)',
      totalAmount: 'Total Pembayaran',
      paidAmount: 'Jumlah Dibayar',
      remainingAmount: 'Sisa Pembayaran',
      paymentStatus: 'Status Pembayaran',
      paid: 'Lunas',
      pending: 'Belum Dibayar',
      partial: 'Sebagian',
      notes: 'Catatan',
      termsAndConditions: 'Syarat & Ketentuan',
      thankYou: 'Terima kasih atas kepercayaan Anda.',
    },
    voucher: {
      title: 'Voucher Perjalanan',
      voucherNumber: 'Nomor Voucher',
      bookingCode: 'Kode Booking',
      customerName: 'Nama Pelanggan',
      customerPhone: 'Nomor Telepon',
      customerEmail: 'Email',
      packageName: 'Nama Paket',
      destination: 'Destinasi',
      tripDate: 'Tanggal Perjalanan',
      adultPax: 'Dewasa',
      childPax: 'Anak-anak',
      infantPax: 'Bayi',
      totalAmount: 'Total Pembayaran',
      specialInstructions: 'Instruksi Khusus',
      footer: 'Voucher ini berlaku untuk perjalanan yang tertera di atas.',
    },
    common: {
      date: 'Tanggal',
      phone: 'Telepon',
      email: 'Email',
      address: 'Alamat',
      company: 'Perusahaan',
      contact: 'Kontak',
    },
  },
  en: {
    invoice: {
      title: 'Invoice',
      invoiceNumber: 'Invoice Number',
      invoiceDate: 'Invoice Date',
      dueDate: 'Due Date',
      from: 'From',
      to: 'To',
      item: 'Item',
      description: 'Description',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      total: 'Total',
      subtotal: 'Subtotal',
      discount: 'Discount',
      tax: 'Tax (VAT)',
      totalAmount: 'Total Amount',
      paidAmount: 'Paid Amount',
      remainingAmount: 'Remaining Amount',
      paymentStatus: 'Payment Status',
      paid: 'Paid',
      pending: 'Pending',
      partial: 'Partial',
      notes: 'Notes',
      termsAndConditions: 'Terms & Conditions',
      thankYou: 'Thank you for your trust.',
    },
    voucher: {
      title: 'Travel Voucher',
      voucherNumber: 'Voucher Number',
      bookingCode: 'Booking Code',
      customerName: 'Customer Name',
      customerPhone: 'Phone Number',
      customerEmail: 'Email',
      packageName: 'Package Name',
      destination: 'Destination',
      tripDate: 'Trip Date',
      adultPax: 'Adults',
      childPax: 'Children',
      infantPax: 'Infants',
      totalAmount: 'Total Amount',
      specialInstructions: 'Special Instructions',
      footer: 'This voucher is valid for the trip specified above.',
    },
    common: {
      date: 'Date',
      phone: 'Phone',
      email: 'Email',
      address: 'Address',
      company: 'Company',
      contact: 'Contact',
    },
  },
};

/**
 * Get translations for a specific language
 */
export function getDocumentTranslations(
  language: DocumentLanguage = 'id'
): DocumentTranslations {
  return translations[language] || translations.id;
}

/**
 * Get translation for a specific key
 */
export function t(
  category: keyof DocumentTranslations,
  key: string,
  language: DocumentLanguage = 'id'
): string {
  const translations = getDocumentTranslations(language);
  const categoryTranslations = translations[category] as Record<string, string>;
  return categoryTranslations[key] || key;
}

