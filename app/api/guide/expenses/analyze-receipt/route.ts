/**
 * API: Analyze Receipt for Expense
 * POST /api/guide/expenses/analyze-receipt
 * 
 * OCR receipt + auto-categorize + duplicate detection
 */

import { NextRequest, NextResponse } from 'next/server';

import { analyzeReceipt, categorizeExpense, detectDuplicateExpense } from '@/lib/ai/expense-analyzer';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tripId = formData.get('tripId') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');

    // Determine mime type
    const mimeType = file.type as 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(mimeType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }

    // Analyze receipt
    const receiptData = await analyzeReceipt(base64Image, mimeType);

    // Auto-categorize
    const category = await categorizeExpense(
      receiptData.merchant,
      receiptData.merchant,
      receiptData.amount
    );

    // Check for duplicates (if tripId provided)
    let duplicateCheck;
    if (tripId) {
      const client = supabase as unknown as any;
      const { data: existingExpenses } = await client
        .from('guide_expenses')
        .select('amount, created_at, description, category')
        .eq('trip_id', tripId)
        .eq('guide_id', user.id);

      if (existingExpenses && existingExpenses.length > 0) {
        duplicateCheck = await detectDuplicateExpense(
          {
            amount: receiptData.amount,
            date: receiptData.date,
            merchant: receiptData.merchant,
            description: receiptData.merchant,
          },
          existingExpenses.map((e: any) => ({
            amount: Number(e.amount || 0),
            date: e.created_at?.split('T')[0] || '',
            merchant: e.description || '',
            description: e.description || '',
          }))
        );
      }
    }

    logger.info('Receipt analyzed', {
      guideId: user.id,
      tripId,
      amount: receiptData.amount,
      category,
      isDuplicate: duplicateCheck?.isDuplicate || false,
    });

    return NextResponse.json({
      receipt: {
        amount: receiptData.amount,
        date: receiptData.date,
        merchant: receiptData.merchant,
        category,
        confidence: receiptData.confidence,
        extractedData: receiptData.extractedData,
      },
      duplicate: duplicateCheck || { isDuplicate: false, confidence: 0 },
    });
  } catch (error) {
    logger.error('Failed to analyze receipt', error);
    return NextResponse.json(
      { error: 'Gagal menganalisis struk' },
      { status: 500 }
    );
  }
});
