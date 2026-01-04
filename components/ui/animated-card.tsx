/**
 * AnimatedCard Component
 * Framer Motion-powered card with entrance animations
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { motion, type HTMLMotionProps, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type AnimatedCardProps = HTMLMotionProps<'div'> & {
  delay?: number;
  hoverEffect?: boolean;
  variant?: 'default' | 'glass' | 'elevated';
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: delay / 1000,
      duration: 0.3,
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  }),
};

const hoverVariants = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      duration: 0.2,
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
  },
};

export function AnimatedCard({
  children,
  className,
  delay = 0,
  hoverEffect = true,
  variant = 'default',
  ...props
}: AnimatedCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const variantClasses = {
    default: 'rounded-xl border bg-card text-card-foreground shadow-sm',
    glass: 'glass-card rounded-xl',
    elevated: 'glass-card-elevated rounded-xl',
  };

  // If user prefers reduced motion, render static card
  if (prefersReducedMotion) {
    return (
      <div className={cn(variantClasses[variant], className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(variantClasses[variant], className)}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      custom={delay}
      whileHover={hoverEffect ? 'hover' : undefined}
      whileTap={hoverEffect ? 'tap' : undefined}
      {...(hoverEffect && {
        variants: {
          ...cardVariants,
          ...hoverVariants,
        },
      })}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// AnimatedCardContent with proper padding
export function AnimatedCardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('p-5 md:p-8', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// AnimatedCardHeader
export function AnimatedCardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-5 md:p-8 pb-0', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// AnimatedCardTitle
export function AnimatedCardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-xl font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

// AnimatedCardDescription
export function AnimatedCardDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </p>
  );
}

