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
  const { data: categories, error } = await client
    .from('expense_categories')
    .select('value, label_id, label_en, icon_name, description')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Failed to fetch expense categories', error, { guideId: user.id });
    return createErrorResponse('Failed to fetch expense categories', 'DATABASE_ERROR', error, 500);
  }

  // Map to frontend format: { value, label }
  const mappedCategories = (categories || []).map((cat: { value: string; label_id: string; label_en?: string; icon_name?: string; description?: string }) => ({
    value: cat.value,
    label: cat.label_id, // Use Indonesian label
    iconName: cat.icon_name || undefined,
    description: cat.description || undefined,
  }));

  return createSuccessResponse({ categories: mappedCategories });
});

