# Strategi Implementasi Kontrak Kerja Tour Guide

## 📋 Overview

Dokumen ini menjelaskan strategi implementasi sistem kontrak kerja untuk tour guide yang terintegrasi dengan sistem existing (wallet, assignments, payroll).

**Tanggal**: 2025-01-XX  
**Status**: Planning  
**Prioritas**: High

---

## 🎯 Tujuan & Requirements

### Business Goals
1. **Formalisasi Hubungan Kerja**: Kontrak formal antara company dan guide
2. **Transparansi Fee**: Terms & conditions fee yang jelas
3. **Compliance**: Memenuhi regulasi ketenagakerjaan
4. **Automation**: Auto-generate kontrak dari assignment
5. **Tracking**: History kontrak dan status

### User Stories
- **Guide**: "Saya ingin melihat kontrak kerja saya dan statusnya"
- **Admin**: "Saya ingin membuat kontrak untuk guide baru"
- **Finance**: "Saya ingin track kontrak yang akan expire"
- **Ops**: "Saya ingin auto-generate kontrak dari trip assignment"

---

## 🏗️ Arsitektur & Database Design

### 1. Database Schema

```sql
-- Migration: 040-guide-contracts.sql

-- ============================================
-- ENUM: Contract Status
-- ============================================
DO $$ BEGIN
  CREATE TYPE guide_contract_status AS ENUM (
    'draft',              -- Draft, belum dikirim
    'pending_signature',  -- Menunggu tanda tangan guide
    'pending_company',    -- Menunggu tanda tangan company
    'active',             -- Aktif dan berlaku
    'expired',            -- Sudah kadaluarsa
    'terminated',         -- Dihentikan sebelum waktunya
    'rejected'            -- Guide menolak kontrak
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ENUM: Contract Type
-- ============================================
DO $$ BEGIN
  CREATE TYPE guide_contract_type AS ENUM (
    'per_trip',      -- Kontrak per trip (one-time)
    'monthly',       -- Kontrak bulanan
    'project',       -- Kontrak per project (multiple trips)
    'seasonal',      -- Kontrak musiman (3-6 bulan)
    'annual'         -- Kontrak tahunan
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLE: guide_contracts
-- ============================================
CREATE TABLE IF NOT EXISTS guide_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Contract Details
  contract_number VARCHAR(50) UNIQUE NOT NULL, -- Format: CT-YYYY-MMDD-XXX
  contract_type guide_contract_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Terms & Conditions
  start_date DATE NOT NULL,
  end_date DATE, -- NULL untuk per_trip
  fee_amount DECIMAL(14,2) NOT NULL,
  fee_type VARCHAR(20) NOT NULL, -- 'fixed', 'per_trip', 'percentage'
  payment_terms TEXT, -- "Dibayar setelah trip selesai"
  terms_and_conditions JSONB, -- Flexible terms storage
  
  -- Status & Signatures
  status guide_contract_status DEFAULT 'draft',
  guide_signed_at TIMESTAMPTZ,
  guide_signature_url TEXT, -- URL to signature image/PDF
  company_signed_at TIMESTAMPTZ,
  company_signature_url TEXT,
  signed_pdf_url TEXT, -- Final signed PDF
  
  -- Metadata
  created_by UUID REFERENCES users(id), -- Admin yang membuat
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Auto-calculate from end_date
  
  -- Termination
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,
  terminated_by UUID REFERENCES users(id),
  
  -- Rejection
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Constraints
  CONSTRAINT valid_contract_dates CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT valid_fee_amount CHECK (fee_amount > 0)
);

-- ============================================
-- TABLE: guide_contract_trips (for per_trip & project contracts)
-- ============================================
CREATE TABLE IF NOT EXISTS guide_contract_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES guide_contracts(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  trip_code VARCHAR(50),
  trip_date DATE,
  fee_amount DECIMAL(14,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(contract_id, trip_id)
);

-- ============================================
-- TABLE: guide_contract_payments (link to wallet transactions)
-- ============================================
CREATE TABLE IF NOT EXISTS guide_contract_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES guide_contracts(id) ON DELETE CASCADE,
  wallet_transaction_id UUID REFERENCES guide_wallet_transactions(id),
  amount DECIMAL(14,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50), -- 'wallet', 'bank_transfer', 'cash'
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_contracts_guide_id ON guide_contracts(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_contracts_status ON guide_contracts(status);
CREATE INDEX IF NOT EXISTS idx_guide_contracts_expires_at ON guide_contracts(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_guide_contracts_branch_id ON guide_contracts(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_contract_trips_contract_id ON guide_contract_trips(contract_id);
CREATE INDEX IF NOT EXISTS idx_guide_contract_trips_trip_id ON guide_contract_trips(trip_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  v_date_str VARCHAR(8);
  v_seq_num INTEGER;
BEGIN
  -- Format: CT-YYYYMMDD-XXX
  v_date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO v_seq_num
  FROM guide_contracts
  WHERE contract_number LIKE 'CT-' || v_date_str || '-%';
  
  NEW.contract_number := 'CT-' || v_date_str || '-' || LPAD(v_seq_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_contract_number
  BEFORE INSERT ON guide_contracts
  FOR EACH ROW
  WHEN (NEW.contract_number IS NULL)
  EXECUTE FUNCTION generate_contract_number();

-- Auto-calculate expires_at from end_date
CREATE OR REPLACE FUNCTION calculate_contract_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL THEN
    NEW.expires_at := (NEW.end_date + INTERVAL '1 day')::TIMESTAMPTZ;
  ELSIF NEW.contract_type = 'per_trip' THEN
    -- Per trip: expire 30 days after start_date if no end_date
    NEW.expires_at := (NEW.start_date + INTERVAL '30 days')::TIMESTAMPTZ;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_expires_at
  BEFORE INSERT OR UPDATE ON guide_contracts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_contract_expires_at();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_contract_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_contract_payments ENABLE ROW LEVEL SECURITY;

-- Guide can view own contracts
CREATE POLICY "guide_contracts_own" ON guide_contracts
  FOR SELECT
  USING (guide_id = auth.uid());

-- Guide can sign own contracts
CREATE POLICY "guide_contracts_sign" ON guide_contracts
  FOR UPDATE
  USING (guide_id = auth.uid())
  WITH CHECK (
    guide_id = auth.uid() AND
    status IN ('pending_signature', 'pending_company')
  );

-- Admin/Ops can manage all contracts
CREATE POLICY "guide_contracts_admin" ON guide_contracts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin', 'ops_admin', 'finance_manager')
    )
  );

-- Similar policies for contract_trips and contract_payments
CREATE POLICY "guide_contract_trips_own" ON guide_contract_trips
  FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM guide_contracts WHERE guide_id = auth.uid()
    )
  );

CREATE POLICY "guide_contract_payments_own" ON guide_contract_payments
  FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM guide_contracts WHERE guide_id = auth.contracts()
    )
  );
```

