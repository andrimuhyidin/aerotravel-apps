/**
 * AnimatedNumber Component
 * Animated counter for KPI values with spring physics
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import {
  motion,
  useSpring,
  useTransform,
  useReducedMotion,
  useInView,
} from 'framer-motion';
import { cn } from '@/lib/utils';

export type AnimatedNumberFormat = 'number' | 'currency' | 'percent' | 'compact';

export type AnimatedNumberProps = {
  value: number;
  format?: AnimatedNumberFormat;
  duration?: number;
  delay?: number;
  locale?: string;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
};

function formatValue(
  value: number,
  format: AnimatedNumberFormat,
  locale: string,
  decimals: number
): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    case 'percent':
      return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value / 100);

    case 'compact':
      return new Intl.NumberFormat(locale, {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
      }).format(value);

    case 'number':
    default:
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
  }
}

export function AnimatedNumber({
  value,
  format = 'number',
  duration = 1000,
  delay = 0,
  locale = 'id-ID',
  className,
  prefix,
  suffix,
  decimals = 0,
}: AnimatedNumberProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const prefersReducedMotion = useReducedMotion();

  // Spring animation for smooth counting
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Transform spring value to formatted string
  const display = useTransform(spring, (current) =>
    formatValue(current, format, locale, decimals)
  );

  // Start animation when in view
  React.useEffect(() => {
    if (isInView) {
      const timeoutId = setTimeout(() => {
        spring.set(value);
      }, delay);
      return () => clearTimeout(timeoutId);
    }
  }, [isInView, value, spring, delay]);

  // If user prefers reduced motion, show static value
  if (prefersReducedMotion) {
    return (
      <span ref={ref} className={className}>
        {prefix}
        {formatValue(value, format, locale, decimals)}
        {suffix}
      </span>
    );
  }

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      <motion.span aria-live="polite" aria-atomic="true">{display}</motion.span>
      {suffix}
      {/* Screen reader announcement */}
      <span className="sr-only">
        {formatValue(value, format, locale, decimals)}
      </span>
    </span>
  );
}

// Simpler variant without spring physics - just counts up
export function CountUpNumber({
  value,
  format = 'number',
  duration = 2000,
  delay = 0,
  locale = 'id-ID',
  className,
  decimals = 0,
}: Omit<AnimatedNumberProps, 'prefix' | 'suffix'>) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (!isInView || prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const startTime = Date.now() + delay;
    const endTime = startTime + duration;

    const updateValue = () => {
      const now = Date.now();

      if (now < startTime) {
        requestAnimationFrame(updateValue);
        return;
      }

      if (now >= endTime) {
        setDisplayValue(value);
        return;
      }

      const progress = (now - startTime) / duration;
      // Ease out quad
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(Math.round(value * easedProgress));
      requestAnimationFrame(updateValue);
    };

    requestAnimationFrame(updateValue);
  }, [isInView, value, duration, delay, prefersReducedMotion]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {formatValue(displayValue, format, locale, decimals)}
    </span>
  );
}

// Trend indicator with animated number
export type AnimatedTrendProps = {
  value: number;
  trend: number;
  format?: AnimatedNumberFormat;
  className?: string;
};

export function AnimatedTrend({
  value,
  trend,
  format = 'number',
  className,
}: AnimatedTrendProps) {
  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <AnimatedNumber
        value={value}
        format={format}
        className="text-2xl font-bold"
      />
      {trend !== 0 && (
        <span
          className={cn(
            'text-sm font-medium flex items-center gap-0.5',
            isPositive && 'text-emerald-600 dark:text-emerald-400',
            isNegative && 'text-red-600 dark:text-red-400'
          )}
        >
          <span>{isPositive ? '↑' : '↓'}</span>
          <AnimatedNumber
            value={Math.abs(trend)}
            format="percent"
            delay={300}
          />
        </span>
      )}
    </div>
  );
}

