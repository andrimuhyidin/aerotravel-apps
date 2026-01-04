/**
 * Maps Settings API Routes
 * GET/POST for managing Maps configuration settings
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler, handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import { encryptSensitiveValue } from '@/lib/settings/encryption';
import { invalidateSettingsCache } from '@/lib/settings';

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/admin/settings/maps');

  const supabase = await createClient();

  // Verify user is super_admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('active_role')
    .eq('user_id', user.id)
    .single();

  if (profile?.active_role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch Maps settings
  const { data: settings, error } = await supabase
    .from('settings')
    .select('key, value, is_sensitive')
    .like('key', 'maps.%');

  if (error) {
    logger.error('Failed to fetch Maps settings', error);
    return handleApiError(error);
  }

  // Build response object
  const result: Record<string, string | number | boolean> = {};
  for (const setting of settings || []) {
    const key = setting.key.replace('maps.', '');
    if (setting.is_sensitive) {
      result[key] = setting.value.startsWith('••••') ? setting.value : '••••••••';
    } else {
      result[key] = setting.value;
    }
  }

  return NextResponse.json({ data: result });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/settings/maps');

  const supabase = await createClient();

  // Verify user is super_admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('active_role')
    .eq('user_id', user.id)
    .single();

  if (profile?.active_role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();

  // Settings to update
  const settingsToUpdate = [
    { key: 'maps.provider', value: body.provider, type: 'string' },
    { key: 'maps.default_lat', value: String(body.default_lat), type: 'number' },
    { key: 'maps.default_lng', value: String(body.default_lng), type: 'number' },
    { key: 'maps.default_zoom', value: String(body.default_zoom), type: 'number' },
    { key: 'maps.route_optimization_enabled', value: String(body.route_optimization_enabled), type: 'boolean' },
  ];

  // Handle API key
  if (body.api_key && !body.api_key.startsWith('••••')) {
    const encrypted = await encryptSensitiveValue(body.api_key);
    if (encrypted) {
      await supabase
        .from('settings')
        .upsert({
          key: 'maps.api_key',
          value: '••••••••' + body.api_key.slice(-4),
          value_encrypted: encrypted,
          value_type: 'string',
          is_sensitive: true,
          is_public: false,
          updated_by: user.id,
        }, { onConflict: 'key' });
    }
  }

  // Update non-sensitive settings
  for (const setting of settingsToUpdate) {
    const { error } = await supabase
      .from('settings')
      .upsert({
        key: setting.key,
        value: setting.value,
        value_type: setting.type,
        is_sensitive: false,
        is_public: setting.key.includes('default'),
        updated_by: user.id,
      }, { onConflict: 'key' });

    if (error) {
      logger.error('Failed to update Maps setting', error, { key: setting.key });
    }
  }

  // Invalidate cache
  await invalidateSettingsCache(null);

  logger.info('Maps settings updated', { userId: user.id });

  return NextResponse.json({ success: true });
});

