# Priority 3 Features Implementation Plan
## Partner/Mitra Apps - Remaining Features

**Tanggal:** 2025-01-31  
**Status:** Planning Phase  
**Dokumen Referensi:**
- `docs/PARTNER_MITRA_DEEP_GAP_ANALYSIS.md` (Gap Analysis)
- `project-brief/prd-aerotravel.md` (PRD Requirements)
- `project-brief/BRD-Agency-B2B-Portal.md` (BRD Requirements)

---

## 📊 Executive Summary

Implementation plan untuk **8 fitur Priority 3** yang tersisa dari gap analysis:

| Fitur | Prioritas | Effort | Dependencies | Status |
|-------|-----------|--------|--------------|--------|
| Booking Reminder Verification | Low | 4h | Notification system | ⏳ Planned |
| Product Rating Enhancement | Low | 8h | Rating system | ⏳ Planned |
| Multi-Language Documents | Low | 12h | Document generation | ⏳ Planned |
| AI Q&A on Products | High | 30h | RAG system | ⏳ Planned |
| AI Quotation Refinement | Medium | 20h | Quotation Copilot | ⏳ Planned |
| AI Sales Insights | Medium | 40h | Analytics dashboard | ⏳ Planned |
| Travel Circle / Arisan | Medium | 60h | Wallet system | ⏳ Planned |
| Trip Merging UI | Medium | 30h | Backend logic | ⏳ Planned |

**Total Effort:** ~204 hours (~5-6 weeks)

---

## 1️⃣ Booking Reminder Verification

### Overview
**Requirement:** Verifikasi dan enhance booking reminder system untuk partner bookings.

**Source:** BRD Section 3 (Booking & Order Management)

**Current Status:** ⚠️ Partial - Notification system ada, perlu verifikasi untuk booking reminders

### Requirements

#### Functional Requirements
1. **Reminder Timing:**
   - 4 jam sebelum trip: Reminder untuk partner dan customer
   - 24 jam sebelum trip: Pre-trip reminder
   - 7 hari sebelum trip: Early reminder (optional)

2. **Reminder Channels:**
   - In-app notification (real-time)
   - WhatsApp notification (via Resend/WAHA)
   - Email notification (backup)

3. **Reminder Content:**
   - Booking code
   - Trip date & time
   - Package name
   - Meeting point
   - Important reminders (what to bring, etc.)

4. **Reminder Status Tracking:**
   - Track sent reminders
   - Track read status (in-app)
   - Track delivery status (WA/Email)

### Technical Implementation

#### Database Schema
```sql
-- Add reminder tracking to bookings table (if not exists)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_sent_4h BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_24h BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reminder_sent_7d BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ;

-- Create reminder_logs table for tracking
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- '4h', '24h', '7d'
  channel TEXT NOT NULL, -- 'in_app', 'whatsapp', 'email'
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_booking_id ON reminder_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON reminder_logs(sent_at);
```

#### API Endpoints

**1. Get Booking Reminders**
```typescript
// app/api/partner/bookings/[id]/reminders/route.ts
GET /api/partner/bookings/[id]/reminders
```

**2. Manual Trigger Reminder (Admin)**
```typescript
// app/api/partner/bookings/[id]/reminders/trigger/route.ts
POST /api/partner/bookings/[id]/reminders/trigger
Body: { reminderType: '4h' | '24h' | '7d', channel: 'whatsapp' | 'email' | 'all' }
```

#### Background Jobs

**Cron Job: Booking Reminder Scheduler**
```typescript
// lib/jobs/booking-reminders.ts
/**
 * Cron job to send booking reminders
 * Runs every hour to check for bookings that need reminders
 */
export async function processBookingReminders() {
  const now = new Date();
  
  // 4 hours before trip
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  await sendRemindersForTimeframe(fourHoursFromNow, '4h');
  
  // 24 hours before trip
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  await sendRemindersForTimeframe(twentyFourHoursFromNow, '24h');
  
  // 7 days before trip
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  await sendRemindersForTimeframe(sevenDaysFromNow, '7d');
}
```

#### Notification Service
```typescript
// lib/notifications/booking-reminders.ts
export async function sendBookingReminder(
  bookingId: string,
  reminderType: '4h' | '24h' | '7d',
  channels: Array<'in_app' | 'whatsapp' | 'email'>
) {
  // Fetch booking details
  // Generate reminder message
  // Send via each channel
  // Log to reminder_logs
}
```

### UI Components

**1. Reminder Status Badge**
```typescript
// components/partner/bookings/reminder-status-badge.tsx
export function ReminderStatusBadge({ bookingId }: { bookingId: string }) {
  // Show reminder status (sent, pending, failed)
}
```

