# 🎯 BUSINESS REQUIREMENTS DOCUMENT: GUIDE APPS ENHANCEMENTS
**Version:** 1.0 FINAL | **Date:** 19 Dec 2025 | **Status:** Ready for Development

---

## ⚠️ CRITICAL: VALIDATION & INTEGRATION REQUIREMENTS

**SEBELUM development dimulai, WAJIB:**

1. **Verify existing features** → Jangan buat duplikat table/API
2. **Map dependencies** → Feature X harus selesai sebelum Feature Y
3. **Validate data integration** → Semua data harus link ke existing tables
4. **Check for conflicts** → Pastikan no API route collisions
5. **Get tech lead sign-off** → Sebelum coding dimulai

---

## 📋 TIER 1: COMPLIANCE MANDATORY (Fase 2)

### Feature #1: Pre-Trip Safety Risk Check
**What it does:** Sebelum trip dimulai, guide harus jawab checklist keselamatan (ombak, crew, equipment). Sistem hitung risk score otomatis. Jika terlalu bahaya, trip TIDAK BISA dimulai.

**Who uses it:** Tour guide (lapangan), Admin Ops (bisa override)

**User Flow:**
1. Guide buka trip → Modal checklist muncul otomatis
2. Input: Tinggi ombak, angin, crew siap?, equipment lengkap?
3. Sistem hitung risk score
4. Jika aman → lanjut, jika bahaya → BLOCK trip
5. Admin bisa force-approve jika emergency

**Key Benefit:** Prevent unsafe trips, audit trail lengkap, bisa offline

