/**
 * API: Notify Expiring Contracts
 * POST /api/admin/guide/contracts/expire-notify - Send notifications for expiring contracts
 * Can be called by cron job
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  // Get contracts expiring in 7 days
  const now = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(now.getDate() + 7);

  const { data: contracts, error } = await client
    .from('guide_contracts')
    .select(
      `
      id,
      contract_number,
      expires_at,
      guide_id,
      guide:users!guide_contracts_guide_id_fkey(phone, full_name)
    `
    )
    .eq('status', 'active')
    .not('expires_at', 'is', null)
    .gte('expires_at', now.toISOString())
    .lte('expires_at', sevenDaysLater.toISOString());

  if (error) {
    logger.error('Failed to load expiring contracts', error);
    return NextResponse.json({ error: 'Failed to load contracts' }, { status: 500 });
  }

  let notified = 0;
  let failed = 0;

  // Send notifications
  const { notifyContractExpiring, createInAppNotification } = await import('@/lib/integrations/contract-notifications');

  for (const contract of contracts || []) {
    try {
      const guide = contract.guide as { phone?: string | null; full_name?: string | null } | null;
      
      // WhatsApp notification
      if (guide?.phone && contract.expires_at) {
        await notifyContractExpiring(
          guide.phone,
          contract.contract_number || contract.id,
          contract.expires_at
        );
      }

      // In-app notification
      await createInAppNotification(
        contract.guide_id,
        'contract_expiring',
        'Kontrak Akan Kadaluarsa',
        `Kontrak ${contract.contract_number || contract.id} akan kadaluarsa dalam 7 hari. Silakan hubungi admin untuk memperpanjang.`,
        contract.id
      );

      notified++;
    } catch (error) {
      logger.error('Failed to notify expiring contract', error, {
        contractId: contract.id,
      });
      failed++;
    }
  }

  logger.info('Expiring contracts notification sent', {
    total: contracts?.length || 0,
    notified,
    failed,
  });

  return NextResponse.json({
    success: true,
    total: contracts?.length || 0,
    notified,
    failed,
    message: `${notified} kontrak telah diberi notifikasi`,
  });
});
