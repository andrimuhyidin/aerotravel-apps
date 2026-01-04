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
  const { data: disposalMethods, error } = await client
    .from('disposal_methods_lookup')
    .select('value, label_id, label_en, description')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Failed to fetch disposal methods', error, { guideId: user.id });
    return createErrorResponse('Failed to fetch disposal methods', 'DATABASE_ERROR', error, 500);
  }

  // Map to frontend format: { value, label }
  const mappedMethods = (disposalMethods || []).map((method: { value: string; label_id: string; label_en?: string; description?: string }) => ({
    value: method.value,
    label: method.label_id, // Use Indonesian label
    description: method.description || undefined,
  }));

  return createSuccessResponse({ disposalMethods: mappedMethods });
});

