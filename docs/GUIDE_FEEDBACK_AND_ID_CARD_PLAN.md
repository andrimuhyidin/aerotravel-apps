# Guide Feedback & ID Card Implementation Plan

**Date**: 2025-01-20  
**Status**: Planning  
**Priority**: High

---

## 📋 Overview

Implementasi 2 fitur baru untuk Guide App:
1. **Survey & Feedback System** - Guide dapat memberikan feedback ke perusahaan untuk improvement
2. **ID Card / Surat Izin Guide** - Digital ID card dengan QR code yang bisa di-scan publik

---

## 🎯 Feature 1: Survey & Feedback System

### 1.1 Business Requirements

**Purpose:**
- Collect feedback dari guide untuk improvement perusahaan
- Track satisfaction metrics (NPS, CSAT)
- Categorize feedback untuk actionable insights
- Enable follow-up mechanism

**User Stories:**
- Sebagai guide, saya ingin memberikan feedback tentang pengalaman kerja
- Sebagai guide, saya ingin memberikan saran untuk improvement
- Sebagai admin, saya ingin melihat aggregated feedback untuk decision making
- Sebagai admin, saya ingin track feedback trends over time

### 1.2 Database Schema

```sql
-- Table: guide_feedbacks
CREATE TABLE guide_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Feedback Type
  feedback_type TEXT NOT NULL CHECK (feedback_type IN (
    'general',           -- General feedback
    'app_improvement',   -- App/System improvement
    'work_environment', -- Work environment
    'compensation',      -- Payment/compensation
    'training',          -- Training needs
    'safety',            -- Safety concerns
    'suggestion'         -- General suggestions
  )),
  
  -- Rating (Optional - for NPS/CSAT)
  rating INTEGER CHECK (rating >= 1 AND rating <= 10),
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Privacy
  is_anonymous BOOLEAN DEFAULT false,
  
  -- Status & Follow-up
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- New feedback, not reviewed
    'reviewed',     -- Reviewed by admin
    'in_progress',  -- Action being taken
    'resolved',      -- Issue resolved
    'closed'        -- Closed (no action needed)
  )),
  
  -- Admin Response
  admin_response TEXT,
  admin_id UUID REFERENCES users(id),
  responded_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT guide_feedbacks_guide_id_fkey FOREIGN KEY (guide_id) REFERENCES users(id),
  CONSTRAINT guide_feedbacks_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE INDEX idx_guide_feedbacks_guide_id ON guide_feedbacks(guide_id);
CREATE INDEX idx_guide_feedbacks_branch_id ON guide_feedbacks(branch_id);
CREATE INDEX idx_guide_feedbacks_status ON guide_feedbacks(status);
CREATE INDEX idx_guide_feedbacks_feedback_type ON guide_feedbacks(feedback_type);
CREATE INDEX idx_guide_feedbacks_created_at ON guide_feedbacks(created_at DESC);

-- RLS Policies
ALTER TABLE guide_feedbacks ENABLE ROW LEVEL SECURITY;

-- Guide can create and view their own feedbacks
CREATE POLICY "Guides can create feedbacks"
  ON guide_feedbacks FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = guide_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
  );

CREATE POLICY "Guides can view their own feedbacks"
  ON guide_feedbacks FOR SELECT
  TO authenticated
  USING (
    auth.uid() = guide_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
  );

-- Admins can view all feedbacks in their branch
CREATE POLICY "Admins can view branch feedbacks"
  ON guide_feedbacks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'owner', 'manager', 'admin')
      AND (
        role = 'super_admin' OR
        branch_id = (SELECT branch_id FROM users WHERE id = auth.uid())
      )
    )
  );

-- Admins can update feedback status and respond
CREATE POLICY "Admins can update feedbacks"
  ON guide_feedbacks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'owner', 'manager', 'admin')
    )
  );

-- Table: guide_feedback_attachments (Optional - for screenshots, etc.)
CREATE TABLE guide_feedback_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES guide_feedbacks(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_attachments_feedback_id ON guide_feedback_attachments(feedback_id);

ALTER TABLE guide_feedback_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can view their feedback attachments"
  ON guide_feedback_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guide_feedbacks
      WHERE id = feedback_id AND guide_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all feedback attachments"
  ON guide_feedback_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'owner', 'manager', 'admin')
    )
  );
```

