/**
 * PageTransition Component
 * Smooth page-level entrance animations
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  pageTransition,
  pageTransitionScale,
  fadeIn,
  fadeInUp,
} from '@/lib/motion/variants';

export type PageTransitionVariant = 'fade' | 'slide' | 'scale' | 'slideUp';

export type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
  variant?: PageTransitionVariant;
  delay?: number;
};

const variantMap = {
  fade: fadeIn,
  slide: pageTransition,
  scale: pageTransitionScale,
  slideUp: fadeInUp,
};

export function PageTransition({
  children,
  className,
  variant = 'slide',
  delay = 0,
}: PageTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  // If reduced motion, render without animation
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const variants = variantMap[variant];

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      style={{ willChange: 'opacity, transform' }}
      transition={{
        delay: delay / 1000,
      }}
    >
      {children}
    </motion.div>
  );
}

// Wrapper for AnimatePresence with page transitions
export type AnimatedPageProps = {
  children: React.ReactNode;
  className?: string;
  pageKey?: string;
  variant?: PageTransitionVariant;
};

export function AnimatedPage({
  children,
  className,
  pageKey,
  variant = 'slide',
}: AnimatedPageProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        className={className}
        variants={variantMap[variant]}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Section transition for within-page animations
export type SectionTransitionProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  once?: boolean;
};

export function SectionTransition({
  children,
  className,
  delay = 0,
  once = true,
}: SectionTransitionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <section className={className}>{children}</section>;
  }

  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-50px' }}
      transition={{
        delay: delay / 1000,
        duration: 0.5,
        type: 'spring',
        stiffness: 100,
        damping: 20,
      }}
    >
      {children}
    </motion.section>
  );
}

// Header with slide-down animation
export function AnimatedHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <header className={className}>{children}</header>;
  }

  return (
    <motion.header
      className={className}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        type: 'spring',
        stiffness: 300,
        damping: 24,
      }}
    >
      {children}
    </motion.header>
  );
}

// Main content wrapper with fade-in
export function AnimatedMain({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <main className={className}>{children}</main>;
  }

  return (
    <motion.main
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.3,
        delay: 0.1,
      }}
    >
      {children}
    </motion.main>
  );
}

// Layout wrapper that handles presence
export function LayoutTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn('min-h-screen', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      layout
    >
      {children}
    </motion.div>
  );
}

