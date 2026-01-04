/**
 * API: Training Certificates (Guide)
 * GET /api/guide/training/certificates - Get guide's certificates
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // Get certificates with module info
  const { data: certificates, error } = await client
    .from('guide_certifications')
    .select(`
      *,
      module:guide_training_modules(id, title, category)
    `)
    .eq('guide_id', user.id)
    .eq('is_valid', true)
    .order('issued_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch certificates', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }

  return NextResponse.json({
    certificates: certificates || [],
  });
});
