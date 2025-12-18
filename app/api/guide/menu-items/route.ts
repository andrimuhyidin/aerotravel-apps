import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
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
  const client = supabase as unknown as any;

  // Get global items (branch_id = NULL) and branch-specific items
  // RLS policy will handle filtering automatically
  const { data: items, error } = await client
    .from('guide_menu_items')
    .select('*')
    .eq('is_active', true)
    .order('section', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) {
    logger.error('Failed to fetch menu items', error, { guideId: user.id, branchId: branchContext.branchId });
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }

  type MenuItem = {
    id: string;
    branch_id: string | null;
    section: string;
    href: string;
    label: string;
    icon_name: string;
    description: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };

  const grouped = (items || []).reduce(
    (acc: Record<string, MenuItem[]>, item: MenuItem) => {
      const section = item.section;
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section]!.push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>,
  );

  const menuItems = Object.entries(grouped).map(([section, items]) => ({
    section,
    items: items || [],
  }));

  return NextResponse.json({ menuItems });
});

