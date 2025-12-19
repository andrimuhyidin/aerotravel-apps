# User Journey by Role - Complete Flow Documentation

## 📋 Overview

Dokumen ini menjelaskan journey lengkap setiap role/aplikasi di MyAeroTravel ID, dari pertama kali mengunjungi website hingga menggunakan fitur-fitur utama.

---

## 🎭 Roles & Applications

### **Customer (B2C)**
- **App Type**: Public Web App
- **Target**: Individual travelers
- **Route Base**: `/` (homepage), `/my-trips`, `/book`, dll

### **Guide (Mobile PWA)**
- **App Type**: Progressive Web App (Mobile-first)
- **Target**: Tour guides
- **Route Base**: `/guide/*`

### **Mitra (B2B Partner)**
- **App Type**: Partner Portal (Web)
- **Target**: Travel agents, resellers
- **Route Base**: `/partner/*` atau `/mitra/*`

### **Corporate (B2B Enterprise)**
- **App Type**: Corporate Portal (Web)
- **Target**: Corporate clients
- **Route Base**: `/corporate/*`

### **Console (Internal Admin)**
- **App Type**: ERP Dashboard (Web)
- **Target**: Internal staff (admin, ops, finance, marketing)
- **Route Base**: `/console/*`
- **Sub-roles**: `super_admin`, `ops_admin`, `finance_manager`, `marketing`, `investor`

---

## 🛣️ Journey Maps

---

## 1️⃣ CUSTOMER JOURNEY (B2C)

### **Phase 1: Discovery (Guest)**

```
1. Visit Homepage (/)
   └─> GuestHomepage component
       ├─> Hero section: "Jelajahi Keindahan Laut Indonesia"
       ├─> Featured destinations (Pahawang, Labuan Bajo, dll)
       ├─> Features showcase
       ├─> Testimonials
       └─> CTA: "Daftar Gratis" atau "Lihat Paket"

2. Browse Packages (/packages)
   └─> Package listing page
       ├─> Filter by destination, price, date
       ├─> Package cards with images
       └─> Click package → Package detail

3. Package Detail (/packages/[city]/[slug])
   └─> Package detail page
       ├─> Images gallery
       ├─> Itinerary
       ├─> Pricing
       ├─> Reviews
       └─> CTA: "Book Now" → /book

4. About/Contact (/about, /contact)
   └─> Information pages
```

### **Phase 2: Registration & Onboarding**

```
5. Register (/register)
   └─> Registration form
       ├─> Email, password, full name
       ├─> Phone number
       └─> Submit → Email verification

6. Email Verification
   └─> Click link in email
       └─> Redirect to /?verified=true

7. First Login (/login)
   └─> Login form
       ├─> Email & password
       └─> Submit → Check consent

8. Legal Consent (/legal/sign)
   └─> E-Contract signing (if not signed)
       ├─> Terms & conditions
       ├─> Privacy policy
       └─> Sign → Redirect to homepage
```

### **Phase 3: Booking Flow**

```
9. Booking Wizard (/book)
   └─> Multi-step booking form
       Step 1: Select package & date
       Step 2: Select participants
       Step 3: Add-ons (insurance, equipment)
       Step 4: Review & confirm
       Step 5: Payment → /payment/[id]

10. Payment (/payment/[id])
    └─> Payment page
        ├─> Payment methods (Midtrans)
        ├─> Payment gateway
        └─> Success → /my-trips/[id]

11. Booking Confirmation (/my-trips/[id])
    └─> Trip detail page
        ├─> Booking details
        ├─> Itinerary
        ├─> Meeting point
        ├─> Contact guide
        └─> Share trip
```

### **Phase 4: Trip Management**

```
12. My Trips Dashboard (/my-trips)
    └─> CustomerDashboard component
        ├─> Upcoming trips
        ├─> Past trips
        ├─> Trip cards with status
        └─> Click trip → Trip detail

13. Trip Detail (/my-trips/[id])
    └─> Trip information
        ├─> Status (upcoming, ongoing, completed)
        ├─> Itinerary
        ├─> Guide info
        ├─> Gallery link
        ├─> Split bill (if group)
        └─> Reviews (after trip)

14. Photo Gallery (/gallery/[tripId])
    └─> Trip photos
        ├─> Uploaded by guide
        ├─> Download photos
        └─> Share gallery
```

