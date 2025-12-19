/**
 * API: Guide Trip Expenses
 * POST /api/guide/expenses
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { generateContent } from '@/lib/gemini';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const expenseSchema = z.object({
  tripId: z.string().min(1),
  category: z.enum(['tiket', 'makan', 'transport', 'medis', 'lainnya']),
  description: z.string().optional(),
  amount: z.number().positive(),
  receiptUrl: z.string().url().optional(),
});

const expenseCategoryMap: Record<
  string,
  'fuel' | 'food' | 'ticket' | 'transport' | 'equipment' | 'emergency' | 'other'
> = {
  tiket: 'ticket',
  makan: 'food',
  transport: 'transport',
  medis: 'emergency',
  lainnya: 'other',
};

/**
 * Smart categorization using AI
 */
async function categorizeExpenseWithAI(
  description: string,
  amount: number
): Promise<'fuel' | 'food' | 'ticket' | 'transport' | 'equipment' | 'emergency' | 'other'> {
  try {
    const prompt = `Categorize this expense based on description and amount:
Description: "${description}"
Amount: Rp ${amount.toLocaleString('id-ID')}

Categories: fuel, food, ticket, transport, equipment, emergency, other

Return ONLY the category name (lowercase, one word).`;

    const result = await generateContent(prompt);
    const category = result.trim().toLowerCase() as typeof expenseCategoryMap[string];
    
    // Validate category
    if (Object.values(expenseCategoryMap).includes(category)) {
      return category;
    }
    
    // Fallback based on keywords
    const descLower = description.toLowerCase();
    if (descLower.includes('bensin') || descLower.includes('fuel') || descLower.includes('solar')) {
      return 'fuel';
    }
    if (descLower.includes('makan') || descLower.includes('food') || descLower.includes('restoran')) {
      return 'food';
    }
    if (descLower.includes('tiket') || descLower.includes('ticket') || descLower.includes('entrance')) {
      return 'ticket';
    }
    if (descLower.includes('ojek') || descLower.includes('grab') || descLower.includes('gojek') || descLower.includes('transport')) {
      return 'transport';
    }
    
    return 'other';
  } catch (error) {
    logger.error('AI categorization failed', error);
    return 'other';
  }
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const payload = expenseSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tripId, category, description, amount, receiptUrl } = payload;

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const now = new Date().toISOString();

  // Smart categorization: use AI if category is 'lainnya' or not provided
  let dbCategory: 'fuel' | 'food' | 'ticket' | 'transport' | 'equipment' | 'emergency' | 'other';
  
  if (category === 'lainnya' && description) {
    // Use AI to categorize
    dbCategory = await categorizeExpenseWithAI(description, amount);
  } else {
    dbCategory = expenseCategoryMap[category] ?? 'other';
  }

  const { error } = await withBranchFilter(
    client.from('trip_expenses'),
    branchContext,
  ).insert({
    trip_id: tripId,
    vendor_id: null,
    category: dbCategory,
    description: description ?? '',
    quantity: 1,
    unit_price: amount,
    total_amount: amount,
    receipt_url: receiptUrl ?? null,
    created_by: user.id,
    created_at: now,
  } as never);

  if (error) {
    logger.error('Failed to create trip expense', error, { tripId });
    return NextResponse.json({ error: 'Failed to save expense' }, { status: 500 });
  }

  logger.info('Guide expense saved', { tripId, guideId: user.id, amount });

  return NextResponse.json({ success: true });
});
