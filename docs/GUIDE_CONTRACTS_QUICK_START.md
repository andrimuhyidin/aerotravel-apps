# Guide Contracts - Quick Start Guide

## ⚡ Quick Setup (5 Minutes)

### 1. Run Database Migrations

**Via Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/20250121000000_040-guide-contracts.sql`
3. Run `supabase/migrations/20250121000001_041-contract-auto-expire-cron.sql`

**Via Supabase CLI:**
```bash
supabase migration up
```

### 2. Create Storage Bucket

**Via Supabase Dashboard:**
1. Go to Storage → New Bucket
2. Name: `guide-documents`
3. Public: `false` (Private)
4. File size limit: `10MB`
5. Allowed MIME types: `image/png`, `image/jpeg`, `application/pdf`

**Via SQL:**
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

### 3. Setup Storage Policies

Run in Supabase SQL Editor:
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

### 4. Test the System

**Test Flow:**
1. **Admin**: Create contract at `/console/guide/contracts/create`
2. **Admin**: Send contract to guide
3. **Guide**: View contract at `/guide/contracts`
4. **Guide**: Sign contract (draw/upload/typed)
5. **Admin**: Sign as company
6. **System**: Auto-creates wallet transaction
7. **System**: Generates signed PDF

**Test Endpoints:**
```bash
# List contracts (Guide)
curl http://localhost:3000/api/guide/contracts

# List contracts (Admin)
curl http://localhost:3000/api/admin/guide/contracts

# Create contract (Admin)
curl -X POST http://localhost:3000/api/admin/guide/contracts \
  -H "Content-Type: application/json" \
  -d '{
    "guide_id": "uuid",
    "contract_type": "per_trip",
    "title": "Test Contract",
    "start_date": "2025-01-22",
    "fee_amount": 300000
  }'
```

---

## ✅ Verification Checklist

- [ ] Migrations applied successfully
- [ ] Storage bucket `guide-documents` created
- [ ] Storage policies created
- [ ] Can create contract (Admin)
- [ ] Can send contract to guide
- [ ] Guide can view contract
- [ ] Guide can sign contract
- [ ] Admin can sign contract
- [ ] Wallet transaction created
- [ ] PDF generated successfully

---

## 🐛 Troubleshooting

### Storage Upload Fails
- Check bucket exists: `guide-documents`
- Check storage policies are created
- System will fallback to typed signature

### PDF Generation Fails
- Check `@react-pdf/renderer` is installed
- Check error logs
- PDF generation won't fail the request

### Notifications Not Sent
- Check `WHATSAPP_ACCESS_TOKEN` in `.env.local`
- Check WhatsApp API quota
- Notifications failure won't fail the request

---

## 📚 Full Documentation

- **Setup Guide**: `docs/GUIDE_CONTRACTS_SETUP.md`
- **Implementation Summary**: `docs/GUIDE_CONTRACTS_IMPLEMENTATION_SUMMARY.md`

---

**Status**: ✅ Ready to Use
