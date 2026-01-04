# Multi-Guide Operations & Crew Directory - Implementation Complete

**Date:** 2025-01-23  
**Status:** ✅ **IMPLEMENTATION COMPLETE**

---

## 📋 Executive Summary

Fitur **Multi-Guide Operations** dan **Crew Directory** telah berhasil diimplementasikan sesuai PRD. Fitur ini memungkinkan:
- 1 Trip dapat memiliki >1 guide dengan struktur komando jelas (Lead vs Support)
- Crew Directory internal untuk koordinasi dan pencarian guide
- Permission matrix yang jelas berdasarkan role
- Offline-first support dengan mutation queue

---

## ✅ Implementation Checklist

### 1. Database Migration ✅
- **File:** `supabase/migrations/20250123000001_044-multi-guide-crew-directory.sql`
- **Tables Created:**
  - `trip_crews` - Crew assignments dengan role (lead/support)
  - `crew_profiles_public_internal` - Public profile untuk directory
  - `crew_notes` - Internal crew notes untuk koordinasi
  - `crew_audit_logs` - Audit log untuk security
- **Functions:**
  - `update_crew_profile_availability()` - Auto-update availability dari guide_status
  - `sync_crew_profile_from_user()` - Auto-sync profile dari users table
  - `log_crew_audit()` - Log audit actions
- **RLS Policies:** ✅ Complete dengan branch isolation

### 2. API Routes ✅

#### Crew Operations
- `GET /api/guide/crew/trip/[tripId]` - Get crew members
- `POST /api/guide/crew/trip/[tripId]` - Assign crew (Admin only)
- `PUT /api/guide/crew/trip/[tripId]` - Update crew role/status
- `DELETE /api/guide/crew/trip/[tripId]` - Remove crew (Admin only)
- `POST /api/admin/guide/crew/trip/[tripId]/assign` - Bulk assign (Admin)

#### Crew Directory
- `GET /api/guide/crew/directory` - Search & filter directory
- `GET /api/guide/crew/directory/nearby` - Nearby on-duty crew
- `POST /api/guide/crew/contact/[guideId]` - Get contact info (masked)

#### Crew Notes
- `GET /api/guide/crew/notes/[tripId]` - Get crew notes
- `POST /api/guide/crew/notes/[tripId]` - Create crew note

#### Trip Control (Lead Guide only)
- `POST /api/guide/trips/[id]/start` - Start trip
- `POST /api/guide/trips/[id]/end` - End trip

### 3. Client Components ✅

#### Crew Directory
- **Page:** `app/[locale]/(mobile)/guide/crew/directory/page.tsx`
- **Component:** `crew-directory-client.tsx`
- **Features:**
  - Search by name
  - Filter by availability, skill
  - "My Trip Crew" section
  - "All Directory" section
  - Contact action (masked phone)

#### Crew Management
- **Component:** `app/[locale]/(mobile)/guide/trips/[slug]/crew-section.tsx`
- **Features:**
  - Display crew members (Lead + Support)
  - Assign crew (Admin only)
  - Confirm assignment
  - Role badges

#### Crew Notes
- **Component:** `app/[locale]/(mobile)/guide/trips/[slug]/crew-notes-section.tsx`
- **Features:**
  - Create notes (general, task, safety, coordination)
  - View notes timeline
  - Thread support (parent_note_id)

### 4. Permission System ✅

#### Permission Utilities
- **File:** `lib/guide/crew-permissions.ts`
- **Functions:**
  - `hasPermission(role, permission)` - Check permission
  - `canStartEndTrip(role)` - Lead Guide only
  - `canViewManifest(role)` - Returns {canView, isMasked}
  - `canUploadEvidence(role)` - Both can upload
  - `canTriggerSOS(role)` - Both can trigger
  - `canSubmitIncidentReport(role)` - Lead can submit, Support can draft

#### Permission Matrix Implementation

| Area | Lead Guide | Support Guide | Implementation |
|---|---:|---:|---|
| Start/End Trip | ✅ | ❌ | `POST /api/guide/trips/[id]/start|end` checks role |
| Manifest view | Full | Masked | `canViewManifest()` returns isMasked flag |
| Upload evidence | ✅ | ✅ | Both can upload |
| SOS trigger | ✅ | ✅ | Both can trigger |
| Incident report | Submit | Draft only | `canSubmitIncidentReport()` |
| Check-in attendance | ✅ | ✅ | Both can check-in |
| Crew notes | ✅ | ✅ | Both can create notes |

### 5. Manifest Masking ✅

**Implementation:**
- Support Guide melihat nama & phone yang dimask
- Masking functions: `maskPassengerName()`, `maskPhone()`
- Visual indicator: "Data dimask untuk Support Guide"
- Lead Guide melihat data full

