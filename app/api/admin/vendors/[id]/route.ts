/**
 * Admin Vendor Detail API
 * GET /api/admin/vendors/[id] - Get vendor detail
 * PUT /api/admin/vendors/[id] - Update vendor
 * PATCH /api/admin/vendors/[id]/price - Update price only (locked price enforcement)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getVendorById, updateVendorPrice, type VendorType } from '@/lib/inventory';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

const vendorTypes: VendorType[] = [
  'boat_rental',
  'catering',
  'transport',
  'accommodation',
  'ticket',
  'equipment',
  'other',
];

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  vendorType: z.enum(vendorTypes as [VendorType, ...VendorType[]]).optional(),
  description: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  defaultPrice: z.number().min(0).optional(),
  priceUnit: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  isActive: z.boolean().optional(),
});

const updatePriceSchema = z.object({
  newPrice: z.number().min(0, 'Price must be positive'),
  reason: z.string().min(1, 'Reason is required for price changes'),
});

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;

  logger.info('GET /api/admin/vendors/[id]', { id });

  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const vendor = await getVendorById(id);

  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

  // Get price history
  const supabase = await createClient();
  const { data: priceHistory } = await supabase
    .from('vendor_price_history')
    .select('id, old_price, new_price, reason, changed_by, changed_at, changed_by_user:users(full_name)')
    .eq('vendor_id', id)
    .order('changed_at', { ascending: false })
    .limit(10);

  const formattedHistory = (priceHistory || []).map((h) => ({
    id: h.id,
    oldPrice: h.old_price,
    newPrice: h.new_price,
    reason: h.reason,
    changedBy: (h.changed_by_user as { full_name: string | null } | null)?.full_name || 'System',
    changedAt: h.changed_at,
  }));

  return NextResponse.json({
    vendor,
    priceHistory: formattedHistory,
  });
});

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;

  logger.info('PUT /api/admin/vendors/[id]', { id });

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateVendorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Get current vendor
  const currentVendor = await getVendorById(id);
  if (!currentVendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

  // If price is being changed, log it to history
  if (parsed.data.defaultPrice !== undefined && parsed.data.defaultPrice !== currentVendor.defaultPrice) {
    await supabase.from('vendor_price_history').insert({
      vendor_id: id,
      old_price: currentVendor.defaultPrice,
      new_price: parsed.data.defaultPrice,
      reason: 'Vendor update',
      changed_by: user.id,
    });
  }

  // Update vendor
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.vendorType) updateData.vendor_type = parsed.data.vendorType;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.contactPerson !== undefined) updateData.contact_person = parsed.data.contactPerson;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email || null;
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address;
  if (parsed.data.defaultPrice !== undefined) updateData.default_price = parsed.data.defaultPrice;
  if (parsed.data.priceUnit !== undefined) updateData.price_unit = parsed.data.priceUnit;
  if (parsed.data.bankName !== undefined) updateData.bank_name = parsed.data.bankName;
  if (parsed.data.bankAccountNumber !== undefined) updateData.bank_account_number = parsed.data.bankAccountNumber;
  if (parsed.data.bankAccountName !== undefined) updateData.bank_account_name = parsed.data.bankAccountName;
  if (parsed.data.isActive !== undefined) updateData.is_active = parsed.data.isActive;

  const { error } = await supabase.from('vendors').update(updateData).eq('id', id);

  if (error) {
    logger.error('Update vendor failed', error);
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
  }

  logger.info('Vendor updated', { userId: user.id, vendorId: id });

  return NextResponse.json({
    success: true,
    message: 'Vendor berhasil diupdate',
  });
});

export const PATCH = withErrorHandler(async (request: NextRequest, context: RouteParams) => {
  const { id } = await context.params;

  logger.info('PATCH /api/admin/vendors/[id] - Price update', { id });

  // Only super_admin can update locked prices
  const allowed = await hasRole(['super_admin']);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Hanya Super Admin yang dapat mengubah harga terkunci' },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updatePriceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { newPrice, reason } = parsed.data;

  // Get current vendor
  const currentVendor = await getVendorById(id);
  if (!currentVendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

  // Log price change to history
  await supabase.from('vendor_price_history').insert({
    vendor_id: id,
    old_price: currentVendor.defaultPrice,
    new_price: newPrice,
    reason,
    changed_by: user.id,
  });

  // Update price
  const result = await updateVendorPrice(id, newPrice);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  logger.info('Vendor price updated', {
    userId: user.id,
    vendorId: id,
    oldPrice: currentVendor.defaultPrice,
    newPrice,
    reason,
  });

  return NextResponse.json({
    success: true,
    message: `Harga berhasil diupdate dari Rp ${currentVendor.defaultPrice.toLocaleString('id-ID')} ke Rp ${newPrice.toLocaleString('id-ID')}`,
  });
});

