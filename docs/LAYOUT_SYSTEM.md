# Layout System - Standardized Components

## Overview

Sistem layout yang konsisten untuk seluruh aplikasi dengan **Native Mobile App Feel** (bukan web desktop).

## Design Philosophy

### Mobile-First PWA Wrapper (Instagram/Astro Style)
- ✅ **Centered on Desktop** - `max-w-md` container dengan shadow
- ✅ **Full Width on Mobile** - Native feel di device mobile
- ✅ **Background Frame** - `bg-gray-200` untuk desktop frame effect
- ✅ **Touch Optimized** - Minimum 44x44px touch targets
- ✅ **Native Animations** - active:scale-95, active feedback
- ✅ **Bottom Navigation** - Seperti Instagram, WhatsApp
- ✅ **Sticky Header** - Minimal, always visible

### Layout Structure (IMPORTANT!)
```tsx
<div className="min-h-screen bg-gray-200">
  {/* Mobile-First Container */}
  <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
    <AppHeader />
    <main className="min-h-screen pb-20">{children}</main>
    {/* Bottom Nav fixed to container */}
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto w-full max-w-md">
        <BottomNavigation />
      </div>
    </div>
  </div>
</div>
```

**Why This Pattern?**
- Desktop: Looks like mobile app (centered, max-width 448px)
- Mobile: Full width, native feel
- Progressive Web App (PWA) ready
- Consistent across all devices

## Core Components

### 1. AppHeader
**File:** `components/layout/app-header.tsx`

**Usage:**
```tsx
<AppHeader 
  locale="id"
  user={userData}
  variant="default" // or "transparent" or "minimal"
/>
```

**Features:**
- Sticky top navigation
- Logo with gradient
- Search button
- Notifications with animated badge
- User menu dropdown
- Height: 56px (h-14)
- Full width, no container

**Variants:**
- `default` - White background with blur
- `transparent` - Transparent, for hero sections
- `minimal` - No border, minimal style

---

### 2. BottomNavigation
**File:** `components/layout/bottom-navigation.tsx`

**Usage:**
```tsx
<BottomNavigation locale="id" />
```

**Features:**
- Fixed bottom position
- 5 navigation items (Home, Explore, Booking, Trip, Akun)
- Active state indicator (top bar + background)
- Animated icons on active
- iOS safe area support
- Height: 64px (h-16)

**Navigation Items:**
1. **Home** (/) - Dashboard/Homepage
2. **Explore** (/packages) - Browse packages
3. **Booking** (/book) - Quick booking
4. **Trip** (/my-trips) - My trips
5. **Akun** (/account) - Profile & settings

---

### 3. PageContainer
**File:** `components/layout/page-container.tsx`

**Usage:**
```tsx
<PageContainer maxWidth="lg" noPadding={false}>
  {children}
</PageContainer>
```

**Props:**
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `noPadding`: boolean (default: false)
- `variant`: 'default' | 'centered' | 'full'

**Note:** Use sparingly. For native feel, avoid containers.

---

### 4. AppShell
**File:** `components/layout/app-shell.tsx`

**Usage:**
```tsx
<AppShell 
  locale="id"
  user={userData}
  showHeader={true}
  showBottomNav={true}
>
  {children}
</AppShell>
```

**Structure:**
```
┌──────────────┐
│  AppHeader   │ ← Sticky h-14
├──────────────┤
│              │
│   Content    │ ← flex-1 pb-20
│              │
├──────────────┤
│ BottomNav    │ ← Fixed h-16
└──────────────┘
```

---

## Layout Patterns

### Pattern 1: Standard Page (Public)
**Location:** `app/[locale]/(public)/layout.tsx`

```tsx
export default async function PublicLayout({ children, params }) {
  const { locale } = await params;
  const user = await getCurrentUser();

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <AppHeader locale={locale} user={user} />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNavigation locale={locale} />
    </div>
  );
}
```

**Used by:**
- Homepage
- Packages
- Booking
- My Trips
- Account
- All public pages

---

### Pattern 2: Auth Pages (No Navigation)
**Location:** `app/[locale]/(auth)/layout.tsx`

```tsx
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {children}
    </div>
  );
}
```

**Used by:**
- Login
- Register
- Forgot Password
- Reset Password
- Legal Sign

---

### Pattern 3: Console (Dashboard) - Desktop Style
**Location:** `app/[locale]/(dashboard)/layout.tsx`

```tsx
// Desktop-first with sidebar
export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

**Used by:**
- Admin console
- Partner dashboard
- Corporate portal

---

## Spacing Standards

### Native Mobile Spacing:
```tsx
px-4   // Horizontal padding (16px) - Mobile standard
py-3   // Vertical padding (12px)
gap-4  // Grid/Flex gap (16px)
pt-2   // Top padding small (8px)
pb-20  // Bottom padding for nav space (80px)
```

### Touch Targets:
```tsx
h-14   // Large touch target (56px) - Header, buttons
h-12   // Medium touch target (48px) - Cards
h-10   // Small touch target (40px) - Icons
min-h-[44px] // Minimum iOS requirement
```

### Border Radius (Native Feel):
```tsx
rounded-2xl  // 16px - Cards, buttons
rounded-3xl  // 24px - Large cards
rounded-full // Pills, avatars
```

---

## Best Practices

### ✅ DO:
1. **Use full width** - No max-width containers
2. **Edge-to-edge** - Content touches screen edges
3. **Native animations** - `active:scale-95`, `active:bg-*`
4. **Touch feedback** - Visual feedback on tap
5. **Consistent spacing** - Use px-4, gap-4, etc.
6. **Bottom nav** - Primary navigation
7. **Sticky header** - Minimal, always visible

### ❌ DON'T:
1. **Don't use hover states** - Not available on mobile
2. **Don't center with max-width** - Looks like website
3. **Don't use sidebars** - Not mobile friendly
4. **Don't use dropdowns** - Use bottom sheets instead
5. **Don't use small touch targets** - Minimum 44px
6. **Don't use web patterns** - Think mobile app

---

## Color System

### Background:
```tsx
bg-background           // Base background
bg-slate-50            // Light sections
bg-gradient-to-b       // Subtle gradients
```

### Cards:
```tsx
bg-white               // Card background
shadow-xl              // Card elevation
ring-1 ring-slate-100  // Subtle border
```

### Gradients (Premium):
```tsx
// Headers
bg-gradient-to-br from-primary via-blue-600 to-cyan-600

