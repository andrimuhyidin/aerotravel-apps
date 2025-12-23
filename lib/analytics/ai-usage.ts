/**
 * AI Features Usage Analytics
 * Track usage metrics untuk AI features
 */

import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type AiUsageEvent = {
  feature:
    | 'rag_search'
    | 'briefing_generation'
    | 'briefing_edit'
    | 'chat_assistant';
  userId: string;
  tripId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Track AI feature usage
 */
export async function trackAiUsage(event: AiUsageEvent): Promise<void> {
  try {
    const _supabase = await createClient();

    // Insert ke analytics table (atau log untuk sekarang)
    // TODO: Create analytics table jika belum ada
    logger.info('AI feature usage', {
      feature: event.feature,
      userId: event.userId,
      tripId: event.tripId,
      metadata: event.metadata,
      timestamp: new Date().toISOString(),
    });

    // Optional: Store ke database untuk analytics
    // await supabase.from('ai_usage_analytics').insert({...});
  } catch (error) {
    logger.error('Failed to track AI usage', error);
    // Don't throw - analytics should not break main flow
  }
}

/**
 * Get AI usage stats
 */
export async function getAiUsageStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  ragSearches: number;
  briefingGenerations: number;
  briefingEdits: number;
  chatAssistants: number;
}> {
  try {
    // TODO: Query dari analytics table
    // For now, return mock data
    return {
      ragSearches: 0,
      briefingGenerations: 0,
      briefingEdits: 0,
      chatAssistants: 0,
    };
  } catch (error) {
    logger.error('Failed to get AI usage stats', error);
    return {
      ragSearches: 0,
      briefingGenerations: 0,
      briefingEdits: 0,
      chatAssistants: 0,
    };
  }
}
