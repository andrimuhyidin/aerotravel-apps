/**
 * API: Partner WhatsApp Templates
 * GET /api/partner/broadcasts/templates - Get available WA templates from Meta Business API
 */

import { NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { fetchMetaTemplates, isMetaApiConfigured } from '@/lib/integrations/meta-whatsapp';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner } = await verifyPartnerAccess(user.id);
  if (!isPartner) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  try {
    // Fetch templates from Meta WhatsApp Business API (or fallback to defaults)
    const { templates, source } = await fetchMetaTemplates();

    logger.info('WA templates fetched', {
      userId: user.id,
      count: templates.length,
      source,
      isApiConfigured: isMetaApiConfigured(),
    });

    return NextResponse.json({
      templates,
      source,
      isApiConfigured: isMetaApiConfigured(),
    });
  } catch (error) {
    logger.error('Failed to fetch WA templates', error, { userId: user.id });
    throw error;
  }
});
