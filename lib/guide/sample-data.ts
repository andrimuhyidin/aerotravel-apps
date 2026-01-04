/**
 * Sample data for Guide App
 * - Dipakai untuk halaman demo (Trips, Earnings, Ratings)
 * - Juga sebagai fallback manifest jika backend belum punya data
 */

import type { Passenger, TripManifest } from './manifest';

export type SampleTrip = {
  id: string;
  code: string;
  name: string;
  date: string; // ISO date
  guests: number;
  status: string;
};

export type SampleAttendance = {
  tripId: string;
  guideId: string;
  checkInTime?: string;
  checkOutTime?: string;
  isLate: boolean;
};

export type SampleEvidence = {
  id: string;
  tripId: string;
  type: 'photo' | 'receipt';
  label: string;
  url: string;
};

export type SampleExpense = {
  id: string;
  tripId: string;
  category: string;
  description: string;
  amount: number;
};

export type SampleRating = {
  id: string;
  guideId: string;
  tripId: string;
  score: number;
  comment: string;
  customerName: string;
  createdAt: string;
};

export type SampleEarning = {
  id: string;
  guideId: string;
  tripId: string;
  tripName: string;
  date: string;
  baseFee: number;
  bonus: number;
  penalty: number;
  total: number;
};

export const sampleTrips: SampleTrip[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    code: 'AT-PHW-2401',
    name: 'Pahawang Island One Day Trip',
    date: '2024-12-17',
    guests: 12,
    status: 'ongoing',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    code: 'AT-KRA-2402',
    name: 'Krakatau Sunrise Experience',
    date: '2024-12-18',
    guests: 18,
    status: 'upcoming',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    code: 'AT-PHW-2399',
    name: 'Pahawang Weekend Trip',
    date: '2024-12-10',
    guests: 10,
    status: 'completed',
  },
];

export const samplePassengers: Passenger[] = [
  { id: 'pax-1', name: 'Ahmad Fadli', phone: '0812xxxxxxx1', type: 'adult', status: 'pending' },
  { id: 'pax-2', name: 'Siti Rahayu', phone: '0812xxxxxxx2', type: 'adult', status: 'boarded' },
  { id: 'pax-3', name: 'Dewi Lestari', phone: '0812xxxxxxx3', type: 'child', status: 'pending' },
  { id: 'pax-4', name: 'Budi Hartono', phone: '0812xxxxxxx4', type: 'adult', status: 'returned' },
];

export const sampleAttendance: SampleAttendance[] = [
  {
    tripId: sampleTrips[0]?.id ?? 'trip-1',
    guideId: 'guide-001',
    checkInTime: '2024-12-17T06:55:00+07:00',
    checkOutTime: undefined,
    isLate: false,
  },
];

export const sampleEvidence: SampleEvidence[] = [
  {
    id: 'evid-1',
    tripId: sampleTrips[0]?.id ?? 'trip-1',
    type: 'photo',
    label: 'Foto Keberangkatan',
    url: 'https://images.example.com/trips/trip-001/departure.jpg',
  },
];

export const sampleExpenses: SampleExpense[] = [
  {
    id: 'exp-1',
    tripId: sampleTrips[0]?.id ?? 'trip-1',
    category: 'tiket',
    description: 'Penambahan tiket masuk 2 pax walk-in',
    amount: 100000,
  },
];

export const sampleRatings: SampleRating[] = [
  {
    id: 'rate-1',
    guideId: 'guide-001',
    tripId: sampleTrips[2]?.id ?? 'trip-3',
    score: 5,
    comment: 'Guidenya ramah, briefing jelas, foto-fotonya bagus banget!',
    customerName: 'Andi Pratama',
    createdAt: '2024-12-11T12:00:00+07:00',
  },
  {
    id: 'rate-2',
    guideId: 'guide-001',
    tripId: sampleTrips[0]?.id ?? 'trip-1',
    score: 4,
    comment: 'Trip menyenangkan, cuma sedikit delay di keberangkatan.',
    customerName: 'Lina Kartika',
    createdAt: '2024-12-18T09:00:00+07:00',
  },
];

export const sampleEarnings: SampleEarning[] = [
  {
    id: 'earn-1',
    guideId: 'guide-001',
    tripId: sampleTrips[2]?.id ?? 'trip-3',
    tripName: 'Pahawang Weekend Trip',
    date: '2024-12-10',
    baseFee: 350000,
    bonus: 50000,
    penalty: 25000,
    total: 375000,
  },
  {
    id: 'earn-2',
    guideId: 'guide-001',
    tripId: sampleTrips[0]?.id ?? 'trip-1',
    tripName: 'Pahawang Island One Day Trip',
    date: '2024-12-17',
    baseFee: 300000,
    bonus: 0,
    penalty: 0,
    total: 300000,
  },
];

export function buildSampleManifest(tripId: string, tripName: string, date: string): TripManifest {
  const totalPax = samplePassengers.length;
  const boardedCount = samplePassengers.filter(
    (p) => p.status === 'boarded' || p.status === 'returned'
  ).length;
  const returnedCount = samplePassengers.filter((p) => p.status === 'returned').length;

  return {
    tripId,
    tripName,
    date,
    passengers: samplePassengers,
    totalPax,
    boardedCount,
    returnedCount,
    documentationUrl: undefined,
  };
}
