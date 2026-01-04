/**
 * Tax Calculator Utility
 * PRD 4.3.A: Tax Calculation Logic
 */

export type TaxCalculationResult = {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number;
  taxInclusive: boolean;
};

/**
 * Calculate tax based on branch configuration
 * @param subtotal - Base amount before tax
 * @param taxInclusive - Whether tax is already included in the price
 * @param taxRate - Tax rate (default 0.11 for 11% PPN)
 * @returns Tax calculation result
 */
export function calculateTax(
  subtotal: number,
  taxInclusive: boolean = false,
  taxRate: number = 0.11
): TaxCalculationResult {
  // Handle edge cases
  if (subtotal <= 0) {
    return {
      subtotal: 0,
      taxAmount: 0,
      totalAmount: 0,
      taxRate,
      taxInclusive,
    };
  }

  let taxAmount = 0;
  let totalAmount = subtotal;

  if (!taxInclusive) {
    // Tax is added on top (exclusive)
    taxAmount = subtotal * taxRate;
    totalAmount = subtotal + taxAmount;
  } else {
    // Tax is already included in price (inclusive)
    // Calculate tax amount for display purposes
    // Formula: tax = price * (rate / (1 + rate))
    taxAmount = subtotal * (taxRate / (1 + taxRate));
    totalAmount = subtotal; // Total stays the same since tax is included
  }

  // Round to 2 decimal places for currency
  taxAmount = Math.round(taxAmount * 100) / 100;
  totalAmount = Math.round(totalAmount * 100) / 100;

  return {
    subtotal,
    taxAmount,
    totalAmount,
    taxRate,
    taxInclusive,
  };
}

/**
 * Format tax for display
 * @param taxAmount - Tax amount
 * @param taxInclusive - Whether tax is inclusive
 * @returns Formatted tax string
 */
export function formatTaxLabel(taxAmount: number, taxInclusive: boolean): string {
  if (taxInclusive) {
    return `Termasuk PPN: Rp ${taxAmount.toLocaleString('id-ID')}`;
  }
  return `PPN (11%): Rp ${taxAmount.toLocaleString('id-ID')}`;
}

