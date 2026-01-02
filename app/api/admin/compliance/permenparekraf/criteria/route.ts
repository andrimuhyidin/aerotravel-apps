/**
 * API: Permenparekraf Assessment Criteria
 * Route: /api/admin/compliance/permenparekraf/criteria
 * Purpose: Get assessment criteria by business type
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/admin/compliance/permenparekraf/criteria
 * Get criteria for specific business type
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const businessType = searchParams.get('businessType') || 'agen_perjalanan_wisata';

  const { data: criteria, error } = await supabase
    .from('permenparekraf_criteria')
    .select('*')
    .eq('business_type', businessType)
    .eq('is_active', true)
    .order('section_code', { ascending: true })
    .order('order_index', { ascending: true });

  if (error) {
    logger.error('Failed to fetch criteria', error, { businessType });
    return NextResponse.json({ error: 'Failed to fetch criteria' }, { status: 500 });
  }

  // Group by section
  const grouped = criteria?.reduce((acc, criterion) => {
    const section = criterion.section_code;
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(criterion);
    return acc;
  }, {} as Record<string, typeof criteria>);

  return NextResponse.json({
    businessType,
    sections: grouped,
    criteria,
  });
});

