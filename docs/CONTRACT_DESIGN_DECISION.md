# Contract Design Decision - Master Contract Annual

**Tanggal**: 2025-01-21  
**Status**: ✅ **DECISION MADE**  
**Approach**: Master Contract Annual dengan Fee per Trip Assignment

---

## 🎯 Final Decision

### Master Contract Annual (Freelancer Model)

**Cara Kerja**:
1. **1 Master Contract per Guide** (annual, di-renew tahunan)
   - Guide sign sekali per tahun
   - Berlaku untuk semua trip dalam periode 1 tahun
   - Auto-cover semua trip assignments

2. **Fee di Trip Assignment** (bukan di contract)
   - Fee ditentukan per trip di `trip_guides.fee_amount`
   - Fleksibel - bisa berbeda per trip
   - Payment berdasarkan fee dari trip assignment

3. **Auto-Linking**
   - Saat trip assigned → auto-link ke master contract
   - Tidak perlu create kontrak baru setiap trip
   - Payment tetap per trip berdasarkan `trip_guides.fee_amount`

---

## 📋 Implementation Plan

### 1. Database Schema Changes

```sql
-- Add master contract support
ALTER TABLE guide_contracts 
ADD COLUMN is_master_contract BOOLEAN DEFAULT false,
ADD COLUMN auto_cover_trips BOOLEAN DEFAULT false,
ADD COLUMN renewal_date DATE, -- Next renewal date
ADD COLUMN previous_contract_id UUID REFERENCES guide_contracts(id); -- Link to previous contract for history

-- Remove fee_amount requirement (optional, karena fee di trip_guides)
-- Keep fee_amount for backward compatibility, but make it optional
ALTER TABLE guide_contracts 
ALTER COLUMN fee_amount DROP NOT NULL;

-- Add index for master contract lookup
CREATE INDEX IF NOT EXISTS idx_guide_contracts_master 
ON guide_contracts(guide_id, is_master_contract, status) 
WHERE is_master_contract = true AND status = 'active';
```

### 2. Contract Creation Logic

**Default untuk Guide Baru**:
- Type: `annual`
- `is_master_contract = true`
- `auto_cover_trips = true`
- `start_date` = today
- `end_date` = today + 1 year
- `renewal_date` = end_date
- `fee_amount` = NULL (optional, karena fee di trip_guides)

**Contract Template**:
```typescript
{
  contract_type: 'annual',
  is_master_contract: true,
  auto_cover_trips: true,
  start_date: new Date(),
  end_date: addYears(new Date(), 1),
  renewal_date: addYears(new Date(), 1),
  fee_amount: null, // Optional - fee di trip_guides
  fee_type: 'per_trip', // Indicates fee is per trip assignment
  payment_terms: 'Dibayar setelah trip selesai berdasarkan fee di trip assignment',
  terms_and_conditions: {
    employment_type: 'freelancer',
    fee_structure: 'per_trip_assignment',
    // ... other terms
  }
}
```

### 3. Trip Assignment Auto-Linking

**Logic saat Trip Assignment**:
```typescript
async function assignTripToGuide(tripId: string, guideId: string, feeAmount: number) {
  // 1. Check if guide has active master contract
  const { data: masterContract } = await supabase
    .from('guide_contracts')
    .select('*')
    .eq('guide_id', guideId)
    .eq('is_master_contract', true)
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString().split('T')[0])
    .single();

  // 2. Create trip assignment (fee di trip_guides)
  const { data: assignment } = await supabase
    .from('trip_guides')
    .insert({
      trip_id: tripId,
      guide_id: guideId,
      fee_amount: feeAmount, // Fee per trip
    })
    .select()
    .single();

  // 3. Auto-link trip to master contract (optional, untuk tracking)
  if (masterContract) {
    await supabase
      .from('guide_contract_trips')
      .insert({
        contract_id: masterContract.id,
        trip_id: tripId,
        fee_amount: feeAmount, // Fee dari trip assignment
        status: 'pending',
      });
  }

  return assignment;
}
```

