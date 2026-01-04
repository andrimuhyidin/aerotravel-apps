/**
 * Admin API untuk generate SEO pages
 * Protected route - hanya Super Admin
 */

import { NextRequest, NextResponse } from 'next/server';

import { isFeatureEnabled } from '@/lib/feature-flags/posthog-flags';
import { generateAllSEOPages } from '@/lib/seo/generate-pages';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Super Admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userProfile = profile as { role: string } | null;
    if (userProfile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check feature flag
    const seoEnabled = isFeatureEnabled('programmatic-seo', user.id);
    if (!seoEnabled) {
      return NextResponse.json(
        { error: 'Programmatic SEO feature is disabled' },
        { status: 503 }
      );
    }

    // Generate pages
    await generateAllSEOPages();

    return NextResponse.json({
      success: true,
      message: 'SEO pages generated successfully',
    });
  } catch (error) {
    logger.error('Generate SEO error', error, { userId: user?.id });
    return NextResponse.json(
      { error: 'Failed to generate SEO pages' },
      { status: 500 }
    );
  }
}
