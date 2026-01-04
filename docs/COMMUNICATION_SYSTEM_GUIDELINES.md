# Communication System Guidelines

**Tanggal:** 2025-01-31  
**Status:** ✅ Implemented

---

## Overview

Sistem komunikasi di Guide Apps terdiri dari 3 komponen utama dengan tujuan yang berbeda namun terintegrasi untuk memberikan unified user experience.

## Arsitektur Sistem

### 1. Notification Logs (`notification_logs`)

**Tujuan:** Delivery tracking untuk external channels (audit trail)

**Karakteristik:**
- Log dari notifikasi yang dikirim via WhatsApp/Email/Push/SMS
- Status tracking: `pending` → `sent` → `delivered` → `read` → `failed`
- Audit trail untuk compliance dan debugging
- Tampil di: `/guide/notifications` sebagai history log

**Use Cases:**
- ✅ "Trip assignment notification sent via WhatsApp pada 10:00"
- ✅ "Contract signed notification delivered via email"
- ✅ Tracking delivery status untuk troubleshooting

**NOT untuk:**
- ❌ Content management
- ❌ User-facing messages
- ❌ Promotional content

**Database:**
- Table: `notification_logs`
- Fields: `user_id`, `channel`, `subject`, `body`, `status`, `sent_at`, `delivered_at`, `read_at`

---

### 2. Ops Broadcasts (`ops_broadcasts`)

**Tujuan:** Komunikasi operasional urgent dari Ops Team

**Karakteristik:**
- Simple text messages
- Urgent, time-sensitive
- Operational context
- Read status tracking via `broadcast_reads`
- Tampil di: `/guide/notifications` (unified view dengan filter)
- **Note:** `/guide/broadcasts` page redirect ke `/guide/notifications?filter=broadcast` untuk backward compatibility

**Types:**
- `weather_info` - Informasi cuaca (bad weather alerts, wind conditions)
- `dock_info` - Informasi dermaga (tide, availability)
- `sop_change` - Perubahan SOP/prosedur
- `general_announcement` - Pengumuman operasional umum

**Use Cases:**
- ✅ "Cuaca buruk di dermaga X, semua trip hari ini ditunda"
- ✅ "SOP keamanan baru berlaku mulai besok, harap baca di dashboard"
- ✅ "Dermaga A sedang maintenance, gunakan dermaga B"

**NOT untuk:**
- ❌ Marketing campaigns
- ❌ Promotional content
- ❌ Feature updates (use `guide_promos` instead)
- ❌ Company-wide announcements yang non-operational

**Database:**
- Table: `ops_broadcasts`
- Read tracking: `broadcast_reads`
- Fields: `broadcast_type`, `title`, `message`, `is_urgent`, `scheduled_at`, `expires_at`, `target_guides`

---

### 3. Guide Promos (`guide_promos`)

**Tujuan:** Konten marketing/promotional/feature updates

**Karakteristik:**
- Rich visual content (gradient, badge, link)
- Scheduled campaigns
- Promotional/marketing focus
- Read status tracking via `guide_promo_reads`
- Tampil di: Dashboard widget (preview 3 items), `/guide/promos` page (dedicated dengan full list)
- **Note:** Tidak muncul di notifications - promos adalah marketing content yang lebih cocok di dedicated page

**Types:**
- `promo` - Promo/promosi (bonus, discount, rewards)
- `update` - Feature updates, product updates
- `announcement` - Company announcements (non-operational)

**Use Cases:**
- ✅ "Bonus trip Desember 10% - setiap trip selesai dapat bonus tambahan"
- ✅ "Fitur baru: Offline Map sekarang tersedia"
- ✅ "Challenge bulanan: Selesaikan 15 trip dapat hadiah spesial"
- ✅ "Company event: Annual gathering tanggal X"

**NOT untuk:**
- ❌ Operational alerts (use `ops_broadcasts` instead)
- ❌ Urgent time-sensitive info (use `ops_broadcasts` instead)
- ❌ Weather/dock info (use `ops_broadcasts` instead)

**Database:**
- Table: `guide_promos`
- Read tracking: `guide_promo_reads`
- Fields: `type`, `title`, `subtitle`, `description`, `badge`, `gradient`, `link`, `priority`, `start_date`, `end_date`

---

## Decision Tree: Kapan Menggunakan Apa?

```
Apakah ini delivery log dari external channel?
├─ Ya → notification_logs
└─ Tidak → Apakah ini urgent operational info?
   ├─ Ya → ops_broadcasts
   └─ Tidak → Apakah ini marketing/promotional content?
      ├─ Ya → guide_promos
      └─ Tidak → Re-evaluate use case
```

### Quick Decision Guide

| Kriteria | notification_logs | ops_broadcasts | guide_promos |
|----------|-------------------|----------------|--------------|
| **Purpose** | Audit trail | Operational alerts | Marketing/updates |
| **Urgency** | N/A | High | Low-Medium |
| **Content** | Delivery status | Simple text | Rich content |
| **Target** | Specific user | All guides / specific guides | All guides / segments |
| **Time-sensitive** | N/A | Yes | Scheduled campaigns |
| **Visual** | No | No | Yes (gradient, badge) |
| **Read tracking** | Status field | Separate table | Separate table |

