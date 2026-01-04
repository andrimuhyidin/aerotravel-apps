/**
 * Cron Job: Corporate Budget Alerts
 * GET /api/cron/corporate-budget-alerts - Check and send budget alerts
 *
 * This endpoint should be called by a scheduled job
 * Suggested schedule: Weekly on Monday at 9:00 AM
 *
 * Features:
 * - Weekly budget summary for PICs
 * - Alert for departments exceeding thresholds
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Verify cron secret
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
    logger.warn('Unauthorized cron access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    corporatesProcessed: 0,
    alertsSent: 0,
    errors: [] as string[],
  };

  try {
    logger.info('Starting corporate budget alerts cron job');

    const supabase = await createClient();

    // Get all active corporate clients with their budgets
    const { data: corporates, error: corpError } = await supabase
      .from('corporate_clients')
      .select('id, company_name, pic_id')
      .eq('is_active', true);

    if (corpError) {
      logger.error('Failed to fetch corporates', corpError);
      return NextResponse.json(
        { error: 'Failed to fetch corporates' },
        { status: 500 }
      );
    }

    if (!corporates || corporates.length === 0) {
      return NextResponse.json({
        message: 'No active corporates found',
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

      if (!corporate.pic_id) continue;

      results.corporatesProcessed++;

      try {
        // Get employee budget data
        const { data: employees } = await supabase
          .from('corporate_employees')
          .select('department, allocated_amount, used_amount')
          .eq('corporate_id', corporate.id)
          .eq('is_active', true);

        if (!employees || employees.length === 0) continue;

        // Aggregate by department
        const departmentStats = new Map<
          string,
          { allocated: number; used: number }
        >();

        (
          employees as Array<{
            department: string | null;
            allocated_amount: number;
            used_amount: number;
          }>
        ).forEach((emp) => {
          const dept = emp.department || 'General';
          if (!departmentStats.has(dept)) {
            departmentStats.set(dept, { allocated: 0, used: 0 });
          }
          const deptData = departmentStats.get(dept)!;
          deptData.allocated += Number(emp.allocated_amount || 0);
          deptData.used += Number(emp.used_amount || 0);
        });

        // Calculate totals
        let totalAllocated = 0;
        let totalUsed = 0;
        const alertDepartments: string[] = [];

        departmentStats.forEach((data, dept) => {
          totalAllocated += data.allocated;
          totalUsed += data.used;

          if (data.allocated > 0) {
            const usage = (data.used / data.allocated) * 100;
            if (usage >= 80) {
              alertDepartments.push(dept);
            }
          }
        });

        // Create weekly summary notification
        const usagePercentage =
          totalAllocated > 0
            ? Math.round((totalUsed / totalAllocated) * 100)
            : 0;

        const formatRupiah = (value: number) =>
          new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
          }).format(value);

        let message = `📊 Ringkasan Budget Mingguan\n\n`;
        message += `Total Terpakai: ${formatRupiah(totalUsed)} (${usagePercentage}%)\n`;
        message += `Sisa Budget: ${formatRupiah(totalAllocated - totalUsed)}\n`;

        if (alertDepartments.length > 0) {
          message += `\n⚠️ Perhatian: ${alertDepartments.join(', ')} sudah melebihi 80% budget`;
        }

        // Insert notification
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: corporate.pic_id,
            app: 'corporate',
            type: 'corporate.budget_threshold',
            title: '📊 Laporan Budget Mingguan',
            message,
            metadata: {
              totalAllocated,
              totalUsed,
              usagePercentage,
              alertDepartments,
              companyName: corporate.company_name,
            },
            read: false,
          });

        if (!notifError) {
          results.alertsSent++;
        } else {
          logger.error('Failed to create budget notification', notifError, {
            corporateId: corporate.id,
          });
        }
      } catch (error) {
        const errorMsg = `Failed for ${corporate.company_name}: ${error instanceof Error ? error.message : 'Unknown'}`;
        results.errors.push(errorMsg);
        logger.error('Budget alert processing failed', error, {
          corporateId: corporate.id,
        });
      }
    }

    const duration = Date.now() - startTime;

    logger.info('Corporate budget alerts cron completed', {
      ...results,
      duration,
    });

    return NextResponse.json({
      success: true,
      message: 'Budget alerts processed',
      results,
      duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Corporate budget alerts cron failed', error);

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

export const POST = GET;

