/**
 * API: Partner Package Price Alerts
 * GET /api/partner/packages/:id/price-alerts - Get alerts for package
 * POST /api/partner/packages/:id/price-alerts - Create price alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createAlertSchema = z.object({
  targetPrice: z.number().positive('Target price must be positive'),
  alertType: z.enum(['below', 'above']),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;
  const { id: packageId } = await params;

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
    const { data: alerts, error } = await client
      .from('partner_price_alerts')
      .select('*')
      .eq('partner_id', partnerId)
      .eq('package_id', packageId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch price alerts', error, { userId: user.id, partnerId, packageId });
      throw error;
    }

    const transformedAlerts = (alerts || []).map((a: any) => ({
      id: a.id,
      packageId: a.package_id,
      targetPrice: a.target_price,
      alertType: a.alert_type,
      isActive: a.is_active,
      triggeredAt: a.triggered_at,
      createdAt: a.created_at,
    }));

    return NextResponse.json({ alerts: transformedAlerts });
  } catch (error) {
    logger.error('Failed to fetch price alerts', error, { userId: user.id, packageId });
    throw error;
  }
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;
  const { id: packageId } = await params;

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

  const body = await request.json();
  const validation = createAlertSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  const { targetPrice, alertType } = validation.data;

  try {
    // Verify package exists
    const { data: pkg, error: pkgError } = await client
      .from('packages')
      .select('id, name')
      .eq('id', packageId)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Check for existing active alert
    const { data: existingAlert } = await client
      .from('partner_price_alerts')
      .select('id')
      .eq('partner_id', partnerId)
      .eq('package_id', packageId)
      .eq('is_active', true)
      .maybeSingle();

    if (existingAlert) {
      return NextResponse.json(
        { error: 'You already have an active alert for this package' },
        { status: 400 }
      );
    }

    // Create alert
    const { data: alert, error: alertError } = await client
      .from('partner_price_alerts')
      .insert({
        partner_id: partnerId,
        package_id: packageId,
        target_price: targetPrice,
        alert_type: alertType,
        is_active: true,
      })
      .select('id')
      .single();

    if (alertError || !alert) {
      logger.error('Failed to create price alert', alertError, { userId: user.id, partnerId, packageId });
      throw alertError;
    }

    logger.info('Price alert created', {
      userId: user.id,
      partnerId,
      packageId,
      alertId: alert.id,
      targetPrice,
      alertType,
    });

    return NextResponse.json({
      success: true,
      alertId: alert.id,
    });
  } catch (error) {
    logger.error('Failed to create price alert', error, { userId: user.id, partnerId, packageId });
    throw error;
  }
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;
  const { id: packageId } = await params;

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
  const alertId = searchParams.get('alertId');

  try {
    let query = client
      .from('partner_price_alerts')
      .update({ is_active: false })
      .eq('partner_id', partnerId)
      .eq('package_id', packageId);

    if (alertId) {
      query = query.eq('id', alertId);
    }

    const { error } = await query;

    if (error) {
      logger.error('Failed to deactivate price alert', error, { userId: user.id, partnerId, packageId });
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to deactivate price alert', error, { userId: user.id, partnerId, packageId });
    throw error;
  }
});

