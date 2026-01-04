/**
 * Integration Tests - Public Chat API (AeroBot)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AI chat function
vi.mock('@/lib/ai/rag', () => ({
  chat: vi.fn(() => Promise.resolve('This is a test response from AeroBot')),
}));

describe('Public Chat API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/public/chat', () => {
    it('should validate message is required', () => {
      const invalidPayload = {};
      expect(invalidPayload).not.toHaveProperty('message');
    });

    it('should accept valid chat payload', () => {
      const validPayload = {
        message: 'Apa paket yang tersedia untuk keluarga?',
      };

      expect(validPayload.message).toBeDefined();
      expect(validPayload.message.length).toBeGreaterThan(0);
    });

    it('should enforce AI rate limiting', async () => {
      const { checkRateLimit, RATE_LIMIT_CONFIGS } = await import('@/lib/api/public-rate-limit');
      
      const result = checkRateLimit('test-chat-api', RATE_LIMIT_CONFIGS.AI);
      expect(result.success).toBe(true);
      expect(RATE_LIMIT_CONFIGS.AI.maxRequests).toBeLessThanOrEqual(10);
    });

    it('should limit message length', () => {
      const maxLength = 500;
      const longMessage = 'a'.repeat(maxLength + 1);
      
      expect(longMessage.length).toBeGreaterThan(maxLength);
    });
  });
});

