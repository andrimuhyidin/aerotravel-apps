/**
 * AI Quotation Refinement Engine
 * BRD 10 - AI Quotation Refinement
 * Iterative refinement untuk quotations
 */

import { chat } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';
import type { DraftQuotation } from './quotation-copilot';

export type RefinementRequest = {
  originalQuotation: DraftQuotation;
  refinementPrompt: string; // e.g., "make it cheaper", "add snorkeling"
  conversationHistory?: Array<{
    type: 'refinement' | 'response';
    content: string;
  }>;
};

export type RefinedQuotation = DraftQuotation & {
  refinementHistory: Array<{
    prompt: string;
    changes: string[];
    timestamp: Date;
  }>;
};

const SYSTEM_PROMPT = `You are an AI Quotation Refinement Assistant for Aero Travel Partner Portal.
Your job is to refine travel quotations based on agent requests.

You receive:
1. Original quotation (package, pricing, itinerary)
2. Refinement request (e.g., "make it cheaper", "add snorkeling", "remove day 2")

Your task:
1. Understand the refinement request
2. Identify what needs to change
3. Suggest updated quotation with changes
4. Explain what changed and why

Guidelines:
- For "make it cheaper": Suggest lower-tier packages or reduce activities
- For "add [activity]": Check if activity is available, add to itinerary
- For "remove [item]": Remove from itinerary, adjust pricing if needed
- Always maintain valid package structure
- Keep pricing realistic (don't make impossible discounts)
- Explain changes clearly

Output format (JSON):
{
  "changes": ["Change 1", "Change 2"],
  "updatedQuotation": { ... },
  "explanation": "Why these changes were made"
}

Always respond in Indonesian (Bahasa Indonesia) unless asked otherwise.`;

/**
 * Refine quotation berdasarkan request
 */
export async function refineQuotation(
  request: RefinementRequest
): Promise<RefinedQuotation> {
  try {
    // Build context dari original quotation
    const originalContext = buildQuotationContext(request.originalQuotation);

    // Build conversation history jika ada
    let historyContext = '';
    if (request.conversationHistory && request.conversationHistory.length > 0) {
      historyContext = '\n\nCONVERSATION HISTORY:\n';
      request.conversationHistory.forEach((msg, idx) => {
        historyContext += `${idx + 1}. ${msg.type === 'refinement' ? 'Agent' : 'AI'}: ${msg.content}\n`;
      });
    }

    // Build prompt
    const prompt = `${originalContext}${historyContext}

REFINEMENT REQUEST: ${request.refinementPrompt}

Please refine the quotation based on the request above. Provide:
1. List of changes made
2. Updated quotation data
3. Explanation of changes

Return as JSON format.`;

    // Call Gemini AI
    const response = await chat(
      [{ role: 'user', content: prompt }],
      SYSTEM_PROMPT,
      'gemini-1.5-flash'
    );

    // Parse response (try to extract JSON)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const changes = parsed.changes || [];
        const updatedQuotation = parsed.updatedQuotation || request.originalQuotation;
        const explanation = parsed.explanation || 'Quotation telah direfinement.';

        // Build refinement history
        const refinementHistory = [
          ...(request.originalQuotation.refinementHistory || []),
          {
            prompt: request.refinementPrompt,
            changes,
            timestamp: new Date(),
          },
        ];

        logger.info('Quotation refined', {
          refinementPrompt: request.refinementPrompt,
          changesCount: changes.length,
        });

        return {
          ...updatedQuotation,
          refinementHistory,
          refinementExplanation: explanation,
        } as RefinedQuotation;
      } catch (parseError) {
        logger.warn('Failed to parse refinement response as JSON', {
          error: parseError,
          response,
        });
      }
    }

    // Fallback: return original dengan explanation
    return {
      ...request.originalQuotation,
      refinementHistory: [
        ...(request.originalQuotation.refinementHistory || []),
        {
          prompt: request.refinementPrompt,
          changes: ['Refinement sedang diproses'],
          timestamp: new Date(),
        },
      ],
      refinementExplanation: response || 'Quotation telah direfinement.',
    } as RefinedQuotation;
  } catch (error) {
    logger.error('Failed to refine quotation', error, {
      refinementPrompt: request.refinementPrompt,
    });
    throw error;
  }
}

/**
 * Build context string dari quotation
 */
function buildQuotationContext(quotation: DraftQuotation): string {
  let context = 'ORIGINAL QUOTATION:\n\n';

  if (quotation.selectedPackage) {
    const pkg = quotation.selectedPackage;
    context += `Package: ${pkg.packageName}\n`;
    context += `Destination: ${pkg.destination}\n`;
    context += `Trip Date: ${pkg.tripDate}\n`;
    context += `Pax Count: ${pkg.paxCount}\n`;
    context += `Price per Pax: Rp ${pkg.pricePerPax.toLocaleString('id-ID')}\n`;
    context += `Total Price: Rp ${pkg.totalPrice.toLocaleString('id-ID')}\n`;
    context += `Margin: Rp ${pkg.margin.toLocaleString('id-ID')}\n`;
  }

  if (quotation.pricingBreakdown) {
    context += `\nPricing Breakdown:\n`;
    context += `  Subtotal: Rp ${quotation.pricingBreakdown.subtotal.toLocaleString('id-ID')}\n`;
    if (quotation.pricingBreakdown.tax) {
      context += `  Tax: Rp ${quotation.pricingBreakdown.tax.toLocaleString('id-ID')}\n`;
    }
    context += `  Total: Rp ${quotation.pricingBreakdown.total.toLocaleString('id-ID')}\n`;
    if (quotation.pricingBreakdown.deposit) {
      context += `  Deposit: Rp ${quotation.pricingBreakdown.deposit.toLocaleString('id-ID')}\n`;
    }
  }

  if (quotation.itinerary && quotation.itinerary.length > 0) {
    context += `\nItinerary:\n`;
    quotation.itinerary.forEach((day) => {
      context += `  Day ${day.day}:\n`;
      day.activities.forEach((activity) => {
        context += `    ${activity.time}: ${activity.activity}\n`;
        if (activity.location) {
          context += `      Location: ${activity.location}\n`;
        }
      });
    });
  }

  if (quotation.termsAndConditions && quotation.termsAndConditions.length > 0) {
    context += `\nTerms & Conditions:\n`;
    quotation.termsAndConditions.forEach((term, idx) => {
      context += `  ${idx + 1}. ${term}\n`;
    });
  }

  return context;
}

/**
 * Detect refinement type untuk better handling
 */
export function detectRefinementType(prompt: string): {
  type: 'price' | 'activities' | 'itinerary' | 'terms' | 'general';
  keywords: string[];
} {
  const lowerPrompt = prompt.toLowerCase();

  if (/(cheaper|murah|kurang|discount|diskon|harga)/i.test(lowerPrompt)) {
    return { type: 'price', keywords: ['cheaper', 'price', 'discount'] };
  }

  if (/(add|tambah|include|snorkel|dive|activity|aktivitas)/i.test(lowerPrompt)) {
    return { type: 'activities', keywords: ['add', 'include', 'activity'] };
  }

  if (/(remove|hapus|kurangi|itinerary|jadwal|day|hari)/i.test(lowerPrompt)) {
    return { type: 'itinerary', keywords: ['remove', 'itinerary', 'day'] };
  }

  if (/(term|syarat|condition|kebijakan|policy)/i.test(lowerPrompt)) {
    return { type: 'terms', keywords: ['terms', 'conditions', 'policy'] };
  }

  return { type: 'general', keywords: [] };
}

