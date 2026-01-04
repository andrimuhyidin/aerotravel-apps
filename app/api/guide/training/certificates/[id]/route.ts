/**
 * API: Training Certificate
 * GET /api/guide/training/certificates/[id] - Generate & download PDF certificate
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id: certificateId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get certificate data
  const { data: certificate, error: certError } = await client
    .from('guide_certifications')
    .select(`
      *,
      module:guide_training_modules(title, category),
      training:guide_training_progress(completed_at, score)
    `)
    .eq('id', certificateId)
    .eq('guide_id', user.id)
    .single();

  if (certError || !certificate) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  // Get user profile
  const { data: userProfile } = await client
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  // Generate PDF certificate
  try {
    const { generateTrainingCertificatePDF } = await import('@/lib/pdf/training-certificate');
    const pdfBuffer = await generateTrainingCertificatePDF({
      certificateNumber: certificate.certificate_number || '',
      guideName: userProfile?.full_name || 'Guide',
      moduleTitle: (certificate.module as { title: string } | null)?.title || 'Training Module',
      category: (certificate.module as { category: string } | null)?.category || 'other',
      completedAt: (certificate.training as { completed_at: string } | null)?.completed_at || new Date().toISOString(),
      score: (certificate.training as { score: number } | null)?.score || null,
      issuedAt: certificate.issued_at || new Date().toISOString(),
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.certificate_number || certificateId}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate certificate PDF', error, { certificateId });
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 });
  }
});
