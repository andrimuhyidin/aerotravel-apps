/**
 * Validation Settings Types & Defaults
 * Client-safe - no server imports
 */

// ============================================
// TYPES
// ============================================

export interface ValidationSettings {
  packageCodeMinLength: number;
  packageCodeMaxLength: number;
  packageNameMinLength: number;
  packageNameMaxLength: number;
  slugMinLength: number;
  slugMaxLength: number;
  shortDescriptionMaxLength: number;
  minPaxMinimum: number;
  maxPaxMinimum: number;
}

// ============================================
// DEFAULTS
// ============================================

export const DEFAULT_VALIDATION_SETTINGS: ValidationSettings = {
  packageCodeMinLength: 3,
  packageCodeMaxLength: 20,
  packageNameMinLength: 3,
  packageNameMaxLength: 200,
  slugMinLength: 3,
  slugMaxLength: 200,
  shortDescriptionMaxLength: 500,
  minPaxMinimum: 1,
  maxPaxMinimum: 1,
};

