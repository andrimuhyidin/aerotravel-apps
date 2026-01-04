/**
 * API: Partner Custom Domain Management
 * PUT /api/partner/whitelabel/domain - Update custom domain
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';

const domainSchema = z.object({
  customDomain: z.string().min(3).max(255).regex(/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i, 'Format domain tidak valid').optional().or(z.literal('')),
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
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = domainSchema.parse(body);

    const client = supabase as unknown as any;

    // Generate verification token if domain is provided
    let verificationToken: string | null = null;
    if (validated.customDomain && validated.customDomain !== '') {
      verificationToken = randomBytes(32).toString('hex');
    }

    // Update or insert settings
    const { data: existing } = await client
      .from('partner_whitelabel_settings')
      .select('id')
      .eq('partner_id', partnerId)
      .maybeSingle();

    const updateData: Record<string, any> = {
      custom_domain: validated.customDomain || null,
      custom_domain_verified: false, // Reset verification when domain changes
      custom_domain_verification_token: verificationToken,
    };

    if (existing) {
      const { data, error } = await client
        .from('partner_whitelabel_settings')
        .update(updateData)
        .eq('partner_id', partnerId)
        .select('custom_domain, custom_domain_verified, custom_domain_verification_token')
        .single();

      if (error) throw error;

      logger.info('Custom domain updated', {
        userId: user.id,
        partnerId,
        domain: validated.customDomain,
      });

      return NextResponse.json({
        success: true,
        customDomain: data.custom_domain,
        verified: data.custom_domain_verified,
        verificationToken: data.custom_domain_verification_token,
      });
    } else {
      // Create new settings with domain
      const { data, error } = await client
        .from('partner_whitelabel_settings')
        .insert({
          partner_id: partnerId,
          ...updateData,
        })
        .select('custom_domain, custom_domain_verified, custom_domain_verification_token')
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        customDomain: data.custom_domain,
        verified: data.custom_domain_verified,
        verificationToken: data.custom_domain_verification_token,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Failed to update custom domain', error, {
      userId: user.id,
    });
    throw error;
  }
});