**2. Reminder History**
```typescript
// components/partner/bookings/reminder-history.tsx
export function ReminderHistory({ bookingId }: { bookingId: string }) {
  // Show all reminders sent for this booking
}
```

### Testing Checklist
- [ ] Test 4h reminder sends correctly
- [ ] Test 24h reminder sends correctly
- [ ] Test 7d reminder sends correctly
- [ ] Test WhatsApp delivery
- [ ] Test Email delivery
- [ ] Test In-app notification
- [ ] Test reminder logging
- [ ] Test manual trigger (admin)
- [ ] Test duplicate prevention

### Estimated Effort
- **Database Schema:** 1h
- **API Endpoints:** 1h
- **Background Jobs:** 1h
- **Notification Service:** 0.5h
- **UI Components:** 0.5h
- **Testing:** 1h

**Total: 4 hours**

---

## 2️⃣ Product Rating Enhancement

### Overview
**Requirement:** Enhance product rating system dengan review management, rating aggregation, dan rating display untuk partner portal.

**Source:** BRD Section 2 (Catalog & Product Browsing)

**Current Status:** ⚠️ Partial - Rating system ada, perlu enhancement

### Requirements

#### Functional Requirements
1. **Rating Display:**
   - Average rating per package
   - Rating distribution (5 stars, 4 stars, etc.)
   - Total review count
   - Recent reviews (last 10)

2. **Review Management:**
   - Partner can view all reviews for their bookings
   - Partner can respond to reviews
   - Filter reviews by rating, date, booking

3. **Rating Aggregation:**
   - Calculate average rating per package
   - Calculate rating per destination
   - Calculate rating trends (monthly)

4. **Review Moderation:**
   - Flag inappropriate reviews
   - Hide reviews (admin only)
   - Verify review authenticity

### Technical Implementation

#### Database Schema
```sql
-- Verify ratings table exists
-- If not, create:
CREATE TABLE IF NOT EXISTS package_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_images TEXT[], -- Array of image URLs
  is_verified BOOLEAN DEFAULT FALSE, -- Verified purchase
  is_visible BOOLEAN DEFAULT TRUE,
  partner_response TEXT,
  partner_response_at TIMESTAMPTZ,
  flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_package_ratings_package_id ON package_ratings(package_id);
CREATE INDEX IF NOT EXISTS idx_package_ratings_booking_id ON package_ratings(booking_id);
CREATE INDEX IF NOT EXISTS idx_package_ratings_rating ON package_ratings(rating);

-- Add rating aggregation to packages table
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_distribution JSONB; -- { "5": 10, "4": 5, "3": 2, "2": 1, "1": 0 }
```

#### API Endpoints

**1. Get Package Ratings**
```typescript
// app/api/partner/packages/[id]/ratings/route.ts
GET /api/partner/packages/[id]/ratings
Query: { page, limit, rating, sort }
```

**2. Respond to Review**
```typescript
// app/api/partner/ratings/[id]/respond/route.ts
POST /api/partner/ratings/[id]/respond
Body: { response: string }
```

**3. Flag Review**
```typescript
// app/api/partner/ratings/[id]/flag/route.ts
POST /api/partner/ratings/[id]/flag
Body: { reason: string }
```

**4. Get Rating Statistics**
```typescript
// app/api/partner/packages/[id]/rating-stats/route.ts
GET /api/partner/packages/[id]/rating-stats
```

#### Rating Aggregation Service
```typescript
// lib/ratings/aggregation.ts
export async function updatePackageRatingAggregation(packageId: string) {
  // Calculate average rating
  // Calculate rating distribution
  // Update packages table
}
```

### UI Components

**1. Rating Display Component**
```typescript
// components/partner/packages/rating-display.tsx
export function RatingDisplay({ packageId }: { packageId: string }) {
  // Show average rating, distribution, total reviews
}
```

**2. Review List Component**
```typescript
// components/partner/packages/review-list.tsx
export function ReviewList({ packageId }: { packageId: string }) {
  // Show list of reviews with filters
}
```

**3. Review Response Component**
```typescript
// components/partner/ratings/review-response.tsx
export function ReviewResponse({ ratingId }: { ratingId: string }) {
  // Allow partner to respond to review
}
```

### Testing Checklist
- [ ] Test rating aggregation calculation
- [ ] Test review display and filtering
- [ ] Test partner response to review
- [ ] Test review flagging
- [ ] Test rating distribution display
- [ ] Test review moderation (admin)

### Estimated Effort
- **Database Schema:** 1h
- **API Endpoints:** 2h
- **Rating Aggregation Service:** 1h
- **UI Components:** 3h
- **Testing:** 1h

**Total: 8 hours**