### 4. Payment Logic

**Payment dari Trip Assignment**:
```typescript
async function processTripPayment(tripId: string, guideId: string) {
  // 1. Get trip assignment (fee di sini)
  const { data: assignment } = await supabase
    .from('trip_guides')
    .select('fee_amount, contract:guide_contract_trips(contract_id)')
    .eq('trip_id', tripId)
    .eq('guide_id', guideId)
    .single();

  if (!assignment) {
    throw new Error('Trip assignment not found');
  }

  // 2. Get master contract (untuk tracking)
  const { data: contract } = await supabase
    .from('guide_contracts')
    .select('id')
    .eq('guide_id', guideId)
    .eq('is_master_contract', true)
    .eq('status', 'active')
    .single();

  // 3. Create wallet transaction (fee dari trip_guides)
  const { data: transaction } = await supabase
    .from('guide_wallet_transactions')
    .insert({
      wallet_id: walletId,
      transaction_type: 'credit',
      amount: assignment.fee_amount, // Fee dari trip assignment
      description: `Payment for trip ${tripId}`,
      reference_type: 'trip',
      reference_id: tripId,
    })
    .select()
    .single();

  // 4. Link payment to contract (optional, untuk tracking)
  if (contract) {
    await supabase
      .from('guide_contract_payments')
      .insert({
        contract_id: contract.id,
        wallet_transaction_id: transaction.id,
        amount: assignment.fee_amount, // Fee dari trip assignment
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'wallet',
      });
  }

  return transaction;
}
```

### 5. Annual Renewal Process

**Renewal Logic**:
```typescript
async function renewMasterContract(contractId: string) {
  // 1. Get current contract
  const { data: currentContract } = await supabase
    .from('guide_contracts')
    .select('*')
    .eq('id', contractId)
    .single();

  if (!currentContract) {
    throw new Error('Contract not found');
  }

  // 2. Mark current contract as expired
  await supabase
    .from('guide_contracts')
    .update({
      status: 'expired',
      expires_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  // 3. Create new master contract
  const newStartDate = new Date(currentContract.end_date);
  const newEndDate = addYears(newStartDate, 1);

  const { data: newContract } = await supabase
    .from('guide_contracts')
    .insert({
      guide_id: currentContract.guide_id,
      branch_id: currentContract.branch_id,
      contract_type: 'annual',
      is_master_contract: true,
      auto_cover_trips: true,
      title: `Kontrak Kerja Tahunan ${newStartDate.getFullYear()}`,
      description: `Kontrak kerja tahunan untuk periode ${newStartDate.toISOString().split('T')[0]} - ${newEndDate.toISOString().split('T')[0]}`,
      start_date: newStartDate.toISOString().split('T')[0],
      end_date: newEndDate.toISOString().split('T')[0],
      renewal_date: newEndDate.toISOString().split('T')[0],
      fee_amount: null, // Optional - fee di trip_guides
      fee_type: 'per_trip',
      payment_terms: 'Dibayar setelah trip selesai berdasarkan fee di trip assignment',
      terms_and_conditions: currentContract.terms_and_conditions, // Copy from previous
      status: 'pending_signature',
      previous_contract_id: contractId, // Link to previous
      created_by: currentContract.created_by,
    })
    .select()
    .single();

  // 4. Send notification to guide
  await notifyGuideContractRenewal(guideId, newContract.id);

  return newContract;
}
```

**Auto-Renewal Cron Job**:
```typescript
// Run daily: Check contracts expiring in 30 days
async function checkExpiringContracts() {
  const thirtyDaysFromNow = addDays(new Date(), 30);

  const { data: expiringContracts } = await supabase
    .from('guide_contracts')
    .select('*')
    .eq('is_master_contract', true)
    .eq('status', 'active')
    .lte('renewal_date', thirtyDaysFromNow.toISOString().split('T')[0]);

  for (const contract of expiringContracts || []) {
    // Send reminder to admin/guide
    await notifyContractExpiring(contract.guide_id, contract.id);
  }
}
```

