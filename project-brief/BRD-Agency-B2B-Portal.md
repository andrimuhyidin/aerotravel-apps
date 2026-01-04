# 🎯 BUSINESS REQUIREMENTS DOCUMENT (BRD)

## Aero Partner B2B Travel Agency Portal – Complete Feature Set

**Version:** 1.0
**Date:** 24 Dec 2025  
**Status:** Ready for Cursor AI & Development  
**Scope:** Full B2B travel agency booking & management portal (`/partner` path)  
**Target Users:** Travel agents, travel agency staff, agency management

---

## 📌 PROJECT OVERVIEW

**What is this?**  
A B2B platform where travel agencies can:

- Browse Aero's products with net B2B pricing
- Book trips for their own customers (white-label)
- Manage customer data, invoices, and commissions
- Access sales analytics & business intelligence
- Collaborate with teams via multi-user management
- Use AI copilot to speed up sales work

**Why build this?**

- Reduce friction: agencies no longer email/call for availability, pricing, booking
- Scale distribution: hundreds of small travel agencies can self-serve
- Transparency: clear margins, commissions, payment terms
- Efficiency: automation + AI = faster quotations + more bookings

**Key metrics:**

- Target: 50+ travel agencies as partners within 6 months
- Expected booking volume: 20% of total Aero bookings from agency channel
- Success: agencies do 80% of work self-serve without admin support

---

## 🏗️ SYSTEM ARCHITECTURE

```
/partner (Travel Agency Portal)
├── /auth
│   ├── login (shared with /operator & /admin)
│   ├── register (agency application form)
│   └── profile setup
├── /dashboard
│   ├── sales summary (revenue, commissions, trends)
│   └── quick actions
├── /catalog
│   ├── browse packages (B2B view)
│   ├── filter & search
│   └── package detail page
├── /booking
│   ├── new booking form
│   ├── booking list & management
│   └── booking status tracking
├── /customers
│   ├── customer list (agency's own customers)
│   ├── customer detail & history
│   └── customer segmentation
├── /documents
│   ├── voucher & confirmation (white-label)
│   ├── itinerary download
│   └── T&C & supporting docs
├── /finance
│   ├── invoice management
│   ├── payment tracking
│   └── commission reports
├── /sales
│   ├── sales reports & analytics
│   ├── performance per agent
│   └── export functionality
├── /team
│   ├── sub-user management (agents, branches)
│   ├── role & permissions
│   └── performance tracking per user
├── /support
│   ├── FAQ & product info
│   ├── notification & changelog
│   ├── B2B support ticket system
│   └── communication with Aero team
└── /ai
    ├── AI Travel Assistant (chatbot)
    ├── Quotation Copilot
    ├── Inbox Parser (email/WA integration - future)
    └── Sales Insights
```

---

## 📋 DETAILED FEATURES (GROUPED BY FUNCTION)

### 1️⃣ ONBOARDING & PROFILE MANAGEMENT

| Feature                            | Description                                                                                | Why needed                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| **Agency registration form**       | Travel agency fills: company name, PIC, email, phone, legal docs (SIUP/NPWP), bank account | Control who can access net pricing |
| **Registration approval workflow** | Admin reviews submission, approves/rejects, agency gets notification                       | Quality gate for partner network   |
| **Agency profile page**            | Edit company info, logo, branding settings, legal docs, bank account                       | Keep master data up-to-date        |
| **Tier/level management**          | Assign agency to tier (Bronze/Silver/Gold) based on volume/relationship                    | Enable tiered pricing & incentives |
| **Agency dashboard (overview)**    | Quick glance: YTD revenue, commissions, bookings this month, top agent                     | Decision-making at a glance        |

---

### 2️⃣ CATALOG & PRODUCT BROWSING

| Feature                              | Description                                                                                   | Why needed                            |
| ------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| **Catalog view (B2B)**               | Display all Aero packages with full details but emphasize net rate, not published price       | Agents see "real" pricing             |
| **Package cards**                    | Show: destination, duration, date range, capacity, inclusions, net price, markup suggestion   | Quick scan for agent decision         |
| **Search & filter**                  | Filter by: destination, duration, date, price range, pax range, trip type (bahari/island/etc) | Speed up finding right package        |
| **Package detail page**              | Full itinerary, inclusions/exclusions, photos, maps, min/max pax, meeting points, T&C         | Full info before booking              |
| **Availability calendar**            | Visual calendar showing available slots per package                                           | Real-time inventory visibility        |
| **Availability checker**             | Agent picks date → system shows real-time slot availability                                   | No double-booking                     |
| **Price transparency**               | Show net price, suggested markup, expected margin (e.g., "Margin: Rp 300k per booking")       | Help agent price competitively        |
| **Product rating/review (internal)** | Show which products are sold most, customer ratings                                           | Help agent recommend popular products |

