# User Journey: Multi-Guide Operations & Crew Directory

**Date:** 2025-01-23  
**Status:** ✅ **IMPLEMENTED & VERIFIED**

---

## 📱 User Journey Overview

### Persona
1. **Admin Ops** - Assign crew, manage trips
2. **Lead Guide** - Manage trip, coordinate crew
3. **Support Guide** - Assist trip, follow instructions

---

## 🎯 User Journey 1: Crew Directory

### Flow
1. **Guide opens Profile page**
   - Route: `/id/guide/profile`
   - Navigation: Bottom nav → "Profil"

2. **Scrolls to "Dukungan" section**
   - Menu items loaded from `/api/guide/menu-items`
   - Section: "Dukungan"
   - Item: "Crew Directory" (icon: Users)

3. **Clicks "Crew Directory"**
   - Route: `/id/guide/crew/directory`
   - Component: `CrewDirectoryClient`

4. **Views Directory**
   - **"My Trip Crew" section** (top)
     - Shows guides from current user's trips
     - Displays trip info (code, date, role)
   - **"All Directory" section** (below)
     - Shows all active guides in branch
     - Search & filter available

5. **Search & Filter**
   - Search by name (real-time)
   - Filter by availability (Tersedia, On Duty, Sedang Trip, Tidak Tersedia)
   - Filter by skill (text input)

6. **Contact Guide**
   - Click "Hubungi" button
   - API: `POST /api/guide/crew/contact/[guideId]`
   - Returns: WhatsApp/Call action URLs (masked phone)
   - Opens WhatsApp or Phone app

### UI Elements
- ✅ Search bar with icon
- ✅ Availability filter dropdown
- ✅ Skill filter input
- ✅ Crew member cards with:
  - Avatar (with availability indicator)
  - Name & branch
  - Badges & skills
  - Availability status badge
  - Contact button
- ✅ Empty states
- ✅ Loading states
- ✅ Error states

---

## 🎯 User Journey 2: Crew Management (Trip Detail)

### Flow
1. **Guide opens Trip Detail**
   - Route: `/id/guide/trips/[slug]`
   - From: Dashboard → "Trip aktif" or Trips list

2. **Views "Trip Crew" Section**
   - Component: `CrewSection`
   - API: `GET /api/guide/crew/trip/[tripId]`

3. **Sees Crew Members**
   - **Lead Guide** (if assigned):
     - Crown icon (👑)
     - Green background
     - Status: "Dikonfirmasi" or "Menunggu konfirmasi"
   - **Support Guides** (if any):
     - Shield icon (🛡️)
     - Blue background
     - Status: "Dikonfirmasi" or "Menunggu konfirmasi"

4. **Confirm Assignment** (if assigned)
   - Click "Konfirmasi" button
   - API: `PUT /api/guide/crew/trip/[tripId]`
   - Updates status: `assigned` → `confirmed`

5. **Admin: Assign Crew** (if ops/admin)
   - Click "Tambah Crew" button
   - Dialog opens:
     - Input: Guide ID
     - Select: Role (Lead/Support)
   - API: `POST /api/guide/crew/trip/[tripId]`
   - Creates assignment

### UI Elements
- ✅ Crew section card
- ✅ Lead Guide badge (Crown icon)
- ✅ Support Guides list (Shield icon)
- ✅ Avatar & name display
- ✅ Status indicators
- ✅ Confirm button (for assigned guides)
- ✅ Assign dialog (Admin only)
- ✅ Empty state

---

## 🎯 User Journey 3: Crew Notes

### Flow
1. **Guide opens Trip Detail**
   - Route: `/id/guide/trips/[slug]`

2. **Views "Crew Notes" Section**
   - Component: `CrewNotesSection`
   - API: `GET /api/guide/crew/notes/[tripId]`

3. **Creates Note**
   - Select note type: General, Task, Safety, Coordination
   - Type message (max 1000 chars)
   - Click "Kirim"
   - API: `POST /api/guide/crew/notes/[tripId]`

4. **Views Notes Timeline**
   - All notes from crew members
   - Sorted by newest first
   - Shows:
     - Creator avatar & name
     - Note type badge
     - Message content
     - Timestamp

### UI Elements
- ✅ Note type selector
- ✅ Message textarea (with char counter)
- ✅ Send button
- ✅ Notes timeline
- ✅ Creator info
- ✅ Type badges (color-coded)
- ✅ Timestamp

---

## 🎯 User Journey 4: Permission Matrix

### Lead Guide Permissions

1. **Start/End Trip**
   - Section: "Trip Control (Lead Guide)"
   - Buttons: "Start Trip" & "End Trip"
   - API: `POST /api/guide/trips/[id]/start|end`
   - ✅ Only Lead Guide can see/use

