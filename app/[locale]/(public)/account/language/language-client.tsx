'use client';

/**
 * Language Switcher Client Component
 */

import { ArrowLeft, Check, Globe } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

type LanguageClientProps = {
  currentLocale: string;
};

type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

const languages: LanguageOption[] = [
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
];

export function LanguageClient({ currentLocale }: LanguageClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === currentLocale) return;

    // Replace the locale in the current path
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    
    // Store preference in cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`; // 1 year
    
    toast.success(
      newLocale === 'id' ? 'Bahasa berhasil diubah' : 'Language changed successfully'
    );
    
    router.push(newPath);
    router.refresh();
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/${currentLocale}/account`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Pilih Bahasa</h1>
          <p className="text-sm text-muted-foreground">
            {currentLocale === 'id' ? 'Ubah bahasa aplikasi' : 'Change app language'}
          </p>
        </div>
      </div>

      {/* Language Options */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
        {languages.map((lang, index) => {
          const isSelected = lang.code === currentLocale;
          const isLast = index === languages.length - 1;

          return (
            <div key={lang.code}>
              <button
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors active:bg-muted/50"
              >
                {/* Flag */}
                <span className="text-3xl">{lang.flag}</span>

                {/* Language Info */}
                <div className="flex-1">
                  <p className="font-medium text-foreground">{lang.nativeName}</p>
                  <p className="text-xs text-muted-foreground">{lang.name}</p>
                </div>

                {/* Check Icon */}
                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}
              </button>
              {!isLast && <div className="mx-4 h-px bg-border/50" />}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="mt-6 rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/20">
        <div className="flex gap-3">
          <Globe className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {currentLocale === 'id' ? 'Catatan' : 'Note'}
            </p>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
              {currentLocale === 'id'
                ? 'Perubahan bahasa akan diterapkan ke seluruh aplikasi.'
                : 'Language change will be applied throughout the app.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

