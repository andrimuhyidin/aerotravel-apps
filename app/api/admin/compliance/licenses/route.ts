/**
 * API: Business License Management
 * GET /api/admin/compliance/licenses - List all licenses with filters
 * POST /api/admin/compliance/licenses - Create new license
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Validation schema for creating a license
const createLicenseSchema = z.object({
  licenseType: z.enum(['nib', 'skdn', 'sisupar', 'tdup', 'asita', 'chse']),
  licenseNumber: z.string().min(1).max(100),
  licenseName: z.string().min(1).max(200),
  issuedBy: z.string().min(1).max(200),
  issuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  documentUrl: z.string().url().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  // ASITA-specific fields
  asitaDetails: z.object({
    nia: z.string().min(1).max(50),
    membershipType: z.enum(['regular', 'premium', 'corporate']),
    dpdRegion: z.string().max(100).nullable().optional(),
    memberSince: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).optional(),
});

/**
 * GET /api/admin/compliance/licenses
 * List all licenses with optional filters
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin', 'finance_manager', 'investor'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // Filter by license type
  const status = searchParams.get('status'); // Filter by status
  const search = searchParams.get('search'); // Search by name/number
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  logger.info('GET /api/admin/compliance/licenses', { type, status, search, page, limit });

  // Build query
  let query = supabase
    .from('business_licenses')
    .select(`
      *,
      asita_membership (
        id,
        nia,
        membership_type,
        dpd_region,
        member_since
      ),
      created_by_user:users!business_licenses_created_by_fkey (
        id,
        full_name
      ),
      updated_by_user:users!business_licenses_updated_by_fkey (
        id,
        full_name
      )
    `, { count: 'exact' });

  // Apply filters
  if (type) {
    query = query.eq('license_type', type);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`license_name.ilike.%${search}%,license_number.ilike.%${search}%`);
  }

  // Order by status priority (expired first, then critical, warning, valid)
  // Then by expiry date ascending
  query = query
    .order('status', { ascending: true }) // This puts 'critical' before 'valid' alphabetically
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data: licenses, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch licenses', error);
    return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 });
  }

  // Calculate days until expiry for each license
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enrichedLicenses = (licenses || []).map((license) => {
    const l = license as {
      id: string;
      license_type: string;
      license_number: string;
      license_name: string;
      issued_by: string;
      issued_date: string;
      expiry_date: string | null;
      status: string;
      document_url: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
      asita_membership: Array<{
        id: string;
        nia: string;
        membership_type: string;
        dpd_region: string | null;
        member_since: string;
      }> | null;
      created_by_user: { id: string; full_name: string } | null;
      updated_by_user: { id: string; full_name: string } | null;
    };

    let daysUntilExpiry: number | null = null;
    if (l.expiry_date) {
      const expiryDate = new Date(l.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      id: l.id,
      licenseType: l.license_type,
      licenseNumber: l.license_number,
      licenseName: l.license_name,
      issuedBy: l.issued_by,
      issuedDate: l.issued_date,
      expiryDate: l.expiry_date,
      status: l.status,
      documentUrl: l.document_url,
      notes: l.notes,
      daysUntilExpiry,
      asitaDetails: l.asita_membership?.[0] ? {
        nia: l.asita_membership[0].nia,
        membershipType: l.asita_membership[0].membership_type,
        dpdRegion: l.asita_membership[0].dpd_region,
        memberSince: l.asita_membership[0].member_since,
      } : null,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
      createdBy: l.created_by_user?.full_name || null,
      updatedBy: l.updated_by_user?.full_name || null,
    };
  });

  return NextResponse.json({
    licenses: enrichedLicenses,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
});

/**
 * POST /api/admin/compliance/licenses
 * Create a new license
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role (only super_admin and ops_admin can create)
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'ops_admin'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  
  // Validate input
  const parsed = createLicenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  logger.info('POST /api/admin/compliance/licenses', { 
    licenseType: data.licenseType,
    licenseNumber: data.licenseNumber,
    userId: user.id,
  });

  // Determine initial status based on expiry date
  let initialStatus: 'valid' | 'warning' | 'critical' | 'expired' = 'valid';
  if (data.expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(data.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      initialStatus = 'expired';
    } else if (daysUntilExpiry <= 7) {
      initialStatus = 'critical';
    } else if (daysUntilExpiry <= 30) {
      initialStatus = 'warning';
    }
  }

  // Create license
  const { data: newLicense, error: licenseError } = await supabase
    .from('business_licenses')
    .insert({
      license_type: data.licenseType,
      license_number: data.licenseNumber,
      license_name: data.licenseName,
      issued_by: data.issuedBy,
      issued_date: data.issuedDate,
      expiry_date: data.expiryDate || null,
      status: initialStatus,
      document_url: data.documentUrl || null,
      notes: data.notes || null,
      created_by: user.id,
      updated_by: user.id,
    })
    .select('id')
    .single();

  if (licenseError) {
    logger.error('Failed to create license', licenseError);
    
    if (licenseError.code === '23505') {
      return NextResponse.json(
        { error: 'Izin dengan nomor tersebut sudah ada' },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: 'Failed to create license' }, { status: 500 });
  }

  // If ASITA type, create ASITA membership record
  if (data.licenseType === 'asita' && data.asitaDetails) {
    const { error: asitaError } = await supabase
      .from('asita_membership')
      .insert({
        license_id: newLicense.id,
        nia: data.asitaDetails.nia,
        membership_type: data.asitaDetails.membershipType,
        dpd_region: data.asitaDetails.dpdRegion || null,
        member_since: data.asitaDetails.memberSince,
      });

    if (asitaError) {
      logger.error('Failed to create ASITA membership', asitaError);
      // Rollback license creation
      await supabase.from('business_licenses').delete().eq('id', newLicense.id);
      return NextResponse.json({ error: 'Failed to create ASITA membership details' }, { status: 500 });
    }
  }

  logger.info('License created successfully', { licenseId: newLicense.id });

  return NextResponse.json({
    id: newLicense.id,
    message: 'Izin berhasil ditambahkan',
  }, { status: 201 });
});