---

### 3️⃣ BOOKING & ORDER MANAGEMENT

| Feature                                       | Description                                                                              | Why needed                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------- |
| **New booking form**                          | Multi-step form: select package → fill pax details → review → confirm                    | Structured data capture           |
| **Booking form fields**                       | Name, DOB, contact, special needs, room preference, dietary, emergency contact           | Full data for operations          |
| **Customer type selector**                    | Assign customer to segment (Individu, Keluarga, Corporate, Honeymoon, Sekolah)           | CRM insights & personalization    |
| **Multi-pax booking**                         | Add multiple passengers in one booking, assign to rooms/kapal                            | Support group trips               |
| **Multi-room/kapal selection**                | For large groups: select 2x kamar or 2x kapal in one order                               | Flexibility for big orders        |
| **Booking status tracking**                   | Draft → Pending → Confirmed → Completed. Show status in booking list                     | Transparency for agent & customer |
| **Booking edit (minor)**                      | Allow agent to edit name, contact, dietary after booking created but before confirmation | Handle small mistakes             |
| **Booking cancellation & reschedule request** | Agent can request change/cancel with reason, submitted to Aero for approval              | Formal process for changes        |
| **Booking history per customer**              | Show all past trips booked for that customer via this agency                             | Enable upselling                  |
| **Booking reminder notifications**            | Auto-send reminders to agency when booking approaching (H-7, H-3, H-1)                   | Reduce forgotten bookings         |

---

### 4️⃣ CUSTOMER MANAGEMENT (Mini CRM)

| Feature                       | Description                                                              | Why needed                    |
| ----------------------------- | ------------------------------------------------------------------------ | ----------------------------- |
| **Customer database**         | Store agency's own customers (not Aero's end-customers)                  | Own customer relationship     |
| **Customer profile**          | Name, email, phone, address, birthdate, segment, special notes           | Single view of customer       |
| **Customer segmentation**     | Tag customers: Individu, Keluarga, Corporate, Honeymoon, Education, MICE | Targeted marketing & offers   |
| **Trip history per customer** | Show all trips booked via agency for that customer                       | Repeat business opportunities |
| **Customer search**           | Quick search by name/email/phone                                         | Fast lookup                   |
| **Preferred preferences**     | Store: preferred destination, budget range, travel date pattern          | Personalized recommendations  |

---

### 5️⃣ DOCUMENTS & WHITE-LABEL OUTPUT

| Feature                              | Description                                                                         | Why needed                        |
| ------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------- |
| **Voucher generation (white-label)** | Generate PDF voucher with: agency logo/name, booking details, Aero trip info, terms | Agency owns customer relationship |
| **Confirmation letter**              | Auto-generate formal confirmation that can be sent to customer with agency branding | Professional look                 |
| **Itinerary document**               | Detailed schedule, locations, contact numbers, what to bring, formatted for sharing | Reduce separate communication     |
| **T&C document**                     | Standard T&C pre-filled, agent can customize, download & send to customer           | Manage expectations               |
| **Packing list & FAQ**               | Standard docs ready to attach to voucher/email                                      | Less work for agent               |
| **Document language**                | Support ID & EN versions (at minimum)                                               | Support diverse customers         |
| **Email template**                   | Pre-written email template agent can use to send voucher/itinerary to customer      | Speed up communication            |

---

### 6️⃣ FINANCE & INVOICING

