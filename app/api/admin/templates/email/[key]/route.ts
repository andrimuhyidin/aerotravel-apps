/**
 * API: Admin - Email Template CRUD
 * GET /api/admin/templates/email/[key] - Get single template
 * PUT /api/admin/templates/email/[key] - Update template
 * DELETE /api/admin/templates/email/[key] - Delete template
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateTemplateSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  subject: z.string().min(3).max(200).optional(),
  bodyHtml: z.string().min(10).optional(),
  bodyText: z.string().optional(),
  variables: z.array(z.string()).optional(),
  category: z.enum(['transactional', 'marketing', 'notification']).optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ key: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { key } = await context.params;
  const supabase = await createAdminClient();

  try {
    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('key', key)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    logger.error('Failed to fetch template', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { key } = await context.params;

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = updateTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();

  try {
    // Build update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (parsed.data.name) updateData.name = parsed.data.name;
    if (parsed.data.subject) updateData.subject = parsed.data.subject;
    if (parsed.data.bodyHtml) updateData.body_html = parsed.data.bodyHtml;
    if (parsed.data.bodyText !== undefined) updateData.body_text = parsed.data.bodyText;
    if (parsed.data.variables) updateData.variables = parsed.data.variables;
    if (parsed.data.category) updateData.category = parsed.data.category;
    if (parsed.data.isActive !== undefined) updateData.is_active = parsed.data.isActive;

    const { error } = await supabase
      .from('email_templates')
      .update(updateData)
      .eq('key', key);

    if (error) {
      logger.error('Failed to update template', error);
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    logger.info('Email template updated', {
      key,
      updatedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
    });
  } catch (error) {
    logger.error('Unexpected error in update template', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { key } = await context.params;
  const supabase = await createAdminClient();

  try {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('key', key);

    if (error) {
      logger.error('Failed to delete template', error);
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    logger.info('Email template deleted', { key });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    logger.error('Unexpected error in delete template', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
