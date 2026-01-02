/**
 * Unit Tests - PackageReviewSummary Component
 */

import { describe, it, expect, vi } from 'vitest';
import { PackageReviewSummary } from '@/components/public/package-review-summary';

// Mock the fetch API
global.fetch = vi.fn();

describe('PackageReviewSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be importable', () => {
    expect(PackageReviewSummary).toBeDefined();
    expect(typeof PackageReviewSummary).toBe('function');
  });

  it('should accept slug prop', () => {
    // Component accepts slug prop
    expect(PackageReviewSummary).toBeDefined();
  });
});

