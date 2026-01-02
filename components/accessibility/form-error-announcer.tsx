/**
 * Form Error Announcer Component
 * Announces form validation errors to screen readers
 * WCAG 2.1 AA Compliance - 4.1.3 Status Messages
 */

'use client';

import { useEffect, useRef } from 'react';

type FormErrorAnnouncerProps = {
  errors: string[];
  id?: string;
};

export function FormErrorAnnouncer({ errors, id = 'form-errors' }: FormErrorAnnouncerProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0 && regionRef.current) {
      // Clear previous messages to ensure announcement
      regionRef.current.textContent = '';
      
      // Force reflow
      void regionRef.current.offsetWidth;
      
      // Announce errors
      const message = errors.length === 1
        ? `Error: ${errors[0]}`
        : `${errors.length} errors found. ${errors.join('. ')}`;
        
      regionRef.current.textContent = message;
    }
  }, [errors]);

  if (errors.length === 0) {
    return null;
  }

  return (
    <>
      {/* Screen reader only announcement */}
      <div
        ref={regionRef}
        id={id}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
      
      {/* Visual error summary */}
      <div
        className="rounded-md bg-destructive/10 p-3 mb-4"
        role="region"
        aria-labelledby={`${id}-heading`}
      >
        <div className="flex items-start gap-2">
          <svg
            className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          <div className="flex-1">
            <h3 id={`${id}-heading`} className="text-sm font-medium text-destructive">
              {errors.length === 1 ? 'There is 1 error:' : `There are ${errors.length} errors:`}
            </h3>
            <ul className="mt-2 text-sm text-destructive/90 list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Hook untuk mengintegrasikan dengan React Hook Form
 */
export function useFormErrorAnnouncer() {
  const errorsRef = useRef<string[]>([]);

  const announceErrors = (errors: Record<string, { message?: string }>) => {
    const errorMessages = Object.values(errors)
      .map((error) => error.message)
      .filter((message): message is string => !!message);

    errorsRef.current = errorMessages;
    return errorMessages;
  };

  return { announceErrors, errors: errorsRef.current };
}

