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

  // Get global items (branch_id = NULL) and branch-specific items
  // RLS policy will handle filtering automatically
  const { data: items, error } = await supabase
    .from('guide_menu_items')
    .select('*')
    .eq('is_active', true)
    .order('section', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) {
    // Check if it's an RLS/permission error
    const isRlsError = 
      error.code === 'PGRST301' || 
      error.code === '42501' ||
      error.message?.toLowerCase().includes('permission') ||
      error.message?.toLowerCase().includes('policy') ||
      error.message?.toLowerCase().includes('row-level security');
    
    logger.error('Failed to fetch menu items', error, {
      guideId: user.id,
      branchId: branchContext.branchId,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      isRlsError,
    });
    
    // If RLS error, return empty array (expected - RLS policy may not be active)
    if (isRlsError) {
      logger.warn('RLS error detected for menu items - returning empty array', {
        guideId: user.id,
        hint: 'Check if RLS policy is active for guide_menu_items table',
      });
      return NextResponse.json({ menuItems: [] });
    }
    
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
    display_order: number | null;
    is_active: boolean | null;
    created_at: string | null;
    updated_at: string | null;
  };

  // Remove duplicates by href within each section
  // Also filter out redundant items (items that should not appear in menu)
  const uniqueItems = (items || []).reduce((acc: MenuItem[], item) => {
    // Exclude broadcasts menu item (now merged into notifications)
    if (item.href === '/guide/broadcasts') {
      return acc;
    }
    // Exclude /guide/profile/notifications (already in Settings)
    if (item.href === '/guide/profile/notifications') {
      return acc;
    }
    // Exclude license apply (now merged into id-card page)
    if (item.href === '/guide/license/apply') {
      return acc;
    }
    // Exclude old section names (should not exist after migration, but just in case)
    if (item.section === 'Insight Pribadi' || item.section === 'Pembelajaran & Development' || item.section === 'Pengaturan & Support' || item.section === 'Laporan & Support') {
      return acc;
    }
    // Exclude Pengaturan Bahasa (already in preferences)
    if (item.href === '/guide/settings#language') {
      return acc;
    }
    // Remove duplicates by (section, href)
    if (!acc.find((a) => a.href === item.href && a.section === item.section)) {
      acc.push(item);
    }
    return acc;
  }, []);

  const grouped = uniqueItems.reduce(
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

  // Define section order: Akun, Pembelajaran, Dukungan, then Pengaturan
  const sectionOrder = ['Akun', 'Pembelajaran', 'Dukungan', 'Pengaturan'];
  
  const menuItems = Object.entries(grouped)
    .sort(([sectionA], [sectionB]) => {
      const indexA = sectionOrder.indexOf(sectionA);
      const indexB = sectionOrder.indexOf(sectionB);
      // If both in order, sort by order
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // If only A in order, A comes first
      if (indexA !== -1) return -1;
      // If only B in order, B comes first
      if (indexB !== -1) return 1;
      // If neither in order, maintain original order
      return 0;
    })
    .map(([section, items]) => {
      // Sort items by display_order for all sections
      const sortedItems = Array.isArray(items) ? [...items].sort((a, b) => {
        return (a.display_order ?? 999) - (b.display_order ?? 999);
      }) : [];
      return {
        section,
        items: sortedItems,
      };
    });

  return NextResponse.json({ menuItems });
});