### 1.3 API Design

#### Endpoints

**POST `/api/guide/feedback`**
- Create new feedback
- Body: `{ feedback_type, rating?, title, message, is_anonymous?, attachments? }`
- Response: `{ id, created_at }`

**GET `/api/guide/feedback`**
- Get feedbacks (guide: own feedbacks, admin: all in branch)
- Query params: `?status=pending&feedback_type=general&page=1&limit=20`
- Response: `{ feedbacks: [], total, page, limit }`

**GET `/api/guide/feedback/[id]`**
- Get single feedback detail
- Response: `{ feedback, attachments: [] }`

**PATCH `/api/guide/feedback/[id]`**
- Update feedback (admin only)
- Body: `{ status, admin_response? }`
- Response: `{ feedback }`

**GET `/api/guide/feedback/stats`**
- Get feedback statistics (admin only)
- Response: `{ total, by_status: {}, by_type: {}, avg_rating, nps_score }`

**GET `/api/guide/feedback/analytics`**
- Get feedback analytics/trends (admin only)
- Query params: `?period=month&start_date=&end_date=`
- Response: `{ trends: [], summary: {} }`

### 1.4 UI/UX Design

**Guide Side:**
- **Page**: `/guide/feedback` atau `/guide/feedback/new`
- **Form Fields:**
  - Feedback Type (dropdown)
  - Rating (1-10, optional)
  - Title (required)
  - Message (textarea, required)
  - Anonymous toggle
  - Attachments (optional, max 3 files)
- **List View**: Show submitted feedbacks with status badges
- **Detail View**: Show feedback + admin response (if any)

**Admin Side:**
- **Page**: `/console/guide-feedback` (new page)
- **Dashboard**: Stats cards (total, pending, avg rating, NPS)
- **List View**: Table with filters (status, type, date range)
- **Detail View**: Feedback detail + response form
- **Analytics**: Charts (trends, distribution by type, NPS over time)

### 1.5 Best Practices

**Industry Standards:**
- **NPS (Net Promoter Score)**: 0-10 scale, categorize as Promoters (9-10), Passives (7-8), Detractors (0-6)
- **CSAT (Customer Satisfaction)**: 1-5 or 1-10 scale
- **Feedback Categorization**: Use predefined categories for easier analysis
- **Response Time SLA**: Respond within 48-72 hours
- **Follow-up Mechanism**: Auto-remind if no response after 7 days

**Implementation:**
- Use sentiment analysis (AI) untuk categorize feedback urgency
- Auto-assign to relevant department based on feedback_type
- Email notifications untuk admin saat ada feedback baru
- Email notifications untuk guide saat ada admin response
- Analytics dashboard dengan charts (PostHog integration)

---

## 🎯 Feature 2: ID Card / Surat Izin Guide

### 2.1 Business Requirements

**Purpose:**
- Digital ID card untuk guide (seperti SIM)
- QR code yang bisa di-scan publik untuk verifikasi
- Printable version untuk physical card
- Verification system untuk public access

**User Stories:**
- Sebagai guide, saya ingin memiliki digital ID card dengan QR code
- Sebagai guide, saya ingin download/print ID card
- Sebagai public, saya ingin scan QR code untuk verifikasi guide
- Sebagai admin, saya ingin issue/revoke ID cards

### 2.2 Database Schema

