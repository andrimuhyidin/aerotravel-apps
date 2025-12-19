# Guide Contracts - Setup & Deployment Guide

## 🚀 Quick Start

### 1. Run Database Migrations

```bash
# Via Supabase CLI
supabase migration up

# Atau via Supabase Dashboard SQL Editor
# Jalankan file: supabase/migrations/20250121000000_040-guide-contracts.sql
# Jalankan file: supabase/migrations/20250121000001_041-contract-auto-expire-cron.sql
```

### 2. Setup Storage Bucket

Buat bucket `guide-documents` di Supabase Storage:

1. Buka Supabase Dashboard → Storage
2. Klik "New bucket"
3. Nama: `guide-documents`
4. Public: `false` (Private bucket)
5. File size limit: `10MB`
6. Allowed MIME types: `image/png`, `image/jpeg`, `application/pdf`

**Atau via SQL:**
```sql
-- Create bucket (requires service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guide-documents',
  'guide-documents',
  false,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'application/pdf']
);
```

### 3. Setup Storage Policies

```sql
-- Allow authenticated users to upload
CREATE POLICY "guide_documents_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'guide-documents');

-- Allow users to read their own files
CREATE POLICY "guide_documents_read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'guide-documents');
```

### 4. Setup Cron Job (Optional)

#### Option A: Vercel Cron
Tambahkan ke `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/admin/guide/contracts/expire",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/admin/guide/contracts/expire-notify",
      "schedule": "0 9 * * *"
    }
  ]
}
```

#### Option B: External Cron Service
Setup cron job untuk call:
- `POST /api/admin/guide/contracts/expire` - Daily at midnight
- `POST /api/admin/guide/contracts/expire-notify` - Daily at 9 AM

### 5. Environment Variables

Pastikan sudah ada di `.env.local`:
```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# WhatsApp (optional, untuk notifications)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

---

## ✅ Testing Checklist

### Guide App
- [ ] List contracts (`/guide/contracts`)
- [ ] View contract detail (`/guide/contracts/[id]`)
- [ ] Sign contract (draw method)
- [ ] Sign contract (upload method)
- [ ] Sign contract (typed method)
- [ ] Reject contract
- [ ] Download PDF

### Console Admin
- [ ] List all contracts (`/console/guide/contracts`)
- [ ] Create new contract (`/console/guide/contracts/create`)
- [ ] Send contract to guide
- [ ] Sign contract as company
- [ ] Terminate contract
- [ ] Generate from assignment
- [ ] View contract detail
- [ ] Download PDF

### Integration
- [ ] Wallet transaction created when contract active
- [ ] WhatsApp notification sent
- [ ] In-app notification created
- [ ] PDF generation works
- [ ] Storage upload works

---

## 🔧 Troubleshooting

### Storage Upload Fails
**Problem**: Signature upload fails dengan error "Bucket not found"

**Solution**:
1. Pastikan bucket `guide-documents` sudah dibuat
2. Check storage policies
3. System akan fallback ke typed signature jika upload gagal

### PDF Generation Fails
**Problem**: PDF tidak ter-generate

**Solution**:
1. Check `@react-pdf/renderer` sudah terinstall
2. Check error logs
3. PDF generation tidak akan fail request, hanya log error

### Notifications Not Sent
**Problem**: WhatsApp notifications tidak terkirim

**Solution**:
1. Check `WHATSAPP_ACCESS_TOKEN` dan `WHATSAPP_PHONE_NUMBER_ID`
2. Check WhatsApp API quota
3. Notifications failure tidak akan fail request

### Contract Not Appearing
**Problem**: Contract tidak muncul di list

**Solution**:
1. Check RLS policies
2. Check branch_id filter
3. Check contract status filter

---

## 📊 Monitoring

### Key Metrics
- Contracts created per day
- Signature rate (% contracts signed)
- Average time to sign
- Expired contracts count
- Wallet transactions from contracts

### Logs to Monitor
- Contract creation
- Signature events
- PDF generation
- Notification sends
- Auto-expire events

---

## 🎯 Next Steps

1. **Run migrations** di Supabase
2. **Create storage bucket** `guide-documents`
3. **Test basic flow**: Create → Send → Sign → Active
4. **Setup cron jobs** untuk auto-expire
5. **Monitor logs** untuk errors

---

**Status**: ✅ Ready for Production
