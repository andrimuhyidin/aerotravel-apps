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

  // Future Minimalist 2026 Theme
  futureMinimalist: {
    // Enhanced spacing for breathable design
    spacing: {
      cardPadding: {
        mobile: '1.25rem', // 20px
        desktop: '2rem', // 32px
      },
      sectionGap: '2.5rem', // 40px
      componentGap: '1.5rem', // 24px
    },
    // Larger border radius for soft feel
    borderRadius: {
      card: '1rem', // 16px
      button: '0.75rem', // 12px
      modal: '1.5rem', // 24px
      badge: '9999px', // Full rounded
    },
    // Glassmorphism settings
    glass: {
      blur: {
        sm: '8px',
        md: '12px',
        lg: '16px',
      },
      background: {
        light: 'rgba(255, 255, 255, 0.7)',
        dark: 'rgba(30, 30, 30, 0.7)',
      },
      border: {
        light: 'rgba(255, 255, 255, 0.3)',
        dark: 'rgba(255, 255, 255, 0.1)',
      },
    },
    // Gradient definitions for accents
    gradients: {
      primary: 'linear-gradient(135deg, hsl(220 90% 60%) 0%, hsl(260 85% 65%) 100%)',
      success: 'linear-gradient(135deg, hsl(150 70% 50%) 0%, hsl(170 65% 45%) 100%)',
      warning: 'linear-gradient(135deg, hsl(35 95% 55%) 0%, hsl(25 90% 50%) 100%)',
      danger: 'linear-gradient(135deg, hsl(0 80% 60%) 0%, hsl(350 75% 55%) 100%)',
      info: 'linear-gradient(135deg, hsl(200 90% 55%) 0%, hsl(220 85% 60%) 100%)',
      subtle: 'linear-gradient(135deg, hsl(210 40% 98%) 0%, hsl(220 30% 96%) 50%, hsl(200 40% 97%) 100%)',
    },
    // Gradient shadows for buttons
    gradientShadows: {
      primary: '0 4px 14px 0 rgba(99, 102, 241, 0.39)',
      success: '0 4px 14px 0 rgba(16, 185, 129, 0.39)',
      warning: '0 4px 14px 0 rgba(245, 158, 11, 0.39)',
      danger: '0 4px 14px 0 rgba(239, 68, 68, 0.39)',
    },
    // Motion/Animation settings
    motion: {
      duration: {
        fast: 150,
        base: 300,
        slow: 500,
      },
      easing: {
        spring: { stiffness: 300, damping: 24 },
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      stagger: {
        children: 0.1,
        delay: 0.2,
      },
    },
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

/**
 * Future Minimalist Utilities
 * Helper functions for glassmorphism and gradient effects
 */
export const futureMinimalistUtils = {
  /**
   * Get glass effect CSS properties
   */
  getGlassStyles: (
    blur: 'sm' | 'md' | 'lg' = 'md',
    theme: 'light' | 'dark' = 'light'
  ): {
    backdropFilter: string;
    WebkitBackdropFilter: string;
    background: string;
    border: string;
  } => {
    const fm = designTokens.futureMinimalist;
    return {
      backdropFilter: `blur(${fm.glass.blur[blur]})`,
      WebkitBackdropFilter: `blur(${fm.glass.blur[blur]})`,
      background: fm.glass.background[theme],
      border: `1px solid ${fm.glass.border[theme]}`,
    };
  },

  /**
   * Get gradient by variant
   */
  getGradient: (
    variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'subtle'
  ): string => {
    return designTokens.futureMinimalist.gradients[variant];
  },

  /**
   * Get gradient shadow by variant
   */
  getGradientShadow: (
    variant: 'primary' | 'success' | 'warning' | 'danger'
  ): string => {
    return designTokens.futureMinimalist.gradientShadows[variant];
  },

  /**
   * Get motion config for Framer Motion
   */
  getMotionConfig: () => ({
    duration: designTokens.futureMinimalist.motion.duration,
    spring: designTokens.futureMinimalist.motion.easing.spring,
    stagger: designTokens.futureMinimalist.motion.stagger,
  }),
};

