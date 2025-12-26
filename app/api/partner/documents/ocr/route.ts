/**
 * API: OCR Partner Legal Document
 * POST /api/partner/documents/ocr
 * 
 * Extract data from partner legal documents (SIUP, NPWP) using OCR
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { scanSIUP, scanNPWP } from '@/lib/ai/document-scanner';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const ocrSchema = z.object({
  documentType: z.enum(['siup', 'npwp']),
  imageBase64: z.string().min(1),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const validated = ocrSchema.parse(payload);
    const { documentType, imageBase64, mimeType } = validated;

    // Call appropriate scanner
    let documentData;
    if (documentType === 'siup') {
      documentData = await scanSIUP(imageBase64, mimeType);
    } else if (documentType === 'npwp') {
      documentData = await scanNPWP(imageBase64, mimeType);
    } else {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    logger.info('Document OCR completed', {
      userId: user.id,
      documentType,
      confidence: documentData.confidence,
    });

    return NextResponse.json({
      success: true,
      documentType,
      data: documentData.extractedData,
      fields: documentData.fields,
      confidence: documentData.confidence,
      expiryDate: documentData.expiryDate,
      isExpired: documentData.isExpired,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('OCR processing failed', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
});

