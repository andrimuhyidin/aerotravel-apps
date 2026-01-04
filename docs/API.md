# API Documentation

## Base URL

```
Production: https://aerotravel.co.id
Development: http://localhost:3000
```

## Authentication

Most API endpoints require authentication via Supabase JWT token.

```http
Authorization: Bearer <supabase_jwt_token>
```

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "code": "ERROR_CODE",
  "message": "Error message",
  "statusCode": 400,
  "details": { ... }
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## Endpoints

### Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "uptime": 3600,
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": 10
    }
  }
}
```

### Payment

```http
POST /api/payment
```

**Request:**
```json
{
  "orderId": "ORDER-123",
  "amount": 1000000,
  "customerDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890"
  },
  "itemDetails": [
    {
      "id": "ITEM-1",
      "price": 1000000,
      "quantity": 1,
      "name": "Paket Wisata"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "token": "midtrans_token",
  "redirectUrl": "https://..."
}
```

### AI Chat

```http
POST /api/chat
```

**Request:**
```json
{
  "message": "Berapa harga paket Pahawang?",
  "userId": "user_123"
}
```

**Response:**
```json
{
  "message": "Harga paket Pahawang adalah Rp 500.000 per orang...",
  "remaining": 9
}
```

### Sync (PWA Offline)

```http
POST /api/v1/sync
```

**Request:**
```json
{
  "mutations": [
    {
      "type": "attendance",
      "data": { ... }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "synced": 5,
  "failed": 0
}
```

### Webhooks

#### Midtrans Webhook

```http
POST /api/webhooks/midtrans
```

#### WhatsApp Webhook

```http
POST /api/webhooks/whatsapp
```

## Rate Limiting

- **AI Chat:** 10 requests per minute per user
- **Payment:** 5 requests per minute per user
- **General API:** 100 requests per minute per IP

## Feature Flags

Some endpoints check feature flags before processing:
- `payment-gateway`
- `ai-chatbot`
- `split-bill`
- `programmatic-seo`

If a feature flag is disabled, the endpoint returns `503 Service Unavailable`.

