/**
 * AI Expense Analyzer
 * OCR receipt + auto-categorize + duplicate detection
 */

import { analyzeImage, ocrPaymentReceipt } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type ExpenseReceiptData = {
  amount: number;
  date: string;
  merchant: string;
  category?: string;
  confidence: number;
  extractedData?: {
    bankSender?: string;
    bankReceiver?: string;
    accountNumber?: string;
    accountName?: string;
    referenceNumber?: string;
  };
};

export type ExpenseCategory =
  | 'fuel'
  | 'food'
  | 'ticket'
  | 'transport'
  | 'equipment'
  | 'emergency'
  | 'other';

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  fuel: ['bensin', 'solar', 'pertalite', 'pertamax', 'spbu', 'fuel', 'bbm', 'gasoline'],
  food: ['makan', 'minum', 'restoran', 'warung', 'cafe', 'food', 'snack', 'nasi', 'ayam'],
  ticket: ['tiket', 'entrance', 'masuk', 'parkir', 'parking', 'ticket', 'entri'],
  transport: ['ojek', 'taxi', 'angkot', 'transport', 'ongkos', 'biaya perjalanan'],
  equipment: ['alat', 'peralatan', 'equipment', 'tool', 'safety', 'life jacket'],
  emergency: ['medis', 'obat', 'p3k', 'emergency', 'darurat', 'medical', 'klinik'],
  other: [],
};

/**
 * Analyze receipt image and extract data
 */
export async function analyzeReceipt(
  imageBase64: string,
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
): Promise<ExpenseReceiptData> {
  try {
    // First, try OCR for payment receipt
    const ocrResult = await ocrPaymentReceipt(imageBase64, mimeType);

    if (ocrResult && !('error' in ocrResult) && ocrResult.amount) {
      // Successfully extracted payment receipt data
      return {
        amount: ocrResult.amount,
        date: ocrResult.date || new Date().toISOString().split('T')[0],
        merchant: ocrResult.bank_receiver || ocrResult.bank_sender || 'Unknown',
        confidence: ocrResult.confidence || 0.8,
        extractedData: {
          bankSender: ocrResult.bank_sender || undefined,
          bankReceiver: ocrResult.bank_receiver || undefined,
          accountNumber: ocrResult.account_number || undefined,
          accountName: ocrResult.account_name || undefined,
          referenceNumber: ocrResult.reference_number || undefined,
        },
      };
    }

    // Fallback: General image analysis
    const prompt = `Analyze this receipt/image and extract the following information in JSON format:
{
  "amount": number (total amount in IDR, without dots/commas),
  "date": "YYYY-MM-DD" (if visible),
  "merchant": "merchant name or description",
  "confidence": 0-100
}

If any field cannot be extracted, set it to null.
Return ONLY the JSON object, no additional text.`;

    const analysisResult = await analyzeImage(imageBase64, mimeType, prompt);

    try {
      const cleaned = analysisResult.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned) as {
        amount?: number;
        date?: string;
        merchant?: string;
        confidence?: number;
      };

      return {
        amount: parsed.amount || 0,
        date: parsed.date || new Date().toISOString().split('T')[0] || '',
        merchant: parsed.merchant || 'Unknown',
        confidence: parsed.confidence || 0.5,
      };
    } catch {
      // If JSON parse fails, return default
      return {
        amount: 0,
        date: new Date().toISOString().split('T')[0] || '',
        merchant: 'Unknown',
        confidence: 0.3,
      };
    }
  } catch (error) {
    logger.error('Failed to analyze receipt', error);
    throw new Error('Gagal menganalisis struk');
  }
}

/**
 * Auto-categorize expense based on description and merchant
 */
