/**
 * API: FAQ Management by ID (Admin)
 * GET /api/admin/faqs/[id] - Get single FAQ
 * PUT /api/admin/faqs/[id] - Update FAQ
 * DELETE /api/admin/faqs/[id] - Delete FAQ
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateFAQSchema = z.object({
  app_type: z.string().optional().nullable(),
  package_id: z.string().uuid().optional().nullable(),
  category: z.string().optional().nullable(),
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  display_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: faq, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error(`Failed to fetch FAQ: ${id}`, error);
    return NextResponse.json({ error: 'FAQ not found' }, { status: 404 });
  }

  return NextResponse.json({ faq });
});

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Only super_admin can update FAQs
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = updateFAQSchema.parse(await request.json());

  const { data: faq, error } = await supabase
    .from('faqs')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error(`Failed to update FAQ: ${id}`, error);
    return NextResponse.json({ error: 'Failed to update FAQ' }, { status: 500 });
  }

  logger.info(`FAQ updated: ${id}`);
  return NextResponse.json({ faq });
});

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { id } = await context.params;
  const supabase = await createClient();

  // Only super_admin can delete FAQs
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete by setting is_active to false
  const { error } = await supabase
    .from('faqs')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    logger.error(`Failed to delete FAQ: ${id}`, error);
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
  }

  logger.info(`FAQ deleted: ${id}`);
  return NextResponse.json({ message: 'FAQ deleted successfully' });
});

