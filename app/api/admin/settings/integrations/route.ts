/**
 * Integration Settings API
 * GET /api/admin/settings/integrations - List all integrations
 * POST /api/admin/settings/integrations - Create/update integration
 * DELETE /api/admin/settings/integrations - Delete integration
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type IntegrationConfig = {
  api_key?: string;
  secret_key?: string;
  client_key?: string;
  server_key?: string;
  webhook_url?: string;
  device_token?: string;
  from_email?: string;
  from_name?: string;
  host?: string;
  measurement_id?: string;
  api_secret?: string;
  is_production?: boolean;
  callback_token?: string;
};

type IntegrationSetting = {
  id: string;
  branch_id: string | null;
  provider: string;
  category: string;
  config: IntegrationConfig;
  is_enabled: boolean;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
};

// Mask sensitive fields for display
function maskSensitiveFields(config: IntegrationConfig): IntegrationConfig {
  const masked = { ...config };
  const sensitiveKeys = ['api_key', 'secret_key', 'client_key', 'server_key', 'callback_token', 'api_secret'];
  
  for (const key of sensitiveKeys) {
    const value = masked[key as keyof IntegrationConfig];
    if (typeof value === 'string' && value.length > 0) {
      // Show first 4 and last 4 characters
      if (value.length > 8) {
        masked[key as keyof IntegrationConfig] = `${value.slice(0, 4)}****${value.slice(-4)}` as never;
      } else {
        masked[key as keyof IntegrationConfig] = '********' as never;
      }
    }
  }
  
  return masked;
}

/**
 * GET /api/admin/settings/integrations
 * List all integration settings
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const branchId = searchParams.get('branch_id');

  logger.info('GET /api/admin/settings/integrations', { category, branchId });

  const supabase = await createClient();

  // Verify admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is super_admin
  const { data: userData } = await supabase
    .from('users')
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  const userRole = userData?.role as string;
  if (userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Build query
  let query = supabase
    .from('integration_settings')
    .select('*')
    .order('category', { ascending: true })
    .order('provider', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  if (branchId) {
    query = query.eq('branch_id', branchId);
  } else {
    // Get global settings (null branch_id)
    query = query.is('branch_id', null);
  }

  const { data: integrations, error } = await query;

  if (error) {
    logger.error('Failed to fetch integrations', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }

  // Mask sensitive fields before returning
  const maskedIntegrations = (integrations || []).map((integration) => ({
    ...integration,
    config: maskSensitiveFields(integration.config as IntegrationConfig),
  }));

  // Group by category
  const grouped = maskedIntegrations.reduce(
    (acc, integration) => {
      const cat = integration.category as string;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(integration);
      return acc;
    },
    {} as Record<string, typeof maskedIntegrations>
  );

  return NextResponse.json({
    integrations: maskedIntegrations,
    grouped,
    categories: ['whatsapp', 'payment', 'email', 'analytics'],
  });
});

/**
 * POST /api/admin/settings/integrations
 * Create or update integration setting
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = (await request.json()) as {
    provider: string;
    category: string;
    config: IntegrationConfig;
    is_enabled?: boolean;
    branch_id?: string | null;
  };

  logger.info('POST /api/admin/settings/integrations', {
    provider: body.provider,
    category: body.category,
  });

  const supabase = await createClient();

  // Verify super_admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = userData?.role as string;
  if (userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  // Validate required fields
  if (!body.provider || !body.category) {
    return NextResponse.json({ error: 'Provider and category are required' }, { status: 400 });
  }

  const branchId = body.branch_id || null;

  // Check if exists
  let existingQuery = supabase
    .from('integration_settings')
    .select('id, config')
    .eq('provider', body.provider);

  if (branchId) {
    existingQuery = existingQuery.eq('branch_id', branchId);
  } else {
    existingQuery = existingQuery.is('branch_id', null);
  }

  const { data: existing } = await existingQuery.single();

  let result;

  if (existing) {
    // Merge config (keep existing values if not provided)
    const existingConfig = existing.config as IntegrationConfig;
    const mergedConfig = { ...existingConfig };

    // Only update non-masked values
    for (const [key, value] of Object.entries(body.config)) {
      if (typeof value === 'string' && !value.includes('****')) {
        mergedConfig[key as keyof IntegrationConfig] = value as never;
      } else if (typeof value === 'boolean') {
        mergedConfig[key as keyof IntegrationConfig] = value as never;
      }
    }

    // Update
    const { data, error } = await supabase
      .from('integration_settings')
      .update({
        config: mergedConfig,
        is_enabled: body.is_enabled ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update integration', error);
      return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
    }

    result = data;
  } else {
    // Insert
    const { data, error } = await supabase
      .from('integration_settings')
      .insert({
        provider: body.provider,
        category: body.category,
        config: body.config,
        is_enabled: body.is_enabled ?? false,
        branch_id: branchId,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create integration', error);
      return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
    }

    result = data;
  }

  logger.info('Integration saved', { provider: body.provider, id: result?.id });

  return NextResponse.json({
    success: true,
    integration: {
      ...result,
      config: maskSensitiveFields(result?.config as IntegrationConfig),
    },
  });
});

/**
 * DELETE /api/admin/settings/integrations
 * Delete integration setting
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
  }

  logger.info('DELETE /api/admin/settings/integrations', { id });

  const supabase = await createClient();

  // Verify super_admin access
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = userData?.role as string;
  if (userRole !== 'super_admin') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  const { error } = await supabase.from('integration_settings').delete().eq('id', id);

  if (error) {
    logger.error('Failed to delete integration', error);
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

