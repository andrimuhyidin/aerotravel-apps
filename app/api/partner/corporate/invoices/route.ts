/**
 * API: Corporate Invoices
 * GET /api/partner/corporate/invoices - List invoices
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { getCorporateClient, getInvoices } from '@/lib/corporate';
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

  try {
    const corporate = await getCorporateClient(user.id);

    if (!corporate) {
      return NextResponse.json(
        { error: 'No corporate access' },
        { status: 403 }
      );
    }

    // Sanitize search params
    const searchParams = sanitizeSearchParams(request);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const status = searchParams.get('status') || undefined;

    const result = await getInvoices(corporate.id, {
      limit: Math.min(Math.max(1, limit), 100),
      offset: Math.max(0, offset),
      status,
    });

    return NextResponse.json({
      invoices: result.invoices,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + result.invoices.length < result.total,
      },
    });
  } catch (error) {
    logger.error('Failed to get invoices', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to get invoices' },
      { status: 500 }
    );
  }
});

