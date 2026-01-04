# Design System Documentation

## Overview

MyAeroTravel ID uses a comprehensive design system built on:
- **Shadcn UI** - Component library
- **Tailwind CSS** - Utility-first CSS framework
- **Design Tokens** - Centralized design values

## Design Philosophy

1. **Consistency** - Unified visual language across all interfaces
2. **Accessibility** - WCAG 2.1 AA compliance
3. **Responsive** - Mobile-first approach
4. **Performance** - Optimized for fast loading
5. **Scalability** - Easy to extend and maintain

## Color System

### Primary Colors

```css
--primary: 221.2 83.2% 53.3%;        /* Aero Blue */
--primary-foreground: 210 40% 98%;   /* White text */
```

### Brand Colors

- **Aero Blue**: `#3b82f6` - Primary brand color
- **Aero Teal**: `#14b8a6` - Secondary accent

### Semantic Colors

- **Success**: `#10b981` - Success states
- **Warning**: `#f59e0b` - Warning states
- **Error**: `#ef4444` - Error states
- **Info**: `#3b82f6` - Informational states

### Usage

```tsx
// Using Tailwind classes
<div className="bg-primary text-primary-foreground">
  Primary content
</div>

// Using semantic colors
<div className="bg-success text-success-foreground">
  Success message
</div>
```

## Typography

### Font Families

- **Sans**: System UI stack (default)
- **Mono**: Fira Code (for code)

### Font Sizes

| Size | Class | Pixels | Line Height |
|------|-------|--------|-------------|
| xs | `text-xs` | 12px | 16px |
| sm | `text-sm` | 14px | 20px |
| base | `text-base` | 16px | 24px |
| lg | `text-lg` | 18px | 28px |
| xl | `text-xl` | 20px | 28px |
| 2xl | `text-2xl` | 24px | 32px |
| 3xl | `text-3xl` | 30px | 36px |
| 4xl | `text-4xl` | 36px | 40px |

### Font Weights

- `font-normal` (400)
- `font-medium` (500)
- `font-semibold` (600)
- `font-bold` (700)

### Usage

```tsx
<h1 className="text-4xl font-bold">Heading 1</h1>
<p className="text-base font-normal">Body text</p>
```

## Spacing System

Based on 4px grid system:

| Size | Class | Value |
|------|-------|-------|
| xs | `p-1` | 4px |
| sm | `p-2` | 8px |
| md | `p-4` | 16px |
| lg | `p-6` | 24px |
| xl | `p-8` | 32px |
| 2xl | `p-12` | 48px |
| 3xl | `p-16` | 64px |

## Border Radius

| Size | Class | Value |
|------|-------|-------|
| sm | `rounded-sm` | 2px |
| md | `rounded-md` | 6px |
| lg | `rounded-lg` | 8px |
| xl | `rounded-xl` | 12px |
| full | `rounded-full` | 9999px |

## Shadows

```tsx
<div className="shadow-sm">  {/* Small shadow */}
<div className="shadow-md"> {/* Medium shadow */}
<div className="shadow-lg"> {/* Large shadow */}
<div className="shadow-xl"> {/* Extra large shadow */}
```

## Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| xs | 475px | Extra small devices |
| sm | 640px | Small devices |
| md | 768px | Tablets |
| lg | 1024px | Desktops |
| xl | 1280px | Large desktops |
| 2xl | 1400px | Extra large desktops |

### Responsive Utilities

```tsx
// Mobile-first approach
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>

// Hide on mobile, show on desktop
<div className="hidden md:block">
  Desktop only
</div>
```

## Components

### Button

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
</Card>
```

### Form

```tsx
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';

<Form {...form}>
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Email</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
      </FormItem>
    )}
  />
</Form>
```

## Accessibility

### ARIA Labels

```tsx
import { ariaLabel } from '@/lib/utils/accessibility';

<button aria-label={ariaLabel('Close', 'dialog')}>
  ×
</button>
```

### Focus Management

```tsx
import { trapFocus } from '@/lib/utils/accessibility';

// In modal component
useEffect(() => {
  const cleanup = trapFocus(modalRef.current);
  return cleanup;
}, []);
```

### Keyboard Navigation

```tsx
import { keyboard } from '@/lib/utils/accessibility';

function handleKeyDown(e: KeyboardEvent) {
  if (keyboard.isEscape(e)) {
    onClose();
  }
}
```

## Best Practices

### 1. Use Design Tokens

```tsx
// ✅ Good
<div className="bg-primary text-primary-foreground">

// ❌ Bad
<div className="bg-blue-500 text-white">
```

### 2. Responsive Design

```tsx
// ✅ Good - Mobile first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ❌ Bad - Desktop first
<div className="grid grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
```

### 3. Semantic HTML

```tsx
// ✅ Good
<button type="button" onClick={handleClick}>
  Click me
</button>

// ❌ Bad
<div onClick={handleClick}>Click me</div>
```

### 4. Accessibility

```tsx
// ✅ Good
<button aria-label="Close dialog" onClick={onClose}>
  ×
</button>

// ❌ Bad
<button onClick={onClose}>×</button>
```

## Resources

- [Shadcn UI Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

