# 🎯 BUSINESS REQUIREMENTS DOCUMENT (BRD)
## MyAeroTravel Guide App – Feature Enhancements Phase 2 & 3

**Version:** 2.0  
**Date:** 21 Dec 2025  
**Status:** Ready for Cursor AI & Development Team  
**Scope:** 14 new features + integration with existing app  

---

## 📌 CRITICAL RULE: REUSE, DON'T REBUILD

**Before building ANY feature:**
1. ✅ Check if it exists in current app
2. ✅ Find what we can reuse
3. ✅ Only code what's NEW
4. ✅ Plug it into existing data flow
5. ✅ Get tech lead to sign off

Each feature has a **"Validation Checklist"** section. Follow it strictly.

---

## 🗂️ HOW TO READ THIS DOCUMENT

- **"What it does"** → User story in plain language
- **"Why it matters"** → Business benefit
- **"How to validate"** → Checklist before coding
- **"Data it uses"** → What existing data tables/APIs it connects to
- **"Data it creates"** → What new data this feature adds
- **"Already exists?"** → Check this first

---

---

## PHASE 2: SAFETY & COMPLIANCE FEATURES (Months 3-4)

### Feature #1: Pre-Trip Safety Risk Assessment

**What it does:**  
Guide opens a trip → Automatically shows a safety checklist (wave height, wind, crew ready, equipment complete). System calculates a risk score. If score is too high (RED), trip cannot start. Admin can override if emergency.

**Why it matters:**  
- Prevents unsafe trips from launching
- Creates audit trail for ISO 21101 compliance
- Works offline (critical when at sea before departure)

**How to validate before coding:**
- [ ] Check: Does trip management page already exist? (answer: yes, guides can open trips)
- [ ] Check: Is there already a modal/form system for trip pre-checks? (check codebase)
- [ ] Check: Is weather API (BMKG) already integrated in app? (if not, new)
- [ ] Check: Is offline-first setup (IndexedDB) ready? (check Service Worker)
- [ ] Identify: Which existing table stores trip data? (`trips` table?)
- [ ] Decision: Do we CREATE new table `pre_trip_assessments` or ADD columns to `trips`?
- [ ] Decision: Reuse existing form components or build new form module?

**Data it uses (from existing app):**
- Trip record (trip ID, date, time, type)
- Passenger manifest (count, age profile)
- GPS location (to timestamp the assessment)

**Data it creates (NEW):**
- Risk assessment form responses
- Risk score calculation
- Trip approval status (APPROVED / BLOCKED)

**Integration notes:**
- Blocks trip start button logic → lives in existing trip start flow
- Uses GPS already available (from check-in feature)
- Stores result: either new table OR column in `trips` table (tech decision)

---

### Feature #2: Safety Equipment Photo Checklist

**What it does:**  
Guide sees a checklist of required equipment (lifejackets, first aid kit, etc.). For each item: count quantity, take a photo, rate condition (Good/Fair/Poor). Automatically adds GPS & timestamp to photo. If equipment missing, trip blocks.

**Why it matters:**  
- Digital proof that equipment was inspected
- Detects missing/damaged gear before trip
- Photos stored for insurance/audit trail

**How to validate before coding:**
- [ ] Check: Is there a camera/photo upload system already? (yes, for incident photos?)
- [ ] Check: Does GPS geo-tagging already work for photos? (check existing photo upload)
- [ ] Check: Is there an equipment/assets table already? (to pull checklist from)
- [ ] Check: Can we reuse the photo upload component?
- [ ] Identify: Where do we store equipment check records? (new table? or update `trips`?)
- [ ] Decision: Checklist template per trip type (dynamic load) or static list?

**Data it uses:**
- Equipment asset list (what should be on the boat)
- Passenger count (to validate lifejackets)
- Trip details (date, location)
- Camera input + GPS

**Data it creates:**
- Equipment check records
- Equipment condition ratings
- Photo evidence with geo-tags

---

### Feature #3: Incident & Accident Report Form

**What it does:**  
If something bad happens during trip (someone gets hurt, equipment breaks), guide fills out a structured form: what happened, when, where, who was involved, what action taken, any photos. Form auto-sends to Admin + Insurance. Guide gets a report number for tracking.

**Why it matters:**  
- Legal documentation for insurance claims
- Shows quick response capability
- Compliance with ISO 21101 accident reporting

