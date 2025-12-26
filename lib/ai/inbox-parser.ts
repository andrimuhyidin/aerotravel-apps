/**
 * AI Inbox Parser
 * Parse booking inquiries from natural language (email/WA messages)
 */

import { chat } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type ParsedBookingInquiry = {
  packageName?: string;
  destination?: string;
  dateRange?: {
    start: string; // YYYY-MM-DD
    end?: string; // YYYY-MM-DD
  };
  paxCount?: {
    adults: number;
    children?: number;
    infants?: number;
  };
  budgetRange?: {
    min?: number;
    max?: number;
    perPax?: boolean;
  };
  specialRequests?: string[];
  confidence: number; // 0-100
  rawText: string;
};

const SYSTEM_PROMPT = `You are an AI assistant that extracts booking information from natural language messages (email/WhatsApp).

Your task is to parse customer inquiries and extract structured booking data.

Input: Natural language message from customer
Output: JSON object with extracted booking information

Extract the following information:
1. Package/Destination name (if mentioned)
2. Date range (start date, end date if mentioned)
3. Number of participants (adults, children, infants)
4. Budget range (if mentioned)
5. Special requests or preferences

Date formats to handle:
- "10-12 Desember" → start: "2024-12-10", end: "2024-12-12"
- "15 Januari" → start: "2024-01-15"
- "weekend ini" → calculate next weekend
- "bulan depan" → calculate next month

Pax count formats:
- "10 orang" → adults: 10
- "6 pax" → adults: 6
- "4 dewasa 2 anak" → adults: 4, children: 2
- "family trip 4 adults 2 children" → adults: 4, children: 2

Budget formats:
- "Rp 2.5jt/pax" → max: 2500000, perPax: true
- "budget 3 juta per orang" → max: 3000000, perPax: true
- "max 5 juta total" → max: 5000000, perPax: false

Return JSON in this format:
{
  "packageName": "string or null",
  "destination": "string or null",
  "dateRange": {
    "start": "YYYY-MM-DD or null",
    "end": "YYYY-MM-DD or null"
  },
  "paxCount": {
    "adults": number,
    "children": number or null,
    "infants": number or null
  },
  "budgetRange": {
    "min": number or null,
    "max": number or null,
    "perPax": boolean or null
  },
  "specialRequests": ["string array"],
  "confidence": number (0-100)
}

Be smart about:
- Indonesian date formats
- Budget interpretation (per pax vs total)
- Family/group size parsing
- Destination matching (Pahawang, Pisang, Labuan Bajo, etc.)

Always respond with valid JSON only, no additional text.`;

/**
 * Parse booking inquiry from natural language message
 */
export async function parseBookingInquiry(
  messageText: string
): Promise<ParsedBookingInquiry> {
  try {
    const response = await chat(
      [
        {
          role: 'user',
          content: `Parse this booking inquiry message:\n\n${messageText}`,
        },
      ],
      SYSTEM_PROMPT,
      'gemini-1.5-flash'
    );

    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and normalize
        const result: ParsedBookingInquiry = {
          packageName: parsed.packageName || undefined,
          destination: parsed.destination || undefined,
          dateRange: parsed.dateRange?.start
            ? {
                start: parsed.dateRange.start,
                end: parsed.dateRange.end || undefined,
              }
            : undefined,
          paxCount: parsed.paxCount?.adults
            ? {
                adults: parsed.paxCount.adults || 0,
                children: parsed.paxCount.children || undefined,
                infants: parsed.paxCount.infants || undefined,
              }
            : undefined,
          budgetRange: parsed.budgetRange
            ? {
                min: parsed.budgetRange.min || undefined,
                max: parsed.budgetRange.max || undefined,
                perPax: parsed.budgetRange.perPax || undefined,
              }
            : undefined,
          specialRequests: Array.isArray(parsed.specialRequests)
            ? parsed.specialRequests
            : undefined,
          confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
          rawText: messageText,
        };

        logger.info('Booking inquiry parsed', {
          messageLength: messageText.length,
          confidence: result.confidence,
          hasDestination: !!result.destination,
          hasDateRange: !!result.dateRange,
          hasPaxCount: !!result.paxCount,
        });

        return result;
      } catch (parseError) {
        logger.error('Failed to parse JSON from AI response', parseError, {
          response,
        });
        throw new Error('Failed to parse AI response');
      }
    }

    // Fallback: return basic structure
    logger.warn('No JSON found in AI response', { response });
    return {
      confidence: 0,
      rawText: messageText,
    };
  } catch (error) {
    logger.error('Failed to parse booking inquiry', error, {
      messageLength: messageText.length,
    });
    throw error;
  }
}

/**
 * Calculate confidence score based on extracted data
 */
export function calculateConfidence(parsed: ParsedBookingInquiry): number {
  let score = 0;

  if (parsed.destination || parsed.packageName) score += 30;
  if (parsed.dateRange?.start) score += 30;
  if (parsed.paxCount?.adults) score += 20;
  if (parsed.budgetRange) score += 10;
  if (parsed.specialRequests && parsed.specialRequests.length > 0) score += 10;

  return Math.min(100, score);
}

