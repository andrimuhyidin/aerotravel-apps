/**
 * Mock Service Worker (MSW) Handlers
 * Mock API responses for frontend development when backend is not ready
 * 
 * Setup:
 * 1. Install: pnpm add -D msw
 * 2. Setup worker: See mocks/browser.ts and mocks/server.ts
 * 3. Use in tests or development
 */

import { http, HttpResponse } from 'msw';

// Mock data
const mockBookings = [
  {
    id: 'booking-1',
    tripName: 'Paket Wisata Pahawang',
    customerName: 'John Doe',
    status: 'confirmed',
    totalAmount: 500000,
  },
  {
    id: 'booking-2',
    tripName: 'Paket Wisata Raja Ampat',
    customerName: 'Jane Smith',
    status: 'pending',
    totalAmount: 5000000,
  },
];

const mockPackages = [
  {
    id: 'pkg-1',
    name: 'Paket Wisata Pahawang',
    slug: 'pahawang-murah',
    destination: 'Pulau Pahawang, Lampung',
    pricePublish: 500000,
    isPublished: true,
  },
];

export const handlers = [
  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: 3600,
    });
  }),

  // Bookings
  http.get('/api/bookings', () => {
    return HttpResponse.json({
      data: mockBookings,
      total: mockBookings.length,
    });
  }),

  http.get('/api/bookings/:id', ({ params }) => {
    const booking = mockBookings.find((b) => b.id === params.id);
    if (!booking) {
      return HttpResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: booking });
  }),

  http.post('/api/bookings', async ({ request }) => {
    const body = await request.json();
    const newBooking = {
      id: `booking-${Date.now()}`,
      ...(body as Record<string, unknown>),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    mockBookings.push(newBooking as unknown as typeof mockBookings[0]);
    return HttpResponse.json({ data: newBooking }, { status: 201 });
  }),

  // Packages
  http.get('/api/packages', () => {
    return HttpResponse.json({
      data: mockPackages,
      total: mockPackages.length,
    });
  }),

  http.get('/api/packages/:slug', ({ params }) => {
    const pkg = mockPackages.find((p) => p.slug === params.slug);
    if (!pkg) {
      return HttpResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }
    return HttpResponse.json({ data: pkg });
  }),

  // Payment
  http.post('/api/payment', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      success: true,
      token: 'mock-midtrans-token',
      redirectUrl: 'https://app.midtrans.com/snap/v2/vtweb/mock-token',
    });
  }),

  // Chat
  http.post('/api/chat', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      message: 'This is a mock response. Backend API is not ready yet.',
      remaining: 9,
    });
  }),
];

