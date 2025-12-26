/**
 * Multi-Language Document Helper
 * Helper functions untuk generate multi-language documents
 */

import { getDocumentTranslations, type DocumentLanguage } from './document-translations';

/**
 * Format date berdasarkan language
 */
export function formatDate(
  date: string | Date,
  language: DocumentLanguage = 'id'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'en' ? 'en-US' : 'id-ID';
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format currency (IDR) - language independent
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get document language dari query params atau default
 */
export function getDocumentLanguage(
  langParam: string | null | undefined
): DocumentLanguage {
  if (langParam === 'en' || langParam === 'id') {
    return langParam;
  }
  return 'id'; // Default to Indonesian
}

/**
 * Format invoice data dengan translations
 */
export function formatInvoiceData(
  data: {
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    paidAmount?: number;
    paymentStatus: 'paid' | 'pending' | 'partial';
  },
  language: DocumentLanguage = 'id'
) {
  const t = getDocumentTranslations(language);
  
  return {
    ...data,
    invoiceDateFormatted: formatDate(data.invoiceDate, language),
    dueDateFormatted: data.dueDate ? formatDate(data.dueDate, language) : undefined,
    subtotalFormatted: formatCurrency(data.subtotal),
    discountFormatted: data.discount ? formatCurrency(data.discount) : undefined,
    taxFormatted: data.tax ? formatCurrency(data.tax) : undefined,
    totalFormatted: formatCurrency(data.total),
    paidAmountFormatted: data.paidAmount ? formatCurrency(data.paidAmount) : undefined,
    remainingFormatted: data.paidAmount
      ? formatCurrency(data.total - data.paidAmount)
      : undefined,
    paymentStatusLabel: t.invoice[data.paymentStatus] || data.paymentStatus,
    labels: {
      invoiceNumber: t.invoice.invoiceNumber,
      invoiceDate: t.invoice.invoiceDate,
      dueDate: t.invoice.dueDate,
      subtotal: t.invoice.subtotal,
      discount: t.invoice.discount,
      tax: t.invoice.tax,
      total: t.invoice.totalAmount,
      paidAmount: t.invoice.paidAmount,
      remainingAmount: t.invoice.remainingAmount,
      paymentStatus: t.invoice.paymentStatus,
    },
  };
}

/**
 * Format voucher data dengan translations
 */
export function formatVoucherData(
  data: {
    voucherNumber: string;
    bookingCode: string;
    tripDate: string;
    adultPax: number;
    childPax: number;
    infantPax: number;
    totalAmount: number;
  },
  language: DocumentLanguage = 'id'
) {
  const t = getDocumentTranslations(language);
  
  return {
    ...data,
    tripDateFormatted: formatDate(data.tripDate, language),
    totalAmountFormatted: formatCurrency(data.totalAmount),
    labels: {
      voucherNumber: t.voucher.voucherNumber,
      bookingCode: t.voucher.bookingCode,
      tripDate: t.voucher.tripDate,
      adultPax: t.voucher.adultPax,
      childPax: t.voucher.childPax,
      infantPax: t.voucher.infantPax,
      totalAmount: t.voucher.totalAmount,
    },
  };
}