---

## 3️⃣ Multi-Language Documents

### Overview
**Requirement:** Support multi-language document generation (voucher, invoice, itinerary) untuk partner whitelabel documents.

**Source:** BRD Section 5 (Documents & White-Label Output)

**Current Status:** ⚠️ Partial - Document generation ada, multi-language belum

### Requirements

#### Functional Requirements
1. **Supported Languages:**
   - Indonesian (default)
   - English
   - Mandarin (future)

2. **Document Types:**
   - Voucher (booking confirmation)
   - Invoice
   - Itinerary
   - Terms & Conditions

3. **Language Selection:**
   - Partner can set default language in whitelabel settings
   - Customer can select language during booking
   - Language can be changed per document generation

4. **Translation Management:**
   - Store translations in database
   - Support for dynamic content (dates, prices, names)
   - Fallback to default language if translation missing

### Technical Implementation

#### Database Schema
```sql
-- Create document_translations table
CREATE TABLE IF NOT EXISTS document_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type TEXT NOT NULL, -- 'voucher', 'invoice', 'itinerary', 'terms'
  language_code TEXT NOT NULL, -- 'id', 'en', 'zh'
  translation_key TEXT NOT NULL, -- 'booking_confirmation', 'total_amount', etc.
  translation_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_type, language_code, translation_key)
);

CREATE INDEX IF NOT EXISTS idx_document_translations_doc_type ON document_translations(document_type);
CREATE INDEX IF NOT EXISTS idx_document_translations_lang ON document_translations(language_code);

-- Add language preference to whitelabel_settings
ALTER TABLE whitelabel_settings
ADD COLUMN IF NOT EXISTS default_document_language TEXT DEFAULT 'id';
```

#### Translation Service
```typescript
// lib/documents/translations.ts
export async function getDocumentTranslation(
  documentType: 'voucher' | 'invoice' | 'itinerary' | 'terms',
  languageCode: 'id' | 'en' | 'zh',
  key: string,
  variables?: Record<string, string | number>
): Promise<string> {
  // Fetch translation from database
  // Replace variables in translation
  // Fallback to default language if not found
}
```

#### Document Generation Service
```typescript
// lib/partner/whitelabel-document-generator.ts (enhance existing)
export async function generateVoucher(
  bookingId: string,
  language: 'id' | 'en' | 'zh' = 'id'
): Promise<Buffer> {
  // Fetch booking details
  // Get translations for language
  // Generate PDF with translated content
}
```

### UI Components

**1. Language Selector**
```typescript
// components/partner/documents/language-selector.tsx
export function LanguageSelector({ 
  defaultValue, 
  onChange 
}: { 
  defaultValue: string;
  onChange: (lang: string) => void;
}) {
  // Language dropdown
}
```

**2. Document Preview**
```typescript
// components/partner/documents/document-preview.tsx
export function DocumentPreview({ 
  bookingId, 
  documentType, 
  language 
}: { 
  bookingId: string;
  documentType: 'voucher' | 'invoice' | 'itinerary';
  language: string;
}) {
  // Preview document in selected language
}
```

### Translation Content

**Default Translations (Indonesian & English):**
```typescript
// lib/documents/default-translations.ts
export const defaultTranslations = {
  voucher: {
    id: {
      booking_confirmation: 'Konfirmasi Pemesanan',
      booking_code: 'Kode Booking',
      trip_date: 'Tanggal Trip',
      // ... more translations
    },
    en: {
      booking_confirmation: 'Booking Confirmation',
      booking_code: 'Booking Code',
      trip_date: 'Trip Date',
      // ... more translations
    },
  },
  // ... other document types
};
```

### Testing Checklist
- [ ] Test voucher generation in Indonesian
- [ ] Test voucher generation in English
- [ ] Test invoice generation in multiple languages
- [ ] Test itinerary generation in multiple languages
- [ ] Test language fallback
- [ ] Test dynamic content (dates, prices)
- [ ] Test whitelabel language preference

### Estimated Effort
- **Database Schema:** 1h
- **Translation Service:** 2h
- **Document Generation Enhancement:** 4h
- **UI Components:** 3h
- **Translation Content:** 1h
- **Testing:** 1h

**Total: 12 hours**

---

## 4️⃣ AI Q&A on Products

### Overview
**Requirement:** AI-powered Q&A system untuk menjawab pertanyaan tentang produk/packages menggunakan RAG (Retrieval Augmented Generation).

**Source:** BRD Section 10 (AI Features - Agency Copilot)

**Current Status:** ❌ Not Implemented

### Requirements

#### Functional Requirements
1. **Question Types:**
   - Package details (inclusions, exclusions, itinerary)
   - Pricing questions (adult, child, infant, seasonality)
   - Availability questions
   - Destination information
   - Booking process questions

