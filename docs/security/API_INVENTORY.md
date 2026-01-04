# API Endpoint Inventory

**Document ID:** SEC-API-001  
**Version:** 1.0  
**Date:** January 4, 2026  
**Purpose**: Complete inventory of API endpoints for security testing

---

## Public APIs (`/api/public/*`)

| Endpoint | Method | Authentication | Rate Limit | Risk Level |
|----------|--------|----------------|------------|------------|
| `/api/public/packages` | GET | No | 100/min | Low |
| `/api/public/packages/[id]` | GET | No | 100/min | Low |
| `/api/public/bookings` | POST | No | 10/min | High |
| `/api/public/bookings/payment` | POST | No | 10/min | Critical |
| `/api/public/chat` | POST | No | 5/min | Medium |
| `/api/public/destinations` | GET | No | 100/min | Low |
| `/api/public/split-bill` | POST | No | 10/min | Medium |
| `/api/public/travel-circle/[id]/join` | POST | No | 10/min | Medium |

---

## Authentication APIs (`/api/auth/*`)

| Endpoint | Method | Authentication | Risk Level |
|----------|--------|----------------|------------|
| `/api/auth/login` | POST | No | Critical |
| `/api/auth/register` | POST | No | High |
| `/api/auth/callback` | GET | No | High |
| `/api/auth/logout` | POST | Yes | Low |

---

## Guide APIs (`/api/guide/*`)

| Endpoint | Method | Authentication | Authorization | Risk Level |
|----------|--------|----------------|---------------|------------|
| `/api/guide/trips` | GET | Yes | Guide role | Medium |
| `/api/guide/trips/[id]` | GET | Yes | Owner check | Medium |
| `/api/guide/trips/[id]/start` | POST | Yes | Owner + certs | High |
| `/api/guide/trips/[id]/end` | POST | Yes | Owner | Medium |
| `/api/guide/trips/[id]/risk-assessment` | POST | Yes | Owner | High |
| `/api/guide/sos` | POST | Yes | Guide role | Critical |
| `/api/guide/incidents` | POST | Yes | Guide role | High |
| `/api/guide/near-miss` | POST/GET | Yes | Guide role | Medium |
| `/api/guide/certifications` | GET/POST | Yes | Owner | Medium |
| `/api/guide/wallet` | GET | Yes | Owner | Medium |

---

## Partner APIs (`/api/partner/*`)

| Endpoint | Method | Authentication | Authorization | Risk Level |
|----------|--------|----------------|---------------|------------|
| `/api/partner/dashboard` | GET | Yes | Partner role | Medium |
| `/api/partner/bookings` | GET | Yes | Partner data | High |
| `/api/partner/bookings/[id]` | GET/PATCH | Yes | Owner check | High |
| `/api/partner/customers` | GET | Yes | Partner data | High |
| `/api/partner/wallet` | GET | Yes | Owner | High |
| `/api/partner/wallet/topup` | POST | Yes | Owner | Critical |
| `/api/partner/team` | GET/POST | Yes | Partner owner | Medium |
| `/api/partner/whitelabel` | GET/PATCH | Yes | Partner config | Medium |

---

## Admin APIs (`/api/admin/*`)

| Endpoint | Method | Authentication | Authorization | Risk Level |
|----------|--------|----------------|---------------|------------|
| `/api/admin/users` | GET | Yes | Admin role | High |
| `/api/admin/bookings` | GET | Yes | Admin role | High |
| `/api/admin/trips` | GET/PATCH | Yes | Admin role | High |
| `/api/admin/security/events` | GET | Yes | Super admin | High |
| `/api/admin/compliance/training` | GET | Yes | Admin role | Medium |
| `/api/admin/compliance/certifications` | GET | Yes | Admin role | Medium |
| `/api/admin/reports/*` | GET | Yes | Admin role | Medium |

---

## Webhook Endpoints (`/api/webhooks/*`)

| Endpoint | Method | Authentication | Risk Level |
|----------|--------|----------------|------------|
| `/api/webhooks/midtrans` | POST | Signature | Critical |
| `/api/webhooks/xendit` | POST | Signature | Critical |

---

## Health & Monitoring

| Endpoint | Method | Authentication | Risk Level |
|----------|--------|----------------|------------|
| `/api/health` | GET | No | Info |

---

## Security Controls

### Input Validation
- **Framework**: Zod schemas
- **Coverage**: All POST/PUT/PATCH endpoints
- **Sanitization**: `lib/utils/sanitize.ts`

### Rate Limiting
- **Library**: Custom in-memory (production: Upstash Redis)
- **Default**: Varies by endpoint type
- **Bypass**: Not possible

### Authentication
- **Provider**: Supabase Auth
- **Method**: JWT tokens in HTTP-only cookies
- **Session**: 24-hour expiry with refresh

### Authorization
- **Method**: Role-Based Access Control (RBAC)
- **Enforcement**: Row Level Security (RLS) policies
- **Roles**: super_admin, ops_admin, mitra, guide, customer

---

## Testing Priority

### Priority 1 (Critical)
- Payment endpoints
- SOS/Emergency endpoints
- Authentication endpoints
- Webhook handlers

### Priority 2 (High)
- Booking creation
- User data access
- Wallet operations
- Admin functions

### Priority 3 (Medium)
- Public read endpoints
- Chat/AI endpoints
- Reporting endpoints

---

## Known Security Features

✅ Input validation (Zod)  
✅ XSS prevention (sanitization)  
✅ SQL injection prevention (parameterized queries)  
✅ CSRF protection (Supabase Auth)  
✅ Rate limiting  
✅ Security headers (CSP, X-Frame-Options, etc.)  
✅ HTTPS enforcement  
✅ RLS policies on all tables  
✅ Audit logging  
✅ Failed login tracking  
✅ Security event monitoring

---

## Test Accounts for Reference

See PENTEST_SCOPE.md for test account credentials.

---

**Last Updated**: January 4, 2026  
**Next Review**: Before penetration test

