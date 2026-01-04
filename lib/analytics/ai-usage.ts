/**
 * AI Features Usage Analytics
 * Track usage metrics untuk AI features
 */

import 'server-only';

import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type AiFeatureType =
  | 'rag_search'
  | 'briefing_generation'
  | 'briefing_edit'
  | 'chat_assistant'
  | 'vision_sentiment'
  | 'quotation_copilot'
  | 'inbox_parser'
  | 'sales_insights';

export type AiUsageEvent = {
  feature: AiFeatureType;
  userId: string;
  branchId?: string;
  tripId?: string;
  tokensUsed?: number;
  latencyMs?: number;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Track AI feature usage
 */
export async function trackAiUsage(event: AiUsageEvent): Promise<void> {
  try {
    const supabase = await createAdminClient();

    // Insert into analytics table
    const { error } = await supabase.from('ai_usage_analytics').insert({
      feature: event.feature,
      user_id: event.userId,
      branch_id: event.branchId || null,
      trip_id: event.tripId || null,
      tokens_used: event.tokensUsed || 0,
      latency_ms: event.latencyMs || null,
      success: event.success ?? true,
      error_message: event.errorMessage || null,
      metadata: event.metadata || {},
    });

    if (error) {
      // Log but don't throw - analytics should not break main flow
      logger.error('Failed to insert AI usage analytics', error, {
        feature: event.feature,
        userId: event.userId,
      });
      return;
    }

    logger.debug('AI feature usage tracked', {
      feature: event.feature,
      userId: event.userId,
      tripId: event.tripId,
    });
  } catch (error) {
    logger.error('Failed to track AI usage', error);
    // Don't throw - analytics should not break main flow
  }
}

/**
 * Track AI usage with timing
 * Automatically measures latency
 */
export async function trackAiUsageWithTiming<T>(
  event: Omit<AiUsageEvent, 'latencyMs' | 'success' | 'errorMessage'>,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const latencyMs = Date.now() - startTime;
    
    await trackAiUsage({
      ...event,
      latencyMs,
      success: true,
    });
    
    return result;
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    
    await trackAiUsage({
      ...event,
      latencyMs,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    
    throw error;
  }
}

export type AiUsageSummary = {
  feature: string;
  totalCount: number;
  successCount: number;
  errorCount: number;
  avgLatencyMs: number;
  totalTokens: number;
};

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
  visionSentiments: number;
  quotationCopilots: number;
  inboxParsers: number;
  salesInsights: number;
}> {
  try {
    const supabase = await createAdminClient();
    const client = supabase as any;
    
    const start = startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate?.toISOString() || new Date().toISOString();
    
    // Query from analytics table using the RPC function
    const { data, error } = await client.rpc('get_ai_usage_summary', {
      p_start_date: start,
      p_end_date: end,
    });
    
    if (error) {
      logger.error('Failed to get AI usage stats from RPC', error);
      // Fallback to direct query
      return await getAiUsageStatsFallback(supabase, start, end);
    }
    
    // Convert RPC result to expected format
    const summary = (data || []) as AiUsageSummary[];
    const featureCounts: Record<string, number> = {};
    
    for (const item of summary) {
      featureCounts[item.feature] = item.totalCount;
    }
    
    return {
      ragSearches: featureCounts['rag_search'] || 0,
      briefingGenerations: featureCounts['briefing_generation'] || 0,
      briefingEdits: featureCounts['briefing_edit'] || 0,
      chatAssistants: featureCounts['chat_assistant'] || 0,
      visionSentiments: featureCounts['vision_sentiment'] || 0,
      quotationCopilots: featureCounts['quotation_copilot'] || 0,
      inboxParsers: featureCounts['inbox_parser'] || 0,
      salesInsights: featureCounts['sales_insights'] || 0,
    };
  } catch (error) {
    logger.error('Failed to get AI usage stats', error);
    return {
      ragSearches: 0,
      briefingGenerations: 0,
      briefingEdits: 0,
      chatAssistants: 0,
      visionSentiments: 0,
      quotationCopilots: 0,
      inboxParsers: 0,
      salesInsights: 0,
    };
  }
}

/**
 * Fallback query if RPC is not available
 */
async function getAiUsageStatsFallback(
  supabase: any,
  startDate: string,
  endDate: string
): Promise<{
  ragSearches: number;
  briefingGenerations: number;
  briefingEdits: number;
  chatAssistants: number;
  visionSentiments: number;
  quotationCopilots: number;
  inboxParsers: number;
  salesInsights: number;
}> {
  const features: AiFeatureType[] = [
    'rag_search',
    'briefing_generation',
    'briefing_edit',
    'chat_assistant',
    'vision_sentiment',
    'quotation_copilot',
    'inbox_parser',
    'sales_insights',
  ];
  
  const counts: Record<string, number> = {};
  
  for (const feature of features) {
    const { count, error } = await supabase
      .from('ai_usage_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('feature', feature)
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    if (!error) {
      counts[feature] = count || 0;
    }
  }
  
  return {
    ragSearches: counts['rag_search'] || 0,
    briefingGenerations: counts['briefing_generation'] || 0,
    briefingEdits: counts['briefing_edit'] || 0,
    chatAssistants: counts['chat_assistant'] || 0,
    visionSentiments: counts['vision_sentiment'] || 0,
    quotationCopilots: counts['quotation_copilot'] || 0,
    inboxParsers: counts['inbox_parser'] || 0,
    salesInsights: counts['sales_insights'] || 0,
  };
}

/**
 * Get detailed AI usage summary
 */
export async function getAiUsageSummary(
  startDate?: Date,
  endDate?: Date
): Promise<AiUsageSummary[]> {
  try {
    const supabase = await createAdminClient();
    const client = supabase as any;
    
    const start = startDate?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = endDate?.toISOString() || new Date().toISOString();
    
    const { data, error } = await client.rpc('get_ai_usage_summary', {
      p_start_date: start,
      p_end_date: end,
    });
    
    if (error) {
      logger.error('Failed to get AI usage summary', error);
      return [];
    }
    
    return (data || []).map((item: any) => ({
      feature: item.feature,
      totalCount: Number(item.total_count) || 0,
      successCount: Number(item.success_count) || 0,
      errorCount: Number(item.error_count) || 0,
      avgLatencyMs: Number(item.avg_latency_ms) || 0,
      totalTokens: Number(item.total_tokens) || 0,
    }));
  } catch (error) {
    logger.error('Failed to get AI usage summary', error);
    return [];
  }
}
