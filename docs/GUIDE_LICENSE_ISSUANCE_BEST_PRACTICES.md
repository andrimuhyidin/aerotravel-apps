# Guide License Issuance - Best Practices Industry

**Date**: 2025-01-20  
**Status**: Best Practices & Implementation Plan  
**Context**: Mekanisme untuk mendapatkan AeroTravel Guide License (ATGL)

---

## 🎯 Executive Summary

Dokumen ini menjelaskan **best practices industry** untuk mekanisme issuance Guide License berdasarkan:
- ISO/IEC 17024 (Personnel Certification)
- Tourism Industry Standards
- Professional Licensing Best Practices
- Government Regulations (Indonesia)

---

## 📋 Industry Best Practices Overview

### **1. Multi-Stage Approval Process**

Industry standard menggunakan **multi-stage approval** untuk memastikan kualitas:

```
Application → Verification → Assessment → Training → Approval → Issuance
```

**Why:**
- ✅ Quality assurance
- ✅ Risk mitigation
- ✅ Compliance
- ✅ Professional standards

---

## 🏗️ Recommended Process Flow

### **Stage 1: Application & Initial Screening** (1-2 days)

**Requirements:**
1. **Basic Information**
   - Full name, NIK, phone, email
   - Address, date of birth
   - Emergency contact

2. **Documents Upload** (Required)
   - ✅ KTP (Kartu Tanda Penduduk) - Identity verification
   - ✅ SKCK (Surat Keterangan Catatan Kepolisian) - Background check
   - ✅ Surat Kesehatan (Medical Certificate) - Physical fitness
   - ✅ Foto formal (Professional photo)
   - ✅ CV/Resume (Experience documentation)

3. **Experience & Skills**
   - Previous guide experience
   - Languages spoken
   - Specializations (diving, hiking, cultural, etc.)
   - Certifications (if any)

**Validation:**
- ✅ Document authenticity check (OCR + manual review)
- ✅ NIK verification (government database if available)
- ✅ Basic eligibility check (age, citizenship)

**Status:** `pending_review` → `document_verified` or `document_rejected`

---

### **Stage 2: Document Verification** (2-3 days)

**Process:**
1. **Automated Verification** (if possible)
   - OCR untuk extract data dari KTP
   - NIK validation
   - Document quality check

2. **Manual Review** (Admin/Ops)
   - Verify document authenticity
   - Check document completeness
   - Validate information consistency

3. **Background Check** (if applicable)
   - SKCK verification
   - Reference check (if provided)
   - Previous employer verification

**Outcome:**
- ✅ All documents verified → Proceed to Assessment
- ❌ Documents incomplete/rejected → Request resubmission
- ⚠️ Documents suspicious → Flag for manual review

**Status:** `document_verified` → `ready_for_assessment` or `document_rejected`

---

### **Stage 3: Skills Assessment** (3-5 days)

**Assessment Types:**

#### **3.1 Self-Assessment** (Online)
- Communication skills
- Customer service
- Problem-solving
- Safety awareness
- Knowledge of destinations

**Format:** Multiple choice, rating scale, scenario-based questions

#### **3.2 Knowledge Test** (Online Quiz)
- Tourism knowledge
- Local destinations
- Safety procedures
- Company policies
- Emergency protocols

**Format:** Quiz dengan passing score (minimum 70%)

#### **3.3 Practical Assessment** (Optional - for experienced guides)
- Mock tour simulation
- Customer interaction test
- Problem-solving scenarios
- Language proficiency test

**Scoring:**
- Self-Assessment: Informational (no pass/fail)
- Knowledge Test: Must pass (70% minimum)
- Practical Assessment: Pass/Fail (if applicable)

**Status:** `assessment_completed` → `assessment_passed` or `assessment_failed`

---

### **Stage 4: Training & Onboarding** (5-7 days)

**Training Modules:**

1. **Company Orientation** (Required)
   - Company values & culture
   - Policies & procedures
   - Code of conduct
   - Safety standards

2. **Technical Training** (Required)
   - Guide App usage
   - Attendance system
   - Manifest management
   - Emergency procedures
   - SOS button usage

3. **Safety Training** (Required)
   - First aid basics
   - Emergency response
   - Risk management
   - Equipment safety

4. **Customer Service Training** (Required)
   - Communication skills
   - Handling complaints
   - Cultural sensitivity
   - Service excellence

5. **Destination Knowledge** (Optional - based on specialization)
   - Local destinations
   - History & culture
   - Best practices per destination

**Completion Requirements:**
- ✅ All required modules completed
- ✅ Quiz passed (minimum 80% for each module)
- ✅ Training certificate issued

**Status:** `training_in_progress` → `training_completed`

---

### **Stage 5: Final Approval** (1-2 days)

**Review Process:**
1. **Admin Review**
   - Review all stages completion
   - Verify assessment scores
   - Check training completion
   - Final eligibility check

2. **Approval Decision**
   - ✅ **Approve** → Issue Guide License
   - ⚠️ **Conditional Approval** → Additional requirements
   - ❌ **Reject** → Provide feedback

