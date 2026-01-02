/**
 * Unit Tests: Wallet Calculations
 * Tests for earnings, deductions, tax, and tip processing
 */

import { describe, it, expect } from 'vitest';

// Type definitions
type EarningBreakdown = {
  baseFee: number;
  bonus: number;
  tips: number;
  deductions: number;
  netEarnings: number;
  tax: number;
  takeHome: number;
};

type PaymentSplit = {
  guideShare: number;
  companyShare: number;
  taxWithheld: number;
  platformFee: number;
};

// Mock implementations
const calculateNetEarnings = (params: {
  baseFee: number;
  bonus?: number;
  tips?: number;
  deductions?: number;
  taxRate?: number;
}): EarningBreakdown => {
  const {
    baseFee,
    bonus = 0,
    tips = 0,
    deductions = 0,
    taxRate = 0.025, // 2.5% PPh 21 for freelancers
  } = params;

  const grossEarnings = baseFee + bonus + tips;
  const netBeforeTax = grossEarnings - deductions;
  const tax = Math.floor(netBeforeTax * taxRate);
  const takeHome = netBeforeTax - tax;

  return {
    baseFee,
    bonus,
    tips,
    deductions,
    netEarnings: netBeforeTax,
    tax,
    takeHome,
  };
};

const calculatePaymentSplit = (params: {
  totalFee: number;
  guidePercentage?: number;
  taxRate?: number;
  platformFeeRate?: number;
}): PaymentSplit => {
  const {
    totalFee,
    guidePercentage = 0.7, // 70% to guide
    taxRate = 0.025,
    platformFeeRate = 0.05, // 5% platform fee
  } = params;

  // Use Math.round to handle floating point precision issues
  const companyShare = Math.round(totalFee * (1 - guidePercentage));
  const guideGross = totalFee - companyShare;
  const platformFee = Math.round(guideGross * platformFeeRate);
  const taxable = guideGross - platformFee;
  const taxWithheld = Math.round(taxable * taxRate);
  const guideShare = taxable - taxWithheld;

  return {
    guideShare,
    companyShare,
    taxWithheld,
    platformFee,
  };
};

const processTip = (params: {
  tipAmount: number;
  paymentMethod: 'qris' | 'cash' | 'transfer';
  processingFeeRate?: number;
}): {
  grossAmount: number;
  processingFee: number;
  netAmount: number;
} => {
  const { tipAmount, paymentMethod, processingFeeRate = 0.015 } = params;

  // QRIS and transfer have processing fees, cash doesn't
  const processingFee = paymentMethod === 'cash' 
    ? 0 
    : Math.ceil(tipAmount * processingFeeRate);
  
  const netAmount = tipAmount - processingFee;

  return {
    grossAmount: tipAmount,
    processingFee,
    netAmount,
  };
};

const detectDuplicateExpense = (
  newExpense: { amount: number; category: string; date: string; description: string },
  existingExpenses: Array<{ amount: number; category: string; date: string; description: string }>
): {
  isDuplicate: boolean;
  matchingExpense?: typeof newExpense;
  confidence: number;
} => {
  for (const expense of existingExpenses) {
    // Same amount and category on same day
    if (
      expense.amount === newExpense.amount &&
      expense.category === newExpense.category &&
      expense.date === newExpense.date
    ) {
      return { isDuplicate: true, matchingExpense: expense, confidence: 0.95 };
    }

    // Similar amount within 5% and same category
    const amountDiff = Math.abs(expense.amount - newExpense.amount) / expense.amount;
    if (amountDiff < 0.05 && expense.category === newExpense.category && expense.date === newExpense.date) {
      return { isDuplicate: true, matchingExpense: expense, confidence: 0.7 };
    }
  }

  return { isDuplicate: false, confidence: 0 };
};

describe('Net Earnings Calculation', () => {
  it('should calculate simple earnings without deductions', () => {
    const result = calculateNetEarnings({
      baseFee: 500000,
    });

    expect(result.baseFee).toBe(500000);
    expect(result.netEarnings).toBe(500000);
    expect(result.tax).toBe(12500); // 2.5% of 500000
    expect(result.takeHome).toBe(487500);
  });

  it('should include bonus in calculations', () => {
    const result = calculateNetEarnings({
      baseFee: 500000,
      bonus: 100000,
    });

    expect(result.bonus).toBe(100000);
    expect(result.netEarnings).toBe(600000);
    expect(result.tax).toBe(15000); // 2.5% of 600000
    expect(result.takeHome).toBe(585000);
  });

  it('should include tips in calculations', () => {
    const result = calculateNetEarnings({
      baseFee: 500000,
      tips: 50000,
    });

    expect(result.tips).toBe(50000);
    expect(result.netEarnings).toBe(550000);
  });

  it('should subtract deductions', () => {
    const result = calculateNetEarnings({
      baseFee: 500000,
      deductions: 50000, // Late penalty
    });

    expect(result.deductions).toBe(50000);
    expect(result.netEarnings).toBe(450000);
    expect(result.tax).toBe(11250); // 2.5% of 450000
    expect(result.takeHome).toBe(438750);
  });

  it('should use custom tax rate', () => {
    const result = calculateNetEarnings({
      baseFee: 500000,
      taxRate: 0.05, // 5%
    });

    expect(result.tax).toBe(25000); // 5% of 500000
    expect(result.takeHome).toBe(475000);
  });

  it('should handle all components together', () => {
    const result = calculateNetEarnings({
      baseFee: 500000,
      bonus: 100000,
      tips: 75000,
      deductions: 25000,
      taxRate: 0.025,
    });

    // Gross: 500k + 100k + 75k = 675k
    // Net before tax: 675k - 25k = 650k
    // Tax: 650k * 2.5% = 16,250
    // Take home: 650k - 16,250 = 633,750
    expect(result.netEarnings).toBe(650000);
    expect(result.tax).toBe(16250);
    expect(result.takeHome).toBe(633750);
  });
});

