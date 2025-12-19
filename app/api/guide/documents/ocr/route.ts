/**
 * API: OCR Document Scan (KTP/SIM)
 * POST /api/guide/documents/ocr
 * 
 * Uses Google Gemini Vision API to extract data from ID cards
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { analyzeImage } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const ocrSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
  documentType: z.enum(['ktp', 'sim']).default('ktp'),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = ocrSchema.parse(await request.json());
  const { imageBase64, mimeType, documentType } = payload;

  try {
    let prompt: string;
    let expectedFields: string[];

    if (documentType === 'ktp') {
      prompt = `Extract data from this Indonesian KTP (ID card) image and return ONLY a JSON object with these fields:
{
  "nik": "nomor NIK",
  "nama": "nama lengkap",
  "tempat_lahir": "tempat lahir",
  "tanggal_lahir": "YYYY-MM-DD",
  "jenis_kelamin": "L" or "P",
  "alamat": "alamat lengkap",
  "rt": "RT",
  "rw": "RW",
  "kelurahan": "kelurahan/desa",
  "kecamatan": "kecamatan",
  "kabupaten": "kabupaten/kota",
  "provinsi": "provinsi",
  "agama": "agama",
  "status_perkawinan": "status",
  "pekerjaan": "pekerjaan",
  "kewarganegaraan": "WNI" or "WNA",
  "berlaku_hingga": "SEUMUR HIDUP" or date,
  "confidence": 0-100
}

If any field cannot be extracted, set it to null. Return ONLY the JSON object, no additional text.`;
      expectedFields = ['nik', 'nama', 'tempat_lahir', 'tanggal_lahir'];
    } else {
      // SIM
      prompt = `Extract data from this Indonesian SIM (driver's license) image and return ONLY a JSON object with these fields:
{
  "nomor_sim": "nomor SIM",
  "nama": "nama lengkap",
  "alamat": "alamat",
  "tempat_lahir": "tempat lahir",
  "tanggal_lahir": "YYYY-MM-DD",
  "jenis_kelamin": "L" or "P",
  "golongan_darah": "A", "B", "AB", or "O",
  "berlaku_hingga": "YYYY-MM-DD",
  "confidence": 0-100
}

If any field cannot be extracted, set it to null. Return ONLY the JSON object, no additional text.`;
      expectedFields = ['nomor_sim', 'nama', 'tanggal_lahir'];
    }

    const result = await analyzeImage(imageBase64, mimeType, prompt);

    // Parse JSON from response
    let extractedData: Record<string, unknown>;
    try {
      const cleaned = result.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(cleaned);
    } catch (parseError) {
      logger.error('Failed to parse OCR result', parseError, { documentType });
      return NextResponse.json(
        { error: 'Failed to parse OCR result', raw: result },
        { status: 500 }
      );
    }

    // Validate required fields
    const missingFields = expectedFields.filter((field) => !extractedData[field]);
    if (missingFields.length > 0) {
      logger.warn('OCR missing required fields', { missingFields, documentType });
    }

    return NextResponse.json({
      success: true,
      documentType,
      data: extractedData,
      confidence: (extractedData.confidence as number) || 0,
    });
  } catch (error) {
    logger.error('OCR processing failed', error, { documentType, guideId: user.id });
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
});

