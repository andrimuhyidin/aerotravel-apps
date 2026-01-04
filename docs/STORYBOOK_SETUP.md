# Storybook Setup

## Overview

Storybook provides isolated component development and documentation. Perfect for complex UI components.

## Setup

### 1. Install Dependencies

Already included in `package.json`:
- `@storybook/nextjs`
- `@storybook/react`
- `@storybook/addon-essentials`
- `@storybook/addon-a11y` (Accessibility)

### 2. Run Storybook

```bash
pnpm storybook
```

Visit `http://localhost:6006`

## Creating Stories

Create `*.stories.tsx` files next to your components:

```tsx
// components/ui/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Click me',
  },
};
```

## Features

- ✅ Isolated component development
- ✅ Visual testing
- ✅ Component documentation
- ✅ Accessibility testing (A11y addon)
- ✅ Interaction testing

## Build for Production

```bash
pnpm build:storybook
```

Output will be in `storybook-static/` directory.

---

**Note:** Storybook is optional but recommended for complex UI components.

