# Multi-Role Test Users Guide

## Overview

Script seed ini membuat user dengan multiple roles untuk testing menyeluruh sistem multi-role dan RoleSwitcher component.

## Test Users

Semua user menggunakan password: **Test@1234**

### 1. Customer + Guide (2 roles)
- **Email:** `customer-guide@test.com`
- **Roles:** Customer (primary), Guide
- **Use Case:** User yang bisa booking sebagai customer dan juga bekerja sebagai guide

### 2. Customer + Mitra (2 roles)
- **Email:** `customer-mitra@test.com`
- **Roles:** Customer (primary), Mitra
- **Use Case:** User yang bisa booking sebagai customer dan juga menjual paket sebagai mitra

### 3. Customer + Corporate (2 roles)
- **Email:** `customer-corporate@test.com`
- **Roles:** Customer (primary), Corporate
- **Use Case:** User yang bisa booking sebagai customer dan juga mengelola corporate travel

### 4. Guide + Mitra (2 roles)
- **Email:** `guide-mitra@test.com`
- **Roles:** Guide (primary), Mitra
- **Use Case:** Guide yang juga menjual paket sebagai mitra

### 5. Customer + Guide + Mitra (3 roles)
- **Email:** `customer-guide-mitra@test.com`
- **Roles:** Customer (primary), Guide, Mitra
- **Use Case:** User dengan 3 roles untuk testing kompleksitas

### 6. Guide + Corporate (2 roles)
- **Email:** `guide-corporate@test.com`
- **Roles:** Guide (primary), Corporate
- **Use Case:** Guide yang juga mengelola corporate travel

### 7. Mitra + Corporate (2 roles)
- **Email:** `mitra-corporate@test.com`
- **Roles:** Mitra (primary), Corporate
- **Use Case:** Mitra yang juga mengelola corporate travel

### 8. Customer + Guide + Corporate (3 roles)
- **Email:** `customer-guide-corporate@test.com`
- **Roles:** Customer (primary), Guide, Corporate
- **Use Case:** User dengan 3 roles untuk testing maksimal

## Running the Seed Script

### Option 1: Using npm script
```bash
pnpm seed:multi-role
```

### Option 2: Using Supabase CLI directly
```bash
supabase db execute --file supabase/seed/multi-role-test-users.sql
```

### Option 3: Using SQL Editor
1. Buka Supabase Dashboard
2. Go to SQL Editor
3. Copy paste isi file `supabase/seed/multi-role-test-users.sql`
4. Run the query

## Testing Scenarios

### 1. Test RoleSwitcher Visibility
- ✅ Login sebagai user dengan multiple roles
- ✅ RoleSwitcher harus muncul di header
- ✅ Harus menampilkan current active role
- ✅ Dropdown harus menampilkan semua available roles

### 2. Test Role Switching
- ✅ Klik RoleSwitcher dropdown
- ✅ Pilih role yang berbeda
- ✅ Harus redirect ke dashboard yang sesuai
- ✅ Harus menampilkan navigation/menu yang benar

### 3. Test Routing
- ✅ Switch ke Guide → harus redirect ke `/id/guide`
- ✅ Switch ke Mitra → harus redirect ke `/id/partner/dashboard`
- ✅ Switch ke Corporate → harus redirect ke `/id/corporate/employees`
- ✅ Switch ke Customer → harus redirect ke `/id` (home)

### 4. Test Internal Role Restrictions
- ✅ Internal roles (super_admin, investor, etc.) TIDAK boleh melihat RoleSwitcher
- ✅ Internal roles TIDAK boleh switch roles
- ✅ Non-internal users TIDAK boleh switch ke internal roles

### 5. Test Single Role Users
- ✅ Users dengan hanya 1 role TIDAK boleh melihat RoleSwitcher

### 6. Test Role Persistence
- ✅ Setelah switch role, refresh page
- ✅ Active role harus tetap sama (dari session metadata)
- ✅ RoleSwitcher harus menampilkan role yang aktif

## Database Structure

### user_roles Table
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  role user_role NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  is_primary BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  UNIQUE(user_id, role)
);
```

### Key Points
- `is_primary = true` untuk role utama (default saat login)
- `status = 'active'` untuk role yang aktif dan bisa digunakan
- `approved_at` harus di-set untuk role yang sudah approved

## Troubleshooting

### RoleSwitcher tidak muncul
1. Pastikan user memiliki lebih dari 1 role di `user_roles` table
2. Pastikan semua roles memiliki `status = 'active'`
3. Pastikan user bukan internal role
4. Cek browser console untuk debug logs: `[RoleSwitcher] Debug:`

### Role switching tidak bekerja
1. Pastikan API endpoint `/api/user/roles/switch` accessible
2. Cek network tab untuk error responses
3. Pastikan user memiliki role yang ingin di-switch
4. Pastikan user bukan internal role

### Redirect tidak sesuai
1. Cek `roleRedirectMap` di `hooks/use-roles.ts`
2. Pastikan redirect path sesuai dengan route yang ada
3. Cek `proxy.ts` untuk middleware redirect logic

## Notes

- Script ini hanya untuk development/testing environment
- Jangan run di production tanpa review
- Semua test users menggunakan password yang sama untuk kemudahan testing
- UUIDs sudah di-hardcode untuk konsistensi testing
