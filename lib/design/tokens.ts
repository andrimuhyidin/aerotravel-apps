/**
 * Design Tokens
 * Centralized design system tokens for consistency
 */

export const designTokens = {
  // Colors
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main brand color
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    aero: {
      blue: '#3b82f6',
      'blue-dark': '#2563eb',
      'blue-light': '#60a5fa',
      teal: '#14b8a6',
      'teal-dark': '#0d9488',
      'teal-light': '#2dd4bf',
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['Fira Code', 'Courier New', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Spacing (4px grid system)
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },

  // Breakpoints
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1400px',
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // Transitions
  transitions: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },

  // Animation Timing
  animation: {
    duration: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Elevation/Shadow Scale
  elevation: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
} as const;

export type DesignTokens = typeof designTokens;

/**
 * Spacing Utilities
 * Helper functions untuk consistent spacing
 */
export const spacingUtils = {
  /**
   * Get spacing value dari design tokens
   */
  get: (key: keyof typeof designTokens.spacing): string => {
    return designTokens.spacing[key];
  },

  /**
   * Convert spacing key ke Tailwind class
   */
  toTailwind: (key: keyof typeof designTokens.spacing): string => {
    const map: Record<keyof typeof designTokens.spacing, string> = {
      xs: 'p-1',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
      '2xl': 'p-12',
      '3xl': 'p-16',
      '4xl': 'p-24',
    };
    return map[key] || 'p-4';
  },
};

/**
 * Typography Utilities
 * Helper functions untuk consistent typography
 */
export const typographyUtils = {
  /**
   * Get font size dengan line height
   */
  getFontSize: (key: keyof typeof designTokens.typography.fontSize): {
    fontSize: string;
    lineHeight: string;
  } => {
    const [fontSize, { lineHeight }] = designTokens.typography.fontSize[key];
    return { fontSize, lineHeight };
  },

  /**
   * Get font weight
   */
  getFontWeight: (key: keyof typeof designTokens.typography.fontWeight): string => {
    return designTokens.typography.fontWeight[key];
  },
};

/**
 * Animation Utilities
 * Helper functions untuk consistent animations
 */
export const animationUtils = {
  /**
   * Get animation duration
   */
  getDuration: (key: keyof typeof designTokens.animation.duration): string => {
    return designTokens.animation.duration[key];
  },

  /**
   * Get animation easing
   */
  getEasing: (key: keyof typeof designTokens.animation.easing): string => {
    return designTokens.animation.easing[key];
  },

  /**
   * Create transition string
   */
  createTransition: (
    properties: string[],
    duration: keyof typeof designTokens.animation.duration = 'base',
    easing: keyof typeof designTokens.animation.easing = 'easeInOut'
  ): string => {
    const durationValue = designTokens.animation.duration[duration];
    const easingValue = designTokens.animation.easing[easing];
    return properties.map(prop => `${prop} ${durationValue} ${easingValue}`).join(', ');
  },
};

