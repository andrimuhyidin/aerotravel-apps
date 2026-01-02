# Guide Apps - Testing Coverage Audit Report

**Audit Date:** 2026-01-02  
**Status:** 🟡 Minimal Coverage

---

## Executive Summary

### Score: 30/100

| Category | Coverage | Status |
|----------|----------|--------|
| E2E Tests | 10% | 🔴 Critical Gap |
| Unit Tests | 5% | 🔴 Critical Gap |
| Integration Tests | 0% | 🔴 None |
| API Tests | 0% | 🔴 None |

---

## Current Test Suite

### E2E Tests (Playwright)
**Files:** 7 spec files

1. `tests/e2e/guide-app.spec.ts` - **Stub tests only**
   - Navigation tests: ✅ Basic
   - Risk assessment: ❌ Documented only
   - Passenger consent: ❌ Documented only
   - Trip start validation: ❌ Documented only

2. `tests/e2e/smoke.spec.ts` - Basic smoke test
3. Other E2E tests focus on partner/public apps

### Unit Tests
**Files:** 3 guide-specific tests

1. `tests/unit/guide/risk-assessment.test.ts` ✅
2. `tests/unit/guide/geofencing.test.ts` ✅
3. `tests/unit/guide/attendance.test.ts` ✅

---

## Critical Flows Needing Tests

| Flow | Priority | Current Coverage | Recommended Tests |
|------|----------|------------------|-------------------|
| Trip Start Validation | 🔴 Critical | 0% | E2E + Unit |
| SOS Emergency Trigger | 🔴 Critical | 0% | E2E + Integration |
| Passenger Consent Collection | 🔴 Critical | 0% | E2E |
| Attendance Check-in with GPS | 🟡 High | 33% | E2E (full flow) |
| Offline Mutation Sync | 🟡 High | 0% | Integration |
| Risk Assessment Calculation | ✅ Medium | 100% | Complete |
| Certification Expiry Check | 🟡 High | 0% | Unit |
| Wallet Calculations | 🟡 High | 0% | Unit |
| AI Feature Responses | 🟡 High | 0% | Integration (mocked) |

---

## Recommended Test Suite

### E2E Tests (Priority Order)

```typescript
// 1. Trip Start Flow (Critical)
test('should block trip start when requirements not met', async ({ page }) => {
  // Test: Missing check-in
  // Test: Missing equipment checklist
  // Test: High risk score
  // Test: Missing passenger consent
  // Test: Expired certifications
});

// 2. SOS Emergency Flow (Critical)
test('should trigger SOS and send notifications', async ({ page }) => {
  // Test: SOS button click
  // Test: GPS capture
  // Test: Notifications sent (mock WhatsApp/Email)
  // Test: Location streaming starts
});

// 3. Attendance Check-in Flow (Critical)
test('should complete check-in with KTP photo and GPS', async ({ page }) => {
  // Test: KTP photo capture
  // Test: GPS validation
  // Test: Late penalty calculation
  // Test: Equipment handover
});

// 4. Offline Sync Flow (High)
test('should queue mutations when offline and sync when online', async ({ page }) => {
  // Test: Go offline
  // Test: Perform action (check-in)
  // Test: Verify queued
  // Test: Go online
  // Test: Verify synced
});
```

### Unit Tests (High Priority)

```typescript
// 1. Business Logic Tests
describe('Late Penalty Calculation', () => {
  it('should charge 25000 for check-in after 07:30', () => {
    const result = calculateLatePenalty(new Date('2026-01-02T08:00:00'));
    expect(result.penalty).toBe(25000);
    expect(result.isLate).toBe(true);
  });
});

// 2. Risk Score Calculation
describe('Risk Assessment', () => {
  it('should calculate risk score correctly', () => {
    const score = calculateRiskScore({
      waveHeight: 2,
      windSpeed: 15,
      weather: 'rainy',
      crewReady: true,
      equipmentComplete: true,
    });
    expect(score).toBe(65); // Should allow trip start
  });
});

// 3. Wallet Calculations
describe('Earnings Calculator', () => {
  it('should calculate net earnings after deductions', () => {
    const net = calculateNetEarnings(500000, [
      { type: 'late_penalty', amount: 25000 },
      { type: 'tax', amount: 25000 },
    ]);
    expect(net).toBe(450000);
  });
});
```

### Integration Tests (Medium Priority)

```typescript
// 1. API Integration Tests
describe('POST /api/guide/sos', () => {
  it('should create SOS alert and send notifications', async () => {
    const response = await request(app)
      .post('/api/guide/sos')
      .send({
        latitude: -6.2,
        longitude: 106.8,
        incident_type: 'medical',
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(mockWhatsApp.send).toHaveBeenCalled();
    expect(mockEmail.send).toHaveBeenCalled();
  });
});

// 2. Offline Sync Integration
describe('Offline Sync', () => {
  it('should sync queued mutations on reconnect', async () => {
    // Queue mutations
    await queueMutation('CHECK_IN', { tripId: '123' });
    
    // Trigger sync
    const result = await syncMutations();
    
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
  });
});
```

---

## Test Coverage Goals

### Phase 1 (Week 1-2): Critical Flows
- Target: 40% coverage
- Focus: Trip start, SOS, Attendance

### Phase 2 (Week 3-4): High Priority
- Target: 60% coverage
- Focus: Offline sync, Wallet, Risk assessment

### Phase 3 (Week 5-6): Complete Coverage
- Target: 80% coverage
- Focus: All remaining features, edge cases

---

## Testing Infrastructure Needs

1. **Mock Services:**
   - WhatsApp API
   - Email service
   - Gemini AI
   - DeepSeek AI

2. **Test Data:**
   - Sample trips
   - Mock users
   - Fake GPS coordinates

3. **CI/CD Integration:**
   - Run tests on PR
   - Block merge if tests fail
   - Generate coverage reports

---

## Conclusion

**Current State:** 🔴 Critical gap in test coverage

**Risk:** High risk of regressions and production bugs

**Recommendation:** 
1. Immediately write tests for critical flows (Trip start, SOS, Attendance)
2. Establish 80% coverage goal before full production launch
3. Implement CI/CD testing pipeline

**Estimated Effort:**
- Phase 1 (Critical): 1-2 weeks
- Phase 2 (High Priority): 2 weeks
- Phase 3 (Complete): 2 weeks
- **Total:** 5-6 weeks for comprehensive test suite

---

**Report Generated:** 2026-01-02  
**Priority:** 🔴 High - Start immediately