---

## 🔄 Workflow

### Contract Creation (First Time)
```
1. Admin create master contract (annual)
   └─> Type: annual
   └─> is_master_contract: true
   └─> auto_cover_trips: true
   └─> fee_amount: null (optional)

2. Guide sign contract
   └─> Status: pending_signature → pending_company → active

3. Contract active for 1 year
   └─> Auto-covers all trip assignments
```

### Trip Assignment
```
1. Admin assign trip to guide
   └─> Create trip_guides record
   └─> Set fee_amount per trip

2. System auto-link to master contract
   └─> Create guide_contract_trips record (optional, untuk tracking)
   └─> Fee dari trip_guides.fee_amount

3. No new contract needed
   └─> Covered by master contract
```

### Payment
```
1. Trip completed
   └─> Get fee_amount from trip_guides

2. Create wallet transaction
   └─> Amount: trip_guides.fee_amount

3. Link to master contract (optional)
   └─> Create guide_contract_payments record
```

### Annual Renewal
```
1. Contract expiring (30 days before)
   └─> Send reminder to admin/guide

2. Admin initiate renewal
   └─> Create new master contract
   └─> Link to previous contract

3. Guide sign new contract
   └─> Old contract: expired
   └─> New contract: active
```

---

## ✅ Benefits

1. **User Experience**:
   - ✅ Guide sign sekali per tahun (bukan setiap trip)
   - ✅ Less friction, better UX

2. **Flexibility**:
   - ✅ Fee bisa berbeda per trip (di trip_guides)
   - ✅ Tetap flexible untuk freelancer model

3. **Admin Efficiency**:
   - ✅ Tidak perlu create kontrak setiap trip
   - ✅ Auto-linking otomatis

4. **Scalability**:
   - ✅ Better untuk guide dengan banyak trip
   - ✅ Less database overhead

5. **Legal Compliance**:
   - ✅ Master contract untuk legal coverage
   - ✅ Fee per trip untuk flexibility

---

## 📝 Migration Steps

1. **Add master contract columns**:
   ```sql
   ALTER TABLE guide_contracts 
   ADD COLUMN is_master_contract BOOLEAN DEFAULT false,
   ADD COLUMN auto_cover_trips BOOLEAN DEFAULT false,
   ADD COLUMN renewal_date DATE,
   ADD COLUMN previous_contract_id UUID REFERENCES guide_contracts(id);
   ```

2. **Make fee_amount optional**:
   ```sql
   ALTER TABLE guide_contracts 
   ALTER COLUMN fee_amount DROP NOT NULL;
   ```

3. **Create index**:
   ```sql
   CREATE INDEX idx_guide_contracts_master 
   ON guide_contracts(guide_id, is_master_contract, status) 
   WHERE is_master_contract = true AND status = 'active';
   ```

4. **Update existing contracts** (optional):
   ```sql
   -- Mark existing annual contracts as master
   UPDATE guide_contracts 
   SET is_master_contract = true, 
       auto_cover_trips = true
   WHERE contract_type = 'annual' 
     AND status = 'active';
   ```

---

## 🎯 Next Steps

1. ✅ **Decision Made** - Master contract annual
2. ⏳ **Create Migration** - Add master contract support
3. ⏳ **Update Contract Creation** - Default ke annual master
4. ⏳ **Implement Auto-Linking** - Link trips ke master contract
5. ⏳ **Update Payment Logic** - Use fee dari trip_guides
6. ⏳ **Implement Renewal** - Annual renewal process

---

**Status**: ✅ **DECISION MADE - READY FOR IMPLEMENTATION**  
**Last Updated**: 2025-01-21
