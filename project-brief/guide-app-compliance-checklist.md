# 📱 TOUR GUIDE APP FEATURE CHECKLIST – Full Compliance Edition

**Document Version:** 1.0  
**Last Updated:** 19 Desember 2025  
**Scope:** MyAeroTravel ID Guide App (`(mobile)/guide` route group)  
**Purpose:** Memastikan Tour Guide (Lapangan) memiliki semua tools untuk comply dengan ISO 21101, ISO 45001, UU PDP, CHSE, dan Asuransi Wajib.

---

## 🎯 QUICK OVERVIEW: Guide App Compliance Areas

| Compliance Area | Primary Module | Key Features | Priority | Phase |
|---|---|---|---|---|
| **Safety & Risk** | Pre-Trip Assessment | Risk checklist, hazard identification, approval gate | P1 | Fase 2 |
| **Crew Qualification** | Certification Tracker | SIM/First Aid/ALIN verification, expiry alerts | P1 | Fase 2 |
| **Emergency Response** | SOS & Crisis Management | Panic button, GPS tracking, auto-escalation | P1 | Fase 2 |
| **Incident Reporting** | Incident Form | Formal documentation (ISO format), RCA support | P1 | Fase 2 |
| **Safety Communication** | Briefing & Manifest | Auto-generated briefing, passenger acknowledgment | P1 | Fase 2 |
| **Equipment & Inventory** | Safety Checklist | Lifejacket/First Aid Kit verification, photos | P2 | Fase 2 |
| **Attendance & Tracking** | Geofencing & Check-in | GPS verification, attendance log, on-time tracking | P1 | Fase 1 |
| **Data Protection** | Consent & Privacy | Passenger consent capture, data masking | P0 | Pre-Launch |
| **Environmental** | Waste Tracking | Per-trip waste log, disposal documentation | P3 | Fase 3 |
| **Offline Mode** | Sync Engine | IndexedDB queuing, auto-sync when online | P1 | Fase 1 |

---

## 📋 SECTION 1: PRE-TRIP SAFETY MANAGEMENT (ISO 21101, ISO 45001, CHSE)

### **Module 1.1: Pre-Trip Risk Assessment & Approval Gate**

**Purpose:** Mandatory checklist sebelum kapal boleh berangkat. Jika skor risiko > threshold, BLOCK trip.

| Feature | Description | UI/UX Details | API Endpoint | Data Model | Status | Priority | Phase |
|---|---|---|---|---|---|---|---|
| **Risk Assessment Form** | Modal form muncul otomatis saat guide buka trip pertama kali | Form dengan kategori: Weather (ombak, angin), Crew (siap?), Equipment (lengkap?), Passenger (lansia/anak?) | `POST /api/v1/trips/:tripId/risk-assessment` | `pre_trip_assessments` table | ❌ Belum | P1 | Fase 2 |
| **Weather Data Integration** | Real-time cuaca dari API eksternal (BMKG/OpenWeather) | Display: ombak (m), angin (knots), visibility, temperature | `GET /api/v1/weather?lat=x&lng=y` | Cache di IndexedDB | ❌ Belum | P1 | Fase 2 |
| **Wave Height Input** | Input numerik manual (backup jika API fail) | Unit: meter. Input range 0-5m dengan warning zone (2-3m: caution, >3m: danger) | `POST /api/v1/trips/:tripId/risk-assessment` | `pre_trip_assessments.wave_height` | ❌ Belum | P1 | Fase 2 |
| **Wind Speed Input** | Input numerik atau dropdown (beaufort scale) | Unit: knots. Visual warning: calm (0-5), moderate (5-15), strong (15-30), gale (>30) | `POST /api/v1/trips/:tripId/risk-assessment` | `pre_trip_assessments.wind_speed` | ❌ Belum | P1 | Fase 2 |
| **Crew Readiness Checklist** | Checkbox list: guide present, asisten siap, crew tidak mabuk | Manual verification (no sensor) | `POST /api/v1/trips/:tripId/risk-assessment` | `pre_trip_assessments.crew_readiness` (JSON) | ❌ Belum | P1 | Fase 2 |
| **Equipment Sufficiency** | Checkbox: lifejacket qty OK?, first aid kit present?, beacon working?, life raft inspected? | Photo capture required untuk lifejacket & raft check | `POST /api/v1/trips/:tripId/risk-assessment` + photo upload | `pre_trip_assessments.equipment_check` (JSON) | ❌ Belum | P1 | Fase 2 |
| **Passenger Profile Scan** | Read trip manifest: ada lansia (>65)? Ada bayi (<2)? Disabled passenger? | Auto-load dari booking data | `GET /api/v1/trips/:tripId/passengers` | Dari `bookings` & `passengers` table | ✅ Partial | P1 | Fase 2 |
| **Risk Score Calculation** | Auto-calculate scoring: (wave_height × 20) + (wind_speed × 10) + (missing_crew × 25) + (missing_equipment × 30) | Visual gauge: Green (0-40), Yellow (40-70), Red (>70) | System logic | Score integer | ❌ Belum | P1 | Fase 2 |
| **Approval Gate Logic** | IF risk_score > 70 → BLOCK trip (red button disable) + notification to Admin Ops | Toast: "Trip tidak bisa dimulai. Hubungi Admin Ops." | `POST /api/v1/trips/:tripId/start` – conditional logic | `trips.status` = blocked | ❌ Belum | P1 | Fase 2 |
| **Approval Override** | Admin Ops bisa force-approve jika ada alasan (klik tombol di admin dashboard) | Audit log: siapa approve, kapan, alasan apa | `PATCH /api/v1/trips/:tripId/risk-override` | `audit_log` entry | ❌ Belum | P2 | Fase 2 |
| **Historical Trend** | Weekly chart: risk score trend per guide (detect pola tidak aman) | Bar chart: minggu ini vs minggu lalu | `GET /api/v1/guide/:guideId/risk-trend?weeks=4` | Aggregate dari `pre_trip_assessments` | ❌ Belum | P3 | Fase 3 |
| **Data Storage (Offline)** | Save assessment ke IndexedDB jika offline, sync ke server saat online | Mutation queue: `pending_assessments` | Service Worker + TanStack Query | `pre_trip_assessments` (sync) | ✅ Partial | P1 | Fase 1 |

