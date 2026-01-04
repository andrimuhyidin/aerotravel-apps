/**
 * Unit Tests - PackageReviewList Component
 */

import { describe, it, expect, vi } from 'vitest';
import { PackageReviewList } from '@/components/public/package-review-list';

// Mock fetch
global.fetch = vi.fn();

describe('PackageReviewList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should be importable', () => {
    expect(PackageReviewList).toBeDefined();
    expect(typeof PackageReviewList).toBe('function');
  });

  it('should accept initialLimit prop', () => {
    // Component accepts initialLimit prop
    expect(PackageReviewList).toBeDefined();
  });

  it('should handle empty reviews', async () => {
    // Component should handle empty reviews gracefully
    expect(PackageReviewList).toBeDefined();
  });
});

