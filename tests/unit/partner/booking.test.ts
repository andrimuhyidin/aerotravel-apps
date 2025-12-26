/**
 * Unit Tests: Partner Booking Logic
 */

import { describe, it, expect } from 'vitest';
import { calculateRefund, canCancelBooking } from '@/lib/partner/refund-calculator';

describe('Refund Calculator', () => {
  describe('calculateRefund', () => {
    it('should return full refund for 7+ days before trip', () => {
      const tripDate = new Date();
      tripDate.setDate(tripDate.getDate() + 10);
      
      const result = calculateRefund(tripDate.toISOString().split('T')[0]!, 1000000);
      
      expect(result.refundable).toBe(true);
      expect(result.refundPercentage).toBe(100);
      expect(result.refundAmount).toBe(1000000);
    });

    it('should return 50% refund for 3-7 days before trip', () => {
      const tripDate = new Date();
      tripDate.setDate(tripDate.getDate() + 5);
      
      const result = calculateRefund(tripDate.toISOString().split('T')[0]!, 1000000);
      
      expect(result.refundable).toBe(true);
      expect(result.refundPercentage).toBe(50);
      expect(result.refundAmount).toBe(500000);
    });

    it('should return no refund for less than 3 days before trip', () => {
      const tripDate = new Date();
      tripDate.setDate(tripDate.getDate() + 2);
      
      const result = calculateRefund(tripDate.toISOString().split('T')[0]!, 1000000);
      
      expect(result.refundable).toBe(false);
      expect(result.refundPercentage).toBe(0);
      expect(result.refundAmount).toBe(0);
    });

    it('should return no refund for past trip', () => {
      const tripDate = new Date();
      tripDate.setDate(tripDate.getDate() - 1);
      
      const result = calculateRefund(tripDate.toISOString().split('T')[0]!, 1000000);
      
      expect(result.refundable).toBe(false);
      expect(result.refundPercentage).toBe(0);
      expect(result.refundAmount).toBe(0);
    });
  });

  describe('canCancelBooking', () => {
    it('should allow cancellation for pending_payment status', () => {
      const tripDate = new Date();
      tripDate.setDate(tripDate.getDate() + 10);
      
      const result = canCancelBooking(tripDate.toISOString().split('T')[0]!, 'pending_payment');
      
      expect(result.canCancel).toBe(true);
    });

    it('should allow cancellation for paid status', () => {
      const tripDate = new Date();
      tripDate.setDate(tripDate.getDate() + 10);
      
      const result = canCancelBooking(tripDate.toISOString().split('T')[0]!, 'paid');
      
      expect(result.canCancel).toBe(true);
    });

    it('should not allow cancellation for completed status', () => {
      const tripDate = new Date();
      tripDate.setDate(tripDate.getDate() + 10);
      
      const result = canCancelBooking(tripDate.toISOString().split('T')[0]!, 'completed');
      
      expect(result.canCancel).toBe(false);
    });

    it('should not allow cancellation for past trip', () => {
      const tripDate = new Date();
      tripDate.setDate(tripDate.getDate() - 1);
      
      const result = canCancelBooking(tripDate.toISOString().split('T')[0]!, 'paid');
      
      expect(result.canCancel).toBe(false);
    });
  });
});