2. **AI Capabilities:**
   - Natural language understanding
   - Context-aware responses (based on package knowledge base)
   - Multi-turn conversation
   - Source citation (which package/document was used)

3. **Knowledge Base:**
   - Package descriptions
   - Itinerary details
   - Pricing rules
   - FAQ documents
   - Terms & conditions

4. **Response Quality:**
   - Accurate information retrieval
   - Clear, concise answers
   - Fallback to "I don't know" if uncertain
   - Suggest relevant packages if no direct match

### Technical Implementation

#### Database Schema
```sql
-- Create product_qa_logs table for tracking
CREATE TABLE IF NOT EXISTS product_qa_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES mitra_profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  package_ids UUID[], -- Packages referenced in answer
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  source_documents TEXT[], -- Document IDs used for context
  feedback TEXT, -- 'helpful', 'not_helpful', 'incorrect'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_qa_logs_partner_id ON product_qa_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_product_qa_logs_created_at ON product_qa_logs(created_at);

-- Create product_knowledge_base table (if not exists)
CREATE TABLE IF NOT EXISTS product_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'description', 'itinerary', 'faq', 'pricing'
  content_text TEXT NOT NULL,
  embedding VECTOR(1536), -- For vector search
  metadata JSONB, -- Additional metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_knowledge_base_package_id ON product_knowledge_base(package_id);
CREATE INDEX IF NOT EXISTS idx_product_knowledge_base_embedding ON product_knowledge_base USING ivfflat (embedding vector_cosine_ops);
```

#### AI Service
```typescript
// lib/ai/product-qa.ts
import { retrieveContextWithVector } from '@/lib/ai/rag';
import { chat } from '@/lib/gemini';
import { logger } from '@/lib/utils/logger';

const SYSTEM_PROMPT = `You are an AI assistant for travel agents. You help answer questions about travel packages, pricing, availability, and booking processes.

You have access to a knowledge base of package information. Always:
1. Use the provided context to answer questions accurately
2. Cite which packages you're referring to
3. If you're not certain, say "I don't have enough information"
4. Suggest relevant packages if the question is about finding a trip
5. Be concise and professional

Format your responses clearly with package names, prices, and key details.`;

export async function answerProductQuestion(
  question: string,
  partnerId: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{
  answer: string;
  sources: Array<{ packageId: string; packageName: string; relevance: number }>;
  confidence: number;
}> {
  // 1. Retrieve relevant context using RAG
  const context = await retrieveContextWithVector(question, 'product_knowledge_base');
  
  // 2. Build prompt with context and conversation history
  const prompt = buildPrompt(question, context, conversationHistory);
  
  // 3. Get AI response
  const response = await chat(prompt);
  
  // 4. Extract sources from context
  const sources = extractSources(context);
  
  // 5. Calculate confidence (simplified)
  const confidence = calculateConfidence(context, response);
  
  // 6. Log Q&A for analytics
  await logProductQA(partnerId, question, response, sources, confidence);
  
  return {
    answer: response,
    sources,
    confidence,
  };
}
```

#### API Endpoints

**1. Ask Product Question**
```typescript
// app/api/partner/ai/product-qa/route.ts
POST /api/partner/ai/product-qa
Body: { 
  question: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}
Response: {
  answer: string;
  sources: Array<{ packageId: string; packageName: string }>;
  confidence: number;
}
```

**2. Get Q&A History**
```typescript
// app/api/partner/ai/product-qa/history/route.ts
GET /api/partner/ai/product-qa/history
Query: { page, limit }
```

**3. Provide Feedback**
```typescript
// app/api/partner/ai/product-qa/[id]/feedback/route.ts
POST /api/partner/ai/product-qa/[id]/feedback
Body: { feedback: 'helpful' | 'not_helpful' | 'incorrect'; comment?: string }
```

### UI Components

**1. Product Q&A Chat Interface**
```typescript
// components/partner/ai/product-qa-chat.tsx
export function ProductQAChat() {
  // Chat interface for product questions
  // Show sources and confidence
  // Allow feedback
}
```

**2. Q&A History**
```typescript
// components/partner/ai/qa-history.tsx
export function QAHistory() {
  // Show past Q&A interactions
}
```

### Knowledge Base Population

**Script to populate knowledge base:**
```typescript
// scripts/populate-product-knowledge-base.ts
export async function populateKnowledgeBase() {
  // Fetch all packages
  // Extract content (description, itinerary, etc.)
  // Generate embeddings
  // Store in product_knowledge_base table
}
```

