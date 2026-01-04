/**
 * Financial Settings - Configurable financial calculation values
 *
 * These values are fetched from database settings table
 * with fallback to default constants
 */

// ============================================
// DEFAULT VALUES (Fallback)
// ============================================

const DEFAULT_TAX_RATE = 0.11; // 11% PPN
const DEFAULT_DEPOSIT_PERCENTAGE = 0.5; // 50%
const DEFAULT_CHILD_DISCOUNT_PERCENTAGE = 0.5; // 50%
const DEFAULT_PLATFORM_FEE_RATE = 0.05; // 5%
const DEFAULT_GUIDE_PERCENTAGE = 0.7; // 70%
const DEFAULT_TAX_WITHHELD_RATE = 0.025; // 2.5%

// ============================================
// TYPES
// ============================================

export interface FinancialSettings {
  taxRate: number;
  depositPercentage: number;
  childDiscountPercentage: number;
  platformFeeRate: number;
  guidePercentage: number;
  taxWithheldRate: number;
}

// ============================================
// SETTINGS FETCHER
// ============================================

/**
 * Get all financial settings from database with fallback to defaults
 */
export async function getFinancialSettings(): Promise<FinancialSettings> {
  try {
    const { getSetting } = await import('@/lib/settings');
    const [
      taxRate,
      depositPercentage,
      childDiscountPercentage,
      platformFeeRate,
      guidePercentage,
      taxWithheldRate,
    ] = await Promise.all([
      getSetting('finance.tax_rate'),
      getSetting('finance.deposit_percentage'),
      getSetting('finance.child_discount_percentage'),
      getSetting('finance.platform_fee_rate'),
      getSetting('finance.guide_percentage'),
      getSetting('finance.tax_withheld_rate'),
    ]);

    return {
      taxRate: (taxRate as number) ?? DEFAULT_TAX_RATE,
      depositPercentage:
        (depositPercentage as number) ?? DEFAULT_DEPOSIT_PERCENTAGE,
      childDiscountPercentage:
        (childDiscountPercentage as number) ?? DEFAULT_CHILD_DISCOUNT_PERCENTAGE,
      platformFeeRate: (platformFeeRate as number) ?? DEFAULT_PLATFORM_FEE_RATE,
      guidePercentage: (guidePercentage as number) ?? DEFAULT_GUIDE_PERCENTAGE,
      taxWithheldRate: (taxWithheldRate as number) ?? DEFAULT_TAX_WITHHELD_RATE,
    };
  } catch {
    return {
      taxRate: DEFAULT_TAX_RATE,
      depositPercentage: DEFAULT_DEPOSIT_PERCENTAGE,
      childDiscountPercentage: DEFAULT_CHILD_DISCOUNT_PERCENTAGE,
      platformFeeRate: DEFAULT_PLATFORM_FEE_RATE,
      guidePercentage: DEFAULT_GUIDE_PERCENTAGE,
      taxWithheldRate: DEFAULT_TAX_WITHHELD_RATE,
    };
  }
}

// ============================================
// INDIVIDUAL GETTERS (async)
// ============================================

/**
 * Get tax rate (PPN) from settings
 */
export async function getTaxRate(): Promise<number> {
  const settings = await getFinancialSettings();
  return settings.taxRate;
}

/**
 * Get deposit percentage from settings
 */
export async function getDepositPercentage(): Promise<number> {
  const settings = await getFinancialSettings();
  return settings.depositPercentage;
}

/**
 * Get child discount percentage from settings
 */
export async function getChildDiscountPercentage(): Promise<number> {
  const settings = await getFinancialSettings();
  return settings.childDiscountPercentage;
}

/**
 * Get platform fee rate from settings
 */
export async function getPlatformFeeRate(): Promise<number> {
  const settings = await getFinancialSettings();
  return settings.platformFeeRate;
}

/**
 * Get guide percentage from settings
 */