**Success Criteria:**
- ✅ Risk form muncul auto, tidak bisa di-skip
- ✅ Risk skor tepat sesuai formula
- ✅ Approval gate mencegah trip start jika risk tinggi
- ✅ Offline capability berfungsi
- ✅ Audit trail lengkap (siapa assess, score berapa, waktu)

---

### **Module 1.2: Safety Equipment Checklist & Inspection Photos**

**Purpose:** Guide harus verify & fotografi safety equipment sebelum berangkat (ISO 21101 §7.2, CHSE requirement).

| Feature | Description | UI/UX Details | API Endpoint | Data Model | Status | Priority | Phase |
|---|---|---|---|---|---|---|---|
| **Equipment Checklist** | Predefined list: Lifejacket (qty), First Aid Kit, Life Raft, Emergency Beacon, Life Buoy, Flares | Checkbox list dengan quantity input untuk lifejacket & life buoy | `GET /api/v1/trips/:tripId/equipment-template` | `safety_equipment_templates` | ❌ Belum | P1 | Fase 2 |
| **Lifejacket Verification** | Input: qty expected vs qty tersedia (dari manifest pax count) | Warning jika qty < total pax | `POST /api/v1/trips/:tripId/equipment-check/lifejacket` | `equipment_checks.lifejacket_qty` | ❌ Belum | P1 | Fase 2 |
| **Photo Capture (Camera)** | Guide ambil foto equipment (minimal: 1 foto lifejacket, 1 foto first aid, 1 foto raft) | Camera app trigger → crop & preview → upload | `POST /api/v1/trips/:tripId/equipment-photos` (multipart) | `equipment_check_photos` table | ❌ Belum | P1 | Fase 2 |
| **Photo Timestamp & GPS** | Auto-embed timestamp & GPS koordinat di metadata foto | EXIF: datetime, lat, lng. Show "Foto taken at Dermaga Pahawang" | Metadata dari device | `equipment_check_photos.taken_at, lat, lng` | ❌ Belum | P1 | Fase 2 |
| **Condition Rating** | Per equipment: Excellent / Good / Fair / Poor dropdown | Visual icon: ✅ ⚠️ 🔴 | `POST /api/v1/trips/:tripId/equipment-check` | `equipment_checks.condition` enum | ❌ Belum | P1 | Fase 2 |
| **Defect Reporting** | Jika ada yang rusak/hilang, guide input detail: "Lifejacket 2 sobek di tali" | Free text input field | `POST /api/v1/trips/:tripId/equipment-check` | `equipment_checks.defect_notes` | ❌ Belum | P1 | Fase 2 |
| **Maintenance Schedule Sync** | Show last maintenance date per equipment (dari `equipment_maintenance_log`) | "Last serviced: 15 Des 2025. Next due: 15 Jan 2026." | `GET /api/v1/equipment/:equipmentId/maintenance-history` | Join dengan `assets` table | ❌ Belum | P2 | Fase 2 |
| **Expiry Alert** | Alert jika safety cert (misal life raft cert) mau expire | Red banner: "Life Raft certificate expires 20 Jan 2026 (2 minggu)" | System logic | Check `assets.expiry_date` | ❌ Belum | P1 | Fase 2 |
| **Completion Confirmation** | Guide tap "Selesai Inspeksi" button → confirmation modal | Modal: "Semua equipment OK? Foto tersimpan?" | `PATCH /api/v1/trips/:tripId/equipment-check/complete` | `equipment_checks.completed_at` | ❌ Belum | P1 | Fase 2 |
| **Data Storage & Sync** | Save form + photos ke IndexedDB saat offline, sync batch saat online | Queue mechanism untuk upload foto besar | Service Worker | `equipment_checks` + photos blob | ✅ Partial | P1 | Fase 1 |

**Success Criteria:**
- ✅ Checklist mandatory sebelum trip start (blocking)
- ✅ Photos terambil & ter-upload dengan GPS/timestamp
- ✅ Maintenance schedule terintegrasi
- ✅ Offline capability untuk form + photos (queue uploads)
- ✅ Audit trail: siapa check, waktu, defect noted

---

## 📋 SECTION 2: INCIDENT & EMERGENCY RESPONSE (ISO 21101 §6.5, ISO 45001 §9.2)

### **Module 2.1: Panic Button / SOS Alert System**

**Purpose:** Guide di laut yang ada emergency bisa trigger SOS → auto-notify admin & insurance.

