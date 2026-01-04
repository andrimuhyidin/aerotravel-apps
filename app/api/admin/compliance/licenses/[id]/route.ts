/**
 * API: Business License Detail
 * GET /api/admin/compliance/licenses/:id - Get license detail
 * PATCH /api/admin/compliance/licenses/:id - Update license
 * DELETE /api/admin/compliance/licenses/:id - Delete license
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// Validation schema for updating a license
const updateLicenseSchema = z.object({
  licenseNumber: z.string().min(1).max(100).optional(),
  licenseName: z.string().min(1).max(200).optional(),
  issuedBy: z.string().min(1).max(200).optional(),
  issuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  documentUrl: z.string().url().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  status: z.enum(['valid', 'warning', 'critical', 'expired', 'suspended']).optional(),
  // ASITA-specific fields
  asitaDetails: z.object({
    nia: z.string().min(1).max(50),
    membershipType: z.enum(['regular', 'premium', 'corporate']),
    dpdRegion: z.string().max(100).nullable().optional(),
    memberSince: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).optional(),
});

/**
 * GET /api/admin/compliance/licenses/:id
 * Get license detail
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  const { id } = await context.params;
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

  logger.info('GET /api/admin/compliance/licenses/:id', { id });

  const { data: license, error } = await supabase
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
        full_name,
        email
      ),
      updated_by_user:users!business_licenses_updated_by_fkey (
        id,
        full_name,
        email
      ),
      compliance_alerts (
        id,
        alert_type,
        severity,
        message,
        is_read,
        is_resolved,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }
    logger.error('Failed to fetch license', error);
    return NextResponse.json({ error: 'Failed to fetch license' }, { status: 500 });
  }

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
    reminder_30d_sent: boolean;
    reminder_15d_sent: boolean;
    reminder_7d_sent: boolean;
    reminder_1d_sent: boolean;
    created_at: string;
    updated_at: string;
    asita_membership: Array<{
      id: string;
      nia: string;
      membership_type: string;
      dpd_region: string | null;
      member_since: string;
    }> | null;
    created_by_user: { id: string; full_name: string; email: string } | null;
    updated_by_user: { id: string; full_name: string; email: string } | null;
    compliance_alerts: Array<{
      id: string;
      alert_type: string;
      severity: string;
      message: string;
      is_read: boolean;
      is_resolved: boolean;
      created_at: string;
    }> | null;
  };

  // Calculate days until expiry
  let daysUntilExpiry: number | null = null;
  if (l.expiry_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(l.expiry_date);
    expiryDate.setHours(0, 0, 0, 0);
    daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  return NextResponse.json({
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
    remindersSent: {
      days30: l.reminder_30d_sent,
      days15: l.reminder_15d_sent,
      days7: l.reminder_7d_sent,
      days1: l.reminder_1d_sent,
    },
    asitaDetails: l.asita_membership?.[0] ? {
      id: l.asita_membership[0].id,
      nia: l.asita_membership[0].nia,
      membershipType: l.asita_membership[0].membership_type,
      dpdRegion: l.asita_membership[0].dpd_region,
      memberSince: l.asita_membership[0].member_since,
    } : null,
    alerts: (l.compliance_alerts || []).map((alert) => ({
      id: alert.id,
      type: alert.alert_type,
      severity: alert.severity,
      message: alert.message,
      isRead: alert.is_read,
      isResolved: alert.is_resolved,
      createdAt: alert.created_at,
    })),
    createdAt: l.created_at,
    updatedAt: l.updated_at,
    createdBy: l.created_by_user ? {
      id: l.created_by_user.id,
      name: l.created_by_user.full_name,
      email: l.created_by_user.email,
    } : null,
    updatedBy: l.updated_by_user ? {
      id: l.updated_by_user.id,
      name: l.updated_by_user.full_name,
      email: l.updated_by_user.email,
    } : null,
  });
});

/**
 * PATCH /api/admin/compliance/licenses/:id
 * Update a license
 */
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role (only super_admin and ops_admin can update)
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
  const parsed = updateLicenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  logger.info('PATCH /api/admin/compliance/licenses/:id', { id, userId: user.id });

  // Check if license exists
  const { data: existingLicense, error: fetchError } = await supabase
    .from('business_licenses')
    .select('id, license_type')
    .eq('id', id)
    .single();

  if (fetchError || !existingLicense) {
    return NextResponse.json({ error: 'License not found' }, { status: 404 });
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  if (data.licenseNumber !== undefined) updateData.license_number = data.licenseNumber;
  if (data.licenseName !== undefined) updateData.license_name = data.licenseName;
  if (data.issuedBy !== undefined) updateData.issued_by = data.issuedBy;
  if (data.issuedDate !== undefined) updateData.issued_date = data.issuedDate;
  if (data.expiryDate !== undefined) updateData.expiry_date = data.expiryDate;
  if (data.documentUrl !== undefined) updateData.document_url = data.documentUrl;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status !== undefined) updateData.status = data.status;

  // If expiry date is being changed, recalculate status (unless status is manually set)
  if (data.expiryDate !== undefined && data.status === undefined) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (data.expiryDate) {
      const expiryDate = new Date(data.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 0) {
        updateData.status = 'expired';
      } else if (daysUntilExpiry <= 7) {
        updateData.status = 'critical';
      } else if (daysUntilExpiry <= 30) {
        updateData.status = 'warning';
      } else {
        updateData.status = 'valid';
      }

      // Reset reminder flags if expiry date is extended
      if (daysUntilExpiry > 30) {
        updateData.reminder_30d_sent = false;
        updateData.reminder_15d_sent = false;
        updateData.reminder_7d_sent = false;
        updateData.reminder_1d_sent = false;
      }
    } else {
      // No expiry date = perpetual license
      updateData.status = 'valid';
    }
  }

  // Update license
  const { error: updateError } = await supabase
    .from('business_licenses')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    logger.error('Failed to update license', updateError);
    return NextResponse.json({ error: 'Failed to update license' }, { status: 500 });
  }

  // Update ASITA membership if applicable
  if (existingLicense.license_type === 'asita' && data.asitaDetails) {
    const { error: asitaError } = await supabase
      .from('asita_membership')
      .upsert({
        license_id: id,
        nia: data.asitaDetails.nia,
        membership_type: data.asitaDetails.membershipType,
        dpd_region: data.asitaDetails.dpdRegion || null,
        member_since: data.asitaDetails.memberSince,
      }, {
        onConflict: 'license_id',
      });

    if (asitaError) {
      logger.error('Failed to update ASITA membership', asitaError);
      // Don't fail the whole request, just log it
    }
  }

  logger.info('License updated successfully', { licenseId: id });

  return NextResponse.json({
    id,
    message: 'Izin berhasil diperbarui',
  });
});

