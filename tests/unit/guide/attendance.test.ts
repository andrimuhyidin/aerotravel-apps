/**
 * Attendance Unit Tests
 */

import { describe, expect, it } from 'vitest';

import { formatDistance, performCheckIn, performCheckOut } from '@/lib/guide/attendance';
import { Coordinates, MeetingPoint } from '@/lib/guide/geofencing';

describe('Attendance', () => {
  const validLocation: Coordinates = { latitude: -5.4667, longitude: 105.2833 };
  const dermaga: MeetingPoint = {
    id: 'dermaga-ketapang',
    name: 'Dermaga Ketapang',
    coordinates: { latitude: -5.4667, longitude: 105.2833 },
    radiusMeters: 50,
  };

  describe('performCheckIn', () => {
    it('should successfully check in when within geofence', async () => {
      const result = await performCheckIn('trip-1', 'guide-1', validLocation, dermaga.id);
      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('performCheckOut', () => {
    it('should successfully check out', async () => {
      const result = await performCheckOut('trip-1', 'guide-1', validLocation);
      expect(result.success).toBe(true);
      expect(result.message).toContain('berhasil');
    });
  });

  describe('formatDistance', () => {
    it('should format meters', () => {
      expect(formatDistance(25)).toBe('25m');
    });

    it('should format kilometers', () => {
      expect(formatDistance(2500)).toBe('2.5km');
    });
  });
});