| Feature | Description | UI/UX Details | API Endpoint | Data Model | Status | Priority | Phase |
|---|---|---|---|---|---|---|---|
| **Panic Button (Header)** | Large red button di top header, always visible (tidak bisa di-scroll hilang) | Button text: "🔴 SOS" (atau 🆘). Long-press 3 detik (prevent accidental tap) | `POST /api/v1/trips/:tripId/sos-trigger` | `sos_alerts` table | ❌ Belum | P1 | Fase 2 |
| **Long-Press Confirmation** | Visual countdown: "Hold 3s to activate SOS" | Progress bar animated selama 3 detik | JavaScript touch event handler | — | ❌ Belum | P1 | Fase 2 |
| **GPS Capture (High Accuracy)** | Saat SOS trigger, capture koordinat GPS dengan akurasi tinggi | Use browser geolocation API (high accuracy mode) | Auto-capture, no user input | `sos_alerts.latitude, longitude` | ✅ Partial | P1 | Fase 1 |
| **Real-time GPS Streaming** | Setelah SOS trigger, stream GPS lokasi setiap 10 detik ke server | Update `sos_alerts.location` dengan trajectory tracking | WebSocket atau polling `POST /api/v1/trips/:tripId/sos-location` | `sos_location_history` table | ❌ Belum | P1 | Fase 2 |
| **Admin Dashboard Live Map** | Admin Ops bisa lihat SOS trip di peta real-time (Google Maps embed) | Peta: red marker = SOS location, breadcrumb = trail historis | `GET /api/v1/dashboard/sos-live-map` + WebSocket subscribe | Real-time data | ❌ Belum | P1 | Fase 2 |
| **Auto-Escalation Notification** | SOS trigger → auto-send notification to Admin Ops, Manager, Owner via push + WA | WA message: "🚨 SOS dari Trip [Nama] Guide [Nama]. Lokasi: [Link Maps]. Hubungi secepatnya." | Background job + WAHA API | `notifications` + `sos_alerts` | ❌ Belum | P1 | Fase 2 |
| **Insurance & Hospital Alert** | Setelah SOS, system juga notify insurance partner + nearest hospital (if injury) | Auto-select hospital berdasarkan lokasi GPS (integrate GMaps API) | Backend job | `sos_alerts.notified_parties` JSON | ❌ Belum | P2 | Fase 2 |
| **Incident Type Selection** | Guide bisa select jenis emergency: Medical, Equipment Failure, Capsized, Man Overboard, Weather, Other | Dropdown di post-SOS modal | `POST /api/v1/trips/:tripId/sos-incident-type` | `sos_alerts.incident_type` | ❌ Belum | P1 | Fase 2 |
| **Voice Note / Description** | Guide bisa record audio note atau type urgency level | Voice memo (record max 30 detik), atau text input | `POST /api/v1/trips/:tripId/sos-description` (voice file + transcript) | `sos_alerts.voice_note_url, transcript` | ❌ Belum | P2 | Fase 2 |
| **Countdown Timer** | Visual timer: "Help coming in: 15 mins" (based on Admin acknowledgement + ETA) | Countdown dari estimated arrival waktu backup | Auto-calculate dari Admin's GPS | Display on screen | ❌ Belum | P2 | Fase 2 |
| **Cancellation (False Alarm)** | Guide bisa cancel SOS jika false alarm ("Tekan SELESAI jika bahaya sudah berlalu") | Button "Cancel SOS" (require reason: "Salah tombol", "Sudah aman", etc) | `PATCH /api/v1/trips/:tripId/sos-cancel` | `sos_alerts.status = CANCELLED, cancelled_reason` | ❌ Belum | P1 | Fase 2 |
| **Offline Behavior** | Jika offline saat SOS, queue alert di IndexedDB + retry saat online | Show: "⚠️ No signal. Alert akan dikirim saat sinyal kembali." | Service Worker queue + sync | `sos_alerts` with sync flag | ❌ Belum | P1 | Fase 2 |
| **Audit Trail Complete** | Log: trigger time, GPS at trigger, incident type, admin who ack'd, resolution time | Admin bisa lihat full history di dashboard | — | `sos_alerts` + `sos_location_history` | ❌ Belum | P1 | Fase 2 |

**Success Criteria:**
- ✅ SOS button always visible, not accidentally tappable
- ✅ Real-time location streaming to admin
- ✅ Multi-channel notification (push + WA + email)
- ✅ Works offline (queue + sync)
- ✅ Full audit trail for compliance

---

### **Module 2.2: Formal Incident Report Form (ISO 21101 Format)**

**Purpose:** Setelah ada incident/accident, guide wajib submit formal report (untuk audit trail & insurance claim).