### **Phase 5: Additional Features**

```
15. Travel Circle (/travel-circle)
    └─> Social feature
        ├─> Create/join travel groups
        ├─> Plan group trips
        └─> Share experiences

16. Loyalty Program (/loyalty)
    └─> AeroPoints & Referral
        ├─> Points balance
        ├─> Points history
        ├─> Referral code
        └─> Rewards catalog

17. Split Bill (/split-bill/[id])
    └─> Group payment
        ├─> Split payment among participants
        ├─> Generate payment links
        └─> Track payments
```

---

## 2️⃣ GUIDE JOURNEY (Mobile PWA)

### **Phase 1: Discovery & Application**

```
1. Visit /guide (as Guest)
   └─> Guide Landing Page (FUTURE: Public landing)
       ├─> Hero: "Jadilah Guide Profesional"
       ├─> Benefits: Flexible schedule, Good income
       ├─> Requirements
       └─> CTA: "Daftar sebagai Guide" → /guide/apply

2. Apply as Guide (/guide/apply)
   └─> Application form
       ├─> Personal info
       ├─> Experience
       ├─> Documents (KTP, SIM, dll)
       └─> Submit → Pending approval

3. Admin Approval (Internal)
   └─> Admin reviews application
       └─> Approve/Reject → Email notification
```

### **Phase 2: Onboarding**

```
4. First Login (/login)
   └─> Login with approved account
       └─> Redirect to /guide

5. Guide Dashboard (/guide)
   └─> GuideDashboardClient component
       ├─> Status indicator (Standby/On Trip/Not Available)
       ├─> Active trip card
       ├─> Quick actions (Absensi, Manifest, SOS)
       ├─> Weather widget
       ├─> Challenges widget
       ├─> Stats (completed trips, rating)
       └─> Upcoming trips

6. Profile Setup (/guide/profile)
   └─> Complete profile
       ├─> Personal info
       ├─> Bank account (for payments)
       ├─> Emergency contacts
       ├─> Medical info
       └─> Documents upload
```

### **Phase 3: Daily Operations**

```
7. Status Management (/guide/status)
   └─> Set availability
       ├─> Standby (available)
       ├─> On Trip (currently guiding)
       └─> Not Available (off)

8. Attendance (/guide/attendance)
   └─> GPS-based attendance
       ├─> Check-in for trip
       ├─> Location verification
       ├─> Photo verification (optional)
       └─> Attendance history

9. Trip Management (/guide/trips)
   └─> Trip list
       ├─> Today's trips
       ├─> Upcoming trips
       ├─> Past trips
       └─> Click trip → Trip detail

10. Trip Detail (/guide/trips/[id])
    └─> Trip information
        ├─> Guest list
        ├─> Itinerary
        ├─> Tasks checklist
        ├─> Chat with ops/admin
        ├─> Location tracking
        ├─> Manifest
        └─> Expenses
```

### **Phase 4: Trip Execution**

```
11. Digital Manifest (/guide/manifest)
    └─> Guest management
        ├─> Check-in guests
        ├─> Guest list
        ├─> Emergency contacts
        └─> Export manifest

12. Location Tracking (/guide/locations)
    └─> Real-time tracking
        ├─> Share location with ops
        ├─> Route optimization
        └─> Offline map support

13. SOS Button (/guide/sos)
    └─> Emergency alert
        ├─> Send location to emergency contacts
        ├─> WhatsApp alert
        └─> Notify ops/admin

14. Trip Chat (/guide/trips/[id]/chat)
    └─> Communication
        ├─> Chat with ops/admin
        ├─> Chat with guests
        └─> File sharing
```

### **Phase 5: Post-Trip**

