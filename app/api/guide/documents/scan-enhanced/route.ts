/**
 * API: Enhanced Document Scanner
 * POST /api/guide/documents/scan-enhanced
 * 
 * Multi-document OCR, auto-fill forms, expiry detection
 * Rate Limited: 5 requests per minute per user (OCR cost)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { checkDocumentExpiry, scanDocument, type DocumentType } from '@/lib/ai/document-scanner';
import { withErrorHandler } from '@/lib/api/error-handler';
import { checkGuideRateLimit, createRateLimitHeaders, guideOcrRateLimit } from '@/lib/rate-limit/guide-limits';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const scanSchema = z.object({
  documentType: z.enum(['ktp', 'sim', 'certificate', 'license', 'other']).optional(),
  autoFill: z.boolean().default(true), // Whether to auto-fill profile form
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check (OCR is more restrictive due to higher cost)
  const rateLimit = await checkGuideRateLimit(guideOcrRateLimit, user.id, 'scan dokumen');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: 429, headers: createRateLimitHeaders(rateLimit.remaining, rateLimit.reset) }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as DocumentType | null;
    const autoFill = formData.get('autoFill') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Determine mime type
    const mimeType = file.type as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mimeType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }

    // Scan document
    const documentData = await scanDocument(base64Image, mimeType, documentType || undefined);

    // Check expiry
    const expiryCheck = checkDocumentExpiry(documentData);

    // Auto-fill profile if requested
    let autoFillData = null;
    if (autoFill && documentData.type === 'ktp') {
      autoFillData = {
        fullName: documentData.fields.nama,
        birthPlace: documentData.fields.tempat_lahir,
        birthDate: documentData.fields.tanggal_lahir,
        address: documentData.fields.alamat,
        nik: documentData.fields.nik,
      };
    } else if (autoFill && documentData.type === 'sim') {
      autoFillData = {
        licenseNumber: documentData.fields.nomor_sim,
        licenseType: documentData.fields.jenis_sim,
        licenseExpiry: documentData.expiryDate,
      };
    }

    logger.info('Document scanned', {
      guideId: user.id,
      documentType: documentData.type,
      confidence: documentData.confidence,
      isExpired: expiryCheck.isExpired,
    });

    return NextResponse.json({
      document: documentData,
      expiry: expiryCheck,
      autoFill: autoFillData,
    });
  } catch (error) {
    logger.error('Failed to scan document', error);
    return NextResponse.json(
      { error: 'Gagal memindai dokumen' },
      { status: 500 }
    );
  }
});