**How to validate before coding:**
- [ ] Check: Is there a form submission system already?
- [ ] Check: Is there a notification/email system to reach Admin + Insurance?
- [ ] Check: Is photo upload ready?
- [ ] Check: Is there already a trips/incidents table in database?
- [ ] Identify: Can we reuse passenger/crew dropdown from manifest?
- [ ] Decision: Create `incidents` table linked to `trips`?
- [ ] Decision: How to auto-notify insurance? (email, webhook, manual?)

**Data it uses:**
- Trip info (trip ID, location, time)
- Passenger/crew list (for "who was involved")
- Camera (for incident photos)
- GPS location

**Data it creates:**
- Incident report record
- Incident photos
- Report tracking number
- Notification log (who was notified when)

---

### Feature #4: Guide Certification Tracker

**What it does:**  
Guide sees their certifications (SIM Kapal, First Aid, ALIN). App shows expiry date. H-30 before expiry, app sends reminder. When cert expires, trip start button is disabled until guide renews.

**Why it matters:**  
- Ensures only qualified guides work
- Auto-enforces certification requirement
- Reduces compliance risk

**How to validate before coding:**
- [ ] Check: Is there a guide/crew profile page already?
- [ ] Check: Is there a notification/reminder system?
- [ ] Check: Is there a crew/guides database table?
- [ ] Check: Can we hook into trip start validation?
- [ ] Identify: Where are certifications stored? (new `crew_certifications` table?)
- [ ] Decision: Manual cert upload by guide or admin input?
- [ ] Decision: H-30 alert = push notification, banner, or email?

**Data it uses:**
- Guide profile info
- Certification records (type, expiry date)
- Trip manifest (to validate guide is qualified)

**Data it creates:**
- Certification records
- Expiry alert logs
- Trip block/unblock status

---

### Feature #5: Safety Briefing & Passenger Consent

**What it does:**  
Guide opens briefing module before trip starts. System auto-generates briefing points based on passengers (e.g., "Have elderly → focus on stability", "Have babies < 2 → safety seat info"). Guide reads through, checks off each point. Passenger then taps "I agree" on tablet/phone + signs digitally. Signature stored with trip.

**Why it matters:**  
- Legal waiver proof (for insurance/liability)
- Ensures all passengers informed
- Multilingual capability for foreign tourists

**How to validate before coding:**
- [ ] Check: Is there a manifest/passenger list page?
- [ ] Check: Is there a signature capture component?
- [ ] Check: Is the form/modal system in place?
- [ ] Check: Are there pre-written briefing templates?
- [ ] Identify: Can we pull passenger age/profile from booking?
- [ ] Decision: Briefing template in database or hardcoded?
- [ ] Decision: Signature = handwriting pad or "I agree" checkbox?

**Data it uses:**
- Passenger manifest (age, special needs)
- Trip details
- Device for signature capture

**Data it creates:**
- Briefing completion record
- Passenger consent signatures
- Consent timestamp + guide name

---

### Feature #6: Training Records & Certificates

**What it does:**  
Admin creates a training session ("SOP Update", "First Aid Refresher"). Admin marks which guides attended. System auto-generates a certificate PDF. Guides can download their certs in the app.

**Why it matters:**  
- Proves guides are trained
- Easy compliance documentation
- Guides can show cert to authorities

**How to validate before coding:**
- [ ] Check: Is there an admin training management interface?
- [ ] Check: Is PDF generation library available? (jsPDF?)
- [ ] Check: Is there a crew list to mark attendance?
- [ ] Check: Can guides see downloaded docs in app?
- [ ] Identify: Where to store training records? (new table?)
- [ ] Decision: Certificate template design (use existing logo/branding)
- [ ] Decision: Can training be done offline or only when admin online?

**Data it uses:**
- Guide list
- Training event details
- Attendance records

**Data it creates:**
- Training session records
- Attendance logs
- Certificate PDFs

---

### Feature #7: Voice-to-Text Incident Report