### Testing Checklist
- [ ] Test package detail questions
- [ ] Test pricing questions
- [ ] Test availability questions
- [ ] Test multi-turn conversation
- [ ] Test source citation
- [ ] Test confidence scoring
- [ ] Test fallback for unknown questions
- [ ] Test knowledge base retrieval accuracy

### Estimated Effort
- **Database Schema:** 2h
- **AI Service:** 8h
- **API Endpoints:** 4h
- **UI Components:** 8h
- **Knowledge Base Population:** 4h
- **Testing:** 4h

**Total: 30 hours**

---

## 5️⃣ AI Quotation Refinement

### Overview
**Requirement:** AI-powered quotation refinement untuk improve draft quotations yang dihasilkan oleh AI Quotation Copilot.

**Source:** BRD Section 10 (AI Features - Agency Copilot)

**Current Status:** ❌ Not Implemented (depends on AI Quotation Copilot)

**Dependencies:** AI Quotation Copilot (already implemented)

### Requirements

#### Functional Requirements
1. **Refinement Capabilities:**
   - Improve package suggestions based on feedback
   - Adjust pricing based on budget constraints
   - Optimize itinerary based on preferences
   - Add/remove inclusions based on requirements

2. **Refinement Triggers:**
   - User feedback on draft quotation
   - Budget adjustment request
   - Date change request
   - Pax count change request

3. **Refinement Output:**
   - Updated quotation with changes highlighted
   - Explanation of changes
   - Alternative options if applicable

### Technical Implementation

#### API Endpoints

**1. Refine Quotation**
```typescript
// app/api/partner/ai/quotation/refine/route.ts
POST /api/partner/ai/quotation/refine
Body: {
  quotationId: string; // Draft quotation ID
  feedback?: string; // User feedback
  changes?: {
    budget?: number;
    dates?: { start: string; end: string };
    paxCount?: number;
    preferences?: string[];
  };
}
Response: {
  refinedQuotation: DraftQuotation;
  changes: Array<{ field: string; oldValue: any; newValue: any; reason: string }>;
}
```

#### Refinement Service
```typescript
// lib/ai/quotation-refinement.ts
export async function refineQuotation(
  quotationId: string,
  feedback?: string,
  changes?: QuotationChanges
): Promise<RefinedQuotation> {
  // 1. Fetch original quotation
  // 2. Analyze feedback/changes
  // 3. Use AI to generate refined suggestions
  // 4. Compare old vs new
  // 5. Return refined quotation with change explanations
}
```

### UI Components

**1. Quotation Refinement Interface**
```typescript
// components/partner/ai/quotation-refinement.tsx
export function QuotationRefinement({ quotationId }: { quotationId: string }) {
  // Show original quotation
  // Allow user to provide feedback or request changes
  // Show refined quotation with diff view
}
```

**2. Change Comparison View**
```typescript
// components/partner/ai/quotation-diff.tsx
export function QuotationDiff({ 
  original, 
  refined 
}: { 
  original: DraftQuotation;
  refined: DraftQuotation;
}) {
  // Show side-by-side comparison
  // Highlight changes
}
```

### Testing Checklist
- [ ] Test refinement with budget feedback
- [ ] Test refinement with date change
- [ ] Test refinement with pax count change
- [ ] Test refinement with preference changes
- [ ] Test change explanation accuracy
- [ ] Test alternative suggestions

### Estimated Effort
- **API Endpoints:** 4h
- **Refinement Service:** 8h
- **UI Components:** 6h
- **Testing:** 2h

**Total: 20 hours**

---

## 6️⃣ AI Sales Insights

### Overview
**Requirement:** AI-powered sales insights dan recommendations untuk membantu partner meningkatkan penjualan.

**Source:** BRD Section 10 (AI Features - Agency Copilot)

**Current Status:** ❌ Not Implemented

**Dependencies:** Analytics dashboard (exists)

### Requirements

#### Functional Requirements
1. **Insight Types:**
   - Sales trends analysis
   - Package performance recommendations
   - Customer behavior insights
   - Pricing optimization suggestions
   - Seasonal opportunity identification

2. **Insight Delivery:**
   - Daily/weekly/monthly reports
   - Real-time alerts for opportunities
   - Actionable recommendations
   - Predictive analytics

3. **Insight Categories:**
   - Revenue insights
   - Booking patterns
   - Customer insights
   - Product recommendations
   - Competitive analysis (if data available)

### Technical Implementation

