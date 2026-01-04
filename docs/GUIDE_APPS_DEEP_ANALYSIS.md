# Guide Apps - Analisa Mendalam & Komprehensif

**Tanggal Analisa:** 2025-01-XX  
**Status:** ✅ Complete Analysis  
**Scope:** Seluruh fitur, arsitektur, dan implementasi Guide Apps

---

## 📋 Executive Summary

Guide Apps adalah **Progressive Web App (PWA) mobile-first** yang dirancang untuk tour guides dengan fokus pada:
- **Offline-First Architecture** - Bekerja tanpa koneksi internet
- **AI-Native** - 13 fitur AI terintegrasi
- **Real-time Sync** - Sinkronisasi otomatis saat online
- **Gamification** - Badges, levels, leaderboard
- **Enterprise-Grade** - Type-safe, error handling, logging

**Total Fitur:** 50+ fitur utama  
**Total API Routes:** 100+ endpoints  
**Database Tables:** 30+ tables terkait guide

---

## 🏗️ Arsitektur & Teknologi Stack

### Core Technologies

```
Frontend:
├── Next.js 16.0.10+ (App Router, RSC, Turbopack)
├── React 19.2.3
├── TypeScript (Strict Mode, noUncheckedIndexedAccess)
├── TanStack Query v5.90+ (Server State)
├── Zustand v5.0.x (Client State)
├── Shadcn UI + Tailwind CSS v4.1+
└── PWA (Service Worker, IndexedDB)

Backend:
├── Next.js API Routes (Serverless)
├── Supabase (PostgreSQL + pgvector)
├── RLS (Row Level Security)
└── Branch-based Multi-tenant

AI & Integrations:
├── Google Gemini AI (DeepSeek-V3.2)
├── OpenWeather API
├── Google Maps API
├── WhatsApp Cloud API
├── Resend (Email)
└── Xendit (Payment)
```

### Arsitektur Pattern

**1. Route-Based Separation**
```
app/[locale]/(mobile)/guide/
├── page.tsx                    # Dashboard
├── trips/                      # Trip management
├── attendance/                 # GPS check-in/out
├── manifest/                   # Passenger manifest
├── wallet/                     # Earnings & payments
├── contracts/                  # Work contracts
├── profile/                    # Profile management
├── training/                    # Training modules
├── assessments/                # Self-assessments
├── onboarding/                 # Onboarding flow
├── license/                    # Guide license
├── status/                     # Availability status
├── sos/                        # Emergency SOS
├── challenges/                 # Gamification
├── leaderboard/                # Rankings
├── social/                     # Social feed
├── notifications/              # Notifications
└── [30+ more features]
```

**2. API Routes Structure**
```
app/api/guide/
├── trips/                      # Trip operations
├── attendance/                 # Check-in/out
├── manifest/                   # Manifest operations
├── wallet/                     # Financial operations
├── contracts/                  # Contract management
├── status/                     # Status & availability
├── quick-actions/              # Contextual actions
├── stats/                      # Statistics
├── [100+ more endpoints]
```

**3. Library Organization**
```
lib/guide/
├── attendance.ts              # Attendance utilities
├── manifest.ts                # Manifest operations
├── offline-sync.ts            # Offline sync manager
├── geofencing.ts             # GPS validation
├── photo-upload.ts            # Image handling
├── realtime-sync.ts          # Real-time updates
├── smart-preload.ts          # Data preloading
├── sos.ts                    # Emergency handling
├── trip-feedback.ts          # Feedback management
├── itinerary.ts              # Itinerary operations
├── contextual-actions.ts     # Smart actions
├── gamification.ts           # Badges & levels
├── level-benefits.ts         # Level benefits
├── contract-payment.ts       # Payment calculations
└── error-handler.ts          # Error handling
```

---

## 🎯 Fitur Utama - Analisa Detail

### 1. Dashboard (`/guide`)

**Komponen:** `guide-dashboard-client.tsx`

