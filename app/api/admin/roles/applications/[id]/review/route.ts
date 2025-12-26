/**
 * API: Partner Application Review
 * GET /api/admin/roles/applications/[id]/review - Get application with company data & legal docs
 * POST /api/admin/roles/applications/[id]/review - Review and approve/reject application
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  adminNotes: z.string().optional(),
  verifiedCompanyData: z.record(z.unknown()).optional(), // Admin can correct OCR data
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const client = supabase as unknown as any;

    // Get application
    const { data: application, error: appError } = await client
      .from('role_applications')
      .select(`
        *,
        user:users(id, email, full_name, phone)
      `)
      .eq('id', id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get legal documents if this is a partner application
    let legalDocuments = [];
    if (application.requested_role === 'mitra' && application.legal_documents) {
      const documentIds = application.legal_documents as string[];
      if (documentIds.length > 0) {
        const { data: docs, error: docsError } = await client
          .from('partner_legal_documents')
          .select('*')
          .in('id', documentIds);

        if (!docsError) {
          legalDocuments = docs || [];
        }
      }
    }

    return NextResponse.json({
      application,
      legalDocuments,
    });
  } catch (error) {
    logger.error('Error in GET /api/admin/roles/applications/[id]/review', error, { id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();

  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = reviewSchema.parse(body);

    const client = supabase as unknown as any;

    // Get application
    const { data: application, error: appError } = await client
      .from('role_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Application already reviewed' },
        { status: 400 }
      );
    }

    if (validated.action === 'approve') {
      // Update application status
      await client
        .from('role_applications')
        .update({
          status: 'approved',
          application_status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.id,
          admin_notes: validated.adminNotes || null,
          company_data: validated.verifiedCompanyData || application.company_data,
        })
        .eq('id', id);

      // If partner application, update users table with company info
      if (application.requested_role === 'mitra' && application.company_data) {
        const companyData = validated.verifiedCompanyData || (application.company_data as Record<string, unknown>);

        const updateData: Record<string, unknown> = {
          company_name: companyData.companyName || null,
          company_address: companyData.companyAddress || null,
          npwp: companyData.npwp || null,
          phone: companyData.phone || null,
          siup_number: companyData.siupNumber || null,
          siup_document_url: companyData.siupDocumentUrl || null,
          bank_name: companyData.bankName || null,
          bank_account_number: companyData.bankAccountNumber || null,
          bank_account_name: companyData.bankAccountName || null,
          updated_at: new Date().toISOString(),
        };

        await client
          .from('users')
          .update(updateData)
          .eq('id', application.user_id);
      }

      // Create user_role entry (reuse existing logic from approve route)
      const { error: roleError } = await client.from('user_roles').insert({
        user_id: application.user_id,
        role: application.requested_role,
        status: 'active',
        is_primary: false, // Check if this is first role
        applied_at: new Date().toISOString(),
        approved_at: new Date().toISOString(),
        approved_by: adminUser.id,
      });

      if (roleError) {
        logger.error('Failed to create user role', roleError, {
          userId: application.user_id,
          role: application.requested_role,
        });
      }

      logger.info('Partner application approved', {
        applicationId: id,
        userId: application.user_id,
        adminId: adminUser.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Application approved successfully',
      });
    } else {
      // Reject
      await client
        .from('role_applications')
        .update({
          status: 'rejected',
          application_status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.id,
          admin_notes: validated.adminNotes || null,
          rejection_reason: validated.adminNotes || null,
        })
        .eq('id', id);

      logger.info('Partner application rejected', {
        applicationId: id,
        userId: application.user_id,
        adminId: adminUser.id,
      });

      return NextResponse.json({
        success: true,
        message: 'Application rejected',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error in POST /api/admin/roles/applications/[id]/review', error, { id });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

