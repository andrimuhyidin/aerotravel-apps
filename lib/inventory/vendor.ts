/**
 * Vendor Management
 * Sesuai PRD 4.4.C - Vendor Price Lock
 * 
 * Features:
 * - Vendor database dengan harga terkunci
 * - Vendor selection (dropdown, no manual input)
 * - Vendor expenses untuk trip
 */

import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

export type VendorType =
  | 'boat_rental'
  | 'catering'
  | 'transport'
  | 'accommodation'
  | 'ticket'
  | 'equipment'
  | 'other';

export type Vendor = {
  id: string;
  name: string;
  vendorType: VendorType;
  description?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  defaultPrice: number;
  priceUnit: string; // per trip, per pax, per day
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  isActive: boolean;
};

export type VendorExpense = {
  tripId: string;
  vendorId: string;
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  receiptUrl?: string;
};

const vendorTypeLabels: Record<VendorType, string> = {
  boat_rental: 'Sewa Kapal',
  catering: 'Katering',
  transport: 'Transportasi',
  accommodation: 'Akomodasi',
  ticket: 'Tiket Masuk',
  equipment: 'Peralatan',
  other: 'Lainnya',
};

export function getVendorTypeLabel(type: VendorType): string {
  return vendorTypeLabels[type];
}

/**
 * Get all vendors for a branch
 */
export async function getVendors(
  branchId: string,
  vendorType?: VendorType
): Promise<Vendor[]> {
  const supabase = createClient();

  let query = supabase
    .from('vendors')
    .select('*')
    .eq('branch_id', branchId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  if (vendorType) {
    query = query.eq('vendor_type', vendorType);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to get vendors', error);
    return [];
  }

  return data.map((v) => ({
    id: v.id,
    name: v.name,
    vendorType: v.vendor_type as VendorType,
    description: v.description ?? undefined,
    contactPerson: v.contact_person ?? undefined,
    phone: v.phone ?? undefined,
    email: v.email ?? undefined,
    address: v.address ?? undefined,
    defaultPrice: Number(v.default_price),
    priceUnit: v.price_unit || 'per trip',
    bankName: v.bank_name ?? undefined,
    bankAccountNumber: v.bank_account_number ?? undefined,
    bankAccountName: v.bank_account_name ?? undefined,
    isActive: v.is_active ?? true,
  }));
}

/**
 * Get vendor by ID
 */
export async function getVendorById(vendorId: string): Promise<Vendor | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    vendorType: data.vendor_type as VendorType,
    description: data.description ?? undefined,
    contactPerson: data.contact_person ?? undefined,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    address: data.address ?? undefined,
    defaultPrice: Number(data.default_price),
    priceUnit: data.price_unit || 'per trip',
    bankName: data.bank_name ?? undefined,
    bankAccountNumber: data.bank_account_number ?? undefined,
    bankAccountName: data.bank_account_name ?? undefined,
    isActive: data.is_active ?? true,
  };
}

/**
 * Create vendor expense for trip
 * PRD: Admin hanya bisa memilih dari dropdown, tidak bisa input harga manual
 */
export async function createVendorExpense(
  expense: VendorExpense,
  createdBy?: string
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();

  // Verify vendor exists and get locked price
  const vendor = await getVendorById(expense.vendorId);
  if (!vendor) {
    return { success: false, message: 'Vendor tidak ditemukan.' };
  }

  // Use locked price from vendor database
  const unitPrice = vendor.defaultPrice;
  const totalAmount = expense.quantity * unitPrice;

  // Map category string to enum
  const categoryMap: Record<string, 'fuel' | 'food' | 'ticket' | 'transport' | 'equipment' | 'emergency' | 'other'> = {
    fuel: 'fuel',
    food: 'food',
    ticket: 'ticket',
    transport: 'transport',
    equipment: 'equipment',
    emergency: 'emergency',
    other: 'other',
  };
  
  const { error } = await supabase.from('trip_expenses').insert({
    trip_id: expense.tripId,
    vendor_id: expense.vendorId,
    category: categoryMap[expense.category] || 'other',
    description: expense.description,
    quantity: expense.quantity,
    unit_price: unitPrice, // LOCKED from vendor
    total_amount: totalAmount,
    receipt_url: expense.receiptUrl,
    created_by: createdBy,
  });

  if (error) {
    logger.error('Create vendor expense failed', error);
    return { success: false, message: 'Gagal mencatat pengeluaran.' };
  }

  return { success: true, message: 'Pengeluaran berhasil dicatat.' };
}

/**
 * Get trip expenses
 */
export async function getTripExpenses(tripId: string): Promise<
  Array<{
    id: string;
    vendorName: string;
    vendorType: VendorType;
    category: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    isAnomaly: boolean;
    createdAt: string;
  }>
> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('trip_expenses')
    .select(`
      *,
      vendor:vendors(name, vendor_type)
    `)
    .eq('trip_id', tripId)
    .order('created_at');

  if (error) {
    logger.error('Failed to get trip expenses', error);
    return [];
  }

  return data.map((e) => ({
    id: e.id,
    vendorName: e.vendor?.name || 'Unknown',
    vendorType: e.vendor?.vendor_type as VendorType || 'other',
    category: e.category,
    description: e.description,
    quantity: Number(e.quantity),
    unitPrice: Number(e.unit_price),
    totalAmount: Number(e.total_amount),
    isAnomaly: e.is_anomaly ?? false,
    createdAt: e.created_at || new Date().toISOString(),
  }));
}

/**
 * Create new vendor (Admin only)
 */
export async function createVendor(
  branchId: string,
  data: Omit<Vendor, 'id' | 'isActive'>
): Promise<{ success: boolean; id?: string; message: string }> {
  const supabase = createClient();

  const { data: vendor, error } = await supabase
    .from('vendors')
    .insert({
      branch_id: branchId,
      name: data.name,
      vendor_type: data.vendorType,
      description: data.description,
      contact_person: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address,
      default_price: data.defaultPrice,
      price_unit: data.priceUnit,
      bank_name: data.bankName,
      bank_account_number: data.bankAccountNumber,
      bank_account_name: data.bankAccountName,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Create vendor failed', error);
    return { success: false, message: 'Gagal membuat vendor.' };
  }

  return { success: true, id: vendor.id, message: 'Vendor berhasil dibuat.' };
}

/**
 * Update vendor price (Admin only)
 */
export async function updateVendorPrice(
  vendorId: string,
  newPrice: number
): Promise<{ success: boolean; message: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from('vendors')
    .update({ default_price: newPrice })
    .eq('id', vendorId);

  if (error) {
    logger.error('Update vendor price failed', error);
    return { success: false, message: 'Gagal update harga.' };
  }

  return { success: true, message: 'Harga vendor berhasil diupdate.' };
}