**Fitur:**
- ✅ Status indicator (Standby/On Trip/Not Available)
- ✅ Active trip card dengan quick info
- ✅ Quick actions (contextual, max 4 primary + expandable secondary)
- ✅ Weather widget (real-time + alerts)
- ✅ Challenges widget (gamification)
- ✅ Stats cards (completed trips, rating, income, penalties)
- ✅ Upcoming trips list
- ✅ Onboarding progress prompt
- ✅ Offline status banner
- ✅ Pull-to-refresh
- ✅ Learning Hub entry

**Data Sources:**
- `GET /api/guide/status` - Current status
- `GET /api/guide/trips` - Trip list
- `GET /api/guide/quick-actions` - Contextual actions
- `GET /api/guide/stats` - Statistics
- `GET /api/guide/insights/monthly` - Monthly insights
- `GET /api/guide/onboarding/steps` - Onboarding progress

**Contextual Actions Logic:**
- Time-based prioritization (morning/afternoon/evening)
- Trip-based prioritization (has active trip, upcoming trip)
- Status-based filtering
- Removes duplicates dan bottom nav items

**UI/UX:**
- Mobile-first design
- Skeleton loaders
- Error states dengan retry
- Empty states dengan CTAs
- Visual hierarchy dengan gradients
- Pulse animation untuk SOS button

---

### 2. Trips Management (`/guide/trips`)

**Komponen:** `trips-client.tsx`, `trip-detail-client.tsx`

**Fitur List:**
- ✅ Filter by status (all, ongoing, upcoming, completed, cancelled)
- ✅ Filter by date (all, this month, next month, specific month)
- ✅ Pending confirmation alert dengan countdown
- ✅ Trip cards dengan:
  - Date badge (enhanced design)
  - Trip name & code
  - Status badge
  - Guest count
  - Fee amount (transparent)
  - Confirmation deadline (if pending)
- ✅ Confirmation dialog (accept/reject dengan reason)
- ✅ Empty states
- ✅ Loading states

**Fitur Detail:**
- ✅ Trip header dengan gradient design
- ✅ Package info section
- ✅ Itinerary timeline
- ✅ Trip tasks checklist
- ✅ Trip briefing (AI-generated)
- ✅ AI assistant coaching
- ✅ AI trip insights
- ✅ AI chat assistant
- ✅ Manifest preview
- ✅ Quick actions grid (Chat, Equipment, Evidence, Expenses)
- ✅ Completion checklist
- ✅ Weather summary
- ✅ Meeting point dengan map navigation

**Data Sources:**
- `GET /api/guide/trips` - Trip list
- `GET /api/guide/trips/[id]/package-info` - Package details
- `GET /api/guide/trips/[id]/itinerary` - Itinerary
- `GET /api/guide/trips/[id]/briefing` - AI briefing
- `GET /api/guide/trips/[id]/ai-insights` - AI insights
- `GET /api/guide/trips/[id]/chat-ai` - AI chat
- `POST /api/guide/trips/[id]/confirm` - Confirm/reject trip

**Assignment Flow:**
1. Admin assigns trip → `trip_guides` table
2. Status: `pending_confirmation`
3. Guide receives notification
4. Guide confirms/rejects before deadline
5. If confirmed → `confirmed`, if rejected → `rejected`
6. If expired → `auto_reassigned`

---

### 3. Attendance System (`/guide/attendance`)

**Komponen:** `attendance-client.tsx`

**Fitur:**
- ✅ GPS-based check-in/check-out
- ✅ Geofencing validation (radius-based)
- ✅ Photo capture dengan compression
- ✅ AI photo analysis (happiness detection)
- ✅ Happiness rating (1-5 scale)
- ✅ Description/notes (required)
- ✅ Check-in window validation (2 hours before to 1 hour after)
- ✅ Late detection & penalty calculation
- ✅ Auto-refresh location (5s countdown)
- ✅ Direction compass ke meeting point
- ✅ GPS accuracy indicator
- ✅ Distance display dengan progress bar
- ✅ Statistics (today, week, streak, average time)
- ✅ Attendance history card
- ✅ Trip selector (if multiple trips)
- ✅ Offline support (queued mutations)

**Geofencing Logic:**
- Meeting point coordinates dari trip/package
- Default radius: 100m (configurable)
- Validates within radius sebelum check-in
- Shows distance & direction

**Check-in Window:**
- Start: 2 hours before trip departure
- End: 1 hour after trip departure
- Shows warning jika too early/too late

