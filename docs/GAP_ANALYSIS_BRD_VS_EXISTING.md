# 🔍 Gap Analysis: BRD Features vs Existing Implementation

**Date:** 2025-01-23  
**Status:** ✅ Complete Analysis  
**Purpose:** Identifikasi gap antara fitur di BRD dengan fitur existing untuk menghindari duplikasi

---

## 📋 Executive Summary

Dari **14 fitur** di BRD (`feature-guide-app-improvement.md`), analisis menunjukkan:
- ✅ **3 fitur sudah ada** (perlu enhance)
- ⚠️ **6 fitur partial** (ada sebagian, perlu complete)
- ❌ **5 fitur belum ada** (perlu develop baru)

**Total yang perlu develop:** 11 fitur (3 enhance + 6 complete + 5 new)

---

## 📊 Feature-by-Feature Gap Analysis

### **TIER 1: COMPLIANCE MANDATORY (Fase 2)**

---

#### **Feature #1: Pre-Trip Safety Risk Check**

**BRD Requirement:**
- Checklist keselamatan (ombak, crew, equipment)
- Sistem hitung risk score otomatis
- Jika terlalu bahaya → **BLOCK trip**
- Admin bisa force-approve jika emergency

**Existing Implementation:**
- ✅ `app/api/guide/safety-checklist/route.ts` - API untuk save checklist
- ✅ `app/[locale]/(mobile)/guide/status/safety-checklist-dialog.tsx` - Dialog checklist
- ✅ Table: `safety_checklists` (ada di migration)

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Checklist items | ✅ Ada | - | Reuse |
| Save checklist | ✅ Ada | - | Reuse |
| **Risk score calculation** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Trip blocking logic** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| Admin override | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| Weather integration | ⚠️ Partial (ada weather API) | Need integration | Enhance |
| Offline support | ⚠️ Partial | Need IndexedDB | Enhance |

**Recommendation:**
- ✅ **Reuse:** Existing checklist dialog & API
- 🆕 **Develop:** Risk score calculation algorithm
- 🆕 **Develop:** Trip start validation (block jika risk tinggi)
- 🆕 **Develop:** Admin override API
- 🔧 **Enhance:** Integrate weather API untuk auto-fill ombak/angin
- 🔧 **Enhance:** Add offline support (IndexedDB)

**Estimated Effort:** 6-8 hours (enhance existing + add risk scoring)

---

#### **Feature #2: Safety Equipment Photo Checklist**

**BRD Requirement:**
- Foto equipment dengan GPS & timestamp
- Rate kondisi (OK/Rusak/Kurang)
- Tanda tangan = selesai
- Warn jika lifejacket < jumlah penumpang
- **Blocks trip start** jika equipment kurang

**Existing Implementation:**
- ✅ `app/api/guide/equipment/checklist/route.ts` - API untuk save checklist
- ✅ `app/[locale]/(mobile)/guide/trips/[slug]/equipment/equipment-checklist-client.tsx` - UI component
- ✅ Table: `guide_equipment_checklists` (ada di migration)
- ✅ Photo upload support (ada di component)
- ✅ Equipment reports untuk items needing repair

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Equipment checklist | ✅ Ada | - | Reuse |
| Photo upload | ✅ Ada | - | Reuse |
| Rate kondisi | ✅ Ada (`needs_repair`) | - | Reuse |
| **GPS & timestamp** | ❌ Tidak ada | **CRITICAL** | **Enhance** |
| **Tanda tangan** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Lifejacket validation** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Block trip start** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |

