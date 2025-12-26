/**
 * API: Partner FAQ & Product Info
 * GET /api/partner/faq - List FAQs and product info for partner
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'faq', 'product', 'all'
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const packageId = searchParams.get('packageId');

    // Get partner_id (could be the user themselves or via partner_users)
    let partnerId = user.id;

    // Check if user is a partner team member
    const { data: partnerUser } = await client
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .eq('is_active', true)
      .single();

    if (partnerUser) {
      partnerId = partnerUser.partner_id;
    } else {
      // Check if user is a partner themselves
      const { data: userProfile } = await client
        .from('users')
        .select('id, role')
        .eq('id', user.id)
        .eq('role', 'mitra')
        .single();

      if (!userProfile) {
        return NextResponse.json(
          { error: 'User is not a partner' },
          { status: 403 }
        );
      }
    }

    const response: {
      faqs?: unknown[];
      productInfo?: unknown[];
    } = {};

    // Fetch FAQs
    if (type === 'faq' || type === 'all') {
      let faqQuery = client
        .from('partner_faq')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (category) {
        faqQuery = faqQuery.eq('category', category);
      }

      if (search) {
        faqQuery = faqQuery.or(
          `question.ilike.%${search}%,answer.ilike.%${search}%`
        );
      }

      const { data: faqs, error: faqError } = await faqQuery;

      if (faqError) {
        logger.warn('Failed to fetch FAQs, continuing without them', {
          partnerId,
          error: faqError.message,
        });
        // Continue without FAQs - not critical
        response.faqs = [];
      } else {
        response.faqs = faqs || [];
      }
    }

    // Fetch Product Info
    if (type === 'product' || type === 'all') {
      let productQuery = client
        .from('partner_product_info')
        .select('*')
        .eq('partner_id', partnerId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (packageId) {
        productQuery = productQuery.eq('package_id', packageId);
      }

      if (category) {
        productQuery = productQuery.eq('category', category);
      }

      if (search) {
        productQuery = productQuery.or(
          `title.ilike.%${search}%,content.ilike.%${search}%`
        );
      }

      const { data: productInfo, error: productError } = await productQuery;

      if (productError) {
        logger.warn('Failed to fetch product info, continuing without it', {
          partnerId,
          error: productError.message,
        });
        // Continue without product info - not critical
        response.productInfo = [];
      } else {
        response.productInfo = productInfo || [];
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to fetch FAQ/product info', error, {
      userId: user.id,
    });
    throw error;
  }
});

