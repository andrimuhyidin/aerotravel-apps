/**
 * API: Partner Legal Documents
 * GET /api/partner/profile/documents - List all legal documents
 * POST /api/partner/profile/documents - Upload new legal document
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const uploadDocumentSchema = z.object({
  documentType: z.enum(['siup', 'npwp', 'akta', 'other']),
  documentUrl: z.string().url(),
  documentNumber: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  ocrData: z.record(z.string(), z.unknown()).optional(),
  ocrConfidence: z.number().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = supabase as unknown as any;

    const { data: documents, error } = await client
      .from('partner_legal_documents')
      .select('*')
      .eq('partner_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch legal documents', error, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents: documents || [],
    });
  } catch (error) {
    logger.error('Error in GET /api/partner/profile/documents', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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
    const body = await request.json();
    const validated = uploadDocumentSchema.parse(body);

    const client = supabase as unknown as any;

    // Insert document record
    const { data: document, error: insertError } = await client
      .from('partner_legal_documents')
      .insert({
        partner_id: user.id,
        document_type: validated.documentType,
        document_number: validated.documentNumber || null,
        document_url: validated.documentUrl,
        file_name: validated.fileName || null,
        file_size: validated.fileSize || null,
        mime_type: validated.mimeType || null,
        ocr_data: validated.ocrData || {},
        ocr_confidence: validated.ocrConfidence || null,
        is_verified: false,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create legal document', insertError, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to create document' },
        { status: 500 }
      );
    }

    logger.info('Legal document created', {
      userId: user.id,
      documentId: document.id,
    });

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error in POST /api/partner/profile/documents', error, {
      userId: user.id,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