**Late Penalty:**
- Automatic detection jika check-in after departure time
- Penalty: Rp 25,000 (configurable)
- Recorded in `salary_deductions` table

**Data Sources:**
- `GET /api/guide/attendance/status` - Current status
- `POST /api/guide/attendance/check-in` - Check-in
- `POST /api/guide/attendance/check-out` - Check-out
- `POST /api/guide/attendance/check-in-photo` - Upload photo
- `POST /api/guide/attendance/analyze-photo` - AI analysis
- `GET /api/guide/attendance/stats` - Statistics
- `GET /api/guide/attendance/history` - History

**Offline Support:**
- Queues mutations ke IndexedDB
- Auto-sync saat online
- Background sync API support

---

### 4. Manifest System (`/guide/manifest`)

**Komponen:** `manifest-client.tsx`

**Fitur:**
- ✅ Passenger list dengan status (pending/boarded/returned)
- ✅ Search passengers
- ✅ Filter by status (all, pending, boarded, returned)
- ✅ Mark passenger as boarded
- ✅ Mark passenger as returned
- ✅ Bulk operations (bulk mark boarded/returned)
- ✅ Edit passenger details (notes, allergy, special request)
- ✅ AI suggestions untuk notes
- ✅ Documentation URL (Google Drive link)
- ✅ Real-time updates
- ✅ Offline support

**Passenger Status Flow:**
1. `pending` - Belum naik
2. `boarded` - Sudah naik (marked saat boarding)
3. `returned` - Sudah kembali (marked saat return)

**AI Suggestions:**
- Auto-suggest notes berdasarkan passenger type
- Safety alerts untuk special cases
- Grouping suggestions

**Data Sources:**
- `GET /api/guide/manifest` - Get manifest
- `POST /api/guide/manifest/check` - Mark boarded/returned
- `POST /api/guide/manifest/bulk-check` - Bulk operations
- `POST /api/guide/manifest/details` - Update details
- `POST /api/guide/manifest/suggest` - AI suggestions
- `POST /api/guide/trips/[id]/documentation` - Save doc URL

**Offline Support:**
- Local manifest storage (IndexedDB)
- Queued mutations
- Auto-sync saat online

---

### 5. Wallet System (`/guide/wallet`)

**Komponen:** `wallet-enhanced-client.tsx`

**Fitur Overview Tab:**
- ✅ Balance display
- ✅ Earnings summary (today, this week, this month)
- ✅ Growth indicators (trending up/down)
- ✅ Pending earnings (trips belum dibayar)
- ✅ Forecast (estimasi bulan depan)
- ✅ Insights & recommendations (AI-powered)
- ✅ Milestones (achievements)
- ✅ Smart withdraw dengan bank account selection
- ✅ Quick actions (50%, all, preset amounts)

**Fitur Analytics Tab:**
- ✅ Breakdown (base fee, bonus, deductions)
- ✅ Trip breakdown (detail per trip)
- ✅ Trends (6 months)
- ✅ Export transactions (CSV)

**Fitur Transactions Tab:**
- ✅ Transaction list dengan grouping by date
- ✅ Filter by type (all, earning, withdraw_request, adjustment)
- ✅ Search transactions
- ✅ Export to CSV

**Fitur Goals Tab:**
- ✅ Savings goals management
- ✅ Auto-save percentage
- ✅ Progress tracking
- ✅ Create/edit/delete goals

**Data Sources:**
- `GET /api/guide/wallet` - Balance & transactions
- `GET /api/guide/wallet/analytics` - Analytics
- `GET /api/guide/wallet/pending` - Pending earnings
- `GET /api/guide/wallet/forecast` - Forecast
- `GET /api/guide/wallet/insights` - AI insights
- `GET /api/guide/wallet/milestones` - Milestones
- `GET /api/guide/wallet/goals` - Goals
- `POST /api/guide/wallet` - Withdraw request
- `GET /api/guide/wallet/transactions` - Transactions
- `GET /api/guide/bank-accounts` - Bank accounts

**Wallet Features:**
- Multi-bank account support
- Bank account approval workflow
- Default account selection
- Withdraw request dengan approval
- Auto-save to goals
- Milestone tracking
- AI-powered insights

