/**
 * Quick Links Widget
 * Navigation shortcut cards with gradient icons
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Package,
  FileText,
  Megaphone,
  Building2,
  TrendingUp,
  BarChart3,
  Ship,
  ListTodo,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';

export type QuickLink = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  variant?: 'primary' | 'secondary';
};

export type QuickLinksWidgetProps = {
  links: QuickLink[];
  delay?: number;
  className?: string;
};

const iconMap: Record<string, LucideIcon> = {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Package,
  FileText,
  Megaphone,
  Building2,
  TrendingUp,
  BarChart3,
  Ship,
  ListTodo,
  Wallet,
};

const iconGradients = {
  primary: 'from-blue-400 to-indigo-500',
  secondary: 'from-gray-400 to-slate-500',
};

export function QuickLinksWidget({
  links,
  delay = 0,
  className,
}: QuickLinksWidgetProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {links.map((link, index) => {
        const Icon = iconMap[link.icon] || FileText;
        const gradient = iconGradients[link.variant || 'primary'];

        const card = (
          <Link key={link.id} href={link.href}>
            <GlassCard className="h-full cursor-pointer group">
              <GlassCardContent className="flex items-center gap-4">
                <div className={cn(
                  'rounded-xl p-3 bg-gradient-to-br transition-transform group-hover:scale-110',
                  gradient
                )}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">{link.title}</p>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
              </GlassCardContent>
            </GlassCard>
          </Link>
        );

        if (prefersReducedMotion) {
          return <React.Fragment key={link.id}>{card}</React.Fragment>;
        }

        return (
          <motion.div
            key={link.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: (delay + index * 100) / 1000,
              type: 'spring',
              stiffness: 300,
              damping: 24,
            }}
          >
            {card}
          </motion.div>
        );
      })}
    </div>
  );
}

// Pre-configured quick links for different roles
export const DEFAULT_QUICK_LINKS: QuickLink[] = [
  {
    id: 'create-booking',
    title: 'Buat Booking',
    description: 'Input booking baru',
    href: '/console/bookings/new',
    icon: 'Calendar',
    variant: 'primary',
  },
  {
    id: 'live-tracking',
    title: 'Live Tracking',
    description: 'Monitor trip aktif',
    href: '/console/operations/live-tracking',
    icon: 'MapPin',
    variant: 'primary',
  },
  {
    id: 'finance',
    title: 'Laporan Keuangan',
    description: 'Shadow P&L',
    href: '/console/finance/shadow-pnl',
    icon: 'DollarSign',
    variant: 'primary',
  },
  {
    id: 'guides',
    title: 'Manajemen Guide',
    description: 'Lihat semua guide',
    href: '/console/guide/contracts',
    icon: 'Users',
    variant: 'primary',
  },
];