| Feature | Description | UI/UX Details | API Endpoint | Data Model | Status | Priority | Phase |
|---|---|---|---|---|---|---|---|
| **Incident Report Trigger** | Form auto-offered H+1 setelah trip selesai jika ada incident flag | Modal notification: "Trip ini ada incident? Silakan report." | Check `trips.has_incident` flag | — | ❌ Belum | P1 | Fase 2 |
| **Incident Type Selection** | Dropdown: Injury, Property Damage, Near-Miss, Equipment Failure, Customer Complaint, Environmental, Other | ISO 21101 compatible categories | `POST /api/v1/trips/:tripId/incidents` | `incidents.type` enum | ❌ Belum | P1 | Fase 2 |
| **Date & Time** | Incident terjadi kapan? Date picker + time picker | Auto-populate saat trip, editable | `POST /api/v1/trips/:tripId/incidents` | `incidents.occurred_at` | ❌ Belum | P1 | Fase 2 |
| **Location** | Di mana incident terjadi? (Dermaga, di laut, spot snorkeling, kabin, dll) | Dropdown + GPS option | `POST /api/v1/trips/:tripId/incidents` | `incidents.location_description, latitude, longitude` | ❌ Belum | P1 | Fase 2 |
| **People Involved** | Siapa yang terlibat? (Guide, Asisten, Customer A, Customer B, dll) | Multi-select dari manifest pax + crew list | `POST /api/v1/trips/:tripId/incidents` | `incidents.involved_persons` JSON array | ❌ Belum | P1 | Fase 2 |
| **Witnesses** | Ada witness lain? (Required untuk serious incident) | Multi-select, minimum 1 witness untuk injury | `POST /api/v1/trips/:tripId/incidents` | `incidents.witnesses` JSON array | ❌ Belum | P1 | Fase 2 |
| **Detailed Description** | Apa yang terjadi? (Free text, min 100 char, max 5000) | Text area dengan char counter | `POST /api/v1/trips/:tripId/incidents` | `incidents.description` | ❌ Belum | P1 | Fase 2 |
| **Cause Analysis** | Root cause menurut guide? (Optional di lapangan, bisa di-fill admin nanti) | Free text atau structured 5-why template | `POST /api/v1/trips/:tripId/incidents` | `incidents.preliminary_cause` | ❌ Belum | P1 | Fase 2 |
| **Injury Details** | Jika ada injury: body part affected, severity (minor/moderate/severe), first aid given? | Multi-checkbox + severity radio button | `POST /api/v1/trips/:tripId/incidents/injury` | `incident_injuries` table | ❌ Belum | P1 | Fase 2 |
| **Action Taken** | Tindakan apa yang sudah diambil? (First aid, evac, contact hospital, etc) | Checkbox list + free text untuk custom actions | `POST /api/v1/trips/:tripId/incidents/actions` | `incident_actions` table | ❌ Belum | P1 | Fase 2 |
| **Photo/Video Attachment** | Foto scene incident (untuk dokumentasi insurance) | Camera + gallery picker, max 5 files | `POST /api/v1/trips/:tripId/incidents/attachments` | `incident_attachments` table (photo URLs) | ❌ Belum | P1 | Fase 2 |
| **Insurance Claim Flag** | Apakah ini akan di-claim ke asuransi? | Yes/No radio | `POST /api/v1/trips/:tripId/incidents` | `incidents.insurance_claim_required` | ❌ Belum | P1 | Fase 2 |
| **Signature / Confirmation** | Guide sign report (acknowledge akurat): Tap to sign (signature pad) atau checkbox "Saya konfirmasi data di atas akurat" | Signature pad atau simple checkbox | `POST /api/v1/trips/:tripId/incidents/sign` | `incidents.signed_by, signed_at` | ❌ Belum | P1 | Fase 2 |
| **Submit & Sync** | Save ke IndexedDB offline, submit saat online | Mutation queue | Service Worker | `incidents` + attachments | ❌ Belum | P1 | Fase 2 |
| **Confirmation Modal** | Setelah submit: "Report berhasil dikirim ke Admin Ops & asuransi. Nomor report: INC-2025-001234" | Show reference number untuk tracking | Response dari API | — | ❌ Belum | P1 | Fase 2 |

**Success Criteria:**
- ✅ Form comprehensive per ISO 21101 standard
- ✅ Photo documentation capability
- ✅ Signature/confirmation capture
- ✅ Auto-notification to insurance
- ✅ Offline + sync capability

---

## 📋 SECTION 3: GUIDE QUALIFICATIONS & TRAINING (ISO 21101 §5.4, ISO 45001 §5.4, CHSE)

### **Module 3.1: Guide Certification Tracker & Expiry Alerts**

**Purpose:** Verify guide punya valid SIM Kapal, First Aid, ALIN cert. Auto-block trip jika cert mau expire.

| Feature | Description | UI/UX Details | API Endpoint | Data Model | Status | Priority | Phase |
|---|---|---|---|---|---|---|---|
| **Certification Dashboard** | Login guide → show: "Sertifikasi Anda" cards: SIM (✅ Valid), First Aid (⚠️ Expires 15 Jan), ALIN (✅ Valid) | Card layout: cert name, issue date, expiry date, status badge | `GET /api/v1/guide/:guideId/certifications` | `crew_certifications` table | ❌ Belum | P1 | Fase 2 |
| **SIM Kapal Verification** | Guide input SIM number saat onboarding, system verify di database SIM Kapal (Ditjen Perhubungan API) | Photo upload of SIM card, auto-OCR extract number | `POST /api/v1/guide/:guideId/certifications/sim` + external API call | `crew_certifications.certificate_number, verified_at` | ❌ Belum | P1 | Fase 2 |
| **First Aid Certification** | International/Local first aid cert (PADI Rescue, Red Cross, dll). Guide upload cert file | PDF/image upload, extract: issuer, expiry date | `POST /api/v1/guide/:guideId/certifications/first-aid` | `crew_certifications` | ❌ Belum | P1 | Fase 2 |
| **ALIN (Ahli Laut Indonesia)** | Khusus guide kapal wisata, wajib punya ALIN cert dari Kemenparekraf | Upload cert file, auto-extract expiry | `POST /api/v1/guide/:guideId/certifications/alin` | `crew_certifications` | ❌ Belum | P1 | Fase 2 |
| **Expiry Countdown Alert** | H-30 before expiry: banner di Guide App home "⚠️ First Aid cert expires in 30 days. Renew now." | Dismissible banner + email notification | System scheduler (Supabase pgcron) | Triggered by `crew_certifications.expiry_date` | ❌ Belum | P1 | Fase 2 |
| **Hard Block on Expiry** | Trip cannot start if any required cert is expired | Button "Start Trip" disabled (grayed out) + tooltip "First Aid cert expired. Cannot start trip." | Logic in `POST /api/v1/trips/:tripId/start` | Trip start validation | ❌ Belum | P1 | Fase 2 |
| **Certification Renewal Workflow** | Admin bisa set "Renewal Required" status → guide bisa upload new cert → admin approve | Form: upload new cert + expiry date + issuer name | `POST /api/v1/guide/:guideId/certifications/:certId/renew` | `crew_certifications.status = PENDING_RENEWAL` → `VERIFIED` | ❌ Belum | P2 | Fase 2 |
| **Training Record Integration** | Show associated trainings: "Last First Aid Training: 15 Des 2025 (Admin)" | Link ke training records (Module 3.2) | `GET /api/v1/guide/:guideId/trainings` | Join `crew_trainings` table | ❌ Belum | P2 | Fase 2 |
| **Compliance Report** | Admin dashboard: "Guide Certification Compliance" report – % guides dengan all certs valid | Table: guide name, SIM status, First Aid status, ALIN status, compliance % | `GET /api/v1/reports/guide-certification-compliance` | Aggregate query | ❌ Belum | P2 | Fase 2 |

