/**
 * Enhanced Form Field Component
 * Provides real-time validation feedback and better accessibility
 * 
 * Usage:
 * ```tsx
 * <FormField
 *   control={form.control}
 *   name="email"
 *   render={({ field, fieldState }) => (
 *     <EnhancedFormItem
 *       field={field}
 *       fieldState={fieldState}
 *       label="Email"
 *       description="We'll never share your email"
 *     >
 *       <Input {...field} type="email" />
 *     </EnhancedFormItem>
 *   )}
 * />
 * ```
 */

'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import * as React from 'react';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from './form';

type EnhancedFormItemProps<TFieldValues extends FieldValues = FieldValues> = {
  field: {
    name: FieldPath<TFieldValues>;
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
  };
  fieldState: {
    error?: { message?: string };
    isDirty: boolean;
    isTouched: boolean;
  };
  label?: string;
  description?: string;
  showSuccess?: boolean;
  realTimeValidation?: boolean;
  children: React.ReactElement;
};

export function EnhancedFormItem<TFieldValues extends FieldValues = FieldValues>({
  field,
  fieldState,
  label,
  description,
  showSuccess = true,
  realTimeValidation = true,
  children,
}: EnhancedFormItemProps<TFieldValues>) {
  const hasError = !!fieldState.error;
  const isValid = !hasError && fieldState.isDirty && !!field.value;
  const showValidation = realTimeValidation || fieldState.isTouched;

  return (
    <FormItem>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <div className="relative">
          {React.cloneElement(children, {
            ...children.props,
            ...field,
            className: cn(
              children.props.className,
              hasError && showValidation && 'border-red-500 focus:ring-red-500',
              isValid && showSuccess && showValidation && 'border-green-500 focus:ring-green-500',
              'transition-colors'
            ),
            'aria-invalid': hasError,
            'aria-describedby': hasError
              ? `${String(field.name)}-error`
              : description
                ? `${String(field.name)}-description`
                : undefined,
          })}
          {isValid && showSuccess && showValidation && (
            <CheckCircle2 
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" 
              aria-hidden="true" 
            />
          )}
          {hasError && showValidation && (
            <AlertCircle 
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" 
              aria-hidden="true" 
            />
          )}
        </div>
      </FormControl>
      {description && !hasError && (
        <FormDescription id={`${String(field.name)}-description`}>
          {description}
        </FormDescription>
      )}
      {hasError && (
        <FormMessage 
          id={`${String(field.name)}-error`} 
          className="flex items-center gap-1"
        >
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          <span>{fieldState.error?.message}</span>
        </FormMessage>
      )}
    </FormItem>
  );
}

