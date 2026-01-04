# Guide Apps - Setup Instructions

**Quick setup guide untuk improvements yang baru diimplementasikan**

---

## 🚀 Setup Checklist

### 1. Database Migrations

```bash
# Apply migrations
supabase migration up

# Or via Supabase Dashboard:
# 1. Go to Database > Migrations
# 2. Apply migrations:
#    - 20250124000001_054-sos-alerts-table.sql
#    - 20250124000002_055-auto-insurance-manifest.sql
```

**Migrations akan membuat:**
- `sos_alerts` table
- `insurance_companies` table
- `insurance_manifests` table
- Database functions untuk insurance manifest
- RLS policies

---

### 2. Environment Variables

Add ke `.env.local`:

```env
# WhatsApp (Required untuk SOS)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_SOS_GROUP_ID=your_whatsapp_group_id
WHATSAPP_OPS_PHONE=6281234567890

# Insurance (Optional, untuk future)
INSURANCE_DEFAULT_EMAIL=insurance@example.com
```

**Cara mendapatkan WhatsApp credentials:**
1. Setup WhatsApp Business API di Meta for Developers
2. Get Phone Number ID & Access Token
3. Untuk Group ID: Gunakan WhatsApp Business API untuk mendapatkan group ID

---

### 3. Setup Cron Job (Auto-Insurance Manifest)

**Via Supabase Dashboard:**
1. Go to **Database > Cron Jobs**
2. Click **New Cron Job**
3. Configure:
   - **Name:** `auto_insurance_manifest`
   - **Schedule:** `0 23 * * *` (every day at 23:00 UTC = 06:00 WIB)
   - **SQL:**
     ```sql
     SELECT generate_daily_insurance_manifests();
     ```
4. Click **Create**

**Via SQL:**
```sql
SELECT cron.schedule(
  'auto_insurance_manifest',
  '0 23 * * *',
  $$SELECT generate_daily_insurance_manifests();$$
);
```

---

### 4. Setup Insurance Companies (Optional)

Jika sudah ada insurance company:

```sql
INSERT INTO insurance_companies (
  branch_id,
  name,
  code,
  email,
  phone,
  is_active
) VALUES (
  'your-branch-id',
  'Jasa Raharja',
  'JASARAHARJA',
  'insurance@jasaraharja.com',
  '02112345678',
  true
);
```

---

## 🧪 Testing

### Test Live Tracking

1. Start trip dengan status `on_trip`
2. Verify GPS pings setiap 5-10 menit
3. Check `gps_pings` table di database
4. Check `guide_locations` table untuk current location

**Expected:**
- GPS ping recorded setiap 5 menit (normal)
- GPS ping recorded setiap 10 menit (battery low atau background)
- Location updated di `guide_locations`

---

### Test SOS WhatsApp

1. Trigger SOS dari Guide App
2. Verify:
   - SOS record created di `sos_alerts` table
   - WhatsApp message sent ke group
   - WhatsApp message sent ke Ops Admin
   - Nearby crew notified (if enabled)
   - Emergency contacts notified (if enabled)

**Expected:**
- WhatsApp messages received
- SOS record dengan status `active`
- All notification flags set to `true`

---

### Test Offline Sync

1. Go offline (airplane mode)
2. Make changes (check-in, update manifest, etc.)
3. Go online
4. Verify:
   - Changes synced to server
   - Mutation queue cleared
   - No conflicts (or conflicts resolved)

**Expected:**
- All mutations synced successfully
- Conflict resolution works (if conflicts occur)
- Sync status updated

---

### Test Insurance Manifest

1. Create confirmed trip untuk hari ini
2. Wait for cron job (or trigger manually)
3. Verify:
   - Manifest generated di `insurance_manifests` table
   - Status = `pending`
   - Manifest data contains passenger list

**Manual Trigger:**
```sql
SELECT generate_insurance_manifest('trip-id-here');
```

**Send Manifest:**
```bash
POST /api/admin/insurance/manifests/{manifestId}/send
```

---

## 📝 Usage Examples

### Live Tracking in Trip Component

```typescript
'use client';

import { useEffect } from 'react';
import { useBackgroundTracking } from '@/hooks/use-background-tracking';

export function TripDetailClient({ tripId, status }: { tripId: string; status: string }) {
  const { startTracking, stopTracking, isTracking } = useBackgroundTracking();

  useEffect(() => {
    if (status === 'on_trip') {
      startTracking(tripId);
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [status, tripId, startTracking, stopTracking]);

  return (
    <div>
      {isTracking && (
        <div className="text-sm text-green-600">
          📍 Live tracking aktif
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 Troubleshooting

### Live Tracking tidak bekerja

**Check:**
1. GPS permission granted?
2. Trip status = `on_trip`?
3. Browser support geolocation?
4. Check console untuk errors

**Solution:**
- Request GPS permission
- Verify trip status
- Check browser compatibility

---

### SOS WhatsApp tidak terkirim

**Check:**
1. Environment variables configured?
2. WhatsApp API credentials valid?
3. Group ID correct?
4. Check logs untuk errors

**Solution:**
- Verify environment variables
- Test WhatsApp API credentials
- Check Supabase logs

---

### Offline Sync conflicts

**Check:**
1. Multiple devices?
2. Server data changed?
3. Check conflict resolution logs

**Solution:**
- Conflict resolution menggunakan server wins strategy
- Local data akan di-update dengan server data
- Check logs untuk conflict details

---

### Insurance Manifest tidak generated

**Check:**
1. Cron job configured?
2. Trips dengan status `confirmed`?
3. Trips dengan departure_date = today?
4. Check function logs

**Solution:**
- Verify cron job schedule
- Check trip status & date
- Run function manually untuk testing

---

## 📚 Related Documentation

- `docs/GUIDE_APPS_IMPROVEMENTS_COMPLETE.md` - Implementation details
- `docs/GUIDE_APPS_DEEP_ANALYSIS_AND_GAP.md` - Full analysis
- `docs/GUIDE_APPS_GAP_ANALYSIS_SUMMARY.md` - Quick reference

---

**Last Updated:** 2025-01-24

