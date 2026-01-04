/**
 * AI Quotation Copilot
 * BRD 10 - AI Quotation Copilot
 * Generates draft quotations from natural language prompts
 */

import { chat } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';

export type QuotationRequest = {
  prompt: string; // e.g., "6 pax family, Pahawang 10-12 Des, Rp 2.5jt/pax budget"
  partnerId: string;
  branchId?: string | null;
};

export type QuotationSuggestion = {
  packageId: string;
  packageName: string;
  destination: string;
  tripDate: string;
  paxCount: number;
  pricePerPax: number;
  totalPrice: number;
  margin: number;
  matchScore: number; // 0-100
  reasoning: string;
};

export type DraftQuotation = {
  suggestions: QuotationSuggestion[];
  selectedPackage?: QuotationSuggestion;
  itinerary?: Array<{
    day: number;
    activities: Array<{
      time: string;
      activity: string;
      location?: string;
    }>;
  }>;
  pricingBreakdown: {
    subtotal: number;
    tax?: number;
    total: number;
    deposit?: number;
  };
  termsAndConditions: string[];
  notes?: string;
  refinementHistory?: Array<{
    prompt: string;
    changes: string[];
    timestamp: Date;
  }>;
  refinementExplanation?: string;
};

const SYSTEM_PROMPT = `You are an AI Quotation Copilot for Aero Travel Partner Portal.
Your job is to:
1. Parse natural language booking requests from travel agents
2. Match them with available packages
3. Calculate pricing (B2B NTA prices)
4. Generate draft quotations with itinerary, pricing breakdown, and T&C

Input format examples:
- "6 pax family, Pahawang 10-12 Des, Rp 2.5jt/pax budget"
- "10 orang, Pisang Island, 15-17 Januari, budget 3 juta per orang"
- "Family trip 4 adults 2 children, Pahawang, weekend, max 2.5jt/pax"

Output format (JSON):
{
  "paxCount": number,
  "tripDate": "YYYY-MM-DD",
  "budgetPerPax": number,
  "destination": string,
  "preferences": string[]
}

Be smart about:
- Date parsing (various formats)
- Budget interpretation (per pax or total)
- Family/group size (adults + children)
- Destination matching (Pahawang, Pisang, etc.)
- Weekend/weekday preferences

Always respond in valid JSON format.`;

/**
 * Parse natural language request into structured data
 */
async function parseQuotationRequest(prompt: string): Promise<{
  paxCount: number;
  tripDate: string;
  budgetPerPax: number;
  destination?: string;
  preferences: string[];
}> {
  try {
    const response = await chat(
      [{ role: 'user', content: `Parse this booking request into JSON: ${prompt}` }],
      SYSTEM_PROMPT,
      'gemini-1.5-flash'
    );

    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        paxCount: parsed.paxCount || 0,
        tripDate: parsed.tripDate || '',
        budgetPerPax: parsed.budgetPerPax || 0,
        destination: parsed.destination,
        preferences: parsed.preferences || [],
      };
    }

    // Fallback: basic parsing
    return {
      paxCount: 0,
      tripDate: '',
      budgetPerPax: 0,
      preferences: [],
    };
  } catch (error) {
    logger.error('Failed to parse quotation request', error, { prompt });
    throw error;
  }
}

/**
 * Find matching packages based on criteria
 */
