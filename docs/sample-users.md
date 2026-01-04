# Sample Users

> ⚠️ **DEVELOPMENT/TESTING ONLY** - Jangan gunakan credentials ini di production!

## Password Default

Semua sample user menggunakan password yang sama:

```
Test@1234
Admin@123
```

## Daftar User

| Role | Email | Nama | Redirect Setelah Login |
|------|-------|------|------------------------|
| **Super Admin** | `superadmin@aerotravel.co.id` | Super Admin | `/id/console` |
| **Investor** | `investor@aerotravel.co.id` | Komisaris Demo | `/id/console` |
| **Finance Manager** | `finance@aerotravel.co.id` | Finance Manager | `/id/console` |
| **Marketing** | `marketing@aerotravel.co.id` | Marketing CS | `/id/console` |
| **Ops Admin** | `ops@aerotravel.co.id` | Ops Admin | `/id/console` |
| **Guide** | `guide@aerotravel.co.id` | Tour Guide Demo | `/id/guide/attendance` |
| **Partner/Mitra** | `partner@aerotravel.co.id` | Partner Demo | `/id/partner/dashboard` |
| **Customer** | `customer@gmail.com` | Customer Demo | `/id` (Home) |
| **Corporate** | `corporate@company.com` | Corporate HRD | `/id/corporate` |

## Akses per Role

### Super Admin (`super_admin`)
- ✅ Console Dashboard
- ✅ Aero Engine (Booking)
- ✅ Elang Engine (Operations)
- ✅ Finance Reports
- ✅ User Management
- ✅ Settings

### Investor (`investor`)
- ✅ View Dashboard
- ✅ View Reports
- ❌ Edit/Create (read-only)

### Finance Manager (`finance_manager`)
- ✅ Payment Processing
- ✅ Invoice Management
- ✅ Financial Reports
- ✅ Refund Management

### Marketing (`marketing`)
- ✅ Package Management
- ✅ Promo/Voucher
- ✅ Customer Service
- ✅ Booking Management

### Ops Admin (`ops_admin`)
- ✅ Trip Management
- ✅ Guide Assignment
- ✅ Inventory Management
- ✅ Vendor Management

### Guide (`guide`)
- ✅ Guide App (Mobile)
- ✅ GPS Attendance
- ✅ Digital Manifest
- ✅ SOS Button
- ✅ View assigned trips

### Partner/Mitra (`mitra`)
- ✅ Partner Portal
- ✅ NTA Package Booking
- ✅ Wallet/Deposit
- ✅ Whitelabel Invoice
- ✅ Commission Reports

### Customer (`customer`)
- ✅ Public Booking
- ✅ My Trips
- ✅ Profile Management
- ✅ Payment

### Corporate (`corporate`)
- ✅ Corporate Portal
- ✅ Employee Management
- ✅ Bulk Booking
- ✅ Invoice Management

## Cara Menggunakan

### 1. Seed Database (Development)

```bash
# Jalankan seed SQL ke database
npx supabase db reset --seed
# atau manual
psql $DATABASE_URL -f supabase/seed/sample-users.sql
```

### 2. Login

1. Buka `http://localhost:3000/id/login`
2. Masukkan email dari tabel di atas
3. Password: `Test@1234`

## Testing Phase 2

### Guide App Testing
1. Login dengan `guide@aerotravel.co.id`
2. Akses `/id/guide/attendance` - GPS Absensi
3. Akses `/id/guide/manifest` - Digital Manifest
4. Akses `/id/guide/sos` - Panic Button

### Partner Portal Testing
1. Login dengan `partner@aerotravel.co.id`
2. Akses `/id/partner/dashboard` - Dashboard & Wallet
3. Akses `/id/partner/bookings` - NTA Booking
4. Akses `/id/partner/wallet` - Top-up Deposit

### Inventory Testing
1. Login dengan `ops@aerotravel.co.id`
2. Akses `/id/console/operations/inventory`

## Multi-Role Test Users

> 🆕 **NEW** - Users dengan multiple roles untuk testing RoleSwitcher component

### Daftar Multi-Role Users

| Email | Roles | Primary Role | Redirect Setelah Login |
|-------|-------|--------------|------------------------|
| `customer-guide@test.com` | Customer, Guide | Customer | `/id` (Home) |
| `customer-mitra@test.com` | Customer, Mitra | Customer | `/id` (Home) |
| `customer-corporate@test.com` | Customer, Corporate | Customer | `/id` (Home) |
| `guide-mitra@test.com` | Guide, Mitra | Guide | `/id/guide` |
| `customer-guide-mitra@test.com` | Customer, Guide, Mitra | Customer | `/id` (Home) |
| `guide-corporate@test.com` | Guide, Corporate | Guide | `/id/guide` |
| `mitra-corporate@test.com` | Mitra, Corporate | Mitra | `/id/partner/dashboard` |
| `customer-guide-corporate@test.com` | Customer, Guide, Corporate | Customer | `/id` (Home) |

### Password
```
Test@1234
```

### Cara Menggunakan Multi-Role Users

1. **Login** dengan salah satu email di atas
2. **RoleSwitcher** akan muncul di header (karena user memiliki multiple roles)
3. **Klik RoleSwitcher** untuk melihat semua available roles
4. **Switch role** dan verifikasi redirect ke dashboard yang sesuai:
   - Switch ke **Guide** → `/id/guide`
   - Switch ke **Mitra** → `/id/partner/dashboard`
   - Switch ke **Corporate** → `/id/corporate/employees`
   - Switch ke **Customer** → `/id` (Home)

### Testing Scenarios

#### 1. Test RoleSwitcher Visibility
- ✅ Login sebagai user dengan multiple roles
- ✅ RoleSwitcher harus muncul di header
- ✅ Harus menampilkan current active role
- ✅ Dropdown harus menampilkan semua available roles

#### 2. Test Role Switching
- ✅ Klik RoleSwitcher dropdown
- ✅ Pilih role yang berbeda
- ✅ Harus redirect ke dashboard yang sesuai
- ✅ Harus menampilkan navigation/menu yang benar

#### 3. Test Routing
- ✅ Switch ke Guide → harus redirect ke `/id/guide`
- ✅ Switch ke Mitra → harus redirect ke `/id/partner/dashboard`
- ✅ Switch ke Corporate → harus redirect ke `/id/corporate/employees`
- ✅ Switch ke Customer → harus redirect ke `/id` (Home)

#### 4. Test Restrictions
- ✅ Internal roles (super_admin, investor, etc.) TIDAK boleh melihat RoleSwitcher
- ✅ Internal roles TIDAK boleh switch roles
- ✅ Users dengan hanya 1 role TIDAK boleh melihat RoleSwitcher

### Seed Multi-Role Users

```bash
# Jalankan seed untuk multi-role test users
pnpm seed:multi-role
# atau
node scripts/seed-multi-role-users.mjs
```

## Notes

- Partner user memiliki initial balance Rp 5.000.000 dan credit limit Rp 10.000.000
- Semua user terhubung ke Branch Lampung (LPG)
- UUID users sudah fixed untuk konsistensi testing
- **Multi-role users** dibuat khusus untuk testing RoleSwitcher component
- Multi-role users memiliki wallet untuk role mitra (jika applicable)
