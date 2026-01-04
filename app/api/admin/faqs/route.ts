/**
 * API: FAQs Management (Admin)
 * GET /api/admin/faqs - List FAQs with filters
 * POST /api/admin/faqs - Create new FAQ
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createFAQSchema = z.object({
  app_type: z.string().optional().nullable(),
  package_id: z.string().uuid().optional().nullable(),
  category: z.string().optional().nullable(),
  question: z.string().min(1),
  answer: z.string().min(1),
  display_order: z.number().optional().default(0),
  is_active: z.boolean().optional().default(true),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const app_type = searchParams.get('app_type');
  const category = searchParams.get('category');
  const package_id = searchParams.get('package_id');

  let query = supabase.from('faqs').select('*');

  if (app_type) {
    query = query.eq('app_type', app_type);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (package_id) {
    query = query.eq('package_id', package_id);
  }

  query = query.order('display_order', { ascending: true });

  const { data: faqs, error } = await query;

  if (error) {
    logger.error('Failed to fetch FAQs', error);
    return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
  }

  return NextResponse.json({ faqs });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Only super_admin can create FAQs
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = createFAQSchema.parse(await request.json());

  const { data: faq, error } = await supabase
    .from('faqs')
    .insert(body)
    .select()
    .single();

  if (error) {
    logger.error('Failed to create FAQ', error);
    return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
  }

  logger.info('FAQ created', { id: faq.id });
  return NextResponse.json({ faq }, { status: 201 });
});

