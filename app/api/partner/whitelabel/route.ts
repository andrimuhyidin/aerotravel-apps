/**
 * API: Partner Whitelabel Settings
 * GET /api/partner/whitelabel - Get whitelabel settings
 * PUT /api/partner/whitelabel - Update whitelabel settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const whitelabelSchema = z.object({
  companyName: z.string().min(3).max(200).optional(),
  companyLogoUrl: z.string().url().optional().or(z.literal('')),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email().optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
  invoiceFooterText: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    const { data: settings, error } = await client
      .from('partner_whitelabel_settings')
      .select('*')
      .eq('partner_id', user.id)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch whitelabel settings', error, {
        userId: user.id,
      });
      throw error;
    }

    // Return empty settings if not found
    if (!settings) {
      return NextResponse.json({
        companyName: null,
        companyLogoUrl: null,
        companyAddress: null,
        companyPhone: null,
        companyEmail: null,
        primaryColor: null,
        secondaryColor: null,
        invoiceFooterText: null,
        customDomain: null,
        customDomainVerified: false,
      });
    }

    return NextResponse.json({
      companyName: settings.company_name,
      companyLogoUrl: settings.company_logo_url,
      companyAddress: settings.company_address,
      companyPhone: settings.company_phone,
      companyEmail: settings.company_email,
      primaryColor: settings.primary_color,
      secondaryColor: settings.secondary_color,
      invoiceFooterText: settings.invoice_footer_text,
      customDomain: settings.custom_domain || null,
      customDomainVerified: settings.custom_domain_verified || false,
    });
  } catch (error) {
    logger.error('Failed to get whitelabel settings', error, {
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

  const body = await request.json();
  const validated = whitelabelSchema.parse(body);

  const client = supabase as unknown as any;

  try {
    // Check if settings exist
    const { data: existing } = await client
      .from('partner_whitelabel_settings')
      .select('id')
      .eq('partner_id', user.id)
      .maybeSingle();

    const settingsData = {
      partner_id: user.id,
      company_name: validated.companyName || null,
      company_logo_url: validated.companyLogoUrl || null,
      company_address: validated.companyAddress || null,
      company_phone: validated.companyPhone || null,
      company_email: validated.companyEmail || null,
      primary_color: validated.primaryColor || null,
      secondary_color: validated.secondaryColor || null,
      invoice_footer_text: validated.invoiceFooterText || null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await client
        .from('partner_whitelabel_settings')
        .update(settingsData)
        .eq('partner_id', user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new
      const { data, error } = await client
        .from('partner_whitelabel_settings')
        .insert(settingsData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    logger.info('Whitelabel settings updated', {
      userId: user.id,
      settingsId: result.id,
    });

    return NextResponse.json({
      success: true,
      settings: {
        companyName: result.company_name,
        companyLogoUrl: result.company_logo_url,
        companyAddress: result.company_address,
        companyPhone: result.company_phone,
        companyEmail: result.company_email,
        primaryColor: result.primary_color,
        secondaryColor: result.secondary_color,
        invoiceFooterText: result.invoice_footer_text,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Failed to update whitelabel settings', error, {
      userId: user.id,
    });
    throw error;
  }
});

