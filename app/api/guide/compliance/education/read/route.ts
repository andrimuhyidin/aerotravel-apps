/**
 * API: Compliance Education Read Tracking
 * POST /api/guide/compliance/education/read - Track guide engagement with compliance education
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const trackReadSchema = z.object({
  section_id: z.string(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = trackReadSchema.parse(await request.json());
  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Check if table exists, if not, just return success (optional feature)
    const { error: insertError } = await client
      .from('guide_compliance_education_logs')
      .insert({
        guide_id: user.id,
        branch_id: branchContext.branchId,
        section_read: payload.section_id,
        read_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // If table doesn't exist, that's okay (optional feature)
      if (insertError.code === 'PGRST205' || insertError.message?.includes('Could not find the table')) {
        logger.info('Compliance education logs table not found, skipping tracking', {
          guideId: user.id,
        });
        return NextResponse.json({ success: true, tracked: false });
      }

      logger.warn('Failed to track compliance education read', { error: insertError });
      // Don't fail the request, just log warning
    }

    return NextResponse.json({ success: true, tracked: true });
  } catch (error) {
    logger.warn('Failed to track compliance education read', { error });
    // Don't fail the request, just return success
    return NextResponse.json({ success: true, tracked: false });
  }
});

