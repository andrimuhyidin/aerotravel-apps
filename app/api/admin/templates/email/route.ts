/**
 * API: Admin - Email Templates
 * GET /api/admin/templates/email - List email templates
 * POST /api/admin/templates/email - Create new email template
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createTemplateSchema = z.object({
  key: z.string().min(3).max(50).regex(/^[a-z_]+$/, 'Key must be lowercase with underscores'),
  name: z.string().min(3).max(100),
  subject: z.string().min(3).max(200),
  bodyHtml: z.string().min(10),
  bodyText: z.string().optional(),
  variables: z.array(z.string()).default([]),
  category: z.enum(['transactional', 'marketing', 'notification']).default('transactional'),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category') || 'all';

  try {
    let query = supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query;

    if (error) {
      logger.error('Failed to fetch email templates', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    logger.error('Unexpected error in templates API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check authorization - only super_admin can create templates
  const allowed = await hasRole(['super_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = createTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { key, name, subject, bodyHtml, bodyText, variables, category } = parsed.data;
  const supabase = await createAdminClient();

  try {
    // Check if key already exists
    const { data: existing } = await supabase
      .from('email_templates')
      .select('id')
      .eq('key', key)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Template with this key already exists' },
        { status: 409 }
      );
    }

    // Create template
    const { data: template, error: createError } = await supabase
      .from('email_templates')
      .insert({
        key,
        name,
        subject,
        body_html: bodyHtml,
        body_text: bodyText || null,
        variables,
        category,
        created_by: user.id,
      })
      .select('id, key, name')
      .single();

    if (createError) {
      logger.error('Failed to create email template', createError);
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      );
    }

    logger.info('Email template created', {
      templateId: template?.id,
      key,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Template created successfully',
      template,
    });
  } catch (error) {
    logger.error('Unexpected error in create template', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
