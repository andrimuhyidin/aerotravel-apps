/**
 * Cron Job: Corporate Reminders
 * GET /api/cron/corporate-reminders - Process corporate notifications
 *
 * This endpoint should be called by a scheduled job (e.g., Vercel Cron, GitHub Actions)
 * Suggested schedule: Daily at 8:00 AM
 *
 * Features:
 * - Send booking reminders (H-7, H-3, H-1)
 * - Check budget thresholds and alert PICs
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  checkBudgetThresholds,
  sendBookingReminders,
} from '@/lib/corporate/notifications';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.warn('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    logger.warn('Unauthorized cron access attempt', {
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    corporatesProcessed: 0,
    remindersSuccess: 0,
    remindersFailed: 0,
    budgetChecksSuccess: 0,
    budgetChecksFailed: 0,
    errors: [] as string[],
  };

  try {
    logger.info('Starting corporate reminders cron job');

    const supabase = await createClient();

    // Get all active corporate clients
    const { data: corporates, error } = await supabase
      .from('corporate_clients')
      .select('id, company_name, pic_id')
      .eq('is_active', true);

    if (error) {
      logger.error('Failed to fetch corporates', error);
      return NextResponse.json(
        { error: 'Failed to fetch corporates' },
        { status: 500 }
      );
    }

    if (!corporates || corporates.length === 0) {
      logger.info('No active corporates found');
      return NextResponse.json({
        message: 'No active corporates to process',
        duration: Date.now() - startTime,
      });
    }

    // Process each corporate
    for (const corp of corporates) {
      const corporate = corp as {
        id: string;
        company_name: string;
        pic_id: string | null;
      };

      results.corporatesProcessed++;

      try {
        // Send booking reminders (H-1, H-3, H-7)
        await sendBookingReminders(corporate.id, 7);
        results.remindersSuccess++;
      } catch (error) {
        results.remindersFailed++;
        const errorMsg = `Reminders failed for ${corporate.company_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        logger.error('Booking reminders failed', error, {
          corporateId: corporate.id,
        });
      }

      try {
        // Check budget thresholds
        await checkBudgetThresholds(corporate.id);
        results.budgetChecksSuccess++;
      } catch (error) {
        results.budgetChecksFailed++;
        const errorMsg = `Budget check failed for ${corporate.company_name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMsg);
        logger.error('Budget threshold check failed', error, {
          corporateId: corporate.id,
        });
      }
    }

    const duration = Date.now() - startTime;

    logger.info('Corporate reminders cron job completed', {
      ...results,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: 'Corporate reminders processed',
      results,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Corporate reminders cron job failed', error, { results });

    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        results,
        duration,
      },
      { status: 500 }
    );
  }
});

// Also support POST for flexibility
export const POST = GET;