**Approval Criteria:**
- ✅ All documents verified
- ✅ Assessment passed
- ✅ Training completed
- ✅ No red flags in background check
- ✅ Meets minimum requirements

**Status:** `pending_approval` → `approved` or `rejected`

---

### **Stage 6: License Issuance** (1 day)

**Process:**
1. **Generate License**
   - Create unique card number: `ATGL-YYYYMMDD-XXXX`
   - Generate QR code
   - Create digital ID card
   - Set expiry date (1-2 years)

2. **Notification**
   - Email notification dengan license details
   - Push notification (if app installed)
   - SMS notification (optional)

3. **Access Grant**
   - Grant guide role access
   - Enable guide app features
   - Add to guide directory

**Status:** `license_issued` → `active`

---

## 📊 Database Schema Enhancement

### **New Tables Needed:**

```sql
-- ============================================
-- GUIDE LICENSE APPLICATION
-- ============================================

-- Application Status Enum
DO $$ BEGIN
  CREATE TYPE guide_license_status AS ENUM (
    'pending_review',        -- Initial application submitted
    'document_verified',     -- Documents verified
    'document_rejected',      -- Documents rejected
    'ready_for_assessment',  -- Ready for assessment
    'assessment_in_progress',-- Assessment ongoing
    'assessment_passed',     -- Assessment passed
    'assessment_failed',      -- Assessment failed
    'training_in_progress',   -- Training ongoing
    'training_completed',     -- Training completed
    'pending_approval',      -- Waiting for final approval
    'approved',              -- Approved, ready for issuance
    'rejected',             -- Final rejection
    'license_issued',       -- License issued
    'active',               -- Active license
    'expired',              -- License expired
    'revoked',              -- License revoked
    'suspended'             -- License suspended
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Guide License Applications
CREATE TABLE guide_license_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Application Info
  application_number TEXT NOT NULL UNIQUE, -- Format: APP-YYYYMMDD-XXXX
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Current Status
  status guide_license_status NOT NULL DEFAULT 'pending_review',
  current_stage TEXT NOT NULL DEFAULT 'application', -- application, verification, assessment, training, approval, issuance
  
  -- Application Data
  application_data JSONB NOT NULL, -- Store all application data
  /*
  {
    "personal_info": { ... },
    "documents": { ... },
    "experience": { ... },
    "skills": { ... }
  }
  */
  
  -- Documents
  documents JSONB, -- Document URLs and metadata
  /*
  {
    "ktp": { "url": "...", "verified": true, "verified_at": "...", "verified_by": "..." },
    "skck": { "url": "...", "verified": false },
    "medical": { "url": "...", "verified": false },
    "photo": { "url": "...", "verified": false }
  }
  */
  
  -- Assessment Results
  assessment_results JSONB, -- Assessment scores and results
  /*
  {
    "self_assessment": { "score": 85, "completed_at": "..." },
    "knowledge_test": { "score": 78, "passed": true, "completed_at": "..." },
    "practical_assessment": { "score": 90, "passed": true, "completed_at": "..." }
  }
  */
  
  -- Training Progress
  training_progress JSONB, -- Training completion status
  /*
  {
    "company_orientation": { "completed": true, "score": 95, "completed_at": "..." },
    "technical_training": { "completed": true, "score": 88, "completed_at": "..." },
    "safety_training": { "completed": false }
  }
  */
  
  -- Review & Approval
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  approval_decision TEXT, -- 'approved', 'rejected', 'conditional'
  approval_notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Rejection Info
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- License Info (after issuance)
  license_id UUID REFERENCES guide_id_cards(id), -- Link to issued license
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT guide_license_applications_guide_id_fkey FOREIGN KEY (guide_id) REFERENCES users(id)
);

CREATE INDEX idx_guide_license_applications_guide_id ON guide_license_applications(guide_id);
CREATE INDEX idx_guide_license_applications_status ON guide_license_applications(status);
CREATE INDEX idx_guide_license_applications_application_number ON guide_license_applications(application_number);
CREATE INDEX idx_guide_license_applications_branch_id ON guide_license_applications(branch_id);

-- RLS Policies
ALTER TABLE guide_license_applications ENABLE ROW LEVEL SECURITY;

-- Guide can view their own application
CREATE POLICY "Guides can view own application"
  ON guide_license_applications FOR SELECT
  TO authenticated
  USING (
    guide_id = auth.uid() AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
  );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON guide_license_applications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'owner', 'manager', 'admin', 'ops_admin')
    )
  );

-- ============================================
-- DOCUMENT VERIFICATION LOG
-- ============================================

CREATE TABLE guide_document_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES guide_license_applications(id) ON DELETE CASCADE,
  
  -- Document Info
  document_type TEXT NOT NULL, -- 'ktp', 'skck', 'medical', 'photo', 'cv'
  document_url TEXT NOT NULL,
  
  -- Verification
  verification_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'needs_review'
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- OCR/Extracted Data (if applicable)
  extracted_data JSONB, -- Data extracted from document
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_verifications_application_id ON guide_document_verifications(application_id);
CREATE INDEX idx_document_verifications_status ON guide_document_verifications(verification_status);

-- ============================================
-- ASSESSMENT TEMPLATES (Link to existing)
-- ============================================
-- Use existing guide_assessment_templates table
-- Create specific templates for license application:
-- - guide_license_self_assessment
-- - guide_license_knowledge_test
-- - guide_license_practical_assessment

-- ============================================
-- TRAINING MODULES (Link to existing)
-- ============================================
-- Use existing guide_training_modules table
-- Create required modules for license:
-- - company_orientation
-- - technical_training
-- - safety_training
-- - customer_service_training
```

