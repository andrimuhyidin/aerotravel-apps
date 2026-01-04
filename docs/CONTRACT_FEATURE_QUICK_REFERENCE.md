# Contract Feature - Quick Reference Guide

**Tanggal**: 2025-01-21  
**Purpose**: Quick reference untuk fitur kontrak kerja

---

## 🚀 Quick Commands

### Regenerate Types
```bash
# Using script (recommended)
pnpm update-types:contracts

# Or manual
export SUPABASE_PROJECT_ID=your-project-id
pnpm update-types
```

### Type Check
```bash
pnpm type-check
```

### Test Flow
```bash
# Development
pnpm dev

# Build
pnpm build
```

---

## 📍 Key Files

### Client Components
- **Create Contract**: `app/[locale]/(dashboard)/console/guide/contracts/create/create-contract-client.tsx`
- **Contract Detail (Admin)**: `app/[locale]/(dashboard)/console/guide/contracts/[id]/contract-detail-admin-client.tsx`
- **Contract Detail (Guide)**: `app/[locale]/(mobile)/guide/contracts/[id]/contract-detail-client.tsx`
- **Contract List (Guide)**: `app/[locale]/(mobile)/guide/contracts/contracts-client.tsx`

### API Routes
- **Guide Contracts**: `app/api/guide/contracts/`
- **Admin Contracts**: `app/api/admin/guide/contracts/`

### Database
- **Migration**: `supabase/migrations/20250122000000_042-guide-contract-sanctions-resign.sql`
- **Main Tables**: `guide_contracts`, `guide_contract_sanctions`, `guide_contract_resignations`

---

## 🔄 Contract Flow

```
1. Admin Creates Contract
   ↓
2. Admin Sends to Guide (or auto_send)
   ↓
3. Guide Signs Contract
   ↓
4. Company Signs Contract
   ↓
5. Contract Active
   ├── Wallet transaction created
   ├── PDF generated
   └── Notifications sent
```

---

## 📊 Contract Statuses

| Status | Description | Next Actions |
|--------|-------------|--------------|
| `draft` | Contract created but not sent | Admin can send or edit |
| `pending_signature` | Sent to guide, waiting for signature | Guide can sign or reject |
| `pending_company` | Guide signed, waiting for company | Admin can sign as company |
| `active` | Both signed, contract active | Can resign or add sanctions |
| `expired` | Contract expired | Can renew or terminate |
| `terminated` | Contract terminated | No actions available |
| `rejected` | Guide rejected contract | Admin can resend or cancel |

---

## 🎯 Common Tasks

### Create Contract
```typescript
POST /api/admin/guide/contracts
{
  guide_id: string,
  contract_type: 'per_trip' | 'monthly' | 'project' | 'seasonal' | 'annual',
  title: string,
  start_date: string,
  fee_amount: number,
  auto_send: boolean
}
```

### Sign Contract (Guide)
```typescript
POST /api/guide/contracts/[id]/sign
{
  signature_data: string, // base64 image or text
  signature_method: 'draw' | 'upload' | 'typed'
}
```

### Sign Contract (Company)
```typescript
POST /api/admin/guide/contracts/[id]/sign
{
  signature_data?: string,
  signature_method?: 'draw' | 'upload' | 'typed'
}
```

### Resign from Contract
```typescript
POST /api/guide/contracts/[id]/resign
{
  reason: string,
  effective_date: string,
  notice_period_days: number
}
```

### Add Sanction
```typescript
POST /api/admin/guide/contracts/[id]/sanctions
{
  sanction_type: 'warning' | 'suspension' | 'fine' | 'demotion' | 'termination',
  severity: 'low' | 'medium' | 'high' | 'critical',
  title: string,
  description: string,
  violation_date: string,
  fine_amount?: number, // if type = 'fine'
  suspension_start_date?: string, // if type = 'suspension'
  suspension_end_date?: string
}
```

---

## 🔧 Troubleshooting

### Types Not Found
```bash
# Regenerate types
pnpm update-types:contracts

# Verify tables exist
grep -i "guide_contract_resignations" types/supabase.ts
```

### TypeScript Errors
```bash
# Run type check
pnpm type-check

# Check specific file
npx tsc --noEmit app/api/guide/contracts/[id]/resignations/route.ts
```

### Migration Not Applied
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('guide_contract_resignations', 'guide_contract_sanctions');

-- If not, run migration
-- File: supabase/migrations/20250122000000_042-guide-contract-sanctions-resign.sql
```

---

## 📚 Documentation

- **Evaluation Complete**: `docs/CONTRACT_FEATURE_EVALUATION_COMPLETE.md`
- **Final Status**: `docs/CONTRACT_FEATURE_FINAL_STATUS.md`
- **Types Regeneration**: `docs/CONTRACT_TYPES_REGENERATION.md`
- **Detailed Guide**: `docs/REGENERATE_TYPES_GUIDE.md`

---

## ✅ Checklist

### Before Production
- [ ] Types regenerated
- [ ] Type check passes
- [ ] Migration executed
- [ ] Flow tested
- [ ] Notifications working
- [ ] PDF generation working
- [ ] Wallet integration working

### After Production
- [ ] Monitor error logs
- [ ] Check notification delivery
- [ ] Verify PDF generation
- [ ] Monitor wallet transactions
- [ ] Collect user feedback

---

**Last Updated**: 2025-01-21