```
15. Trip Expenses (/guide/trips/[id]/expenses)
    └─> Expense tracking
        ├─> Add expenses
        ├─> AI categorization
        └─> Submit for reimbursement

16. Incidents (/guide/incidents)
    └─> Report incidents
        ├─> Incident form
        ├─> Photos
        └─> Submit to ops

17. Ratings & Reviews (/guide/ratings)
    └─> View guest reviews
        ├─> Average rating
        ├─> Review details
        └─> Response to reviews
```

### **Phase 6: Financial & Growth**

```
18. Wallet (/guide/wallet)
    └─> Financial dashboard
        ├─> Balance
        ├─> Transaction history
        ├─> Earnings breakdown
        ├─> Withdrawals
        └─> Salary deductions

19. Earnings (/guide/earnings)
    └─> Detailed earnings
        ├─> Monthly earnings
        ├─> Trip earnings
        └─> Commission

20. Challenges (/guide/challenges)
    └─> Gamification
        ├─> Active challenges
        ├─> Progress tracking
        └─> Rewards

21. Leaderboard (/guide/leaderboard)
    └─> Rankings
        ├─> Top guides
        ├─> Badges
        └─> Level progression

22. Training (/guide/training)
    └─> Learning modules
        ├─> Training content
        ├─> Quizzes
        └─> Certifications

23. Social Feed (/guide/social)
    └─> Community
        ├─> Share trip experiences
        ├─> Like & comment
        └─> Connect with other guides

24. Insights (/guide/insights)
    └─> AI-powered insights
        ├─> Income predictions
        ├─> Performance recommendations
        └─> Trend analysis
```

---

## 3️⃣ MITRA JOURNEY (B2B Partner)

### **Phase 1: Discovery & Application**

```
1. Visit /mitra (as Guest)
   └─> Mitra Landing Page (FUTURE: Public landing)
       ├─> Hero: "Jadilah Mitra Kami"
       ├─> Benefits: Commission, Whitelabel
       ├─> Requirements
       └─> CTA: "Daftar sebagai Mitra" → /mitra/apply

2. Apply as Mitra (/mitra/apply)
   └─> Application form
       ├─> Company info
       ├─> Business license
       ├─> NPWP
       └─> Submit → Pending approval
```

### **Phase 2: Onboarding**

```
3. First Login (/login)
   └─> Login with approved account
       └─> Redirect to /partner/dashboard

4. Partner Dashboard (/partner/dashboard)
   └─> PartnerDashboardClient component
       ├─> Overview stats
       ├─> Recent bookings
       ├─> Commission summary
       ├─> Deposit balance
       └─> Quick actions
```

### **Phase 3: Booking Management**

```
5. Create Booking (/partner/bookings)
   └─> Booking management
       ├─> Create new booking
       ├─> Booking list
       ├─> Booking status
       └─> Booking detail

6. Booking Detail
   └─> Booking information
       ├─> Customer info
       ├─> Package details
       ├─> Payment status
       └─> Invoice
```

### **Phase 4: Financial Management**

```
7. Deposit Management (/partner/deposit)
   └─> Deposit account
       ├─> Deposit balance
       ├─> Top-up deposit
       ├─> Deposit history
       └─> Auto-deduction settings

8. Invoices (/partner/invoices)
   └─> Invoice management
       ├─> Invoice list
       ├─> Generate invoice
       ├─> Download PDF
       └─> Payment tracking

9. Wallet (/partner/wallet)
   └─> Financial dashboard
       ├─> Commission balance
       ├─> Transaction history
       ├─> Withdrawals
       └─> Reports
```

### **Phase 5: Whitelabel**

```
10. Whitelabel Settings (/partner/whitelabel)
    └─> Customization
        ├─> Branding (logo, colors)
        ├─> Custom domain
        ├─> Email templates
        └─> Booking widget
```

---

## 4️⃣ CORPORATE JOURNEY (B2B Enterprise)

### **Phase 1: Discovery & Application**

```
1. Visit /corporate (as Guest)
   └─> Corporate Landing Page (FUTURE: Public landing)
       ├─> Hero: "Corporate Travel Solutions"
       ├─> Benefits: Employee management, Bulk pricing
       └─> CTA: "Contact Sales" → /corporate/apply

2. Apply as Corporate (/corporate/apply)
   └─> Application form
       ├─> Company info
       ├─> Employee count
       ├─> Contact person
       └─> Submit → Sales team contact
```

