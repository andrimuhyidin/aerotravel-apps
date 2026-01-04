/**
 * API: Admin - Verify Documents
 * PATCH /api/admin/guide/license/applications/[id]/verify-documents - Verify application documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const verifyDocumentsSchema = z.object({
  document_type: z.enum(['ktp', 'skck', 'medical', 'photo', 'cv']),
  verification_status: z.enum(['verified', 'rejected', 'needs_review']),
  verification_notes: z.string().optional(),
  extracted_data: z.record(z.string(), z.unknown()).optional(),
});

export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['super_admin', 'ops_admin', 'finance_manager'].includes(
    userProfile?.role || ''
  );

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate input
  const validated = verifyDocumentsSchema.parse(body);

  // Get application
  const { data: application } = await client
    .from('guide_license_applications')
    .select('*')
    .eq('id', id)
    .single();

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Update or create document verification
  const { data: existingVerification } = await client
    .from('guide_document_verifications')
    .select('id')
    .eq('application_id', id)
    .eq('document_type', validated.document_type)
    .maybeSingle();

  const verificationData = {
    application_id: id,
    document_type: validated.document_type,
    document_url: (application.documents as Record<string, { url?: string }>)?.[validated.document_type]?.url || '',
    verification_status: validated.verification_status,
    verified_by: user.id,
    verified_at: new Date().toISOString(),
    verification_notes: validated.verification_notes,
    extracted_data: validated.extracted_data,
  };

  if (existingVerification) {
    await client
      .from('guide_document_verifications')
      .update(verificationData)
      .eq('id', existingVerification.id);
  } else {
    await client.from('guide_document_verifications').insert(verificationData);
  }

  // Update application documents status
  const documents = (application.documents as Record<string, unknown>) || {};
  documents[validated.document_type] = {
    ...(documents[validated.document_type] as Record<string, unknown>),
    verified: validated.verification_status === 'verified',
    verified_at: validated.verification_status === 'verified' ? new Date().toISOString() : null,
    verified_by: validated.verification_status === 'verified' ? user.id : null,
  };

  // Check if all required documents are verified
  const requiredDocs = ['ktp', 'skck', 'medical', 'photo'];
  const allVerified = requiredDocs.every((doc) => {
    const docData = documents[doc] as { verified?: boolean } | undefined;
    return docData?.verified === true;
  });

  // Update application status
  let newStatus = application.status;
  if (validated.verification_status === 'rejected') {
    newStatus = 'document_rejected';
  } else if (allVerified && application.status === 'pending_review') {
    newStatus = 'document_verified';
  }

  await client
    .from('guide_license_applications')
    .update({
      documents,
      status: newStatus,
      current_stage: allVerified ? 'assessment' : 'verification',
    })
    .eq('id', id);

  logger.info('Document verified', {
    applicationId: id,
    documentType: validated.document_type,
    status: validated.verification_status,
    adminId: user.id,
  });

  return NextResponse.json({
    success: true,
    verification_status: validated.verification_status,
    all_documents_verified: allVerified,
  });
});