**What it does:**  
When guide is in emergency situation (can't type), they press "Record" button, speak for 30 seconds describing the incident ("Penumpang terjatuh di deck, sudah beri first aid, dibawa ke klinik"). AI transcribes text automatically. Text appears on screen for review/edit. Can then submit as incident report.

**Why it matters:**  
- Faster documentation during chaos
- Hands-free (guide might be helping victim)
- Reduced error vs manual typing under stress

**How to validate before coding:**
- [ ] Check: Is audio recording API available in app? (browser MediaRecorder)
- [ ] Check: Is Whisper API (speech-to-text) set up? (cost: ~$0.02/min)
- [ ] Check: Is there incident form already (Feature #3)? Reuse it?
- [ ] Check: Does offline queue system support audio blobs?
- [ ] Identify: Where to store voice logs? (table for audit trail)
- [ ] Decision: Whisper API or simpler speech recognition?
- [ ] Decision: Support playback of recorded audio for guide confirmation?

**Data it uses:**
- Audio input from device microphone
- Trip context (current trip ID)

**Data it creates:**
- Voice recording file
- Transcribed text
- Confidence score of transcription

---

### Feature #8: Logistics Handover (Serah-Terima Barang)

**What it does:**  
H-1 trip, warehouse scans QR code → checklist appears (10 water bottles, 10 snacks, 5 masks, etc.). Warehouse & guide count together, take photo of the pile. Both sign to confirm. After trip, guide returns items + photo of remaining. System flags if >10% loss.

**Why it matters:**  
- Prevents losses/theft
- Clear accountability
- Reduces waste

**How to validate before coding:**
- [ ] Check: Is QR scanner working?
- [ ] Check: Is there an assets/inventory table?
- [ ] Check: Can we reuse signature component from Feature #5?
- [ ] Check: Photo upload ready?
- [ ] Identify: Where to store handover records? (new table?)
- [ ] Decision: Template per trip type (different packages = different items)?
- [ ] Decision: How to calculate variance threshold (10%)?

**Data it uses:**
- Equipment/inventory list
- Trip details
- QR code
- Camera for photos
- Signature

**Data it creates:**
- Handover records
- Photo evidence
- Variance alerts

---

### Feature #9: Multi-Role Crew Management

**What it does:**  
If trip has 2+ guides, admin assigns roles: "Lead Guide" (full access, sees all passenger info) vs "Support Guide" (limited view, sees only names, contact info hidden). Payment split: 60% lead, 40% support.

**Why it matters:**  
- Privacy control (not all crew needs full manifest)
- Clear role responsibility
- Fair payment distribution

**How to validate before coding:**
- [ ] Check: Is there a trip crew assignment interface?
- [ ] Check: Is RLS (Row Level Security) set up? (Supabase feature)
- [ ] Check: Is there a role/permission system?
- [ ] Check: How is payroll calculated currently?
- [ ] Identify: Where are trip crew roles stored? (new table or column?)
- [ ] Decision: Data masking at API level or database RLS?
- [ ] Decision: Payment split automatic or manual override?

**Data it uses:**
- Crew list
- Trip assignment
- Passenger manifest (to mask/show)
- Payment rules

**Data it creates:**
- Trip crew role assignments
- Payment split records

---

### Feature #10: Crew Directory & Quick Contact

**What it does:**  
Guide presses "Emergency" → map shows all guides currently on-duty within 10km radius. Shows name, distance, contact buttons (WhatsApp / Call). One-tap to reach another guide for help. If SOS triggered, auto-notifies all nearby guides.

**Why it matters:**  
- Quick backup in emergency
- Crew coordination
- Safety net for isolated operations

**How to validate before coding:**
- [ ] Check: Is GPS real-time tracking already running?
- [ ] Check: Is WhatsApp/call integration available? (WA status, tel: links)
- [ ] Check: Is map integration (Google/Mapbox) set up?
- [ ] Check: Is SOS feature (#1) being built? Connect to it.
- [ ] Identify: Who is "on-duty"? (check trip status?)
- [ ] Decision: 10km radius fixed or configurable?
- [ ] Decision: Show all guides or filter by trip?

**Data it uses:**
- Real-time guide GPS locations
- Guide contact info
- Trip status (to determine on-duty)
- SOS alert trigger

**Data it creates:**
- Crew directory view (real-time)
- Contact attempt logs
- SOS notification records

---

### Feature #11: Offline Marine Map

**What it does:**  
Guide downloads a local marine map region (Lampung, Pahawang) when at harbor (has signal). Map shows: danger zones (reefs, shallow water), signal hotspots, planned trip route. Works completely offline at sea. Shows guide's real-time position on map. Can see breadcrumb trail (where they've been).

**Why it matters:**  
- Navigation safety (offline)
- Hazard awareness
- Situational awareness (breadcrumb trail shows trip progress)

**How to validate before coding:**
- [ ] Check: Is Mapbox integration available? (or Google Maps?)
- [ ] Check: Is real-time GPS streaming ready?
- [ ] Check: Is offline tile caching available? (Service Worker)
- [ ] Check: Do we have danger zone data? (reefs, rocks data source?)
- [ ] Identify: Max download size per region? (constraint on storage)
- [ ] Decision: Pre-load all regions or on-demand?
- [ ] Decision: Danger zones = database records or image layer?

**Data it uses:**
- Map tiles (Mapbox/Google)
- Danger zone coordinates (GeoJSON or similar)
- Trip itinerary (route)
- Real-time GPS location

**Data it creates:**
- Downloaded map region cache
- Breadcrumb trail (position history during trip)

---

## PHASE 3: EXPERIENCE FEATURES (Months 5-6)

### Feature #12: Digital Tipping (QRIS Payment)

**What it does:**  
Trip ends. Guide taps "Get Tips" → QRIS code appears on screen. Tourist scans with their payment app → payment window opens. Tourist enters amount (or picks preset: Rp 50k/100k/200k) → pays directly to guide's wallet. Guide gets instant notification. Wallet balance updates. Guide can withdraw weekly or monthly.

**Why it matters:**  
- Increases guide income 10-15%
- Cashless (transparent, no cash handling)
- Encourages good service (guides know tipping is easy)

**How to validate before coding:**
- [ ] Check: Is Midtrans/payment gateway integrated?
- [ ] Check: Is QRIS generation API available?
- [ ] Check: Is guide wallet system in place?
- [ ] Check: Is payroll/withdrawal system ready?
- [ ] Identify: Where to store tip transactions? (new table?)
- [ ] Decision: Static QRIS per guide or dynamic per trip?
- [ ] Decision: Automatic weekly withdrawal or manual?

**Data it uses:**
- Guide ID (for QRIS)
- Payment gateway (Midtrans)
- Trip context (optional, for tracking)

**Data it creates:**
- Tip wallet records
- Tip transaction history
- Withdrawal requests

---

### Feature #13: Guest Engagement Kit

**What it does:**  
During trip, guide taps "Games" → can launch: Quiz (trivia about destination), Music (link to Spotify playlist), Photo Challenge (passengers take best sunset photo, winner gets snack). Leaderboard shows scores per passenger. Keeps tourists entertained during boat ride.

**Why it matters:**  
- Better guest experience (memorable trip)
- Higher ratings/reviews
- Entertainment reduces seasickness complaints

**How to validate before coding:**
- [ ] Check: Is quiz/game system available?
- [ ] Check: Can we embed Spotify widget?
- [ ] Check: Is photo upload ready?
- [ ] Check: Is leaderboard logic available?
- [ ] Identify: Quiz question source? (hardcoded or database?)
- [ ] Decision: Offline quiz or online only?
- [ ] Decision: Leaderboard real-time or end-of-trip?

**Data it uses:**
- Trip details (destination for quiz questions)
- Passenger list (for leaderboard)
- Spotify API (for music)
- Camera (for photo challenge)

**Data it creates:**
- Quiz responses
- Engagement scores
- Leaderboard records
- Photo uploads

---

### Feature #14: Smart Watch Companion App

**What it does:**  
Guide wears Apple Watch or Galaxy Watch. Small app on watch: big red SOS button, heart rate monitoring (detect fatigue), quick check-in tap, trip status badge. When SOS pressed on watch, same alert goes to admin as Feature #1 (SOS). Heart rate spikes might auto-alert admin to watch guide.

**Why it matters:**  
- Quick SOS without fishing phone out of pocket
- Fatigue detection (prevents guide overwork)
- Hands-free operation on boat

**How to validate before coding:**
- [ ] Check: Current app tech stack. Can it support smartwatch? (React Native? Flutter?)
- [ ] Check: Is heart rate API available? (Apple HealthKit / Android Health Connect)
- [ ] Check: Can SOS API be called from watch?
- [ ] Decision: Build native watch app (iOS WatchKit + Android Wear OS) or simple PWA mirror?
- [ ] Decision: Complexity vs. benefit. Is this Phase 3 essential?
- [ ] Note: Requires separate dev effort (Obj-C/Swift for iOS, Kotlin for Android)

**Data it uses:**
- SOS API (same as Feature #1)
- Heart rate sensor
- Watch app

**Data it creates:**
- SOS trigger logs
- Heart rate data stream
- Watch-specific events

---

---

## 🗂️ FEATURE DEPENDENCIES

**What must be built first:**
1. Feature #1 (Risk Assessment) → foundation for blocking logic
2. Features #2, #3, #4, #5, #6 → can happen in parallel
3. Feature #7 (Voice) → depends on #3 (Incident Form) existing first
4. Feature #8, #9, #10, #11 → can happen in parallel
5. Features #12, #13, #14 → after Phase 2 solid

**Cross-feature integration:**
- #1 Risk Assessment → blocks trip start (used by all features)
- #10 Crew Directory → integrates with Feature #9 (crew roles)
- #14 Smart Watch → mirrors all of #1-6 (SOS, briefing alerts, etc.)

---

## ✅ VALIDATION FLOW (FOR EACH FEATURE)

**Week 1 of each sprint: Validation phase**

For each feature, tech lead answers:

```
Feature: [Name]

1. REUSE CHECK
   - [ ] Does this component/page already exist? Where?
   - [ ] Can we reuse existing forms/modals?
   - [ ] Can we reuse existing table structures?
   - [ ] List what exists: ________________

2. DATA CHECK
   - [ ] Which existing tables does it READ from? (trips, passengers, crews, assets, etc.)
   - [ ] Which new table(s) must we CREATE? (or add columns?)
   - [ ] Does it fit our database schema?
   - [ ] List schema changes: ________________

3. API CHECK
   - [ ] Which existing APIs does it use? (weather, Midtrans, Whisper, etc.)
   - [ ] Which new API endpoints must we create?
   - [ ] Do API responses match existing patterns?
   - [ ] List new endpoints: ________________

4. OFFLINE CHECK
   - [ ] Does it need offline capability?
   - [ ] Can we cache needed data?
   - [ ] Do forms/submissions queue when offline?

5. APPROVAL
   - [ ] Tech lead approves reuse strategy
   - [ ] Design reviewed (UI consistency)
   - [ ] QA understands test scope
   - [ ] Ready to code: [ ] YES [ ] NO

If NO → discuss, adjust plan, re-validate.
```

---

## 🎯 SUCCESS CRITERIA (per phase)

**Phase 2 (Months 3-4): Safety Ready**
- ✅ Risk assessment blocks unsafe trips
- ✅ Equipment checklist prevents trips without gear
- ✅ Incident form captures all ISO requirements
- ✅ Guide certs enforced (block if expired)
- ✅ All forms work offline + sync
- ✅ Audit trail 100% complete

**Phase 3 (Months 5-6): Experience Complete**
- ✅ Tipping increases guide income 10-15%
- ✅ 60%+ passengers use quiz/games
- ✅ Map downloaded in 3 regions
- ✅ Smart watch SOS tested with 5 guides

---

## 📅 IMPLEMENTATION TIMELINE

**Week 1-2: Sprint 1 (Feature #1-2)**  
→ Validation + kickoff

**Week 3-4: Sprint 2 (Feature #3-4)**  
→ Incident + Cert tracking

**Week 5-6: Sprint 3 (Feature #5-6)**  
→ Briefing + Training

**Week 7-8: Sprint 4 (Feature #7-8)**  
→ Voice report + Logistics

**Week 9-10: Sprint 5 (Feature #9-11)**  
→ Crew management + Map

**Week 11-12: QA + UAT**  
→ Testing + soft launch

**Month 5-6: Phase 3 (Feature #12-14)**  
→ Tipping, Engagement, Watch

---

## 🎬 NEXT STEPS FOR DEVELOPMENT TEAM

1. **Copy this document** into your dev wiki
2. **For each feature, run validation checklist** (use template above)
3. **Tech lead signs off** on reuse strategy
4. **Create Jira/Asana tickets** with validation results
5. **Assign to sprint** based on dependencies
6. **Start coding** → reference validation sheet constantly

---

**Document prepared for Cursor AI & Development Team**  
**Ready to start building with confidence** ✅

