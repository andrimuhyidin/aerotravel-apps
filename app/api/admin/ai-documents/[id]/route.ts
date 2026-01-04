/**
 * API: Admin - Update/Delete AI Document
 * PATCH /api/admin/ai-documents/[id] - Update document (regenerate embedding if content changed)
 * DELETE /api/admin/ai-documents/[id] - Delete document
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { generateEmbedding } from '@/lib/ai/embeddings';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const documentTypeSchema = z.enum(['sop', 'faq', 'policy', 'product_info', 'training']);

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  document_type: documentTypeSchema.optional(),
  content: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
});

// PATCH - Update document
export const PATCH = withErrorHandler(async (
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

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['super_admin', 'ops_admin'].includes(userProfile?.role || '');

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get existing document
  const { data: existingDoc, error: fetchError } = await client
    .from('ai_documents')
    .select('content')
    .eq('id', id)
    .single();

  if (fetchError || !existingDoc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const body = await request.json();
  const validated = updateDocumentSchema.parse(body);

  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.document_type !== undefined) updateData.document_type = validated.document_type;
    if (validated.metadata !== undefined) updateData.metadata = validated.metadata;
    if (validated.is_active !== undefined) updateData.is_active = validated.is_active;

    // If content changed, regenerate embedding
    if (validated.content !== undefined && validated.content !== existingDoc.content) {
      const embedding = await generateEmbedding(validated.content);
      updateData.content = validated.content;
      updateData.embedding = `[${embedding.join(',')}]`; // PostgreSQL vector format
      
      logger.info('Regenerating embedding for updated document', {
        documentId: id,
        contentLength: validated.content.length,
      });
    }

    const { data: document, error } = await client
      .from('ai_documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update AI document', error, {
        documentId: id,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Gagal mengupdate dokumen' }, { status: 500 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    logger.error('Exception while updating AI document', error, {
      documentId: id,
      userId: user.id,
    });
    return NextResponse.json({ error: 'Gagal mengupdate dokumen' }, { status: 500 });
  }
});

// DELETE - Delete document
export const DELETE = withErrorHandler(async (
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

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['super_admin', 'ops_admin'].includes(userProfile?.role || '');

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await client
    .from('ai_documents')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete AI document', error, {
      documentId: id,
      userId: user.id,
    });
    return NextResponse.json({ error: 'Gagal menghapus dokumen' }, { status: 500 });
  }

  logger.info('AI document deleted', { documentId: id, userId: user.id });

  return NextResponse.json({ success: true });
});
