'use client';

import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

type AccordionContextValue = {
  openItems: Set<string>;
  toggleItem: (value: string) => void;
  defaultOpen?: boolean;
};

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

type AccordionProps = {
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  type?: 'single' | 'multiple';
};

export function Accordion({ children, className, defaultOpen = false, type = 'multiple' }: AccordionProps) {
  const defaultValues = React.useMemo(() => {
    if (!defaultOpen) return new Set<string>();
    const values: string[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const props = child.props as { value?: string };
        if (props?.value) {
          values.push(props.value);
        }
      }
    });
    return new Set(values);
  }, [children, defaultOpen]);

  const [openItems, setOpenItems] = React.useState<Set<string>>(defaultValues);

  const toggleItem = React.useCallback((value: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        if (type === 'single') {
          next.clear();
        }
        next.add(value);
      }
      return next;
    });
  }, [type]);

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, defaultOpen }}>
      <div className={cn('w-full space-y-2', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

type AccordionItemProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

export function AccordionItem({ value, children, className, defaultOpen }: AccordionItemProps) {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');

  const isOpen = context.openItems.has(value) || (defaultOpen && context.openItems.size === 0);

  return (
    <div className={cn('border border-slate-200 rounded-lg overflow-hidden', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = child.props as { value?: string; isOpen?: boolean };
          return React.cloneElement(child as React.ReactElement<{ value?: string; isOpen?: boolean }>, { 
            value: childProps.value || value, 
            isOpen: childProps.isOpen !== undefined ? childProps.isOpen : isOpen 
          });
        }
        return child;
      })}
    </div>
  );
}

type AccordionTriggerProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
};

export function AccordionTrigger({ value, children, className, isOpen }: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext);
  if (!context) throw new Error('AccordionTrigger must be used within Accordion');

  return (
    <button
      type="button"
      onClick={() => context.toggleItem(value)}
      className={cn(
        'flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-slate-900 transition-colors hover:bg-slate-50',
        className
      )}
      aria-expanded={isOpen}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn('h-5 w-5 text-slate-500 transition-transform duration-200', isOpen && 'rotate-180')}
        aria-hidden="true"
      />
    </button>
  );
}

type AccordionContentProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
};

export function AccordionContent({ value, children, className, isOpen }: AccordionContentProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-200',
        isOpen ? 'animate-in slide-in-from-top-1' : 'animate-out slide-out-to-top-1',
        className
      )}
    >
      <div className="px-4 pb-3">{children}</div>
    </div>
  );
}