**INTEGRATION CHECK:** 
- [ ] Uses existing `trips` table (add column: `pre_trip_assessment_id`)
- [ ] Reuse existing GPS module for data capture
- [ ] Create NEW table: `pre_trip_assessments` (link to trips)
- [ ] Uses existing weather API integration (BMKG)
- [ ] Uses existing IndexedDB for offline caching
- [ ] Check: Does SOS feature (#10) already exist? If yes, use same location service

---

### Feature #2: Safety Equipment Photo Checklist
**What it does:** Guide harus fotografi equipment (lifejacket, P3K, life raft) sebelum berangkat. Foto otomatis dapat GPS & waktu. Jika equipment kurang, trip blocked.

**Who uses it:** Tour guide (lapangan)

**User Flow:**
1. Guide lihat checklist equipment per trip type
2. Input jumlah di lapangan (misal: 10 lifejacket, 1 first aid kit)
3. Ambil foto setiap equipment → foto otomatis dapat GPS & timestamp
4. Rate kondisi (OK/Rusak/Kurang)
5. Tanda tangan = selesai
6. Sistem warn jika lifejacket < jumlah penumpang

**Key Benefit:** Bukti digital equipment, deteksi hilang/rusak, bisa offline

**INTEGRATION CHECK:**
- [ ] Uses existing `assets` table (equipment list)
- [ ] Uses existing photo upload to Supabase Storage
- [ ] Create NEW table: `equipment_checks` (link to trips & assets)
- [ ] Reuse GPS module (already in Feature #1)
- [ ] Blocks trip start? Links to Feature #1 logic
- [ ] Check: Is passenger count already available from bookings? Yes → use existing

---

### Feature #3: Incident & Accident Report Form
**What it does:** Jika ada kejadian (tamu jatuh, equipment rusak, dll), guide isi form digital dengan foto & tanda tangan. Auto-notify asuransi.

**Who uses it:** Tour guide (lapangan), Admin (review & approve)

**User Flow:**
1. Trip selesai ada incident → guide isi form multi-step
2. Pilih jenis: Tamu cedera? Equipment rusak? Keluhan? Nyaris celaka?
3. Input: tanggal/jam, lokasi, siapa yang terlibat, saksi, kronologi, foto kejadian
4. Tanda tangan digital (guide confirm "data akurat")
5. Auto-generate nomor laporan (INC-20251219-001)
6. Auto-kirim ke asuransi & admin

**Key Benefit:** Dokumentasi legal untuk klaim asuransi, quick response, bisa offline

**INTEGRATION CHECK:**
- [ ] Uses existing `trips` table
- [ ] Uses existing `passengers` table (untuk people involved)
- [ ] Reuse manifest data (already fetched for Feature #5)
- [ ] Create NEW table: `incidents` (link to trips & passengers)
- [ ] Uses existing photo upload mechanism
- [ ] Check: Signature component - does it already exist? (Should from Feature #5)
- [ ] Integrates with Feature #7 (voice transcription auto-fill)

---

### Feature #4: Guide Certification Tracker
**What it does:** Track sertifikat guide (SIM Kapal, First Aid, ALIN). Otomatis alert H-30 sebelum expired. Jika expired, guide TIDAK BISA trip.

**Who uses it:** Guide (check sertifikat sendiri), Admin (monitor semua guide)

**User Flow:**
1. Guide lihat profile → "My Certifications" 
2. Tampil: SIM (✅ Valid), First Aid (⚠️ Expiring 15 Jan), ALIN (✅ Valid)
3. H-30 before expired → notif "Sertifikat mau expired, perpanjang sekarang"
4. Guide upload sertifikat baru
5. Admin approve
6. Jika expired → trip start button disabled

**Key Benefit:** Compliance dengan regulasi, prevent non-certified guide, automatic reminders

**INTEGRATION CHECK:**
- [ ] Uses existing `crews` table (guides)
- [ ] Create NEW table: `crew_certifications` (link to crews)
- [ ] Reuse photo upload for cert images
- [ ] Integrates with trip start validation (Feature #1 logic)
- [ ] Check: Notification system - use existing push notification?
- [ ] Scheduler for H-30 reminder: use existing Supabase pgcron?

---

### Feature #5: Safety Briefing & Passenger Consent
**What it does:** Sebelum trip, guide baca briefing keselamatan ke tamu. Tamu tanda tangan digital persetujuan. Form auto-adjust per profil (lansia, bayi, cuaca buruk).

**Who uses it:** Tour guide (baca), Passenger (tanda tangan)

**User Flow:**
1. Trip mau dimulai → guide buka "Safety Briefing" page
2. Sistem auto-generate briefing points:
   - Jika ada lansia (>65) → fokus mobility
   - Jika ada bayi (<2) → info safety seat
   - Jika cuaca rough → info about waves
3. Guide baca satu-satu, check off setiap point
4. Tamu tanda tangan tablet (atau fingerprint jika support)
5. Tersimpan otomatis dengan tanda tangan digital

**Key Benefit:** Standardized briefing, legal waiver evidence, multilingual support, offline capable

**INTEGRATION CHECK:**
- [ ] Uses existing `trips` table
- [ ] Uses existing `passengers` table + `bookings` table
- [ ] Create NEW tables: `safety_briefings`, `passenger_consents` (link to trips & passengers)
- [ ] Check: Signature component - exists or need create? (Can reuse from Feature #3)
- [ ] Reuse photo upload for signature images
- [ ] Blocks trip start until all passengers consent? (Add validation to trip status)

---

### Feature #6: Training Records & Certificates
**What it does:** Admin bikin training session (SOP update, panic button drill). Track siapa attend, auto-generate certificate, enforce competency quiz.

**Who uses it:** Admin (create & track), Guide (attend & download cert)

**User Flow:**
1. Admin create training: nama, tanggal, jenis (SOP/Safety/Drill)
2. Admin mark attendance: Hadir / Absen / Telat
3. Auto-generate PDF certificate "Sertifikat Kehadiran Training"
4. Guide mandatory answer quiz (min pass 70%)
5. Guide lihat "Training History" page, download sertifikat

**Key Benefit:** Compliance proof, automatic cert generation, competency enforcement, offline ready

**INTEGRATION CHECK:**
- [ ] Uses existing `crews` table (guides/trainees)
- [ ] Create NEW tables: `crew_trainings`, `training_attendance`, `training_assessments`
- [ ] PDF generation: use existing jsPDF library? (Check dependencies)
- [ ] Integrates with Feature #4 (cert tracker - show completed trainings)
- [ ] Scheduler: send training reminders H-7, H-1 (use existing pgcron)
- [ ] Quiz enforcement: create simple quiz module (can be minimal)

---

### Feature #7: Voice-to-Text Report (AI)
**What it does:** Guide bisa record audio report (insiden/trip summary), AI transcribe otomatis jadi teks, auto-fill form fields.

**Who uses it:** Tour guide (lapangan), especially saat situasi emergency

**User Flow:**
1. Guide tekan tombol "Mulai Rekam"
2. Bicara: "Kemarin ada penumpang jatuh di deck, langsung kami beri first aid, dibawa ke klinik"
3. Sistem transcribe otomatis
4. Hasil ditampilkan untuk review (guide bisa edit)
5. Auto-fill form: deskripsi, tindakan yg diambil, dll
6. Guide tinggal submit

**Key Benefit:** Hands-free report, faster documentation, accurate transcription, easy for field conditions

**INTEGRATION CHECK:**
- [ ] Audio recording: use browser MediaRecorder API (native, no lib needed)
- [ ] Store audio blob in IndexedDB (use existing offline queue)
- [ ] Transcription: call Whisper API via backend proxy (protect API key)
- [ ] Create NEW table: `incident_voice_logs` (link to incidents table from Feature #3)
- [ ] Auto-fill logic: parse transcript → extract key info → populate Feature #3 form fields
- [ ] Cost tracking: ~$0.02/min Whisper API - budget it properly

---

## 📋 TIER 2: OPERATIONAL CRITICAL (Fase 2)

### Feature #8: Logistics Handover (Serah-Terima Barang)
**What it does:** Track stok barang (air minum, snack, alat) dari gudang ke guide. Deteksi jika ada yang hilang/kurang.

**Who uses it:** Warehouse staff (handover), Guide (receive & return), Admin (audit)

**User Flow:**
1. H-1 trip, warehouse scan QR code kotak logistik
2. Checklist muncul: 10 Aqua, 10 Snack, 5 Masker
3. Warehouse & guide sama-sama verify jumlah
4. Ambil foto stok
5. Tanda tangan both parties
6. Saat trip selesai, guide return barang + foto sisa
7. Sistem auto-flag jika ada variance > 10%

**Key Benefit:** Prevent losses, track missing items, cost savings, audit trail

**INTEGRATION CHECK:**
- [ ] Uses existing `assets` table (inventory items)
- [ ] Uses existing `trips` table
- [ ] Create NEW tables: `inventory_handovers`, `inventory_audit` (link to trips & assets)
- [ ] QR scanner: use existing camera integration? (Check capabilities)
- [ ] Signature: reuse component from Feature #5
- [ ] Photo upload: use existing Supabase Storage
- [ ] Variance flag: 10% threshold stored as config (can be adjusted)

---

### Feature #9: Multi-Role Crew Management
**What it does:** Jika trip besar (2+ guide), role-based access. Lead guide lihat semua, Support guide lihat hanya nama (contact info masked).

**Who uses it:** Lead guide (full access), Support guide (limited view)

**User Flow:**
1. Admin assign roles: Lead Guide, Support Guide
2. Lead guide dashboard: lihat full manifest (nama, contact, alergi, dll)
3. Support guide dashboard: lihat hanya nama & kelompok (contact di-mask)
4. Lead guide bisa assign task ke support guide
5. Payment split: 60% lead, 40% support

**Key Benefit:** Data privacy, clear role responsibility, payment transparency, coordination smooth

**INTEGRATION CHECK:**
- [ ] Uses existing `trips` table
- [ ] Uses existing `crews` table
- [ ] Create NEW table: `trip_crew_roles` (link to trips & crews)
- [ ] RLS policy: enforce at Supabase level (Support cannot see contact fields)
- [ ] Check: Existing RLS policies - add new rules or reuse pattern?
- [ ] Contact masking: implement at API level (don't send full contact to Support view)
- [ ] Payment split: add column to trip_crew_roles or use separate table?

---

### Feature #10: Crew Directory & Quick Contact
**What it does:** Guide bisa lihat nearby crew yg sedang on-duty. Klik kontak langsung via WA/call jika emergency.

**Who uses it:** Tour guide (lapangan) saat emergency

**User Flow:**
1. Guide buka "Crew Directory"
2. Map tampil nearby crew (on-duty) dalam radius 10km
3. Tampil: nama, status (on-duty), jarak, contact (WA/Call)
4. Klik guide lain → auto-send WA template "Perlu bantuan di lokasi X"
5. Jika SOS triggered → auto-notify semua nearby crew

**Key Benefit:** Quick emergency response, crew coordination, SOS auto-alert nearby

**INTEGRATION CHECK:**
- [ ] Uses existing GPS/location tracking (from Feature #1)
- [ ] Uses existing `crews` table + Feature #9 `trip_crew_roles`
- [ ] Depends on Feature #9 (crew roles define who is "nearby")
- [ ] Map: use existing Mapbox integration or create new?
- [ ] Distance calculation: haversine formula (implement or use lib?)
- [ ] WA integration: use existing WAHA self-hosted instance (check if available)
- [ ] Quick-call: support both WA + phone call (phone uses tel: link)
- [ ] Integrates with SOS feature: IF SOS triggered → auto-notify all on-duty nearby crew

---

### Feature #11: Offline Marine Map
**What it does:** Map khusus laut dengan danger zones (karang, shallow water), signal hotspots. Download saat ada sinyal, bisa pake offline.

**Who uses it:** Tour guide (navigation & safety)

**User Flow:**
1. Guide download map region (Lampung, Pahawang) saat di dermaga (ada sinyal)
2. Di laut, buka map → tampil karang, shallow water zones
3. Tampil juga signal hotspots (tempat biasanya ada signal)
4. Trip route overlay (jalur yg direncanakan)
5. Real-time guide position tracking
6. Breadcrumb trail history

**Key Benefit:** Navigation safety, offline capability, danger awareness, route tracking

**INTEGRATION CHECK:**
- [ ] Uses existing GPS tracking (from Feature #1)
- [ ] Map library: use existing Mapbox or add new?
- [ ] Danger zones: create NEW table `danger_zones` with GeoJSON geometry
- [ ] Signal hotspots: create NEW table `signal_hotspots` with GeoJSON
- [ ] Tile caching: use existing Service Worker? (Add new cache strategies)
- [ ] Offline download: max 100MB per region (compress tiles)
- [ ] Route overlay: reads from existing trip itinerary? (Check available)
- [ ] Position tracking: reuse Feature #1 GPS data
- [ ] Check: Mapbox cost? Budget it in Phase 2 cost

---

## 📋 TIER 3: EXPERIENCE (Fase 3)

### Feature #12: Digital Tipping (QRIS Payment)
**What it does:** Tamu bisa kasih tip non-tunai ke guide via QRIS. Uang langsung masuk wallet, bisa withdraw bareng gaji.

**Who uses it:** Passenger (kasih tip), Guide (terima tip), Accountant (process withdrawal)

**User Flow:**
1. Trip selesai, guide tap "Get Tips"
2. QRIS code ditampilkan (statis per guide)
3. Tamu scan QRIS → app Midtrans terbuka
4. Tamu input nominal (atau pilih preset: 50k/100k/200k)
5. Tamu konfirmasi pembayaran
6. Guide dapat notif "Terima tip Rp 50.000"
7. Wallet balance auto-update
8. Guide bisa withdraw (manual atau auto batch/minggu)

**Key Benefit:** Increase guide income 10-15%, transparent, cashless, easy payment

**INTEGRATION CHECK:**
- [ ] Uses existing `crews` table (guides)
- [ ] Create NEW tables: `guide_tip_wallets`, `tip_transactions` (link to crews & trips)
- [ ] Midtrans API: use existing integration? (Check current setup)
- [ ] QRIS generation: via Midtrans snap API
- [ ] Webhook: handle Midtrans payment notification → update tip_transactions
- [ ] Notification: send real-time push to guide when tip received
- [ ] Withdrawal: integrate with existing payroll system? (Check how gaji processed)
- [ ] Tax calculation: if applicable, implement or leave to accounting?

---

### Feature #13: Guest Engagement Kit
**What it does:** Interactive games, trivia, musik saat perjalanan laut. Entertain tamu, improve rating.

**Who uses it:** Guide (facilitate), Passenger (play)

**User Flow:**
1. Guide buka "Guest Engagement" tab
2. Pilih Quiz, Games, atau Music
3. Quiz: "Kedalaman Pulau Pahawang berapa meter?" (auto-generate per destination)
4. Leaderboard shows tamu scores
5. Music tab: deep-link ke Spotify playlist
6. Photo challenge: best sunset photo wins snack
7. Score tracking per passenger

**Key Benefit:** Better guest experience, memorable trip, natural entertainment, improve ratings

**INTEGRATION CHECK:**
- [ ] Uses existing `trips` table
- [ ] Uses existing `passengers` table
- [ ] Create NEW tables: `quiz_questions`, `guest_engagement_scores` (link to trips & passengers)
- [ ] Quiz questions: seed initial data per destination (can be expanded later)
- [ ] Music tab: Spotify integration? (Deep-link is simple, no auth needed)
- [ ] Photo challenge: use existing photo upload mechanism
- [ ] Leaderboard: simple ranking query (no new complex logic)
- [ ] Offline capability: cache quiz questions & scores (less critical, can be Phase 4)

---

### Feature #14: Smart Watch Companion App
**What it does:** Lightweight app di Apple Watch / Galaxy Watch. SOS button, heart rate monitor, quick check-in, status badge.

**Who uses it:** Guide (wearable quick access)

**User Flow:**
1. Guide wearing smartwatch synced dengan phone app
2. SOS button prominent di watch face
3. Long-press SOS → trigger alert (queue offline jika no signal)
4. Heart rate monitor: track guide fatigue/stress
5. Haptic feedback: different vibration for alerts
6. Quick check-in: tap to mark "present"
7. Trip status badge: show current trip info

**Key Benefit:** Quick SOS access (no need phone), fatigue detection, convenient, hands-free operation

**INTEGRATION CHECK:**
- [ ] **Architecture decision:** Separate native app or PWA companion?
- [ ] If native: requires separate iOS (WatchKit) + Android (Wear OS) development
- [ ] If PWA: can mirror phone app on watch browser (limited UI space)
- [ ] SOS trigger: use same API endpoint as Feature #1 (already queued offline)
- [ ] Heart rate: use smartwatch health API (iOS HealthKit, Android Health Connect)
- [ ] Haptic feedback: different vibration patterns (depends on watch OS)
- [ ] Sync: Bluetooth for phone ↔ watch + HTTP for watch ↔ server
- [ ] Check: Current tech stack support watches? (React Native can do it)
- [ ] Cost: separate dev effort for WatchKit/Wear OS (budget carefully)

---

## 🎯 IMPLEMENTATION SUMMARY

**Fase 2 (Bulan 3-4):** Features #1-11 (Safety, Compliance, Operational)
- 11 features
- ~380 dev hours
- Budget: Rp 190 juta
- **Outcome:** ISO 21101 & ISO 45001 compliance ready

**Fase 3 (Bulan 5-6):** Features #12-14 (Experience)
- 3 features  
- ~135 dev hours
- Budget: Rp 67.5 juta
- **Outcome:** Complete feature parity dengan enterprise apps

**Total:** 14 features | 515 hours | Rp 257.5 juta

---

## ✅ SUCCESS CRITERIA

**Fase 2:**
- All forms work offline + sync when online
- Risk assessment successfully blocks unsafe trips (zero override)
- 100% guide training on new features within Week 1
- Incident reports reduce time from 2 hours to 15 minutes
- Zero compliance gaps identified in audit
- 95%+ data integrity (no orphaned records)

**Fase 3:**
- 70%+ guide adoption of marine map within Month 2
- 10-15% increase in guide income (tipping)
- 60%+ passenger engagement with quiz per trip
- 20%+ smartwatch adoption (early adopters)
- NPS score improvement by 10 points

---

## 🔍 VALIDATION CHECKLIST: SEBELUM EKSEKUSI

### Database Check
- [ ] ALL tables link to existing tables (no isolated data)
- [ ] No duplicate tables (check schema first)
- [ ] Foreign keys properly defined
- [ ] Backward compatibility with existing data
- [ ] Migration plan documented & tested on staging

### API Check
- [ ] No endpoint route collisions
- [ ] Response formats consistent with existing APIs
- [ ] Error handling aligned with existing patterns
- [ ] Rate limiting applied (if needed)
- [ ] Third-party API keys secured in env

### Component Check
- [ ] Reuse existing UI components (don't duplicate)
- [ ] Navigation routes registered in layout
- [ ] State management doesn't conflict with existing
- [ ] Design system styling consistent
- [ ] Accessibility (WCAG 2.1 AA) met

### Offline Check
- [ ] New data types added to IndexedDB schema
- [ ] Service Worker updated for new routes
- [ ] Mutation queue handles new form types
- [ ] Offline → online sync tested
- [ ] No data loss on reconnection

### Security Check
- [ ] RLS policies defined (who can see what)
- [ ] PII fields encrypted
- [ ] Sensitive data masked per role
- [ ] GDPR compliance (auto-delete H+30 if applicable)
- [ ] Audit log captures all changes

### Sign-Off Check
- [ ] PM approved feature specs
- [ ] Tech lead reviewed dependencies
- [ ] QA understood test scenarios
- [ ] Data migration plan approved
- [ ] Security review completed

---

## 🚀 NEXT STEPS

1. **Week 1:** Stakeholder approval & sign-off on BRD
2. **Week 2:** 
   - Tech lead runs validation checklist for each feature
   - Document existing vs new components
   - Create detailed integration map
   - Break down into Jira tickets
3. **Week 3:** Dev kickoff Sprint 1 (Features #1-2)
4. **Week 4-10:** Execute per sprint plan (see SPRINT BREAKDOWN below)
5. **Week 11:** QA, UAT, soft launch 5-10 guides
6. **Week 12:** Full launch with training

---

## 📊 SPRINT BREAKDOWN (Fase 2: 10 Minggu)

**Sprint 1 (Week 1-2):** Foundation & Core Safety
- Feature #1: Pre-Trip Risk Assessment
- Feature #2: Safety Equipment Checklist
- **Milestone:** Risk assessment blocks unsafe trips ✓

**Sprint 2 (Week 3-4):** Incident & Compliance
- Feature #3: Incident Report Form
- Feature #4: Guide Certification Tracker
- **Milestone:** Incident documentation ISO-compliant ✓

**Sprint 3 (Week 5-6):** Training & Briefing
- Feature #5: Safety Briefing & Consent
- Feature #6: Training Records & Certificates
- **Milestone:** 100% guide training completed ✓

**Sprint 4 (Week 7-8):** Voice & Logistics
- Feature #7: Voice-to-Text Report
- Feature #8: Logistics Handover
- **Milestone:** Zero loss incidents (logistics tracked) ✓

**Sprint 5 (Week 9-10):** Crew & Navigation
- Feature #9: Multi-Role Crew Management
- Feature #10: Crew Directory & Quick Contact
- Feature #11: Offline Marine Map
- **Milestone:** SOS auto-notifies nearby crew ✓

---

## 🎓 PHASE 3 SPRINT BREAKDOWN (Bulan 5-6)

**Sprint 6 (Week 1-2):** 
- Feature #12: Digital Tipping (QRIS)
- **Milestone:** Guide income increase 10-15% ✓

**Sprint 7 (Week 3-4):**
- Feature #13: Guest Engagement Kit
- **Milestone:** 60%+ passenger participation in quiz ✓

**Sprint 8 (Week 5-6):**
- Feature #14: Smart Watch Companion
- **Milestone:** Early adopter testing successful ✓

---

**Document ready for Development Team Execution** ✅
**All 14 features fully specified with integration requirements**