**Success Criteria:**
- ✅ All required certs tracked (SIM, First Aid, ALIN)
- ✅ Expiry alerts auto-triggered
- ✅ Trip blocked if cert expired
- ✅ Renewal workflow available
- ✅ Compliance reporting for admin

---

### **Module 3.2: Training Records & Competency Tracking**

**Purpose:** Track guide training attendance, competency assessments, ongoing development (ISO 9001 §8.4.3, ISO 45001 §5.4, CHSE requirement).

| Feature | Description | UI/UX Details | API Endpoint | Data Model | Status | Priority | Phase |
|---|---|---|---|---|---|---|---|
| **Training Catalog** | Admin create training: "SOP Update Meeting", "CHSE Awareness", "First Aid Refresher", "Panic Button Drill", etc | CRUD: Training name, type, description, date, attendees, trainer | `POST /api/v1/trainings`, `GET /api/v1/trainings` | `crew_trainings` table | ❌ Belum | P2 | Fase 2 |
| **Attendance Recording** | Admin marks attendance: "Guide A: Present (10:00-11:30)", "Guide B: Absent", "Guide C: Late" | Checklist view, edit dialog per guide | `PATCH /api/v1/trainings/:trainingId/attendance` | `training_attendance` table | ❌ Belum | P2 | Fase 2 |
| **Training Certificate** | Auto-generate attendance cert (PDF): "Guide X completed SOP Update Meeting on 15 Des 2025" | PDF download, embed logo Aero Travel | System generates PDF | `training_certificates` table | ❌ Belum | P2 | Fase 2 |
| **Competency Self-Assessment** | Post-training: guide rate own understanding (1-5 scale) + quiz (multiple choice, min pass 70%) | Quiz: 5-10 questions per training topic | `POST /api/v1/guide/:guideId/training-assessment` | `training_assessments` table | ❌ Belum | P3 | Fase 3 |
| **Trainer Feedback** | Trainer can rate guide performance: "Excellent", "Good", "Needs Improvement" | Radio buttons + free text comment field | `POST /api/v1/trainings/:trainingId/feedback/:guideId` | `training_feedback` table | ❌ Belum | P3 | Fase 3 |
| **Mandatory Training Schedule** | Admin set mandatory trainings (e.g., "CHSE Training yearly", "Panic Button Drill monthly"). Guide gets reminders. | Calendar view: "You must attend CHSE Training by 31 Des 2025" | System scheduler + notification | `mandatory_trainings` table | ❌ Belum | P2 | Fase 2 |
| **Training Compliance Report** | Dashboard: "Training Compliance" – which guides attended which trainings, due dates for next trainings | Table sortable by guide, training type, completion status | `GET /api/v1/reports/training-compliance` | Aggregate from `training_attendance` + `mandatory_trainings` | ❌ Belum | P2 | Fase 2 |
| **Guide Training History** | Guide app: "My Training" section showing all past trainings + upcoming mandatory trainings | Timeline view: date, training name, duration, trainer name, cert download button | `GET /api/v1/guide/:guideId/training-history` | `crew_trainings` join `training_attendance` | ❌ Belum | P2 | Fase 2 |

**Success Criteria:**
- ✅ All trainings tracked with attendance
- ✅ Certificates auto-generated
- ✅ Competency assessments conducted
- ✅ Mandatory training reminders
- ✅ Compliance reporting

---

## 📋 SECTION 4: PASSENGER SAFETY & DATA PROTECTION (CHSE, UU PDP, Asuransi)

### **Module 4.1: Safety Briefing & Consent Capture**

**Purpose:** Guide deliver safety briefing (auto-generated per passenger profile), capture passenger acknowledgment (ISO 21101 §6.2, CHSE requirement, UU PDP consent).

