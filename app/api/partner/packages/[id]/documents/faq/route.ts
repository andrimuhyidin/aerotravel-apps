/**
 * API: Generate FAQ PDF
 * GET /api/partner/packages/[id]/documents/faq
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { generateFAQPDF } from '@/lib/pdf/faq';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ id: string }>;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: packageId } = await params;
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

  const searchParams = sanitizeSearchParams(request);
  const language = (searchParams.get('language') || 'id') as 'id' | 'en';

  const client = supabase as unknown as any;

  try {
    // Get package details and partner whitelabel settings
    const { data: packageData, error: packageError } = await client
      .from('packages')
      .select(`
        id,
        name,
        destination,
        faq_items,
        mitra:users!packages_mitra_id_fkey(
          id,
          full_name,
          company_name,
          partner_whitelabel_settings(
            company_name,
            company_address,
            company_phone,
            company_email,
            invoice_footer
          )
        )
      `)
      .eq('id', packageId)
      .single();

    if (packageError || !packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Get whitelabel settings
    const whitelabel = packageData.mitra?.partner_whitelabel_settings?.[0];
    const companyName = whitelabel?.company_name || packageData.mitra?.company_name || packageData.mitra?.full_name || 'Partner';
    const companyAddress = whitelabel?.company_address || '';
    const companyPhone = whitelabel?.company_phone || '';
    const companyEmail = whitelabel?.company_email || '';

    // Parse custom FAQ items if stored as JSON
    let customFAQs: Array<{ question: string; answer: string }> | undefined;
    if (packageData.faq_items) {
      try {
        if (typeof packageData.faq_items === 'string') {
          customFAQs = JSON.parse(packageData.faq_items);
        } else if (Array.isArray(packageData.faq_items)) {
          customFAQs = packageData.faq_items;
        }
      } catch (e) {
        logger.warn('Failed to parse faq_items', { packageId, error: e });
      }
    }

    // Generate FAQ PDF
    const faqData = {
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      packageName: packageData.name,
      destination: packageData.destination,
      footerText: whitelabel?.invoice_footer || undefined,
      customFAQs,
      language,
    };

    const pdfBuffer = await generateFAQPDF(faqData);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="faq-${packageData.name.replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error) {
    logger.error('Failed to generate FAQ PDF', error, {
      packageId,
      userId: user.id,
      partnerId,
    });
    throw error;
  }
});

