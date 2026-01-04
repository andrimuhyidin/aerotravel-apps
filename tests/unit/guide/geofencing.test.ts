/**
 * Geofencing Unit Tests
 */

import { describe, expect, it } from 'vitest';

import { formatDistance } from '@/lib/guide/attendance';
import {
    calculateDistance,
    Coordinates,
    isWithinGeofence,
    MeetingPoint,
    validateCheckIn,
} from '@/lib/guide/geofencing';

describe('Geofencing', () => {
  const dermaga: MeetingPoint = {
    id: 'dermaga-ketapang',
    name: 'Dermaga Ketapang',
    coordinates: { latitude: -5.4667, longitude: 105.2833 },
    radiusMeters: 50,
  };

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1: Coordinates = { latitude: -5.4667, longitude: 105.2833 };
      const point2: Coordinates = { latitude: -5.4668, longitude: 105.2834 };

      const distance = calculateDistance(point1, point2);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(100); // Should be within 100m
    });

    it('should return 0 for same point', () => {
      const point: Coordinates = { latitude: -5.4667, longitude: 105.2833 };
      const distance = calculateDistance(point, point);
      expect(distance).toBe(0);
    });
  });

  describe('isWithinGeofence', () => {
    it('should return true when within radius', () => {
      const guideLocation: Coordinates = { latitude: -5.4667, longitude: 105.2833 };
      expect(isWithinGeofence(guideLocation, dermaga)).toBe(true);
    });

    it('should return false when outside radius', () => {
      const guideLocation: Coordinates = { latitude: -5.4700, longitude: 105.2900 }; // Far away
      expect(isWithinGeofence(guideLocation, dermaga)).toBe(false);
    });
  });

  describe('validateCheckIn', () => {
    it('should allow check-in when within radius', () => {
      const guideLocation: Coordinates = { latitude: -5.4667, longitude: 105.2833 };
      const result = validateCheckIn(guideLocation, dermaga);

      expect(result.allowed).toBe(true);
      expect(result.meetingPoint).not.toBeNull();
    });

    it('should deny check-in when outside radius', () => {
      const guideLocation: Coordinates = { latitude: -5.5000, longitude: 105.3000 };
      const result = validateCheckIn(guideLocation, dermaga);

      expect(result.allowed).toBe(false);
      expect(result.distanceMeters).toBeGreaterThan(50);
    });
  });

  describe('formatDistance', () => {
    it('should format meters correctly', () => {
      expect(formatDistance(50)).toBe('50m');
      expect(formatDistance(999)).toBe('999m');
    });

    it('should format kilometers correctly', () => {
      expect(formatDistance(1000)).toBe('1.0km');
      expect(formatDistance(1500)).toBe('1.5km');
    });
  });
});