### **Phase 2: Onboarding**

```
3. First Login (/login)
   └─> Login with approved account
       └─> Redirect to /corporate

4. Corporate Dashboard (/corporate)
   └─> Corporate dashboard
       ├─> Company overview
       ├─> Employee list
       ├─> Booking summary
       └─> Invoices
```

### **Phase 3: Employee Management**

```
5. Employees (/corporate/employees)
   └─> Employee management
       ├─> Employee list
       ├─> Add employees
       ├─> Employee profiles
       └─> Booking permissions
```

### **Phase 4: Booking & Invoicing**

```
6. Create Booking
   └─> Corporate booking
       ├─> Select employees
       ├─> Select package
       ├─> Bulk pricing
       └─> Submit booking

7. Invoices (/corporate/invoices)
   └─> Invoice management
       ├─> Invoice list
       ├─> Download invoices
       ├─> Payment tracking
       └─> Reports
```

---

## 5️⃣ CONSOLE JOURNEY (Internal Admin)

### **Sub-Roles:**

- **super_admin**: Full access
- **ops_admin**: Operations management
- **finance_manager**: Finance & payroll
- **marketing**: Marketing & bookings
- **investor**: View-only (reports)

### **Phase 1: Login**

```
1. Login (/login)
   └─> Login with internal account
       └─> Redirect to /console
```

### **Phase 2: Dashboard**

```
2. Console Dashboard (/console)
   └─> ERP Dashboard
       ├─> Overview KPIs
       ├─> Recent activities
       ├─> Quick actions
       └─> Role-based widgets
```

### **Phase 3: Operations (Ops Admin)**

```
3. Operations Hub (/console/operations)
   └─> Operations dashboard
       ├─> Live trips
       ├─> Asset availability
       ├─> Guide status
       └─> SOS alerts

4. Trip Management (/console/operations/trips)
   └─> Trip management
       ├─> Trip list
       ├─> Create trip
       ├─> Assign guides
       ├─> Trip monitoring
       └─> Trip reports

5. Scheduler (/console/operations/scheduler)
   └─> Resource scheduling
       ├─> Calendar view
       ├─> Assign resources
       ├─> Conflict detection
       └─> Optimization

6. Inventory (/console/operations/inventory)
   └─> Inventory management
       ├─> Asset list
       ├─> Stock levels
       ├─> Maintenance
       └─> Reports

7. Assets (/console/operations/assets)
   └─> Asset management
       ├─> Asset list
       ├─> Asset tracking
       ├─> Maintenance schedule
       └─> Depreciation

8. Vendors (/console/operations/vendors)
   └─> Vendor management
       ├─> Vendor list
       ├─> Vendor contracts
       └─> Performance

9. Live Tracking (/console/operations/live-tracking)
   └─> Real-time tracking
       ├─> Guide locations
       ├─> Trip routes
       └─> Alerts

10. SOS Management (/console/operations/sos)
    └─> Emergency management
        ├─> Active SOS alerts
        ├─> Response actions
        └─> Incident reports
```

### **Phase 4: Bookings & Marketing**

```
11. Bookings (/console/bookings)
    └─> Booking management
        ├─> Booking list
        ├─> Create booking
        ├─> Booking status
        └─> Booking reports

12. Products (/console/products)
    └─> Product management
        ├─> Package list
        ├─> Create package
        ├─> Pricing
        └─> Inventory

13. Marketing (/console/marketing)
    └─> Marketing tools
        ├─> Campaigns
        ├─> Promotions
        ├─> Analytics
        └─> SEO management

14. CRM (/console/crm)
    └─> Customer management
        ├─> Customer list
        ├─> Customer profiles
        ├─> Communication history
        └─> Segmentation
```

### **Phase 5: Finance**

