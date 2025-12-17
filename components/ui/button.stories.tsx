/**
 * Button Component Story
 * Example Storybook story for documentation
 * 
 * This is a placeholder - actual story will be generated after installing Shadcn Button
 */

import type { Meta, StoryObj } from '@storybook/react';

// This will be replaced with actual Button component after Shadcn setup
const Button = ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
  <button {...props}>{children}</button>
);

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Button text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    className: 'bg-primary text-primary-foreground',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

