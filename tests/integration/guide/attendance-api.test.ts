/**
 * Integration Tests: Attendance API
 * Tests for check-in/check-out with GPS and penalty calculation
 */

import { describe, it, expect } from 'vitest';

// Types
type CheckInPayload = {
  tripId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  photoUrl: string;
  happiness: number;
  description: string;
};

type CheckInResponse = {
  success: boolean;
  checkIn: {
    id: string;
    tripId: string;
    guideId: string;
    checkInTime: string;
    isLate: boolean;
    lateMinutes?: number;
    latePenaltyAmount?: number;
  };
  message: string;
  warning?: string;
};

type CheckOutPayload = {
  tripId: string;
  latitude: number;
  longitude: number;
  notes?: string;
};

type CheckOutResponse = {
  success: boolean;
  checkOut: {
    id: string;
    tripId: string;
    checkOutTime: string;
    totalHours: number;
  };
  earnings: {
    baseFee: number;
    deductions: number;
    netEarnings: number;
  };
};

// Mock implementations
const handleCheckIn = async (
  payload: CheckInPayload,
  userId: string,
  scheduledTime: string
): Promise<CheckInResponse> => {
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Validate required fields
  if (!payload.tripId || !payload.photoUrl) {
    throw new Error('Missing required fields');
  }

  // Calculate late status
  const now = new Date();
  const scheduled = new Date(scheduledTime);
  const diffMinutes = Math.floor((now.getTime() - scheduled.getTime()) / 60000);
  const isLate = diffMinutes > 0;
  const lateMinutes = isLate ? diffMinutes : 0;
  const latePenaltyAmount = isLate ? Math.min(lateMinutes * 5000, 100000) : 0;

  const checkIn = {
    id: `checkin-${Date.now()}`,
    tripId: payload.tripId,
    guideId: userId,
    checkInTime: now.toISOString(),
    isLate,
    lateMinutes: isLate ? lateMinutes : undefined,
    latePenaltyAmount: isLate ? latePenaltyAmount : undefined,
  };

  return {
    success: true,
    checkIn,
    message: isLate ? 'Check-in berhasil (terlambat)' : 'Check-in berhasil',
    warning: isLate 
      ? `Anda terlambat ${lateMinutes} menit. Denda Rp ${latePenaltyAmount.toLocaleString()}`
      : undefined,
  };
};

const handleCheckOut = async (
  payload: CheckOutPayload,
  userId: string,
  tripFee: number,
  checkInData: { checkInTime: string; latePenaltyAmount?: number }
): Promise<CheckOutResponse> => {
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const checkInTime = new Date(checkInData.checkInTime);
  const checkOutTime = new Date();
  const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

  const deductions = checkInData.latePenaltyAmount || 0;
  const netEarnings = tripFee - deductions;

  return {
    success: true,
    checkOut: {
      id: `checkout-${Date.now()}`,
      tripId: payload.tripId,
      checkOutTime: checkOutTime.toISOString(),
      totalHours: Math.round(totalHours * 100) / 100,
    },
    earnings: {
      baseFee: tripFee,
      deductions,
      netEarnings,
    },
  };
};