```
15. Finance (/console/finance)
    └─> Finance dashboard
        ├─> Revenue overview
        ├─> Expenses
        ├─> Profit & loss
        └─> Financial reports

16. Payroll (/console/finance/payroll)
    └─> Payroll management
        ├─> Employee payroll
        ├─> Guide payments
        ├─> Salary calculations
        └─> Payment processing
```

### **Phase 6: Governance & Safety**

```
17. Governance (/console/governance)
    └─> HR & Governance
        ├─> Employee management
        ├─> Contracts
        ├─> Compliance
        └─> Policies

18. Safety (/console/safety)
    └─> Safety management
        ├─> Safety protocols
        ├─> Incident reports
        ├─> Training records
        └─> Compliance

19. Users (/console/users)
    └─> User management
        ├─> User list
        ├─> Role management
        ├─> Permissions
        └─> Activity logs
```

### **Phase 7: Reports & Analytics**

```
20. Reports (/console/reports)
    └─> Analytics & Reports
        ├─> Business reports
        ├─> Financial reports
        ├─> Operational reports
        └─> Custom reports

21. Audit Log (/console/audit-log)
    └─> Audit trail
        ├─> System logs
        ├─> User activities
        ├─> Data changes
        └─> Security events
```

### **Phase 8: Settings**

```
22. Settings (/console/settings)
    └─> System settings
        ├─> General settings
        ├─> Branch settings
        ├─> Integration settings
        └─> System configuration
```

---

## 🔄 Cross-Role Interactions

### **Customer ↔ Guide**
- Customer books trip → Guide assigned
- Guide shares photos → Customer views in gallery
- Customer reviews → Guide sees in ratings

### **Mitra ↔ Console**
- Mitra creates booking → Admin processes
- Mitra needs deposit → Admin manages
- Mitra commission → Finance processes

### **Corporate ↔ Console**
- Corporate books for employees → Admin manages
- Corporate invoices → Finance processes

### **Guide ↔ Console (Ops)**
- Guide checks in → Ops sees in live tracking
- Guide reports incident → Ops responds
- Guide submits expenses → Ops approves
- Ops assigns trip → Guide receives notification

---

## 🎯 Key Journey Points

### **Entry Points:**
1. **Homepage** (`/`) - Main entry for customers
2. **Role Landing Pages** (`/guide`, `/mitra`, `/corporate`) - Future public landing
3. **Login** (`/login`) - For existing users

### **Conversion Points:**
1. **Registration** (`/register`) - Guest → Customer
2. **Role Application** (`/guide/apply`, `/mitra/apply`) - Customer → Guide/Mitra
3. **Booking** (`/book`) - Customer → Booking

### **Engagement Points:**
1. **Dashboard** - Each role has personalized dashboard
2. **Notifications** - Real-time updates
3. **Social Features** - Travel circle, social feed

### **Retention Points:**
1. **Loyalty Program** - Points & rewards
2. **Gamification** - Challenges & leaderboard (Guide)
3. **Community** - Social feed, travel circle

---

## 📊 Journey Metrics

### **Customer:**
- Time to first booking: < 10 minutes
- Booking completion rate: > 60%
- Repeat booking rate: > 30%

### **Guide:**
- Time to first trip: < 7 days (after approval)
- Daily active usage: > 80%
- Trip completion rate: > 95%

### **Mitra:**
- Time to first booking: < 3 days (after approval)
- Monthly booking volume: Track per mitra
- Commission payout: Monthly

### **Corporate:**
- Time to first booking: < 14 days (after approval)
- Employee adoption: Track per company
- Invoice payment: Net 30

### **Console:**
- Daily active usage: > 90%
- Response time to SOS: < 5 minutes
- Trip assignment time: < 1 hour

---

## 🚀 Future Enhancements

### **Public Landing Pages:**
- `/guide` → Guide recruitment landing
- `/mitra` → Partner recruitment landing
- `/corporate` → Corporate solutions landing

### **Role Switching:**
- User dengan multiple roles bisa switch
- Role switcher di header/profile
- Context-aware routing

### **Onboarding Improvements:**
- Interactive tutorials
- Progressive disclosure
- Guided tours

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-19  
**Author**: AI Assistant  
**Status**: Complete Journey Documentation

