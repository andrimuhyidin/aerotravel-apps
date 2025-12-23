/**
 * AI Incident Report Assistant
 * Auto-generate report dari foto + voice, extract key info
 */

import { analyzeImage, generateContent } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type IncidentReport = {
  summary: string;
  what: string; // What happened
  when: string; // When it happened
  where: string; // Where it happened
  who: string[]; // Who was involved
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'safety' | 'equipment' | 'customer' | 'weather' | 'other';
  immediateActions: string[];
  followUpActions: string[];
  recommendations: string[];
};

/**
 * Generate incident report from text description
 */
export async function generateIncidentReport(
  description: string,
  images?: Array<{ base64: string; mimeType: string }>
): Promise<IncidentReport> {
  try {
    let imageAnalysis = '';
    if (images && images.length > 0) {
      // Analyze first image
      try {
        const analysis = await analyzeImage(
          images[0]!.base64,
          images[0]!.mimeType as
            | 'image/png'
            | 'image/jpeg'
            | 'image/webp'
            | 'image/gif',
          'Describe what you see in this image. Focus on any incidents, damage, or safety concerns.'
        );
        imageAnalysis = `\nImage Analysis: ${analysis}`;
      } catch {
        // Image analysis failed, continue without it
      }
    }

    const prompt = `Generate a structured incident report from this description:

Description: "${description}"
${imageAnalysis}

Extract and organize information into JSON format:
{
  "summary": "brief summary (2-3 sentences)",
  "what": "what happened",
  "when": "when it happened (if mentioned)",
  "where": "where it happened (if mentioned)",
  "who": ["person 1", "person 2"] (who was involved),
  "severity": "low" | "medium" | "high" | "critical",
  "category": "safety" | "equipment" | "customer" | "weather" | "other",
  "immediateActions": ["action 1", "action 2"],
  "followUpActions": ["action 1", "action 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Return ONLY the JSON object, no additional text.`;

    const response = await generateContent(
      prompt,
      undefined,
      'gemini-1.5-flash'
    );

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const report = JSON.parse(cleaned) as IncidentReport;

      // Validate and enhance
      if (!report.when) {
        report.when = new Date().toISOString();
      }
      if (!report.where) {
        report.where = 'Location not specified';
      }

      return report;
    } catch {
      return getFallbackReport(description);
    }
  } catch (error) {
    logger.error('Failed to generate incident report', error);
    return getFallbackReport(description);
  }
}

/**
 * Extract key information from voice note (transcribed text)
 */
export async function extractIncidentInfoFromVoice(
  transcribedText: string
): Promise<{
  keyPoints: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresImmediateAction: boolean;
}> {
  try {
    const prompt = `Extract key information from this voice transcription:

"${transcribedText}"

Extract:
1. Key points (what happened)
2. Severity level
3. Whether immediate action is required

Return JSON:
{
  "keyPoints": ["point 1", "point 2"],
  "severity": "low" | "medium" | "high" | "critical",
  "requiresImmediateAction": true/false
}

Return ONLY the JSON object, no additional text.`;

    const response = await generateContent(
      prompt,
      undefined,
      'gemini-1.5-flash'
    );

    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        keyPoints: [transcribedText],
        severity: 'medium' as const,
        requiresImmediateAction: false,
      };
    }
  } catch (error) {
    logger.error('Failed to extract incident info from voice', error);
    return {
      keyPoints: [transcribedText],
      severity: 'medium' as const,
      requiresImmediateAction: false,
    };
  }
}

function getFallbackReport(description: string): IncidentReport {
  const text = description.toLowerCase();
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let category: IncidentReport['category'] = 'other';

  // Simple keyword detection
  if (
    text.includes('safety') ||
    text.includes('keselamatan') ||
    text.includes('accident')
  ) {
    severity = 'high';
    category = 'safety';
  } else if (
    text.includes('equipment') ||
    text.includes('alat') ||
    text.includes('broken')
  ) {
    category = 'equipment';
  } else if (
    text.includes('customer') ||
    text.includes('tamu') ||
    text.includes('guest')
  ) {
    category = 'customer';
  } else if (text.includes('weather') || text.includes('cuaca')) {
    category = 'weather';
  }

  return {
    summary:
      description.length > 150
        ? `${description.substring(0, 150)}...`
        : description,
    what: description,
    when: new Date().toISOString(),
    where: 'Location not specified',
    who: [],
    severity,
    category,
    immediateActions: [],
    followUpActions: ['Document incident details', 'Report to operations'],
    recommendations: [],
  };
}
