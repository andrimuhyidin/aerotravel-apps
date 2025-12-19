# Contract Design Discussion - Per Trip vs Once

**Tanggal**: 2025-01-21  
**Purpose**: Diskusi design kontrak kerja - per trip vs kontrak sekali

---

## 📋 Current Implementation

### Contract Types Available

Sistem saat ini mendukung **5 jenis kontrak**:

1. **`per_trip`** - Kontrak per trip (one-time untuk 1 trip)
2. **`monthly`** - Kontrak bulanan (gaji tetap per bulan)
3. **`project`** - Kontrak per project (multiple trips dalam 1 project)
4. **`seasonal`** - Kontrak musiman (3-6 bulan)
5. **`annual`** - Kontrak tahunan (1 tahun)

### Current Flow

```
Trip Assignment → Guide Assigned → Contract Created (per_trip) → Sign → Active → Payment
```

---

## 🤔 Question: Kenapa Per Trip, Bukan Sekali Saja?

### Current Approach: Per Trip

**Cara Kerja Saat Ini**:
- Setiap trip assignment → buat kontrak baru (`per_trip`)
- Guide harus sign kontrak untuk setiap trip
- Payment dilakukan per trip setelah kontrak aktif

**Pros**:
- ✅ Fleksibel - bisa nego fee berbeda per trip
- ✅ Legal clarity - kontrak spesifik per trip
- ✅ Easy tracking - 1 kontrak = 1 trip
- ✅ Compliance - memenuhi regulasi per trip

**Cons**:
- ❌ Repetitive - guide harus sign berkali-kali
- ❌ Overhead - banyak kontrak untuk guide yang aktif
- ❌ User experience - kurang efisien untuk guide
- ❌ Admin overhead - harus create kontrak setiap trip

---

## 💡 Alternative: Kontrak Sekali (Master Contract)

### Proposed Approach: Master Contract

**Cara Kerja**:
- 1 kontrak master untuk guide (monthly/annual)
- Guide sign sekali, berlaku untuk semua trip
- Trip assignments otomatis covered oleh kontrak master
- Payment tetap per trip, tapi kontrak tidak perlu dibuat ulang

**Pros**:
- ✅ User experience - sign sekali, berlaku untuk semua trip
- ✅ Less overhead - 1 kontrak untuk multiple trips
- ✅ Efficiency - admin tidak perlu create kontrak setiap trip
- ✅ Better UX - guide tidak perlu sign berkali-kali

**Cons**:
- ❌ Less flexible - fee harus sama untuk semua trip (atau perlu sistem fee matrix)
- ❌ Legal complexity - kontrak master perlu cover semua skenario
- ❌ Tracking - perlu link trips ke kontrak master

---

## 🎯 Recommended Approach: Hybrid Model

### Best of Both Worlds

**Sistem Hybrid**:
1. **Master Contract** (monthly/annual) untuk guide reguler
   - Guide sign sekali
   - Berlaku untuk semua trip dalam periode
   - Auto-cover trip assignments

2. **Per Trip Contract** untuk special cases
   - Trip dengan fee berbeda
   - One-off assignments
   - Special projects

### Implementation Strategy

#### Option 1: Master Contract dengan Auto-Coverage

```
1. Admin create master contract (monthly/annual)
2. Guide sign sekali
3. Trip assignments otomatis covered oleh master contract
4. Payment per trip tetap, tapi tidak perlu kontrak baru
```

**Database Changes Needed**:
- Add `is_master_contract` boolean flag
- Add `auto_cover_trips` boolean flag
- Link trips to master contract via `guide_contract_trips` (optional, bisa auto-link)

#### Option 2: Contract Templates

```
1. Admin create contract template untuk guide
2. Guide sign template sekali
3. System auto-generate per-trip contracts dari template
4. Guide tidak perlu sign lagi (auto-approved dari template)
```

**Database Changes Needed**:
- Add `contract_templates` table
- Add `template_id` to `guide_contracts`
- Auto-generate contracts from template

---

## 📊 Comparison Table

| Aspect | Per Trip (Current) | Master Contract | Hybrid |
|--------|-------------------|-----------------|--------|
| **User Experience** | ⭐⭐ (sign berkali-kali) | ⭐⭐⭐⭐⭐ (sign sekali) | ⭐⭐⭐⭐ (sign sekali untuk master) |
| **Flexibility** | ⭐⭐⭐⭐⭐ (fee berbeda per trip) | ⭐⭐ (fee sama) | ⭐⭐⭐⭐ (master + per trip) |
| **Admin Overhead** | ⭐⭐ (create setiap trip) | ⭐⭐⭐⭐⭐ (create sekali) | ⭐⭐⭐⭐ (create master + auto) |
| **Legal Clarity** | ⭐⭐⭐⭐⭐ (spesifik per trip) | ⭐⭐⭐ (general) | ⭐⭐⭐⭐ (master + specific) |
| **Tracking** | ⭐⭐⭐⭐⭐ (1:1 mapping) | ⭐⭐⭐ (need linking) | ⭐⭐⭐⭐ (master + trips) |
| **Compliance** | ⭐⭐⭐⭐⭐ (per trip) | ⭐⭐⭐ (general) | ⭐⭐⭐⭐ (hybrid) |