| Feature | Description | UI/UX Details | API Endpoint | Data Model | Status | Priority | Phase |
|---|---|---|---|---|---|---|---|
| **Auto-Generated Briefing** | System generate briefing points per trip profile: (e.g., "Ada 3 lansia → extra focus on mobility. Ada 2 bayi < 2 tahun → safety seat info. Cuaca kasar → brace for waves.") | Dynamic text based on manifest analysis | `GET /api/v1/trips/:tripId/safety-briefing-template` | Server-side template logic | ❌ Belum | P1 | Fase 2 |
| **Briefing Checklist** | Guide read aloud dan check off points: ☑️ Life jacket usage, ☑️ Emergency procedures, ☑️ Seasickness prevention, ☑️ Photo rules, ☑️ Toilet location | Accordion list, tap to expand each point | `PATCH /api/v1/trips/:tripId/safety-briefing` | `safety_briefings.briefing_items` JSON | ❌ Belum | P1 | Fase 2 |
| **Passenger Acknowledgment** | After briefing, guide show passenger digital waiver: "Saya telah menerima briefing keselamatan dan setuju mengikuti instruksi guide." | Passenger tap "Saya Setuju" → capture fingerprint (if device support) or tap confirm | `POST /api/v1/trips/:tripId/passenger-consent/:passengerId` | `passenger_consents` table | ❌ Belum | P1 | Fase 2 |
| **Consent Signature** | Passenger sign on tablet/phone screen (using Signature Pad library) | Signature canvas, upload as image | `POST /api/v1/trips/:tripId/passenger-consent/signature` | `passenger_consents.signature_url` | ❌ Belum | P1 | Fase 2 |
| **Language Options** | Briefing in multiple languages (ID default, EN, Mandarin, Japanese for tourists) | Language dropdown in briefing modal | `GET /api/v1/trips/:tripId/safety-briefing-template?lang=en` | Template with i18n keys | ❌ Belum | P2 | Fase 2 |
| **Briefing Completion Log** | Admin view: trip briefing status "Completed 09:15 by Guide X. 12 passengers consented. 0 declined." | Timeline: timestamp, guide name, % consented, any refusal notes | `GET /api/v1/trips/:tripId/briefing-log` | `safety_briefings` + `passenger_consents` | ❌ Belum | P1 | Fase 2 |
| **Video Briefing Option** | For tours with lots of intl tourists: play 2-min safety video (multilingual captions) + still require consent | Video player embedded, auto-play or manual play | `GET /api/v1/trips/:tripId/safety-video` | `safety_videos` table (URL) | ❌ Belum | P3 | Fase 3 |
| **Offline Briefing** | Briefing template cached in IndexedDB so guide can do briefing even if no signal | Sync consent when online | Service Worker caching | `safety_briefings` + `passenger_consents` local queue | ❌ Belum | P1 | Fase 2 |

**Success Criteria:**
- ✅ Auto-generated briefing per passenger profile
- ✅ Consent capture with signature
- ✅ Multi-language support
- ✅ Offline capability
- ✅ Audit trail: who consented when

---

### **Module 4.2: Digital Manifest & Passenger Data Protection (UU PDP)**

**Purpose:** Guide access passenger list (manifest), handle data securely, comply with UU PDP retention policy.

| Feature | Description | UI/UX Details | API Endpoint | Data Model | Status | Priority | Phase |
|---|---|---|---|---|---|---|---|
| **Manifest Download** | H-1 trip, guide download manifest (PDF) from app: passenger names, contact, emergency contact, dietary notes | One-tap download, cached in device | `GET /api/v1/trips/:tripId/manifest/pdf` | Generate from `bookings` + `passengers` + `emergency_contacts` | ✅ Partial | P0 | Fase 1 |
| **On-Device Manifest** | Manifest stored in IndexedDB (encrypted) for offline access. NOT synced to cloud while trip is active. | Only accessible via app, auto-delete after trip completion + 3 days | Service Worker + encryption | IndexedDB (encrypted) | ✅ Partial | P0 | Fase 1 |
| **Data Masking for Safety** | If guide/crew is also a passenger (family trip), their contact info is masked from other crew | Show: "Guide (Self)" without phone number | UI logic: hide own contact | Display rule | ❌ Belum | P2 | Fase 2 |
| **No Manual Copy** | Prevent guide from copy-paste manifest data (screenshot OK, copy-paste blocked) | CSS `user-select: none`, `pointer-events: none` on contact fields | Frontend CSS + monitor clipboard access | — | ❌ Belum | P2 | Fase 2 |
| **Auto-Deletion After Trip** | H+72 post-trip, manifest automatically deleted from device + cloud records (UU PDP retention) | Cron job: `DELETE FROM manifests WHERE trip_completed_date < NOW() - 3 days` | System automation | `manifests` table TTL | ❌ Belum | P1 | Fase 1 |
| **Audit Log of Access** | Log: "Guide X accessed manifest on 15 Des 2025 09:00. Viewed: 5 times. Downloaded: 1 time." | Admin can audit per trip | `GET /api/v1/audit/manifest-access?tripId=xxx` | `audit_logs` filtered for manifest access | ❌ Belum | P1 | Fase 2 |
| **Passenger Privacy Indicator** | Show privacy level: "You can see: Names, Emergency Contact. Hidden (for privacy): Phone numbers, Email, Allergies" | Info card at top of manifest | Display logic | — | ❌ Belum | P2 | Fase 2 |

**Success Criteria:**
- ✅ Manifest accessible offline
- ✅ Data protected (no copy-paste, auto-delete)
- ✅ Audit trail for access
- ✅ UU PDP retention compliant

---

## 📋 SECTION 5: ATTENDANCE & GEOFENCING (Operational Tracking)

### **Module 5.1: GPS Check-in & Geofencing**

**Purpose:** Auto-verify guide at right place at right time. Detect tardiness, absenteeism, unauthorized location changes (ISO 9001, operational control).

