/**
 * Master Facilities Configuration
 * Definisi standar facilities untuk trip dengan kategori dan default templates
 */

export type FacilityCategory = 
  | 'transport'      // Transportasi
  | 'consumption'    // Konsumsi (makan/minum)
  | 'equipment'      // Peralatan/Equipment
  | 'accommodation'  // Akomodasi
  | 'guide'          // Guide/Service
  | 'insurance'      // Asuransi
  | 'ticket'         // Tiket masuk
  | 'activity'       // Aktivitas
  | 'documentation'  // Dokumentasi
  | 'other';         // Lainnya

export type FacilityItem = {
  code: string;
  name: string;
  category: FacilityCategory;
  description?: string;
  icon?: string;
};

/**
 * Master Facilities List
 * Definisi semua facilities standar yang bisa digunakan
 */
export const MASTER_FACILITIES: Record<string, FacilityItem> = {
  // Transport Category
  'transport_pp': {
    code: 'transport_pp',
    name: 'Transportasi PP',
    category: 'transport',
    description: 'Transportasi pulang pergi dari meeting point',
    icon: '🚌',
  },
  'transport_boat': {
    code: 'transport_boat',
    name: 'Kapal/Penyebrangan',
    category: 'transport',
    description: 'Kapal atau perahu untuk penyeberangan',
    icon: '⛴️',
  },
  'transport_car': {
    code: 'transport_car',
    name: 'Transportasi Darat',
    category: 'transport',
    description: 'Transportasi kendaraan darat',
    icon: '🚗',
  },
  
  // Consumption Category
  'meal_fullboard': {
    code: 'meal_fullboard',
    name: 'Makan Full Board',
    category: 'consumption',
    description: 'Makan 3x sehari (pagi, siang, malam)',
    icon: '🍽️',
  },
  'meal_3x': {
    code: 'meal_3x',
    name: 'Makan 3x',
    category: 'consumption',
    description: 'Makan 3x (sesuai durasi trip)',
    icon: '🍽️',
  },
  'meal_2x': {
    code: 'meal_2x',
    name: 'Makan 2x',
    category: 'consumption',
    description: 'Makan 2x (sesuai durasi trip)',
    icon: '🍽️',
  },
  'snack': {
    code: 'snack',
    name: 'Snack',
    category: 'consumption',
    description: 'Snack/camilan selama trip',
    icon: '🍿',
  },
  'drink': {
    code: 'drink',
    name: 'Minuman',
    category: 'consumption',
    description: 'Air mineral dan minuman',
    icon: '🥤',
  },
  
  // Equipment Category
  'snorkeling_gear': {
    code: 'snorkeling_gear',
    name: 'Alat Snorkeling',
    category: 'equipment',
    description: 'Perlengkapan snorkeling lengkap',
    icon: '🤿',
  },
  'life_jacket': {
    code: 'life_jacket',
    name: 'Pelampung',
    category: 'equipment',
    description: 'Life jacket untuk keselamatan',
    icon: '🦺',
  },
  'waterproof_bag': {
    code: 'waterproof_bag',
    name: 'Dry Bag',
    category: 'equipment',
    description: 'Tas kedap air untuk barang',
    icon: '🎒',
  },
  
  // Accommodation Category
  'tent': {
    code: 'tent',
    name: 'Tenda Camping',
    category: 'accommodation',
    description: 'Tenda untuk camping',
    icon: '⛺',
  },
  'homestay': {
    code: 'homestay',
    name: 'Homestay',
    category: 'accommodation',
    description: 'Penginapan homestay',
    icon: '🏠',
  },
  'liveaboard': {
    code: 'liveaboard',
    name: 'Live On Board',
    category: 'accommodation',
    description: 'Menginap di kapal',
    icon: '🛥️',
  },
  
  // Guide Category
  'guide_service': {
    code: 'guide_service',
    name: 'Tour Guide',
    category: 'guide',
    description: 'Layanan tour guide',
    icon: '👤',
  },
  'local_guide': {
    code: 'local_guide',
    name: 'Guide Lokal',
    category: 'guide',
    description: 'Guide lokal destinasi',
    icon: '👤',
  },
  
  // Insurance Category
  'travel_insurance': {
    code: 'travel_insurance',
    name: 'Asuransi Perjalanan',
    category: 'insurance',
    description: 'Asuransi perjalanan',
    icon: '🛡️',
  },
  
  // Ticket Category
  'entrance_ticket': {
    code: 'entrance_ticket',
    name: 'Tiket Masuk',
    category: 'ticket',
    description: 'Tiket masuk destinasi',
    icon: '🎫',
  },
  
  // Activity Category
  'snorkeling': {
    code: 'snorkeling',
    name: 'Aktivitas Snorkeling',
    category: 'activity',
    description: 'Snorkeling di spot terpilih',
    icon: '🏊',
  },
  'island_hopping': {
    code: 'island_hopping',
    name: 'Island Hopping',
    category: 'activity',
    description: 'Kunjungan ke beberapa pulau',
    icon: '🏝️',
  },
  
  // Documentation Category
  'photo_video': {
    code: 'photo_video',
    name: 'Foto & Video',
    category: 'documentation',
    description: 'Dokumentasi foto dan video',
    icon: '📸',
  },
};