---

### 6. Contracts System (`/guide/contracts`)

**Komponen:** `contracts-client.tsx`, `contract-detail-client.tsx`

**Fitur:**
- ✅ Contract list dengan status filter
- ✅ Contract types (annual master contracts)
- ✅ Status tracking (draft, pending_signature, pending_company, active, expired, terminated, rejected)
- ✅ Digital signature
- ✅ PDF download
- ✅ Contract details view
- ✅ Resignation request
- ✅ Sanctions tracking

**Contract Types:**
- `annual` - Master contract tahunan
- Fee per trip assignment (dari `trip_guides.fee_amount`)

**Status Flow:**
1. Admin creates contract → `draft`
2. Admin sends to guide → `pending_signature`
3. Guide signs → `pending_company`
4. Company signs → `active`
5. Expires → `expired`
6. Can be terminated → `terminated`
7. Can be rejected → `rejected`

**Data Sources:**
- `GET /api/guide/contracts` - Contract list
- `GET /api/guide/contracts/[id]` - Contract details
- `POST /api/guide/contracts/[id]/sign` - Sign contract
- `GET /api/guide/contracts/[id]/pdf` - Download PDF
- `POST /api/guide/contracts/[id]/resign` - Request resignation

---

### 7. Profile Management (`/guide/profile`)

**Fitur:**
- ✅ Personal info (name, phone, NIK, avatar)
- ✅ Bank accounts (with approval workflow)
- ✅ Emergency contacts
- ✅ Medical info (blood type, allergies, medications)
- ✅ Documents upload
- ✅ Password change
- ✅ Guide badges display
- ✅ Training widget
- ✅ Insight widget

**Data Sources:**
- `GET /api/guide/profile` - Profile data
- `PUT /api/guide/profile` - Update profile
- `GET /api/guide/bank-accounts` - Bank accounts
- `GET /api/guide/emergency-contacts` - Emergency contacts
- `GET /api/guide/medical-info` - Medical info
- `POST /api/guide/bank-accounts` - Add bank account

---

### 8. Training System (`/guide/training`)

**Fitur:**
- ✅ Training modules list
- ✅ Module completion tracking
- ✅ Progress tracking
- ✅ Certificates

**Data Sources:**
- `GET /api/guide/training/modules` - Modules list

---

### 9. Assessments System (`/guide/assessments`)

**Fitur:**
- ✅ Available assessments list
- ✅ Assessment templates
- ✅ Start assessment
- ✅ Auto-save answers
- ✅ Submit assessment
- ✅ Results view dengan AI insights
- ✅ Assessment history

**Data Sources:**
- `GET /api/guide/assessments/available` - Available assessments
- `GET /api/guide/assessments/templates/[templateId]` - Template
- `POST /api/guide/assessments/start` - Start assessment
- `POST /api/guide/assessments/[assessmentId]/answers` - Save answers
- `POST /api/guide/assessments/[assessmentId]/submit` - Submit
- `GET /api/guide/assessments/[assessmentId]` - Assessment details
- `GET /api/guide/assessments/history` - History

---

### 10. Onboarding System (`/guide/onboarding`)

**Fitur:**
- ✅ Onboarding steps list
- ✅ Progress tracking
- ✅ Step completion
- ✅ Progress percentage
- ✅ Step dependencies
- ✅ Resource links (videos, documents)

**Data Sources:**
- `GET /api/guide/onboarding/steps` - Steps list
- `GET /api/guide/onboarding/progress` - Progress
- `POST /api/guide/onboarding/steps/[stepId]/complete` - Complete step

---

### 11. License System (`/guide/license`)

**Fitur:**
- ✅ License eligibility check (8 requirements)
- ✅ Auto-populate dari existing data
- ✅ Application form
- ✅ Document verification
- ✅ Status tracking

**Eligibility Requirements:**
1. Profile Complete
2. Contract Signed
3. Onboarding Complete
4. Emergency Contact
5. Medical Info
6. Bank Account (Approved)
7. Training Complete
8. Assessment Complete

**Data Sources:**
- `GET /api/guide/license/eligibility` - Check eligibility
- `POST /api/guide/license/apply` - Apply for license

