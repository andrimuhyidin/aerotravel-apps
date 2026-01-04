/**
 * Weather Settings API Routes
 * GET/POST for managing Weather configuration settings
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler, handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import { encryptSensitiveValue } from '@/lib/settings/encryption';
import { invalidateSettingsCache } from '@/lib/settings';

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/admin/settings/weather');

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

  // Fetch Weather settings
  const { data: settings, error } = await supabase
    .from('settings')
    .select('key, value, is_sensitive')
    .like('key', 'weather.%');

  if (error) {
    logger.error('Failed to fetch Weather settings', error);
    return handleApiError(error);
  }

  // Build response object
  const result: Record<string, string | number | boolean> = {};
  for (const setting of settings || []) {
    const key = setting.key.replace('weather.', '');
    if (setting.is_sensitive) {
      result[key] = setting.value.startsWith('••••') ? setting.value : '••••••••';
    } else {
      result[key] = setting.value;
    }
  }

  return NextResponse.json({ data: result });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/settings/weather');

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
    { key: 'weather.enabled', value: String(body.enabled), type: 'boolean' },
    { key: 'weather.wind_threshold', value: String(body.wind_threshold), type: 'number' },
    { key: 'weather.rain_threshold', value: String(body.rain_threshold), type: 'number' },
    { key: 'weather.wave_threshold', value: String(body.wave_threshold), type: 'number' },
    { key: 'weather.check_interval_hours', value: String(body.check_interval_hours), type: 'number' },
  ];

  // Handle API key
  if (body.api_key && !body.api_key.startsWith('••••')) {
    const encrypted = await encryptSensitiveValue(body.api_key);
    if (encrypted) {
      await supabase
        .from('settings')
        .upsert({
          key: 'weather.api_key',
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
        is_public: false,
        updated_by: user.id,
      }, { onConflict: 'key' });

    if (error) {
      logger.error('Failed to update Weather setting', error, { key: setting.key });
    }
  }

  // Invalidate cache
  await invalidateSettingsCache(null);

  logger.info('Weather settings updated', { userId: user.id });

  return NextResponse.json({ success: true });
});

