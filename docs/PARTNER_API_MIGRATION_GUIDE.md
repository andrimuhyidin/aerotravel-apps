# Partner API Migration Guide

Guide untuk apply security improvements (sanitization, role checks) ke semua Partner API routes.

## Pattern yang Sudah Diimplementasi

### 1. Import Helpers

```typescript
import { sanitizeRequestBody, sanitizeSearchParams, verifyPartnerAccess } from '@/lib/api/partner-helpers';
```

### 2. GET Routes Pattern

```typescript
export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ ADD: Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner or team member' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  // ✅ ADD: Sanitize search params
  const sanitizedParams = sanitizeSearchParams(searchParams);
  const status = sanitizedParams.status || null;
  const limit = Math.min(parseInt(sanitizedParams.limit || '50'), 100); // Max 100
  const offset = parseInt(sanitizedParams.offset || '0');

  // ✅ UPDATE: Use verified partnerId instead of user.id
  // Change: .eq('partner_id', user.id)
  // To: .eq('partner_id', partnerId)
  
  // Rest of implementation...
});
```

### 3. POST/PUT/PATCH Routes Pattern

```typescript
export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const client = supabase as unknown as any;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ ADD: Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner or team member' },
      { status: 403 }
    );
  }

  const body = await request.json();
  
  // ✅ ADD: Zod validation (if not exists)
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  // ✅ ADD: Sanitize validated data
  const sanitizedData = sanitizeRequestBody(validation.data, {
    strings: ['field1', 'field2'], // List all string fields
    emails: ['emailField'],        // List all email fields
    phones: ['phoneField'],        // List all phone fields
    urls: ['urlField'],            // List all URL fields
  });

  // ✅ UPDATE: Use sanitizedData and verified partnerId
  const { field1, field2 } = sanitizedData;
  
  // Change: .eq('partner_id', user.id)
  // To: .eq('partner_id', partnerId)
  
  // Rest of implementation...
});
```

## Routes yang Sudah Diupdate

- ✅ `/api/partner/bookings` (POST)
- ✅ `/api/partner/broadcasts` (GET, POST)
- ✅ `/api/partner/referrals` (GET)

## Routes yang Perlu Diupdate

Semua routes di `app/api/partner/` yang belum menggunakan pattern di atas.

## Checklist per Route

- [ ] Import helper functions
- [ ] Add `verifyPartnerAccess` check
- [ ] Sanitize search params (GET) or request body (POST/PUT/PATCH)
- [ ] Replace `user.id` dengan `partnerId` di queries
- [ ] Add Zod validation untuk POST/PUT/PATCH (if missing)
- [ ] Test route masih berfungsi

