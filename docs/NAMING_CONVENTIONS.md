# Naming Conventions

**Strictly enforced across the entire codebase**

---

## Language Standard

### Strictly English
- ✅ **Code:** All code, comments, variable names, function names MUST be in English
- ✅ **File Names:** All file and folder names MUST be in English
- ✅ **Commit Messages:** All commit messages MUST be in English
- ✅ **Technical Documentation:** All technical docs MUST be in English
- ⚠️ **Exception:** UI labels visible to users can be in Indonesian (stored separately or hardcoded in JSX)

**Why:**
- Scalability: International developers can understand immediately
- Consistency: Libraries (Next.js, React, Supabase) use English
- Professional: Industry standard for enterprise codebases

---

## Naming Conventions Table

| Entity | Format | Example ✅ | Example ❌ |
|--------|--------|------------|------------|
| **Folder/File** | `kebab-case` | `booking-form.tsx`, `user-profile/` | `BookingForm.tsx`, `UserProfile/` |
| **Component** | `PascalCase` | `BookingCard`, `PrimaryButton` | `bookingCard`, `btn-primary` |
| **Variable/Function** | `camelCase` | `getUserData`, `isLoggedIn` | `GetUserData`, `is_logged_in` |
| **Database Table** | `snake_case` (plural) | `bookings`, `user_profiles` | `BookingDetails`, `bookingDetails`, `user` |
| **Database Column** | `snake_case` | `created_at`, `user_id` | `createdAt`, `userId` |
| **Constants** | `UPPER_SNAKE_CASE` | `MAX_UPLOAD_SIZE`, `API_URL` | `maxUploadSize`, `apiUrl` |
| **Types/Interfaces** | `PascalCase` | `Booking`, `UserProfile` | `booking`, `IUser` (no I prefix) |
| **Zod Schema** | `camelCase` + `Schema` | `loginSchema`, `bookingFormSchema` | `login`, `BookingForm` |

---

## File & Folder Naming

### Files
- **Components:** `booking-card.tsx` → Component name: `BookingCard`
- **Utilities:** `logger.ts`, `sanitize.ts`
- **Routes:** `booking-list/page.tsx`, `user-profile/page.tsx`
- **API Routes:** `api/bookings/route.ts`, `api/v1/sync/route.ts`

### Folders
- **Always kebab-case:** `user-profile/`, `booking-form/`, `api/v1/`
- **Never PascalCase:** ❌ `UserProfile/`, `BookingForm/`

---

## Component Naming

### File Structure
```
components/
├── booking-card.tsx          # File: kebab-case
│   └── export function BookingCard()  # Component: PascalCase
├── user-profile/
│   ├── user-profile.tsx      # File: kebab-case
│   └── index.ts              # Barrel export
```

### Example
```tsx
// File: components/booking-card.tsx
export type BookingCardProps = {
  bookingId: string;
  status: string;
};

export function BookingCard({ bookingId, status }: BookingCardProps) {
  return <div>...</div>;
}
```

---

## Database Naming

### Tables (Plural, snake_case)
- ✅ `users` (not `user`)
- ✅ `bookings` (not `booking`)
- ✅ `booking_details` (not `BookingDetails` or `bookingDetails`)
- ✅ `user_profiles` (not `UserProfile`)

**Why plural?** Tables contain multiple rows. `SELECT * FROM users` (select from many users) sounds more logical.

### Columns (snake_case)
- ✅ `user_id` (FK to users table)
- ✅ `created_at` (not `created` or `dateCreated`)
- ✅ `updated_at`
- ✅ `deleted_at` (for soft delete)
- ✅ `is_active` (boolean)

### Primary Keys
- **Always `id`:** Not `user_id` inside `users` table
- Example: `users.id`, `bookings.id`

### Foreign Keys
- **Format:** `[singular_table_name]_id`
- Example: In `bookings` table, FK to `users` is `user_id` (not `userId` or `user`)

### Date/Time Columns
- **Standard suffixes:**
  - `created_at` (not `created`, `date_created`)
  - `updated_at`
  - `deleted_at` (for soft delete)
  - `scheduled_at` (for scheduled events)

---

## Variable & Function Naming

### Variables (camelCase)
```tsx
// ✅ Correct
const userData = getUserData();
const isLoggedIn = checkAuth();
const bookingList = fetchBookings();

// ❌ Wrong
const UserData = getUserData();
const is_logged_in = checkAuth();
const booking_list = fetchBookings();
```

### Functions (camelCase)
```tsx
// ✅ Correct
function getUserData() { ... }
function calculateTotalPrice() { ... }
function isUserActive() { ... }

// ❌ Wrong
function GetUserData() { ... }
function calculate_total_price() { ... }
function IsUserActive() { ... }
```

