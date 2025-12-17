# Routing Map - Information Architecture

**Berdasarkan PRD 2.8.A - Struktur Domain & Routing**

## Overview

Dokumen ini menjelaskan struktur routing lengkap aplikasi MyAeroTravel ID sesuai dengan Product Requirement Document.

## Routing Strategy

- **Single Domain Monolith:** Semua route berada di domain utama (aerotravel.co.id)
- **No Subdomains:** Subdomain dilarang kecuali untuk keperluan teknis khusus
- **Protected Routes:** Menggunakan middleware untuk authentication & authorization

## Route Categories

### 1. Public Routes (SSR - SEO Optimized)

| Route | Purpose | Rendering | Access |
|-------|---------|-----------|--------|
| `/` | Homepage - Marketing | SSR | Public |
| `/about` | Tentang Kami | SSR | Public |
| `/contact` | Kontak | SSR | Public |
| `/packages` | Daftar Paket | SSR | Public |
| `/p/[city]/[slug]` | SEO Landing Pages | ISR | Public |

### 2. Customer Routes (CSR - Interactive)

| Route | Purpose | Rendering | Access |
|-------|---------|-----------|--------|
| `/book` | Booking Wizard | CSR | Public |
| `/my-trips` | Customer Dashboard | SSR | Protected (Customer) |
| `/my-trips/[id]` | Trip Detail | SSR | Protected (Owner) |
| `/payment/[id]` | Payment Page | CSR | Protected (Owner) |
| `/split-bill/[id]` | Split Bill | CSR | Public (via link) |
| `/travel-circle` | Travel Circle List | SSR | Protected (Customer) |
| `/travel-circle/[id]` | Circle Detail | SSR | Protected (Member) |
| `/loyalty` | AeroPoints & Referral | SSR | Protected (Customer) |
| `/gallery/[tripId]` | Photo Gallery | SSR | Protected (Participant) |

### 3. Mitra Routes (B2B Partner)

| Route | Purpose | Rendering | Access |
|-------|---------|-----------|--------|
| `/mitra` | Mitra Dashboard | SSR | Protected (Mitra) |
| `/mitra/bookings` | Booking Management | SSR | Protected (Mitra) |
| `/mitra/deposit` | Deposit Management | SSR | Protected (Mitra) |
| `/mitra/invoices` | Invoice Management | SSR | Protected (Mitra) |
| `/mitra/whitelabel` | Whitelabel Settings | SSR | Protected (Mitra) |

### 4. Console Routes (Internal Admin)

| Route | Purpose | Rendering | Access |
|-------|---------|-----------|--------|
| `/console` | ERP Dashboard | SSR | Protected (Admin/Ops/Finance) |
| `/console/bookings` | Booking Management | SSR | Protected (Marketing/Admin) |
| `/console/products` | Product & Pricing | SSR | Protected (Admin/Marketing) |
| `/console/operations` | Operations Hub | SSR | Protected (Ops/Admin) |
| `/console/operations/scheduler` | Resource Scheduler | CSR | Protected (Ops/Admin) |
| `/console/operations/trips` | Trip Management | SSR | Protected (Ops/Admin) |
| `/console/operations/inventory` | Inventory Management | SSR | Protected (Ops/Admin) |
| `/console/finance` | Finance Control | SSR | Protected (Finance/Super Admin) |
| `/console/finance/payroll` | Payroll Management | SSR | Protected (Finance) |
| `/console/governance` | Governance & HR | SSR | Protected (Super Admin/Admin) |
| `/console/safety` | Safety Management | SSR | Protected (Admin/Ops/Super Admin) |
| `/console/users` | User Management | SSR | Protected (Super Admin) |
| `/console/reports` | Reports & Analytics | SSR | Protected (Finance/Super Admin/Investor) |

### 5. Guide Routes (PWA Mobile)

| Route | Purpose | Rendering | Access |
|-------|---------|-----------|--------|
| `/guide` | Guide Dashboard | PWA | Protected (Guide) |
| `/guide/attendance` | GPS Attendance | PWA | Protected (Guide) |
| `/guide/manifest` | Digital Manifest | PWA | Protected (Guide) |
| `/guide/trips/[id]` | Trip Detail | PWA | Protected (Assigned Guide) |
| `/guide/sos` | Panic Button | PWA | Protected (Guide) |

### 6. Corporate Routes (B2B Enterprise)

| Route | Purpose | Rendering | Access |
|-------|---------|-----------|--------|
| `/corporate` | Corporate Dashboard | SSR | Protected (Corporate) |
| `/corporate/employees` | Employee Management | SSR | Protected (Corporate) |
| `/corporate/invoices` | Corporate Invoices | SSR | Protected (Corporate) |

### 7. Auth Routes