#### Database Schema
```sql
-- Create sales_insights table
CREATE TABLE IF NOT EXISTS sales_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES mitra_profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'trend', 'recommendation', 'opportunity', 'warning'
  category TEXT NOT NULL, -- 'revenue', 'booking', 'customer', 'product'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB, -- Insight-specific data
  recommendations TEXT[], -- Array of actionable recommendations
  confidence_score DECIMAL(3,2),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Some insights expire
  is_read BOOLEAN DEFAULT FALSE,
  is_actioned BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sales_insights_partner_id ON sales_insights(partner_id);
CREATE INDEX IF NOT EXISTS idx_sales_insights_type ON sales_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_sales_insights_generated_at ON sales_insights(generated_at);
```

#### AI Insights Service
```typescript
// lib/ai/sales-insights.ts
export async function generateSalesInsights(
  partnerId: string,
  timeframe: 'daily' | 'weekly' | 'monthly'
): Promise<SalesInsight[]> {
  // 1. Fetch sales data for timeframe
  // 2. Analyze trends using AI
  // 3. Generate insights and recommendations
  // 4. Store in sales_insights table
  // 5. Return insights
}

export async function generateRealTimeInsights(
  partnerId: string
): Promise<SalesInsight[]> {
  // Generate insights based on recent activity
  // E.g., "You have 3 pending bookings, follow up now"
}
```

#### API Endpoints

**1. Get Sales Insights**
```typescript
// app/api/partner/ai/sales-insights/route.ts
GET /api/partner/ai/sales-insights
Query: { timeframe, category, limit }
```

**2. Generate Insights**
```typescript
// app/api/partner/ai/sales-insights/generate/route.ts
POST /api/partner/ai/sales-insights/generate
Body: { timeframe: 'daily' | 'weekly' | 'monthly' }
```

**3. Mark Insight as Read/Actioned**
```typescript
// app/api/partner/ai/sales-insights/[id]/action/route.ts
POST /api/partner/ai/sales-insights/[id]/action
Body: { action: 'read' | 'actioned' }
```

### UI Components

**1. Sales Insights Dashboard**
```typescript
// components/partner/ai/sales-insights-dashboard.tsx
export function SalesInsightsDashboard() {
  // Show all insights
  // Filter by type, category
  // Show actionable recommendations
}
```

**2. Insight Card**
```typescript
// components/partner/ai/insight-card.tsx
export function InsightCard({ insight }: { insight: SalesInsight }) {
  // Display single insight
  // Show recommendations
  // Allow mark as read/actioned
}
```

### Testing Checklist
- [ ] Test daily insights generation
- [ ] Test weekly insights generation
- [ ] Test monthly insights generation
- [ ] Test real-time insights
- [ ] Test insight accuracy
- [ ] Test recommendation relevance
- [ ] Test insight expiration

### Estimated Effort
- **Database Schema:** 2h
- **AI Insights Service:** 12h
- **API Endpoints:** 6h
- **UI Components:** 12h
- **Testing:** 8h

**Total: 40 hours**

---

## 7️⃣ Travel Circle / Arisan

### Overview
**Requirement:** Travel Circle (Arisan/Tabungan Bersama) system untuk group savings dengan lock-in mechanism.

**Source:** PRD Section 5.1.B (Social Commerce)

**Current Status:** ❌ Not Implemented

**Dependencies:** Wallet system (exists)

### Requirements

#### Functional Requirements
1. **Circle Creation:**
   - Create circle with target amount
   - Set monthly contribution amount
   - Set circle members (min 5, max 20)
   - Set circle duration (months)

2. **Contribution Management:**
   - Auto-reminder on 1st of each month
   - Track contributions per member
   - Lock-in mechanism (cannot withdraw)
   - Transparent balance display

3. **Circle Completion:**
   - Auto-booking when target reached
   - Distribute booking to members
   - Refund excess (if any)

4. **Circle Management:**
   - View circle status
   - View member contributions
   - Cancel circle (with refund rules)

### Technical Implementation

#### Database Schema
```sql
-- Create travel_circles table
CREATE TABLE IF NOT EXISTS travel_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES mitra_profiles(id) ON DELETE CASCADE,
  target_amount DECIMAL(12,2) NOT NULL,
  monthly_contribution DECIMAL(12,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL, -- Target package
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  current_balance DECIMAL(12,2) DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_completion_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create travel_circle_members table
CREATE TABLE IF NOT EXISTS travel_circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES travel_circles(id) ON DELETE CASCADE,
  member_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  total_contributed DECIMAL(12,2) DEFAULT 0,
  contributions_count INTEGER DEFAULT 0,
  last_contribution_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'completed', 'left'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(circle_id, member_id)
);

-- Create travel_circle_contributions table
CREATE TABLE IF NOT EXISTS travel_circle_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES travel_circles(id) ON DELETE CASCADE,
  member_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'wallet', 'transfer', 'midtrans'
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_travel_circles_creator_id ON travel_circles(creator_id);
CREATE INDEX IF NOT EXISTS idx_travel_circles_status ON travel_circles(status);
CREATE INDEX IF NOT EXISTS idx_travel_circle_members_circle_id ON travel_circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_travel_circle_contributions_circle_id ON travel_circle_contributions(circle_id);
```

