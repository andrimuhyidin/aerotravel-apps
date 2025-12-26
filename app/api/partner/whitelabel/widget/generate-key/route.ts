/**
 * API: Generate Widget API Key
 * POST /api/partner/whitelabel/widget/generate-key
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    // Generate API key
    const apiKey = `aero_${randomBytes(32).toString('hex')}`;

    // Update settings
    const { data: existing } = await client
      .from('partner_whitelabel_settings')
      .select('id')
      .eq('partner_id', user.id)
      .maybeSingle();

    const updateData = {
      widget_enabled: true,
      widget_api_key: apiKey,
    };

    if (existing) {
      const { error } = await client
        .from('partner_whitelabel_settings')
        .update(updateData)
        .eq('partner_id', user.id);

      if (error) throw error;
    } else {
      const { error } = await client
        .from('partner_whitelabel_settings')
        .insert({
          partner_id: user.id,
          ...updateData,
        });

      if (error) throw error;
    }

    logger.info('Widget API key generated', {
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      apiKey,
      message: 'API key berhasil dibuat',
    });
  } catch (error) {
    logger.error('Failed to generate widget API key', error, {
      userId: user.id,
    });
    throw error;
  }
});

