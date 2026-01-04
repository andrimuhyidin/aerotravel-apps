# SVG Icons as React Components

## Overview

This project uses **SVGR** to import SVG files as React components, allowing flexible styling with Tailwind CSS.

## Setup

SVGR is configured in `next.config.js`. No additional setup needed.

## Usage

### 1. Add SVG File

Place SVG files in `public/icons/` or `components/icons/`:

```
public/icons/home.svg
```

### 2. Import as Component

```tsx
import IconHome from '@/public/icons/home.svg';

export function Navigation() {
  return (
    <nav>
      <IconHome className="w-5 h-5 text-primary" />
    </nav>
  );
}
```

### 3. Style with Tailwind

```tsx
<IconHome className="w-6 h-6 text-blue-500 hover:text-blue-700" />
```

## Benefits

- ✅ Flexible styling with Tailwind
- ✅ No separate image requests
- ✅ Inline SVG (better performance)
- ✅ Easy to customize colors

## Best Practices

1. **Optimize SVGs** - Remove unnecessary attributes before adding
2. **Naming** - Use PascalCase for component names
3. **Size** - Set width/height via className, not SVG attributes
4. **Accessibility** - Add `aria-label` if icon is standalone

## Example

```tsx
// public/icons/arrow-right.svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M5 12h14M12 5l7 7-7 7"/>
</svg>

// Usage
import IconArrowRight from '@/public/icons/arrow-right.svg';

<button aria-label="Next">
  <IconArrowRight className="w-4 h-4" />
</button>
```

---

**Note:** SVGR is configured in `next.config.js`. SVG files are automatically converted to React components.