| Feature                                 | Description                                                                                 | Why needed                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------ |
| **Invoice generation (per booking)**    | Auto-create invoice: agency name, booking details, net price, tax (if applicable), due date | Billing document               |
| **Invoice aggregation (per period)**    | Monthly or weekly invoice collecting all bookings for billing                               | Convenience for large agencies |
| **Payment terms setup**                 | Define: prepaid, postpaid (30/60 days), credit limit                                        | Flexibility per partner        |
| **Payment tracking**                    | Mark invoice as paid/unpaid, auto-flag overdue after X days                                 | Cash flow control              |
| **Payment reconciliation**              | Agency & Aero can see matching transfer vs invoice                                          | Clear record                   |
| **Commission calculation**              | Auto-calculate commission based on tier & package: margin per booking                       | Transparency                   |
| **Commission report (per booking)**     | Show net price, agency margin, total commission in booking detail                           | Clarity on earnings            |
| **Commission aggregation (per period)** | Monthly summary of total commissions earned                                                 | Easy income tracking           |
| **Refund & cancellation policy**        | Document what % refunded depending on cancel timing                                         | Manage expectations            |
| **Refund status tracking**              | Mark booking as cancelled, show refund status (approved/pending/rejected)                   | Clear flow                     |

---

### 7️⃣ SALES ANALYTICS & REPORTING

| Feature                               | Description                                                                                              | Why needed                        |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------- |
| **Sales dashboard (summary)**         | Cards: total bookings this month, total revenue, commission earned, avg booking value, trending packages | Quick metrics                     |
| **Sales trend chart**                 | Line graph: bookings per month for last 6-12 months, revenue trend                                       | Pattern recognition               |
| **Top products (agency view)**        | Ranking which packages agency sold most (by count or revenue)                                            | Strategy for next month           |
| **Sales per agent/branch**            | If multi-user: breakdown who booked what, total per person                                               | Performance visibility & coaching |
| **Customer acquisition cost (rough)** | If agency tracks marketing spend: help calculate ROI                                                     | Better decisions                  |
| **Export reports (CSV/PDF)**          | Download sales data, commission data for internal accounting/analysis                                    | System integration                |
| **Custom date range reports**         | Pick start-end date to generate report for any period                                                    | Flexibility                       |

---

### 8️⃣ TEAM & MULTI-USER MANAGEMENT

| Feature                                 | Description                                                                                                   | Why needed                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Sub-user creation (agents/branches)** | Owner/finance can create accounts for other staff with different access levels                                | Scale without sharing password |
| **Role assignment**                     | Define roles: Owner (all access), Finance (invoices & commissions), Agent (can only book, not see financials) | Data security & control        |
| **User permission matrix**              | Granular control: who sees bookings, who sees commission, who can edit customer, who can create invoice       | Flexibility per role           |
| **Agent performance dashboard**         | Show per-agent: bookings count, revenue generated, commissions earned, customer count                         | Individual KPIs                |
| **Team communication (internal note)**  | Add internal note to booking for team to see (not sent to customer)                                           | Coordination                   |
| **Activity log (user actions)**         | Track who booked what, who edited invoice, who approved payment                                               | Audit trail                    |

---

### 9️⃣ SUPPORT & COMMUNICATION

| Feature                       | Description                                                                               | Why needed              |
| ----------------------------- | ----------------------------------------------------------------------------------------- | ----------------------- |
| **FAQ & product info center** | Curated knowledge base: common questions, trip details, policies, updates                 | Self-serve support      |
| **Notification & changelog**  | Announce updates: new packages, price changes, policy changes, maintenance                | Keep partners informed  |
| **Support ticket system**     | Agent can submit ticket: request private trip, negotiate group price, ask special request | Formal escalation       |
| **Ticket tracking**           | Agent sees status: submitted → in-review → resolved, with messages                        | Transparency            |
| **Inbox for communication**   | Archive of all messages with Aero team (replaces scattered WA/email)                      | Organized communication |
| **Response SLA**              | Guarantee Aero responds to ticket within X hours                                          | Set expectations        |

---

### 🔟 AI FEATURES (Agency Copilot)

| Feature                           | Description                                                                                                                                                                       | Why needed                           |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **AI Travel Assistant (chatbot)** | Agent types: "What's the difference between Pahawang and Pisang packages?" → AI answers from knowledge base                                                                       | Quick answers without searching docs |
| **AI Q&A on products**            | "What age limit for diving?", "Does it include meals?", "Can we do custom itinerary?" → AI answers based on package data & rules                                                  | Support & education                  |
| **AI Quotation Copilot**          | Agent gives prompt: "6 pax family, Pahawang 10-12 Des, Rp 2.5jt/pax budget" → AI suggests matching packages, calculates prices, generates draft quotation → agent reviews & sends | Speed up sales cycle                 |
| **AI Quotation refinement**       | Agent can say "make it cheaper" or "add more snorkeling" → AI regenerates quote                                                                                                   | Iterative selling                    |
| **AI Inbox Parser (future)**      | Email/WA from customer: "Mau 10 org ke Pahawang tgl 15-17" → AI extracts data, creates draft booking → agent reviews & confirms                                                   | Hands-free booking                   |
| **AI Sales Insights**             | Agent asks: "What should I focus on selling next month?" → AI analyzes trends, suggests: "Pahawang in Dec, Pisang in Jan"                                                         | Strategic guidance                   |

