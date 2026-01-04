/**
 * Language Switcher Component
 * Toggle between supported languages
 */

'use client';

import { Globe } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

const LANGUAGES: Language[] = [
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
];

export type LanguageSwitcherProps = {
  currentLocale: string;
  variant?: 'dropdown' | 'toggle' | 'flags';
  className?: string;
  showLabel?: boolean;
};

export function LanguageSwitcher({
  currentLocale,
  variant = 'dropdown',
  className,
  showLabel = true,
}: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = useCallback(
    (newLocale: string) => {
      // Replace the locale segment in the path
      const segments = pathname.split('/');
      if (segments.length > 1 && LANGUAGES.some((l) => l.code === segments[1])) {
        segments[1] = newLocale;
      }
      const newPath = segments.join('/') || '/';
      router.push(newPath);
    },
    [pathname, router]
  );

  const currentLanguage = LANGUAGES.find((l) => l.code === currentLocale) || LANGUAGES[0];

  // Toggle variant (just two languages)
  if (variant === 'toggle') {
    const otherLanguage = LANGUAGES.find((l) => l.code !== currentLocale) || LANGUAGES[1];

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => switchLanguage(otherLanguage.code)}
        className={cn('gap-2', className)}
        aria-label={`Switch to ${otherLanguage.name}`}
      >
        <Globe className="h-4 w-4" />
        {showLabel && <span>{otherLanguage.code.toUpperCase()}</span>}
      </Button>
    );
  }

  // Flags variant (show all as flags)
  if (variant === 'flags') {
    return (
      <div className={cn('flex gap-1', className)}>
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={cn(
              'text-xl p-1 rounded transition-transform hover:scale-110',
              lang.code === currentLocale && 'ring-2 ring-primary ring-offset-2'
            )}
            aria-label={`Switch to ${lang.name}`}
            title={lang.nativeName}
          >
            {lang.flag}
          </button>
        ))}
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('gap-2', className)}>
          <Globe className="h-4 w-4" />
          {showLabel && <span>{currentLanguage.nativeName}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => switchLanguage(lang.code)}
            className={cn(
              'flex items-center gap-2',
              lang.code === currentLocale && 'bg-muted'
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.nativeName}</span>
            {lang.code === currentLocale && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export languages for external use
export { LANGUAGES };

