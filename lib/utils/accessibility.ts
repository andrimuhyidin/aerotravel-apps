/**
 * Accessibility Utilities
 * Helper functions for accessibility best practices
 */

/**
 * Generate ARIA label for screen readers
 */
export function ariaLabel(text: string, context?: string): string {
  return context ? `${text} ${context}` : text;
}

/**
 * Generate unique ID for form elements
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if element should be focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return element.matches(focusableSelectors);
}

/**
 * Keyboard navigation helpers
 */
export const keyboard = {
  isEnter: (e: KeyboardEvent) => e.key === 'Enter',
  isEscape: (e: KeyboardEvent) => e.key === 'Escape',
  isTab: (e: KeyboardEvent) => e.key === 'Tab',
  isArrowUp: (e: KeyboardEvent) => e.key === 'ArrowUp',
  isArrowDown: (e: KeyboardEvent) => e.key === 'ArrowDown',
  isArrowLeft: (e: KeyboardEvent) => e.key === 'ArrowLeft',
  isArrowRight: (e: KeyboardEvent) => e.key === 'ArrowRight',
} as const;

/**
 * Focus trap for modals
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleTab(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }

  element.addEventListener('keydown', handleTab);
  firstElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTab);
  };
}