---

### 12. Status & Availability (`/guide/status`)

**Fitur:**
- ✅ Current status (standby, on_trip, not_available)
- ✅ Status update
- ✅ Availability windows (future availability)
- ✅ Status notes

**Data Sources:**
- `GET /api/guide/status` - Current status
- `POST /api/guide/status` - Update status
- `GET /api/guide/availability` - Availability windows

---

### 13. SOS System (`/guide/sos`)

**Fitur:**
- ✅ Emergency SOS button
- ✅ Location sharing
- ✅ Auto-notify emergency contacts
- ✅ Incident reporting

**Data Sources:**
- `POST /api/guide/sos` - Trigger SOS

---

### 14. Challenges & Gamification (`/guide/challenges`)

**Fitur:**
- ✅ Challenges list
- ✅ Challenge completion
- ✅ Rewards tracking
- ✅ Leaderboard
- ✅ Badges & achievements

**Data Sources:**
- `GET /api/guide/challenges` - Challenges
- `GET /api/guide/leaderboard` - Leaderboard
- `GET /api/guide/stats` - Stats dengan badges

---

### 15. Social Feed (`/guide/social`)

**Fitur:**
- ✅ Social feed (posts dari guides)
- ✅ Like posts
- ✅ Comments

**Data Sources:**
- `GET /api/guide/social/feed` - Feed
- `POST /api/guide/social/posts/[id]/like` - Like post

---

### 16. Notifications (`/guide/notifications`)

**Fitur:**
- ✅ Notifications list
- ✅ AI-prioritized notifications
- ✅ Read/unread status
- ✅ Push notifications

**Data Sources:**
- `GET /api/guide/notifications` - Notifications
- `GET /api/guide/notifications/prioritize` - AI prioritization

---

### 17. Broadcasts (`/guide/broadcasts`)

**Fitur:**
- ✅ Broadcasts list
- ✅ Read status
- ✅ Important announcements

**Data Sources:**
- `GET /api/guide/broadcasts` - Broadcasts
- `POST /api/guide/broadcasts/[id]/read` - Mark as read

---

### 18. Additional Features

**Trips Sub-features:**
- Equipment checklist (`/guide/trips/[slug]/equipment`)
- Evidence upload (`/guide/trips/[slug]/evidence`)
- Expenses tracking (`/guide/trips/[slug]/expenses`)
- Trip chat dengan Ops (`/guide/trips/[slug]/chat`)
- Trip wizard (`/guide/trips/[slug]/wizard`)

**Other Features:**
- ID Card (`/guide/id-card`)
- Shifts (`/guide/shifts`)
- Skills (`/guide/skills`)
- Performance (`/guide/performance`)
- Insights (`/guide/insights`)
- Feedback (`/guide/feedback`)
- Incidents (`/guide/incidents`)
- Documents (`/guide/documents`)
- Weather (`/guide/weather`)
- Tracking (`/guide/tracking`)
- Locations (`/guide/locations`)
- Sync Status (`/guide/sync-status`)

---

## 🤖 AI Features - 13 Fitur Terintegrasi

### 1. AI Chat Assistant (Trip Context-Aware)
- **File:** `lib/ai/trip-assistant.ts`
- **API:** `POST /api/guide/trips/[id]/chat-ai`
- **Features:** Real-time chat, context-aware, natural language queries

### 2. Smart Expense Categorization
- **File:** `lib/ai/expense-analyzer.ts`
- **API:** `POST /api/guide/expenses/analyze-receipt`
- **Features:** OCR receipt, auto-categorize, duplicate detection

### 3. AI-Powered Manifest Suggestions
- **File:** `lib/ai/manifest-assistant.ts`
- **API:** `POST /api/guide/manifest/suggest`
- **Features:** Auto-suggest notes, safety alerts, grouping

### 4. Predictive Trip Insights
- **File:** `lib/ai/trip-insights.ts`
- **API:** `GET /api/guide/trips/[id]/ai-insights`
- **Features:** Prediksi masalah, resource planning, route optimization

### 5. AI Feedback Analyzer
- **File:** `lib/ai/feedback-analyzer.ts`
- **API:** `POST /api/guide/feedback/analyze`
- **Features:** Auto-summarize, sentiment analysis, action items

