/**
 * Invoice Generator
 * Generate invoice data for bookings
 */

import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type InvoiceData = {
  id?: string;
  invoiceNumber?: string;
  bookingId: string;
  customerId?: string;
  invoiceType: 'booking' | 'corporate' | 'partner' | 'manual';
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  discountReason?: string;
  totalAmount: number;
  dueDate: string;
  paymentTerms?: string;
  notes?: string;
  generatedBy: string;
};

export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  subtotal: number;
};

/**
 * Calculate tax amount based on subtotal and rate
 */
export function calculateTax(subtotal: number, taxRate: number = 11): number {
  return Math.round((subtotal * taxRate) / 100);
}

/**
 * Calculate due date based on payment terms
 */
export function calculateDueDate(paymentTerms: string = 'NET 7'): string {
  const today = new Date();
  let daysToAdd = 7;

  switch (paymentTerms) {
    case 'IMMEDIATE':
      daysToAdd = 0;
      break;
    case 'NET 7':
      daysToAdd = 7;
      break;
    case 'NET 14':
      daysToAdd = 14;
      break;
    case 'NET 30':
      daysToAdd = 30;
      break;
  }

  today.setDate(today.getDate() + daysToAdd);
  return today.toISOString().split('T')[0] || '';
}

/**
 * Generate invoice from booking
 */
export async function generateInvoiceFromBooking(
  bookingId: string,
  generatedBy: string,
  options?: {
    taxRate?: number;
    discountAmount?: number;
    discountReason?: string;
    paymentTerms?: string;
    notes?: string;
  }
): Promise<InvoiceData | null> {
  const supabase = await createAdminClient();

  try {
    // Get booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_code,
        customer_id,
        customer_name,
        trip_date,
        adult_pax,
        child_pax,
        infant_pax,
        total_amount,
        discount_amount,
        packages(
          id,
          name,
          base_price,
          child_price
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error || !booking) {
      logger.error('Booking not found for invoice', { bookingId });
      return null;
    }

    const pkg = booking.packages as {
      id: string;
      name: string;
      base_price: number;
      child_price: number;
    } | null;

    // Build invoice items
    const items: InvoiceItem[] = [];

    // Adult package
    if (booking.adult_pax > 0 && pkg) {
      items.push({
        description: `${pkg.name} - Adult`,
        quantity: booking.adult_pax,
        unitPrice: pkg.base_price,
        subtotal: booking.adult_pax * pkg.base_price,
      });
    }

    // Child package
    if (booking.child_pax > 0 && pkg) {
      items.push({
        description: `${pkg.name} - Child`,
        quantity: booking.child_pax,
        unitPrice: pkg.child_price || pkg.base_price * 0.75,
        subtotal: booking.child_pax * (pkg.child_price || pkg.base_price * 0.75),
      });
    }

    // Calculate totals
    const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const taxRate = options?.taxRate ?? 11;
    const discountAmount = options?.discountAmount ?? (booking.discount_amount || 0);
    const subtotalAfterDiscount = itemsSubtotal - discountAmount;
    const taxAmount = calculateTax(subtotalAfterDiscount, taxRate);
    const totalAmount = subtotalAfterDiscount + taxAmount;

    const invoiceData: InvoiceData = {
      bookingId,
      customerId: booking.customer_id || undefined,
      invoiceType: 'booking',
      items,
      subtotal: itemsSubtotal,
      taxRate,
      taxAmount,
      discountAmount,
      discountReason: options?.discountReason,
      totalAmount,
      dueDate: calculateDueDate(options?.paymentTerms),
      paymentTerms: options?.paymentTerms,
      notes: options?.notes,
      generatedBy,
    };

    return invoiceData;
  } catch (error) {
    logger.error('Failed to generate invoice from booking', error);
    return null;
  }
}

/**
 * Save invoice to database
 */
export async function saveInvoice(
  invoiceData: InvoiceData
): Promise<{ id: string; invoiceNumber: string } | null> {
  const supabase = await createAdminClient();

  try {
    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        booking_id: invoiceData.bookingId,
        customer_id: invoiceData.customerId || null,
        invoice_type: invoiceData.invoiceType,
        subtotal: invoiceData.subtotal,
        tax_rate: invoiceData.taxRate,
        tax_amount: invoiceData.taxAmount,
        discount_amount: invoiceData.discountAmount,
        discount_reason: invoiceData.discountReason || null,
        total_amount: invoiceData.totalAmount,
        due_date: invoiceData.dueDate,
        payment_terms: invoiceData.paymentTerms || 'NET 7',
        notes: invoiceData.notes || null,
        generated_by: invoiceData.generatedBy,
        status: 'draft',
      })
      .select('id, invoice_number')
      .single();

    if (invoiceError || !invoice) {
      logger.error('Failed to create invoice', invoiceError);
      return null;
    }

    // Create invoice items
    const invoiceItems = invoiceData.items.map((item, index) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount: item.discount || 0,
      subtotal: item.subtotal,
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      logger.error('Failed to create invoice items', itemsError);
      // Delete the invoice if items failed
      await supabase.from('invoices').delete().eq('id', invoice.id);
      return null;
    }

    logger.info('Invoice created', {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoice_number,
      bookingId: invoiceData.bookingId,
    });

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
    };
  } catch (error) {
    logger.error('Failed to save invoice', error);
    return null;
  }
}

/**
 * Format currency for invoice display
 */
export function formatInvoiceCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

