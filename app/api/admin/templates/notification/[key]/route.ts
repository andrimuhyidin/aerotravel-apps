/**
 * API: Notification Template Management by Key
 * GET /api/admin/templates/notification/[key] - Get single template
 * PUT /api/admin/templates/notification/[key] - Update template
 * DELETE /api/admin/templates/notification/[key] - Delete template
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { clearNotificationTemplateCache } from '@/lib/templates/notification';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ key: string }>;
};

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  message_template: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  channel: z.enum(['whatsapp', 'sms', 'push']).optional(),
  is_active: z.boolean().optional(),
});

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  const { key } = await context.params;
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: template, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('template_key', key)
    .single();

  if (error || !template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  return NextResponse.json({ template });
});

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  const { key } = await context.params;
  const supabase = await createClient();

  // Only super_admin can update templates
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = updateTemplateSchema.parse(await request.json());

  // Check if template exists
  const { data: existing } = await supabase
    .from('notification_templates')
    .select('id')
    .eq('template_key', key)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.message_template !== undefined) updateData.message_template = body.message_template;
  if (body.variables !== undefined) updateData.variables = body.variables;
  if (body.channel !== undefined) updateData.channel = body.channel;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;

  const { data: template, error } = await supabase
    .from('notification_templates')
    .update(updateData)
    .eq('template_key', key)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update notification template', error, { key });
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }

  // Clear cache for this template
  clearNotificationTemplateCache(key);

  logger.info('Notification template updated', { templateKey: key });

  return NextResponse.json({ template });
});

export const DELETE = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  const { key } = await context.params;
  const supabase = await createClient();

  // Only super_admin can delete templates
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('notification_templates')
    .delete()
    .eq('template_key', key);

  if (error) {
    logger.error('Failed to delete notification template', error, { key });
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }

  // Clear cache
  clearNotificationTemplateCache(key);

  logger.info('Notification template deleted', { templateKey: key });

  return NextResponse.json({ message: 'Template deleted successfully' });
});

