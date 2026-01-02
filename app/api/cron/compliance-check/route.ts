/**
 * API: Cron Job - Compliance Check
 * Runs daily to check license expiry and send notifications
 * 
 * Triggered by:
 * - Vercel Cron at 00:00 UTC (07:00 WIB)
 * - Manual trigger via GET request with authorization
 */

import { NextRequest, NextResponse } from 'next/server';

import { generateComplianceAlerts } from '@/lib/compliance/alert-generator';
import { checkAndUpdateLicenseStatuses } from '@/lib/compliance/license-checker';
import { sendBatchAlertNotifications, sendComplianceSummaryNotification } from '@/lib/compliance/notifications';
import { logger } from '@/lib/utils/logger';

// Verify cron authorization header
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // If CRON_SECRET is set, verify it
  if (cronSecret) {
    return authHeader === `Bearer ${cronSecret}`;
  }
  
  // For Vercel Cron, check the x-vercel-cron-signature header
  const vercelCronHeader = request.headers.get('x-vercel-cron-signature');
  if (vercelCronHeader) {
    return true; // Vercel handles authentication
  }
  
  // In development, allow without auth
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  return false;
}

/**
 * GET /api/cron/compliance-check
 * Run the daily compliance check
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify authorization
  if (!verifyCronAuth(request)) {
    logger.warn('Unauthorized cron access attempt', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  logger.info('Starting daily compliance check');
  
  try {
    // Step 1: Update license statuses based on expiry dates
    logger.info('Step 1: Checking and updating license statuses');
    const statusResult = await checkAndUpdateLicenseStatuses();
    logger.info('License status update completed', {
      updated: statusResult.updated,
      alerts: statusResult.alerts,
    });
    
    // Step 2: Generate new alerts for licenses approaching expiry
    logger.info('Step 2: Generating compliance alerts');
    const newAlerts = await generateComplianceAlerts();
    logger.info('Alert generation completed', { count: newAlerts.length });
    
    // Step 3: Send notifications for new alerts
    if (newAlerts.length > 0) {
      logger.info('Step 3: Sending notifications for new alerts');
      const notificationResults = await sendBatchAlertNotifications(newAlerts);
      
      const successCount = notificationResults.filter((r) =>
        r.results.some((nr) => nr.success)
      ).length;
      
      logger.info('Notifications sent', {
        total: newAlerts.length,
        successful: successCount,
      });
    } else {
      logger.info('Step 3: No new alerts to notify');
    }
    
    // Step 4: Send daily summary if there are unresolved issues
    logger.info('Step 4: Sending compliance summary');
    await sendComplianceSummaryNotification();
    
    const duration = Date.now() - startTime;
    
    logger.info('Daily compliance check completed', {
      duration: `${duration}ms`,
      licensesUpdated: statusResult.updated,
      alertsGenerated: newAlerts.length,
    });
    
    return NextResponse.json({
      success: true,
      message: 'Compliance check completed',
      results: {
        licensesUpdated: statusResult.updated,
        alertsGenerated: newAlerts.length,
        duration: `${duration}ms`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Compliance check failed', error, {
      duration: `${duration}ms`,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/compliance-check
 * Manual trigger with options
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json().catch(() => ({}));
    const options = body as {
      skipNotifications?: boolean;
      skipSummary?: boolean;
      dryRun?: boolean;
    };
    
    logger.info('Manual compliance check triggered', { options });
    
    const results: {
      statusCheck?: { updated: number; alerts: number };
      newAlerts?: number;
      notifications?: number;
      summary?: boolean;
    } = {};
    
    // Step 1: Update statuses
    if (!options.dryRun) {
      const statusResult = await checkAndUpdateLicenseStatuses();
      results.statusCheck = {
        updated: statusResult.updated,
        alerts: statusResult.alerts,
      };
    }
    
    // Step 2: Generate alerts
    const newAlerts = await generateComplianceAlerts();
    results.newAlerts = newAlerts.length;
    
    // Step 3: Send notifications
    if (!options.skipNotifications && newAlerts.length > 0 && !options.dryRun) {
      const notificationResults = await sendBatchAlertNotifications(newAlerts);
      results.notifications = notificationResults.filter((r) =>
        r.results.some((nr) => nr.success)
      ).length;
    }
    
    // Step 4: Send summary
    if (!options.skipSummary && !options.dryRun) {
      await sendComplianceSummaryNotification();
      results.summary = true;
    }
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: options.dryRun ? 'Dry run completed' : 'Manual check completed',
      results,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Manual compliance check failed', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

