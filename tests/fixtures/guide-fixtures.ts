/**
 * Guide App Test Fixtures
 * Mock data for E2E and unit tests
 */

// User fixtures
export const mockGuide = {
  id: 'guide-001',
  email: 'guide@test.com',
  name: 'John Guide',
  phone: '+6281234567890',
  branch_id: 'branch-001',
  is_verified: true,
  average_rating: 4.8,
  total_trips: 150,
  certifications: [
    {
      id: 'cert-001',
      type: 'tour_guide',
      name: 'Sertifikasi Tour Guide Nasional',
      issued_by: 'BNSP',
      valid_until: '2027-12-31',
      status: 'valid',
    },
  ],
};

export const mockTrip = {
  id: 'trip-001',
  code: 'TRP-001',
  name: 'Bali Adventure Tour',
  status: 'upcoming' as const,
  date: new Date().toISOString().split('T')[0],
  time: '08:00',
  meeting_point: 'Hotel Lobby',
  total_pax: 8,
  guests: 8,
  assignment_status: 'confirmed' as const,
  fee_amount: 500000,
  created_at: new Date().toISOString(),
};

export const mockTripOngoing = {
  ...mockTrip,
  id: 'trip-002',
  code: 'TRP-002',
  status: 'ongoing' as const,
};

export const mockTripPendingConfirmation = {
  ...mockTrip,
  id: 'trip-003',
  code: 'TRP-003',
  assignment_status: 'pending_confirmation' as const,
  confirmation_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
};

// Manifest fixtures
export const mockPassenger = {
  id: 'pax-001',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+6281234567891',
  passenger_type: 'adult' as const,
  gender: 'female' as const,
  nationality: 'Indonesia',
  allergy: null,
  special_needs: null,
  consent_status: 'signed' as const,
  consent_signed_at: new Date().toISOString(),
};

export const mockPassengerChild = {
  ...mockPassenger,
  id: 'pax-002',
  name: 'Jimmy Junior',
  passenger_type: 'child' as const,
  age: 10,
  parent_id: 'pax-001',
};

export const mockPassengerWithAllergy = {
  ...mockPassenger,
  id: 'pax-003',
  name: 'Bob Smith',
  allergy: 'Seafood, Nuts',
  gender: 'male' as const,
};

// Attendance fixtures
export const mockCheckIn = {
  id: 'checkin-001',
  trip_id: 'trip-001',
  guide_id: 'guide-001',
  check_in_time: new Date().toISOString(),
  latitude: -8.6785,
  longitude: 115.2618,
  accuracy: 10,
  photo_url: 'https://example.com/photo.jpg',
  happiness: 5,
  description: 'Ready for the trip!',
  is_late: false,
  late_penalty_amount: 0,
};

export const mockCheckInLate = {
  ...mockCheckIn,
  id: 'checkin-002',
  is_late: true,
  late_penalty_amount: 50000,
  late_minutes: 15,
};

// SOS fixtures
export const mockSosAlert = {
  id: 'sos-001',
  guide_id: 'guide-001',
  trip_id: 'trip-001',
  latitude: -8.6785,
  longitude: 115.2618,
  incident_type: 'medical' as const,
  message: 'Passenger needs medical attention',
  status: 'active' as const,
  created_at: new Date().toISOString(),
  streaming_active: true,
};

// Wallet fixtures
export const mockWalletBalance = {
  available: 1500000,
  pending: 250000,
  total_earned: 15000000,
  total_withdrawn: 13250000,
};

export const mockTransaction = {
  id: 'tx-001',
  type: 'earning' as const,
  amount: 500000,
  description: 'Trip fee: Bali Adventure Tour',
  trip_id: 'trip-001',
  trip_code: 'TRP-001',
  status: 'completed' as const,
  created_at: new Date().toISOString(),
};

export const mockTip = {
  id: 'tip-001',
  amount: 50000,
  from_passenger: 'Jane Doe',
  trip_id: 'trip-001',
  created_at: new Date().toISOString(),
};

// Notification fixtures
export const mockNotification = {
  id: 'notif-001',
  type: 'trip_assignment' as const,
  title: 'New Trip Assignment',
  body: 'You have been assigned to TRP-004',
  read: false,
  created_at: new Date().toISOString(),
  action_url: '/guide/trips/TRP-004',
};

// Document fixtures
export const mockDocument = {
  id: 'doc-001',
  document_type: 'ktp' as const,
  file_url: 'https://example.com/ktp.jpg',
  verification_status: 'verified' as const,
  expiry_date: '2030-12-31',
  created_at: new Date().toISOString(),
};

// Location fixtures
export const mockLocation = {
  latitude: -8.6785,
  longitude: 115.2618,
  accuracy: 10,
  altitude: 15,
  heading: 180,
  speed: 0,
};

export const mockMeetingPoint = {
  id: 'mp-001',
  name: 'Hotel Lobby',
  coordinates: {
    latitude: -8.6785,
    longitude: 115.2618,
  },
  radiusMeters: 50,
};

// API Response fixtures
export const mockApiSuccess = <T>(data: T) => ({
  success: true,
  data,
});

export const mockApiError = (message: string, status = 400) => ({
  success: false,
  error: message,
  status,
});

// Dates for testing
export const testDates = {
  today: new Date().toISOString().split('T')[0],
  tomorrow: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  nextWeek: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  yesterday: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