#### API Endpoints

**1. Create Travel Circle**
```typescript
// app/api/partner/travel-circles/route.ts
POST /api/partner/travel-circles
Body: {
  name: string;
  description?: string;
  targetAmount: number;
  monthlyContribution: number;
  durationMonths: number;
  packageId?: string;
  memberIds: string[]; // Customer IDs
}
```

**2. Get Travel Circles**
```typescript
// app/api/partner/travel-circles/route.ts
GET /api/partner/travel-circles
Query: { status, page, limit }
```

**3. Add Contribution**
```typescript
// app/api/partner/travel-circles/[id]/contribute/route.ts
POST /api/partner/travel-circles/[id]/contribute
Body: {
  memberId: string;
  amount: number;
  paymentMethod: 'wallet' | 'transfer' | 'midtrans';
}
```

**4. Get Circle Details**
```typescript
// app/api/partner/travel-circles/[id]/route.ts
GET /api/partner/travel-circles/[id]
```

**5. Complete Circle**
```typescript
// app/api/partner/travel-circles/[id]/complete/route.ts
POST /api/partner/travel-circles/[id]/complete
```

#### Background Jobs

**Cron Job: Contribution Reminders**
```typescript
// lib/jobs/travel-circle-reminders.ts
export async function sendContributionReminders() {
  // Send reminders on 1st of each month
  // Check for active circles
  // Send reminders to members who haven't contributed
}
```

**Cron Job: Circle Completion Check**
```typescript
// lib/jobs/travel-circle-completion.ts
export async function checkCircleCompletion() {
  // Check if any circle has reached target
  // Auto-complete and create bookings
}
```

### UI Components

**1. Travel Circle List**
```typescript
// components/partner/travel-circles/circle-list.tsx
export function TravelCircleList() {
  // Show all circles
  // Filter by status
}
```

**2. Create Circle Form**
```typescript
// components/partner/travel-circles/create-circle-form.tsx
export function CreateCircleForm() {
  // Form to create new circle
}
```

**3. Circle Details**
```typescript
// components/partner/travel-circles/circle-details.tsx
export function CircleDetails({ circleId }: { circleId: string }) {
  // Show circle details
  // Show member contributions
  // Show progress
}
```

### Testing Checklist
- [ ] Test circle creation
- [ ] Test member addition
- [ ] Test contribution via wallet
- [ ] Test contribution via transfer
- [ ] Test auto-reminder on 1st of month
- [ ] Test circle completion
- [ ] Test lock-in mechanism (cannot withdraw)
- [ ] Test refund on cancellation

### Estimated Effort
- **Database Schema:** 4h
- **API Endpoints:** 12h
- **Background Jobs:** 8h
- **UI Components:** 20h
- **Testing:** 16h

**Total: 60 hours**

---

## 8️⃣ Trip Merging UI

### Overview
**Requirement:** UI untuk trip merging (konsolidasi open trip) dengan drag-and-drop interface.

**Source:** PRD Section 4.4.B (Operational - Trip Merging)

**Current Status:** ⚠️ Partial - Backend logic mungkin ada, UI belum

**Dependencies:** Backend logic (needs verification)

### Requirements

#### Functional Requirements
1. **Booking Discovery:**
   - List "orphan" bookings (belum assigned ke trip)
   - Filter by package, date, destination
   - Show booking details (pax, status, etc.)

2. **Merging Interface:**
   - Drag-and-drop to select bookings
   - Visual preview of merged trip
   - Validation (same package, compatible dates, etc.)

3. **Trip Generation:**
   - Create new trip_master
   - Generate combined manifest
   - Assign guide/crew
   - Update booking statuses

4. **Conflict Detection:**
   - Check resource availability (kapal, villa)
   - Check guide availability
   - Warn about conflicts

### Technical Implementation

#### Database Schema
```sql
-- Verify trips table exists
-- Verify bookings table has trip_id column
-- If not, add:
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_orphan ON bookings(trip_id) WHERE trip_id IS NULL;
```

#### API Endpoints

**1. Get Orphan Bookings**
```typescript
// app/api/partner/bookings/orphan/route.ts
GET /api/partner/bookings/orphan
Query: { packageId, dateFrom, dateTo, destination }
```