**Masking Rules:**
- Name: First letter + masked middle + last letter (e.g., "J***n")
- Phone: Last 4 digits only (e.g., "****1234")

### 6. Query Keys ✅

**Added to `lib/queries/query-keys.ts`:**
```typescript
guide: {
  crew: {
    all: () => [...queryKeys.guide.all, 'crew'] as const,
    tripCrew: (tripId: string) => [...queryKeys.guide.crew.all(), 'trip', tripId] as const,
    myCrew: () => [...queryKeys.guide.crew.all(), 'my-crew'] as const,
    directory: {
      all: () => [...queryKeys.guide.crew.all(), 'directory'] as const,
      search: (filters?) => [...queryKeys.guide.crew.directory.all(), 'search', filters] as const,
      nearby: (lat?, lng?) => [...queryKeys.guide.crew.directory.all(), 'nearby', lat, lng] as const,
    },
    notes: {
      all: () => [...queryKeys.guide.crew.all(), 'notes'] as const,
      trip: (tripId: string) => [...queryKeys.guide.crew.notes.all(), 'trip', tripId] as const,
    },
  },
}
```

### 7. Hooks ✅

**File:** `hooks/use-trip-crew.ts`
- `useTripCrew(tripId)` - Get crew role and permissions for trip

---

## 🔐 Security Implementation

### RLS Policies

**1. trip_crews**
- Guides can view crews for their assigned trips
- Ops/Admin can manage all assignments
- Branch isolation enforced

**2. crew_profiles_public_internal**
- All guides can view other guides' profiles (internal directory)
- Guides can update their own profile
- Ops/Admin can update all profiles
- Branch isolation

**3. crew_notes**
- Crew members can view/create notes for assigned trips
- Crew members can update their own notes
- Ops/Admin can update all notes
- Branch isolation

**4. crew_audit_logs**
- Ops/Admin can view all logs
- Guides can view their own logs
- Branch isolation

### Audit Logging

All sensitive actions are logged:
- `assign` - Crew assignment
- `unassign` - Crew removal
- `role_change` - Role changes
- `status_change` - Status updates
- `contact_action` - Contact access
- `unmask_access` - Unmask actions (future)

---

## 📱 UI/UX Features

### Crew Directory Page
- **Route:** `/guide/crew/directory`
- **Features:**
  - Search bar
  - Availability filter
  - Skill filter
  - "My Trip Crew" section (top)
  - "All Directory" section
  - Contact button (masked)
  - Availability status indicator
  - Badges & skills display

### Trip Detail - Crew Section
- **Location:** Trip detail page
- **Features:**
  - Lead Guide badge dengan Crown icon
  - Support Guides list
  - Assign button (Admin only)
  - Confirm assignment button
  - Role indicators

### Trip Detail - Crew Notes
- **Location:** Trip detail page
- **Features:**
  - Create note form
  - Note type selector (general, task, safety, coordination)
  - Notes timeline
  - Creator avatar & name
  - Timestamp

### Trip Control (Lead Guide)
- **Location:** Trip detail page
- **Features:**
  - "Start Trip" button (Lead Guide only)
  - "End Trip" button (Lead Guide only)
  - Visual indicator untuk Lead Guide section

---

## 🔄 Integration Points

### 1. Trip Assignment Flow

**Legacy (trip_guides):**
- Existing flow tetap berjalan
- Backward compatible

**New (trip_crews):**
- Admin assigns via `/api/admin/guide/crew/trip/[tripId]/assign`
- Guide confirms via `/api/guide/crew/trip/[tripId]` PUT
- Status: `assigned` → `confirmed`

### 2. Trip List Integration

**Updated:** `app/[locale]/(mobile)/guide/trips/[slug]/page.tsx`
- Checks both `trip_crews` and `trip_guides` for access
- Supports both legacy and new system

### 3. Manifest Integration

**Updated:** `manifest-client.tsx`
- Accepts `crewRole` prop
- Applies masking jika `crewRole === 'support'`
- Shows masking indicator

### 4. Attendance Integration

**Status:** ✅ Already supports multiple guides
- Each guide can check-in independently
- No changes needed

---

## 📊 Data Model

### trip_crews Table
```sql
- id (UUID)
- trip_id (UUID) → trips
- guide_id (UUID) → users
- branch_id (UUID) → branches
- role ('lead' | 'support')
- status ('assigned' | 'confirmed' | 'cancelled' | 'rejected')
- assigned_at (TIMESTAMPTZ)
- assigned_by (UUID) → users (Admin)
- confirmed_at (TIMESTAMPTZ)
- assignment_notes (TEXT)
```