2. **View Full Manifest**
   - Route: `/id/guide/manifest` or Trip Detail
   - Component: `ManifestClient`
   - Data: Full passenger names & phones
   - ✅ No masking

3. **Submit Incident Report**
   - Can submit final reports
   - ✅ Full access

### Support Guide Permissions

1. **View Masked Manifest**
   - Route: `/id/guide/manifest` or Trip Detail
   - Component: `ManifestClient` (with `crewRole='support'`)
   - Data: Masked names & phones
   - Visual indicator: "Data dimask untuk Support Guide"
   - ✅ Masking applied

2. **Draft Incident Report**
   - Can create draft reports
   - Lead Guide submits final
   - ✅ Limited access

3. **Upload Evidence & Trigger SOS**
   - Can upload photos
   - Can trigger SOS
   - ✅ Full access

### Permission Check
- Utility: `lib/guide/crew-permissions.ts`
- Functions: `canStartEndTrip()`, `canViewManifest()`, etc.
- Hook: `useTripCrew(tripId)` - Gets current user's role

---

## 🔄 Integration Points

### 1. Trip List
- **Route:** `/id/guide/trips`
- **API:** `GET /api/guide/trips`
- **Support:** Checks both `trip_crews` and `trip_guides`
- **Response:** Includes `crew_role` field

### 2. Trip Detail
- **Route:** `/id/guide/trips/[slug]`
- **Components:**
  - `CrewSection` - Shows crew members
  - `CrewNotesSection` - Shows crew notes
  - `TripDetailClient` - Uses `useTripCrew()` for permissions

### 3. Manifest
- **Route:** `/id/guide/manifest`
- **Component:** `ManifestClient`
- **Masking:** Based on `crewRole` prop
- **Functions:** `maskPassengerName()`, `maskPhone()`

### 4. Profile Menu
- **Route:** `/id/guide/profile`
- **Component:** `GuideProfileClient`
- **Menu:** Loads from `/api/guide/menu-items`
- **Item:** "Crew Directory" in "Dukungan" section

---

## ✅ Verification Checklist

### Database
- [x] Migration 044 applied
- [x] Tables created (4/4)
- [x] Functions created (3/3)
- [x] Triggers created (2/2)
- [x] RLS policies applied

### Types
- [x] Types generated
- [x] New tables included
- [x] Function types included

### API Routes
- [x] GET /api/guide/crew/trip/[tripId]
- [x] POST /api/guide/crew/trip/[tripId]
- [x] PUT /api/guide/crew/trip/[tripId]
- [x] DELETE /api/guide/crew/trip/[tripId]
- [x] GET /api/guide/crew/directory
- [x] GET /api/guide/crew/directory/nearby
- [x] POST /api/guide/crew/contact/[guideId]
- [x] GET /api/guide/crew/notes/[tripId]
- [x] POST /api/guide/crew/notes/[tripId]
- [x] POST /api/guide/trips/[id]/start
- [x] POST /api/guide/trips/[id]/end

### Components
- [x] CrewDirectoryClient
- [x] CrewSection
- [x] CrewNotesSection
- [x] Page components

### Integration
- [x] Trip detail integration
- [x] Manifest masking
- [x] Trip list support
- [x] Menu item added

### User Journey
- [x] Crew Directory accessible
- [x] Crew Management visible
- [x] Crew Notes functional
- [x] Permission matrix enforced

---

## 🎨 UI/UX Features

### Crew Directory
- ✅ Search bar with icon
- ✅ Filter dropdowns
- ✅ "My Trip Crew" section (prioritized)
- ✅ Availability indicators (color-coded dots)
- ✅ Badge & skill display
- ✅ Contact button (masked)
- ✅ Empty states
- ✅ Loading states

### Crew Management
- ✅ Role badges (Crown/Shield)
- ✅ Status indicators
- ✅ Confirm button
- ✅ Assign dialog (Admin)
- ✅ Empty states

### Crew Notes
- ✅ Note type selector
- ✅ Character counter
- ✅ Type badges (color-coded)
- ✅ Creator info
- ✅ Timestamp
- ✅ Timeline view

---

## 🔐 Security Features

- ✅ RLS policies with branch isolation
- ✅ Permission checks in API routes
- ✅ Masked contact info
- ✅ Audit logging
- ✅ Role-based access control

---

## 📊 Success Metrics

### Multi-Guide Operations
- % Trip besar (pax > X) yang memakai multi-guide
- Average crew size per trip
- Lead Guide utilization rate

### Crew Directory
- Directory usage frequency
- Contact action success rate
- Nearby crew feature usage

### Crew Notes
- Notes created per trip
- Response time to notes
- Coordination effectiveness

---

**Status:** ✅ **ALL USER JOURNEYS VERIFIED & READY**
