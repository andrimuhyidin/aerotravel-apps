/**
 * Vision AI - OCR untuk Auto-Verify Payment
 * Sesuai PRD 2.2.B - AI Vision (Gemini)
 * PRD 5.2.B - Vision AI (Auto-Verify Payment)
 */

import 'server-only';

import { ocrPaymentReceipt } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

export type PaymentInfo = {
  amount: number | null;
  date: string | null;
  time: string | null;
  bank_sender: string | null;
  bank_receiver: string | null;
  account_number: string | null;
  account_name: string | null;
  reference_number: string | null;
  confidence: number;
};

/**
 * Extract payment information dari foto struk transfer
 */
export async function extractPaymentInfo(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<PaymentInfo> {
  try {
    const result = await ocrPaymentReceipt(imageBase64, mimeType);

    if (result.error) {
      logger.error('OCR extraction failed', { error: result.error });
      throw new Error('Failed to extract payment information');
    }

    return {
      amount: result.amount || null,
      date: result.date || null,
      time: result.time || null,
      bank_sender: result.bank_sender || null,
      bank_receiver: result.bank_receiver || null,
      account_number: result.account_number || null,
      account_name: result.account_name || null,
      reference_number: result.reference_number || null,
      confidence: result.confidence || 0,
    };
  } catch (error) {
    logger.error('Vision AI extraction error', error);
    throw new Error('Failed to extract payment information');
  }
}

/**
 * Verify payment matches booking
 */
export async function verifyPayment(
  imageBase64: string,
  expectedAmount: number,
  mimeType: string = 'image/jpeg'
): Promise<{
  isMatch: boolean;
  confidence: number;
  extractedData: PaymentInfo;
  discrepancy?: string;
}> {
  const extractedData = await extractPaymentInfo(imageBase64, mimeType);

  // Check if amount matches (with 1% tolerance for rounding)
  const amountMatch =
    extractedData.amount !== null &&
    Math.abs(extractedData.amount - expectedAmount) <= expectedAmount * 0.01;

  // Determine overall match
  const isMatch = amountMatch && extractedData.confidence >= 95;

  let discrepancy: string | undefined;
  if (!amountMatch && extractedData.amount !== null) {
    discrepancy = `Expected Rp ${expectedAmount.toLocaleString()}, got Rp ${extractedData.amount.toLocaleString()}`;
  } else if (extractedData.confidence < 95) {
    discrepancy = `Low confidence: ${extractedData.confidence}%`;
  }

  return {
    isMatch,
    confidence: extractedData.confidence,
    extractedData,
    discrepancy,
  };
}

/**
 * Convert File to base64
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to convert file to base64'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