async function findMatchingPackages(
  criteria: {
    paxCount: number;
    tripDate: string;
    budgetPerPax: number;
    destination?: string;
    branchId?: string | null;
  }
): Promise<QuotationSuggestion[]> {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    // Build query
    let query = client
      .from('package_prices')
      .select(`
        id,
        package_id,
        min_pax,
        max_pax,
        price_nta,
        price_publish,
        package:packages(
          id,
          name,
          destination,
          slug,
          duration_days,
          itinerary
        )
      `)
      .eq('is_active', true)
      .lte('min_pax', criteria.paxCount)
      .gte('max_pax', criteria.paxCount);

    // Filter by destination if provided
    if (criteria.destination) {
      query = query.ilike('package.destination', `%${criteria.destination}%`);
    }

    // Filter by branch if provided
    if (criteria.branchId) {
      query = query.eq('package.branch_id', criteria.branchId);
    }

    const { data: packages } = await query.limit(10);

    if (!packages || packages.length === 0) {
      return [];
    }

    // Calculate match scores and create suggestions
    const suggestions: QuotationSuggestion[] = packages.map((pkg: unknown) => {
      const p = pkg as {
        id: string;
        package_id: string;
        min_pax: number;
        max_pax: number;
        price_nta: number;
        price_publish: number;
        package: {
          id: string;
          name: string;
          destination: string;
          slug: string;
          duration_days: number;
        };
      };

      const pricePerPax = Number(p.price_nta || 0);
      const totalPrice = pricePerPax * criteria.paxCount;
      const margin = Number(p.price_publish || 0) - pricePerPax;

      // Calculate match score (0-100)
      let matchScore = 50; // Base score

      // Budget match (40% weight)
      if (criteria.budgetPerPax > 0) {
        const budgetDiff = Math.abs(pricePerPax - criteria.budgetPerPax) / criteria.budgetPerPax;
        if (budgetDiff <= 0.1) matchScore += 40; // Within 10%
        else if (budgetDiff <= 0.2) matchScore += 30; // Within 20%
        else if (budgetDiff <= 0.3) matchScore += 20; // Within 30%
        else matchScore += 10; // Over 30%
      }

      // Destination match (30% weight)
      if (criteria.destination && p.package.destination.toLowerCase().includes(criteria.destination.toLowerCase())) {
        matchScore += 30;
      }

      // Pax range match (20% weight)
      if (criteria.paxCount >= p.min_pax && criteria.paxCount <= p.max_pax) {
        matchScore += 20;
      }

      // Availability check (10% weight - simplified)
      matchScore += 10; // Assume available for now

      return {
        packageId: p.package_id,
        packageName: p.package.name,
        destination: p.package.destination,
        tripDate: criteria.tripDate,
        paxCount: criteria.paxCount,
        pricePerPax,
        totalPrice,
        margin,
        matchScore: Math.min(100, matchScore),
        reasoning: `Package ${p.package.name} matches your criteria. NTA price: Rp ${pricePerPax.toLocaleString('id-ID')}/pax.`,
      };
    });

    // Sort by match score
    return suggestions.sort((a, b) => b.matchScore - a.matchScore);
  } catch (error) {
    logger.error('Failed to find matching packages', error, { criteria });
    return [];
  }
}

/**
 * Generate draft quotation from natural language prompt
 */
export async function generateDraftQuotation(
  request: QuotationRequest
): Promise<DraftQuotation> {
  try {
    // Parse request
    const parsed = await parseQuotationRequest(request.prompt);

    // Find matching packages
    const suggestions = await findMatchingPackages({
      paxCount: parsed.paxCount,
      tripDate: parsed.tripDate,
      budgetPerPax: parsed.budgetPerPax,
      destination: parsed.destination,
      branchId: request.branchId,
    });

    if (suggestions.length === 0) {
      return {
        suggestions: [],
        pricingBreakdown: {
          subtotal: 0,
          total: 0,
        },
        termsAndConditions: [
          'Tidak ada paket yang sesuai dengan kriteria Anda.',
          'Silakan coba dengan kriteria yang berbeda atau hubungi customer service.',
        ],
      };
    }

    // Select best match
    const selectedPackage = suggestions[0];

    // Get package details for itinerary
    const supabase = await createClient();
    const client = supabase as unknown as any;

    const { data: packageData } = await client
      .from('packages')
      .select('id, name, itinerary, duration_days')
      .eq('id', selectedPackage.packageId)
      .single();

    // Build itinerary (simplified - can be enhanced)
    const itinerary: Array<{
      day: number;
      activities: Array<{ time: string; activity: string; location?: string }>;
    }> = [];

    if (packageData?.itinerary) {
      try {
        const itin = typeof packageData.itinerary === 'string'
          ? JSON.parse(packageData.itinerary)
          : packageData.itinerary;

        if (Array.isArray(itin)) {
          itin.forEach((item: unknown, idx: number) => {
            const i = item as { time?: string; activity?: string; location?: string };
            itinerary.push({
              day: idx + 1,
              activities: [{
                time: i.time || 'TBA',
                activity: i.activity || 'Activity',
                location: i.location,
              }],
            });
          });
        }
      } catch (error) {
        logger.warn('Failed to parse itinerary', { error, packageId: selectedPackage.packageId });
      }
    }

    // Calculate pricing breakdown
    const subtotal = selectedPackage.totalPrice;
    const tax = subtotal * 0.11; // 11% PPN (can be fetched from branch settings)
    const total = subtotal + tax;
    const deposit = total * 0.5; // 50% deposit

    // Generate T&C
    const termsAndConditions = [
      'Harga sudah termasuk PPN 11% (jika applicable).',
      'Deposit minimal 50% untuk konfirmasi booking.',
      'Pembayaran sisa dilakukan maksimal H-7 sebelum trip.',
      'Pembatalan mengikuti kebijakan refund yang berlaku.',
      'Harga dapat berubah tanpa pemberitahuan sebelumnya.',
      'Konfirmasi ketersediaan untuk tanggal yang diminta.',
    ];

    return {
      suggestions,
      selectedPackage,
      itinerary,
      pricingBreakdown: {
        subtotal,
        tax,
        total,
        deposit,
      },
      termsAndConditions,
      notes: `Draft quotation untuk ${selectedPackage.packageName} pada ${parsed.tripDate} untuk ${parsed.paxCount} pax.`,
    };
  } catch (error) {
    logger.error('Failed to generate draft quotation', error, { request });
    throw error;
  }
}