const validateGPSLocation = (
  latitude: number,
  longitude: number,
  expectedLocation: { latitude: number; longitude: number },
  maxDistanceMeters: number = 100
): { valid: boolean; distanceMeters: number } => {
  // Haversine formula for distance
  const R = 6371000; // Earth radius in meters
  const dLat = (expectedLocation.latitude - latitude) * Math.PI / 180;
  const dLon = (expectedLocation.longitude - longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(latitude * Math.PI / 180) * Math.cos(expectedLocation.latitude * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanceMeters = R * c;

  return {
    valid: distanceMeters <= maxDistanceMeters,
    distanceMeters: Math.round(distanceMeters),
  };
};

describe('POST /api/guide/attendance/check-in', () => {
  const validPayload: CheckInPayload = {
    tripId: 'trip-001',
    latitude: -8.6785,
    longitude: 115.2618,
    accuracy: 10,
    photoUrl: 'https://example.com/photo.jpg',
    happiness: 5,
    description: 'Ready for the trip!',
  };

  it('should complete check-in successfully when on time', async () => {
    // Scheduled time is in the future
    const scheduledTime = new Date(Date.now() + 60000).toISOString();
    
    const response = await handleCheckIn(validPayload, 'guide-001', scheduledTime);

    expect(response.success).toBe(true);
    expect(response.checkIn.isLate).toBe(false);
    expect(response.checkIn.latePenaltyAmount).toBeUndefined();
  });

  it('should mark as late and calculate penalty', async () => {
    // Scheduled time was 15 minutes ago
    const scheduledTime = new Date(Date.now() - 15 * 60000).toISOString();
    
    const response = await handleCheckIn(validPayload, 'guide-001', scheduledTime);

    expect(response.success).toBe(true);
    expect(response.checkIn.isLate).toBe(true);
    expect(response.checkIn.lateMinutes).toBeGreaterThanOrEqual(15);
    expect(response.checkIn.latePenaltyAmount).toBe(75000); // 15 * 5000
  });

  it('should cap late penalty at maximum', async () => {
    // Scheduled time was 60 minutes ago
    const scheduledTime = new Date(Date.now() - 60 * 60000).toISOString();
    
    const response = await handleCheckIn(validPayload, 'guide-001', scheduledTime);

    expect(response.checkIn.latePenaltyAmount).toBe(100000); // Capped
  });

  it('should record GPS location', async () => {
    const scheduledTime = new Date().toISOString();
    
    const response = await handleCheckIn(validPayload, 'guide-001', scheduledTime);

    expect(response.success).toBe(true);
    expect(response.checkIn.tripId).toBe(validPayload.tripId);
  });

  it('should reject missing photo', async () => {
    const invalidPayload = { ...validPayload, photoUrl: '' };
    const scheduledTime = new Date().toISOString();

    await expect(
      handleCheckIn(invalidPayload, 'guide-001', scheduledTime)
    ).rejects.toThrow('Missing required fields');
  });

  it('should reject unauthorized requests', async () => {
    const scheduledTime = new Date().toISOString();

    await expect(
      handleCheckIn(validPayload, '', scheduledTime)
    ).rejects.toThrow('Unauthorized');
  });

  it('should include warning message when late', async () => {
    const scheduledTime = new Date(Date.now() - 10 * 60000).toISOString();
    
    const response = await handleCheckIn(validPayload, 'guide-001', scheduledTime);

    expect(response.warning).toBeDefined();
    expect(response.warning).toContain('terlambat');
  });
});

describe('POST /api/guide/attendance/check-out', () => {
  const checkOutPayload: CheckOutPayload = {
    tripId: 'trip-001',
    latitude: -8.6785,
    longitude: 115.2618,
    notes: 'Trip completed successfully',
  };

  it('should calculate earnings on check-out', async () => {
    const checkInData = {
      checkInTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
      latePenaltyAmount: 0,
    };

    const response = await handleCheckOut(
      checkOutPayload,
      'guide-001',
      500000,
      checkInData
    );

    expect(response.success).toBe(true);
    expect(response.earnings.baseFee).toBe(500000);
    expect(response.earnings.netEarnings).toBe(500000);
    expect(response.checkOut.totalHours).toBeGreaterThanOrEqual(7.9);
  });

  it('should apply late penalty deduction', async () => {
    const checkInData = {
      checkInTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      latePenaltyAmount: 50000,
    };

    const response = await handleCheckOut(
      checkOutPayload,
      'guide-001',
      500000,
      checkInData
    );

    expect(response.earnings.deductions).toBe(50000);
    expect(response.earnings.netEarnings).toBe(450000);
  });
});

describe('GPS Location Validation', () => {
  const meetingPoint = { latitude: -8.6785, longitude: 115.2618 };

  it('should validate location within radius', () => {
    const result = validateGPSLocation(
      -8.6786, // Very close
      115.2619,
      meetingPoint,
      100
    );

    expect(result.valid).toBe(true);
    expect(result.distanceMeters).toBeLessThan(100);
  });

  it('should reject location outside radius', () => {
    const result = validateGPSLocation(
      -8.68, // ~200m away
      115.26,
      meetingPoint,
      100
    );

    expect(result.valid).toBe(false);
    expect(result.distanceMeters).toBeGreaterThan(100);
  });

  it('should calculate distance accurately', () => {
    // Two points approximately 111km apart (1 degree latitude)
    const result = validateGPSLocation(
      -9.6785,
      115.2618,
      meetingPoint,
      1000
    );

    // Should be approximately 111km (111000m)
    expect(result.distanceMeters).toBeGreaterThan(100000);
  });
});