### 6. Smart Notification Prioritization
- **File:** `lib/ai/notification-prioritizer.ts`
- **API:** `GET /api/guide/notifications/prioritize`
- **Features:** Priority scoring, smart grouping

### 7. Performance Coach
- **File:** `lib/ai/performance-coach.ts`
- **API:** `GET /api/guide/performance/coach`
- **Features:** Personalized coaching, improvement suggestions

### 8. Incident Assistant
- **File:** `lib/ai/incident-assistant.ts`
- **API:** `POST /api/guide/incidents/ai-assist`
- **Features:** Auto-generate incident reports

### 9. Route Optimizer
- **File:** `lib/ai/route-optimizer.ts`
- **API:** `POST /api/guide/route-optimization/ai`
- **Features:** Route optimization dengan AI

### 10. Document Scanner
- **File:** `lib/ai/document-scanner.ts`
- **API:** `POST /api/guide/documents/scan-enhanced`
- **Features:** OCR documents, auto-extract data

### 11. Voice Assistant
- **File:** `lib/ai/voice-assistant.ts`
- **API:** `POST /api/guide/voice/command`
- **Features:** Voice commands processing

### 12. Customer Sentiment Analysis
- **File:** `lib/ai/customer-sentiment.ts`
- **API:** `POST /api/guide/customer-sentiment/analyze`
- **Features:** Sentiment analysis dari feedback

### 13. Equipment Predictor
- **File:** `lib/ai/equipment-predictor.ts`
- **API:** `POST /api/guide/equipment/predictive-maintenance`
- **Features:** Predictive maintenance suggestions

---

## 📱 Offline-First Architecture

### IndexedDB Structure

**Database:** `aero-guide-db` (version 1)

**Stores:**
- `trips` - Trip data
- `manifest` - Manifest data (indexed by tripId)
- `attendance` - Attendance records (indexed by tripId, guideId)
- `evidence` - Evidence files (indexed by tripId)
- `expenses` - Expenses (indexed by tripId)
- `mutation_queue` - Queued mutations (indexed by status, timestamp)

### Mutation Queue System

**Mutation Types:**
- `CHECK_IN` - Check-in actions
- `CHECK_OUT` - Check-out actions
- `UPLOAD_EVIDENCE` - Evidence uploads
- `ADD_EXPENSE` - Expense additions
- `TRACK_POSITION` - Position tracking
- `UPDATE_MANIFEST` - Manifest updates
- `UPDATE_MANIFEST_DETAILS` - Manifest detail updates

**Sync Strategy:**
- Exponential backoff untuk retries
- Max 10 retries per mutation
- Background sync API support
- Data saver mode (skip heavy mutations on cellular)
- Auto-sync saat online
- Periodic sync (every 5 minutes)

**Sync Modes:**
- `normal` - Sync semua mutations
- `data_saver` - Skip heavy mutations on cellular

### Preload System

**Function:** `preloadTripData(tripId)`

**Preloads:**
- Trip details
- Manifest data
- Existing attendance records

**Usage:** Dipanggil saat guide di dermaga dengan signal untuk prepare offline mode

---

## 🗄️ Database Schema - Guide Tables

### Core Tables

**1. `users`**
- Guide profile data
- Multi-role support
- Branch association

**2. `trips`**
- Trip information
- Package association
- Status tracking

**3. `trip_guides`**
- Guide assignment ke trips
- Assignment status (confirmed, pending_confirmation, rejected, expired, auto_reassigned)
- Fee amount
- Confirmation deadline
- Check-in/out timestamps

**4. `guide_status`**
- Current status (standby, on_trip, not_available)
- Status notes

**5. `guide_availability`**
- Future availability windows
- Status (available, not_available)
- Reason

### Wallet Tables

**6. `guide_wallets`**
- Wallet balance
- Transaction history

**7. `guide_bank_accounts`**
- Bank account information
- Approval workflow (pending, approved, rejected)
- Default account flag

**8. `guide_wallet_transactions`**
- Transaction records
- Types: earning, withdraw_request, adjustment
- Status tracking

**9. `guide_wallet_goals`**
- Savings goals
- Auto-save percentage
- Progress tracking

