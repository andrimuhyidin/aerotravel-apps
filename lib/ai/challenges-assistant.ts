/**
 * AI Challenges Assistant
 * Provides AI-powered insights for challenges: tips, strategies, progress analysis
 */

import { generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type Challenge = {
  id: string;
  challenge_type: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'completed' | 'failed';
  reward_amount: number | null;
};

export type ChallengeInsights = {
  tips: string[];
  strategies: string[];
  progressAnalysis: string;
  estimatedCompletion: string | null;
  recommendations: string[];
};

/**
 * Get AI insights for challenges
 */
export async function getChallengeInsights(
  challenges: Challenge[],
  guideStats?: {
    totalTrips?: number;
    averageRating?: number;
    totalRatings?: number;
    totalEarnings?: number;
  }
): Promise<ChallengeInsights> {
  try {
    const activeChallenges = challenges.filter((c) => c.status === 'active');
    
    if (activeChallenges.length === 0) {
      return {
        tips: [],
        strategies: [],
        progressAnalysis: 'Tidak ada challenge aktif saat ini.',
        estimatedCompletion: null,
        recommendations: [],
      };
    }

    const challengeList = activeChallenges
      .map(
        (c) =>
          `- ${c.challenge_type}: ${c.current_value}/${c.target_value} (${Math.round((c.current_value / c.target_value) * 100)}% selesai)${c.end_date ? ` - Deadline: ${c.end_date}` : ''}`
      )
      .join('\n');

    const statsContext = guideStats
      ? `\nGuide Stats:
- Total Trips: ${guideStats.totalTrips || 0}
- Average Rating: ${guideStats.averageRating?.toFixed(1) || '0.0'}
- Total Ratings: ${guideStats.totalRatings || 0}
- Total Earnings: Rp ${guideStats.totalEarnings?.toLocaleString('id-ID') || '0'}`
      : '';

    const prompt = `You are an AI assistant helping a tour guide achieve their challenges. Analyze these challenges and provide actionable insights:

Active Challenges:
${challengeList}${statsContext}

Provide insights in JSON format:
{
  "tips": ["practical tip 1", "practical tip 2", "practical tip 3"],
  "strategies": ["strategy 1", "strategy 2"],
  "progressAnalysis": "analysis of current progress and what needs to be done",
  "estimatedCompletion": "estimated time to complete (e.g., '2 weeks', '1 month', null if unclear)",
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Focus on:
- Practical, actionable advice
- Realistic strategies based on current progress
- Time management tips
- Ways to accelerate progress
- Risk mitigation for challenges that might fail

Return ONLY the JSON object, no additional text.`;

    const response = await generateContent(prompt, undefined, 'gemini-1.5-flash');

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(cleaned) as ChallengeInsights;

      return {
        tips: Array.isArray(result.tips) ? result.tips : [],
        strategies: Array.isArray(result.strategies) ? result.strategies : [],
        progressAnalysis: result.progressAnalysis || 'Tidak ada analisis tersedia.',
        estimatedCompletion: result.estimatedCompletion || null,
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      };
    } catch {
      // Fallback
      return {
        tips: [
          'Fokus pada challenge dengan deadline terdekat',
          'Prioritaskan challenge dengan reward tertinggi',
          'Lacak progress harian untuk tetap termotivasi',
        ],
        strategies: [
          'Buat rencana harian untuk mencapai target',
          'Gunakan reminder untuk tidak melewatkan aktivitas penting',
        ],
        progressAnalysis: 'Analisis progress sedang diproses. Tetap fokus pada target yang telah ditetapkan.',
        estimatedCompletion: null,
        recommendations: [
          'Periksa progress secara berkala',
          'Jangan menunda tugas yang bisa dilakukan sekarang',
        ],
      };
    }
  } catch (error) {
    logger.error('Failed to get challenge insights', error);
    return {
      tips: [],
      strategies: [],
      progressAnalysis: 'Gagal memuat analisis AI.',
      estimatedCompletion: null,
      recommendations: [],
    };
  }
}