| Feature | Description | UI/UX Details | API Endpoint | Data Model | Status | Priority | Phase |
|---|---|---|---|---|---|---|---|
| **Morning Check-in** | Guide tap "Check-in" button saat arrive di meeting point (e.g., Dermaga Pahawang) | Location required: "Allow location access?" Modal appears | `POST /api/v1/trips/:tripId/check-in` | `trip_check_ins` table | ✅ Partial | P0 | Fase 1 |
| **Geofence Validation** | System verify: is guide within 100m radius of meeting point GPS? If NO, reject with "You're not at the correct location." | Calculate distance using haversine formula | Backend validation logic | — | ✅ Partial | P0 | Fase 1 |
| **On-Time Verification** | Guide H-30 meeting time: bonus if check-in. H-0 after meeting time: marked "Late" (dock incentive). H-15 after: escalate to admin warning. | Visual timer counting down, status change in real-time | Scheduler checks `check_ins` vs `trips.meeting_time` | `check_ins.status` = EARLY / ON_TIME / LATE | ✅ Partial | P0 | Fase 1 |
| **Absence Detection** | H+15 after meeting time, no check-in → auto mark "ABSENT" + notify admin | Admin gets notified via push + WA | Scheduler job | `check_ins.status` = ABSENT | ❌ Belum | P0 | Fase 1 |
| **Penalty Auto-Deduction** | Late: -Rp 50k. Absent: -Rp 200k. Deducted from gaji (SOP enforcement via system). | Show in gaji slip: "Attendance penalty: -Rp 50k (Late 20 Des)" | Payroll calculation logic | `payroll_deductions` table | ✅ Partial | P0 | Fase 1 |
| **Location History** | For full trip, stream GPS every 30 seconds → track guide movement (can detect if guide wander off-route) | Backend stores: `trips.gps_history` as JSONB array | `POST /api/v1/trips/:tripId/location` (background job) | `trip_gps_history` table | ✅ Partial | P0 | Fase 1 |
| **Trip Route Verification** | Show expected route on map (snorkeling spot A → spot B → lunch → spot C). Real-time guide position on route. | Polyline on map + current location marker | `GET /api/v1/trips/:tripId/expected-route` + real-time location | `trip_itineraries` + current location | ❌ Belum | P2 | Fase 1 |
| **Unauthorized Diversion Alert** | If guide deviates >500m from expected route for >5 mins, alert admin (potential problem) | Toast notification to admin: "Guide deviating from route near [location]" | Location monitoring logic | Audit event | ❌ Belum | P2 | Fase 2 |
| **Offline Check-in** | If offline at check-in time, queue GPS location, submit when online | Show: "⚠️ No signal. Check-in will sync when online." | Service Worker queue | Check-in record with sync flag | ✅ Partial | P0 | Fase 1 |

**Success Criteria:**
- ✅ GPS check-in with geofence validation
- ✅ Attendance tracking (on-time, late, absent)
- ✅ Auto-penalties applied
- ✅ Offline capability
- ✅ Route compliance monitoring

---

## 📋 SECTION 6: ENVIRONMENTAL & SUSTAINABILITY (ISO 14001, CHSE)

### **Module 6.1: Waste Tracking & Carbon Footprint**

**Purpose:** Log per-trip waste volume/type, track fuel usage for carbon calculation (ISO 14001 §8.1, CHSE environmental requirement).

| Feature | Description | UI/UX Details | API Endpoint | Data Model | Status | Priority | Phase |
|---|---|---|---|---|---|---|---|
| **Waste Categories** | At end of trip, guide log waste: Plastic (kg), Organic (kg), Glass (kg), Hazmat (kg) | Input fields with unit selector (kg / pieces) | `POST /api/v1/trips/:tripId/waste-log` | `waste_logs` table | ❌ Belum | P3 | Fase 3 |
| **Disposal Method** | Where was waste disposed? Dropdown: Landfill, Recycling, Incineration, Ocean (if accidental loss) | Single choice | `POST /api/v1/trips/:tripId/waste-log` | `waste_logs.disposal_method` enum | ❌ Belum | P3 | Fase 3 |
| **Photo Documentation** | Guide take photo of waste pile (for audit purpose) | Camera upload, optional | `POST /api/v1/trips/:tripId/waste-photos` | `waste_log_photos` table | ❌ Belum | P3 | Fase 3 |
| **Fuel Consumption Input** | Admin input fuel used per trip (from engine log): Liters. System auto-calculate CO2 emissions. | Input on trip completion form (Admin input, not guide) | `PATCH /api/v1/trips/:tripId/fuel-consumption` | `trip_fuel_logs` table | ❌ Belum | P3 | Fase 3 |
| **Carbon Footprint Report** | Dashboard: "Trip Carbon Footprint: 45 kg CO2 (based on 20L fuel consumption, distance 25 NM)" | Monthly aggregate: "Total carbon: 450 kg CO2 this month. Target: 400 kg." | `GET /api/v1/reports/carbon-footprint?month=12&year=2025` | Aggregate `trip_fuel_logs` with calculation | ❌ Belum | P3 | Fase 3 |
| **Sustainability Trend** | Chart: carbon emissions trend (monthly), waste volume trend, goal progress vs actual | Line chart + goal line | `GET /api/v1/dashboard/sustainability-trends` | Time-series data | ❌ Belum | P3 | Fase 3 |

**Success Criteria:**
- ✅ Waste logged per trip
- ✅ Fuel consumption tracked
- ✅ Carbon calculated automatically
- ✅ Monthly sustainability dashboard
- ✅ Trend reporting

---

## 📋 SECTION 7: OFFLINE-FIRST ARCHITECTURE (Critical for Field Ops)

### **Module 7.1: IndexedDB + Service Worker Sync**

**Purpose:** Guide app fully functional offline (no internet at sea). Sync queues when online. Critical for compliance & user experience.