**10. `guide_wallet_milestones`**
- Achievement milestones
- Milestone types

### Contract Tables

**11. `guide_contracts`**
- Master contracts
- Contract types (annual)
- Status tracking
- Digital signatures

**12. `guide_contract_trips`**
- Trip assignments under contract

**13. `guide_contract_payments`**
- Payment records

**14. `guide_contract_sanctions`**
- Sanctions tracking

**15. `guide_contract_resignations`**
- Resignation requests

### Attendance Tables

**16. `guide_attendance`**
- Check-in/out records
- Location data
- Photo URLs
- Happiness rating
- Description
- Late detection

### Manifest Tables

**17. `trip_manifest`** (implied dari bookings)
- Passenger list
- Boarding status
- Return status
- Special notes

### Enhancement Tables

**18. `guide_onboarding_steps`**
- Onboarding step definitions
- Step types, dependencies, resources

**19. `guide_onboarding_progress`**
- Guide onboarding progress
- Current step, completion percentage

**20. `guide_onboarding_step_completions`**
- Step completion logs

**21. `guide_assessment_templates`**
- Assessment templates
- Questions, scoring config

**22. `guide_assessments`**
- Guide assessments
- Answers, scores, insights

**23. `guide_skills_catalog`**
- Skills catalog
- Skill definitions, levels

**24. `guide_skills`**
- Guide skills
- Current level, validation

**25. `guide_skill_goals`**
- Skill development goals

**26. `guide_preferences`**
- Guide preferences
- Work preferences, notification preferences

**27. `guide_performance_metrics`**
- Performance metrics
- Period-based tracking

### Other Tables

**28. `guide_emergency_contacts`**
- Emergency contacts
- Auto-notify on SOS

**29. `guide_medical_info`**
- Medical information
- Blood type, allergies, medications

**30. `guide_quick_actions`**
- Quick actions configuration
- Branch-specific actions
- Display order

**31. `guide_license_applications`**
- License applications
- Eligibility tracking
- Document verification

**32. `guide_feedback`**
- Customer feedback
- AI analysis results

**33. `guide_incidents`**
- Incident reports
- AI-assisted generation

**34. `guide_challenges`**
- Gamification challenges
- Completion tracking

**35. `guide_social_posts`**
- Social feed posts
- Like/comment tracking

**36. `guide_notifications`**
- Notifications
- AI prioritization

**37. `guide_broadcasts`**
- Broadcasts/announcements
- Read status

---

## 🔐 Security & Best Practices

### Row Level Security (RLS)

**Policy Pattern:**
```sql
-- Guide can only see own data
CREATE POLICY "guide_own_access" ON table_name
  FOR ALL USING (guide_id = auth.uid());

-- Ops/Admin can see all
CREATE POLICY "guide_ops_access" ON table_name
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('ops', 'admin', 'super_admin')
    )
  );
```

### Branch Injection

**Multi-tenant Support:**
- Semua queries filter by `branch_id`
- Super admin bypass branch filter
- Branch context dari `getBranchContext()`

### Error Handling

**Pattern:**
```typescript
export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/endpoint');
  const supabase = await createClient();
  // Implementation
});
```

**Error Codes:**
- `UNAUTHORIZED` - 401
- `FORBIDDEN` - 403
- `VALIDATION_ERROR` - 400
- `NOT_FOUND` - 404
- `CONFLICT` - 409
- `RATE_LIMIT_EXCEEDED` - 429
- `INTERNAL_ERROR` - 500

### Logging

**Structured Logging:**
```typescript
logger.info('Operation', { context });
logger.error('Error', error, { context });
logger.warn('Warning', { context });
```

**Never use:** `console.log`, `console.error`

---

## 📊 State Management

### Server State (TanStack Query)

**Query Keys Factory:**
```typescript
queryKeys.guide.trips()
queryKeys.guide.tripsDetail(tripId)
queryKeys.guide.wallet.balance()
queryKeys.guide.wallet.analytics(period)
// ... 100+ more keys
```

