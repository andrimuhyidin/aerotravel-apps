# Multi-Role System - Complete Documentation
## Comprehensive Plan & Implementation Guide

**Project**: Multi-Role System with Public Landing Pages  
**Version**: 1.0  
**Last Updated**: 2025-12-19  
**Status**: Ready for Implementation

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Justification](#business-justification)
3. [Current System Analysis](#current-system-analysis)
4. [Architecture Design](#architecture-design)
5. [Best Practices & Industry Standards](#best-practices--industry-standards)
6. [User Journeys](#user-journeys)
7. [Implementation Plan](#implementation-plan)
8. [Security Considerations](#security-considerations)
9. [Performance Analysis](#performance-analysis)
10. [Risk Assessment](#risk-assessment)
11. [Success Criteria](#success-criteria)

---

## 🎯 Executive Summary

### **Project Goals**

1. ✅ **Public Landing Pages**: Setiap role punya halaman promosi sendiri
2. ✅ **Multi-Role Support**: User bisa punya multiple roles sekaligus
3. ✅ **Role Switching**: User bisa switch role tanpa logout
4. ✅ **Backward Compatibility**: Sistem existing tetap berfungsi

### **Architecture Review Verdict**

**Overall Score**: 7.5/10

**Breakdown**:
- Architecture: 8/10 ✅
- Security: 7/10 ⚠️ (needs improvement)
- Performance: 8/10 ✅
- Complexity: 6/10 ⚠️
- ROI: 8/10 ✅

**Verdict**: ✅ **MAKE SENSE** dengan beberapa **critical concerns** yang perlu di-address.

### **Key Recommendations**

1. ⚠️ **CRITICAL**: Use server-side session storage (not cookie) for active role
2. ✅ **MUST**: Staged rollout with feature flags
3. ✅ **MUST**: Comprehensive testing before production
4. ✅ **MUST**: Rollback plan documented
5. ✅ **SHOULD**: Rate limiting on role switch API
6. ✅ **SHOULD**: Soft limit on roles per user (max 5)

---

## 💼 Business Justification

### **ROI Analysis**

```
Development Cost: 4 weeks × $5000/week = $20,000
Expected Revenue Increase: 
  - 15% retention × $100k MRR = $15k/month
  - 20% conversion (landing pages) = $20k/month
Total Monthly Benefit: $35k/month
Payback Period: 0.57 months (~17 days)
Annual ROI: 2100%+
```

### **Business Benefits**

- ✅ **User Retention**: +15% (users with multiple roles)
- ✅ **Conversion**: +20% (public landing pages)
- ✅ **SEO**: Better search rankings
- ✅ **Flexibility**: Easy to add new roles
- ✅ **Scalability**: Industry-standard pattern

### **Costs**

- 💰 **Development**: 4-5 weeks implementation
- 💰 **Maintenance**: Ongoing role management
- 💰 **Support**: Users might need help with role switching

---

## 🔍 Current System Analysis

### **Existing Architecture**

#### **Database**
- `users.role` → Single role (enum: customer, guide, mitra, corporate, super_admin, dll)
- RLS Policies menggunakan `get_user_role()` → Read dari `users.role`
- Helper functions: `is_super_admin()`, `is_internal_staff()`

#### **Routing (`proxy.ts`)**
- Hard redirect berdasarkan `users.role`
- Guide → hanya bisa akses `/guide`
- Mitra → hanya bisa akses `/partner`
- Internal roles → hanya bisa akses `/console`

#### **Authorization**
- `lib/supabase/server.ts` → `getCurrentUser()` read dari `users.role`
- `hasRole()` → Check single role
- `hooks/use-permissions.ts` → Read dari `users.role`

#### **RLS Policies**
- Semua policies menggunakan `get_user_role()` function
- Function ini read dari `users.role` (single value)

### **Current Roles**

```sql
CREATE TYPE user_role AS ENUM (
  'super_admin',      -- Owner/Direktur
  'investor',         -- Komisaris (view only)
  'finance_manager',  -- Keuangan
  'marketing',        -- Marketing & CS
  'ops_admin',        -- Admin Operasional
  'guide',            -- Tour Guide
  'mitra',            -- B2B Agent
  'customer',         -- Public B2C
  'corporate'         -- B2B Enterprise
);
```

---

## 🏗️ Architecture Design

### **Database Schema**

#### **New Tables**

```sql
-- Table untuk many-to-many user roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, pending, rejected, suspended
  is_primary BOOLEAN DEFAULT false, -- Primary role (untuk backward compatibility)
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  suspended_at TIMESTAMPTZ,
  suspended_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Indexes untuk performa
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_status ON user_roles(status);
CREATE INDEX idx_user_roles_lookup ON user_roles(user_id, role, status) 
  WHERE status = 'active';

-- Table untuk role applications (tracking & audit)
CREATE TABLE role_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_role user_role NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  message TEXT, -- User's message/notes
  admin_notes TEXT, -- Admin's notes
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_role_applications_user_id ON role_applications(user_id);
CREATE INDEX idx_role_applications_status ON role_applications(status);
```

#### **Updated Functions**

```sql
-- Get active role (from session or primary role)
CREATE OR REPLACE FUNCTION get_active_role()
RETURNS user_role AS $$
  -- This will be called from application layer
  -- For now, return primary role from user_roles
  SELECT role FROM user_roles 
  WHERE user_id = auth.uid() 
    AND status = 'active' 
    AND is_primary = true
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update get_user_role() to use active role with fallback
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT COALESCE(
    get_active_role(),
    (SELECT role FROM users WHERE id = auth.uid())
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

### **Session Management**

#### **⚠️ CRITICAL: Server-Side Session Storage**

**DO NOT** store active role in cookie. Use server-side session storage instead.

```typescript
// ❌ BAD: Cookie-based (security risk)
cookies().set('active_role', role, { httpOnly: true });

// ✅ GOOD: Server-side session
// lib/session/active-role.ts
export async function getActiveRole(userId: string): Promise<user_role | null> {
  // Priority:
  // 1. Server-side session: active_role (set saat switch role)
  // 2. Primary role dari user_roles
  // 3. Fallback: users.role (backward compatibility)
  
  // Use Supabase session storage or Redis
  const session = await getSession(userId);
  if (session?.activeRole) {
    // Verify user actually has this role
    const hasRole = await verifyUserHasRole(userId, session.activeRole);
    if (hasRole) return session.activeRole;
  }
  
  // Get primary role
  const primaryRole = await getPrimaryRole(userId);
  if (primaryRole) return primaryRole;
  
  // Fallback to users.role
  const user = await getCurrentUser();
  return user?.profile?.role || null;
}

export async function setActiveRole(userId: string, role: user_role) {
  // Store in server-side session (Supabase session or Redis)
  await setSession(userId, { activeRole: role });
  
  // DO NOT store in cookie for security
}
```

### **API Endpoints**

```typescript
// app/api/user/roles/route.ts
GET  /api/user/roles          // Get all user roles
POST /api/user/roles/switch   // Switch active role
GET  /api/user/roles/active   // Get active role

// app/api/user/roles/apply/route.ts
POST /api/user/roles/apply           // Apply for new role
GET  /api/user/roles/applications    // Get user's applications

// app/api/admin/roles/route.ts (optional)
GET  /api/admin/roles/applications                    // List all applications
POST /api/admin/roles/applications/[id]/approve       // Approve application
POST /api/admin/roles/applications/[id]/reject       // Reject application
```

### **Updated Components**

#### **getCurrentUser()**

```typescript
// lib/supabase/server.ts
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Get profile
  const { data: profileData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // Get active role (server-side session)
  const activeRole = await getActiveRole(user.id);
  
  // Get all user roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role, status')
    .eq('user_id', user.id)
    .eq('status', 'active');
  
  return {
    ...user,
    profile: profileData,
    activeRole, // New field
    roles: userRoles?.map(ur => ur.role) || [], // All active roles
  };
}
```

#### **Proxy Logic**

```typescript
// proxy.ts - Updated
export async function proxy(request: NextRequest) {
  // ... existing i18n logic ...
  
  if (user) {
    const activeRole = await getActiveRole(user.id); // Server-side session
    
    // Public landing pages (allow access)
    const publicLandingPages = ['/guide', '/customer', '/mitra', '/corporate'];
    const isPublicLanding = publicLandingPages.some(path => 
      pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/apply`)
    );
    
    if (isPublicLanding) {
      // Allow access (will show landing or redirect based on role)
      return supabaseResponse;
    }
    
    // Protected routes
    if (pathWithoutLocale.startsWith('/guide/dashboard')) {
      if (activeRole !== 'guide') {
        return NextResponse.redirect(new URL(`/${locale}/guide`, request.url));
      }
    }
    
    // ... other protected routes ...
  }
}
```

---

## 🏭 Best Practices & Industry Standards

### **1. Role-Based Access Control (RBAC)**

#### **Industry Standard**
- **NIST RBAC Model**: Hierarchical roles dengan inheritance
- **Pattern**: User → Roles → Permissions → Resources

#### **Our Approach**
- ✅ Many-to-many user roles (flexible)
- ✅ Role-based permissions (via RLS)
- ✅ Context-aware (active role from session)
- ⚠️ Need to monitor role count (prevent explosion)

### **2. Session Management**

#### **Industry Pattern: Single Active Role (Recommended)**
- User punya multiple roles, tapi hanya 1 active role per session
- Switch role = new session/context
- **Used by**: GitHub, GitLab, AWS IAM, Google Workspace

#### **Why Single Active Role?**
- ✅ Simpler security model
- ✅ Clearer audit trail
- ✅ Better performance (single role check)
- ✅ Easier to understand for users
- ✅ Industry standard

### **3. Database Design**

#### **Pattern: Many-to-Many (Our Choice)**
```sql
users → user_roles → roles
```

**Why?**
- ✅ Industry standard for multi-role systems
- ✅ Proper normalization
- ✅ Foreign key constraints (data integrity)
- ✅ Easy to query and index
- ✅ Supports history and audit

### **4. Security Best Practices**

#### **Principle of Least Privilege**
- ✅ User hanya punya akses sesuai active role
- ✅ RLS policies enforce at database level
- ✅ No privilege escalation without approval

#### **Separation of Duties (SoD)**
- ✅ Internal roles (super_admin, ops_admin) tetap single role
- ✅ Tidak bisa apply untuk role lain (security)
- ✅ Clear separation: admin vs operational vs customer

#### **Role Verification**
```typescript
// Always verify in database, not just session
async function getActiveRole(userId: string) {
  const sessionRole = await getSessionRole(userId);
  
  // Verify user actually has this role
  const hasRole = await db.query(`
    SELECT 1 FROM user_roles 
    WHERE user_id = $1 AND role = $2 AND status = 'active'
  `, [userId, sessionRole]);
  
  if (!hasRole) {
    // Fallback to primary role
    return getPrimaryRole(userId);
  }
  
  return sessionRole;
}
```

---

## 🛣️ User Journeys

### **1. Customer Journey**

**Flow**: Discovery → Registration → Booking → Trip Management → Loyalty

**Key Routes**:
- `/` → Homepage (GuestHomepage)
- `/packages` → Browse packages
- `/book` → Booking wizard
- `/my-trips` → Customer dashboard
- `/loyalty` → Loyalty program

### **2. Guide Journey**

**Flow**: Application → Onboarding → Daily Operations → Post-Trip → Growth

**Key Routes**:
- `/guide` → Landing page (future) or Dashboard
- `/guide/attendance` → GPS attendance
- `/guide/manifest` → Digital manifest
- `/guide/trips/[id]` → Trip detail
- `/guide/wallet` → Financial dashboard

**Fitur Unik**:
- GPS attendance
- Digital manifest
- SOS button
- Offline support
- Real-time tracking

### **3. Mitra Journey**

**Flow**: Application → Onboarding → Booking Management → Financial → Whitelabel

**Key Routes**:
- `/mitra` → Landing page (future) or Dashboard
- `/partner/bookings` → Booking management
- `/partner/deposit` → Deposit management
- `/partner/invoices` → Invoice management
- `/partner/whitelabel` → Whitelabel settings

### **4. Corporate Journey**

**Flow**: Application → Onboarding → Employee Management → Booking → Invoicing

**Key Routes**:
- `/corporate` → Landing page (future) or Dashboard
- `/corporate/employees` → Employee management
- `/corporate/invoices` → Invoice management

### **5. Console Journey (Internal Admin)**

**Flow**: Login → Dashboard → Operations → Finance → Governance → Reports

**Sub-Roles**: `super_admin`, `ops_admin`, `finance_manager`, `marketing`, `investor`

**Key Routes**:
- `/console` → ERP Dashboard
- `/console/operations` → Operations hub
- `/console/bookings` → Booking management
- `/console/finance` → Finance dashboard
- `/console/users` → User management

---

## 📊 Implementation Plan

### **STAGE 0: Preparation & Planning** (2-3 days)

**Tasks**:
- [ ] Review & finalize architecture
- [ ] Setup development environment
- [ ] Create implementation checklist

**Deliverables**:
- ✅ Approved architecture document
- ✅ Database schema finalized
- ✅ Implementation checklist

---

### **STAGE 1: Database Schema & Migration** (3 days)

**Tasks**:
- [ ] Create `user_roles` table
- [ ] Create `role_applications` table
- [ ] Update helper functions (`get_user_role()`, etc.)
- [ ] Migrate existing data
- [ ] Create rollback script

**Files to Create**:
- `supabase/migrations/20251220000000_029-multi-role-system.sql`
- `supabase/migrations/20251220000001_030-multi-role-data-migration.sql`
- `scripts/test-migration.mjs`
- `scripts/rollback-migration.mjs`

**Success Criteria**:
- All migrations run successfully
- No data loss
- RLS policies still work
- Performance acceptable (< 1ms overhead)

---

### **STAGE 2: Backend API & Session Management** (4 days)

**Tasks**:
- [ ] Session management (server-side, NOT cookie)
- [ ] API endpoints for role management
- [ ] Update `getCurrentUser()` & `hasRole()`
- [ ] Security hardening (rate limiting, audit logging)

**Files to Create/Update**:
- `lib/session/active-role.ts` (NEW)
- `app/api/user/roles/route.ts` (NEW)
- `app/api/user/roles/switch/route.ts` (NEW)
- `app/api/user/roles/apply/route.ts` (NEW)
- `lib/supabase/server.ts` (UPDATE)

**Success Criteria**:
- Active role stored server-side (not cookie)
- Role switching works
- Rate limiting prevents abuse
- Audit logs capture all changes

---

### **STAGE 3: Frontend Components & Hooks** (3 days)

**Tasks**:
- [ ] React hooks (`useRoles()`, `useActiveRole()`, `useSwitchRole()`)
- [ ] Role switcher component
- [ ] Application forms (guide/mitra/corporate)
- [ ] Update existing components

**Files to Create/Update**:
- `hooks/use-roles.ts` (NEW)
- `components/role-switcher.tsx` (NEW)
- `app/[locale]/(public)/guide/apply/page.tsx` (NEW)
- `app/[locale]/(public)/mitra/apply/page.tsx` (NEW)
- `app/[locale]/(public)/corporate/apply/page.tsx` (NEW)

**Success Criteria**:
- Role switcher works smoothly
- Application forms submit correctly
- UI is intuitive
- No breaking changes

---

### **STAGE 4: Public Landing Pages** (3 days)

**Tasks**:
- [ ] Guide landing page (`/guide`)
- [ ] Mitra landing page (`/mitra`)
- [ ] Corporate landing page (`/corporate`)
- [ ] SEO optimization

**Files to Create**:
- `app/[locale]/(public)/guide/page.tsx` (NEW)
- `app/[locale]/(public)/guide/guide-landing.tsx` (NEW)
- `app/[locale]/(public)/mitra/page.tsx` (NEW)
- `app/[locale]/(public)/mitra/mitra-landing.tsx` (NEW)
- `app/[locale]/(public)/corporate/corporate-landing.tsx` (NEW)

**Success Criteria**:
- Landing pages look professional
- SEO scores > 90
- Mobile responsive
- Conversion-optimized

---

### **STAGE 5: Routing & Middleware Updates** (2 days)

**Tasks**:
- [ ] Update `proxy.ts` logic
- [ ] Update page components
- [ ] Route protection with active role

**Files to Update**:
- `proxy.ts` (UPDATE)
- `app/[locale]/(mobile)/guide/page.tsx` (UPDATE)
- `app/[locale]/(public)/page.tsx` (UPDATE)

**Success Criteria**:
- Public landing pages accessible
- Protected routes work correctly
- Role switching doesn't break routing
- No unauthorized access

---

### **STAGE 6: Admin Panel (Optional)** (2 days)

**Tasks**:
- [ ] Role application management UI
- [ ] User role management UI

**Priority**: Nice to have (can be done later)

---

### **STAGE 7: Testing & QA** (3 days)

**Tasks**:
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance tests
- [ ] Security tests

**Success Criteria**:
- Test coverage > 80%
- All E2E tests passing
- Performance < 50ms overhead
- No security vulnerabilities

---

### **STAGE 8: Documentation & Deployment** (2 days)

**Tasks**:
- [ ] Complete documentation
- [ ] Staging deployment
- [ ] Production deployment
- [ ] Monitoring setup

**Success Criteria**:
- All documentation complete
- Zero downtime deployment
- No critical errors
- Performance acceptable

---

## 📅 Timeline Summary

| Stage | Duration | Week | Priority |
|-------|----------|------|----------|
| Stage 0: Preparation | 2-3 days | Week 0 | Must Have |
| Stage 1: Database | 3 days | Week 1 | Must Have |
| Stage 2: Backend API | 4 days | Week 1-2 | Must Have |
| Stage 3: Frontend | 3 days | Week 2 | Must Have |
| Stage 4: Landing Pages | 3 days | Week 3 | Should Have |
| Stage 5: Routing | 2 days | Week 3 | Must Have |
| Stage 6: Admin Panel | 2 days | Week 4 | Nice to Have |
| Stage 7: Testing | 3 days | Week 4 | Must Have |
| Stage 8: Deployment | 2 days | Week 5 | Must Have |

**Total Duration**: 4-5 weeks

---

## 🔐 Security Considerations

### **Critical Security Requirements**

1. ⚠️ **MUST**: Server-side session storage (NOT cookie)
2. ✅ **MUST**: Always verify role in database
3. ✅ **MUST**: Rate limiting on role switch API
4. ✅ **MUST**: Audit logging for all role changes
5. ✅ **MUST**: CSRF protection
6. ✅ **SHOULD**: Soft limit on roles per user (max 5)

### **Security Best Practices**

#### **Role Verification**
```typescript
// Always verify in database, not just session
const hasRole = await verifyUserHasRole(userId, role);
if (!hasRole) {
  return unauthorized();
}
```

#### **Rate Limiting**
```typescript
// Prevent abuse
const rateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
});
```

#### **Audit Logging**
```typescript
// Log all role changes
await auditLog.create({
  action: 'role_switch',
  userId,
  fromRole: previousRole,
  toRole: newRole,
  timestamp: new Date(),
});
```

---

## ⚡ Performance Analysis

### **Database Performance**

**Before**:
```sql
SELECT role FROM users WHERE id = auth.uid();
-- Index: users(id) → O(1) lookup → ~0.1ms
```

**After**:
```sql
SELECT role FROM user_roles 
WHERE user_id = auth.uid() AND status = 'active' AND is_primary = true;
-- Index: user_roles(user_id, status, is_primary) → O(log n) → ~0.5ms
```

**Impact**: +0.4ms per RLS check (acceptable)

### **Optimization Strategies**

1. ✅ **Composite Index**: `user_roles(user_id, role, status) WHERE status = 'active'`
2. ✅ **Caching**: Cache active role in session (5 min TTL)
3. ✅ **STABLE Function**: PostgreSQL caches result per transaction

### **Performance Targets**

- ✅ RLS query: < 1ms overhead
- ✅ API response: < 50ms overhead
- ✅ Page load: No noticeable impact

---

## 🚨 Risk Assessment

### **Risk 1: Cookie Security** 🟡 MEDIUM-HIGH

**Issue**: Storing active role in cookie is security risk

**Mitigation**: 
- ✅ Use server-side session storage (Supabase session or Redis)
- ✅ Never store active role in cookie

**Status**: ⚠️ **CRITICAL** - Must be addressed

---

### **Risk 2: Migration Failure** 🟡 MEDIUM

**Issue**: Data migration might fail

**Mitigation**:
- ✅ Test on staging first
- ✅ Keep rollback script ready
- ✅ Staged rollout with feature flags
- ✅ Monitor during migration

**Status**: ✅ Mitigated with proper planning

---

### **Risk 3: Performance Degradation** 🟢 LOW

**Issue**: Extra queries might slow down system

**Mitigation**:
- ✅ Proper indexing
- ✅ Caching strategy
- ✅ Performance testing
- ✅ Monitor query times

**Status**: ✅ Acceptable with optimization

---

### **Risk 4: Role Explosion** 🟢 LOW

**Issue**: Users might have too many roles

**Mitigation**:
- ✅ Soft limit (max 5 roles per user)
- ✅ Admin override
- ✅ Monitor role count

**Status**: ✅ Low risk, easy to mitigate

---

## ✅ Success Criteria

### **Functional Requirements**

- ✅ Users can have multiple roles
- ✅ Users can switch roles without logout
- ✅ Public landing pages accessible
- ✅ Role applications work
- ✅ Admin can manage roles (optional)

### **Non-Functional Requirements**

- ✅ Performance: < 50ms overhead
- ✅ Security: No vulnerabilities
- ✅ Test coverage: > 80%
- ✅ Documentation: Complete
- ✅ Zero downtime deployment

### **Business Requirements**

- ✅ SEO improved (landing pages)
- ✅ Conversion rate increased
- ✅ User retention improved
- ✅ No user complaints

---

## 🎯 Key Decisions

### **1. Internal Roles Multi-Role Support**

**Decision**: ❌ **NO** - Internal roles (super_admin, ops_admin) tetap single role

**Reason**: Security & separation of duties

---

### **2. Role Switching Approval**

**Decision**: ✅ **NO APPROVAL NEEDED** - User bisa langsung switch jika sudah punya role

**Reason**: User sudah punya role tersebut, tidak perlu approval lagi

---

### **3. Primary Role Determination**

**Decision**: Role pertama yang di-approve, atau bisa di-set manual

**Reason**: Flexible, bisa diubah oleh admin

---

### **4. Role Application Auto-Approve**

**Decision**:
- Customer → ✅ Auto-approve
- Guide, Mitra, Corporate → ❌ Need approval
- Internal roles → ❌ Admin only (no application)

**Reason**: Security & business logic

---

### **5. Backward Compatibility**

**Decision**: Keep `users.role` for 6 months, then deprecate

**Reason**: Safe migration, easy rollback

---

## 📝 Next Steps

1. **Review this document** with team
2. **Get stakeholder approval**
3. **Start Stage 0** (Preparation)
4. **Create feature branch**: `feature/multi-role-system`
5. **Begin implementation**

---

## 📚 References

- **NIST RBAC Model**: Industry standard for role-based access control
- **GitHub Organization Switching**: Similar pattern
- **AWS IAM Role Assumption**: Similar pattern
- **Slack Workspace Switching**: Similar pattern

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-19  
**Author**: AI Solutions Architect  
**Status**: Ready for Implementation

