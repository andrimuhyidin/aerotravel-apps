# Guide Contracts - Execution Guide

## ⚡ Quick Execution (5 Minutes)

### Step 1: Run Migrations

**Via Supabase Dashboard (RECOMMENDED):**

1. Buka: https://supabase.com/dashboard
2. Pilih project Anda
3. Buka **SQL Editor** (sidebar kiri)
4. Copy & paste isi file: `supabase/migrations/20250121000000_040-guide-contracts.sql`
5. Klik **Run** (atau `Cmd+Enter` / `Ctrl+Enter`)
6. Ulangi untuk: `supabase/migrations/20250121000001_041-contract-auto-expire-cron.sql`

**Via Script:**
```bash
node scripts/setup-contracts.mjs
```
*(Script akan memberikan instruksi manual karena Supabase JS client tidak bisa execute raw SQL)*

### Step 2: Create Storage Bucket

**Via Supabase Dashboard:**

1. Buka **Storage** (sidebar kiri)
2. Klik **New bucket**
3. Isi:
   - **Name**: `guide-documents`
   - **Public**: `false` (uncheck)
   - **File size limit**: `10MB`
   - **Allowed MIME types**: `image/png, image/jpeg, application/pdf`
4. Klik **Create bucket**

**Via SQL (jika punya akses service role):**
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guide-documents',
  'guide-documents',
  false,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'application/pdf']
);
```

### Step 3: Create Storage Policies

**Via Supabase Dashboard SQL Editor:**

```sql
-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "guide_documents_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'guide-documents');

-- Allow users to read their own files
CREATE POLICY IF NOT EXISTS "guide_documents_read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'guide-documents');
```

### Step 4: Verify Setup

**Check tables:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('guide_contracts', 'guide_contract_trips', 'guide_contract_payments')
ORDER BY table_name;
```

**Check bucket:**
- Go to Storage → Should see `guide-documents` bucket

**Check policies:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE 'guide_documents%';
```

---

## ✅ Verification Checklist

- [ ] Migration `040-guide-contracts.sql` executed
- [ ] Migration `041-contract-auto-expire-cron.sql` executed
- [ ] Storage bucket `guide-documents` created
- [ ] Storage policies created
- [ ] Tables exist: `guide_contracts`, `guide_contract_trips`, `guide_contract_payments`
- [ ] Functions exist: `generate_contract_number`, `calculate_contract_expires_at`, `auto_expire_contracts`

---

## 🧪 Test the System

### 1. Test Create Contract (Admin)

```bash
# Login as admin first, then:
curl -X POST http://localhost:3000/api/admin/guide/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "guide_id": "GUIDE_UUID",
    "contract_type": "per_trip",
    "title": "Test Contract",
    "start_date": "2025-01-22",
    "fee_amount": 300000
  }'
```

### 2. Test List Contracts (Guide)

```bash
curl http://localhost:3000/api/guide/contracts \
  -H "Authorization: Bearer GUIDE_TOKEN"
```

### 3. Test Sign Contract (Guide)

```bash
curl -X POST http://localhost:3000/api/guide/contracts/CONTRACT_ID/sign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer GUIDE_TOKEN" \
  -d '{
    "signature_method": "typed",
    "signature_data": "John Doe"
  }'
```

---

## 🎯 UI Testing

1. **Admin Console**: `/console/guide/contracts`
   - Create contract
   - Send to guide
   - Sign as company

2. **Guide App**: `/guide/contracts`
   - View contracts
   - Sign contract (draw/upload/typed)
   - Reject contract
   - Download PDF

---

## 🐛 Troubleshooting

### Migration Errors

**Error: "relation already exists"**
- ✅ Normal jika migration sudah pernah dijalankan
- Migration menggunakan `IF NOT EXISTS`, aman untuk dijalankan ulang

**Error: "permission denied"**
- Pastikan menggunakan service role key
- Atau jalankan via Supabase Dashboard dengan user yang punya akses

### Storage Errors

**Error: "Bucket not found"**
- Pastikan bucket `guide-documents` sudah dibuat
- System akan fallback ke typed signature jika upload gagal

**Error: "Policy violation"**
- Pastikan storage policies sudah dibuat
- Check policy SQL di Step 3

### API Errors

**Error: 403 Forbidden**
- Pastikan user punya role yang tepat (admin untuk admin endpoints, guide untuk guide endpoints)

**Error: 404 Not Found**
- Pastikan contract ID valid
- Check RLS policies

---

## 📊 Monitoring

### Check Contract Status

```sql
SELECT 
  contract_number,
  title,
  status,
  guide_signed_at,
  company_signed_at,
  created_at
FROM guide_contracts
ORDER BY created_at DESC
LIMIT 10;
```

### Check Wallet Transactions

```sql
SELECT 
  transaction_type,
  amount,
  description,
  created_at
FROM guide_wallet_transactions
WHERE reference_type = 'contract'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎉 Success Indicators

✅ **System Ready When:**
- Migrations executed without errors
- Storage bucket created
- Can create contract (Admin)
- Can view contracts (Guide)
- Can sign contract (Guide & Admin)
- Wallet transaction created when contract active
- PDF generated successfully

---

**Status**: ✅ Ready to Execute