### crew_profiles_public_internal Table
```sql
- user_id (UUID) → users (PK)
- branch_id (UUID) → branches
- display_name (VARCHAR)
- photo_url (TEXT)
- badges (JSONB)
- skills (JSONB)
- current_availability ('available' | 'on_duty' | 'on_trip' | 'not_available' | 'unknown')
- last_status_update (TIMESTAMPTZ)
- contact_enabled (BOOLEAN)
- is_active (BOOLEAN)
```

### crew_notes Table
```sql
- id (UUID)
- trip_id (UUID) → trips
- created_by (UUID) → users
- branch_id (UUID) → branches
- message (TEXT)
- note_type ('general' | 'task' | 'safety' | 'coordination')
- parent_note_id (UUID) → crew_notes (optional, for threading)
- is_internal (BOOLEAN)
```

### crew_audit_logs Table
```sql
- id (UUID)
- trip_id (UUID) → trips
- guide_id (UUID) → users
- branch_id (UUID) → branches
- action_type (VARCHAR)
- action_details (JSONB)
- performed_by (UUID) → users
- performed_at (TIMESTAMPTZ)
- ip_address (INET)
- user_agent (TEXT)
```

---

## 🚀 Usage Examples

### Admin Assigns Crew
```typescript
// POST /api/admin/guide/crew/trip/[tripId]/assign
{
  guide_ids: ["guide-id-1", "guide-id-2"],
  roles: ["lead", "support"], // Optional: defaults to first=lead, rest=support
  assignment_notes: "Large group, need support"
}
```

### Guide Confirms Assignment
```typescript
// PUT /api/guide/crew/trip/[tripId]
{
  crew_id: "crew-assignment-id",
  status: "confirmed"
}
```

### Search Crew Directory
```typescript
// GET /api/guide/crew/directory?search=john&availability=available&skill=English
// Returns: { myCrew: [...], directory: [...], total: 10 }
```

### Get Nearby On-Duty Crew
```typescript
// GET /api/guide/crew/directory/nearby?lat=-8.1319&lng=114.3656&radius=5000
// Returns: { nearby: [...], center: {lat, lng}, radius: 5000 }
```

### Create Crew Note
```typescript
// POST /api/guide/crew/notes/[tripId]
{
  message: "Meeting point changed to Dermaga Ketapang",
  note_type: "coordination"
}
```

---

## 🔍 Testing Checklist

### Manual Testing
- [ ] Admin dapat assign multiple guides ke 1 trip
- [ ] Lead Guide dapat start/end trip
- [ ] Support Guide tidak dapat start/end trip
- [ ] Support Guide melihat manifest dengan masking
- [ ] Lead Guide melihat manifest tanpa masking
- [ ] Crew directory search & filter bekerja
- [ ] Nearby on-duty crew menampilkan guide terdekat
- [ ] Contact action tidak expose raw phone number
- [ ] Crew notes dapat dibuat dan dilihat oleh semua crew
- [ ] RLS policies mencegah cross-branch access
- [ ] Audit logs tercatat dengan benar

### Integration Testing
- [ ] Trip list menampilkan trip dengan multi-guide
- [ ] Trip detail menampilkan crew section
- [ ] Manifest masking bekerja sesuai role
- [ ] Attendance tetap bekerja untuk semua crew
- [ ] Offline sync untuk crew operations

---

## 📝 Next Steps (Future Enhancements)

### Phase 2 Features
1. **Guide Search in Assign Dialog**
   - Integrate crew directory search ke assign dialog
   - Auto-complete guide selection

2. **Unmask Audit**
   - Track ketika Support Guide request unmask access
   - Admin approval untuk unmask

3. **Crew Performance Metrics**
   - Track performance per crew member
   - Team performance metrics

4. **Advanced Crew Notes**
   - Rich text support
   - File attachments
   - @mentions

5. **Crew Chat (Optional)**
   - Real-time chat untuk crew coordination
   - Notifications untuk mentions

---

## 🎯 Success Metrics

### Multi-Guide Operations
- % Trip besar (pax > X) yang memakai multi-guide
- Average crew size per trip
- Lead Guide utilization rate

### Crew Directory
- Directory usage frequency
- Contact action success rate
- Nearby crew feature usage

### Security
- Zero unauthorized access incidents
- Audit log coverage: 100%
- RLS policy compliance: 100%

---

## 📚 Documentation

### API Documentation
- All endpoints documented dengan JSDoc
- Error responses standardized
- Request/response examples

### Code Documentation
- Permission utilities documented
- Component props documented
- Hook usage documented

---

**Status:** ✅ **IMPLEMENTATION COMPLETE**  
**Ready for:** Testing & Deployment  
**Next Review:** After user testing feedback
