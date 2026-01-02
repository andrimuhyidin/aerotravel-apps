/**
 * Unit Tests: Partner Broadcasts API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';

const createBroadcastSchema = z.object({
  name: z.string().min(3),
  templateName: z.string().min(1),
  audienceType: z.enum(['all', 'segment', 'custom']),
  segment: z.string().optional(),
  recipientIds: z.array(z.string()).optional(),
  recipientCount: z.number().min(1),
  sendNow: z.boolean(),
  scheduledAt: z.string().optional().nullable(),
});

describe('Broadcasts API Validation', () => {
  describe('createBroadcastSchema', () => {
    it('should validate valid broadcast data', () => {
      const validData = {
        name: 'Promo Lebaran',
        templateName: 'promo-template',
        audienceType: 'all' as const,
        recipientCount: 100,
        sendNow: true,
      };

      const result = createBroadcastSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 3 characters', () => {
      const invalidData = {
        name: 'AB',
        templateName: 'template',
        audienceType: 'all' as const,
        recipientCount: 100,
        sendNow: true,
      };

      const result = createBroadcastSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject recipientCount less than 1', () => {
      const invalidData = {
        name: 'Valid Name',
        templateName: 'template',
        audienceType: 'all' as const,
        recipientCount: 0,
        sendNow: true,
      };

      const result = createBroadcastSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate segment for segment audience type', () => {
      const validData = {
        name: 'Segment Broadcast',
        templateName: 'template',
        audienceType: 'segment' as const,
        segment: 'vip',
        recipientCount: 50,
        sendNow: false,
        scheduledAt: '2024-12-31T10:00:00Z',
      };

      const result = createBroadcastSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate recipientIds for custom audience type', () => {
      const validData = {
        name: 'Custom Broadcast',
        templateName: 'template',
        audienceType: 'custom' as const,
        recipientIds: ['id1', 'id2', 'id3'],
        recipientCount: 3,
        sendNow: true,
      };

      const result = createBroadcastSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid audienceType', () => {
      const invalidData = {
        name: 'Invalid Type',
        templateName: 'template',
        audienceType: 'invalid' as any,
        recipientCount: 100,
        sendNow: true,
      };

      const result = createBroadcastSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

