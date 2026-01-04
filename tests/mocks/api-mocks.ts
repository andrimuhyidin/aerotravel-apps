/**
 * API Mocks for Guide App Tests
 * Mock responses for API endpoints
 */

import {
  mockGuide,
  mockTrip,
  mockTripOngoing,
  mockTripPendingConfirmation,
  mockPassenger,
  mockPassengerChild,
  mockPassengerWithAllergy,
  mockCheckIn,
  mockSosAlert,
  mockWalletBalance,
  mockTransaction,
  mockNotification,
  mockDocument,
} from '../fixtures/guide-fixtures';

// Trip API mocks
export const mockTripsResponse = {
  trips: [mockTrip, mockTripOngoing, mockTripPendingConfirmation],
};

export const mockTripDetailResponse = {
  trip: mockTrip,
  manifest: [mockPassenger, mockPassengerChild, mockPassengerWithAllergy],
  itinerary: [
    { id: 'it-001', time: '08:00', activity: 'Pickup from hotel', location: 'Hotel Lobby' },
    { id: 'it-002', time: '09:00', activity: 'Visit Temple', location: 'Uluwatu Temple' },
    { id: 'it-003', time: '12:00', activity: 'Lunch', location: 'Seafood Restaurant' },
  ],
  guides: [mockGuide],
  equipment: [
    { id: 'eq-001', name: 'First Aid Kit', quantity: 1, status: 'ready' },
    { id: 'eq-002', name: 'Megaphone', quantity: 1, status: 'ready' },
  ],
};

// Manifest API mocks
export const mockManifestResponse = {
  manifest: [mockPassenger, mockPassengerChild, mockPassengerWithAllergy],
  total_pax: 3,
  consent_stats: {
    signed: 2,
    pending: 1,
    total: 3,
  },
};

// Attendance API mocks
export const mockCheckInResponse = {
  success: true,
  check_in: mockCheckIn,
  message: 'Check-in successful',
};

export const mockCheckInLateResponse = {
  success: true,
  check_in: {
    ...mockCheckIn,
    is_late: true,
    late_penalty_amount: 50000,
  },
  message: 'Check-in successful (late)',
  warning: 'You are 15 minutes late. A penalty of Rp 50,000 will be deducted.',
};

// SOS API mocks
export const mockSosResponse = {
  success: true,
  alert: mockSosAlert,
  notifications_sent: {
    whatsapp: true,
    email: true,
    push: true,
  },
};

// Wallet API mocks
export const mockWalletResponse = {
  balance: mockWalletBalance,
  recent_transactions: [mockTransaction],
  pending_payouts: [],
};

// Notifications API mocks
export const mockNotificationsResponse = {
  notifications: [mockNotification],
  unread_count: 1,
};

// Documents API mocks
export const mockDocumentsResponse = {
  documents: [mockDocument],
  summary: {
    total: 1,
    verified: 1,
    required: 4,
    required_verified: 1,
    all_required_verified: false,
  },
};

// Guide profile API mocks
export const mockGuideProfileResponse = {
  guide: mockGuide,
  stats: {
    total_trips: 150,
    completed_trips: 145,
    average_rating: 4.8,
    total_reviews: 120,
    earnings_this_month: 2500000,
  },
};

// AI Insights mocks
export const mockAiInsightsResponse = {
  insights: {
    risk_factors: [
      { type: 'weather', level: 'low', description: 'Clear skies expected' },
      { type: 'traffic', level: 'medium', description: 'Moderate traffic expected' },
    ],
    suggestions: [
      'Consider earlier departure to avoid traffic',
      'Bring extra water due to hot weather',
    ],
    passenger_notes: [
      'One passenger has seafood allergy - avoid seafood lunch option',
    ],
  },
  resource_suggestions: {
    equipment: ['Extra first aid supplies', 'Cooling towels'],
    staff: [],
  },
};

// Error responses
export const mockUnauthorizedResponse = {
  error: 'Unauthorized',
  status: 401,
};

export const mockNotFoundResponse = {
  error: 'Not found',
  status: 404,
};

export const mockRateLimitResponse = {
  error: 'Too many requests. Try again in 60 seconds.',
  status: 429,
};

export const mockServerErrorResponse = {
  error: 'Internal server error',
  status: 500,
};

// MSW handlers type for future MSW integration
export type MockApiHandlers = {
  trips: typeof mockTripsResponse;
  tripDetail: typeof mockTripDetailResponse;
  manifest: typeof mockManifestResponse;
  checkIn: typeof mockCheckInResponse;
  sos: typeof mockSosResponse;
  wallet: typeof mockWalletResponse;
  notifications: typeof mockNotificationsResponse;
  documents: typeof mockDocumentsResponse;
  profile: typeof mockGuideProfileResponse;
  aiInsights: typeof mockAiInsightsResponse;
};