export async function categorizeExpense(
  description: string,
  merchant: string,
  amount: number
): Promise<ExpenseCategory> {
  try {
    // Combine description and merchant for analysis
    const text = `${description} ${merchant}`.toLowerCase();

    // Check keyword matches first (fast path)
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category as ExpenseCategory;
      }
    }

    // Use AI for better categorization
    const prompt = `Categorize this expense based on description and merchant:
- Description: ${description}
- Merchant: ${merchant}
- Amount: Rp ${amount.toLocaleString('id-ID')}

Categories: fuel, food, ticket, transport, equipment, emergency, other

Return ONLY the category name (one word), no additional text.`;

    const response = await analyzeImage(
      '', // No image needed for categorization
      'image/png',
      prompt,
      'gemini-1.5-flash'
    );

    const category = response.trim().toLowerCase() as ExpenseCategory;
    if (Object.keys(CATEGORY_KEYWORDS).includes(category)) {
      return category;
    }

    return 'other';
  } catch (error) {
    logger.error('Failed to categorize expense', error);
    // Fallback to keyword matching
    const text = `${description} ${merchant}`.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        return category as ExpenseCategory;
      }
    }
    return 'other';
  }
}

/**
 * Detect duplicate expenses
 */
export async function detectDuplicateExpense(
  newExpense: {
    amount: number;
    date: string;
    merchant: string;
    description: string;
  },
  existingExpenses: Array<{
    amount: number;
    date: string;
    merchant?: string;
    description?: string;
  }>
): Promise<{ isDuplicate: boolean; similarExpense?: typeof existingExpenses[0]; confidence: number }> {
  try {
    // Check for exact matches first
    const exactMatch = existingExpenses.find(
      (exp) =>
        exp.amount === newExpense.amount &&
        exp.date === newExpense.date &&
        (exp.merchant === newExpense.merchant || exp.description === newExpense.description)
    );

    if (exactMatch) {
      return {
        isDuplicate: true,
        similarExpense: exactMatch,
        confidence: 0.95,
      };
    }

    // Check for similar amounts and dates (within 1 day)
    const similarDate = new Date(newExpense.date);
    const similarExpenses = existingExpenses.filter((exp) => {
      const expDate = new Date(exp.date);
      const dateDiff = Math.abs(similarDate.getTime() - expDate.getTime()) / (1000 * 60 * 60 * 24);
      const amountDiff = Math.abs(exp.amount - newExpense.amount) / newExpense.amount;
      return dateDiff <= 1 && amountDiff <= 0.1; // Within 1 day and 10% amount difference
    });

    if (similarExpenses.length > 0) {
      // Use AI to check if it's actually a duplicate
      const prompt = `Check if these two expenses are duplicates:

Expense 1:
- Amount: Rp ${newExpense.amount.toLocaleString('id-ID')}
- Date: ${newExpense.date}
- Merchant: ${newExpense.merchant}
- Description: ${newExpense.description}

Expense 2:
- Amount: Rp ${similarExpenses[0]!.amount.toLocaleString('id-ID')}
- Date: ${similarExpenses[0]!.date}
- Merchant: ${similarExpenses[0]!.merchant || 'N/A'}
- Description: ${similarExpenses[0]!.description || 'N/A'}

Are these the same expense? Answer with JSON: {"isDuplicate": true/false, "confidence": 0-1}`;

      try {
        const response = await analyzeImage('', 'image/png', prompt, 'gemini-1.5-flash');
        const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
        const result = JSON.parse(cleaned) as { isDuplicate: boolean; confidence: number };

        if (result.isDuplicate && result.confidence > 0.7) {
          return {
            isDuplicate: true,
            similarExpense: similarExpenses[0],
            confidence: result.confidence,
          };
        }
      } catch {
        // AI check failed, use similarity threshold
        return {
          isDuplicate: false,
          confidence: 0.5,
        };
      }
    }

    return {
      isDuplicate: false,
      confidence: 0,
    };
  } catch (error) {
    logger.error('Failed to detect duplicate expense', error);
    return {
      isDuplicate: false,
      confidence: 0,
    };
  }
}
