/**
 * API: Notification Templates Management
 * GET /api/admin/templates/notification - List all notification templates
 * POST /api/admin/templates/notification - Create new notification template
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { clearNotificationTemplateCache } from '@/lib/templates/notification';
import { logger } from '@/lib/utils/logger';

const createTemplateSchema = z.object({
  template_key: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  message_template: z.string().min(1),
  variables: z.array(z.string()).optional().default([]),
  channel: z.enum(['whatsapp', 'sms', 'push']).default('whatsapp'),
  is_active: z.boolean().optional().default(true),
});

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  // Check authorization
  const isAuthorized = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: templates, error } = await supabase
    .from('notification_templates')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    logger.error('Failed to fetch notification templates', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }

  return NextResponse.json({ templates });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  // Only super_admin can create templates
  const isAuthorized = await hasRole(['super_admin']);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = createTemplateSchema.parse(await request.json());

  const { data: template, error } = await supabase
    .from('notification_templates')
    .insert({
      template_key: body.template_key,
      name: body.name,
      message_template: body.message_template,
      variables: body.variables,
      channel: body.channel,
      is_active: body.is_active,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create notification template', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Template key already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }

  // Clear cache
  clearNotificationTemplateCache();

  logger.info('Notification template created', { templateKey: body.template_key });

  return NextResponse.json({ template }, { status: 201 });
});

