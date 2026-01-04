'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';

type RadioGroupContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined);

type RadioGroupProps = {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

export function RadioGroup({ value, onValueChange, children, className }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </RadioGroupContext.Provider>
  );
}

type RadioGroupItemProps = {
  value: string;
  id?: string;
  className?: string;
};

export function RadioGroupItem({ value, id, className }: RadioGroupItemProps) {
  const context = React.useContext(RadioGroupContext);
  if (!context) throw new Error('RadioGroupItem must be used within RadioGroup');

  const isSelected = context.value === value;

  return (
    <button
      type="button"
      id={id}
      onClick={() => context.onValueChange(value)}
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all',
        isSelected
          ? 'border-emerald-600 bg-emerald-600'
          : 'border-slate-300 bg-white hover:border-slate-400',
        className,
      )}
      role="radio"
      aria-checked={isSelected}
    >
      {isSelected && (
        <div className="h-2 w-2 rounded-full bg-white" />
      )}
    </button>
  );
}