```sql
-- Table: guide_id_cards
CREATE TABLE guide_id_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  
  -- Card Info
  card_number TEXT NOT NULL UNIQUE, -- Format: SIG-YYYYMMDD-XXXX (Surat Izin Guide)
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL, -- Usually 1-2 years from issue
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',      -- Valid and active
    'expired',     -- Expired (can be renewed)
    'revoked',     -- Revoked by admin
    'suspended'    -- Temporarily suspended
  )),
  
  -- QR Code
  qr_code_url TEXT, -- URL to QR code image (stored in Supabase Storage)
  qr_code_data TEXT NOT NULL, -- Encoded data for QR (e.g., JSON with verification token)
  
  -- Verification Token (for public verification)
  verification_token TEXT NOT NULL UNIQUE, -- Random token for public verification
  
  -- Metadata
  issued_by UUID REFERENCES users(id), -- Admin who issued
  revoked_by UUID REFERENCES users(id), -- Admin who revoked (if revoked)
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT guide_id_cards_guide_id_fkey FOREIGN KEY (guide_id) REFERENCES users(id),
  CONSTRAINT guide_id_cards_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE INDEX idx_guide_id_cards_guide_id ON guide_id_cards(guide_id);
CREATE INDEX idx_guide_id_cards_card_number ON guide_id_cards(card_number);
CREATE INDEX idx_guide_id_cards_verification_token ON guide_id_cards(verification_token);
CREATE INDEX idx_guide_id_cards_status ON guide_id_cards(status);
CREATE INDEX idx_guide_id_cards_expiry_date ON guide_id_cards(expiry_date);

-- RLS Policies
ALTER TABLE guide_id_cards ENABLE ROW LEVEL SECURITY;

-- Guide can view their own ID card
CREATE POLICY "Guides can view their own ID card"
  ON guide_id_cards FOR SELECT
  TO authenticated
  USING (
    auth.uid() = guide_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
  );

-- Admins can view all ID cards in their branch
CREATE POLICY "Admins can view branch ID cards"
  ON guide_id_cards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'owner', 'manager', 'admin', 'ops_admin')
      AND (
        role = 'super_admin' OR
        branch_id = (SELECT branch_id FROM users WHERE id = auth.uid())
      )
    )
  );

-- Admins can create/update ID cards
CREATE POLICY "Admins can manage ID cards"
  ON guide_id_cards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'owner', 'manager', 'admin', 'ops_admin')
    )
  );

-- Public can verify ID card via token (read-only)
CREATE POLICY "Public can verify ID card"
  ON guide_id_cards FOR SELECT
  TO anon, authenticated
  USING (
    -- Only allow if verification_token matches (will be checked in API)
    true -- RLS will be enforced at API level with token verification
  );
```

### 2.3 API Design

#### Endpoints

**GET `/api/guide/id-card`**
- Get current guide's ID card
- Response: `{ id_card, qr_code_url, download_url }`

**GET `/api/guide/id-card/download`**
- Download ID card as PDF
- Response: PDF file

**GET `/api/guide/id-card/qr-code`**
- Get QR code image
- Response: QR code image (PNG/SVG)

**POST `/api/admin/guide/id-card`** (Admin only)
- Issue new ID card
- Body: `{ guide_id, expiry_date }`
- Response: `{ id_card, qr_code_url }`

**PATCH `/api/admin/guide/id-card/[id]`** (Admin only)
- Update ID card (revoke, suspend, renew)
- Body: `{ status, revoked_reason? }`
- Response: `{ id_card }`

**GET `/api/public/guide/verify/[token]`** (Public)
- Verify ID card via token (from QR code)
- Response: `{ verified: true, guide_info: { name, card_number, status, expiry_date, branch_name } }`

**GET `/api/public/guide/[cardNumber]`** (Public)
- Public profile page data
- Response: `{ guide_info: { name, photo, card_number, status, verified_badge, ratings_summary } }`

### 2.4 QR Code Design

**QR Code Content:**
```json
{
  "type": "guide_id_card",
  "token": "verification_token",
  "url": "https://aerotravel.co.id/id/guide/verify/[token]",
  "card_number": "SIG-20250120-1234"
}
```

**QR Code URL Format:**
- Short URL: `https://aerotravel.co.id/id/guide/v/[token]`
- Full URL: `https://aerotravel.co.id/id/guide/verify/[token]`

**Security:**
- Token is unique and random (UUID v4)
- Token expires when card is revoked/expired
- Rate limiting untuk public verification endpoint
- Only show public-safe information (name, status, expiry, ratings summary)

### 2.5 Public Verification Page

**Route:** `/guide/verify/[token]` atau `/guide/v/[token]`

