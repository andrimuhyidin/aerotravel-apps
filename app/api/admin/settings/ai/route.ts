/**
 * AI Settings API Routes
 * GET/POST for managing AI configuration settings
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler, handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';
import { encryptSensitiveValue } from '@/lib/settings/encryption';
import { invalidateSettingsCache } from '@/lib/settings';

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/admin/settings/ai');

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

  // Fetch AI settings
  const { data: settings, error } = await supabase
    .from('settings')
    .select('key, value, is_sensitive')
    .like('key', 'ai.%');

  if (error) {
    logger.error('Failed to fetch AI settings', error);
    return handleApiError(error);
  }

  // Build response object (mask sensitive values)
  const result: Record<string, string | number | boolean> = {};
  for (const setting of settings || []) {
    const key = setting.key.replace('ai.', '');
    if (setting.is_sensitive) {
      result[key] = setting.value.startsWith('••••') ? setting.value : '••••••••';
    } else {
      result[key] = setting.value;
    }
  }

  return NextResponse.json({ data: result });
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  logger.info('POST /api/admin/settings/ai');

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
    { key: 'ai.provider', value: body.provider, type: 'string', sensitive: false },
    { key: 'ai.model', value: body.model, type: 'string', sensitive: false },
    { key: 'ai.max_tokens', value: String(body.max_tokens), type: 'number', sensitive: false },
    { key: 'ai.temperature', value: String(body.temperature), type: 'number', sensitive: false },
    { key: 'ai.rate_limit_rpm', value: String(body.rate_limit_rpm), type: 'number', sensitive: false },
    { key: 'ai.speech_enabled', value: String(body.speech_enabled), type: 'boolean', sensitive: false },
    { key: 'ai.vision_enabled', value: String(body.vision_enabled), type: 'boolean', sensitive: false },
  ];

  // Handle sensitive API keys separately
  if (body.api_key && !body.api_key.startsWith('••••')) {
    const encrypted = await encryptSensitiveValue(body.api_key);
    settingsToUpdate.push({
      key: 'ai.api_key',
      value: '••••••••' + body.api_key.slice(-4),
      type: 'string',
      sensitive: true,
    });
    
    // Update encrypted value
    if (encrypted) {
      await supabase
        .from('settings')
        .upsert({
          key: 'ai.api_key',
          value: '••••••••' + body.api_key.slice(-4),
          value_encrypted: encrypted,
          value_type: 'string',
          is_sensitive: true,
          is_public: false,
          updated_by: user.id,
        }, { onConflict: 'key' });
    }
  }

  if (body.speech_api_key && !body.speech_api_key.startsWith('••••')) {
    const encrypted = await encryptSensitiveValue(body.speech_api_key);
    if (encrypted) {
      await supabase
        .from('settings')
        .upsert({
          key: 'ai.speech_api_key',
          value: '••••••••' + body.speech_api_key.slice(-4),
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
    if (!setting.sensitive) {
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
        logger.error('Failed to update AI setting', error, { key: setting.key });
      }
    }
  }

  // Invalidate cache
  await invalidateSettingsCache(null);

  logger.info('AI settings updated', { userId: user.id });

  return NextResponse.json({ success: true });
});