| Feature | Description | Implementation | Status | Priority | Phase |
|---|---|---|---|---|---|
| **IndexedDB Schema** | Pre-load trip data (manifest, itinerary, briefing template, SOP docs) into IndexedDB on trip start | Indexed collections: `trips`, `passengers`, `safety_briefings`, `sop_documents`, `equipment_checklists` | ✅ Partial | P0 | Fase 1 |
| **Service Worker Registration** | Register SW on app load, intercept network requests, serve from cache if offline | Serwist library config in next.config.js | ✅ Partial | P0 | Fase 1 |
| **Offline Detection** | App detect network status: online → offline → online again. Show status banner: "🔴 Offline Mode" or "🟢 Connected" | `navigator.onLine` + `online` / `offline` event listeners | ✅ Partial | P0 | Fase 1 |
| **Mutation Queue (Local)** | All form submissions (check-in, briefing, incident) queue in IndexedDB when offline, auto-retry when online | TanStack Query: `useMutation` with `retry` logic + custom queue storage | ✅ Partial | P0 | Fase 1 |
| **Batch Sync on Reconnect** | When online detected, automatically sync all queued requests in order | Background sync using Service Worker `sync` event (if supported) or manual retry loop | ✅ Partial | P0 | Fase 1 |
| **Conflict Resolution** | If same field edited locally + remotely → use "last-write-wins" or prompt user | Show toast: "Data updated on server. Refresh to see latest." | ✅ Partial | P1 | Fase 1 |
| **Photo Upload Queue** | Large photo files (from equipment check, incident) queue locally, upload in background when online | Blob storage in IndexedDB, chunked upload | ❌ Belum | P1 | Fase 2 |
| **Data Freshness Indicator** | Show age of cached data: "Last synced: 2 minutes ago" or "Last synced: offline (will sync when online)" | Timestamp stored per data set | ❌ Belum | P2 | Fase 2 |
| **Cache Invalidation** | After successful sync, clear local copy to avoid stale data | Delete from IndexedDB after sync confirmed | ✅ Partial | P1 | Fase 1 |

**Success Criteria:**
- ✅ All critical features work offline
- ✅ Mutation queue + auto-sync
- ✅ No data loss on reconnect
- ✅ User aware of sync status

---

## 📊 SUMMARY TABLE: All Guide Features by Compliance Area

| Compliance Area | Modules | Total Features | Status | Phase | Priority |
|---|---|---|---|---|---|
| **Safety & Risk** | Pre-Trip Assessment, Safety Equipment | 12 | ❌ To Build | Fase 2 | P1 |
| **Emergency Response** | Panic Button, Incident Report | 15 | ❌ To Build | Fase 2 | P1 |
| **Crew Qualification** | Cert Tracker, Training Records | 10 | ❌ To Build | Fase 2 | P1-P2 |
| **Passenger Safety** | Briefing, Manifest, Data Protection | 8 | ❌ To Build | Fase 2 | P1 |
| **Operational** | Check-in, Geofencing | 8 | ✅ Partial | Fase 1 | P0 |
| **Environmental** | Waste, Carbon Tracking | 6 | ❌ To Build | Fase 3 | P3 |
| **Offline-First** | IndexedDB, Service Worker, Sync | 8 | ✅ Partial | Fase 1 | P0 |
| **TOTAL** | **7 major modules** | **67 features** | **32 exist, 35 to build** | **Fase 1-3** | **P0-P3** |

---

## 🚀 IMPLEMENTATION PRIORITY & ROADMAP

### **PHASE 1 (Bulan 1-2): Offline Foundation + Operational Tracking**
- ✅ Enhance IndexedDB schema (already partial)
- ✅ Enhance Service Worker (already partial)
- ✅ Enhance check-in logic (already partial)
- ✅ Manifest on-device (already partial)

**Effort:** 80 hours  
**Output:** Solid offline-first infrastructure

---

### **PHASE 2 (Bulan 3-4): Safety Compliance (CRITICAL)**
- ❌ Pre-Trip Risk Assessment (12 features)
- ❌ Safety Equipment Checklist (12 features)
- ❌ Panic Button / SOS (8 features)
- ❌ Incident Report Form (15 features)
- ❌ Crew Certification Tracker (10 features)
- ❌ Training Records (8 features)
- ❌ Safety Briefing + Consent (8 features)

**Total New Features:** 73  
**Effort:** 300+ hours  
**Output:** ISO 21101, ISO 45001, CHSE compliance-ready

---

### **PHASE 3 (Bulan 5-6): Environmental + Advanced**
- ❌ Waste Tracking (6 features)
- ❌ Advanced training analytics
- ❌ Guide performance scorecards

**Effort:** 80 hours  
**Output:** ISO 14001 readiness + advanced analytics

---

## 💰 ESTIMATED BUDGET (Guide App Development)

| Phase | Features | Dev Hours | Cost (@Rp 500k/hr) | Timeline |
|---|---|---|---|---|
| **Phase 1** | 0 (enhance existing) | 80 | Rp 40 juta | 2 weeks |
| **Phase 2** | 73 new | 300 | Rp 150 juta | 6 weeks |
| **Phase 3** | 6 new | 80 | Rp 40 juta | 2 weeks |
| **QA & Testing** | — | 100 | Rp 50 juta | Ongoing |
| **TOTAL** | 79 features | ~560 hours | **Rp 280 juta** | 10 weeks |

---

## ✅ SUCCESS CRITERIA (Guide App Compliance)

### **Pre-Launch (Phase 0)**
- ✅ Manifest accessible offline + auto-delete H+72
- ✅ Check-in with geofence working
- ✅ Offline mode fully functional

### **Post-Phase 2 (Compliance Ready)**
- ✅ Pre-trip risk assessment blocks unsafe trips
- ✅ Safety equipment checklist with photos
- ✅ Panic button real-time GPS streaming
- ✅ Incident report form ISO 21101 compliant
- ✅ Guide cert tracking + expiry blocks
- ✅ Safety briefing + passenger consent
- ✅ All forms work offline + sync online
- ✅ Audit trail 100% complete

### **Post-Phase 3 (Full Sustainability)**
- ✅ Waste tracking per trip
- ✅ Carbon footprint calculated
- ✅ Environmental dashboard live

---

**Document Status: READY FOR HANDOFF TO DEVELOPMENT TEAM** 🚀

**Next Step:** Create Jira/Asana tasks from this checklist, assign to dev team, track completion Fase by Fase.