**Page Content:**
- Guide name
- Photo (if public)
- Card number
- Status badge (Active/Expired/Revoked)
- Expiry date
- Branch name
- Ratings summary (average rating, total reviews)
- Verification timestamp
- "Verified by AeroTravel" badge

**Design:**
- Clean, professional design
- Mobile-responsive
- Shareable (Open Graph meta tags)
- SEO-friendly

### 2.6 ID Card Design (Digital & Printable)

**Card Layout:**
```
┌─────────────────────────────────┐
│  [Logo]  SURAT IZIN GUIDE       │
│                                  │
│  [Photo]  Name: [Full Name]     │
│           Card: SIG-YYYYMMDD-XX │
│           Branch: [Branch Name]  │
│                                  │
│  [QR Code]  Expiry: DD/MM/YYYY  │
│                                  │
│  Issued: DD/MM/YYYY              │
│  Status: [Active Badge]          │
└─────────────────────────────────┘
```

**Design Elements:**
- Company logo
- Guide photo (from profile)
- Card number (prominent)
- QR code (large, scannable)
- Expiry date (clear)
- Status badge (color-coded)
- Security features (watermark, hologram effect)

**PDF Generation:**
- Use `@react-pdf/renderer` (already in project)
- Size: ID card standard (85.6mm x 53.98mm / 3.375" x 2.125")
- High resolution (300 DPI for printing)
- Both sides (front + back with terms)

### 2.7 Best Practices

**Industry Standards:**
- **ISO/IEC 18013-5**: Mobile driving license standard (reference for digital ID)
- **W3C Verifiable Credentials**: For future blockchain-based verification
- **QR Code Standard**: ISO/IEC 18004 (already using `qrcode.react`)
- **Card Number Format**: `SIG-YYYYMMDD-XXXX` (Surat Izin Guide)

**Security:**
- Token-based verification (not exposing guide_id)
- Rate limiting untuk public endpoints
- HTTPS only
- Token rotation on revocation
- Audit log untuk verification attempts

**UX:**
- Add to Wallet (iOS/Android) support
- Download as PDF
- Print-friendly design
- Share QR code image
- Verification history (for guide)

---

## 📁 File Structure

```
app/
├── [locale]/(mobile)/guide/
│   ├── feedback/
│   │   ├── page.tsx                    # Feedback list
│   │   ├── new/
│   │   │   └── page.tsx                # New feedback form
│   │   └── [id]/
│   │       └── page.tsx                # Feedback detail
│   └── id-card/
│       ├── page.tsx                    # ID card view
│       └── download/
│           └── route.ts                # Download PDF
│
├── [locale]/(public)/
│   └── guide/
│       ├── verify/
│       │   └── [token]/
│       │       └── page.tsx            # Public verification page
│       └── [cardNumber]/
│           └── page.tsx                # Public profile page
│
├── [locale]/(dashboard)/console/
│   └── guide-feedback/
│       ├── page.tsx                    # Feedback management
│       ├── [id]/
│       │   └── page.tsx                # Feedback detail + response
│       └── analytics/
│           └── page.tsx                # Analytics dashboard
│
└── api/
    ├── guide/
    │   ├── feedback/
    │   │   ├── route.ts                # GET, POST
    │   │   ├── [id]/
    │   │   │   └── route.ts            # GET, PATCH
    │   │   ├── stats/
    │   │   │   └── route.ts            # GET stats
    │   │   └── analytics/
    │   │       └── route.ts            # GET analytics
    │   └── id-card/
    │       ├── route.ts                 # GET current card
    │       ├── download/
    │       │   └── route.ts            # Download PDF
    │       └── qr-code/
    │           └── route.ts             # Get QR code image
    │
    ├── admin/
    │   └── guide/
    │       └── id-card/
    │           ├── route.ts             # POST (issue)
    │           └── [id]/
    │               └── route.ts          # PATCH (revoke/renew)
    │
    └── public/
        └── guide/
            ├── verify/
            │   └── [token]/
            │       └── route.ts         # GET verification
            └── [cardNumber]/
                └── route.ts             # GET public profile

components/
├── guide/
│   ├── feedback-form.tsx               # Feedback form component
│   ├── feedback-list.tsx               # Feedback list component
│   ├── id-card-view.tsx                # ID card display component
│   └── id-card-qr.tsx                 # QR code component for ID card
│
└── public/
    └── guide-verification.tsx          # Public verification component

lib/
├── guide/
│   ├── feedback.ts                     # Feedback utilities
│   └── id-card.ts                     # ID card utilities
│
└── pdf/
    └── guide-id-card.tsx               # ID card PDF template

supabase/migrations/
└── YYYYMMDDHHMMSS_guide-feedback-id-card.sql
```

