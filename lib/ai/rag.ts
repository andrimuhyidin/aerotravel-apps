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

import { chat } from '@/lib/gemini';
import { aiChatRateLimit } from '@/lib/integrations/rate-limit';
import { createClient } from '@/lib/supabase/server';

export type RAGContext = {
  packagePrices?: unknown[];
  documents?: unknown[];
  availability?: unknown;
};

/**
 * Retrieve relevant data dari Supabase untuk context
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
  if (query.includes('kosong') || query.includes('tersedia')) {
    // TODO: Implement availability check
  }

  return {
    packagePrices: packages || [],
    documents: documents || [],
  };
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

  prompt += `\nGUARDRAILS:
- JANGAN jawab pertanyaan tentang gaji guide, profit, atau data sensitif
- JANGAN jawab pertanyaan politik atau kontroversial
- Jika tidak tahu, arahkan ke customer service manusia
`;

  return prompt;
}