| Route | Purpose | Rendering | Access |
|-------|---------|-----------|--------|
| `/login` | Login Page | SSR | Public |
| `/register` | Registration | SSR | Public |
| `/legal/sign` | E-Contract Signing | SSR | Protected (First Login) |

### 8. API Routes

| Route | Purpose | Type | Access |
|-------|---------|------|--------|
| `/api/v1/*` | System Integration | Edge | Authenticated |
| `/api/webhooks/*` | External Triggers | Serverless | Webhook Secret |
| `/api/health` | Health Check | Edge | Public |
| `/api/chat` | AI Chatbot | Serverless | Rate Limited |
| `/api/payment` | Payment Processing | Serverless | Authenticated |
| `/api/split-bill` | Split Bill API | Serverless | Authenticated |
| `/api/admin/*` | Admin Operations | Serverless | Protected (Admin) |

## Middleware Logic

**File:** `middleware.ts`

### Checks Performed:

1. **Session Check:** Is user logged in? → Redirect to `/login`
2. **Role Check:**
   - Guide accessing `/console` → Redirect to `/guide`
   - Mitra accessing `/console` → Redirect to `/mitra`
3. **Branch Injection:** Auto-inject `branch_id` filter for multi-tenant queries

## Route Protection Levels

### Public
- No authentication required
- Accessible to everyone

### Protected (Authenticated)
- Requires login
- Accessible to logged-in users

### Protected (Role-Based)
- Requires specific role
- Examples: `/console` (Admin), `/mitra` (Mitra), `/guide` (Guide)

### Protected (Owner)
- Requires ownership of resource
- Examples: `/my-trips/[id]` (must own trip), `/payment/[id]` (must own booking)

## Rendering Strategies

### SSR (Server Side Rendering)
- **Use Case:** SEO-optimized pages, initial load performance
- **Examples:** Homepage, About, Packages, Dashboard pages

### ISR (Incremental Static Regeneration)
- **Use Case:** SEO landing pages with dynamic content
- **Examples:** `/p/[city]/[slug]` (revalidate: 24 hours)

### CSR (Client Side Rendering)
- **Use Case:** Interactive forms, real-time updates
- **Examples:** Booking wizard, Payment page, Resource scheduler

### PWA (Progressive Web App)
- **Use Case:** Offline-capable mobile app
- **Examples:** All `/guide/*` routes

## File Structure

```
app/
├── page.tsx                    # Homepage
├── about/
│   └── page.tsx
├── contact/
│   └── page.tsx
├── packages/
│   └── page.tsx
├── book/
│   ├── layout.tsx
│   └── page.tsx
├── my-trips/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── payment/
│   └── [id]/
│       └── page.tsx
├── split-bill/
│   └── [id]/
│       └── page.tsx
├── travel-circle/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── loyalty/
│   └── page.tsx
├── gallery/
│   └── [tripId]/
│       └── page.tsx
├── mitra/
│   ├── page.tsx
│   ├── bookings/
│   │   └── page.tsx
│   ├── deposit/
│   │   └── page.tsx
│   ├── invoices/
│   │   └── page.tsx
│   └── whitelabel/
│       └── page.tsx
├── console/
│   ├── page.tsx
│   ├── bookings/
│   │   └── page.tsx
│   ├── products/
│   │   └── page.tsx
│   ├── operations/
│   │   ├── page.tsx
│   │   ├── scheduler/
│   │   │   └── page.tsx
│   │   ├── trips/
│   │   │   └── page.tsx
│   │   └── inventory/
│   │       └── page.tsx
│   ├── finance/
│   │   ├── page.tsx
│   │   └── payroll/
│   │       └── page.tsx
│   ├── governance/
│   │   └── page.tsx
│   ├── safety/
│   │   └── page.tsx
│   ├── users/
│   │   └── page.tsx
│   └── reports/
│       └── page.tsx
├── guide/
│   ├── page.tsx
│   ├── attendance/
│   │   └── page.tsx
│   ├── manifest/
│   │   └── page.tsx
│   ├── trips/
│   │   └── [id]/
│   │       └── page.tsx
│   └── sos/
│       └── page.tsx
├── corporate/
│   ├── page.tsx
│   ├── employees/
│   │   └── page.tsx
│   └── invoices/
│       └── page.tsx
├── login/
│   └── page.tsx
├── register/
│   └── page.tsx
├── legal/
│   └── sign/
│       └── page.tsx
└── p/
    └── [city]/
        └── [slug]/
            └── page.tsx
```

## Implementation Status

✅ **Skeleton Created:** All route files with placeholder content and TODO comments
⏳ **Implementation:** Routes ready for feature development

## Next Steps

1. Implement middleware for route protection
2. Add layout components for each section
3. Implement authentication flow
4. Build feature components for each route
5. Add loading and error states

---

**Last Updated:** $(date)  
**Based on:** PRD v3.0 Section 2.8