**Recommendation:**
- ✅ **Reuse:** Existing checklist component & API
- 🔧 **Enhance:** Add GPS & timestamp saat photo upload
- 🆕 **Develop:** Signature component (reuse dari Feature #5 jika sudah ada)
- 🆕 **Develop:** Lifejacket count validation (compare dengan passenger count)
- 🆕 **Develop:** Trip start blocking logic (integrate dengan Feature #1)

**Estimated Effort:** 4-6 hours (enhance existing + add validation)

---

#### **Feature #3: Incident & Accident Report Form**

**BRD Requirement:**
- Form multi-step dengan foto & tanda tangan
- Auto-generate nomor laporan (INC-20251219-001)
- Auto-kirim ke asuransi & admin
- Integrate dengan Feature #7 (voice transcription)

**Existing Implementation:**
- ✅ `app/api/guide/incidents/route.ts` - API untuk create incident
- ✅ `app/[locale]/(mobile)/guide/incidents/incident-form.tsx` - Form component
- ✅ `app/api/guide/incidents/ai-assist/route.ts` - AI assistant untuk generate report
- ✅ `lib/ai/incident-assistant.ts` - AI library
- ✅ Table: `incident_reports` (ada di migration)
- ✅ Photo upload support
- ✅ AI report generation

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Incident form | ✅ Ada | - | Reuse |
| Photo upload | ✅ Ada | - | Reuse |
| AI report generation | ✅ Ada | - | Reuse |
| **Tanda tangan digital** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Auto-generate nomor laporan** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Auto-notify asuransi** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Voice transcription** | ⚠️ Partial (ada voice-assistant.ts) | Need UI integration | Enhance |

**Recommendation:**
- ✅ **Reuse:** Existing incident form & API
- 🆕 **Develop:** Signature component (reuse untuk Feature #5 juga)
- 🆕 **Develop:** Auto-generate report number (INC-YYYYMMDD-XXX format)
- 🆕 **Develop:** Auto-notify asuransi (email/WhatsApp integration)
- 🔧 **Enhance:** Integrate voice transcription UI ke incident form

**Estimated Effort:** 4-6 hours (add signature + notifications)

---

#### **Feature #4: Guide Certification Tracker**

**BRD Requirement:**
- Track sertifikat: SIM Kapal, First Aid, ALIN
- Auto-alert H-30 sebelum expired
- Jika expired → **trip start button disabled**
- Guide upload sertifikat baru → Admin approve

**Existing Implementation:**
- ✅ `app/api/guide/license/eligibility/route.ts` - License eligibility check
- ✅ `app/api/guide/license/apply/route.ts` - License application
- ✅ Table: `guide_license_applications` - Untuk Guide License (ATGL)
- ✅ Table: `guide_certifications` - Untuk training certificates (link ke training modules)
- ⚠️ **Note:** License system berbeda dengan Certification tracker

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Certification tracking | ⚠️ Partial (ada untuk training) | **Different scope** | **Develop baru** |
| SIM Kapal tracking | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| First Aid tracking | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| ALIN tracking | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| H-30 reminder | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| Expiry blocking | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| Photo upload | ✅ Ada (di documents) | - | Reuse |
| Admin approval | ⚠️ Partial (ada di license) | Need workflow | Enhance |

**Recommendation:**
- 🆕 **Develop:** New table `crew_certifications` (SIM, First Aid, ALIN)
- 🆕 **Develop:** Certification upload & approval workflow
- 🆕 **Develop:** H-30 reminder scheduler (Supabase pgcron)
- 🆕 **Develop:** Trip start validation (check certifications)
- ✅ **Reuse:** Photo upload mechanism dari documents
- ✅ **Reuse:** Notification system untuk reminders

**Estimated Effort:** 8-10 hours (new feature, tapi bisa reuse banyak components)

---

#### **Feature #5: Safety Briefing & Passenger Consent**

**BRD Requirement:**
- Auto-generate briefing points (lansia, bayi, cuaca)
- Guide baca satu-satu, check off
- **Tamu tanda tangan digital**
- Blocks trip start until all passengers consent

**Existing Implementation:**
- ✅ `app/api/guide/trips/[id]/briefing/route.ts` - Briefing generation API
- ✅ `lib/ai/briefing-generator.ts` - AI briefing generator
- ✅ `app/[locale]/(mobile)/guide/trips/[slug]/trip-detail-client.tsx` - Briefing display
- ✅ Auto-generate briefing points (ada AI integration)
- ✅ Briefing points adjust per profil (lansia, bayi, cuaca)

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Briefing generation | ✅ Ada | - | Reuse |
| Auto-adjust per profil | ✅ Ada | - | Reuse |
| Guide check off points | ⚠️ Partial | Need tracking | Enhance |
| **Passenger consent** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Digital signature** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Block trip start** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |

**Recommendation:**
- ✅ **Reuse:** Existing briefing generation
- 🆕 **Develop:** New tables `safety_briefings`, `passenger_consents`
- 🆕 **Develop:** Signature component (reuse untuk Feature #3 juga)
- 🆕 **Develop:** Passenger consent tracking per trip
- 🆕 **Develop:** Trip start validation (check all consents)
- 🔧 **Enhance:** Add briefing completion tracking

**Estimated Effort:** 6-8 hours (new consent system, tapi reuse briefing)

---

#### **Feature #6: Training Records & Certificates**

**BRD Requirement:**
- Admin create training session
- Admin mark attendance
- Auto-generate PDF certificate
- Guide mandatory answer quiz (min 70%)
- Guide download certificate

**Existing Implementation:**
- ✅ `app/api/guide/training/modules/route.ts` - Training modules API
- ✅ Table: `guide_training_modules` - Training modules
- ✅ Table: `guide_training_progress` - Progress tracking
- ✅ Table: `guide_training_quizzes` - Quiz questions
- ✅ Table: `guide_training_quiz_attempts` - Quiz attempts
- ✅ Table: `guide_certifications` - Certificates (link ke modules)
- ✅ Quiz system dengan scoring (min 70% pass)

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Training modules | ✅ Ada | - | Reuse |
| Quiz system | ✅ Ada | - | Reuse |
| Certificate tracking | ✅ Ada | - | Reuse |
| **Admin create training session** | ⚠️ Partial (ada POST API) | Need UI | Enhance |
| **Admin mark attendance** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **PDF certificate generation** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Training history page** | ⚠️ Partial (ada di training page) | Need enhance | Enhance |

**Recommendation:**
- ✅ **Reuse:** Existing training modules, quiz, certificates tables
- 🆕 **Develop:** Admin attendance marking (new table `training_attendance`)
- 🆕 **Develop:** PDF certificate generation (use `@react-pdf/renderer` atau jsPDF)
- 🔧 **Enhance:** Training history page dengan certificate download
- 🔧 **Enhance:** Admin training session creation UI

**Estimated Effort:** 6-8 hours (add attendance + PDF generation)

---

#### **Feature #7: Voice-to-Text Report (AI)**

**BRD Requirement:**
- Record audio report
- AI transcribe otomatis
- Auto-fill form fields
- Review & edit transcript

**Existing Implementation:**
- ✅ `lib/ai/voice-assistant.ts` - Voice assistant library
- ✅ `app/api/guide/voice/command/route.ts` - Voice command API
- ✅ `lib/ai/incident-assistant.ts` - Extract info from voice (ada `extractIncidentInfoFromVoice()`)
- ⚠️ **Note:** Voice command untuk commands, bukan transcription

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Voice recording | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Audio transcription** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| Auto-fill form | ⚠️ Partial (ada extractIncidentInfoFromVoice) | Need UI integration | Enhance |
| Review & edit | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| Offline support | ❌ Tidak ada | **CRITICAL** | **Develop baru** |

**Recommendation:**
- 🆕 **Develop:** Voice recording UI component (MediaRecorder API)
- 🆕 **Develop:** Transcription service (Whisper API atau Google Speech-to-Text)
- 🆕 **Develop:** Transcript review & edit UI
- 🔧 **Enhance:** Integrate dengan incident form (auto-fill)
- 🆕 **Develop:** Offline audio storage (IndexedDB)
- 🆕 **Develop:** New table `incident_voice_logs`

**Estimated Effort:** 8-10 hours (new feature, perlu transcription service)

---

### **TIER 2: OPERATIONAL CRITICAL (Fase 2)**

---

#### **Feature #8: Logistics Handover (Serah-Terima Barang)**

**BRD Requirement:**
- Track stok dari gudang ke guide
- QR code scanning
- Warehouse & guide verify jumlah
- Foto stok + tanda tangan both parties
- Return barang saat trip selesai
- Auto-flag variance > 10%

**Existing Implementation:**
- ✅ `inventory` table - Inventory items (ada di ops system)
- ✅ `inventory_transactions` table - Transaction tracking
- ✅ Inventory system di ops console
- ⚠️ **Note:** Inventory system ada, tapi belum ada handover workflow untuk guide

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Inventory tracking | ✅ Ada (ops) | - | Reuse |
| **Handover workflow** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **QR code scanning** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Guide receive/return** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Photo + signature** | ⚠️ Partial (ada photo) | Need signature | Enhance |
| **Variance detection** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |

**Recommendation:**
- ✅ **Reuse:** Existing inventory tables
- 🆕 **Develop:** New tables `inventory_handovers`, `inventory_audit`
- 🆕 **Develop:** QR scanner component (camera integration)
- 🆕 **Develop:** Handover workflow (warehouse → guide → return)
- 🆕 **Develop:** Variance calculation & flagging
- ✅ **Reuse:** Signature component (dari Feature #5)
- ✅ **Reuse:** Photo upload mechanism

**Estimated Effort:** 10-12 hours (new workflow, tapi reuse inventory)

---

#### **Feature #9: Multi-Role Crew Management**

**BRD Requirement:**
- Role-based access (Lead Guide vs Support Guide)
- Lead guide: full manifest access
- Support guide: masked contact info
- Payment split: 60% lead, 40% support

**Existing Implementation:**
- ✅ `trip_crews` table - Multi-guide assignments
- ✅ `app/api/guide/crew/trip/[tripId]/route.ts` - Trip crew API
- ✅ `hooks/use-trip-crew.ts` - Hook untuk get crew role
- ✅ `lib/guide/crew-permissions.ts` - Permission matrix
- ✅ `app/[locale]/(mobile)/guide/trips/[slug]/crew-section.tsx` - Crew section
- ✅ Contact masking untuk Support Guide (ada di manifest)
- ✅ Role-based permissions (Lead vs Support)

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Multi-guide system | ✅ Ada | - | Reuse |
| Role assignment | ✅ Ada | - | Reuse |
| Permission matrix | ✅ Ada | - | Reuse |
| Contact masking | ✅ Ada | - | Reuse |
| **Payment split** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Task assignment** | ⚠️ Partial (ada crew notes) | Need enhance | Enhance |

**Recommendation:**
- ✅ **Reuse:** Existing multi-guide system, permissions, masking
- 🆕 **Develop:** Payment split calculation (60/40)
- 🆕 **Develop:** Payment split tracking (new column di `trip_crews` atau separate table)
- 🔧 **Enhance:** Task assignment UI (Lead Guide assign ke Support)

**Estimated Effort:** 4-6 hours (mostly done, add payment split)

---

#### **Feature #10: Crew Directory & Quick Contact**

**BRD Requirement:**
- Nearby crew dalam radius 10km
- Map display
- Quick contact (WA/call)
- Auto-notify nearby crew jika SOS triggered

**Existing Implementation:**
- ✅ `app/api/guide/crew/directory/route.ts` - Directory API
- ✅ `app/api/guide/crew/directory/nearby/route.ts` - Nearby crew API
- ✅ `app/[locale]/(mobile)/guide/crew/directory/crew-directory-client.tsx` - Directory UI
- ✅ `app/api/guide/crew/contact/[guideId]/route.ts` - Contact API
- ✅ Distance calculation (Haversine formula)
- ✅ Nearby search dengan radius

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Crew directory | ✅ Ada | - | Reuse |
| Nearby search | ✅ Ada | - | Reuse |
| Distance calculation | ✅ Ada | - | Reuse |
| **Map display** | ⚠️ Partial (ada map component) | Need integrate | Enhance |
| **Quick contact (WA)** | ⚠️ Partial (ada contact API) | Need UI | Enhance |
| **SOS auto-notify** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |

**Recommendation:**
- ✅ **Reuse:** Existing directory, nearby API, distance calculation
- 🔧 **Enhance:** Map display dengan nearby crew markers
- 🔧 **Enhance:** Quick contact UI (WA/call buttons)
- 🆕 **Develop:** SOS auto-notify nearby crew (integrate dengan SOS feature)

**Estimated Effort:** 4-6 hours (mostly done, add map + SOS integration)

---

#### **Feature #11: Offline Marine Map**

**BRD Requirement:**
- Map khusus laut dengan danger zones
- Signal hotspots
- Download region untuk offline
- Trip route overlay
- Real-time position tracking
- Breadcrumb trail

**Existing Implementation:**
- ✅ `app/[locale]/(mobile)/guide/locations/offline-map-client.tsx` - Offline map component
- ✅ `lib/utils/maps.ts` - Map utilities
- ✅ `components/map/dynamic-map.tsx` - Map component
- ✅ Location caching (IndexedDB)
- ⚠️ **Note:** Basic offline map, belum ada danger zones & signal hotspots

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Offline map | ⚠️ Basic | Need enhance | Enhance |
| Location caching | ✅ Ada | - | Reuse |
| **Danger zones** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Signal hotspots** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Region download** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Route overlay** | ⚠️ Partial (ada itinerary) | Need enhance | Enhance |
| **Position tracking** | ✅ Ada (live_tracking) | - | Reuse |
| **Breadcrumb trail** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |

**Recommendation:**
- ✅ **Reuse:** Existing map component, location caching
- 🆕 **Develop:** New tables `danger_zones`, `signal_hotspots` (GeoJSON)
- 🆕 **Develop:** Region download system (tile caching)
- 🆕 **Develop:** Danger zones & hotspots display
- 🔧 **Enhance:** Route overlay dari itinerary
- 🆕 **Develop:** Breadcrumb trail tracking

**Estimated Effort:** 12-16 hours (significant enhancement, new features)

---

### **TIER 3: EXPERIENCE (Fase 3)**

---

#### **Feature #12: Digital Tipping (QRIS Payment)**

**BRD Requirement:**
- QRIS code per guide
- Tamu scan & bayar via Midtrans
- Wallet balance auto-update
- Withdraw bareng gaji

**Existing Implementation:**
- ✅ Wallet system (`guide_wallets`, `guide_wallet_transactions`)
- ✅ Midtrans integration (ada di project)
- ❌ **Note:** Belum ada tipping feature

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Wallet system | ✅ Ada | - | Reuse |
| Midtrans integration | ✅ Ada | - | Reuse |
| **QRIS generation** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Tip transactions** | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| **Webhook handling** | ⚠️ Partial (ada Midtrans webhook) | Need enhance | Enhance |
| **Notification** | ✅ Ada (push notification) | - | Reuse |

**Recommendation:**
- ✅ **Reuse:** Existing wallet system, Midtrans integration
- 🆕 **Develop:** New tables `guide_tip_wallets`, `tip_transactions`
- 🆕 **Develop:** QRIS generation (Midtrans Snap API)
- 🆕 **Develop:** Tip webhook handler
- 🔧 **Enhance:** Wallet balance update saat tip received
- ✅ **Reuse:** Notification system

**Estimated Effort:** 8-10 hours (new feature, tapi reuse wallet)

---

#### **Feature #13: Guest Engagement Kit**

**BRD Requirement:**
- Interactive quiz
- Games
- Music (Spotify deep-link)
- Photo challenge
- Leaderboard
- Score tracking

**Existing Implementation:**
- ❌ **Note:** Belum ada guest engagement features

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Quiz system | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| Games | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| Music integration | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| Photo challenge | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| Leaderboard | ⚠️ Partial (ada di challenges) | Need enhance | Enhance |
| Score tracking | ❌ Tidak ada | **CRITICAL** | **Develop baru** |

**Recommendation:**
- 🆕 **Develop:** New tables `quiz_questions`, `guest_engagement_scores`
- 🆕 **Develop:** Quiz UI component
- 🆕 **Develop:** Games module (simple games)
- 🆕 **Develop:** Spotify deep-link integration
- 🆕 **Develop:** Photo challenge system
- 🔧 **Enhance:** Leaderboard (reuse dari challenges)
- ✅ **Reuse:** Photo upload mechanism

**Estimated Effort:** 12-16 hours (new feature, multiple components)

---

#### **Feature #14: Smart Watch Companion App**

**BRD Requirement:**
- Lightweight app untuk Apple Watch / Galaxy Watch
- SOS button
- Heart rate monitor
- Quick check-in
- Status badge

**Existing Implementation:**
- ❌ **Note:** Belum ada smartwatch support

**Gap Analysis:**
| Requirement | Existing | Gap | Action |
|------------|----------|-----|--------|
| Smartwatch app | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| SOS button | ✅ Ada (di phone app) | Need port | Port |
| Heart rate monitor | ❌ Tidak ada | **CRITICAL** | **Develop baru** |
| Quick check-in | ✅ Ada (di phone app) | Need port | Port |
| Status badge | ❌ Tidak ada | **CRITICAL** | **Develop baru** |

**Recommendation:**
- 🆕 **Develop:** Architecture decision (native vs PWA)
- 🆕 **Develop:** WatchKit app (iOS) atau Wear OS app (Android)
- 🆕 **Develop:** Heart rate API integration (HealthKit / Health Connect)
- 🔧 **Port:** SOS & check-in features ke watch
- 🆕 **Develop:** Status badge display

**Estimated Effort:** 20-30 hours (separate native app development)

---

## 📊 Summary Table

| Feature | Status | Gap Level | Effort | Priority |
|---------|--------|-----------|--------|----------|
| #1: Pre-Trip Risk Check | ⚠️ Partial | Medium | 6-8h | P1 |
| #2: Equipment Checklist | ⚠️ Partial | Medium | 4-6h | P1 |
| #3: Incident Report | ⚠️ Partial | Low | 4-6h | P1 |
| #4: Certification Tracker | ❌ New | High | 8-10h | P1 |
| #5: Safety Briefing & Consent | ⚠️ Partial | Medium | 6-8h | P1 |
| #6: Training Records | ⚠️ Partial | Medium | 6-8h | P1 |
| #7: Voice-to-Text | ⚠️ Partial | High | 8-10h | P1 |
| #8: Logistics Handover | ❌ New | High | 10-12h | P2 |
| #9: Multi-Role Crew | ✅ Mostly Done | Low | 4-6h | P2 |
| #10: Crew Directory | ✅ Mostly Done | Low | 4-6h | P2 |
| #11: Offline Marine Map | ⚠️ Partial | High | 12-16h | P2 |
| #12: Digital Tipping | ❌ New | Medium | 8-10h | P3 |
| #13: Guest Engagement | ❌ New | High | 12-16h | P3 |
| #14: Smart Watch | ❌ New | Very High | 20-30h | P3 |

**Total Estimated Effort:**
- **P1 (Fase 2):** ~50-60 hours
- **P2 (Fase 2):** ~30-40 hours
- **P3 (Fase 3):** ~40-56 hours
- **Total:** ~120-156 hours (vs BRD estimate 515 hours)

**Note:** Effort lebih rendah karena banyak reuse existing components!

---

## ✅ Reusable Components & Infrastructure

### **Components yang bisa reuse:**
1. ✅ Photo upload mechanism
2. ✅ GPS/location tracking
3. ✅ Offline sync (IndexedDB, mutation queue)
4. ✅ Weather API integration
5. ✅ Notification system
6. ✅ Map components
7. ✅ Crew permissions system
8. ✅ Wallet system
9. ✅ Training modules system
10. ✅ Quiz system

### **Infrastructure yang bisa reuse:**
1. ✅ Error handling (`withErrorHandler`)
2. ✅ Logging (`logger`)
3. ✅ Branch injection
4. ✅ RLS policies pattern
5. ✅ Query keys factory
6. ✅ State management (TanStack Query + Zustand)

---

## 🎯 Development Strategy

### **Phase 1: Enhance Existing (Week 1-2)**
1. Feature #1: Add risk scoring & trip blocking
2. Feature #2: Add GPS timestamp & signature
3. Feature #3: Add signature & auto-notify
4. Feature #9: Add payment split
5. Feature #10: Add map display & SOS integration

### **Phase 2: Complete Partial (Week 3-4)**
1. Feature #5: Add passenger consent system
2. Feature #6: Add attendance marking & PDF generation
3. Feature #7: Add voice recording UI & transcription
4. Feature #11: Add danger zones & region download

### **Phase 3: New Features (Week 5-6)**
1. Feature #4: Certification tracker (new)
2. Feature #8: Logistics handover (new)
3. Feature #12: Digital tipping (new)
4. Feature #13: Guest engagement (new)
5. Feature #14: Smart watch (new - optional untuk later)

---

## ⚠️ Critical Dependencies

1. **Signature Component** → Reuse untuk Feature #2, #3, #5, #8
2. **Risk Scoring** → Feature #1 harus selesai sebelum Feature #2 (equipment blocking)
3. **Certification Tracker** → Feature #4 harus selesai sebelum Feature #1 (trip blocking)
4. **Voice Transcription** → Feature #7 integrate dengan Feature #3 (incident form)
5. **Multi-Role Crew** → Feature #9 harus selesai sebelum Feature #10 (crew directory)

---

## 📝 Next Steps

1. ✅ **Review gap analysis** dengan tech lead
2. ✅ **Prioritize features** berdasarkan dependencies
3. ✅ **Create detailed tickets** untuk setiap feature
4. ✅ **Start development** dengan Phase 1 (enhance existing)
5. ✅ **Reuse components** sebanyak mungkin untuk efficiency

---

**Status:** ✅ Gap Analysis Complete  
**Ready for:** Development Planning & Ticket Creation