/**
 * Default Facility Templates per Package Type
 * Template standar yang digunakan per jenis trip
 */
export const DEFAULT_FACILITY_TEMPLATES: Record<string, string[]> = {
  boat_trip: [
    'transport_pp',
    'transport_boat',
    'meal_3x',
    'snorkeling_gear',
    'life_jacket',
    'tent',
    'guide_service',
    'travel_insurance',
  ],
  land_trip: [
    'transport_pp',
    'transport_car',
    'meal_2x',
    'snack',
    'homestay',
    'guide_service',
    'travel_insurance',
    'entrance_ticket',
  ],
  default: [
    'transport_pp',
    'meal_2x',
    'guide_service',
    'travel_insurance',
  ],
};

/**
 * Get facility item by code
 */
export function getFacilityByCode(code: string): FacilityItem | null {
  return MASTER_FACILITIES[code] || null;
}

/**
 * Get facilities by category
 */
export function getFacilitiesByCategory(category: FacilityCategory): FacilityItem[] {
  return Object.values(MASTER_FACILITIES).filter((f) => f.category === category);
}

/**
 * Get default template for package type
 */
export function getDefaultTemplate(packageType?: string): string[] {
  // Default template always exists
  const defaultTemplate = DEFAULT_FACILITY_TEMPLATES.default!;
  
  if (!packageType) {
    return defaultTemplate.slice();
  }
  
  const template = DEFAULT_FACILITY_TEMPLATES[packageType];
  if (template) {
    return template.slice();
  }
  
  return defaultTemplate.slice();
}

/**
 * Facility Display Item (after merging)
 */
export type FacilityDisplayItem = {
  code: string;
  name: string;
  category: FacilityCategory;
  description?: string;
  icon?: string;
  status: 'included' | 'excluded';
  quantity?: number | null; // Jumlah/kuantitas (optional, dari input admin)
  source: 'default' | 'override' | 'custom'; // default = dari template, override = dari package tapi ada di master, custom = tidak ada di master
};

/**
 * Normalize facility code/name to master facility code
 * Returns the master facility code if found, null otherwise
 * 
 * Examples:
 * - "transport_pp" -> "transport_pp" (direct match)
 * - "Transport_PP" -> "transport_pp" (case-insensitive code match)
 * - "Transportasi PP" -> "transport_pp" (name match)
 * - "Transportasi" -> "transport_pp" (partial name match)
 */
function normalizeToMasterCode(input: string): string | null {
  const normalized = input.trim();
  if (!normalized) return null;
  
  // Direct match by code
  if (MASTER_FACILITIES[normalized]) {
    return normalized;
  }
  
  // Case-insensitive match by code
  const codeMatch = Object.keys(MASTER_FACILITIES).find(
    (code) => code.toLowerCase() === normalized.toLowerCase()
  );
  if (codeMatch) {
    return codeMatch;
  }
  
  // Case-insensitive exact match by name
  const nameMatch = Object.entries(MASTER_FACILITIES).find(
    ([_code, facility]) => facility.name.toLowerCase() === normalized.toLowerCase()
  );
  if (nameMatch) {
    return nameMatch[0]; // Return the code
  }
  
  // Partial name match (fuzzy) - try to find similar names
  const normalizedLower = normalized.toLowerCase();
  const fuzzyMatch = Object.entries(MASTER_FACILITIES).find(
    ([_code, facility]) => {
      const facilityNameLower = facility.name.toLowerCase();
      // Check if input contains facility name or facility name contains input
      return facilityNameLower.includes(normalizedLower) || 
             normalizedLower.includes(facilityNameLower);
    }
  );
  if (fuzzyMatch) {
    return fuzzyMatch[0]; // Return the code
  }
  
  // No match found
  return null;
}

/**
 * Generate sample quantity for a facility (for demo purposes)
 * In production, this should come from admin input
 */
