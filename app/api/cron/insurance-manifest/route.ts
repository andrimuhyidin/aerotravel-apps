/**
 * API: Auto-Insurance Manifest Cron Job
 * GET /api/cron/insurance-manifest
 * 
 * This endpoint should be called by Vercel Cron or external cron service
 * Schedule: Daily at 06:00 WIB (23:00 UTC previous day)
 * 
 * PRD 6.1.B: Auto-Insurance Manifest
 */

import { NextRequest } from 'next/server';

import { createErrorResponse, createSuccessResponse } from '@/lib/api/response-format';
import { withErrorHandler } from '@/lib/api/error-handler';
import { generateManifestFile } from '@/lib/insurance/generate-manifest-file';
import { sendEmail } from '@/lib/integrations/resend';
import { uploadFile } from '@/lib/storage/supabase-storage';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    logger.warn('CRON_SECRET not configured, allowing request');
    return true; // Allow if not configured (for development)
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return createErrorResponse('Unauthorized', undefined, undefined, 401);
  }

  const supabase = await createClient();
  const client = supabase as unknown as any;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const results: Array<{
    manifestId: string;
    tripId: string;
    status: 'generated' | 'sent' | 'failed';
    error?: string;
  }> = [];

  try {
    // Step 1: Generate manifests for today's trips (if not already generated)
    logger.info('[Cron] Starting insurance manifest generation', { date: today });

    const { data: generatedManifests, error: generateError } = await client.rpc(
      'generate_daily_insurance_manifests'
    );

    if (generateError) {
      logger.error('[Cron] Failed to generate manifests', generateError, { date: today });
      return createErrorResponse('Failed to generate manifests', 'DATABASE_ERROR', generateError.message, 500);
    }

    const manifests = (generatedManifests || []) as Array<{
      manifest_id: string;
      trip_id: string;
      status: string;
    }>;

    logger.info('[Cron] Generated manifests', {
      date: today,
      count: manifests.length,
    });

    // Step 2: Get all pending manifests for today (including newly generated ones)
    const { data: pendingManifests, error: fetchError } = await client
      .from('insurance_manifests')
      .select(
        `
        id,
        trip_id,
        trip_date,
        insurance_company_id,
        insurance_company_name,
        passenger_count,
        manifest_data,
        file_format,
        branch_id,
        insurance_companies(email)
      `
      )
      .eq('trip_date', today)
      .eq('status', 'pending');

    if (fetchError) {
      logger.error('[Cron] Failed to fetch pending manifests', fetchError, { date: today });
      return createErrorResponse('Failed to fetch pending manifests', 'DATABASE_ERROR', fetchError.message, 500);
    }

    const manifestsToSend = (pendingManifests || []) as Array<{
      id: string;
      trip_id: string;
      trip_date: string;
      insurance_company_id?: string;
      insurance_company_name?: string;
      passenger_count: number;
      manifest_data: Array<{
        name: string;
        nik?: string;
        birth_date?: string;
        gender?: string;
        phone?: string;
        email?: string;
      }>;
      file_format?: string;
      branch_id: string;
      insurance_companies?: { email?: string } | null;
    }>;

    logger.info('[Cron] Found manifests to send', {
      date: today,
      count: manifestsToSend.length,
    });

    // Step 3: Send each manifest to insurance company
    for (const manifest of manifestsToSend) {
      try {
        const insuranceEmail =
          manifest.insurance_companies?.email ||
          process.env.INSURANCE_DEFAULT_EMAIL;

        if (!insuranceEmail) {
          logger.warn('[Cron] No insurance email configured', {
            manifestId: manifest.id,
            tripId: manifest.trip_id,
          });
          results.push({
            manifestId: manifest.id,
            tripId: manifest.trip_id,
            status: 'failed',
            error: 'Insurance email not configured',
          });
          continue;
        }

        // Generate manifest file
        const fileFormat = ((manifest.file_format || 'csv').toLowerCase()) as 'csv' | 'excel' | 'pdf';
        
        // Get trip info for PDF generation
        let tripInfo: { tripCode?: string; tripName?: string; destination?: string } | undefined;
        if (fileFormat === 'pdf' && manifest.trip_id) {
          const { data: tripData } = await client
            .from('trips')
            .select('trip_code, package:packages(name, destination)')
            .eq('id', manifest.trip_id)
            .single();
          
          if (tripData) {
            tripInfo = {
              tripCode: tripData.trip_code || undefined,
              tripName: (tripData.package as { name?: string })?.name,
              destination: (tripData.package as { destination?: string })?.destination,
            };
          }
        }

        const { buffer, filename, contentType } = await generateManifestFile(
          manifest.manifest_data,
          manifest.trip_date,
          fileFormat,
          tripInfo
        );

        // Upload to storage
        const storagePath = `insurance-manifests/${manifest.branch_id}/${manifest.id}/${filename}`;
        let fileUrl = '';
        
        try {
          fileUrl = await uploadFile({
            bucket: 'insurance-documents',
            path: storagePath,
            file: buffer,
            contentType,
            upsert: true,
          });
        } catch (storageError) {
          logger.warn('[Cron] Failed to upload to storage, continuing with email', {
            manifestId: manifest.id,
            error: storageError,
          });
        }

        // Send email
        const emailSubject = `Manifest Asuransi - ${manifest.trip_date} - ${manifest.insurance_company_name || 'Insurance Manifest'}`;
        const emailBody = `
          <h2>Manifest Asuransi</h2>
          <p>Berikut adalah manifest penumpang untuk trip tanggal <strong>${manifest.trip_date}</strong>.</p>
          <p><strong>Jumlah Penumpang:</strong> ${manifest.passenger_count}</p>
          <p><strong>Perusahaan Asuransi:</strong> ${manifest.insurance_company_name || 'N/A'}</p>
          <p>File manifest terlampir dalam format ${fileFormat.toUpperCase()}.</p>
          <p>Jika ada pertanyaan, silakan hubungi tim operasional kami.</p>
        `;

        await sendEmail({
          to: insuranceEmail,
          subject: emailSubject,
          html: emailBody,
          attachments: [
            {
              filename,
              content: buffer,
            },
          ],
        });

        // Update manifest status
        await client
          .from('insurance_manifests')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            sent_to_email: insuranceEmail,
            file_url: fileUrl || null,
            file_size_bytes: buffer.length,
            updated_at: new Date().toISOString(),
          })
          .eq('id', manifest.id);

        results.push({
          manifestId: manifest.id,
          tripId: manifest.trip_id,
          status: 'sent',
        });

        logger.info('[Cron] Manifest sent successfully', {
          manifestId: manifest.id,
          tripId: manifest.trip_id,
          email: insuranceEmail,
        });
      } catch (error) {
        logger.error('[Cron] Failed to send manifest', error, {
          manifestId: manifest.id,
          tripId: manifest.trip_id,
        });

        // Update manifest status to failed
        await client
          .from('insurance_manifests')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : String(error),
            updated_at: new Date().toISOString(),
          })
          .eq('id', manifest.id);

        results.push({
          manifestId: manifest.id,
          tripId: manifest.trip_id,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const summary = {
      date: today,
      total: manifestsToSend.length,
      sent: results.filter((r) => r.status === 'sent').length,
      failed: results.filter((r) => r.status === 'failed').length,
      generated: manifests.length,
    };

    logger.info('[Cron] Insurance manifest job completed', summary);

    return createSuccessResponse({
      summary,
      results,
    });
  } catch (error) {
    logger.error('[Cron] Insurance manifest job failed', error, { date: today });
    return createErrorResponse(
      'Insurance manifest job failed',
      'CRON_ERROR',
      error instanceof Error ? error.message : String(error),
      500
    );
  }
});

