# UI Components

This directory contains Shadcn UI components. To add new components:

```bash
npx shadcn@latest add <component-name>
```

## Available Components

After running `npx shadcn@latest init`, you can add:

### Layout & Navigation
- `button` - Button component
- `card` - Card container
- `separator` - Visual separator
- `sheet` - Side sheet/drawer
- `tabs` - Tab navigation

### Forms
- `form` - Form wrapper with validation
- `input` - Text input
- `select` - Dropdown select
- `textarea` - Multi-line text input
- `checkbox` - Checkbox input
- `radio-group` - Radio button group
- `switch` - Toggle switch
- `slider` - Range slider
- `calendar` - Date picker calendar
- `popover` - Popover container

### Feedback
- `alert` - Alert message
- `alert-dialog` - Modal alert
- `toast` - Toast notification
- `dialog` - Modal dialog
- `progress` - Progress bar
- `skeleton` - Loading skeleton

### Data Display
- `table` - Data table
- `avatar` - User avatar
- `badge` - Status badge
- `tooltip` - Tooltip
- `scroll-area` - Scrollable container

### Overlays
- `dropdown-menu` - Dropdown menu
- `context-menu` - Context menu
- `command` - Command palette

## Usage

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function MyComponent() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

## Customization

All components can be customized by editing the component files directly. They are not installed as npm packages, so you have full control.

## Design System

See `docs/DESIGN_SYSTEM.md` for design tokens and guidelines.