function generateSampleQuantity(code: string, status: 'included' | 'excluded'): number {
  // Simple deterministic sample based on code hash
  // This ensures same facility always gets same quantity (for consistency)
  const hash = code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = hash % 100;
  
  // Different ranges for included vs excluded
  if (status === 'included') {
    // Included: 1-10 range
    return (seed % 10) + 1;
  } else {
    // Excluded: 0 (or could be 1-5 to show what would be excluded)
    return 0;
  }
}

/**
 * Merge default template with package overrides
 * ONLY uses facilities from MASTER_FACILITIES - no custom facilities allowed
 * 
 * Contoh penggunaan:
 * 
 * const defaultTemplate = ['transport_pp', 'meal_3x', 'travel_insurance'];
 * const packageInclusions = ['transport_boat', 'snorkeling_gear'];
 * const packageExclusions = ['travel_insurance', 'drink'];
 * 
 * Hasil:
 * - transport_pp: included (dari default)
 * - meal_3x: included (dari default)
 * - travel_insurance: excluded (di-exclude, mengoverride default)
 * - transport_boat: included (dari inclusions)
 * - snorkeling_gear: included (dari inclusions)
 * - drink: excluded (di-exclude, meskipun tidak ada di default)
 * 
 * SEMUA facilities (baik included maupun excluded) akan muncul di hasil akhir!
 */
export function mergeFacilities(
  defaultTemplate: string[],
  packageInclusions: string[] = [],
  packageExclusions: string[] = []
): FacilityDisplayItem[] {
  // Start with all default facilities as included
  const merged: Map<string, FacilityDisplayItem> = new Map();
  
  // Add defaults
  defaultTemplate.forEach((code) => {
    const normalizedCode = normalizeToMasterCode(code);
    if (normalizedCode) {
      const facility = MASTER_FACILITIES[normalizedCode];
      if (facility) {
        merged.set(normalizedCode, {
          ...facility,
          status: 'included',
          quantity: generateSampleQuantity(normalizedCode, 'included'), // Generate sample quantity
          source: 'default',
        });
      }
    }
  });
  
  // Apply package inclusions (overrides or additions)
  // ONLY accept facilities from MASTER_FACILITIES
  packageInclusions.forEach((item) => {
    const masterCode = normalizeToMasterCode(item);
    if (masterCode) {
      const facility = MASTER_FACILITIES[masterCode];
      if (facility) {
        merged.set(masterCode, {
          ...facility,
          status: 'included',
          quantity: generateSampleQuantity(masterCode, 'included'), // Generate sample quantity
          source: merged.has(masterCode) ? 'override' : 'override',
        });
      }
    }
    // If not found in master, ignore it (no custom facilities)
  });
  
  // Apply package exclusions (override to excluded)
  // Exclusions override inclusions - if something is explicitly excluded, it should be excluded
  // IMPORTANT: Exclusions MUST appear in the result, even if not in default template or inclusions
  // ONLY accept facilities from MASTER_FACILITIES
  packageExclusions.forEach((item) => {
    const masterCode = normalizeToMasterCode(item);
    if (masterCode) {
      const facility = MASTER_FACILITIES[masterCode];
      if (facility) {
        // Always set as excluded - this overrides any previous inclusion
        // This ensures excluded items appear in the UI even if they weren't in default/inclusions
        merged.set(masterCode, {
          ...facility,
          status: 'excluded',
          quantity: generateSampleQuantity(masterCode, 'excluded'), // Generate sample quantity for excluded
          source: merged.has(masterCode) ? 'override' : 'override', // Override if existed, otherwise it's new excluded item
        });
      }
    }
    // If not found in master, ignore it (no custom facilities)
  });
  
  // Convert to array - all items are already normalized to master codes
  // IMPORTANT: Map already contains the correct status because:
  // 1. Defaults are added first (status: 'included')
  // 2. Inclusions override defaults (status: 'included')  
  // 3. Exclusions override everything (status: 'excluded') - processed last
  // So merged map already has correct final status for each code
  // Map keys are unique, so no duplicates exist - convert directly to array
  
  const categoriesOrder: FacilityCategory[] = [
    'transport',
    'accommodation',
    'consumption',
    'equipment',
    'activity',
    'ticket',
    'guide',
    'insurance',
    'documentation',
    'other',
  ];
  
  // Convert merged Map to array and sort
  // ALL facilities (both included and excluded) are in the result
  const result = Array.from(merged.values()).sort((a, b) => {
    const aCatIdx = categoriesOrder.indexOf(a.category);
    const bCatIdx = categoriesOrder.indexOf(b.category);
    if (aCatIdx !== bCatIdx) return aCatIdx - bCatIdx;
    // Within same category, sort by status (included first), then by name
    if (a.status !== b.status) {
      return a.status === 'included' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  
  return result;
}
