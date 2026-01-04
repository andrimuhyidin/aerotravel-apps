/**
 * API: Generate Training Certificates (Admin)
 * POST /api/admin/guide/training/sessions/[id]/generate-certificates - Generate PDF certificates for all attendees
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: sessionId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userProfile?.role !== 'super_admin' && userProfile?.role !== 'ops_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);

  // Get session
  const { data: session, error: sessionError } = await client
    .from('training_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Get all present attendees
  let attendanceQuery = client
    .from('training_attendance')
    .select(`
      *,
      guide:users(id, full_name, email, branch_id)
    `)
    .eq('session_id', sessionId)
    .eq('status', 'present');

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    attendanceQuery = attendanceQuery.eq('branch_id', branchContext.branchId);
  }

  const { data: attendance, error: attendanceError } = await attendanceQuery;

  if (attendanceError) {
    logger.error('Failed to fetch attendance', attendanceError, { sessionId });
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }

  // Generate certificates for each attendee
  const certificates = [];
  for (const record of attendance || []) {
    const guide = (record as { guide?: { id: string; full_name: string; branch_id: string } }).guide;
    if (!guide) continue;

    // Check if certificate already exists
    const { data: existing } = await client
      .from('training_certificates')
      .select('id')
      .eq('session_id', sessionId)
      .eq('guide_id', guide.id)
      .maybeSingle();

    if (existing) {
      // Skip if already generated
      continue;
    }

    // Generate certificate number
    const datePrefix = new Date(session.session_date).toISOString().slice(0, 10).replace(/-/g, '');
    const certNumber = `CERT-${datePrefix}-${sessionId.slice(0, 8).toUpperCase()}-${guide.id.slice(0, 8).toUpperCase()}`;

    // For now, just create certificate record
    // PDF generation will be done separately (can use @react-pdf/renderer)
    const { data: certificate, error: certError } = await client
      .from('training_certificates')
      .insert({
        session_id: sessionId,
        guide_id: guide.id,
        branch_id: guide.branch_id,
        certificate_number: certNumber,
        is_issued: true,
        issued_at: new Date().toISOString(),
        issued_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (certError) {
      logger.error('Failed to create certificate', certError, { sessionId, guideId: guide.id });
      continue;
    }

    certificates.push(certificate);
  }

  logger.info('Certificates generated', {
    sessionId,
    count: certificates.length,
    generatedBy: user.id,
  });

  return NextResponse.json({
    success: true,
    certificates_generated: certificates.length,
    certificates,
  });
});
