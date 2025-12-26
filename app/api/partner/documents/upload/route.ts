/**
 * API: Upload Partner Legal Document
 * POST /api/partner/documents/upload
 * 
 * Upload legal documents (SIUP, NPWP, Akta, etc.) for partner registration/profile
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const documentType = formData.get('documentType') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Validate document type
    const allowedTypes = ['siup', 'npwp', 'akta', 'other'];
    if (!allowedTypes.includes(documentType.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid document type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPEG, and PNG are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Magic bytes validation (reuse pattern from guide/certifications)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check magic bytes for PDF
    const isPDF = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    // Check magic bytes for JPEG
    const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    // Check magic bytes for PNG
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;

    if (!isPDF && !isJPEG && !isPNG) {
      return NextResponse.json(
        { error: 'File does not appear to be a valid PDF, JPEG, or PNG file.' },
        { status: 400 }
      );
    }

    // Ensure bucket exists (reuse helper)
    try {
      const { ensureBucketExists } = await import('@/lib/storage/ensure-bucket');
      await ensureBucketExists('partner-assets');
    } catch (error) {
      logger.warn('Failed to ensure bucket exists, continuing with fallback', { error });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || (file.type.includes('pdf') ? 'pdf' : 'jpg');
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileName = `${documentType}-${timestamp}-${randomStr}.${fileExt}`;
    const filePath = `partner-documents/${user.id}/${documentType}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('partner-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Failed to upload document', uploadError, { userId: user.id, documentType });
      return NextResponse.json(
        { error: 'Failed to upload document' },
        { status: 500 }
      );
    }

    // Get public URL (or signed URL for private bucket)
    const {
      data: { publicUrl },
    } = supabase.storage.from('partner-assets').getPublicUrl(filePath);

    // For private bucket, we might need signed URL instead
    // For now, using publicUrl - adjust based on bucket configuration

    logger.info('Document uploaded successfully', {
      userId: user.id,
      documentType,
      filePath,
      fileSize: file.size,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filePath,
      fileName,
      fileSize: file.size,
      mimeType: file.type,
      documentType,
    });
  } catch (error) {
    logger.error('Failed to upload document', error, { userId: user.id });
    throw error;
  }
});

