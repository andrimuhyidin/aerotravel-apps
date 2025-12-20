# Start Trip Journey Analysis

**Date:** 2025-01-23  
**Status:** 🔍 Analysis Complete

---

## 📋 Current Journey Flow

### Phase: `before_departure`

1. **UI Elements Visible:**
   - Manifest Section (passenger check-in)
   - Trip Tasks
   - Passenger Consent Section
   - **Start Trip Button** (Lead Guide only)

2. **User Action:**
   - Lead Guide clicks "Start Trip" button

3. **Handler Logic (`onStartTrip`):**
   ```typescript
   if (canStartTrip === false) {
     const reasons = canStartData?.reasons || [];
     if (reasons.some((r) => r.includes('Risk assessment'))) {
       setRiskAssessmentOpen(true);  // Open dialog
       return;
     } else {
       toast.error(`Trip tidak dapat dimulai: ${reasons.join(', ')}`);
       return;
     }
   }
   setRiskAssessmentOpen(true);  // Always open dialog
   ```

4. **Risk Assessment Dialog:**
   - User fills risk assessment form
   - Submits assessment
   - On success, calls `/api/guide/trips/[id]/start` API

5. **API Validation (`/api/guide/trips/[id]/start`):**
   - ✅ Check Lead Guide authorization
   - ✅ Check certifications valid
   - ✅ Check risk assessment `is_safe = true`
   - ✅ Update trip status to `on_trip`

---

## ✅ What's Working Correctly

1. **Authorization**: Only Lead Guide can start trip ✅
2. **Certification Check**: Validated before start ✅
3. **Risk Assessment**: Required and validated ✅
4. **Phase Transition**: Correctly moves from `before_departure` to `during_trip` ✅

---

## ⚠️ Potential Issues & Recommendations

### 1. **Risk Assessment Flow - Minor Logic Issue**

**Current:**
- Handler always opens Risk Assessment Dialog, even if `canStartTrip === false` and reason is NOT "Risk assessment"
- After assessment completion, directly tries to start trip without re-checking `canStart`

**Recommendation:**
- After assessment completion, should re-check `/can-start` API before attempting to start
- Or, handler should be clearer: only open dialog if needed

**Status:** ⚠️ Minor - Flow works but could be more explicit

---

### 2. **Missing Facility Checklist Validation** ❓

**Current:**
- Facility checklist (Verifikasi Fasilitas & Layanan) exists in UI
- Guide can verify facilities are available
- **BUT**: No validation in Start Trip API to ensure all facilities are checked

**Question:**
- Should facility checklist be **required** before trip can start?
- Or is it just informational/recommended?

**Recommendation:**
- **If Required**: Add validation in Start Trip API to check all included facilities are verified
- **If Optional**: Current implementation is fine (just informational)

**Status:** ❓ **DECISION NEEDED** - Depends on business requirement

---

### 3. **Missing Manifest Validation** ❓

**Current:**
- Manifest section exists for passenger check-in
- **BUT**: No validation that all passengers are checked-in before trip can start

**Question:**
- Should all passengers be checked-in before trip can start?
- Or is check-in optional/ongoing during trip?

**Recommendation:**
- Usually check-in happens **at** departure point, not necessarily before "Start Trip"
- But could add **warning** if no passengers checked-in yet

**Status:** ❓ **DECISION NEEDED** - Likely optional (check-in happens at departure)

---

### 4. **Error Handling After Risk Assessment**

**Current:**
```typescript
// In risk-assessment-dialog.tsx onComplete
if (canStart) {
  // Try to start trip
  const res = await fetch(`/api/guide/trips/${tripId}/start`, ...);
  if (res.ok) {
    toast.success('Trip berhasil dimulai');
  } else {
    // Show error
  }
}
```

**Issue:**
- If API returns 403 with reasons, should show those reasons to user
- Currently only shows generic error

**Recommendation:**
- Parse API error response and show specific reasons if available

**Status:** ⚠️ Minor - Error handling could be more detailed

---

## 🎯 Summary

### Journey is **mostly correct** ✅

**Core Flow:**
1. Lead Guide sees Start Trip button in `before_departure` phase ✅
2. Clicks button → Opens Risk Assessment Dialog ✅
3. Completes assessment → Trip starts ✅
4. Status changes to `on_trip` → Phase changes to `during_trip` ✅

### Decisions Needed:

1. **Facility Checklist**: Required or Optional before start?
2. **Manifest Check-in**: Required or Optional before start?

### Minor Improvements:

1. Better error handling after assessment completion
2. More explicit logic in `onStartTrip` handler

---

## ✅ Conclusion

**Journey is functionally correct** and follows expected flow. Main decision needed is whether facility checklist and/or manifest check-in should be **required** before trip can start, or remain **optional/informational**.