---

## 🔄 Workflow Implementation

### **API Endpoints:**

```typescript
// Application
POST   /api/guide/license/apply
GET    /api/guide/license/application
GET    /api/guide/license/application/[id]

// Documents
POST   /api/guide/license/documents/upload
GET    /api/guide/license/documents
PATCH  /api/guide/license/documents/[id]/verify (Admin)

// Assessment
GET    /api/guide/license/assessments/available
POST   /api/guide/license/assessments/start
POST   /api/guide/license/assessments/[id]/submit
GET    /api/guide/license/assessments/[id]/results

// Training
GET    /api/guide/license/training/modules
POST   /api/guide/license/training/modules/[id]/complete
GET    /api/guide/license/training/progress

// Admin
GET    /api/admin/guide/license/applications
PATCH  /api/admin/guide/license/applications/[id]/verify-documents
PATCH  /api/admin/guide/license/applications/[id]/approve
PATCH  /api/admin/guide/license/applications/[id]/reject
POST   /api/admin/guide/license/applications/[id]/issue-license
```

---

## 📋 Requirements Checklist

### **Minimum Requirements:**

1. **Age:** Minimum 18 years old
2. **Citizenship:** Indonesian citizen (or valid work permit)
3. **Education:** Minimum SMA/SMK (or equivalent)
4. **Health:** Medical certificate (fit for work)
5. **Background:** Clean criminal record (SKCK)
6. **Documents:** All required documents submitted
7. **Assessment:** Knowledge test passed (70% minimum)
8. **Training:** All required training completed (80% minimum per module)

### **Preferred Qualifications:**

- Previous guide experience
- Language skills (English, Mandarin, etc.)
- Specializations (diving, hiking, etc.)
- Certifications (first aid, etc.)
- Good communication skills

---

## ⏱️ Timeline & SLA

### **Standard Timeline:**

| Stage | Duration | SLA |
|-------|----------|-----|
| Application Submission | 1 day | Immediate |
| Document Verification | 2-3 days | 3 business days |
| Assessment | 3-5 days | 5 business days |
| Training | 5-7 days | 7 business days |
| Final Approval | 1-2 days | 2 business days |
| License Issuance | 1 day | 1 business day |
| **Total** | **13-19 days** | **18 business days** |

### **Fast Track (for experienced guides):**

- Skip practical assessment (if >2 years experience)
- Accelerated training (condensed modules)
- **Total: 7-10 days**

---

## 🔒 Security & Compliance

### **Data Privacy:**
- ✅ Encrypt sensitive documents
- ✅ Secure document storage (Supabase Storage)
- ✅ Access control (RLS policies)
- ✅ Audit logs untuk all actions

### **Compliance:**
- ✅ GDPR compliance (right to access, delete)
- ✅ Data retention policies
- ✅ Document retention (as per regulations)

---

## 📊 Success Metrics

### **Application Metrics:**
- Application completion rate: Target >80%
- Document verification success rate: Target >90%
- Assessment pass rate: Target >70%
- Training completion rate: Target >95%
- Overall approval rate: Target >60%

### **Timeline Metrics:**
- Average processing time: Target <15 days
- Fast track usage: Track percentage
- SLA compliance: Target >95%

---

## 🎯 Implementation Priority

### **Phase 1: Core Process** (Week 1-2)
1. ✅ Application form enhancement
2. ✅ Document upload & storage
3. ✅ Document verification workflow
4. ✅ Basic assessment integration

### **Phase 2: Assessment & Training** (Week 3-4)
1. ✅ Assessment templates creation
2. ✅ Training modules setup
3. ✅ Progress tracking
4. ✅ Completion validation

### **Phase 3: Approval & Issuance** (Week 5)
1. ✅ Approval workflow
2. ✅ License issuance integration
3. ✅ Notification system
4. ✅ Admin dashboard

---

## ✅ Best Practices Summary

1. **Multi-Stage Process:** Don't rush, ensure quality at each stage
2. **Document Verification:** Always verify documents manually
3. **Assessment:** Use multiple assessment types for comprehensive evaluation
4. **Training:** Make training mandatory and trackable
5. **Approval:** Multi-level approval for quality assurance
6. **Transparency:** Clear communication at each stage
7. **Timeline:** Set realistic SLAs and communicate clearly
8. **Feedback:** Provide constructive feedback for rejected applications
9. **Renewal:** Plan for license renewal process
10. **Continuous Improvement:** Track metrics and improve process

---

**Status:** ✅ Ready for Implementation  
**Next Steps:** Review & approve, then start Phase 1