---

## 🔄 Workflow & State Machine

### Contract Lifecycle

```
┌─────────┐
│  DRAFT  │ ──[Send to Guide]──> ┌──────────────────┐
└─────────┘                       │ PENDING_SIGNATURE│
                                  └──────────────────┘
                                         │
                                         │ [Guide Signs]
                                         ▼
                                  ┌──────────────────┐
                                  │ PENDING_COMPANY  │
                                  └──────────────────┘
                                         │
                                         │ [Company Signs]
                                         ▼
                                  ┌─────────┐
                                  │ ACTIVE  │
                                  └─────────┘
                                         │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
            ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
            │   EXPIRED   │    │ TERMINATED  │    │  REJECTED   │
            └─────────────┘    └─────────────┘    └─────────────┘
```

### State Transitions

| From | To | Trigger | Who |
|------|-----|---------|-----|
| `draft` | `pending_signature` | Admin sends contract | Admin |
| `pending_signature` | `pending_company` | Guide signs | Guide |
| `pending_signature` | `rejected` | Guide rejects | Guide |
| `pending_company` | `active` | Company signs | Admin/Finance |
| `active` | `expired` | Auto (cron job) | System |
| `active` | `terminated` | Manual termination | Admin |
| Any | `draft` | Edit contract | Admin |

---

## 📡 API Endpoints

### 1. Guide App APIs

#### `GET /api/guide/contracts`
List contracts untuk guide yang login.

```typescript
// Response
{
  contracts: Array<{
    id: string;
    contract_number: string;
    contract_type: 'per_trip' | 'monthly' | 'project' | 'seasonal' | 'annual';
    title: string;
    start_date: string;
    end_date: string | null;
    fee_amount: number;
    status: 'draft' | 'pending_signature' | 'pending_company' | 'active' | 'expired' | 'terminated' | 'rejected';
    guide_signed_at: string | null;
    company_signed_at: string | null;
    expires_at: string | null;
  }>;
}
```

#### `GET /api/guide/contracts/[id]`
Detail kontrak dengan full terms.

#### `GET /api/guide/contracts/[id]/pdf`
Download kontrak PDF (signed atau unsigned).

#### `POST /api/guide/contracts/[id]/sign`
Guide menandatangani kontrak.

```typescript
// Request
{
  signature_data: string; // Base64 signature image atau signature coordinates
  signature_method: 'draw' | 'upload' | 'typed'; // Method signature
}

// Response
{
  success: boolean;
  contract: { ... };
  signed_pdf_url: string;
}
```

