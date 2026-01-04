/**
 * API: Send Insurance Manifest
 * POST /api/admin/insurance/manifests/[id]/send
 * 
 * Sends generated manifest to insurance company via email
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { generateManifestFile } from '@/lib/insurance/generate-manifest-file';
import { sendEmail } from '@/lib/integrations/resend';
import { uploadFile } from '@/lib/storage/supabase-storage';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get manifest
  const { data: manifest, error: fetchError } = await withBranchFilter(
    client.from('insurance_manifests'),
    branchContext,
  )
    .select('*, insurance_companies(email, name)')
    .eq('id', id)
    .single();

  if (fetchError || !manifest) {
    logger.error('Manifest not found', fetchError, { manifestId: id });
    return NextResponse.json({ error: 'Manifest not found' }, { status: 404 });
  }

  if (manifest.status === 'sent') {
    return NextResponse.json(
      { error: 'Manifest already sent' },
      { status: 400 }
    );
  }

  const insuranceEmail = manifest.insurance_companies?.email || process.env.INSURANCE_DEFAULT_EMAIL;
  
  if (!insuranceEmail) {
    logger.warn('No insurance email configured', { manifestId: id });
    return NextResponse.json(
      { error: 'Insurance email not configured' },
      { status: 400 }
    );
  }

  // Determine file format (default to CSV)
  const fileFormat = (manifest.file_format || 'csv').toLowerCase() as 'csv' | 'excel' | 'pdf';

  try {
    // 1. Generate manifest file (CSV/Excel/PDF)
    const manifestData = manifest.manifest_data as Array<{
      name: string;
      nik?: string;
      birth_date?: string;
      gender?: string;
      phone?: string;
      email?: string;
    }>;

    if (!manifestData || !Array.isArray(manifestData)) {
      logger.error('Invalid manifest_data format', { manifestId: id, manifestData });
      return NextResponse.json(
        { error: 'Invalid manifest data format' },
        { status: 400 }
      );
    }

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
      manifestData,
      manifest.trip_date,
      fileFormat,
      tripInfo
    );

    // 2. Upload to Supabase Storage
    const storagePath = `insurance-manifests/${manifest.branch_id}/${id}/${filename}`;
    let fileUrl: string;

    try {
      fileUrl = await uploadFile({
        bucket: 'insurance-documents',
        path: storagePath,
        file: buffer,
        contentType,
        upsert: true,
      });
    } catch (storageError) {
      logger.error('Failed to upload manifest file to storage', storageError, {
        manifestId: id,
        storagePath,
      });
      // Continue without storage URL if upload fails (file still sent via email)
      fileUrl = '';
    }

    // 3. Send email with attachment via Resend
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

    // 4. Update manifest with file_url and sent_at
    const { error: updateError } = await withBranchFilter(
      client.from('insurance_manifests'),
      branchContext,
    )
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_to_email: insuranceEmail,
        file_url: fileUrl || null,
        file_format: fileFormat,
        file_size_bytes: buffer.length,
      })
      .eq('id', id);

    if (updateError) {
      logger.error('Failed to update manifest status', updateError, { manifestId: id });
      // Email was sent, but update failed - log warning
      logger.warn('Email sent but manifest update failed', {
        manifestId: id,
        email: insuranceEmail,
      });
    }

    logger.info('Insurance manifest sent successfully', {
      manifestId: id,
      email: insuranceEmail,
      fileFormat,
      fileSize: buffer.length,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Manifest sent successfully',
      manifestId: id,
      email: insuranceEmail,
      fileFormat,
      fileUrl: fileUrl || undefined,
    });
  } catch (error) {
    logger.error('Failed to send insurance manifest', error, {
      manifestId: id,
      email: insuranceEmail,
      userId: user.id,
    });

    // Update manifest status to failed
    await withBranchFilter(
      client.from('insurance_manifests'),
      branchContext,
    )
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', id);

    return NextResponse.json(
      { error: 'Failed to send manifest', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Manifest sent (email sending to be implemented)',
    manifestId: id,
    email: insuranceEmail,
  });
});

