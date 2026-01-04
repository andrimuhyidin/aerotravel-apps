import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
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

  const branchContext = await getBranchContext(user.id);

  // Get global actions (branch_id = NULL) and branch-specific actions
  // RLS policy will handle filtering automatically
  // Query both global (branch_id IS NULL) and branch-specific actions
  // Use simpler query - RLS will filter based on user's branch
  const { data: actions, error } = await supabase
    .from('guide_quick_actions')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    // Check if it's an RLS/permission error
    const isRlsError = 
      error.code === 'PGRST301' || 
      error.code === '42501' ||
      error.message?.toLowerCase().includes('permission') ||
      error.message?.toLowerCase().includes('policy') ||
      error.message?.toLowerCase().includes('row-level security');
    
    logger.error('Failed to fetch quick actions', error, { 
      guideId: user.id, 
      branchId: branchContext.branchId,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
      isRlsError,
    });
    
    // If RLS error, return empty array (expected - RLS policy may not be active)
    if (isRlsError) {
      logger.warn('RLS error detected for quick actions - returning empty array', {
        guideId: user.id,
        hint: 'Check if RLS policy is active for guide_quick_actions table',
      });
      return NextResponse.json({ actions: [] });
    }
    
    return NextResponse.json({ error: 'Failed to fetch quick actions' }, { status: 500 });
  }

  // Debug logging - always log to help diagnose
  logger.info('Quick actions fetched', {
    guideId: user.id,
    branchId: branchContext.branchId,
    actionsCount: actions?.length ?? 0,
    actions: actions?.map(a => ({ 
      id: a.id,
      href: a.href, 
      label: a.label, 
      is_active: a.is_active,
      branch_id: a.branch_id,
    })),
  });

  // Remove duplicates based on href to prevent double menu items
  type QuickAction = {
    id: string;
    href: string;
    label: string;
    icon_name: string;
    color: string;
    description?: string;
    [key: string]: unknown;
  };
  
  // Map database rows to QuickAction type, handling null to undefined conversion
  const mappedActions: QuickAction[] = (actions || []).map((action) => ({
    id: action.id,
    href: action.href,
    label: action.label,
    icon_name: action.icon_name,
    color: action.color,
    description: action.description ?? undefined,
  }));
  
  const uniqueActions = mappedActions.reduce((acc: QuickAction[], action: QuickAction) => {
    if (!acc.find((a: QuickAction) => a.href === action.href)) {
      acc.push(action);
    }
    return acc;
  }, [] as QuickAction[]);

  // If no actions found, log warning
  if (uniqueActions.length === 0) {
    logger.warn('No quick actions found in database', {
      guideId: user.id,
      branchId: branchContext.branchId,
      suggestion: 'Run migration: npm run migrate:guide-improvements',
    });
  }

  return NextResponse.json({ actions: uniqueActions });
});