### Constants (UPPER_SNAKE_CASE)
```tsx
// ✅ Correct
const MAX_UPLOAD_SIZE = 5242880;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 30000;

// ❌ Wrong
const maxUploadSize = 5242880;
const apiBaseUrl = 'https://api.example.com';
const defaultTimeout = 30000;
```

---

## Type & Interface Naming

### Types (PascalCase)
```tsx
// ✅ Correct
export type Booking = {
  id: string;
  userId: string;
  status: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
};

// ❌ Wrong
export type booking = { ... };
export type IUserProfile = { ... };  // No I prefix
```

### Interfaces (PascalCase, avoid if possible)
```tsx
// Prefer type over interface
export type ComponentProps = {
  // ...
};

// If interface needed
export interface ComponentProps {
  // ...
}
```

---

## Zod Schema Naming

### Schema (camelCase + Schema suffix)
```tsx
// ✅ Correct
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const bookingFormSchema = z.object({
  packageId: z.string(),
  date: z.date(),
  pax: z.number(),
});

// Type inference (PascalCase)
export type LoginPayload = z.infer<typeof loginSchema>;
export type BookingFormValues = z.infer<typeof bookingFormSchema>;

// ❌ Wrong
export const login = z.object({ ... });  // No suffix
export const BookingForm = z.object({ ... });  // PascalCase
```

**Why Schema suffix?** Avoids conflicts with type names.

---

## URL Path Structure

### RESTful & SEO Friendly
- **Use nouns (kebab-case):** `/bookings`, `/user-profile`
- **List Resource:** `/bookings` (displays list)
- **Detail Resource:** `/bookings/123` (detail for ID 123)
- **Create Form:** `/bookings/new` or `/bookings/create`

### API Routes
- **REST API:** Use standard REST verbs
  - `GET /api/v1/bookings` - List bookings
  - `GET /api/v1/bookings/123` - Get booking detail
  - `POST /api/v1/bookings` - Create booking
  - `PUT /api/v1/bookings/123` - Update booking
  - `DELETE /api/v1/bookings/123` - Delete booking

- **RPC/Function:** Use verbs for function calls
  - `POST /api/rpc/calculate-discount`
  - `POST /api/rpc/verify-payment`

---

## Git Commit Convention

### Format: `type(scope): description`

**MUST be in English**

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (deps, config, etc.)
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Revert previous commit

### Examples
```bash
# ✅ Correct
feat(auth): add google login support
fix(booking): resolve calculation error on weekend price
chore(deps): upgrade next.js to 14.2
docs(readme): update installation guide
refactor(ui): migrate button to shadcn
test(booking): add unit tests for price calculation

# ❌ Wrong
fix: bug fix
update: change something
feat: new feature
fix(booking): perbaiki error kalkulasi  # Not English!
```

---

## Code Structure & Exports

### Prefer Named Exports
```tsx
// ✅ Preferred (Named Export)
// File: components/ui/button.tsx
export function Button() { ... }

// Import
import { Button } from '@/components/ui/button';

// ❌ Less preferred (Default Export)
// File: components/ui/button.tsx
export default function Button() { ... }

// Import (risky for refactoring)
import Button from '@/components/ui/button';
```

**Why named exports?** Better for refactoring, safer renaming, clearer imports.

---

## Examples

### Complete Example
```tsx
// File: components/booking-card.tsx (kebab-case)

// Types (PascalCase)
export type BookingCardProps = {
  bookingId: string;
  status: string;
  createdAt: Date;
};

// Component (PascalCase, Named Export)
export function BookingCard({ bookingId, status, createdAt }: BookingCardProps) {
  // Variables (camelCase)
  const isConfirmed = status === 'CONFIRMED';
  const formattedDate = formatDate(createdAt);
  
  // Constants (UPPER_SNAKE_CASE)
  const MAX_DISPLAY_LENGTH = 50;
  
  return (
    <div>
      {/* UI labels can be Indonesian */}
      <h3>Detail Pemesanan</h3>
      <p>Status: {isConfirmed ? 'Terkonfirmasi' : 'Menunggu'}</p>
    </div>
  );
}
```

### Database Example
```sql
-- Table: bookings (plural, snake_case)
CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),  -- FK: singular_table_name_id
  package_id UUID REFERENCES packages(id),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL  -- Soft delete
);
```

---

## Checklist

When creating new code, verify:
- [ ] All code/comments in English
- [ ] File names in kebab-case
- [ ] Component names in PascalCase
- [ ] Variables/functions in camelCase
- [ ] Constants in UPPER_SNAKE_CASE
- [ ] Database tables plural + snake_case
- [ ] Database columns snake_case
- [ ] Types in PascalCase
- [ ] Zod schemas with Schema suffix
- [ ] Named exports preferred
- [ ] Commit messages in English with conventional format

---

**Last Updated:** $(date)  
**Enforced by:** `.cursorrules`, ESLint, Commitlint

