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

  // Remove duplicates by href within each section
  // Also filter out redundant items
  const uniqueItems = (items || []).reduce((acc: MenuItem[], item: MenuItem) => {
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
    // Exclude insight pribadi (now accessible via widgets with link)
    if (item.href === '/guide/insights' && item.section === 'Insight Pribadi') {
      return acc;
    }
    // Exclude ratings (now merged into insights page)
    if (item.href === '/guide/ratings') {
      return acc;
    }
    // Preferences now in Pengaturan section, don't exclude
    // Exclude documents (now merged into edit profile)
    if (item.href === '/guide/documents') {
      return acc;
    }
    // Exclude incidents (now merged into help)
    if (item.href === '/guide/incidents') {
      return acc;
    }
    // Exclude assessments (now merged into learning hub)
    if (item.href === '/guide/assessments') {
      return acc;
    }
    // Exclude skills (now merged into learning hub)
    if (item.href === '/guide/skills') {
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

  // Define section order: Akun, Dukungan, then Pengaturan
  const sectionOrder = ['Akun', 'Dukungan', 'Pengaturan'];
  
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
      // Reorder items within Pengaturan section
      if (section === 'Pengaturan') {
        const orderedItems = [...(items || [])].sort((a, b) => {
          // Define custom order for Pengaturan section
          const orderMap: Record<string, number> = {
            '/guide/settings': 1, // Pengaturan Aplikasi
            '/guide/preferences': 2, // Preferensi (after Pengaturan Aplikasi)
            '/legal/privacy': 3, // Kebijakan Privasi
            '/legal/terms': 4, // Syarat & Ketentuan
          };
          const orderA = orderMap[a.href] ?? a.display_order ?? 999;
          const orderB = orderMap[b.href] ?? b.display_order ?? 999;
          return orderA - orderB;
        });
        return {
          section,
          items: orderedItems,
        };
      }
      // For other sections, sort by display_order
      const sortedItems = [...(items || [])].sort((a, b) => {
        return (a.display_order ?? 999) - (b.display_order ?? 999);
      });
      return {
        section,
        items: sortedItems,
      };
    });

  return NextResponse.json({ menuItems });
});

