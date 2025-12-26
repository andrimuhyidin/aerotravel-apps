/**
 * API: Verify Custom Domain DNS
 * POST /api/partner/whitelabel/domain/verify - Verify DNS TXT record
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { promises as dns } from 'dns';

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
    // Get current settings
    const { data: settings, error: settingsError } = await client
      .from('partner_whitelabel_settings')
      .select('custom_domain, custom_domain_verification_token')
      .eq('partner_id', user.id)
      .single();

    if (settingsError || !settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    if (!settings.custom_domain || !settings.custom_domain_verification_token) {
      return NextResponse.json(
        { error: 'Custom domain not configured' },
        { status: 400 }
      );
    }

    // Check DNS TXT record
    try {
      const txtRecords = await dns.resolveTxt(settings.custom_domain);
      const allTxtValues = txtRecords.flat().join(' ');

      // Check if verification token exists in TXT records
      const isVerified = allTxtValues.includes(
        settings.custom_domain_verification_token
      );

      if (isVerified) {
        // Update verification status
        await client
          .from('partner_whitelabel_settings')
          .update({
            custom_domain_verified: true,
          })
          .eq('partner_id', user.id);

        logger.info('Custom domain verified', {
          userId: user.id,
          domain: settings.custom_domain,
        });
      }

      return NextResponse.json({
        success: true,
        verified: isVerified,
        message: isVerified
          ? 'Domain berhasil diverifikasi'
          : 'TXT record belum ditemukan. Pastikan Anda telah menambahkan TXT record ke DNS Anda.',
        expectedTxtValue: `aero-verify=${settings.custom_domain_verification_token}`,
      });
    } catch (dnsError) {
      logger.error('DNS verification failed', dnsError, {
        userId: user.id,
        domain: settings.custom_domain,
      });

      return NextResponse.json({
        success: false,
        verified: false,
        message: 'Gagal memeriksa DNS. Pastikan domain sudah dikonfigurasi dengan benar.',
        expectedTxtValue: `aero-verify=${settings.custom_domain_verification_token}`,
      });
    }
  } catch (error) {
    logger.error('Failed to verify custom domain', error, {
      userId: user.id,
    });
    throw error;
  }
});

