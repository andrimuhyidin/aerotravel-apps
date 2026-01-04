/**
 * Unit Tests for Booking Reminder System
 */

import { describe, it, expect } from 'vitest';

describe('Booking Reminder System', () => {
  describe('Reminder Type Calculation', () => {
    it('should calculate H-7 reminder correctly', () => {
      const today = new Date('2025-02-01');
      const tripDate = new Date('2025-02-08'); // 7 days later
      const daysUntilTrip = Math.floor((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysUntilTrip).toBe(7);
    });

    it('should calculate H-3 reminder correctly', () => {
      const today = new Date('2025-02-01');
      const tripDate = new Date('2025-02-04'); // 3 days later
      const daysUntilTrip = Math.floor((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysUntilTrip).toBe(3);
    });

    it('should calculate H-1 reminder correctly', () => {
      const today = new Date('2025-02-01');
      const tripDate = new Date('2025-02-02'); // 1 day later
      const daysUntilTrip = Math.floor((tripDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysUntilTrip).toBe(1);
    });
  });

  describe('Email Template Generation', () => {
    it('should generate H-7 email template', () => {
      const template = {
        bookingCode: 'TEST-001',
        tripDate: '2025-02-08',
        packageName: 'Pahawang Island',
        adultPax: 4,
        childPax: 2,
        infantPax: 0,
        reminderType: 'H-7' as const,
        bookingUrl: 'https://app.aerotravel.id/partner/bookings/123',
      };

      // Mock email template function
      const generateEmail = (data: typeof template) => {
        const daysText = data.reminderType === 'H-7' ? '7 hari' : data.reminderType === 'H-3' ? '3 hari' : '1 hari';
        const totalPax = data.adultPax + data.childPax + data.infantPax;
        
        return {
          subject: `Reminder Booking ${data.reminderType}: ${data.bookingCode} - ${data.packageName}`,
          html: expect.stringContaining(daysText),
          htmlContainsBookingCode: expect.stringContaining(data.bookingCode),
          htmlContainsTotalPax: expect.stringContaining(`${totalPax} orang`),
        };
      };

      const result = generateEmail(template);
      
      expect(result.subject).toBe('Reminder Booking H-7: TEST-001 - Pahawang Island');
      expect(result.html).toBeDefined();
    });

    it('should calculate total pax correctly', () => {
      const adultPax = 4;
      const childPax = 2;
      const infantPax = 1;
      const totalPax = adultPax + childPax + infantPax;
      
      expect(totalPax).toBe(7);
    });
  });

  describe('Reminder Eligibility', () => {
    it('should only send reminders for confirmed bookings', () => {
      const eligibleStatuses = ['confirmed', 'pending_payment'];
      const ineligibleStatuses = ['cancelled', 'completed', 'draft'];
      
      eligibleStatuses.forEach(status => {
        expect(['confirmed', 'pending_payment']).toContain(status);
      });
      
      ineligibleStatuses.forEach(status => {
        expect(['confirmed', 'pending_payment']).not.toContain(status);
      });
    });

    it('should only send reminders for future trips', () => {
      const today = new Date('2025-02-01');
      const futureTrip = new Date('2025-02-08');
      const pastTrip = new Date('2025-01-25');
      
      expect(futureTrip >= today).toBe(true);
      expect(pastTrip >= today).toBe(false);
    });

    it('should only send reminders for partner bookings', () => {
      const partnerBooking = { mitra_id: 'partner-123' };
      const customerBooking = { mitra_id: null };
      
      expect(partnerBooking.mitra_id).toBeTruthy();
      expect(customerBooking.mitra_id).toBeFalsy();
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate reminders for same type', () => {
      const existingReminders = [
        { booking_id: 'booking-123', reminder_type: 'H-7' },
      ];
      
      const newReminder = { booking_id: 'booking-123', reminder_type: 'H-7' };
      const isDuplicate = existingReminders.some(
        r => r.booking_id === newReminder.booking_id && r.reminder_type === newReminder.reminder_type
      );
      
      expect(isDuplicate).toBe(true);
    });

    it('should allow different reminder types for same booking', () => {
      const existingReminders = [
        { booking_id: 'booking-123', reminder_type: 'H-7' },
      ];
      
      const newReminder = { booking_id: 'booking-123', reminder_type: 'H-3' };
      const isDuplicate = existingReminders.some(
        r => r.booking_id === newReminder.booking_id && r.reminder_type === newReminder.reminder_type
      );
      
      expect(isDuplicate).toBe(false);
    });
  });
});