export async function getGuidePercentage(): Promise<number> {
  const settings = await getFinancialSettings();
  return settings.guidePercentage;
}

/**
 * Get tax withheld rate from settings
 */
export async function getTaxWithheldRate(): Promise<number> {
  const settings = await getFinancialSettings();
  return settings.taxWithheldRate;
}

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Calculate tax amount from subtotal
 */
export async function calculateTax(subtotal: number): Promise<number> {
  const taxRate = await getTaxRate();
  return subtotal * taxRate;
}

/**
 * Calculate deposit amount from total
 */
export async function calculateDeposit(total: number): Promise<number> {
  const depositPercentage = await getDepositPercentage();
  return total * depositPercentage;
}

/**
 * Calculate child price from adult price
 */
export async function calculateChildPrice(adultPrice: number): Promise<number> {
  const discountPercentage = await getChildDiscountPercentage();
  return adultPrice * (1 - discountPercentage);
}

/**
 * Calculate platform fee from amount
 */
export async function calculatePlatformFee(amount: number): Promise<number> {
  const feeRate = await getPlatformFeeRate();
  return Math.round(amount * feeRate);
}

/**
 * Calculate guide share from total fee
 */
export async function calculateGuideShare(totalFee: number): Promise<number> {
  const guidePercentage = await getGuidePercentage();
  return Math.round(totalFee * guidePercentage);
}

/**
 * Calculate tax withheld from taxable amount
 */
export async function calculateTaxWithheld(taxableAmount: number): Promise<number> {
  const taxWithheldRate = await getTaxWithheldRate();
  return Math.round(taxableAmount * taxWithheldRate);
}

/**
 * Calculate full payment breakdown
 */
export async function calculatePaymentBreakdown(params: {
  totalFee: number;
}): Promise<{
  totalFee: number;
  companyShare: number;
  guideGross: number;
  platformFee: number;
  taxable: number;
  taxWithheld: number;
  guideNet: number;
}> {
  const settings = await getFinancialSettings();

  const companyShare = Math.round(params.totalFee * (1 - settings.guidePercentage));
  const guideGross = params.totalFee - companyShare;
  const platformFee = Math.round(guideGross * settings.platformFeeRate);
  const taxable = guideGross - platformFee;
  const taxWithheld = Math.round(taxable * settings.taxWithheldRate);
  const guideNet = taxable - taxWithheld;

  return {
    totalFee: params.totalFee,
    companyShare,
    guideGross,
    platformFee,
    taxable,
    taxWithheld,
    guideNet,
  };
}

// ============================================
// SYNC EXPORTS (for backward compatibility)
// ============================================

/**
 * Default tax rate (use getTaxRate() for dynamic value)
 * @deprecated Use getTaxRate() for dynamic values
 */
export const TAX_RATE = DEFAULT_TAX_RATE;

/**
 * Default deposit percentage (use getDepositPercentage() for dynamic value)
 * @deprecated Use getDepositPercentage() for dynamic values
 */
export const DEPOSIT_PERCENTAGE = DEFAULT_DEPOSIT_PERCENTAGE;

/**
 * Default child discount percentage
 * @deprecated Use getChildDiscountPercentage() for dynamic values
 */
export const CHILD_DISCOUNT_PERCENTAGE = DEFAULT_CHILD_DISCOUNT_PERCENTAGE;

/**
 * Default platform fee rate
 * @deprecated Use getPlatformFeeRate() for dynamic values
 */
export const PLATFORM_FEE_RATE = DEFAULT_PLATFORM_FEE_RATE;

/**
 * Default guide percentage
 * @deprecated Use getGuidePercentage() for dynamic values
 */
export const GUIDE_PERCENTAGE = DEFAULT_GUIDE_PERCENTAGE;

/**
 * Default tax withheld rate
 * @deprecated Use getTaxWithheldRate() for dynamic values
 */
export const TAX_WITHHELD_RATE = DEFAULT_TAX_WITHHELD_RATE;