// Services
bg-gradient-to-br from-blue-500 to-cyan-500

// Promo cards
bg-gradient-to-r from-orange-500 via-red-500 to-pink-500
```

---

## Component Examples

### Example 1: Simple Page
```tsx
// page.tsx
export default function MyPage({ params }) {
  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold">Page Title</h1>
      {/* Content */}
    </div>
  );
}
```

### Example 2: With Section
```tsx
import { Section } from '@/components/layout';

export default function MyPage({ params }) {
  return (
    <div className="px-4">
      <Section title="My Section">
        {/* Content */}
      </Section>
    </div>
  );
}
```

### Example 3: Hero Section
```tsx
export default function MyPage() {
  return (
    <>
      {/* Hero - Full width, edge-to-edge */}
      <section className="bg-gradient-to-br from-primary to-blue-600 px-4 py-12">
        <h1 className="text-2xl font-bold text-white">Hero Title</h1>
      </section>
      
      {/* Content */}
      <div className="px-4 py-6">
        {/* Regular content */}
      </div>
    </>
  );
}
```

---

## Animation Utilities

### Native Touch Feedback:
```tsx
// Scale down on tap
active:scale-95

// Background flash on tap
active:bg-muted

// Combined
className="active:scale-95 active:bg-muted transition-all"
```

### Hover (Desktop Only):
```tsx
// Use with caution, mobile has no hover
hover:bg-muted
hover:scale-105
group-hover:translate-x-1
```

---

## Responsive Breakpoints

### Mobile First (Default):
```tsx
// Base styles for mobile (< 768px)
px-4
text-sm
grid-cols-4
```

### Tablet (md: 768px):
```tsx
md:px-6
md:text-base
md:grid-cols-6
```

### Desktop (lg: 1024px):
```tsx
lg:px-8
lg:text-lg
lg:grid-cols-8
// Hide bottom nav on desktop
lg:hidden
```

---

## Testing Checklist

### Mobile Native Feel:
- [ ] Content full width (no max-width)
- [ ] Touch targets minimum 44x44px
- [ ] Active states on all interactive elements
- [ ] No hover-only interactions
- [ ] Bottom navigation works
- [ ] Sticky header minimal
- [ ] Smooth scroll
- [ ] Fast animations (<300ms)
- [ ] No jank or layout shift
- [ ] iOS safe area respected

### Visual Quality:
- [ ] Consistent spacing (px-4, gap-4)
- [ ] Consistent radius (rounded-2xl)
- [ ] Proper shadows (shadow-lg, shadow-xl)
- [ ] Gradient usage consistent
- [ ] Dark mode supported
- [ ] High contrast text
- [ ] Proper hierarchy

---

## Common Patterns

### Card Pattern:
```tsx
<div className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-100">
  {/* Card content */}
</div>
```

### Button Pattern:
```tsx
<Button 
  size="lg" 
  className="h-12 w-full gap-2 rounded-2xl shadow-lg active:scale-95"
>
  {/* Button content */}
</Button>
```

### Service Grid Pattern:
```tsx
<div className="grid grid-cols-4 gap-4">
  {services.map(service => (
    <Link 
      key={service.id}
      className="active:scale-95 flex flex-col items-center gap-2"
    >
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
        <Icon />
      </div>
      <span className="text-xs">{service.label}</span>
    </Link>
  ))}
</div>
```

---

## Migration Guide

### Old Layout (❌ Don't Use):
```tsx
// app/[locale]/(public)/layout.tsx - OLD
<div className="mx-auto max-w-md"> {/* ❌ Web container */}
  <Header />
  <main>{children}</main>
  <MobileNav />
</div>
```

### New Layout (✅ Use This):
```tsx
// app/[locale]/(public)/layout.tsx - NEW
<div className="relative flex min-h-screen flex-col bg-background">
  <AppHeader locale={locale} user={user} />
  <main className="flex-1 pb-20">{children}</main>
  <BottomNavigation locale={locale} />
</div>
```

---

## File Structure

```
components/layout/
├── app-header.tsx         ← New standard header
├── bottom-navigation.tsx  ← New standard bottom nav
├── page-container.tsx     ← Optional container
├── app-shell.tsx          ← Master wrapper
├── index.ts               ← Barrel export
├── header.tsx             ← Legacy (deprecated)
├── mobile-nav.tsx         ← Legacy (deprecated)
└── footer.tsx             ← Legacy (optional use)
```

---

## Status

- ✅ **Production Ready**
- ✅ **Type Safe**
- ✅ **Tested**
- ✅ **Documented**
- ✅ **Native Mobile Feel**
- ✅ **Consistent Across App**

## Questions?

See also:
- `docs/DESIGN_SYSTEM.md` - Complete design tokens
- `docs/ARCHITECTURE.md` - App architecture
- `.cursorrules` - Coding standards
