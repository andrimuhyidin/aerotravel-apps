/**
 * API: Widget Configuration
 * GET /api/partner/whitelabel/widget/config - Get widget config
 * PUT /api/partner/whitelabel/widget/config - Update widget config
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const widgetConfigSchema = z.object({
  enabled: z.boolean().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .or(z.literal('')),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .or(z.literal('')),
  packageIds: z.array(z.string()).optional(),
  showAllPackages: z.boolean().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'Partner access required' },
      { status: 403 }
    );
  }

  const client = supabase as unknown as any;

  try {
    const { data: settings, error } = await client
      .from('partner_whitelabel_settings')
      .select('widget_enabled, widget_api_key, widget_config')
      .eq('partner_id', partnerId)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch widget config', error, {
        userId: user.id,
      });
      throw error;
    }

    const config = settings?.widget_config || {};

    return NextResponse.json({
      enabled: settings?.widget_enabled || false,
      apiKey: settings?.widget_api_key || null,
      config: {
        primaryColor: config.primaryColor || '#ea580c',
        secondaryColor: config.secondaryColor || '#fb923c',
        packageIds: config.packageIds || [],
        showAllPackages: config.showAllPackages ?? true,
      },
    });
  } catch (error) {
    logger.error('Failed to get widget config', error, {
      userId: user.id,
    });
    throw error;
  }
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'Partner access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validated = widgetConfigSchema.parse(body);

    const client = supabase as unknown as any;

    // Get existing config
    const { data: existing } = await client
      .from('partner_whitelabel_settings')
      .select('widget_config')
      .eq('partner_id', partnerId)
      .maybeSingle();

    const currentConfig = existing?.widget_config || {};

    // Merge config
    const newConfig = {
      ...currentConfig,
      ...(validated.primaryColor && { primaryColor: validated.primaryColor }),
      ...(validated.secondaryColor && {
        secondaryColor: validated.secondaryColor,
      }),
      ...(validated.packageIds !== undefined && {
        packageIds: validated.packageIds,
      }),
      ...(validated.showAllPackages !== undefined && {
        showAllPackages: validated.showAllPackages,
      }),
    };

    // Update settings
    const updateData: Record<string, any> = {
      widget_config: newConfig,
    };

    if (validated.enabled !== undefined) {
      updateData.widget_enabled = validated.enabled;
    }

    const { data: existingSettings } = await client
      .from('partner_whitelabel_settings')
      .select('id')
      .eq('partner_id', partnerId)
      .maybeSingle();

    if (existingSettings) {
      const { error } = await client
        .from('partner_whitelabel_settings')
        .update(updateData)
        .eq('partner_id', partnerId);

      if (error) throw error;
    } else {
      const { error } = await client
        .from('partner_whitelabel_settings')
        .insert({
          partner_id: partnerId,
          ...updateData,
        });

      if (error) throw error;
    }

    logger.info('Widget config updated', {
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      config: newConfig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Failed to update widget config', error, {
      userId: user.id,
    });
    throw error;
  }
});