describe('Payment Split Calculation', () => {
  it('should split payment 70-30 by default', () => {
    const result = calculatePaymentSplit({
      totalFee: 1000000,
    });

    expect(result.companyShare).toBe(300000); // 30%
    // Guide gross: 700000
    // Platform fee: 35000 (5%)
    // Taxable: 665000
    // Tax: 16625 (2.5%)
    expect(result.guideShare).toBe(665000 - 16625);
  });

  it('should handle custom guide percentage', () => {
    const result = calculatePaymentSplit({
      totalFee: 1000000,
      guidePercentage: 0.8, // 80% to guide
    });

    expect(result.companyShare).toBe(200000); // 20%
  });

  it('should calculate platform fee', () => {
    const result = calculatePaymentSplit({
      totalFee: 1000000,
      platformFeeRate: 0.03, // 3%
    });

    // Guide gross: 700000
    // Platform fee: 21000 (3%)
    expect(result.platformFee).toBe(21000);
  });

  it('should withhold tax correctly', () => {
    const result = calculatePaymentSplit({
      totalFee: 1000000,
      taxRate: 0.025,
    });

    // Guide gross: 700000
    // Platform fee: 35000
    // Taxable: 665000
    // Tax: 16625
    expect(result.taxWithheld).toBe(16625);
  });
});

describe('Tip Processing', () => {
  it('should process QRIS tip with fee', () => {
    const result = processTip({
      tipAmount: 100000,
      paymentMethod: 'qris',
    });

    expect(result.grossAmount).toBe(100000);
    expect(result.processingFee).toBe(1500); // 1.5%
    expect(result.netAmount).toBe(98500);
  });

  it('should process cash tip without fee', () => {
    const result = processTip({
      tipAmount: 100000,
      paymentMethod: 'cash',
    });

    expect(result.grossAmount).toBe(100000);
    expect(result.processingFee).toBe(0);
    expect(result.netAmount).toBe(100000);
  });

  it('should process transfer tip with fee', () => {
    const result = processTip({
      tipAmount: 50000,
      paymentMethod: 'transfer',
    });

    expect(result.processingFee).toBe(750); // 1.5%
    expect(result.netAmount).toBe(49250);
  });

  it('should handle custom processing fee rate', () => {
    const result = processTip({
      tipAmount: 100000,
      paymentMethod: 'qris',
      processingFeeRate: 0.02, // 2%
    });

    expect(result.processingFee).toBe(2000);
    expect(result.netAmount).toBe(98000);
  });

  it('should round processing fee up', () => {
    const result = processTip({
      tipAmount: 10000,
      paymentMethod: 'qris',
      processingFeeRate: 0.015,
    });

    // 10000 * 0.015 = 150
    expect(result.processingFee).toBe(150);
  });
});

describe('Duplicate Expense Detection', () => {
  const existingExpenses = [
    { amount: 50000, category: 'fuel', date: '2026-01-02', description: 'Bensin' },
    { amount: 100000, category: 'food', date: '2026-01-02', description: 'Makan siang' },
    { amount: 25000, category: 'parking', date: '2026-01-01', description: 'Parkir' },
  ];

  it('should detect exact duplicate', () => {
    const result = detectDuplicateExpense(
      { amount: 50000, category: 'fuel', date: '2026-01-02', description: 'Bensin lagi' },
      existingExpenses
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe(0.95);
  });

  it('should detect similar amount duplicate', () => {
    const result = detectDuplicateExpense(
      { amount: 51000, category: 'fuel', date: '2026-01-02', description: 'Bensin' },
      existingExpenses
    );

    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe(0.7);
  });

  it('should not flag different dates as duplicate', () => {
    const result = detectDuplicateExpense(
      { amount: 50000, category: 'fuel', date: '2026-01-03', description: 'Bensin' },
      existingExpenses
    );

    expect(result.isDuplicate).toBe(false);
  });

  it('should not flag different categories as duplicate', () => {
    const result = detectDuplicateExpense(
      { amount: 50000, category: 'parking', date: '2026-01-02', description: 'Parkir' },
      existingExpenses
    );

    expect(result.isDuplicate).toBe(false);
  });

  it('should return matching expense when duplicate found', () => {
    const result = detectDuplicateExpense(
      { amount: 50000, category: 'fuel', date: '2026-01-02', description: 'Test' },
      existingExpenses
    );

    expect(result.matchingExpense).toBeDefined();
    expect(result.matchingExpense?.description).toBe('Bensin');
  });
});

