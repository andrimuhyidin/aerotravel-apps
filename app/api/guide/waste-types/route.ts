import { NextRequest } from 'next/server';

import { createErrorResponse, createSuccessResponse } from '@/lib/api/response-format';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', undefined, 401);
  }

  const client = supabase as unknown as any;
  const { data: wasteTypes, error } = await client
    .from('waste_types_lookup')
    .select('value, label_id, label_en, description')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Failed to fetch waste types', error, { guideId: user.id });
    return createErrorResponse('Failed to fetch waste types', 'DATABASE_ERROR', error, 500);
  }

  // Map to frontend format: { value, label }
  const mappedTypes = (wasteTypes || []).map((type: { value: string; label_id: string; label_en?: string; description?: string }) => ({
    value: type.value,
    label: type.label_id, // Use Indonesian label
    description: type.description || undefined,
  }));

  return createSuccessResponse({ wasteTypes: mappedTypes });
});