/**
 * DELETE /api/admin/compliance/licenses/:id
 * Delete a license (soft delete recommended, but this is hard delete)
 */
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  context: RouteParams
) => {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role (only super_admin can delete)
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || userProfile.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden - Only super admin can delete licenses' }, { status: 403 });
  }

  logger.info('DELETE /api/admin/compliance/licenses/:id', { id, userId: user.id });

  // Check if license exists
  const { data: existingLicense, error: fetchError } = await supabase
    .from('business_licenses')
    .select('id, license_name, license_number')
    .eq('id', id)
    .single();

  if (fetchError || !existingLicense) {
    return NextResponse.json({ error: 'License not found' }, { status: 404 });
  }

  // Delete license (cascade will delete asita_membership and compliance_alerts)
  const { error: deleteError } = await supabase
    .from('business_licenses')
    .delete()
    .eq('id', id);

  if (deleteError) {
    logger.error('Failed to delete license', deleteError);
    return NextResponse.json({ error: 'Failed to delete license' }, { status: 500 });
  }

  logger.info('License deleted successfully', { 
    licenseId: id, 
    licenseName: existingLicense.license_name,
    licenseNumber: existingLicense.license_number,
  });

  return NextResponse.json({
    message: 'Izin berhasil dihapus',
  });
});

