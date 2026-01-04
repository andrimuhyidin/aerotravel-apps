import { NextRequest } from 'next/server';

import { createErrorResponse, createSuccessResponse } from '@/lib/api/response-format';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get global templates (branch_id = NULL) and branch-specific templates
  // RLS policy will handle filtering automatically
  const { data: templates, error } = await client
    .from('safety_checklist_templates')
    .select('item_key, label, label_en, description, required, display_order')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Failed to fetch safety checklist templates', error, { guideId: user.id, branchId: branchContext.branchId });
    return createErrorResponse('Failed to fetch safety checklist templates', 'DATABASE_ERROR', error, 500);
  }

  // Map to frontend format
  const mappedTemplates = (templates || []).map((template: { item_key: string; label: string; label_en?: string; description?: string; required: boolean; display_order: number }) => ({
    id: template.item_key,
    label: template.label, // Use Indonesian label
    required: template.required,
    description: template.description || undefined,
  }));

  return createSuccessResponse({ templates: mappedTemplates });
});

