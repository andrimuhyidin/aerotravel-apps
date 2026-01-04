/**
 * GradientButton Component
 * Primary action button with gradient background and animated effects
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GradientButtonVariant = 'primary' | 'success' | 'warning' | 'danger';
export type GradientButtonSize = 'sm' | 'md' | 'lg';

export type GradientButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: GradientButtonVariant;
  size?: GradientButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
};

const variantClasses: Record<GradientButtonVariant, string> = {
  primary: 'gradient-primary',
  success: 'gradient-success',
  warning: 'gradient-warning',
  danger: 'gradient-danger',
};

const sizeClasses: Record<GradientButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-base',
  lg: 'h-14 px-8 text-lg',
};

export function GradientButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  icon,
  iconPosition = 'left',
  ...props
}: GradientButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  const buttonContent = (
    <>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        icon && iconPosition === 'left' && (
          <span className="mr-2">{icon}</span>
        )
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </>
  );

  // If reduced motion or disabled, render static button
  if (prefersReducedMotion || isDisabled) {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'rounded-fm-button',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          variantClasses[variant],
          sizeClasses[size],
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'rounded-fm-button',
        'transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      whileHover={{
        scale: 1.02,
        y: -1,
      }}
      whileTap={{
        scale: 0.98,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      disabled={isDisabled}
      {...props}
    >
      {buttonContent}
    </motion.button>
  );
}

// Outline variant for secondary actions with gradient border
export function GradientOutlineButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  ...props
}: GradientButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const isDisabled = disabled || loading;

  const borderGradients: Record<GradientButtonVariant, string> = {
    primary: 'from-blue-500 to-indigo-600',
    success: 'from-emerald-500 to-teal-500',
    warning: 'from-amber-500 to-orange-500',
    danger: 'from-red-500 to-rose-500',
  };

  const textColors: Record<GradientButtonVariant, string> = {
    primary: 'text-blue-600 dark:text-blue-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  const content = (
    <span
      className={cn(
        'inline-flex items-center justify-center w-full h-full',
        'bg-background rounded-[calc(var(--fm-radius-button)-2px)]',
        sizeClasses[size],
        textColors[variant],
        'font-medium'
      )}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </span>
  );

  if (prefersReducedMotion || isDisabled) {
    return (
      <button
        className={cn(
          'p-[2px] rounded-fm-button',
          'bg-gradient-to-r',
          borderGradients[variant],
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {content}
      </button>
    );
  }

  return (
    <motion.button
      className={cn(
        'p-[2px] rounded-fm-button',
        'bg-gradient-to-r',
        borderGradients[variant],
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      disabled={isDisabled}
      {...props}
    >
      {content}
    </motion.button>
  );
}

