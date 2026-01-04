/**
 * Facility to Handover Item Mapper
 * Maps package facilities to suggested handover items for logistics handover
 */

import type { FacilityDisplayItem } from './facilities';

export type HandoverItemSuggestion = {
  name: string;
  quantity: number;
  unit: string;
};

/**
 * Map facility code to suggested handover items
 * Returns array of suggested items based on facility code/category
 */
const FACILITY_ITEM_MAP: Record<string, HandoverItemSuggestion[]> = {
  // Snorkeling equipment
  snorkeling_gear: [
    { name: 'Snorkeling Mask', quantity: 0, unit: 'piece' },
    { name: 'Snorkeling Fins', quantity: 0, unit: 'piece' },
    { name: 'Snorkel Tube', quantity: 0, unit: 'piece' },
  ],
  
  // Life jacket
  life_jacket: [
    { name: 'Life Jacket', quantity: 0, unit: 'piece' },
  ],
  
  // Diving equipment
  diving_gear: [
    { name: 'Diving Suit', quantity: 0, unit: 'piece' },
    { name: 'BCD', quantity: 0, unit: 'piece' },
    { name: 'Regulator', quantity: 0, unit: 'piece' },
    { name: 'Diving Mask', quantity: 0, unit: 'piece' },
    { name: 'Diving Fins', quantity: 0, unit: 'piece' },
  ],
  
  // Safety equipment
  safety_equipment: [
    { name: 'First Aid Kit', quantity: 0, unit: 'piece' },
    { name: 'Emergency Flare', quantity: 0, unit: 'piece' },
    { name: 'Emergency Whistle', quantity: 0, unit: 'piece' },
  ],
  
  // Communication equipment
  communication: [
    { name: 'VHF Radio', quantity: 0, unit: 'piece' },
    { name: 'GPS Device', quantity: 0, unit: 'piece' },
  ],
  
  // Water/Drink
  drink: [
    { name: 'Drinking Water', quantity: 0, unit: 'liter' },
    { name: 'Water Bottles', quantity: 0, unit: 'piece' },
  ],
  
  // Snack
  snack: [
    { name: 'Snack Box', quantity: 0, unit: 'box' },
  ],
  
  // Camping equipment
  camping_gear: [
    { name: 'Tent', quantity: 0, unit: 'piece' },
    { name: 'Sleeping Bag', quantity: 0, unit: 'piece' },
    { name: 'Backpack', quantity: 0, unit: 'piece' },
  ],
  
  // Navigation equipment
  navigation: [
    { name: 'Compass', quantity: 0, unit: 'piece' },
    { name: 'GPS Device', quantity: 0, unit: 'piece' },
    { name: 'Map', quantity: 0, unit: 'piece' },
  ],
  
  // General tools
  tools: [
    { name: 'Multi-tool', quantity: 0, unit: 'piece' },
    { name: 'Flashlight', quantity: 0, unit: 'piece' },
    { name: 'Rope', quantity: 0, unit: 'meter' },
  ],
  
  // Boat equipment
  boat_equipment: [
    { name: 'Anchor', quantity: 0, unit: 'piece' },
    { name: 'Rope', quantity: 0, unit: 'meter' },
    { name: 'Cooler Box', quantity: 0, unit: 'piece' },
  ],
  
  // Cooking equipment
  cooking_equipment: [
    { name: 'Portable Stove', quantity: 0, unit: 'piece' },
    { name: 'Cooking Utensils', quantity: 0, unit: 'set' },
  ],
};

/**
 * Map facility category to suggested handover items
 * Used when facility code doesn't have specific mapping
 */
const CATEGORY_ITEM_MAP: Record<string, HandoverItemSuggestion[]> = {
  equipment: [
    { name: 'Equipment Set', quantity: 0, unit: 'set' },
  ],
  consumption: [
    { name: 'Food Supply', quantity: 0, unit: 'box' },
    { name: 'Drinking Water', quantity: 0, unit: 'liter' },
  ],
  transport: [
    { name: 'Vehicle Equipment', quantity: 0, unit: 'set' },
  ],
};

/**
 * Map facility to handover items
 * 
 * @param facility - FacilityDisplayItem from package info
 * @returns Array of suggested handover items
 */
export function mapFacilityToItems(facility: FacilityDisplayItem): HandoverItemSuggestion[] {
  // Only map included facilities
  if (facility.status !== 'included') {
    return [];
  }
  
  // Try facility code mapping first
  const codeMap = FACILITY_ITEM_MAP[facility.code];
  if (codeMap) {
    return codeMap.map(item => ({ ...item }));
  }
  
  // Fallback to category mapping
  const categoryMap = CATEGORY_ITEM_MAP[facility.category];
  if (categoryMap) {
    return categoryMap.map(item => ({ ...item }));
  }
  
  // No mapping found
  return [];
}

/**
 * Map multiple facilities to handover items
 * Deduplicates items by name (case-insensitive)
 * 
 * @param facilities - Array of FacilityDisplayItem
 * @returns Array of unique suggested handover items
 */
export function mapFacilitiesToItems(facilities: FacilityDisplayItem[]): HandoverItemSuggestion[] {
  const allItems: HandoverItemSuggestion[] = [];
  
  // Map each facility to items
  facilities.forEach(facility => {
    const items = mapFacilityToItems(facility);
    allItems.push(...items);
  });
  
  // Deduplicate by name (case-insensitive)
  const seen = new Set<string>();
  const uniqueItems: HandoverItemSuggestion[] = [];
  
  allItems.forEach(item => {
    const key = item.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  });
  
  return uniqueItems;
}