#### `POST /api/guide/contracts/[id]/reject`
Guide menolak kontrak.

```typescript
// Request
{
  rejection_reason: string;
}
```

### 2. Admin/Console APIs

#### `GET /api/admin/guide/contracts`
List semua kontrak (dengan filters).

#### `POST /api/admin/guide/contracts`
Create kontrak baru.

```typescript
// Request
{
  guide_id: string;
  contract_type: 'per_trip' | 'monthly' | 'project' | 'seasonal' | 'annual';
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  fee_amount: number;
  fee_type: 'fixed' | 'per_trip' | 'percentage';
  payment_terms: string;
  terms_and_conditions: {
    // Flexible JSON structure
    working_hours?: string;
    responsibilities?: string[];
    benefits?: string[];
    penalties?: string[];
  };
  trip_ids?: string[]; // For per_trip/project contracts
  auto_send?: boolean; // Auto-send to guide after creation
}
```

#### `POST /api/admin/guide/contracts/[id]/send`
Kirim kontrak ke guide (draft → pending_signature).

#### `POST /api/admin/guide/contracts/[id]/sign`
Company menandatangani kontrak.

#### `POST /api/admin/guide/contracts/[id]/terminate`
Terminate kontrak aktif.

```typescript
// Request
{
  termination_reason: string;
  effective_date?: string; // Default: today
}
```

#### `POST /api/admin/guide/contracts/[id]/renew`
Renew kontrak yang akan expire.

#### `POST /api/admin/guide/contracts/generate-from-assignment`
Auto-generate kontrak dari trip assignment.

```typescript
// Request
{
  trip_id: string;
  guide_id: string;
  fee_amount: number;
  contract_type?: 'per_trip'; // Default
}
```

---

## 🎨 UI/UX Design

### 1. Guide App (`/guide/contracts`)

#### Contract List Page
- **Card Layout**: List kontrak dengan status badge
- **Filters**: Status, contract type, date range
- **Quick Actions**: 
  - "Lihat Detail" → Detail page
  - "Tandatangani" (jika pending_signature)
  - "Download PDF"

#### Contract Detail Page
- **Header**: Contract number, status, dates
- **Terms Section**: 
  - Fee amount & payment terms
  - Start/end date
  - Terms & conditions (expandable)
- **Signatures Section**:
  - Guide signature status
  - Company signature status
  - Signed PDF download
- **Actions**:
  - Sign contract (draw/upload/typed)
  - Reject contract
  - Download PDF

#### Signature Flow
1. **Method Selection**: Draw, Upload, atau Typed
2. **Signature Capture**:
   - Draw: Canvas untuk signature
   - Upload: Upload signature image
   - Typed: Type name (less secure, fallback)
3. **Preview**: Preview kontrak dengan signature
4. **Confirm**: Final confirmation sebelum submit

### 2. Console Admin (`/console/guide/contracts`)

#### Contract Management Page
- **Table View**: 
  - Columns: Contract #, Guide, Type, Status, Dates, Actions
  - Filters: Status, Type, Guide, Date range
  - Search: Contract number, guide name
- **Actions**:
  - Create New Contract
  - Generate from Assignment
  - Bulk actions (send, terminate, renew)

#### Create/Edit Contract Form
- **Basic Info**: Guide, Type, Title, Description
- **Terms**: Dates, Fee, Payment terms
- **Advanced Terms**: JSON editor untuk custom terms
- **Trips** (for per_trip/project): Select trips
- **Actions**: Save Draft, Send to Guide

---

## 🔗 Integration Points

### 1. Wallet Integration

**Auto-create earning transaction saat kontrak active:**
```typescript
// Trigger saat contract status → 'active'
// Create wallet transaction dengan reference ke contract
{
  transaction_type: 'earning',
  amount: contract.fee_amount,
  reference_type: 'contract',
  reference_id: contract.id,
  description: `Kontrak ${contract.contract_number}`
}
```

**Payment tracking:**
- Link `guide_contract_payments` ke `guide_wallet_transactions`
- Track payment status per kontrak

### 2. Assignment Integration

**Auto-generate contract from assignment:**
```typescript
// Saat trip assignment confirmed
// Option: Auto-generate per_trip contract
POST /api/admin/guide/contracts/generate-from-assignment
{
  trip_id: tripId,
  guide_id: guideId,
  fee_amount: assignment.fee_amount
}
```

**Contract validation:**
- Check active contract sebelum assign trip
- Warn jika guide tidak punya active contract

### 3. Notification Integration

**WhatsApp notifications:**
- Contract sent → Notify guide
- Contract signed → Notify admin
- Contract expiring soon (7 days) → Notify guide & admin
- Contract expired → Notify admin

