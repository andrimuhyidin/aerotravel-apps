/**
 * API: Admin - AI Documents Management
 * GET /api/admin/ai-documents - Get all AI documents
 * POST /api/admin/ai-documents - Create new AI document with auto-embedding
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { generateEmbedding } from '@/lib/ai/embeddings';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const documentTypeSchema = z.enum(['sop', 'faq', 'policy', 'product_info', 'training']);

const createDocumentSchema = z.object({
  title: z.string().min(1).max(300),
  document_type: documentTypeSchema,
  content: z.string().min(1),
  branch_id: z.string().uuid().nullable().optional(), // NULL = global document
  metadata: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().default(true),
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  document_type: documentTypeSchema.optional(),
  content: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  is_active: z.boolean().optional(),
});

// GET - List all AI documents
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

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
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  const isAdmin = ['super_admin', 'ops_admin'].includes(userProfile?.role || '');

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branch_id');
  const documentType = searchParams.get('document_type') as z.infer<typeof documentTypeSchema> | null;
  const isActive = searchParams.get('is_active');

  let query = client
    .from('ai_documents')
    .select('id, title, document_type, content, branch_id, metadata, is_active, created_at, updated_at, created_by')
    .order('created_at', { ascending: false });

  // Filter by branch (NULL = global documents)
  if (branchId) {
    query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
  }

  // Filter by document type
  if (documentType) {
    query = query.eq('document_type', documentType);
  }

  // Filter by active status
  if (isActive !== null) {
    query = query.eq('is_active', isActive === 'true');
  }

  const { data: documents, error } = await query;

  if (error) {
    logger.error('Failed to fetch AI documents', error, { userId: user.id });
    return NextResponse.json({ error: 'Gagal mengambil dokumen' }, { status: 500 });
  }

  return NextResponse.json({ documents: documents || [] });
});

// POST - Create new AI document with auto-embedding
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

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
    .select('role, branch_id')
    .eq('id', user.id)
    .single();

  const isAdmin = ['super_admin', 'ops_admin'].includes(userProfile?.role || '');

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const validated = createDocumentSchema.parse(body);

  try {
    // Generate embedding dari content
    const embedding = await generateEmbedding(validated.content);

    // Insert document dengan embedding
    const { data: document, error } = await client
      .from('ai_documents')
      .insert({
        title: validated.title,
        document_type: validated.document_type,
        content: validated.content,
        branch_id: validated.branch_id || null,
        metadata: validated.metadata || null,
        is_active: validated.is_active,
        embedding: `[${embedding.join(',')}]`, // PostgreSQL vector format: [1,2,3,...]
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create AI document', error, {
        userId: user.id,
        title: validated.title,
      });
      return NextResponse.json({ error: 'Gagal membuat dokumen' }, { status: 500 });
    }

    logger.info('AI document created with embedding', {
      documentId: document.id,
      title: validated.title,
      embeddingLength: embedding.length,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    logger.error('Exception while creating AI document', error, {
      userId: user.id,
      title: validated.title,
    });
    return NextResponse.json({ error: 'Gagal membuat dokumen' }, { status: 500 });
  }
});
