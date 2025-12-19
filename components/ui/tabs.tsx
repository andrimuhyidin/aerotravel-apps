'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

type TabsProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

type TabsListProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function TabsList({ children, className, style }: TabsListProps) {
  const baseClasses = 'h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500';
  // Check if className includes grid, if so use grid, otherwise inline-flex
  const hasGrid = className?.includes('grid') || className?.includes('inline-grid');
  const displayClass = hasGrid ? '' : 'inline-flex';
  
  return (
    <div 
      className={cn(displayClass, baseClasses, className)} 
      style={style}
    >
      {children}
    </div>
  );
}

type TabsTriggerProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.value === value;

  return (
    <button
      type="button"
      onClick={() => context.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
        className,
      )}
    >
      {children}
    </button>
  );
}

type TabsContentProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return <div className={cn('mt-2', className)}>{children}</div>;
}
