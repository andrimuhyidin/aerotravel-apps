/**
 * Whitelabel Invoice Generator
 * Sesuai PRD 4.3.B - Partner Portal
 * 
 * Generate invoice dengan logo dan identitas partner
 */

import { logger } from '@/lib/utils/logger';

export type MitraProfile = {
  id: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
};

export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type WhitelabelInvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  
  // Mitra (Seller)
  mitra: MitraProfile;
  
  // Customer (Buyer)
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  
  // Trip/Booking Info
  bookingCode: string;
  tripDate: string;
  packageName: string;
  
  // Items
  items: InvoiceItem[];
  
  // Totals
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  
  // Notes
  notes?: string;
  termsAndConditions?: string;
  
  // Payment
  paymentStatus: 'paid' | 'pending' | 'partial';
  paidAmount?: number;
};

/**
 * Get mitra profile for whitelabel
 */
export async function getMitraProfile(mitraId: string): Promise<MitraProfile | null> {
  try {
    const response = await fetch(`/api/partner/profile/${mitraId}`);
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    logger.error('Failed to get mitra profile', error);
    return null;
  }
}

/**
 * Generate whitelabel invoice data from booking
 */
export async function generateWhitelabelInvoiceData(
  bookingId: string,
  mitraId: string
): Promise<WhitelabelInvoiceData | null> {
  try {
    const response = await fetch(`/api/partner/invoices/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, mitraId }),
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    logger.error('Failed to generate invoice data', error);
    return null;
  }
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(mitraCode: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `INV-${mitraCode}-${year}${month}${day}-${random}`;
}

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(
  items: InvoiceItem[],
  discountPercent: number = 0,
  taxPercent: number = 0
): {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * (taxPercent / 100);
  const total = afterDiscount + tax;

  return { subtotal, discount, tax, total };
}

/**
 * Format invoice data for PDF
 */
export function formatInvoiceForPDF(data: WhitelabelInvoiceData) {
  return {
    ...data,
    invoiceDateFormatted: new Date(data.invoiceDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    tripDateFormatted: new Date(data.tripDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    dueDateFormatted: data.dueDate
      ? new Date(data.dueDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : undefined,
    subtotalFormatted: formatIDR(data.subtotal),
    discountFormatted: data.discount ? formatIDR(data.discount) : undefined,
    taxFormatted: data.tax ? formatIDR(data.tax) : undefined,
    totalFormatted: formatIDR(data.total),
    paidAmountFormatted: data.paidAmount ? formatIDR(data.paidAmount) : undefined,
    remainingFormatted: data.paidAmount
      ? formatIDR(data.total - data.paidAmount)
      : undefined,
    items: data.items.map((item) => ({
      ...item,
      unitPriceFormatted: formatIDR(item.unitPrice),
      totalFormatted: formatIDR(item.total),
    })),
  };
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Download invoice as PDF
 */
export async function downloadWhitelabelInvoice(
  bookingId: string,
  mitraId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`/api/partner/invoices/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, mitraId }),
    });

    if (!response.ok) {
      throw new Error('Failed to download invoice');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${bookingId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, message: 'Invoice berhasil didownload.' };
  } catch (error) {
    logger.error('Download invoice failed', error);
    return { success: false, message: 'Gagal download invoice.' };
  }
}
