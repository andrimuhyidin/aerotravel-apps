# Guide App API Reference

## Overview

This document provides a comprehensive reference for all Guide App API endpoints.

**Base URL:** `/api/guide`

**Authentication:** All endpoints require authentication via Supabase Auth. Include the auth token in the request headers.

**Rate Limiting:** AI and upload endpoints are rate-limited. See individual endpoints for limits.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Trips](#trips)
3. [Attendance](#attendance)
4. [Manifest](#manifest)
5. [SOS Emergency](#sos-emergency)
6. [Wallet](#wallet)
7. [Documents](#documents)
8. [Notifications](#notifications)
9. [AI Endpoints](#ai-endpoints)
10. [Error Handling](#error-handling)

---

## Authentication

All API requests must include a valid Supabase session token.

### Headers

```http
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

### Error Response (401)

```json
{
  "error": "Unauthorized"
}
```

---

## Trips

### GET /api/guide/trips

Get all trips assigned to the current guide.

**Rate Limit:** None

**Response:**
```json
{
  "trips": [
    {
      "id": "uuid",
      "code": "TRP-001",
      "name": "Bali Adventure Tour",
      "date": "2026-01-15",
      "status": "upcoming",
      "guests": 8,
      "assignment_status": "confirmed",
      "fee_amount": 500000
    }
  ]
}
```

### GET /api/guide/trips/:code

Get detailed trip information.

**Path Parameters:**
- `code` (string): Trip code (e.g., "TRP-001")

**Response:**
```json
{
  "trip": { ... },
  "manifest": [ ... ],
  "itinerary": [ ... ],
  "guides": [ ... ],
  "equipment": [ ... ]
}
```

### POST /api/guide/trips/:id/confirm

Confirm or reject trip assignment.

**Request Body:**
```json
{
  "action": "accept" | "reject",
  "rejection_reason": "string (required if action is reject)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Trip assignment confirmed"
}
```

---

## Attendance

### POST /api/guide/attendance/check-in

Record guide check-in for a trip.

**Rate Limit:** 5/min

**Request Body:**
```json
{
  "tripId": "uuid",
  "latitude": -8.6785,
  "longitude": 115.2618,
  "accuracy": 10,
  "photoUrl": "https://...",
  "happiness": 5,
  "description": "Ready for the trip!"
}
```

**Response:**
```json
{
  "success": true,
  "check_in": {
    "id": "uuid",
    "trip_id": "uuid",
    "check_in_time": "2026-01-15T08:00:00Z",
    "is_late": false
  }
}
```

### POST /api/guide/attendance/check-out

Record guide check-out.

**Request Body:**
```json
{
  "tripId": "uuid",
  "latitude": -8.6785,
  "longitude": 115.2618,
  "notes": "Trip completed successfully"
}
```

---

## Manifest

### GET /api/guide/manifest?tripId=uuid

Get trip manifest (passenger list).

**Query Parameters:**
- `tripId` (required): Trip ID

**Response:**
```json
{
  "manifest": [
    {
      "id": "uuid",
      "name": "John Doe",
      "passenger_type": "adult",
      "consent_status": "signed",
      "allergy": null
    }
  ],
  "total_pax": 8,
  "consent_stats": {
    "signed": 7,
    "pending": 1
  }
}
```

### POST /api/guide/manifest/:id/consent

Update passenger consent status.

**Request Body:**
```json
{
  "status": "signed",
  "signature_url": "https://..."
}
```

---

## SOS Emergency

### POST /api/guide/sos

Trigger SOS emergency alert.

**Rate Limit:** 3/hour

**Request Body:**
```json
{
  "latitude": -8.6785,
  "longitude": 115.2618,
  "message": "Emergency situation",
  "incident_type": "medical" | "security" | "weather" | "accident" | "other",
  "notify_nearby_crew": true
}
```

**Response:**
```json
{
  "success": true,
  "alert_id": "uuid",
  "notifications_sent": {
    "whatsapp": true,
    "email": true,
    "push": true
  }
}
```

### GET /api/guide/sos/:id

Get SOS alert status.

### POST /api/guide/sos/:id/resolve

Mark SOS alert as resolved.

---

## Wallet

### GET /api/guide/wallet

Get wallet balance and summary.

**Response:**
```json
{
  "balance": {
    "available": 1500000,
    "pending": 250000
  },
  "recent_transactions": [ ... ]
}
```

### GET /api/guide/wallet/transactions

Get transaction history with pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `type`: "earning" | "withdrawal" | "tip" | "deduction"

### POST /api/guide/wallet/withdraw

Request withdrawal.

**Request Body:**
```json
{
  "amount": 500000,
  "bank_code": "BCA",
  "account_number": "1234567890"
}
```

---

## Documents

### GET /api/guide/documents

Get all guide documents.

**Response:**
```json
{
  "documents": [
    {
      "document_type": "ktp",
      "file_url": "https://...",
      "verification_status": "verified",
      "expiry_date": "2030-12-31"
    }
  ],
  "summary": {
    "total": 4,
    "verified": 3,
    "required_verified": 3
  }
}
```

### POST /api/guide/documents

Upload new document.

**Rate Limit:** 5/min

**Request Body:**
```json
{
  "document_type": "ktp" | "skck" | "medical" | "photo" | "cv" | "certificate",
  "file_url": "https://...",
  "expiry_date": "2030-12-31"
}
```

---

## Notifications

### GET /api/guide/notifications

Get notifications.

**Query Parameters:**
- `unread_only` (boolean)
- `limit` (default: 50)

### POST /api/guide/notifications/:id/read

Mark notification as read.

### POST /api/guide/push/subscribe

Subscribe to push notifications.

**Rate Limit:** 20/min

**Request Body:**
```json
{
  "endpoint": "https://...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

---

## AI Endpoints

All AI endpoints are rate-limited to **10 requests per minute** per user.

### POST /api/guide/voice/command

Process voice command.

**Request Body:**
```json
{
  "text": "Mulai trip sekarang",
  "tripId": "uuid (optional)"
}
```

### POST /api/guide/voice/transcribe

Transcribe audio to text.

**Request:** multipart/form-data
- `audio`: Audio file (webm, mp3, wav)
- `languageCode`: "id-ID" (default)

### POST /api/guide/documents/ocr

OCR document scan.

**Rate Limit:** 5/min

**Request Body:**
```json
{
  "imageBase64": "...",
  "mimeType": "image/jpeg",
  "documentType": "ktp" | "sim"
}
```

### GET /api/guide/trips/:id/ai-insights

Get AI-powered trip insights.

### POST /api/guide/customer-sentiment/analyze

Analyze customer sentiment.

### POST /api/guide/manifest/suggest

Get AI suggestions for manifest.

### POST /api/guide/feedback/analyze

Analyze feedback with AI.

### POST /api/guide/route-optimization/ai

Optimize trip itinerary.

### GET /api/guide/equipment/predictive-maintenance

Get predictive maintenance suggestions.

### POST /api/guide/incidents/ai-assist

AI-assisted incident reporting.

### POST /api/guide/trips/:id/chat-ai

AI trip chat assistant.

### GET /api/guide/performance/coach

AI performance coaching.

### POST /api/guide/notifications/prioritize

AI notification prioritization.

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Not authorized |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

### Rate Limit Response

```json
{
  "error": "Terlalu banyak requests. Coba lagi dalam 60 detik.",
  "retry_after": 60
}
```

**Headers:**
```http
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 60
```

---

## Changelog

### v1.0.0 (2026-01-02)
- Initial API documentation
- Added rate limiting to AI and upload endpoints
- Documented all Guide App endpoints

