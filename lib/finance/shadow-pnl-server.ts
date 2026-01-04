/**
 * Shadow P&L Server-Only Functions
 * Functions that require server-side execution (database access)
 */

import 'server-only';

import type { CostItem } from './shadow-pnl';

// Default cost structure (fallback)
const DEFAULT_COST_STRUCTURE: Record<string, CostItem[]> = {
  open_trip: [
    {
      category: 'Operational',
      description: 'Guide fee',
      amount: 0,
      percentage: 0.3,
    },
    {
      category: 'Operational',
      description: 'Equipment rental',
      amount: 0,
      percentage: 0.1,
    },
    {
      category: 'Operational',
      description: 'Transportation',
      amount: 0,
      percentage: 0.15,
    },
    {
      category: 'Operational',
      description: 'Accommodation',
      amount: 0,
      percentage: 0.2,
    },
    {
      category: 'Operational',
      description: 'Meals',
      amount: 0,
      percentage: 0.1,
    },
    {
      category: 'Operational',
      description: 'Insurance',
      amount: 0,
      percentage: 0.05,
    },
    {
      category: 'Operational',
      description: 'Other costs',
      amount: 0,
      percentage: 0.1,
    },
  ],
  private_trip: [
    {
      category: 'Operational',
      description: 'Guide fee',
      amount: 0,
      percentage: 0.35,
    },
    {
      category: 'Operational',
      description: 'Equipment rental',
      amount: 0,
      percentage: 0.12,
    },
    {
      category: 'Operational',
      description: 'Transportation',
      amount: 0,
      percentage: 0.18,
    },
    {
      category: 'Operational',
      description: 'Accommodation',
      amount: 0,
      percentage: 0.2,
    },
    {
      category: 'Operational',
      description: 'Meals',
      amount: 0,
      percentage: 0.1,
    },
    {
      category: 'Operational',
      description: 'Insurance',
      amount: 0,
      percentage: 0.05,
    },
  ],
  corporate: [
    {
      category: 'Operational',
      description: 'Guide fee',
      amount: 0,
      percentage: 0.3,
    },
    {
      category: 'Operational',
      description: 'Equipment rental',
      amount: 0,
      percentage: 0.1,
    },
    {
      category: 'Operational',
      description: 'Transportation',
      amount: 0,
      percentage: 0.15,
    },
    {
      category: 'Operational',
      description: 'Accommodation',
      amount: 0,
      percentage: 0.2,
    },
    {
      category: 'Operational',
      description: 'Meals',
      amount: 0,
      percentage: 0.1,
    },
    {
      category: 'Operational',
      description: 'Insurance',
      amount: 0,
      percentage: 0.05,
    },
    {
      category: 'Operational',
      description: 'Corporate services',
      amount: 0,
      percentage: 0.1,
    },
  ],
};

/**
 * Get cost structures from settings with fallback to defaults
 */
export async function getCostStructures(): Promise<Record<string, CostItem[]>> {
  try {
    // Dynamic import to avoid bundling server-only code in client
    const settingsModule = await import('@/lib/settings');
    const costStructures = await settingsModule.getSetting('finance.cost_structures');

    if (
      costStructures &&
      typeof costStructures === 'object' &&
      !Array.isArray(costStructures)
    ) {
      return costStructures as Record<string, CostItem[]>;
    }

    return DEFAULT_COST_STRUCTURE;
  } catch {
    return DEFAULT_COST_STRUCTURE;
  }
}

/**
 * Get cost structure for a specific trip type
 */
export async function getCostStructureForType(
  tripType: string
): Promise<CostItem[]> {
  const structures = await getCostStructures();
  return structures[tripType] || structures.open_trip || [];
}