---

## 🚀 Implementation Steps

### Phase 1: Database & API (Week 1)
1. ✅ Create database migrations
2. ✅ Create API endpoints
3. ✅ Add RLS policies
4. ✅ Add query keys to `query-keys.ts`
5. ✅ Test API endpoints

### Phase 2: Feedback System (Week 2)
1. ✅ Create feedback form component
2. ✅ Create feedback list page
3. ✅ Create feedback detail page
4. ✅ Add to guide menu
5. ✅ Test feedback flow

### Phase 3: Admin Feedback Management (Week 2-3)
1. ✅ Create admin feedback dashboard
2. ✅ Create feedback detail + response form
3. ✅ Create analytics dashboard
4. ✅ Add email notifications
5. ✅ Test admin flow

### Phase 4: ID Card System (Week 3-4)
1. ✅ Create ID card generation logic
2. ✅ Create QR code generation
3. ✅ Create ID card PDF template
4. ✅ Create ID card view page
5. ✅ Create download endpoint
6. ✅ Test ID card generation

### Phase 5: Public Verification (Week 4)
1. ✅ Create public verification page
2. ✅ Create public profile page
3. ✅ Add SEO meta tags
4. ✅ Add share functionality
5. ✅ Test public verification

### Phase 6: Polish & Testing (Week 5)
1. ✅ UI/UX improvements
2. ✅ Error handling
3. ✅ Loading states
4. ✅ E2E testing
5. ✅ Performance optimization
6. ✅ Documentation

---

## 🔒 Security Considerations

### Feedback System
- Rate limiting: Max 5 feedbacks per day per guide
- Input sanitization: Sanitize all user input
- File upload: Max 5MB per file, validate file types
- Anonymous feedback: Don't expose guide_id in API response if anonymous

### ID Card System
- Token security: Use cryptographically secure random tokens
- Rate limiting: Max 10 verifications per IP per minute
- Public data: Only expose public-safe information
- Revocation: Immediate token invalidation on revocation
- Audit log: Log all verification attempts

---

## 📊 Analytics & Monitoring

### Feedback System
- Track feedback submission rate
- Track response time (admin)
- Track feedback categories distribution
- Track NPS/CSAT trends
- Track resolution rate

### ID Card System
- Track ID card issuance
- Track verification attempts
- Track card status distribution
- Track expiry reminders sent

---

## 🎨 Design Mockups (To Be Created)

1. Feedback form page
2. Feedback list page
3. Admin feedback dashboard
4. ID card view (digital)
5. ID card PDF (printable)
6. Public verification page
7. Public profile page

---

## 📝 Notes

- **QR Code Library**: Already using `qrcode.react` ✅
- **PDF Library**: Already using `@react-pdf/renderer` ✅
- **Public Pages**: Follow existing pattern in `app/[locale]/(public)/` ✅
- **API Pattern**: Follow existing pattern with `withErrorHandler` ✅
- **RLS Policies**: Always filter by `branch_id` for multi-tenant ✅

---

## ✅ Checklist

### Feedback System
- [ ] Database migration
- [ ] API endpoints
- [ ] Feedback form component
- [ ] Feedback list page
- [ ] Feedback detail page
- [ ] Admin dashboard
- [ ] Admin response form
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Tests

### ID Card System
- [ ] Database migration
- [ ] ID card generation logic
- [ ] QR code generation
- [ ] PDF template
- [ ] ID card view page
- [ ] Download endpoint
- [ ] Public verification page
- [ ] Public profile page
- [ ] Admin management
- [ ] Tests

---

**Next Steps:**
1. Review this plan
2. Approve database schema
3. Start Phase 1 implementation
4. Create design mockups
5. Begin development