**Pattern:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: queryKeys.guide.trips(),
  queryFn: async () => {
    const res = await fetch('/api/guide/trips');
    if (!res.ok) throw new Error('Failed');
    return res.json();
  },
});
```

### Client State (Zustand)

**Usage:** UI state, form state, temporary data

---

## 🎨 UI/UX Patterns

### Component Patterns

**1. Loading States**
- Skeleton loaders
- Spinner dengan message
- Card skeletons

**2. Error States**
- ErrorState component
- Retry functionality
- Error details (dev mode)

**3. Empty States**
- EmptyState component
- Icon, title, description
- Action buttons/CTAs

**4. Cards**
- Consistent card design
- Shadow & border styling
- Hover effects

### Design Tokens

**Colors:**
- Primary: Emerald (green) - `emerald-600`, `emerald-500`
- Secondary: Blue, Amber, Red
- Background: White, Slate-50
- Text: Slate-900, Slate-600

**Spacing:**
- Consistent spacing scale
- Mobile-first (smaller on mobile)

**Typography:**
- Font sizes: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl
- Font weights: font-medium, font-semibold, font-bold

---

## 🔄 Real-time Features

### Supabase Realtime

**Subscriptions:**
- Trip updates
- Manifest changes
- Notification updates
- Broadcast updates

**Implementation:**
- `lib/guide/realtime-sync.ts`
- Auto-subscribe/unsubscribe
- Connection state management

---

## 📈 Performance Optimizations

### 1. Code Splitting
- Route-based (automatic dengan App Router)
- Component-based (dynamic imports untuk heavy components)

### 2. Image Optimization
- Next.js Image component
- Compression untuk uploads
- Lazy loading

### 3. Data Fetching
- TanStack Query caching
- Stale time configuration
- Background refetching

### 4. Offline Support
- IndexedDB caching
- Preload critical data
- Mutation queue untuk offline actions

---

## 🧪 Testing

### Unit Tests
- Location: `tests/unit/guide/`
- Examples: `attendance.test.ts`, `geofencing.test.ts`

### E2E Tests
- Location: `tests/e2e/`
- Example: `guide-app.spec.ts`

---

## 📝 Code Standards

### Naming Conventions
- Files: `kebab-case` (e.g., `trip-detail-client.tsx`)
- Components: `PascalCase` (e.g., `TripDetailClient`)
- Functions: `camelCase` (e.g., `getTripManifest`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)

### Imports
- Absolute imports dengan `@/` alias
- Import order: external → internal → relative
- Named exports preferred

### TypeScript
- Strict mode enabled
- No `any` types
- `noUncheckedIndexedAccess: true`
- Use generated types dari `types/supabase.ts`

---

## 🚀 Deployment & Environment

### Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

**Optional:**
- `OPENWEATHER_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `RESEND_API_KEY`
- `XENDIT_SECRET_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- `VAPID_PRIVATE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

### Build Configuration

**Scripts:**
- `dev` - Development dengan Turbopack
- `build` - Production build
- `start` - Production server
- `type-check` - TypeScript validation
- `lint` - ESLint
- `test` - Vitest
- `test:e2e` - Playwright

**Build Warnings:**
- Suppress Serwist warnings: `SERWIST_SUPPRESS_TURBOPACK_WARNING=1`

---

## 📚 Documentation References

### Key Documents
- `docs/ARCHITECTURE.md` - System architecture
- `docs/USER_JOURNEY_BY_ROLE.md` - User journeys
- `docs/GUIDE_APP_ENHANCEMENT_ROADMAP.md` - Enhancement roadmap
- `docs/AI_IMPLEMENTATION_SUMMARY.md` - AI features
- `docs/GUIDE_LICENSE_INTEGRATION_COMPLETE.md` - License system
- `docs/WALLET_COMPLETE.md` - Wallet features

---

## ✅ Summary

### Total Fitur: 50+ Features
### Total API Routes: 100+ Endpoints
### Total Database Tables: 35+ Tables
### AI Features: 13 Features
### Offline Support: Full PWA dengan IndexedDB
### Real-time: Supabase Realtime subscriptions
### Security: RLS + Branch-based multi-tenant
### Performance: Optimized dengan caching & code splitting

---

**Status:** ✅ Complete Analysis  
**Last Updated:** 2025-01-XX  
**Next Review:** Quarterly