**2. Validate Merge**
```typescript
// app/api/partner/trips/merge/validate/route.ts
POST /api/partner/trips/merge/validate
Body: { bookingIds: string[] }
Response: {
  valid: boolean;
  conflicts: Array<{ type: string; message: string }>;
  estimatedTrip: TripPreview;
}
```

**3. Merge Bookings into Trip**
```typescript
// app/api/partner/trips/merge/route.ts
POST /api/partner/trips/merge
Body: {
  bookingIds: string[];
  tripDate: string;
  guideId?: string;
  notes?: string;
}
Response: {
  tripId: string;
  manifestId: string;
}
```

**4. Get Trip Manifest**
```typescript
// app/api/partner/trips/[id]/manifest/route.ts
GET /api/partner/trips/[id]/manifest
```

### UI Components

**1. Orphan Bookings List**
```typescript
// components/partner/trips/orphan-bookings-list.tsx
export function OrphanBookingsList() {
  // Show orphan bookings
  // Allow selection for merging
}
```

**2. Trip Merge Interface**
```typescript
// components/partner/trips/trip-merge-interface.tsx
export function TripMergeInterface() {
  // Drag-and-drop interface
  // Show selected bookings
  // Show merge preview
  // Validate and execute merge
}
```

**3. Merge Preview**
```typescript
// components/partner/trips/merge-preview.tsx
export function MergePreview({ bookingIds }: { bookingIds: string[] }) {
  // Show preview of merged trip
  // Show conflicts if any
  // Show combined manifest preview
}
```

### Testing Checklist
- [ ] Test orphan bookings discovery
- [ ] Test booking selection
- [ ] Test merge validation
- [ ] Test conflict detection
- [ ] Test trip creation
- [ ] Test manifest generation
- [ ] Test booking status update

### Estimated Effort
- **Database Schema:** 1h
- **API Endpoints:** 8h
- **UI Components:** 16h
- **Testing:** 5h

**Total: 30 hours**

---

## 📋 Implementation Timeline

### Week 1-2: Quick Wins (24 hours)
1. ✅ Booking Reminder Verification (4h)
2. ✅ Product Rating Enhancement (8h)
3. ✅ Multi-Language Documents (12h)

### Week 3-4: AI Features Phase 1 (50 hours)
4. ✅ AI Q&A on Products (30h)
5. ✅ AI Quotation Refinement (20h)

### Week 5-6: AI Features Phase 2 & Social (100 hours)
6. ✅ AI Sales Insights (40h)
7. ✅ Travel Circle / Arisan (60h)

### Week 7: Operational Features (30 hours)
8. ✅ Trip Merging UI (30h)

**Total Timeline:** ~7 weeks

---

## 🎯 Success Criteria

### Booking Reminder Verification
- [ ] Reminders sent 4h, 24h, and 7d before trip
- [ ] Multi-channel delivery (WA, Email, In-app)
- [ ] Reminder tracking and logging

### Product Rating Enhancement
- [ ] Rating aggregation working
- [ ] Review management functional
- [ ] Partner can respond to reviews

### Multi-Language Documents
- [ ] Documents generated in Indonesian and English
- [ ] Language selection working
- [ ] Translation fallback working

### AI Q&A on Products
- [ ] Accurate answers to product questions
- [ ] Source citation working
- [ ] Confidence scoring > 0.7

### AI Quotation Refinement
- [ ] Refinement improves quotations
- [ ] Change explanations clear
- [ ] Alternative suggestions relevant

### AI Sales Insights
- [ ] Daily/weekly/monthly insights generated
- [ ] Recommendations actionable
- [ ] Real-time alerts working

### Travel Circle / Arisan
- [ ] Circle creation and management working
- [ ] Auto-reminders sent on 1st of month
- [ ] Lock-in mechanism enforced
- [ ] Auto-completion when target reached

### Trip Merging UI
- [ ] Orphan bookings discoverable
- [ ] Drag-and-drop interface functional
- [ ] Merge validation working
- [ ] Trip and manifest generation working

---

## 📝 Notes & Considerations

1. **Dependencies:**
   - AI Quotation Refinement depends on AI Quotation Copilot (already implemented)
   - All features depend on existing infrastructure (wallet, notifications, etc.)

2. **Testing Strategy:**
   - Unit tests for services
   - Integration tests for API endpoints
   - E2E tests for critical flows

3. **Performance:**
   - AI features may require rate limiting
   - Background jobs should be optimized
   - Database indexes for query performance

4. **Security:**
   - RLS policies for all new tables
   - Rate limiting for AI endpoints
   - Input validation for all APIs

5. **Monitoring:**
   - Log all AI interactions
   - Track insight generation performance
   - Monitor background job execution

---

**Last Updated:** 2025-01-31  
**Next Steps:** Begin implementation with Priority 1 (Quick Wins)

