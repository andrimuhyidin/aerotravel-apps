/**
 * Focus Trap Component
 * Traps keyboard focus within a modal/dialog
 * WCAG 2.1 AA - 2.4.3 Focus Order
 */

'use client';

import { useEffect, useRef, ReactNode } from 'react';

type FocusTrapProps = {
  children: ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  initialFocus?: HTMLElement | null;
};

export function FocusTrap({ 
  children, 
  active = true, 
  restoreFocus = true,
  initialFocus,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    // Store the element that had focus before trap activated
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus initial element or first focusable element
    if (initialFocus) {
      initialFocus.focus();
    } else {
      const firstFocusable = getFocusableElements(containerRef.current)[0];
      firstFocusable?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(containerRef.current);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to previous element
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [active, initialFocus, restoreFocus]);

  return <div ref={containerRef}>{children}</div>;
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

