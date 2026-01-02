/**
 * Admin Vendors API
 * GET /api/admin/vendors - List vendors
 * POST /api/admin/vendors - Create new vendor
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getVendors, createVendor, type VendorType } from '@/lib/inventory';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const vendorTypes: VendorType[] = [
  'boat_rental',
  'catering',
  'transport',
  'accommodation',
  'ticket',
  'equipment',
  'other',
];

const createVendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  vendorType: z.enum(vendorTypes as [VendorType, ...VendorType[]]),
  description: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  defaultPrice: z.number().min(0, 'Price must be positive'),
  priceUnit: z.string().default('per trip'),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/admin/vendors');

  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_admin']);
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

  // Get user's branch
  const { data: userData } = await supabase
    .from('users')
    .select('branch_id')
    .eq('id', user.id)
    .single();

  const branchId = userData?.branch_id || 'default-branch';

  // Get query params
  const { searchParams } = new URL(request.url);
  const vendorType = searchParams.get('type') as VendorType | null;

  const vendors = await getVendors(branchId, vendorType || undefined);

  return NextResponse.json({
    vendors,
    summary: {
      total: vendors.length,
      byType: vendorTypes.reduce(
        (acc, type) => ({
          ...acc,
          [type]: vendors.filter((v) => v.vendorType === type).length,
        }),
        {} as Record<VendorType, number>
      ),
    },
  });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/vendors');

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
  const parsed = createVendorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Get user's branch
  const { data: userData } = await supabase
    .from('users')
    .select('branch_id')
    .eq('id', user.id)
    .single();

  const branchId = userData?.branch_id || 'default-branch';

  const result = await createVendor(branchId, parsed.data);

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  logger.info('Vendor created', { userId: user.id, vendorId: result.id });

  return NextResponse.json({
    success: true,
    id: result.id,
    message: result.message,
  });
});