---

## 🎯 Recommendation

### Recommended: **Hybrid Model dengan Master Contract**

**Implementation**:

1. **Master Contract** (Default untuk guide reguler)
   - Type: `monthly` atau `annual`
   - Flag: `is_master_contract = true`
   - Flag: `auto_cover_trips = true`
   - Guide sign sekali
   - Auto-covers semua trip assignments dalam periode

2. **Per Trip Contract** (Untuk special cases)
   - Type: `per_trip`
   - Flag: `is_master_contract = false`
   - Untuk trip dengan fee berbeda atau special cases
   - Guide perlu sign (atau auto-approved jika ada master contract)

3. **Auto-Linking Logic**
   ```
   When trip assigned to guide:
   1. Check if guide has active master contract
   2. If yes → auto-link trip to master contract (no new contract needed)
   3. If no → create per_trip contract (or prompt admin)
   ```

---

## 🔧 Implementation Changes Needed

### Database Schema Changes

```sql
-- Add flags to guide_contracts
ALTER TABLE guide_contracts 
ADD COLUMN is_master_contract BOOLEAN DEFAULT false,
ADD COLUMN auto_cover_trips BOOLEAN DEFAULT false,
ADD COLUMN coverage_period_start DATE,
ADD COLUMN coverage_period_end DATE;
```

### Logic Changes

1. **Contract Creation**:
   - Admin bisa pilih: Master Contract atau Per Trip
   - Master Contract: auto-cover trips dalam periode

2. **Trip Assignment**:
   - Check master contract first
   - Auto-link jika ada master contract
   - Create per-trip contract jika tidak ada master

3. **Payment**:
   - Tetap per trip
   - Link payment ke master contract atau per-trip contract

---

## ❓ Questions untuk Diskusi

1. **Business Model**:
   - Apakah fee guide berbeda per trip atau sama?
   - Apakah ada guide yang hanya kerja sekali vs guide reguler?

2. **Legal Requirements**:
   - Apakah perlu kontrak spesifik per trip untuk compliance?
   - Atau master contract cukup untuk legal coverage?

3. **User Experience**:
   - Apakah guide akan complain jika harus sign berkali-kali?
   - Atau mereka OK dengan per-trip contracts?

4. **Operational**:
   - Berapa banyak trip per guide per bulan?
   - Apakah overhead create kontrak menjadi masalah?

5. **Flexibility**:
   - Apakah perlu fee berbeda per trip?
   - Atau fee standard per guide?

---

## 💭 My Recommendation

**Saya rekomendasikan Hybrid Model**:

1. **Default**: Master Contract (monthly/annual)
   - Guide sign sekali
   - Auto-cover semua trip dalam periode
   - Better UX, less overhead

2. **Exception**: Per Trip Contract
   - Untuk special cases (fee berbeda, one-off)
   - Tetap available jika diperlukan

3. **Auto-Linking**:
   - System otomatis link trips ke master contract
   - No manual intervention needed

**Benefits**:
- ✅ Best user experience (sign sekali)
- ✅ Less admin overhead
- ✅ Tetap flexible untuk special cases
- ✅ Better scalability

---

## 🎯 Next Steps

1. **Diskusi dengan stakeholders**:
   - Business team: fee structure, operational needs
   - Legal team: compliance requirements
   - Guide team: user experience feedback

2. **Decision**:
   - Pilih approach: Per Trip, Master, atau Hybrid

3. **Implementation**:
   - Update database schema
   - Update business logic
   - Update UI/UX

---

**Status**: ✅ **DECISION MADE** - See `CONTRACT_DESIGN_DECISION.md`  
**Last Updated**: 2025-01-21

---

## ✅ Final Decision

**Approach**: **Master Contract Annual** dengan Fee per Trip Assignment

- 1 master contract per guide (annual, di-renew tahunan)
- Fee ditentukan per trip di `trip_guides.fee_amount` (bukan di contract)
- Auto-linking trips ke master contract saat assignment
- Status: Freelancer - tidak perlu kontrak per trip

**See**: `docs/CONTRACT_DESIGN_DECISION.md` untuk implementasi detail.
