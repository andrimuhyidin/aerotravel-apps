/**
 * API: Admin - AI Documents Statistics
 * GET /api/admin/ai-documents/stats
 * 
 * Get statistics about AI documents usage
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['super_admin', 'ops_admin', 'owner', 'manager', 'admin'].includes(
    userProfile?.role || ''
  );

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Get total documents
    const { count: totalCount } = await client
      .from('ai_documents')
      .select('*', { count: 'exact', head: true });

    // Get documents by type
    const { data: byType } = await client
      .from('ai_documents')
      .select('document_type')
      .eq('is_active', true);

    const typeCounts = (byType || []).reduce((acc: Record<string, number>, doc: any) => {
      acc[doc.document_type] = (acc[doc.document_type] || 0) + 1;
      return acc;
    }, {});

    // Get documents with/without embedding
    const { data: withEmbedding } = await client
      .from('ai_documents')
      .select('id')
      .not('embedding', 'is', null)
      .eq('is_active', true);

    const { data: withoutEmbedding } = await client
      .from('ai_documents')
      .select('id')
      .is('embedding', null)
      .eq('is_active', true);

    return NextResponse.json({
      total: totalCount || 0,
      active: (byType || []).length,
      byType: typeCounts,
      withEmbedding: withEmbedding?.length || 0,
      withoutEmbedding: withoutEmbedding?.length || 0,
    });
  } catch (error) {
    logger.error('Failed to get AI documents stats', error, { userId: user.id });
    return NextResponse.json({ error: 'Gagal mengambil statistik' }, { status: 500 });
  }
});
