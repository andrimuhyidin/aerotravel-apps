/**
 * StaggerContainer Component
 * Wrapper for staggered entrance animations on child elements
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { staggerItem, createStagger } from '@/lib/motion/variants';

export type StaggerContainerProps = HTMLMotionProps<'div'> & {
  staggerDelay?: number;
  initialDelay?: number;
  as?: 'div' | 'ul' | 'section' | 'article';
};

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  initialDelay = 0.2,
  as = 'div',
  ...props
}: StaggerContainerProps) {
  const prefersReducedMotion = useReducedMotion();
  const variants = createStagger(staggerDelay, initialDelay);

  // If reduced motion, render static container
  if (prefersReducedMotion) {
    const Component = as;
    return (
      <Component className={className}>
        {children}
      </Component>
    );
  }

  const MotionComponent = motion[as];

  return (
    <MotionComponent
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

// Stagger item that works with StaggerContainer
export type StaggerItemProps = HTMLMotionProps<'div'> & {
  as?: 'div' | 'li' | 'article';
};

export function StaggerItem({
  children,
  className,
  as = 'div',
  ...props
}: StaggerItemProps) {
  const prefersReducedMotion = useReducedMotion();

  // If reduced motion, render static element
  if (prefersReducedMotion) {
    const Component = as;
    return (
      <Component className={className}>
        {children}
      </Component>
    );
  }

  const MotionComponent = motion[as];

  return (
    <MotionComponent
      className={className}
      variants={staggerItem}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

// Grid-specific stagger container
export type StaggerGridProps = HTMLMotionProps<'div'> & {
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  staggerDelay?: number;
};

export function StaggerGrid({
  children,
  className,
  columns = 4,
  gap = 'md',
  staggerDelay = 0.1,
  ...props
}: StaggerGridProps) {
  const prefersReducedMotion = useReducedMotion();

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8',
  };

  const baseClasses = cn(
    'grid',
    columnClasses[columns],
    gapClasses[gap],
    className
  );

  // If reduced motion, render static grid
  if (prefersReducedMotion) {
    return (
      <div className={baseClasses}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={baseClasses}
      variants={createStagger(staggerDelay, 0.2)}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={staggerItem}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Auto-animate list container
export type AnimatedListProps = HTMLMotionProps<'ul'> & {
  staggerDelay?: number;
};

export function AnimatedList({
  children,
  className,
  staggerDelay = 0.05,
  ...props
}: AnimatedListProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <ul className={className}>
        {children}
      </ul>
    );
  }

  return (
    <motion.ul
      className={className}
      variants={createStagger(staggerDelay, 0.1)}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <motion.li
          key={index}
          variants={{
            hidden: { opacity: 0, x: -10 },
            visible: {
              opacity: 1,
              x: 0,
              transition: {
                type: 'spring',
                stiffness: 300,
                damping: 24,
              },
            },
          }}
        >
          {child}
        </motion.li>
      ))}
    </motion.ul>
  );
}

