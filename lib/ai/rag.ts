/**
 * RAG (Retrieval Augmented Generation) Helper untuk AeroBot
 * Sesuai PRD 2.4.B - Strategi AI Automation (AeroBot)
 * PRD 5.2.A - AeroBot (AI Concierge)
 *
 * - Retrieve: Cari data relevan di Supabase (package_prices, ai_documents)
 * - Augment: Tambahkan context ke prompt
 * - Generate: Gemini generate response dengan context
 */

import 'server-only';

import { generateEmbedding } from '@/lib/ai/embeddings';
import { chat } from '@/lib/gemini';
import { aiChatRateLimit } from '@/lib/integrations/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type RAGContext = {
  packagePrices?: unknown[];
  documents?: unknown[];
  availability?: unknown;
};

/**
 * Retrieve relevant data dari Supabase untuk context (legacy - text search)
 */
export async function retrieveContext(query: string): Promise<RAGContext> {
  const supabase = await createClient();

  // Search package prices (vector similarity jika pakai embedding)
  const { data: packages } = await supabase
    .from('package_prices')
    .select('*')
    .ilike('package_name', `%${query}%`)
    .limit(5);

  // Search documents/SOP (vector similarity)
  // Note: Perlu setup pgvector embedding untuk full RAG
  const { data: documents } = await supabase
    .from('ai_documents')
    .select('*')
    .textSearch('content', query, {
      type: 'websearch',
      config: 'indonesian',
    })
    .limit(3);

  // Check availability jika query tentang tanggal/ketersediaan
  let availability: unknown = null;
  if (query.includes('kosong') || query.includes('tersedia') || query.includes('available') || query.includes('jadwal')) {
    // Try to extract date from query
    const datePatterns = [
      /(\d{1,2})\s*(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)/i,
      /(\d{1,2})\s*(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)/i,
      /(\d{4}-\d{2}-\d{2})/,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    ];

    let targetDate: Date | null = null;
    for (const pattern of datePatterns) {
      const match = query.match(pattern);
      if (match) {
        // Parse Indonesian month names
        const monthMap: Record<string, number> = {
          januari: 0, jan: 0, februari: 1, feb: 1, maret: 2, mar: 2,
          april: 3, apr: 3, mei: 4, juni: 5, jun: 5, juli: 6, jul: 6,
          agustus: 7, agu: 7, september: 8, sep: 8, oktober: 9, okt: 9,
          november: 10, nov: 10, desember: 11, des: 11,
        };

        if (match[2] && monthMap[match[2].toLowerCase()] !== undefined) {
          const day = parseInt(match[1] || '1', 10);
          const month = monthMap[match[2].toLowerCase()];
          const year = new Date().getFullYear();
          targetDate = new Date(year, month || 0, day);
        } else if (match[0]?.includes('-')) {
          targetDate = new Date(match[0]);
        }
        break;
      }
    }

    // Query trips for next 30 days or specific date
    const startDate = targetDate || new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (targetDate ? 7 : 30)); // 7 days if specific date, 30 if general

    const { data: trips } = await supabase
      .from('trips')
      .select('id, trip_code, trip_date, status, available_slots, packages(id, name, destination)')
      .gte('trip_date', startDate.toISOString().split('T')[0])
      .lte('trip_date', endDate.toISOString().split('T')[0])
      .in('status', ['open', 'scheduled'])
      .order('trip_date', { ascending: true })
      .limit(10);

    if (trips && trips.length > 0) {
      availability = trips.map((t) => ({
        tripCode: t.trip_code,
        date: t.trip_date,
        status: t.status,
        availableSlots: t.available_slots,
        package: t.packages,
      }));
    }
  }

  return {
    packagePrices: packages || [],
    documents: documents || [],
    availability,
  };
}

/**
 * Retrieve relevant data menggunakan vector similarity search (RAG Full)
 * @param query - User query
 * @param branchId - Optional branch ID untuk filter documents
 * @param matchThreshold - Similarity threshold (0-1), default 0.7
 * @param matchCount - Maximum number of documents to return, default 5
 */
export async function retrieveContextWithVector(
  query: string,
  branchId?: string | null,
  matchThreshold = 0.7,
  matchCount = 5
): Promise<RAGContext> {
  const supabase = await createClient();

  try {
    // Generate embedding dari query
    const queryEmbedding = await generateEmbedding(query);

    // Search package prices (keep text search for now)
    const { data: packages } = await supabase
      .from('package_prices')
      .select('*')
      .ilike('package_name', `%${query}%`)
      .limit(5);

    // Vector similarity search untuk documents/SOP
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding as unknown as string,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_branch_id: branchId ?? undefined,
    });

    if (error) {
      logger.error('Vector search failed, falling back to text search', error, {
        query,
        branchId,
      });
      // Fallback ke text search jika vector search gagal
      const { data: fallbackDocs } = await supabase
        .from('ai_documents')
        .select('*')
        .textSearch('content', query, {
          type: 'websearch',
          config: 'indonesian',
        })
        .limit(3);

      return {
        packagePrices: packages || [],
        documents: fallbackDocs || [],
      };
    }

    logger.info('Vector search successful', {
      queryLength: query.length,
      documentsFound: documents?.length || 0,
      branchId,
    });

    return {
      packagePrices: packages || [],
      documents: documents || [],
    };
  } catch (error) {
    logger.error('Failed to retrieve context with vector search', error, {
      query,
      branchId,
    });
    // Fallback ke text search
    return retrieveContext(query);
  }
}

/**
 * Generate AI response dengan RAG context
 */
export async function generateRAGResponse(
  userQuery: string,
  userId: string
): Promise<string> {
  // Rate limiting
  const { success } = await aiChatRateLimit.limit(userId);
  if (!success) {
    return 'Maaf, terlalu banyak request. Silakan tunggu sebentar.';
  }

  // Retrieve context
  const context = await retrieveContext(userQuery);

  // Build system prompt dengan context
  const systemPrompt = buildSystemPrompt(context);

  // Generate response using Gemini
  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    {
      role: 'user',
      content: userQuery,
    },
  ];

  const response = await chat(messages, systemPrompt);
  return response || 'Maaf, tidak bisa menjawab.';
}

function buildSystemPrompt(context: RAGContext): string {
  let prompt = `Anda adalah AeroBot, asisten virtual untuk Aero Travel.
Anda membantu customer dengan pertanyaan tentang paket wisata, harga, dan ketersediaan.
Jawab dengan ramah dan profesional dalam Bahasa Indonesia.

CONTEXT DATA:
`;

  if (context.packagePrices && context.packagePrices.length > 0) {
    prompt += `\nPaket Tersedia:\n${JSON.stringify(context.packagePrices, null, 2)}\n`;
  }

  if (context.documents && context.documents.length > 0) {
    prompt += `\nInformasi Tambahan:\n${JSON.stringify(context.documents, null, 2)}\n`;
  }

  if (context.availability) {
    prompt += `\nJadwal Trip Tersedia:\n${JSON.stringify(context.availability, null, 2)}\n`;
    prompt += `\nCatatan: Jika ada jadwal trip, informasikan tanggal dan ketersediaan slot.\n`;
  }

  prompt += `\nGUARDRAILS:
- JANGAN jawab pertanyaan tentang gaji guide, profit, atau data sensitif
- JANGAN jawab pertanyaan politik atau kontroversial
- Jika tidak tahu, arahkan ke customer service manusia
- Untuk booking, arahkan ke website atau hubungi customer service
`;

  return prompt;
}