---

## 🎬 USER FLOWS (Happy Path)

### Flow 1: New Travel Agency Signs Up

1. Agency owner visits aero.co.id → clicks "Jadilah Partner"
2. Fills registration form (company info, PIC, SIUP, NPWP, bank account)
3. Submits
4. Aero admin reviews → approves → sends email confirmation
5. Agency owner logs in via `/partner/auth/login`
6. Sees onboarding screen: set profile, add sub-users, upload logo
7. Accesses `/partner/catalog`

### Flow 2: Agent Books a Trip for Customer

1. Agent logs in → goes to `/partner/catalog`
2. Searches: "Pahawang" → filters by date "10-15 Des" → sees availability
3. Clicks package → sees detail: itinerary, photos, price (net Rp X, markup suggestion Rp Y)
4. Clicks "Book Now"
5. Fills form: customer name, 3 pax details, special needs, room preference
6. Reviews booking → clicks "Confirm"
7. System generates invoice → agent can download voucher immediately
8. Agent forwards voucher to customer
9. Trip date arrives → guide handles operasional → trip completes
10. Agent gets commission auto-credited to account

### Flow 3: Agency Owner Checks Financial Performance

1. Owner logs in → sees dashboard with cards: "5 bookings, Rp 10 juta revenue, Rp 2 juta commissions this month"
2. Clicks "View Details" → sees commission breakdown per booking
3. Clicks "Finance" → sees unpaid invoices (if any) & payment deadline
4. Exports report (CSV) → shares with accountant

### Flow 4: Agent Uses AI Quotation Copilot

1. Agent gets customer inquiry: "Kita 12 orang mau 2H1M Pahawang, tiap orang budget 2 juta"
2. Opens AI assistant → types inquiry
3. AI suggests 2-3 matching packages with pricing
4. Agent picks one → AI generates draft quotation (includes itinerary, pricing breakdown, T&C)
5. Agent tweaks (adds note about "free snacks on day 2") → sends to customer

---

## 🗂️ DATABASE SCHEMA (Key Tables)

```
🏢 agencies
  ├── agency_id (PK)
  ├── company_name
  ├── tier (Bronze/Silver/Gold)
  ├── contact_person
  ├── email
  ├── phone
  ├── logo_url
  ├── status (active/inactive)
  ├── created_at
  └── metadata (JSON - tax info, etc)

👥 agency_users (sub-users)
  ├── user_id (PK)
  ├── agency_id (FK)
  ├── name
  ├── email
  ├── role (owner/finance/agent)
  ├── permissions (JSON array)
  └── active (bool)

🛫 agency_bookings
  ├── booking_id (PK)
  ├── agency_id (FK)
  ├── package_id (FK to packages)
  ├── customer_id (FK to agency_customers)
  ├── status (draft/pending/confirmed/completed)
  ├── pax_count
  ├── net_price (from package)
  ├── commission_amount
  ├── booking_date
  ├── travel_date
  └── notes (JSON)

🧑 agency_customers
  ├── customer_id (PK)
  ├── agency_id (FK)
  ├── name
  ├── email
  ├── phone
  ├── segment (individual/family/corporate/honeymoon/school)
  ├── booking_count
  ├── total_spent
  └── last_trip_date

📄 invoices
  ├── invoice_id (PK)
  ├── agency_id (FK)
  ├── booking_id (FK) [nullable for aggregated invoices]
  ├── amount
  ├── due_date
  ├── status (unpaid/paid/overdue)
  ├── payment_method
  └── paid_date

📊 agency_commissions
  ├── commission_id (PK)
  ├── booking_id (FK)
  ├── agency_id (FK)
  ├── amount
  ├── tier_rate (%)
  ├── calculated_at
  └── paid_at
```

---

## 🚀 IMPLEMENTATION ROADMAP

### Wave 1 (MVP – Weeks 1-6)

**Goal:** Basic B2B booking + financial tracking

