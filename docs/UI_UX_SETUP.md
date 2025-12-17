# UI/UX Setup Guide

## Overview

This guide covers the complete UI/UX setup for MyAeroTravel ID, including design system, components, and best practices.

## Quick Start

### 1. Initialize Shadcn UI

```bash
npx shadcn@latest init
```

When prompted:
- TypeScript: **Yes**
- Style: **New York**
- Base color: **Blue**
- CSS variables: **Yes**

### 2. Install Base Components

```bash
# Essential components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add label

# Feedback components
npx shadcn@latest add toast
npx shadcn@latest add alert
npx shadcn@latest add dialog
npx shadcn@latest add progress

# Data display
npx shadcn@latest add table
npx shadcn@latest add badge
npx shadcn@latest add avatar

# Navigation
npx shadcn@latest add tabs
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sheet
```

### 3. Verify Setup

```bash
pnpm dev
```

Visit `http://localhost:3000` and check browser console for errors.

## Design System Structure

```
/
├── app/globals.css          # Global styles & CSS variables
├── tailwind.config.ts       # Tailwind configuration
├── lib/
│   ├── design/
│   │   └── tokens.ts        # Design tokens
│   └── utils/
│       ├── responsive.ts    # Responsive utilities
│       └── accessibility.ts # A11y helpers
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── layout/              # Layout components
│   └── examples/            # Example components
└── hooks/
    └── use-media-query.ts   # Responsive hooks
```

## Design Tokens

All design tokens are centralized in `lib/design/tokens.ts`:

```tsx
import { designTokens } from '@/lib/design/tokens';

// Access colors
const primaryColor = designTokens.colors.primary[500];

// Access spacing
const spacing = designTokens.spacing.md;
```

## Component Patterns

### Layout Components

```tsx
import { Container } from '@/components/layout/container';
import { Section } from '@/components/layout/section';

<Section spacing="lg">
  <Container size="xl">
    {/* Content */}
  </Container>
</Section>
```

### Responsive Design

```tsx
import { useIsMobile, useIsDesktop } from '@/hooks/use-media-query';

function MyComponent() {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();

  return (
    <div className={isMobile ? 'text-sm' : 'text-base'}>
      Responsive content
    </div>
  );
}
```

### Loading States

```tsx
import { LoadingSpinner, LoadingSkeleton } from '@/components/ui/loading';

<LoadingSpinner size="md" />
<LoadingSkeleton lines={3} />
```

## Best Practices

### 1. Use Design Tokens

Always use design tokens instead of hardcoded values:

```tsx
// ✅ Good
<div className="bg-primary text-primary-foreground p-4">

// ❌ Bad
<div className="bg-blue-500 text-white p-4">
```

### 2. Mobile-First Approach

```tsx
// ✅ Good - Mobile first
<div className="text-sm md:text-base lg:text-lg">

// ❌ Bad - Desktop first
<div className="text-lg md:text-base sm:text-sm">
```

### 3. Accessibility

```tsx
// ✅ Good
<button aria-label="Close dialog" onClick={onClose}>
  ×
</button>

// ❌ Bad
<div onClick={onClose}>×</div>
```

### 4. Component Composition

```tsx
// ✅ Good - Composable
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// ❌ Bad - Monolithic
<div className="card">
  <div className="card-header">...</div>
  <div className="card-content">...</div>
</div>
```

## Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| xs | 475px | Extra small |
| sm | 640px | Small devices |
| md | 768px | Tablets |
| lg | 1024px | Desktops |
| xl | 1280px | Large desktops |
| 2xl | 1400px | Extra large |

## Color Usage

### Primary Colors

- Use `primary` for main actions
- Use `secondary` for secondary actions
- Use `muted` for subtle backgrounds

### Semantic Colors

- `success` - Success messages
- `warning` - Warning messages
- `destructive` - Error/danger actions
- `info` - Informational content

## Typography Scale

Use the predefined typography scale:

```tsx
<h1 className="text-4xl font-bold">Heading 1</h1>
<h2 className="text-3xl font-semibold">Heading 2</h2>
<h3 className="text-2xl font-semibold">Heading 3</h3>
<p className="text-base">Body text</p>
<small className="text-sm text-muted-foreground">Small text</small>
```

## Spacing System

Use the 4px grid system:

```tsx
<div className="p-4">     {/* 16px */}
<div className="p-6">     {/* 24px */}
<div className="p-8">     {/* 32px */}
```

## Resources

- [Design System Docs](./DESIGN_SYSTEM.md)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Accessibility Guide](./ACCESSIBILITY.md)