**In-app notifications:**
- Contract pending signature
- Contract signed by company
- Contract expiring soon

### 4. PDF Generation

**Use existing `@react-pdf/renderer`:**
```typescript
// lib/pdf/contract.tsx
export function ContractPDF({ data }: { data: ContractData }) {
  return (
    <Document>
      <Page>
        {/* Contract template dengan signature fields */}
      </Page>
    </Document>
  );
}
```

**Signature overlay:**
- Generate PDF dengan signature images
- Store signed PDF di Supabase Storage
- Return signed_pdf_url

---

## ⚙️ Automation & Cron Jobs

### 1. Auto-expire Contracts

```sql
-- Cron job: Check expired contracts daily
UPDATE guide_contracts
SET status = 'expired'
WHERE status = 'active'
  AND expires_at < NOW();
```

### 2. Expiring Soon Alerts

```sql
-- Cron job: Notify contracts expiring in 7 days
SELECT * FROM guide_contracts
WHERE status = 'active'
  AND expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days';
```

### 3. Auto-generate from Assignment

```typescript
// Option di assignment API
// Auto-generate per_trip contract saat assignment confirmed
if (autoGenerateContract) {
  await generateContractFromAssignment(tripId, guideId, feeAmount);
}
```

---

## 📊 Reporting & Analytics

### Metrics
1. **Contract Status Distribution**: Pie chart status
2. **Contract Expiry Timeline**: Contracts expiring per month
3. **Signature Rate**: % contracts signed vs sent
4. **Average Contract Duration**: Per contract type
5. **Payment Tracking**: Payments per contract

### Reports
- **Active Contracts Report**: List semua active contracts
- **Expiring Contracts Report**: Contracts expiring dalam 30 hari
- **Unsigned Contracts Report**: Contracts pending signature > 7 days
- **Contract History**: Per guide

---

## 🚀 Implementation Phases

### Phase 1: Core Functionality (Week 1-2)
- [ ] Database schema & migrations
- [ ] Basic CRUD APIs (create, read, update)
- [ ] Contract list & detail pages (Guide App)
- [ ] Contract management page (Console)

### Phase 2: Signature System (Week 2-3)
- [ ] Signature capture (draw/upload/typed)
- [ ] PDF generation dengan signature
- [ ] Signature workflow (guide → company)
- [ ] Signed PDF storage

### Phase 3: Integration (Week 3-4)
- [ ] Wallet integration (auto-create transactions)
- [ ] Assignment integration (auto-generate)
- [ ] Notification system
- [ ] PDF download & email

### Phase 4: Automation & Polish (Week 4-5)
- [ ] Auto-expire cron job
- [ ] Expiring soon alerts
- [ ] Reporting & analytics
- [ ] UI/UX improvements

---

## 🔒 Security & Compliance

### Data Protection
- **RLS Policies**: Guide hanya bisa lihat kontrak sendiri
- **Signature Verification**: Validate signature authenticity
- **PDF Security**: Signed PDF tidak bisa di-edit
- **Audit Trail**: Log semua contract changes

### Legal Compliance
- **Terms Template**: Standard terms sesuai regulasi
- **Signature Legal**: Digital signature yang legally binding
- **Data Retention**: Archive expired contracts
- **Privacy**: Guide data protection

---

## 📝 Notes & Considerations

### Contract Types
- **Per Trip**: One-time, expire setelah trip selesai
- **Monthly**: Recurring, auto-renew atau manual
- **Project**: Multiple trips dalam satu kontrak
- **Seasonal**: 3-6 bulan, untuk high season
- **Annual**: Yearly contract dengan review

### Fee Types
- **Fixed**: Fixed amount per contract
- **Per Trip**: Amount per trip (for project contracts)
- **Percentage**: Percentage dari booking revenue

### Future Enhancements
- **Contract Templates**: Pre-defined templates
- **Bulk Operations**: Bulk send, renew, terminate
- **Contract Analytics**: Advanced analytics dashboard
- **Mobile Signature**: Native mobile signature capture
- **E-Signature Service**: Integration dengan DocuSign/PandaDoc

---

## ✅ Success Criteria

1. **Functionality**: Semua CRUD operations bekerja
2. **Signature Flow**: Guide & company bisa sign kontrak
3. **PDF Generation**: Signed PDF generated dengan benar
4. **Integration**: Wallet & assignment integration bekerja
5. **Automation**: Auto-expire & alerts bekerja
6. **Performance**: Page load < 2s, PDF generation < 5s
7. **Security**: RLS policies enforced, signatures verified
8. **UX**: Intuitive flow, clear status indicators

---

**Last Updated**: 2025-01-XX  
**Author**: Development Team  
**Status**: Ready for Implementation
