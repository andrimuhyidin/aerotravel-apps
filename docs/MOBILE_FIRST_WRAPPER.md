# Mobile-First PWA Wrapper - Standard Pattern

## Overview

Pattern layout untuk membuat aplikasi terlihat seperti **mobile native app** bahkan saat dibuka di desktop (seperti Instagram Web, Astro App).

## The Pattern

### Visual Result:
- **Di Desktop (>768px):** App centered dengan max-width 448px, background abu-abu
- **Di Mobile (<768px):** App full-width, native feel
- **Semua Device:** Terlihat seperti mobile app, bukan website

### Structure:

```tsx
<div className="min-h-screen bg-gray-200">
  {/* Mobile-First Container - max-w-md = 448px */}
  <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
    {children}
  </div>
</div>
```

---

## Complete Implementation

### Layout File: `app/[locale]/(public)/layout.tsx`

```tsx
export default async function PublicLayout({ children, params }) {
  const { locale } = await params;
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Mobile-First Container */}
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
        {/* Header - Sticky */}
        <AppHeader locale={locale} user={user} />
        
        {/* Main Content */}
        <main className="min-h-screen pb-20">{children}</main>
        
        {/* Bottom Navigation - Fixed to container */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <div className="mx-auto w-full max-w-md">
            <BottomNavigation locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Key Elements Explained

### 1. Outer Container
```tsx
<div className="min-h-screen bg-gray-200">
```
**Purpose:**
- Full viewport height
- Gray background (frame effect on desktop)
- Creates "phone in browser" feel

### 2. Inner Container (The Wrapper)
```tsx
<div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
```
**Purpose:**
- `mx-auto` - Center horizontally
- `w-full` - Full width on mobile
- `max-w-md` - Max 448px on desktop (typical phone width)
- `bg-background` - White/dark background
- `shadow-xl` - Elevation effect (phone bezel)
- `relative` - For absolute positioning children

### 3. Fixed Bottom Nav with Container
```tsx
<div className="fixed bottom-0 left-0 right-0 z-50">
  <div className="mx-auto w-full max-w-md">
    <BottomNavigation />
  </div>
</div>
```
**Purpose:**
- Outer `fixed` - Fixed to viewport
- Inner `max-w-md` - Align with app container
- Stays within the "phone" bounds

---

## Comparison

### ❌ WRONG (Web Style):
```tsx
<div className="relative flex min-h-screen flex-col bg-background">
  <AppHeader />
  <main className="flex-1 pb-20">{children}</main>
  <BottomNavigation />
</div>
```
**Result:** Looks like website (full width, no frame)

### ✅ CORRECT (PWA Style):
```tsx
<div className="min-h-screen bg-gray-200">
  <div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
    <AppHeader />
    <main className="min-h-screen pb-20">{children}</main>
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto w-full max-w-md">
        <BottomNavigation />
      </div>
    </div>
  </div>
</div>
```
**Result:** Looks like mobile app (centered on desktop, framed)

---

## Visual Breakdown

### Desktop View (>768px):
```
┌─────────────────────────────────────┐
│   bg-gray-200 (Desktop Frame)       │
│  ┌───────────────────────────────┐  │
│  │  max-w-md (448px)             │  │
│  │  bg-white                     │  │
│  │  shadow-xl                    │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  AppHeader              │  │  │
│  │  ├─────────────────────────┤  │  │
│  │  │                         │  │  │
│  │  │  Content                │  │  │
│  │  │                         │  │  │
│  │  ├─────────────────────────┤  │  │
│  │  │  BottomNavigation       │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Mobile View (<768px):
```
┌─────────────────┐
│  AppHeader      │
├─────────────────┤
│                 │
│  Content        │
│  (full width)   │
│                 │
├─────────────────┤
│  BottomNav      │
└─────────────────┘
```

---

## Benefits

### User Experience:
- ✅ Familiar mobile app feel
- ✅ Consistent across devices
- ✅ No confusion between mobile/desktop
- ✅ Easy thumb navigation
- ✅ No wasted screen space

### Development:
- ✅ Mobile-first by design
- ✅ No separate mobile/desktop layouts
- ✅ Easy to maintain
- ✅ PWA-ready
- ✅ One codebase

### Business:
- ✅ Professional appearance
- ✅ Modern design (like Instagram, WhatsApp Web)
- ✅ Higher engagement
- ✅ Better conversion
- ✅ Cross-platform consistency

---

## Examples in the Wild

This pattern is used by:
1. **Instagram Web** - Centered feed, max-width container
2. **WhatsApp Web** - Chat interface in container
3. **Astro** - Mobile app wrapper on web
4. **Telegram Web** - Messenger in frame
5. **Discord** - Chat interface centered

---

## Responsive Behavior

### Mobile (<768px):
- Container is `w-full` (100% width)
- `max-w-md` doesn't apply (width < 448px)
- Looks like native app
- No gray background visible

### Tablet (768px-1024px):
- Container is `max-w-md` (448px)
- Centered with `mx-auto`
- Gray background visible on sides
- Looks like "phone on tablet"

### Desktop (>1024px):
- Same as tablet
- Centered mobile app view
- Professional, focused UX
- No distraction

---

## Common Mistakes

### ❌ Mistake 1: Remove max-w-md
```tsx
// Wrong - looks like website
<div className="relative mx-auto min-h-screen w-full bg-background">
```

### ✅ Fix 1: Keep max-w-md
```tsx
// Correct - looks like mobile app
<div className="relative mx-auto min-h-screen w-full max-w-md bg-background shadow-xl">
```

---

### ❌ Mistake 2: Bottom nav not aligned
```tsx
// Wrong - nav full width
<BottomNavigation />
```

### ✅ Fix 2: Align nav with container
```tsx
// Correct - nav aligned to app container
<div className="fixed bottom-0 left-0 right-0 z-50">
  <div className="mx-auto w-full max-w-md">
    <BottomNavigation />
  </div>
</div>
```

---

### ❌ Mistake 3: No background frame
```tsx
// Wrong - no frame effect
<div className="min-h-screen">
  <div className="max-w-md">...</div>
</div>
```

### ✅ Fix 3: Add background
```tsx
// Correct - frame effect on desktop
<div className="min-h-screen bg-gray-200">
  <div className="max-w-md bg-background shadow-xl">...</div>
</div>
```

---

## Z-Index Layers

```
100: Modals, Dialogs
50:  Bottom Navigation (fixed)
40:  Floating Action Button
30:  Sticky Elements
20:  Dropdown Menus
10:  Tooltips
1:   Overlays
0:   Base content
```

---

## Status

- ✅ **Implemented** in `app/[locale]/(public)/layout.tsx`
- ✅ **Implemented** in `app/[locale]/(auth)/layout.tsx`
- ✅ **Implemented** in `app/[locale]/(mobile)/layout.tsx`
- ✅ **Production Ready**
- ✅ **Tested on Desktop & Mobile**

---

## Questions?

- See `docs/DESIGN_SYSTEM.md` for design tokens
- See `docs/ROUTING_MAP.md` for route structure
- See `.cursorrules` for coding standards
