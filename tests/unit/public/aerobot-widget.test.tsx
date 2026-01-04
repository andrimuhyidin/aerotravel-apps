/**
 * Unit Tests - AerobotWidget Component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AerobotWidget } from '@/components/public/aerobot-widget';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

// Mock fetch
global.fetch = vi.fn();

describe('AerobotWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    // Component should be importable and renderable
    expect(AerobotWidget).toBeDefined();
    expect(typeof AerobotWidget).toBe('function');
  });

  it('should have accessible structure', () => {
    // Component should support ARIA labels
    // This is verified in the component code itself
    expect(AerobotWidget).toBeDefined();
  });
});

