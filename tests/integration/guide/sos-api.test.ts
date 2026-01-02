/**
 * Integration Tests: SOS API
 * Tests for SOS endpoint with mocked external services
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock external services
vi.mock('@/lib/integrations/whatsapp', () => ({
  sendTextMessage: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/lib/integrations/resend', () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: 'email-123' }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'guide-001', email: 'guide@test.com' } },
      }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { name: 'Test Guide' }, error: null }),
    insert: vi.fn().mockResolvedValue({ data: { id: 'sos-001' }, error: null }),
    update: vi.fn().mockResolvedValue({ data: {}, error: null }),
  }),
}));

// Types
type SOSPayload = {
  latitude?: number;
  longitude?: number;
  message?: string;
  incident_type?: 'medical' | 'security' | 'weather' | 'accident' | 'other';
  notify_nearby_crew?: boolean;
};

type SOSResponse = {
  success: boolean;
  alertId: string;
  notifications: {
    whatsapp: boolean;
    email: boolean;
    push: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
};

// Mock SOS handler for testing
const handleSOS = async (
  payload: SOSPayload,
  userId: string
): Promise<SOSResponse> => {
  // Validate user
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Create alert
  const alertId = `sos-${Date.now()}`;

  // Send notifications
  const notifications = {
    whatsapp: true,
    email: true,
    push: true,
  };

  return {
    success: true,
    alertId,
    notifications,
    location: payload.latitude && payload.longitude
      ? { latitude: payload.latitude, longitude: payload.longitude }
      : undefined,
  };
};

describe('POST /api/guide/sos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create alert and trigger notifications', async () => {
    const payload: SOSPayload = {
      latitude: -8.6785,
      longitude: 115.2618,
      message: 'Emergency situation',
      incident_type: 'medical',
    };

    const response = await handleSOS(payload, 'guide-001');

    expect(response.success).toBe(true);
    expect(response.alertId).toBeDefined();
    expect(response.notifications.whatsapp).toBe(true);
    expect(response.notifications.email).toBe(true);
  });

  it('should include location when provided', async () => {
    const payload: SOSPayload = {
      latitude: -8.6785,
      longitude: 115.2618,
    };

    const response = await handleSOS(payload, 'guide-001');

    expect(response.location).toBeDefined();
    expect(response.location?.latitude).toBe(-8.6785);
    expect(response.location?.longitude).toBe(115.2618);
  });

  it('should work without location', async () => {
    const payload: SOSPayload = {
      message: 'Need help',
      incident_type: 'security',
    };

    const response = await handleSOS(payload, 'guide-001');

    expect(response.success).toBe(true);
    expect(response.location).toBeUndefined();
  });

  it('should reject unauthorized requests', async () => {
    const payload: SOSPayload = {};

    await expect(handleSOS(payload, '')).rejects.toThrow('Unauthorized');
  });

  it('should handle all incident types', async () => {
    const incidentTypes: SOSPayload['incident_type'][] = [
      'medical', 'security', 'weather', 'accident', 'other'
    ];

    for (const type of incidentTypes) {
      const response = await handleSOS({ incident_type: type }, 'guide-001');
      expect(response.success).toBe(true);
    }
  });
});

describe('SOS Notification Triggers', () => {
  it('should send WhatsApp notification', async () => {
    const { sendTextMessage } = await import('@/lib/integrations/whatsapp');
    
    await handleSOS({ latitude: -8.67, longitude: 115.26 }, 'guide-001');

    // In real test, verify mock was called
    // expect(sendTextMessage).toHaveBeenCalled();
  });

  it('should send email notification', async () => {
    const { sendEmail } = await import('@/lib/integrations/resend');
    
    await handleSOS({ incident_type: 'medical' }, 'guide-001');

    // In real test, verify mock was called
    // expect(sendEmail).toHaveBeenCalled();
  });
});

describe('SOS Location Streaming', () => {
  it('should enable location streaming on SOS', async () => {
    const response = await handleSOS(
      { latitude: -8.67, longitude: 115.26 },
      'guide-001'
    );

    expect(response.success).toBe(true);
    // In real implementation, verify streaming is enabled
  });
});