- [x] Agency registration & approval
- [x] Catalog browse (B2B pricing)
- [x] Booking form & management
- [x] Invoice generation
- [x] Basic dashboard (revenue summary)
- [x] Multi-user (owner/agent roles)
- [x] Voucher & confirmation docs (white-label)

**Dev Effort:** ~200 hours  
**Launch to:** 10-15 pilot agencies

---

### Wave 2 (Sales Efficiency – Weeks 7-12)

**Goal:** AI + better analytics + reporting

- [ ] AI Travel Assistant (product Q&A)
- [ ] AI Quotation Copilot
- [ ] Sales reports & trending charts
- [ ] Customer data management (mini CRM)
- [ ] Commission detailed reporting
- [ ] Support ticket system

**Dev Effort:** ~150 hours

---

### Wave 3 (Scalability – Month 4-5)

**Goal:** Advanced features + automation

- [ ] Limit kredit (untuk agencies besar)
- [ ] Email → booking auto-parser (AI inbox)
- [ ] Advanced segmentation & analytics
- [ ] Reward/loyalty untuk agents
- [ ] Mobile app companion

**Dev Effort:** ~120 hours

---

## ✅ SUCCESS CRITERIA

**By end of Wave 1:**

- ✅ 15+ agencies onboarded
- ✅ 50+ bookings via portal (vs 0 before)
- ✅ 95%+ uptime
- ✅ <2 hour response time untuk support tickets
- ✅ Zero double-bookings

**By end of Wave 2:**

- ✅ 100+ monthly bookings from agency channel
- ✅ 80% self-serve (agents not calling/emailing)
- ✅ AI quotation used by 50%+ agents
- ✅ Avg margin per agency: Rp 5-10 juta/month

**By end of Wave 3:**

- ✅ 50+ agencies active
- ✅ 20% of total Aero bookings from agency channel
- ✅ Agency channel profitable

---

## 🔒 SECURITY & COMPLIANCE

- **Auth:** Single sign-on (shared with `/operator`, `/admin`)
- **Data privacy:** Agency only sees their own bookings & customers (RLS at DB level)
- **PCI compliance:** No credit card storage (payment via Aero, not stored on agency portal)
- **Tax:** Automatic invoice generation with tax line-items for accounting
- **Audit trail:** All actions logged (who booked, who edited, when)

---

## 📱 RESPONSIVE DESIGN

- **Desktop first** (1200px+) for booking & admin tasks
- **Tablet support** (768px+) for on-the-go check
- **Mobile-friendly** (375px+) for dashboard/notifications
- **Dark mode option** (user preference)

---

## 🔗 API INTEGRATIONS

- **Aero internal APIs:** packages, availability, bookings, customers
- **Payment:** Midtrans (future: if agencies can pay direct)
- **Email:** SendGrid for notifications
- **AI:** OpenAI for assistant & quotation copilot
- **Maps:** Google Maps for destination display
- **Analytics:** Mixpanel or similar for usage tracking

---

## 📝 VALIDATION CHECKLIST (FOR DEV TEAM)

Before starting each feature:

```
Feature: [Name]

REUSE CHECK
- [ ] Does this page/component exist in other modules? Where?
- [ ] Can we reuse booking form from Guide App? Payment logic?
- [ ] Shared auth system with /operator & /admin?

DATA CHECK
- [ ] Uses existing tables? (packages, trips, customers?)
- [ ] New tables needed? (agency_bookings, invoices?)
- [ ] Schema changes affect other modules?

API CHECK
- [ ] Reuse existing endpoints?
- [ ] New endpoints needed?
- [ ] Response format match other modules?

OFFLINE CHECK (if applicable)
- [ ] Need offline caching?
- [ ] Quota high? Use IndexedDB?

SIGN-OFF
- [ ] PM approved
- [ ] Design reviewed (consistent with Aero brand)
- [ ] QA ready to test
- [ ] Ready to code? [ ] YES [ ] NO
```

---

## 🎯 KEY METRICS TO TRACK

- Agency signup rate & approval rate
- Bookings per agency per month (trend)
- Avg commission per booking
- Agent adoption rate of AI features
- Support ticket response time & satisfaction
- Payment collection rate (invoices paid on time)
- Churn rate of agencies

---

**Document Status:** Ready for Cursor AI Development  
**Next Step:** Copy features into Jira/Asana, run validation checklist, assign to sprint