---

## Unified Notifications API

Semua 3 sistem terintegrasi di `/api/guide/notifications` untuk unified user experience.

**Endpoint:** `GET /api/guide/notifications?type=all|system|broadcast|promo`

**Response Structure:**
```typescript
{
  notifications: UnifiedNotification[],
  unreadCount: number,
  unreadCountByType: {
    system: number,
    broadcast: number,
    promo: number,
    total: number
  },
  pagination: PaginationMeta
}
```

**Type:**
- `all` - Semua notifikasi (system + broadcast + promo)
- `system` - Hanya notification logs
- `broadcast` - Hanya ops broadcasts
- `promo` - Hanya promos/updates

**Note:** 
- Broadcasts hanya tersedia via unified notifications API (`/api/guide/notifications?type=broadcast`)
- Dedicated broadcasts API (`/api/guide/broadcasts`) telah dihapus untuk menghindari redundansi
- Broadcasts page (`/guide/broadcasts`) redirect ke `/guide/notifications?filter=broadcast` untuk backward compatibility

---

## UI Components

### Notifications Page (`/guide/notifications`)

- **Unified view** - Semua notifikasi urgent/time-sensitive dalam satu tempat
- **Filter tabs** - Semua, Sistem, Pengumuman
- **Read status** - Visual indicator untuk unread items
- **Note:** Promos tidak muncul di sini - mereka memiliki dedicated page `/guide/promos` untuk rich content display

### Promos Page (`/guide/promos`)

- **Dedicated page** - Untuk browsing semua promos
- **Filter by type** - Promo, Update, Announcement
- **Detail page** - Full information dengan auto-mark as read

### Dashboard Widget

- **Promotional display** - 3 items dengan carousel
- **Quick access** - Link ke detail atau list page

---

## Read Status Tracking

### Implementation

1. **Ops Broadcasts:**
   - Table: `broadcast_reads`
   - API: `POST /api/guide/broadcasts/[id]/read`
   - Auto-mark: On view in notifications

2. **Guide Promos:**
   - Table: `guide_promo_reads`
   - API: `POST /api/guide/promos-updates/[id]/read`
   - Auto-mark: On view in detail page

3. **Notification Logs:**
   - Field: `read_at` dalam `notification_logs`
   - Update via notification service (external)

---

## Best Practices

### 1. Content Creation Guidelines

**Ops Broadcasts:**
- Keep messages concise (< 200 characters ideal)
- Use urgent flag sparingly (only for critical alerts)
- Include expiration date for time-sensitive info
- Target specific guides jika perlu, otherwise NULL untuk all guides

**Guide Promos:**
- Use compelling visuals (gradient, badge)
- Include clear call-to-action (link)
- Schedule campaigns properly (start_date, end_date)
- Use priority wisely (high untuk important announcements)

### 2. User Experience

- **Unified notifications** - User bisa akses semua dari satu tempat
- **Clear separation** - Filter tabs membantu user focus
- **Rich content** - Promos punya visual treatment untuk engagement
- **Read tracking** - User tahu apa yang sudah/s belum dibaca

### 3. Performance

- **Indexed queries** - Semua tables punya proper indexes
- **Pagination** - Limit results untuk better performance
- **Caching** - Use TanStack Query untuk client-side caching
- **RLS policies** - Proper security dengan branch filtering

---

## Migration Notes

### Database Migrations

1. `20250124000004_062-guide-promos-table.sql` - Initial promos table
2. `20250131000001_076-guide-promo-reads.sql` - Read status tracking

### API Changes

1. Added: `POST /api/guide/promos-updates/[id]/read`
2. Updated: `GET /api/guide/promos-updates` - Include read status
3. **Removed:** `GET /api/guide/broadcasts` - Redundant, broadcasts now only via `/api/guide/notifications?type=broadcast`
4. **Removed:** Promos from `/api/guide/notifications` - Promos have dedicated page `/guide/promos` for rich content display

### UI Changes

1. **Removed:** Promo filter tab from notifications (promos have dedicated page)
2. **Removed:** Promo display from notifications (promos have dedicated page)
3. Updated: Auto-mark as read in detail page
4. Promos now only accessible via:
   - Dashboard widget (preview 3 items with link to dedicated page)
   - Dedicated page `/guide/promos` (full list with filters)

---

## Related Documentation

- `GUIDE_APPS_COMPREHENSIVE_ANALYSIS.md` - Overall guide app architecture
- `GUIDE_APPS_DEEP_ANALYSIS.md` - Deep dive into features
- API documentation in codebase

---

## Summary

| System | Purpose | Use When | NOT Use When |
|--------|---------|----------|--------------|
| **notification_logs** | Delivery tracking | Tracking WhatsApp/Email/Push delivery | Content management |
| **ops_broadcasts** | Operational alerts | Urgent operational info, weather, dock, SOP | Marketing, promos |
| **guide_promos** | Marketing content | Promos, feature updates, campaigns | Operational alerts |

**Key Principle:** Separation of concerns di database level, unified experience di UI level.

